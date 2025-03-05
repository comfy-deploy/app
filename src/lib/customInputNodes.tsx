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
  ComfyUIDeployExternalEXR: "string - (public exr image url)",
} as const;

export type InputsType = keyof typeof customInputNodes;
// ... existing code ...

export const inputTypesList = Object.keys(customInputNodes) as InputsType[];
