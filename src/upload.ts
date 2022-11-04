import * as core from "@actions/core";
import * as httpm from "@actions/http-client";
import {ActionInputs, PostResponse, UploadMetadata} from "./interfaces";
import * as fs from "fs";
import {Readable} from "stream";
import {context} from "@actions/github";
import {TypedResponse} from "@actions/http-client/lib/interfaces";

const getUploadMetadata = (): UploadMetadata => ({
  ref: context.ref,
  headRef: context.payload?.pull_request?.head?.ref ?? "",
  baseRef: context.payload?.pull_request?.base?.ref ?? "",
  owner: context.repo.owner,
  repository: context.repo.repo,
  event: context.eventName,
  commitHash: context.payload?.pull_request?.head?.sha ?? context.sha,
});

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
    const uploadMetadata = getUploadMetadata();
    core.info("Upload metadata:");
    core.info(JSON.stringify(uploadMetadata, null, 2));

    core.info("Preparing upload");
    let response: TypedResponse<PostResponse>;
    try {
      response = await http.postJson<PostResponse>(
        inputs.uploadUrl,
        uploadMetadata,
        {
          Authorization: inputs.token,
        }
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
      await http.request(
        "PUT",
        response.result.uploadUrl,
        Readable.from(multipartBody),
        {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          "Content-Length": multipartBody.length,
        }
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
