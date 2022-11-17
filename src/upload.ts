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

const createMultipartBody = (
  filePath: string
): {
  multipartBody: Buffer;
  boundary: string;
} => {
  const data = fs.readFileSync(filePath);
  // https://github.com/coolaj86/node-examples-js/blob/master/http-and-html5/http-upload.js
  const crlf = "\r\n";
  const boundary = "---------------------------10102754414578508781458777923"; // Boundary: "--" + up to 70 ASCII chars + "\r\n"
  const delimiter = `${crlf}--${boundary}`;
  const preamble = ""; // ignored. a good place for non-standard mime info
  const epilogue = ""; // ignored. a good place to place a checksum, etc
  const headers = [
    `Content-Disposition: form-data; name="profile"; filename="profile"${crlf}`,
    `Content-Type: application/octet-stream${crlf}`,
  ];
  //bodyPart = headers.join('') + crlf + data.toString(),
  //encapsulation = delimiter + crlf + bodyPart,
  const closeDelimiter = `${delimiter}--`;

  //multipartBody = preamble + encapsulation + closeDelimiter + epilogue + crlf /* node doesn't add this */;
  const multipartBody = Buffer.concat([
    Buffer.from(preamble + delimiter + crlf + headers.join("") + crlf),
    data,
    Buffer.from(closeDelimiter + epilogue),
  ]);
  return {multipartBody, boundary};
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
    core.info("Upload profile data");
    const {multipartBody, boundary} = createMultipartBody(profilePath);
    core.info(`Uploading ${multipartBody.length} bytes...`);
    try {
      const profile = fs.readFileSync(profilePath);
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
      core.debug(
        `Upload response: ${uploadResponse.message.statusCode} ${uploadResponse.message.statusMessage}`
      );
    } catch (e) {
      const err = e as httpm.HttpClientError;
      throw new Error(
        `Upload failed with status ${err.statusCode}: ${err.message}`
      );
    }

    core.info("Results uploaded.");
  });
};

export default upload;
