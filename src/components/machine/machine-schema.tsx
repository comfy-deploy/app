import type { FieldConfig } from "@/components/auto-form/types";
import { comfyui_hash } from "@/utils/comfydeploy-hash";
import { Link } from "@tanstack/react-router";
import { ExternalLinkIcon } from "lucide-react";
import { z } from "zod";
import { useGPUPricing } from "../pricing/GPUPriceSimulator";

export const customFormSchema = z.object({
  name: z.string().default("My Machine").describe("Name"),
  endpoint: z.string().default("http://127.0.0.1:8188").describe("Endpoint"),
  type: z
    .enum([
      "classic",
      "runpod-serverless",
      // "modal-serverless",
      // "comfy-deploy-serverless",
      // "workspace",
      // "workspace-v2",
    ])
    .default("classic")
    .describe("Type"),
  auth_token: z.string().default("").describe("Auth token").optional(),
});

export const machineGPUOptions = [
  "CPU",
  "T4",
  "L4",
  "A10G",
  "L40S",
  "A100",
  "A100-80GB",
  "H100",
] as const;

const machineBuilderVersionTypes = ["2", "3", "4"] as const;

// First, define a type for the step structure
const dockerCommandStep = z.discriminatedUnion("type", [
  z.object({
    id: z.string(),
    type: z.literal("custom-node"),
    data: z.object({
      url: z.string().url(),
      hash: z
        .string()
        .min(1, "Hash cannot be empty")
        .regex(
          /^[a-z0-9]+$/,
          "Hash can only contain lowercase letters and numbers",
        ),
      meta: z.any(),
      name: z.string(),
      files: z.array(z.string()),
      install_type: z.string(),
    }),
  }),
  z.object({
    id: z.string(),
    type: z.literal("commands"),
    data: z.string(),
  }),
]);

export const serverlessFormSchema = z.object({
  name: z.string().default("My Machine").describe("Name"),
  comfyui_version: z
    .string()
    .regex(/^[0-9a-f]{40}$/i, "Must be a valid 40-character git commit hash")
    .default(comfyui_hash)
    .describe("ComfyUI Version"),
  gpu: z.enum(machineGPUOptions).default("A10G"),
  docker_command_steps: z
    .object({
      steps: z.array(dockerCommandStep),
    })
    .refine((data): data is typeof data => {
      const urlCounts = new Map<string, number>();
      for (const step of data.steps) {
        if (step.type === "custom-node") {
          const url = step.data.url.toLowerCase();
          try {
            const urlObj = new URL(url);
            if (urlObj.hostname === "github.com") {
              const [, author, repo] = urlObj.pathname.split("/");
              const repoKey = `${author}/${repo}`;
              urlCounts.set(repoKey, (urlCounts.get(repoKey) || 0) + 1);
            } else {
              urlCounts.set(url, (urlCounts.get(url) || 0) + 1);
            }
          } catch {
            urlCounts.set(url, (urlCounts.get(url) || 0) + 1);
          }
        }
      }

      // Return false if there are duplicates
      return !Array.from(urlCounts.values()).some((count) => count > 1);
    }),
  concurrency_limit: z.number().default(2),
  install_custom_node_with_gpu: z
    .boolean()
    .default(false)
    .optional()
    .describe("Install custom nodes with GPU"),
  run_timeout: z.number().default(300),
  idle_timeout: z.number().default(60),
  ws_timeout: z.number().default(2),
  extra_docker_commands: z.any().default([]).nullable(),
  allow_concurrent_inputs: z.number().default(1).describe("Queue per GPU"),
  machine_builder_version: z
    .enum(machineBuilderVersionTypes)
    .nullable()
    .default("4")
    .describe("Builder Version"),
  keep_warm: z.number().default(0).describe("Keep always on").optional(),
  base_docker_image: z
    .string()
    .nullable()
    .default("")
    .optional()
    .describe("Base docker image"),
  python_version: z
    .string()
    .nullable()
    .default("3.11")
    .optional()
    .describe("Python version"),
  extra_args: z
    .string()
    .nullable()
    .default("")
    .optional()
    .describe("Extra arguments"),
  prestart_command: z
    .string()
    .nullable()
    .default("")
    .optional()
    .describe("Prestart command"),
});

interface GPUConfig {
  id: string;
  gpuName: string;
  ram: string;
  pricePerSec?: number;
  tier: string;
}

