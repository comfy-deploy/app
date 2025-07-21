import { generateDependencyGraphJson } from "comfyui-json";

const BLACKLISTED_CUSTOM_NODES = [
  "https://github.com/bennykok/comfyui-deploy",
  // Add more blacklisted nodes here
  "https://github.com/audioscavenger/ComfyUI-Thumbnails",
  "https://github.com/mrhan1993/ComfyUI-Fooocus",
  "https://github.com/iacoposk8/ComfyUI-Fooocus-Inpaint-Wrapper",
];

export type CustomNodeInfo = {
  url: string;
  name: string;
  hash?: string; // Make hash optional
  warning?: string;
  files?: string[]; // Make files optional
  install_type?: string; // Make install_type optional
  node?: { inputs: Record<string, any>; class_type?: string }[]; // Add node property
  pip?: string[]; // Add pip property
  meta?: {
    message?: string;
    committer?: any;
    latest_hash?: string;
    stargazers_count?: number;
    commit_url?: string;
  };
};

export type ConflictingNodeInfo = {
  url: string;
  name: string;
  files: string[];
  install_type: string;
  pip?: string[];
  hash?: string | null;
  meta?: {
    message?: string;
    committer?: any;
    latest_hash?: string;
    stargazers_count?: number;
    commit_url?: string;
  };
};

export type WorkflowDependencies = {
  comfyui: string | undefined;
  custom_nodes: {
    [url: string]: CustomNodeInfo;
  };
  missing_nodes: string[];
  conflicting_nodes: {
    [nodeName: string]: ConflictingNodeInfo[];
  };
};

export async function analyzeWorkflowJson(
  workflowJson: string,
): Promise<WorkflowDependencies> {
  const response = await generateDependencyGraphJson({
    workflow_json: JSON.parse(workflowJson),
  });

  // Create lowercase version of blacklist for comparison
  const blacklistLower = BLACKLISTED_CUSTOM_NODES.map((url) =>
    url.toLowerCase(),
  );

  const filteredResponse = {
    ...response,
    custom_nodes: Object.fromEntries(
      Object.entries(response.custom_nodes).filter(([url]) => {
        return !blacklistLower.includes(url.toLowerCase());
      }),
    ),
    conflicting_nodes: Object.fromEntries(
      Object.entries(response.conflicting_nodes)
        .map(([nodeName, conflicts]) => [
          nodeName,
          conflicts.filter((conflict: ConflictingNodeInfo) => {
            return !blacklistLower.includes(conflict.url.toLowerCase());
          }),
        ])
        .filter(([_, conflicts]) => conflicts.length > 0),
    ),
  };

  return filteredResponse;
}
