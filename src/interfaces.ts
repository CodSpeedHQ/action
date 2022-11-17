export interface ActionInputs {
  token: string;
  uploadUrl: string;
  run: string;
  tokenless: boolean;
}

export interface UploadMetadata {
  tokenless: boolean;
  ref: string;
  headRef: string;
  baseRef: string;
  owner: string;
  repository: string;
  commitHash: string;
  event: string;
  profileMd5: string;
  ghData: {
    runId: number;
    job: string;
  };
}

export interface PostResponse {
  status: string;
  uploadUrl: string;
  runId: string;
}
