export const customInputNodes = {
  ComfyUIDeployExternalText: "string",
  ComfyUIDeployExternalTextAny: "string",
  ComfyUIDeployExternalTextSingleLine: "string",
  ComfyUIDeployExternalImage: "string - (public image url)",
  ComfyUIDeployExternalImageAlpha: "string - (public image url)",
  ComfyUIDeployExternalNumber: "float",
  ComfyUIDeployExternalNumberInt: "integer",
  ComfyUIDeployExternalLora: "string - (public lora download url)",
  ComfyUIDeployExternalCheckpoint: "string - (public checkpoints download url)",
  ComfyDeployWebscoketImageInput: "binary - (websocket)",
  ComfyUIDeployExternalImageBatch: "array of image urls",
  ComfyUIDeployExternalVideo: "string - (public video url)",
  ComfyUIDeployExternalBoolean: "boolean",
  ComfyUIDeployExternalNumberSlider: "float",
  ComfyUIDeployExternalNumberSliderInt: "integer",
  ComfyUIDeployExternalEnum: "string group - (enum)",
  ComfyUIDeployExternalColor: "string - (hex color code)",
  ComfyUIDeployExternalAudio: "string - (public audio url)",
  ComfyUIDeployExternalSeed: "integer",
} as const;

export type CustomInputNodesTypeMap = {
  ComfyUIDeployExternalText: string;
  ComfyUIDeployExternalTextAny: string;
  ComfyUIDeployExternalTextSingleLine: string;
  ComfyUIDeployExternalImage: string;
  ComfyUIDeployExternalImageAlpha: string;
  ComfyUIDeployExternalNumber: number;
  ComfyUIDeployExternalNumberInt: number;
  ComfyUIDeployExternalLora: string;
  ComfyUIDeployExternalCheckpoint: string;
  ComfyDeployWebscoketImageInput: ArrayBuffer;
  ComfyUIDeployExternalImageBatch: string[];
  ComfyUIDeployExternalVideo: string;
  ComfyUIDeployExternalBoolean: boolean;
  ComfyUIDeployExternalNumberSlider: number;
  ComfyUIDeployExternalNumberSliderInt: number;
  ComfyUIDeployExternalAudio: string;
  ComfyUIDeployExternalSeed: number;
};

export type InputsType = keyof typeof customInputNodes;
// ... existing code ...

export const inputTypesList = Object.keys(customInputNodes) as InputsType[];
