export type ModelSource = "huggingface" | "civitai" | "link" | "local";

export interface ModelSourceOption {
  id: ModelSource;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Adding model requests

export interface HuggingfaceModel {
  repoId: string;
}

export interface CivitaiModel {
  url: string;
}

export interface AddModelRequest {
  source: ModelSource;
  folderPath: string;
  filename: string;
  huggingface?: {
    repo: string;
    file?: string;
  };
  civitai?: {
    url: string;
  };
  link?: {
    url: string;
  };
  local?: {
    originalFilename: string;
  };
}

// Verify responses

export interface VerifyHFRepoResponse {
  exists: boolean;
}

export interface VerifyCivitAIResponse {
  exists: boolean;
  title?: string;
  preview_url?: string;
  filename?: string;
  model_id?: string; // For Civitai
  version_id?: string; // For Civitai
}

// Downloading model type
export interface DownloadingModel {
  id: string;
  model_name: string;
  download_progress: number;
  status: "started" | "completed" | "failed";
  error_log: string | null;
  folder_path: string;
  upload_type: "civitai" | "huggingface" | "link";
  civitai_url?: string;
  hf_url?: string;
  user_url?: string;
  created_at: string;
  updated_at: string;

  // Civitai specific fields
  civitai_id?: string;
  civitai_version_id?: string;
  civitai_download_url?: string;
  civitai_model_response?: {
    id?: number;
    name?: string;
    description?: string;
    images?: {
      url: string;
      width: number;
      height: number;
      type?: string;
    }[];
    modelVersions?: {
      id: number;
      name: string;
    }[];
  };
}
