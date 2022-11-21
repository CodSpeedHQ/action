import * as core from "@actions/core";
import * as httpm from "@actions/http-client";
import {ActionInputs, PostResponse, UploadMetadata} from "./interfaces";
import * as fs from "fs";
import {Readable} from "stream";
import {context} from "@actions/github";
import {TypedResponse} from "@actions/http-client/lib/interfaces";
import crypto from "node:crypto";
import md5File from "md5-file";

const getUploadMetadata = async ({
  profilePath,
  inputs,
}: {
  profilePath: string;
  inputs: ActionInputs;
}): Promise<UploadMetadata> => {
  const hexMd5 = await md5File(profilePath);
  const b64Md5 = Buffer.from(hexMd5, "hex").toString("base64");
  return {
    tokenless: inputs.tokenless,
    ref: context.ref,
    headRef: context.payload?.pull_request?.head?.ref,
    baseRef: context.payload?.pull_request?.base?.ref,
    owner: context.repo.owner,
    repository: context.repo.repo,
    event: context.eventName,
    commitHash: context.payload?.pull_request?.head?.sha ?? context.sha,
    profileMd5: b64Md5,
    ghData: {
      runId: context.runId,
      job: context.job,
    },
  };
};

const http = new httpm.HttpClient("codspeed-action", [], {
  allowRetries: true,
  maxRetries: 3,
});

const upload = async (
  inputs: ActionInputs,
  profilePath: string
): Promise<void> => {
  core.group("Upload Results", async () => {
    const uploadMetadata = await getUploadMetadata({profilePath, inputs});
    core.debug("Upload metadata:");
    core.debug(JSON.stringify(uploadMetadata, null, 2));
    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify(uploadMetadata))
      .digest("hex");
    if (inputs.tokenless) {
      core.info(`CodSpeed Run Hash: "${hash}"`);
    }

    core.info("Preparing upload");
    let response: TypedResponse<PostResponse>;
    try {
      const headers = inputs.tokenless
        ? undefined
        : {
            Authorization: inputs.token,
          };
      response = await http.postJson<PostResponse>(
        inputs.uploadUrl,
        uploadMetadata,
        headers
      );
    } catch (e) {
      const err = e as httpm.HttpClientError;
      throw new Error(
        `Upload preparation failed (${err.statusCode}): ${err.message}`
      );
    }
    if (!response.result) {
      throw new Error("Upload preparation failed: no result");
    }
    core.info("Uploading profile data");
    const profile = fs.readFileSync(profilePath);
    core.debug(`Uploading ${profile.length} bytes...`);
    const uploadResponse = await http.request(
      "PUT",
      response.result.uploadUrl,
      Readable.from(profile),
      {
        "Content-Type": "application/octet-stream",
        "Content-Length": profile.length,
        "Content-MD5": uploadMetadata.profileMd5,
      }
    );
    if (uploadResponse.message.statusCode !== 200) {
      throw new Error(
        `Upload failed with status ${uploadResponse.message.statusCode}: ${uploadResponse.message.statusMessage}`
      );
    }

    core.info("Results uploaded.");
  });
};

export default upload;
