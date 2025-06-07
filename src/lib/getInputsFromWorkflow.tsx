import { customInputNodes, inputTypesList } from "./customInputNodes";

import { z } from "zod";

const inputTypesEnum = Object.fromEntries(
  inputTypesList.map((type) => [type, type]),
) as { [K in (typeof inputTypesList)[number]]: K };

export const WorkflowInputType = z.object({
  class_type: z.nativeEnum(inputTypesEnum),
  input_id: z.string(),
  default_value: z.union([z.string(), z.number()]),
  min_value: z.number().optional(),
  max_value: z.number().optional(),
  display_name: z.string().optional(),
  description: z.string().optional(),
  enum_values: z.array(z.string()).optional(),
  nodeId: z.string().optional(),
  groupId: z.string().optional(),
});

export const WorkflowInputsType = z.array(WorkflowInputType);

export type WorkflowInput = z.infer<typeof WorkflowInputType>;

export function getInputsFromWorkflow(workflow_version: any) {
  if (!workflow_version || !workflow_version.workflow_api) return null;
  return getInputsFromWorkflowAPI(workflow_version.workflow_api);
}

export function getInputsFromWorkflowAPI(workflow_api?: any) {
  if (!workflow_api) return null;

  const inputs = Object.entries(workflow_api)
    .map(([id, value]: [string, any]) => {
      if (!value.class_type) return undefined;
      const nodeType = (customInputNodes as any)[value.class_type];
      if (nodeType) {
        const input_id = value.inputs.input_id as string;
        const default_value = value.inputs.default_value as string | number;
        return {
          ...value.inputs,
          class_type: value.class_type,
          input_id,
          default_value,
          min_value: value.inputs.min_value as number | undefined,
          max_value: value.inputs.max_value as number | undefined,
          display_name: value.inputs.display_name as string,
          description: value.inputs.description as string,
          nodeId: id, // Store the node ID for reference when saving order
        } as any as z.infer<typeof WorkflowInputType>;
      }
      return undefined;
    })
    .filter((item) => item !== undefined) as z.infer<typeof WorkflowInputsType>;

  return inputs.sort((a, b) => {
    const nodeIdA = a.nodeId as string | undefined;
    const nodeIdB = b.nodeId as string | undefined;

    if (!nodeIdA || !nodeIdB) return 0;

    const orderA =
      workflow_api[nodeIdA]?._meta?.cd_input_order ?? Number.MAX_SAFE_INTEGER;
    const orderB =
      workflow_api[nodeIdB]?._meta?.cd_input_order ?? Number.MAX_SAFE_INTEGER;
    return orderA - orderB;
  });
}

export function getInputsFromWorkflowJSON(workflow?: any) {
  if (!workflow) return null;
  return workflow.nodes
    .map((node: any) => {
      if (!node.type) return undefined;
      const nodeType =
        customInputNodes[node.type as keyof typeof customInputNodes];
      if (nodeType) {
        const input_id = node.widgets_values[0] as string;
        const default_value = node.widgets_values[1] as string;

        if (
          node.type === "ComfyUIDeployExternalNumberSlider" ||
          node.type === "ComfyUIDeployExternalNumberSliderInt"
        ) {
          const min_value = node.widgets_values[2] as number;
          const max_value = node.widgets_values[3] as number;

          return {
            class_type: node.type,
            input_id,
            default_value,
            min_value,
            max_value,
          };
        }

        return {
          class_type: node.type,
          input_id,
          default_value,
          min_value: 0,
          max_value: 0,
        };
      }
      return undefined;
    })
    .filter((item: any) => item !== undefined);
}

export function getDefaultValuesFromWorkflow(inputs: Record<string, any>) {
  // console.log("inputs", inputs);
  const default_values =
    inputs?.reduce((acc: any, input: any) => {
      if (input) {
        if (input.class_type === "ComfyUIDeployExternalLora") {
          return { ...acc, [input.input_id]: input.default_lora_name };
        }
        // When having a default image, the input.default value is an array
        // with the node where he image is getting loaded (eg: ["47", 0]).
        // We need to escape those values because it isn't an image object
        if (Array.isArray(input.default_value)) {
          return { ...acc, [input.input_id]: undefined };
        }
        return { ...acc, [input.input_id]: input.default_value };
      }
      return acc;
    }, {}) ?? {};

  return default_values;
}
