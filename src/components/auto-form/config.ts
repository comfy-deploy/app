// import ModelSelector from "./custom/model-picker-url-only";
// import AutoFormSelect from "./custom/select";
import AutoFormComfyUIVersion from "./custom/comfyui-version";
import AutoFormDockerSteps from "./custom/docker-steps-ui";
import ExtraDockerCommands from "./custom/extra-docker-commands";
import AutoFormMaxAlwaysOnPicker from "./custom/max-always-on-picker";
import AutoFormMaxGPUPicker from "./custom/max-gpu-picker";
import AutoFormSelectInput from "./custom/select-custom-input";
import AutoFormTimeoutPicker from "./custom/timeout-picker";
import AutoFormCheckbox from "./fields/checkbox";
import AutoFormDate from "./fields/date";
import AutoFormEnum from "./fields/enum";
import AutoFormFile from "./fields/file";
import AutoFormInput from "./fields/input";
import AutoFormNumber from "./fields/number";
import AutoFormRadioGroup from "./fields/radio-group";
import AutoFormSlider from "./fields/slider";
import AutoFormSwitch from "./fields/switch";
import AutoFormTextarea from "./fields/textarea";

// import AutoFormDependencyUI from "@/components/custom-form/deps-ui";
// import ExtraDockerCommands from "@/components/custom-form/extra-docker-commands";
// import AutoFormGPUPicker from "@/components/custom-form/gpu-picker";
// import AutoFormModelsPicker from "@/components/custom-form/model-picker";
// import AutoFormModelsPickerUrl from "@/components/custom-form/model-picker-url-only";
// import AutoFormNewWorkflow from "@/components/custom-form/new-workflow";
// import AutoFormSnapshotPicker from "@/components/custom-form/snapshot-picker";
// import AutoFormTimeoutPicker from "@/components/custom-form/timeout-picker";

// import AutoFormNewWorkflowFromJson from "@/components/custom-form/NewWorkflowFromJson";
// import AutoFormComfyUIVersion from "@/components/custom-form/comfyui-version-edit";
// import AutoFormDockerSteps from "@/components/custom-form/docker-steps-ui";
// import AutoFormMaxAlwaysOnPicker from "@/components/custom-form/max-always-on-picker";
// import AutoFormMaxGPUPicker from "@/components/custom-form/max-gpu-picker";
// import AutoFormSlider from "@/components/ui/auto-form/fields/slider";
// import AutoFormSelectInput from "./custom/select-custom-input";

export const INPUT_COMPONENTS = {
  checkbox: AutoFormCheckbox,
  date: AutoFormDate,
  select: AutoFormEnum,
  radio: AutoFormRadioGroup,
  switch: AutoFormSwitch,
  textarea: AutoFormTextarea,
  number: AutoFormNumber,
  fallback: AutoFormInput,
  file: AutoFormFile,

  // "select-horizontal": AutoFormSelect,
  // "model-url-selector": ModelSelector,

  // snapshot: AutoFormSnapshotPicker,
  // models: AutoFormModelsPicker,
  // gpuPicker: AutoFormGPUPicker,
  // modelUrlPicker: AutoFormModelsPickerUrl,
  timeoutPicker: AutoFormTimeoutPicker,
  "max-gpu-picker": AutoFormMaxGPUPicker,
  "max-always-on-picker": AutoFormMaxAlwaysOnPicker,
  // dependency: AutoFormDependencyUI,
  extraDockerCommands: ExtraDockerCommands,
  // newWorkflow: AutoFormNewWorkflow,
  slider: AutoFormSlider,
  dockerSteps: AutoFormDockerSteps,
  comfyuiVersion: AutoFormComfyUIVersion,
  // newWorkflowFromJson: AutoFormNewWorkflowFromJson,

  "select-custom-input": AutoFormSelectInput, // TODO: remove
};

/**
 * Define handlers for specific Zod types.
 * You can expand this object to support more types.
 */
export const DEFAULT_ZOD_HANDLERS: {
  [key: string]: keyof typeof INPUT_COMPONENTS;
} = {
  ZodBoolean: "checkbox",
  ZodDate: "date",
  ZodEnum: "select",
  ZodNativeEnum: "select",
  ZodNumber: "number",
};
