export const GPU = [
  "CPU",
  "T4",
  "L4",
  "A10G",
  "A100",
  "A100-80GB",
  "H100",
] as const;

export const STATUS = [
  "not-started",
  "running",
  "uploading",
  "success",
  "failed",
  "started",
  "queued",
  "timeout",
  "cancelled",
] as const;

export const ORIGIN = [
  "manual",
  "api",
  "public-share",
] as const;

export const MACHINE_TYPE = [
  "classic",
  "runpod-serverless",
  "modal-serverless",
  "comfy-deploy-serverless",
  "workspace",
  "workspace-v2",
] as const;
