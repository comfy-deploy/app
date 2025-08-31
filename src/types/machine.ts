export interface Machine {
  id: string;
  user_id: string;
  name: string;
  org_id?: string | null;
  created_at: string;
  updated_at: string;
  type: string;
  machine_version?: string;
  deleted: boolean;
  import_failed_logs?: string | null;
  machine_version_id?: string | null;
  status: string;
  gpu: string;
  machine_builder_version?: string;
  comfyui_version?: string;
  is_workspace: boolean;
  endpoint?: string;

  // Auto scaling
  concurrency_limit: number;
  run_timeout: number;
  idle_timeout: number;
  docker_command_steps?: any;
  keep_warm: number;

  // Advanced settings
  allow_concurrent_inputs?: number;
  base_docker_image?: string;
  python_version?: string;
  extra_args?: string;
  prestart_command?: string;
  install_custom_node_with_gpu?: boolean;
  optimized_runner?: boolean;
  disable_metadata?: boolean;
  hide_community_uploads?: boolean;

  // Resource settings
  cpu_request?: number | null;
  cpu_limit?: number | null;
  memory_request?: number | null;
  memory_limit?: number | null;

  // New fields for GPU optimization
  models_to_cache?: string[];
  enable_gpu_memory_snapshot?: boolean;

  // Optional fields that might be included
  has_workflows?: boolean;
  ws_timeout?: number;
  extra_docker_commands?: string;
  machine_hash?: string;
  legacy_mode?: boolean;
  allow_background_volume_commits?: boolean;
  retrieve_static_assets?: boolean;
  models?: any;
  auth_token?: string;
}

export interface MachineVersion {
  id: string;
  machine_id: string;
  version: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  machine_hash?: string;
  modal_image_id?: string;
  // Include all the same fields as Machine for versioned properties
  comfyui_version?: string;
  docker_command_steps?: any;
  concurrency_limit: number;
  install_custom_node_with_gpu?: boolean;
  run_timeout: number;
  idle_timeout: number;
  extra_docker_commands?: string;
  base_docker_image?: string;
  python_version?: string;
  extra_args?: string;
  prestart_command?: string;
  keep_warm: number;
  disable_metadata?: boolean;
  hide_community_uploads?: boolean;
  allow_concurrent_inputs?: number;
  machine_builder_version?: string;
  cpu_request?: number | null;
  cpu_limit?: number | null;
  memory_request?: number | null;
  memory_limit?: number | null;
  models_to_cache?: string[];
  enable_gpu_memory_snapshot?: boolean;
}

// Type for the machine list view (minimal fields)
export interface MachineListItem {
  id: string;
  name: string;
  type: string;
  status: string;
  gpu: string;
  created_at: string;
  updated_at: string;
  machine_builder_version?: string | number;
  has_workflows?: boolean;
}
