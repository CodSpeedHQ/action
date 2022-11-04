export interface ActionInputs {
  token: string;
  uploadUrl: string;
  run: string;
}

export interface UploadMetadata {
  ref: string;
  headRef: string;
  baseRef: string;
  owner: string;
  repository: string;
  commitHash: string;
  event: string;
}

export interface PostResponse {
  status: string;
  uploadUrl: string;
  runId: string;
}
