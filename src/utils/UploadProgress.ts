export enum UploadState {
  UPLOADING = "Uploading",
  PROCESSING = "Processing",
  DONE = "Done",
  ERROR = "Error",
  IDLE = "Idle",
}

export type UploadProgress = {
  state: UploadState;
  progress: number;
};