export function useGPUConfig() {
  const { data: gpuPricing, isLoading: gpuPricingLoading } =
    useGPUPricing() as {
      data?: Record<string, number>;
      isLoading: boolean;
    };

  const baseConfig: GPUConfig[] = [
    { id: "CPU", gpuName: "CPU", ram: "-", pricePerSec: 0, tier: "free" },
    { id: "T4", gpuName: "T4", ram: "16GB", pricePerSec: 0.01, tier: "free" },
    { id: "L4", gpuName: "L4", ram: "24GB", pricePerSec: 0.02, tier: "free" },
    {
      id: "A10G",
      gpuName: "A10G",
      ram: "24GB",
      pricePerSec: 0.02,
      tier: "free",
    },
    {
      id: "L40S",
      gpuName: "L40S",
      ram: "48GB",
      pricePerSec: 0,
      tier: "business",
    },
    {
      id: "A100",
      gpuName: "A100",
      ram: "40GB",
      pricePerSec: 0.02,
      tier: "business",
    },
    {
      id: "A100-80GB",
      gpuName: "A100-80GB",
      ram: "80GB",
      pricePerSec: 0.02,
      tier: "business",
    },
    {
      id: "H100",
      gpuName: "H100",
      ram: "80GB",
      pricePerSec: 0.02,
      tier: "business",
    },
  ];

  const gpuConfig = baseConfig.map((config) => ({
    ...config,
    pricePerSec: gpuPricing?.[config.id] ?? config.pricePerSec,
  }));

  return { gpuConfig, isLoading: gpuPricingLoading };
}

export const sharedMachineConfig: FieldConfig<
  z.infer<typeof serverlessFormSchema>
> = {
  comfyui_version: {
    fieldType: "comfyuiVersion",
  },
  docker_command_steps: {
    fieldType: "dockerSteps",
    description: "Install any custom nodes, custom docker commands.",
  },
  gpu: {
    fieldType: "timeoutPicker",
    inputProps: {
      optionsForTier: [
        ["CPU", , "CPU"],
        ["T4", , "T4 (16GB)"],
        ["A10G", , "A10G (24GB)"],
        ["L4", , "L4 (24GB)"],
        ["L40S", , "L40S (48GB)"],
        ["A100", "business", "A100 (40GB)"],
        ["A100-80GB", "business", "A100-80GB (80GB)"],
        ["H100", "business", "H100 (80GB)"],
      ],
    },
  },
  run_timeout: {
    fieldType: "timeoutPicker",
    inputProps: {
      title: "Workflow timeout",
      optionsForTier: [
        ["300"],
        ["420", "pro"],
        ["600", "business"],
        ["1200", "business"],
        ["1800", "business"],
      ],
      displayAsTime: true,
    },
    group: "Auto Scaling",
  },
  idle_timeout: {
    fieldType: "timeoutPicker",
    description:
      "The warm time is the seconds before the container will be stopped after the run is finished. So the next request will reuse the warm container.",
    inputProps: {
      title: "Warm time",
      optionsForTier: [
        ["2"],
        ["15"],
        ["30"],
        ["60"],
        ["120", "pro"],
        ["240", "business"],
        ["600", "business"], // 10 minutes
        ["1200", "business"], // 20 minutes
      ],
      displayAsTime: true,
    },
    group: "Auto Scaling",
  },
  keep_warm: {
    fieldType: "max-always-on-picker",
    group: "Auto Scaling",
  },
  concurrency_limit: {
    fieldType: "max-gpu-picker",
    description:
      "Increase the concurrency limit for the machine to handle more gpu intensive tasks at the same time.",
    inputProps: {
      title: "Max Parallel GPU",
    },
    group: "Auto Scaling",
  },

  models: {
    fieldType: "models",
    inputProps: {
      showLabel: false,
    },
    group: "Advance",
  },
  ws_timeout: {
    fieldType: "timeoutPicker",
    inputProps: {
      title: "Websocket timeout",
      optionsForTier: [["2"], ["5", "pro"], ["10", "business"]],
      displayAsTime: true,
    },
    group: "Advance",
  },
  allow_concurrent_inputs: {
    fieldType: "slider",
    description:
      "The queue size is the number of inputs that can be queued to 1 container before spinning up a new container.",
    inputProps: {
      title: "Queue per GPU",
      min: 1,
    },
    group: "Advance",
  },
  extra_docker_commands: {
    fieldType: "extraDockerCommands",
    group: "Advance",
  },
  install_custom_node_with_gpu: {
    fieldType: "checkbox",
    description: "Some custom nodes require a gpu while being initialized.",
    inputProps: {
      title: "Install custom node with GPU",
    },
    group: "Advance",
  },
  machine_builder_version: {
    fieldType: "select",
    description:
      "v2 is deprecated, v3 is old, v4 is reccomended and requires v2 API in /settings (default on for new users)",
    group: "Advance",
  },

  base_docker_image: {
    description: "Optional base docker image for the machine.",
    group: "Advance",
  },

  extra_args: {
    description: (
      <>
        ComfyUI extra args{" "}
        <Link
          className="text-blue-500 underline"
          target="_blank"
          href="https://github.com/comfyanonymous/ComfyUI/blob/master/comfy/cli_args.py"
        >
          examples{" "}
          <ExternalLinkIcon className="inline-block h-[14px] w-[14px]" />
        </Link>
      </>
    ),
    group: "Advance",
  },

  prestart_command: {
    description: "Command to run before the machine starts.",
    group: "Advance",
  },

  python_version: {
    description: "Python version for the machine.",
    group: "Advance",
  },
};
