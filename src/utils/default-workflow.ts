const sd1_5 = {
  id: "6019867a-604b-4d50-bb6d-26475d9f4aa9",
  revision: 0,
  last_node_id: 14,
  last_link_id: 11,
  nodes: [
    {
      id: 3,
      type: "KSampler",
      pos: [863, 186],
      size: [315, 474],
      flags: {},
      order: 6,
      mode: 0,
      inputs: [
        {
          name: "model",
          type: "MODEL",
          link: 1,
        },
        {
          name: "positive",
          type: "CONDITIONING",
          link: 4,
        },
        {
          name: "negative",
          type: "CONDITIONING",
          link: 6,
        },
        {
          name: "latent_image",
          type: "LATENT",
          link: 2,
        },
      ],
      outputs: [
        {
          name: "LATENT",
          type: "LATENT",
          slot_index: 0,
          links: [7],
        },
      ],
      properties: {
        "Node name for S&R": "KSampler",
      },
      widgets_values: [
        1004563962940012,
        "randomize",
        20,
        8,
        "euler",
        "normal",
        1,
      ],
    },
    {
      id: 8,
      type: "VAEDecode",
      pos: [1209, 188],
      size: [210, 46],
      flags: {},
      order: 7,
      mode: 0,
      inputs: [
        {
          name: "samples",
          type: "LATENT",
          link: 7,
        },
        {
          name: "vae",
          type: "VAE",
          link: 8,
        },
      ],
      outputs: [
        {
          name: "IMAGE",
          type: "IMAGE",
          slot_index: 0,
          links: [9],
        },
      ],
      properties: {
        "Node name for S&R": "VAEDecode",
      },
      widgets_values: [],
    },
    {
      id: 9,
      type: "SaveImage",
      pos: [1451, 189],
      size: [210, 270],
      flags: {},
      order: 8,
      mode: 0,
      inputs: [
        {
          name: "images",
          type: "IMAGE",
          link: 9,
        },
      ],
      outputs: [],
      properties: {},
      widgets_values: ["ComfyUI", ""],
    },
    {
      id: 6,
      type: "CLIPTextEncode",
      pos: [415, 186],
      size: [422.84503173828125, 164.31304931640625],
      flags: {},
      order: 4,
      mode: 0,
      inputs: [
        {
          name: "clip",
          type: "CLIP",
          link: 3,
        },
        {
          name: "text",
          type: "STRING",
          widget: {
            name: "text",
          },
          link: 10,
        },
      ],
      outputs: [
        {
          name: "CONDITIONING",
          type: "CONDITIONING",
          slot_index: 0,
          links: [4],
        },
      ],
      properties: {
        "Node name for S&R": "CLIPTextEncode",
      },
      widgets_values: [
        "beautiful scenery nature glass bottle landscape, , purple galaxy bottle,",
      ],
    },
    {
      id: 7,
      type: "CLIPTextEncode",
      pos: [413, 389],
      size: [425.27801513671875, 180.6060791015625],
      flags: {},
      order: 5,
      mode: 0,
      inputs: [
        {
          name: "clip",
          type: "CLIP",
          link: 5,
        },
        {
          name: "text",
          type: "STRING",
          widget: {
            name: "text",
          },
          link: 11,
        },
      ],
      outputs: [
        {
          name: "CONDITIONING",
          type: "CONDITIONING",
          slot_index: 0,
          links: [6],
        },
      ],
      properties: {
        "Node name for S&R": "CLIPTextEncode",
      },
      widgets_values: ["text, watermark"],
    },
    {
      id: 13,
      type: "ComfyUIDeployExternalText",
      pos: [-84.390625, -61.3984375],
      size: [400, 200],
      flags: {},
      order: 0,
      mode: 0,
      inputs: [],
      outputs: [
        {
          name: "text",
          shape: 3,
          type: "STRING",
          slot_index: 0,
          links: [11],
        },
      ],
      properties: {
        "Node name for S&R": "ComfyUIDeployExternalText",
      },
      widgets_values: ["negative_prompt", "text, watermark", "", ""],
    },
    {
      id: 12,
      type: "ComfyUIDeployExternalText",
      pos: [-81.55859375, 191.56640625],
      size: [400, 200],
      flags: {},
      order: 1,
      mode: 0,
      inputs: [],
      outputs: [
        {
          name: "text",
          shape: 3,
          type: "STRING",
          slot_index: 0,
          links: [10],
        },
      ],
      properties: {
        "Node name for S&R": "ComfyUIDeployExternalText",
      },
      widgets_values: [
        "positive_prompt",
        "beautiful scenery nature glass bottle landscape, , purple galaxy bottle,",
        "",
        "",
      ],
    },
    {
      id: 4,
      type: "CheckpointLoaderSimple",
      pos: [1.1140031814575195, 474.3717956542969],
      size: [315, 98],
      flags: {},
      order: 2,
      mode: 0,
      inputs: [],
      outputs: [
        {
          name: "MODEL",
          type: "MODEL",
          slot_index: 0,
          links: [1],
        },
        {
          name: "CLIP",
          type: "CLIP",
          slot_index: 1,
          links: [3, 5],
        },
        {
          name: "VAE",
          type: "VAE",
          slot_index: 2,
          links: [8],
        },
      ],
      properties: {
        "Node name for S&R": "CheckpointLoaderSimple",
      },
      widgets_values: ["v1-5-pruned-emaonly-fp16.safetensors"],
    },
    {
      id: 5,
      type: "EmptyLatentImage",
      pos: [420.93292236328125, 631.154296875],
      size: [315, 106],
      flags: {},
      order: 3,
      mode: 0,
      inputs: [],
      outputs: [
        {
          name: "LATENT",
          type: "LATENT",
          slot_index: 0,
          links: [2],
        },
      ],
      properties: {
        "Node name for S&R": "EmptyLatentImage",
      },
      widgets_values: [512, 512, 1],
    },
  ],
  links: [
    [1, 4, 0, 3, 0, "MODEL"],
    [2, 5, 0, 3, 3, "LATENT"],
    [3, 4, 1, 6, 0, "CLIP"],
    [4, 6, 0, 3, 1, "CONDITIONING"],
    [5, 4, 1, 7, 0, "CLIP"],
    [6, 7, 0, 3, 2, "CONDITIONING"],
    [7, 3, 0, 8, 0, "LATENT"],
    [8, 4, 2, 8, 1, "VAE"],
    [9, 8, 0, 9, 0, "IMAGE"],
    [10, 12, 0, 6, 1, "STRING"],
    [11, 13, 0, 7, 1, "STRING"],
  ],
  groups: [
    {
      id: 1,
      title: "Input",
      bounding: [
        -115.6541748046875, -153.20025634765625, 463.41796875, 570.1640625,
      ],
      color: "#3f789e",
      font_size: 24,
      flags: {},
    },
  ],
  config: {},
  extra: {
    ds: {
      scale: 1,
      offset: [528.4148452244707, 336.45586524805117],
    },
  },
  version: 0.4,
};

const sd1_5_api = {
  "3": {
    inputs: {
      seed: 1004563962940012,
      steps: 20,
      cfg: 8,
      sampler_name: "euler",
      scheduler: "normal",
      denoise: 1,
      model: ["4", 0],
      positive: ["6", 0],
      negative: ["7", 0],
      latent_image: ["5", 0],
    },
    class_type: "KSampler",
    _meta: {
      title: "KSampler",
    },
  },
  "4": {
    inputs: {
      ckpt_name: "v1-5-pruned-emaonly-fp16.safetensors",
    },
    class_type: "CheckpointLoaderSimple",
    _meta: {
      title: "Load Checkpoint",
    },
  },
  "5": {
    inputs: {
      width: 512,
      height: 512,
      batch_size: 1,
    },
    class_type: "EmptyLatentImage",
    _meta: {
      title: "Empty Latent Image",
    },
  },
  "6": {
    inputs: {
      text: ["12", 0],
      clip: ["4", 1],
    },
    class_type: "CLIPTextEncode",
    _meta: {
      title: "CLIP Text Encode (Prompt)",
    },
  },
  "7": {
    inputs: {
      text: ["13", 0],
      clip: ["4", 1],
    },
    class_type: "CLIPTextEncode",
    _meta: {
      title: "CLIP Text Encode (Prompt)",
    },
  },
  "8": {
    inputs: {
      samples: ["3", 0],
      vae: ["4", 2],
    },
    class_type: "VAEDecode",
    _meta: {
      title: "VAE Decode",
    },
  },
  "9": {
    inputs: {
      filename_prefix: "ComfyUI",
      images: ["8", 0],
    },
    class_type: "SaveImage",
    _meta: {
      title: "Save Image",
    },
  },
  "12": {
    inputs: {
      input_id: "positive_prompt",
      default_value:
        "beautiful scenery nature glass bottle landscape, , purple galaxy bottle,",
      display_name: "",
      description: "",
    },
    class_type: "ComfyUIDeployExternalText",
    _meta: {
      title: "External Text (ComfyUI Deploy)",
    },
  },
  "13": {
    inputs: {
      input_id: "negative_prompt",
      default_value: "text, watermark",
      display_name: "",
      description: "",
    },
    class_type: "ComfyUIDeployExternalText",
    _meta: {
      title: "External Text (ComfyUI Deploy)",
    },
  },
};

export type defaultWorkflowTemplateType = {
  workflowId: string;
  workflowName: string;
  workflowDescription: string;
  workflowJson: string;
  workflowApi?: string;
  workflowImageUrl: string;
  hasEnvironment?: boolean;
};

const workflow_json_flux = {
  id: "7bab0619-4771-4b74-ade1-1d2be5784416",
  extra: {
    ds: {
      scale: 0.6010518407212623,
      offset: [968.1086001473603, 161.1595819834713],
    },
    node_versions: {
      "comfy-core": "0.3.19",
      "comfyui-deploy": "b3df94d1affcf7ce05ee7eeda99989194bcd9159",
    },
    frontendVersion: "1.18.10",
  },
  links: [
    [9, 8, 0, 9, 0, "IMAGE"],
    [45, 30, 1, 6, 0, "CLIP"],
    [46, 30, 2, 8, 1, "VAE"],
    [47, 30, 0, 31, 0, "MODEL"],
    [51, 27, 0, 31, 3, "LATENT"],
    [52, 31, 0, 8, 0, "LATENT"],
    [54, 30, 1, 33, 0, "CLIP"],
    [55, 33, 0, 31, 2, "CONDITIONING"],
    [56, 6, 0, 35, 0, "CONDITIONING"],
    [57, 35, 0, 31, 1, "CONDITIONING"],
    [58, 38, 0, 6, 1, "STRING"],
    [59, 40, 0, 27, 1, "INT"],
    [60, 39, 0, 27, 0, "INT"],
  ],
  nodes: [
    {
      id: 6,
      pos: [384, 192],
      mode: 0,
      size: [422.8500061035156, 164.30999755859375],
      type: "CLIPTextEncode",
      color: "#232",
      flags: {},
      order: 7,
      title: "CLIP Text Encode (Positive Prompt)",
      inputs: [
        { link: 45, name: "clip", type: "CLIP" },
        { link: 58, name: "text", type: "STRING", widget: { name: "text" } },
      ],
      bgcolor: "#353",
      outputs: [
        {
          name: "CONDITIONING",
          type: "CONDITIONING",
          links: [56],
          slot_index: 0,
        },
      ],
      properties: { "Node name for S&R": "CLIPTextEncode" },
      widgets_values: [
        "cute anime girl with massive fluffy fennec ears and a big fluffy tail blonde messy long hair blue eyes wearing a maid outfit with a long black gold leaf pattern dress and a white apron mouth open placing a fancy black forest cake with candles on top of a dinner table of an old dark Victorian mansion lit by candlelight with a bright window to the foggy forest and very expensive stuff everywhere there are paintings on the walls",
      ],
    },
    {
      id: 8,
      pos: [1151, 195],
      mode: 0,
      size: [210, 46],
      type: "VAEDecode",
      flags: {},
      order: 11,
      inputs: [
        { link: 52, name: "samples", type: "LATENT" },
        { link: 46, name: "vae", type: "VAE" },
      ],
      outputs: [{ name: "IMAGE", type: "IMAGE", links: [9], slot_index: 0 }],
      properties: { "Node name for S&R": "VAEDecode" },
      widgets_values: [],
    },
    {
      id: 9,
      pos: [1375, 194],
      mode: 0,
      size: [985.2999877929688, 1060.3800048828125],
      type: "SaveImage",
      flags: {},
      order: 12,
      inputs: [{ link: 9, name: "images", type: "IMAGE" }],
      outputs: [],
      properties: {},
      widgets_values: ["ComfyUI"],
    },
    {
      id: 31,
      pos: [816, 192],
      mode: 0,
      size: [315, 262],
      type: "KSampler",
      flags: {},
      order: 10,
      inputs: [
        { link: 47, name: "model", type: "MODEL" },
        { link: 57, name: "positive", type: "CONDITIONING" },
        { link: 55, name: "negative", type: "CONDITIONING" },
        { link: 51, name: "latent_image", type: "LATENT" },
      ],
      outputs: [{ name: "LATENT", type: "LATENT", links: [52], slot_index: 0 }],
      properties: { "Node name for S&R": "KSampler" },
      widgets_values: [
        1024035737089801,
        "randomize",
        20,
        1,
        "euler",
        "simple",
        1,
      ],
    },
    {
      id: 35,
      pos: [576, 96],
      mode: 0,
      size: [211.60000610351562, 58],
      type: "FluxGuidance",
      flags: {},
      order: 9,
      inputs: [{ link: 56, name: "conditioning", type: "CONDITIONING" }],
      outputs: [
        {
          name: "CONDITIONING",
          type: "CONDITIONING",
          links: [57],
          slot_index: 0,
        },
      ],
      properties: { "Node name for S&R": "FluxGuidance" },
      widgets_values: [3.5],
    },
    {
      id: 37,
      pos: [60, 345],
      mode: 0,
      size: [225, 88],
      type: "MarkdownNote",
      color: "#432",
      flags: {},
      order: 0,
      inputs: [],
      bgcolor: "#653",
      outputs: [],
      properties: {},
      widgets_values: [
        "🛈 [Learn more about this workflow](https://comfyanonymous.github.io/ComfyUI_examples/flux/#flux-dev-1)",
      ],
    },
    {
      id: 34,
      pos: [825, 510],
      mode: 0,
      size: [282.8599853515625, 164.0800018310547],
      type: "Note",
      color: "#432",
      flags: {},
      order: 1,
      inputs: [],
      bgcolor: "#653",
      outputs: [],
      properties: { text: "" },
      widgets_values: [
        "Note that Flux dev and schnell do not have any negative prompt so CFG should be set to 1.0. Setting CFG to 1.0 means the negative prompt is ignored.",
      ],
    },
    {
      id: 30,
      pos: [48, 192],
      mode: 0,
      size: [315, 98],
      type: "CheckpointLoaderSimple",
      flags: {},
      order: 2,
      inputs: [],
      outputs: [
        { name: "MODEL", type: "MODEL", links: [47], slot_index: 0 },
        { name: "CLIP", type: "CLIP", links: [45, 54], slot_index: 1 },
        { name: "VAE", type: "VAE", links: [46], slot_index: 2 },
      ],
      properties: { "Node name for S&R": "CheckpointLoaderSimple" },
      widgets_values: ["FLUX1/flux1-dev-fp8.safetensors"],
    },
    {
      id: 33,
      pos: [390, 400],
      mode: 0,
      size: [422.8500061035156, 164.30999755859375],
      type: "CLIPTextEncode",
      color: "#322",
      flags: { collapsed: true },
      order: 6,
      title: "CLIP Text Encode (Negative Prompt)",
      inputs: [{ link: 54, name: "clip", type: "CLIP" }],
      bgcolor: "#533",
      outputs: [
        {
          name: "CONDITIONING",
          type: "CONDITIONING",
          links: [55],
          slot_index: 0,
        },
      ],
      properties: { "Node name for S&R": "CLIPTextEncode" },
      widgets_values: [""],
    },
    {
      id: 27,
      pos: [461.8629455566406, 460.2491149902344],
      mode: 0,
      size: [315, 126],
      type: "EmptySD3LatentImage",
      color: "#323",
      flags: {},
      order: 8,
      inputs: [
        { link: 60, name: "width", type: "INT", widget: { name: "width" } },
        { link: 59, name: "height", type: "INT", widget: { name: "height" } },
      ],
      bgcolor: "#535",
      outputs: [{ name: "LATENT", type: "LATENT", links: [51], slot_index: 0 }],
      properties: { "Node name for S&R": "EmptySD3LatentImage" },
      widgets_values: [1024, 1024, 1],
    },
    {
      id: 38,
      pos: [-497.3238525390625, 306.5517578125],
      mode: 0,
      size: [400, 200],
      type: "ComfyUIDeployExternalText",
      flags: {},
      order: 3,
      inputs: [],
      outputs: [{ name: "text", type: "STRING", links: [58] }],
      properties: { "Node name for S&R": "ComfyUIDeployExternalText" },
      widgets_values: [
        "prompt",
        "cute anime girl with massive fluffy fennec ears and a big fluffy tail blonde messy long hair blue eyes wearing a maid outfit with a long black gold leaf pattern dress and a white apron mouth open placing a fancy black forest cake with candles on top of a dinner table of an old dark Victorian mansion lit by candlelight with a bright window to the foggy forest and very expensive stuff everywhere there are paintings on the walls",
        "Prompt",
        "The prompt to generate an image from.",
      ],
    },
    {
      id: 39,
      pos: [-507.4543762207031, 612.9552001953125],
      mode: 0,
      size: [453.5999755859375, 200],
      type: "ComfyUIDeployExternalNumberInt",
      flags: {},
      order: 4,
      inputs: [],
      outputs: [{ name: "value", type: "INT", links: [60], slot_index: 0 }],
      properties: { "Node name for S&R": "ComfyUIDeployExternalNumberInt" },
      widgets_values: ["width", 1024, "Width", "The width of the image."],
    },
    {
      id: 40,
      pos: [-497.8695068359375, 864.68994140625],
      mode: 0,
      size: [453.5999755859375, 200],
      type: "ComfyUIDeployExternalNumberInt",
      flags: {},
      order: 5,
      inputs: [],
      outputs: [{ name: "value", type: "INT", links: [59], slot_index: 0 }],
      properties: { "Node name for S&R": "ComfyUIDeployExternalNumberInt" },
      widgets_values: ["height", 1024, "Height", "The height of the image."],
    },
  ],
  config: {},
  groups: [
    {
      id: 1,
      color: "#3f789e",
      flags: {},
      title: "Input",
      bounding: [
        -508.010986328125, 186.76593017578125, 453.23040771484375,
        334.3218994140625,
      ],
      font_size: 24,
    },
    {
      id: 2,
      color: "#A88",
      flags: {},
      title: "Additional",
      bounding: [
        -517.1227416992188, 537.53759765625, 644.4954223632812,
        599.2609252929688,
      ],
      font_size: 24,
    },
  ],
  version: 0.4,
  revision: 0,
  last_link_id: 60,
  last_node_id: 40,
  workflow_api: {
    "6": {
      _meta: { title: "CLIP Text Encode (Positive Prompt)" },
      inputs: { clip: ["30", 1], text: ["38", 0] },
      class_type: "CLIPTextEncode",
    },
    "8": {
      _meta: { title: "VAE解码" },
      inputs: { vae: ["30", 2], samples: ["31", 0] },
      class_type: "VAEDecode",
    },
    "9": {
      _meta: { title: "保存图像" },
      inputs: { images: ["8", 0], filename_prefix: "ComfyUI" },
      class_type: "SaveImage",
    },
    "27": {
      _meta: { title: "空Latent图像（SD3）" },
      inputs: { width: ["39", 0], height: ["40", 0], batch_size: 1 },
      class_type: "EmptySD3LatentImage",
    },
    "30": {
      _meta: { title: "Checkpoint加载器（简易）" },
      inputs: { ckpt_name: "FLUX1/flux1-dev-fp8.safetensors" },
      class_type: "CheckpointLoaderSimple",
    },
    "31": {
      _meta: { title: "K采样器" },
      inputs: {
        cfg: 1,
        seed: 1024035737089801,
        model: ["30", 0],
        steps: 20,
        denoise: 1,
        negative: ["33", 0],
        positive: ["35", 0],
        scheduler: "simple",
        latent_image: ["27", 0],
        sampler_name: "euler",
      },
      class_type: "KSampler",
    },
    "33": {
      _meta: { title: "CLIP Text Encode (Negative Prompt)" },
      inputs: { clip: ["30", 1], text: "" },
      class_type: "CLIPTextEncode",
    },
    "35": {
      _meta: { title: "Flux引导" },
      inputs: { guidance: 3.5, conditioning: ["6", 0] },
      class_type: "FluxGuidance",
    },
    "38": {
      _meta: { title: "External Text (ComfyUI Deploy)" },
      inputs: {
        input_id: "prompt",
        description: "The prompt to generate an image from.",
        display_name: "Prompt",
        default_value:
          "cute anime girl with massive fluffy fennec ears and a big fluffy tail blonde messy long hair blue eyes wearing a maid outfit with a long black gold leaf pattern dress and a white apron mouth open placing a fancy black forest cake with candles on top of a dinner table of an old dark Victorian mansion lit by candlelight with a bright window to the foggy forest and very expensive stuff everywhere there are paintings on the walls",
      },
      class_type: "ComfyUIDeployExternalText",
    },
    "39": {
      _meta: { title: "External Number Int (ComfyUI Deploy)" },
      inputs: {
        input_id: "width",
        description: "The width of the image.",
        display_name: "Width",
        default_value: 1024,
      },
      class_type: "ComfyUIDeployExternalNumberInt",
    },
    "40": {
      _meta: { title: "External Number Int (ComfyUI Deploy)" },
      inputs: {
        input_id: "height",
        description: "The height of the image.",
        display_name: "Height",
        default_value: 1024,
      },
      class_type: "ComfyUIDeployExternalNumberInt",
    },
  },
  environment: {
    comfyui_version: "158419f3a0017c2ce123484b14b6c527716d6ec8",
    gpu: "A10G",
    docker_command_steps: { steps: [] },
    max_containers: 1,
    install_custom_node_with_gpu: false,
    run_timeout: 300,
    scaledown_window: 60,
    extra_docker_commands: [],
    base_docker_image: null,
    python_version: null,
    extra_args: null,
    prestart_command: null,
    min_containers: 0,
    machine_hash:
      "d03d1d7971adb9bf990e472e8bb48e2ed7e70aeb2f666b82d88625f089ce1eea",
    disable_metadata: true,
  },
};

const workflow_json_hunyuan3d = {
  id: "70b37042-d37f-4947-aff4-fc95871f4365",
  extra: {
    ds: {
      scale: 0.6115909044841759,
      offset: [1817.8720653658825, 763.2611947154027],
    },
    node_versions: {
      "comfy-core": "0.3.14",
      ComfyUI_essentials: "76e9d1e4399bd025ce8b12c290753d58f9f53e93",
      "ComfyUI-Hunyuan3DWrapper": "d72f2e9f3fdb7907792df1a236853aff91abe6f2",
    },
    frontendVersion: "1.18.10",
    VHS_latentpreview: true,
    VHS_latentpreviewrate: 0,
  },
  links: [
    [30, 28, 0, 35, 0, "DELIGHTMODEL"],
    [57, 35, 0, 45, 0, "IMAGE"],
    [74, 55, 0, 56, 0, "REMBG_SESSION"],
    [86, 59, 0, 17, 0, "HY3DMESH"],
    [99, 64, 0, 35, 1, "IMAGE"],
    [133, 59, 0, 83, 0, "HY3DMESH"],
    [134, 83, 0, 79, 0, "HY3DMESH"],
    [139, 85, 0, 88, 0, "HY3DPAINTMODEL"],
    [142, 79, 1, 88, 3, "IMAGE"],
    [148, 79, 0, 90, 0, "IMAGE"],
    [151, 79, 2, 92, 1, "MESHRENDER"],
    [163, 98, 0, 99, 0, "HY3DMESH"],
    [185, 104, 0, 98, 0, "IMAGE"],
    [192, 88, 0, 111, 0, "IMAGE"],
    [193, 79, 0, 88, 2, "IMAGE"],
    [196, 35, 0, 88, 1, "IMAGE"],
    [199, 79, 1, 116, 0, "IMAGE"],
    [202, 88, 0, 117, 0, "IMAGE"],
    [203, 117, 0, 92, 0, "IMAGE"],
    [204, 119, 0, 118, 0, "UPSCALE_MODEL"],
    [205, 88, 0, 118, 1, "IMAGE"],
    [207, 92, 0, 125, 0, "IMAGE"],
    [209, 104, 0, 127, 0, "IMAGE"],
    [217, 92, 0, 129, 0, "IMAGE"],
    [218, 92, 1, 129, 1, "MASK"],
    [219, 92, 2, 129, 2, "MESHRENDER"],
    [220, 129, 0, 104, 0, "IMAGE"],
    [221, 129, 0, 126, 0, "IMAGE"],
    [222, 129, 1, 104, 1, "MASK"],
    [223, 129, 2, 98, 1, "MESHRENDER"],
    [226, 132, 0, 133, 0, "MASK"],
    [227, 133, 0, 64, 0, "IMAGE"],
    [231, 135, 0, 64, 2, "MASK"],
    [240, 52, 0, 136, 0, "*"],
    [241, 136, 0, 64, 1, "IMAGE"],
    [244, 56, 1, 138, 0, "MASK"],
    [250, 10, 1, 140, 0, "HY3DVAE"],
    [251, 140, 0, 59, 0, "HY3DMESH"],
    [252, 10, 0, 141, 0, "HY3DMODEL"],
    [255, 141, 0, 140, 1, "HY3DLATENT"],
    [256, 52, 0, 142, 0, "*"],
    [257, 142, 0, 56, 1, "IMAGE"],
    [258, 142, 0, 141, 1, "IMAGE"],
    [259, 56, 1, 143, 0, "*"],
    [260, 143, 0, 141, 2, "MASK"],
    [261, 143, 0, 135, 0, "*"],
    [262, 144, 0, 35, 3, "INT"],
    [263, 144, 0, 35, 4, "INT"],
    [264, 144, 0, 88, 7, "INT"],
    [265, 148, 0, 35, 2, "NOISESCHEDULER"],
    [266, 28, 0, 148, 0, "HY3DDIFFUSERSPIPE"],
    [267, 149, 0, 88, 5, "NOISESCHEDULER"],
    [268, 85, 0, 149, 0, "HY3DDIFFUSERSPIPE"],
    [272, 61, 0, 79, 1, "HY3DCAMERA"],
    [273, 61, 0, 88, 4, "HY3DCAMERA"],
    [274, 61, 0, 92, 2, "HY3DCAMERA"],
    [275, 17, 0, 153, 1, "STRING"],
    [276, 99, 0, 154, 1, "STRING"],
    [278, 157, 0, 52, 0, "IMAGE"],
  ],
  nodes: [
    {
      id: 64,
      pos: [-940, 1040],
      mode: 0,
      size: [315, 146],
      type: "ImageCompositeMasked",
      flags: {},
      order: 28,
      inputs: [
        {
          link: 227,
          name: "destination",
          type: "IMAGE",
        },
        {
          link: 241,
          name: "source",
          type: "IMAGE",
        },
        {
          link: 231,
          name: "mask",
          type: "MASK",
          shape: 7,
        },
      ],
      outputs: [
        {
          name: "IMAGE",
          type: "IMAGE",
          links: [99],
          slot_index: 0,
        },
      ],
      properties: {
        "Node name for S&R": "ImageCompositeMasked",
      },
      widgets_values: [0, 0, false],
    },
    {
      id: 83,
      pos: [323.44720458984375, 913.39697265625],
      mode: 0,
      size: [214.20001220703125, 26],
      type: "Hy3DMeshUVWrap",
      flags: {},
      order: 32,
      inputs: [
        {
          link: 133,
          name: "trimesh",
          type: "TRIMESH",
        },
      ],
      outputs: [
        {
          name: "trimesh",
          type: "TRIMESH",
          links: [134],
          slot_index: 0,
        },
      ],
      properties: {
        "Node name for S&R": "Hy3DMeshUVWrap",
      },
      widgets_values: [],
    },
    {
      id: 116,
      pos: [931.2645874023438, 1337.064208984375],
      mode: 0,
      size: [534.0819091796875, 375.8153991699219],
      type: "PreviewImage",
      flags: {},
      order: 38,
      inputs: [
        {
          link: 199,
          name: "images",
          type: "IMAGE",
        },
      ],
      outputs: [],
      properties: {
        "Node name for S&R": "PreviewImage",
      },
      widgets_values: [],
    },
    {
      id: 119,
      pos: [2335.203857421875, 728.801025390625],
      mode: 2,
      size: [315, 58],
      type: "UpscaleModelLoader",
      flags: {},
      order: 0,
      inputs: [],
      outputs: [
        {
          name: "UPSCALE_MODEL",
          type: "UPSCALE_MODEL",
          links: [204],
        },
      ],
      properties: {
        "Node name for S&R": "UpscaleModelLoader",
      },
      widgets_values: ["4x-UltraSharp.pth"],
    },
    {
      id: 98,
      pos: [3778.609130859375, 1248.801025390625],
      mode: 0,
      size: [226.79998779296875, 46],
      type: "Hy3DApplyTexture",
      flags: {},
      order: 47,
      inputs: [
        {
          link: 185,
          name: "texture",
          type: "IMAGE",
        },
        {
          link: 223,
          name: "renderer",
          type: "MESHRENDER",
        },
      ],
      outputs: [
        {
          name: "trimesh",
          type: "TRIMESH",
          links: [163],
          slot_index: 0,
        },
      ],
      properties: {
        "Node name for S&R": "Hy3DApplyTexture",
      },
      widgets_values: [],
    },
    {
      id: 104,
      pos: [3428.609130859375, 1058.801025390625],
      mode: 0,
      size: [239.40000915527344, 102],
      type: "CV2InpaintTexture",
      flags: {},
      order: 46,
      inputs: [
        {
          link: 220,
          name: "texture",
          type: "IMAGE",
        },
        {
          link: 222,
          name: "mask",
          type: "MASK",
        },
      ],
      outputs: [
        {
          name: "texture",
          type: "IMAGE",
          links: [185, 209],
          slot_index: 0,
        },
      ],
      properties: {
        "Node name for S&R": "CV2InpaintTexture",
      },
      widgets_values: [3, "ns"],
    },
    {
      id: 126,
      pos: [3198.609130859375, 1378.801025390625],
      mode: 0,
      size: [491.2337341308594, 523.9635620117188],
      type: "PreviewImage",
      flags: {},
      order: 45,
      title: "Preview Image: vertex inpainted texture",
      inputs: [
        {
          link: 221,
          name: "images",
          type: "IMAGE",
        },
      ],
      outputs: [],
      properties: {
        "Node name for S&R": "PreviewImage",
      },
      widgets_values: [],
    },
    {
      id: 120,
      pos: [2725.203857421875, 738.801025390625],
      mode: 0,
      size: [354.4071044921875, 125.7635726928711],
      type: "Note",
      color: "#432",
      flags: {},
      order: 1,
      inputs: [],
      bgcolor: "#653",
      outputs: [],
      properties: {},
      widgets_values: [
        "You can upscale the multiviews at this point for more texture details",
      ],
    },
    {
      id: 118,
      pos: [2315.634033203125, 851.9907836914062],
      mode: 2,
      size: [340.20001220703125, 46],
      type: "ImageUpscaleWithModel",
      flags: {},
      order: 41,
      inputs: [
        {
          link: 204,
          name: "upscale_model",
          type: "UPSCALE_MODEL",
        },
        {
          link: 205,
          name: "image",
          type: "IMAGE",
        },
      ],
      outputs: [
        {
          name: "IMAGE",
          type: "IMAGE",
          links: null,
        },
      ],
      properties: {
        "Node name for S&R": "ImageUpscaleWithModel",
      },
      widgets_values: [],
    },
    {
      id: 133,
      pos: [-910, 1270],
      mode: 0,
      size: [264.5999755859375, 26],
      type: "MaskToImage",
      flags: {
        collapsed: true,
      },
      order: 16,
      inputs: [
        {
          link: 226,
          name: "mask",
          type: "MASK",
        },
      ],
      outputs: [
        {
          name: "IMAGE",
          type: "IMAGE",
          links: [227],
          slot_index: 0,
        },
      ],
      properties: {
        "Node name for S&R": "MaskToImage",
      },
      widgets_values: [],
    },
    {
      id: 90,
      pos: [354.6097717285156, 1332.690673828125],
      mode: 0,
      size: [534.0819091796875, 375.8153991699219],
      type: "PreviewImage",
      flags: {},
      order: 36,
      inputs: [
        {
          link: 148,
          name: "images",
          type: "IMAGE",
        },
      ],
      outputs: [],
      properties: {
        "Node name for S&R": "PreviewImage",
      },
      widgets_values: [],
    },
    {
      id: 92,
      pos: [2662.9970703125, 1228.801025390625],
      mode: 0,
      size: [302.4000244140625, 66],
      type: "Hy3DBakeFromMultiview",
      flags: {},
      order: 42,
      inputs: [
        {
          link: 203,
          name: "images",
          type: "IMAGE",
        },
        {
          link: 151,
          name: "renderer",
          type: "MESHRENDER",
        },
        {
          link: 274,
          name: "camera_config",
          type: "HY3DCAMERA",
          shape: 7,
        },
      ],
      outputs: [
        {
          name: "texture",
          type: "IMAGE",
          links: [207, 217],
          slot_index: 0,
        },
        {
          name: "mask",
          type: "MASK",
          links: [218],
          slot_index: 1,
        },
        {
          name: "renderer",
          type: "MESHRENDER",
          links: [219],
          slot_index: 2,
        },
      ],
      properties: {
        "Node name for S&R": "Hy3DBakeFromMultiview",
      },
      widgets_values: [],
    },
    {
      id: 129,
      pos: [3060.599365234375, 1227.6019287109375],
      mode: 0,
      size: [277.20001220703125, 66],
      type: "Hy3DMeshVerticeInpaintTexture",
      flags: {},
      order: 44,
      inputs: [
        {
          link: 217,
          name: "texture",
          type: "IMAGE",
        },
        {
          link: 218,
          name: "mask",
          type: "MASK",
        },
        {
          link: 219,
          name: "renderer",
          type: "MESHRENDER",
        },
      ],
      outputs: [
        {
          name: "texture",
          type: "IMAGE",
          links: [220, 221],
        },
        {
          name: "mask",
          type: "MASK",
          links: [222],
        },
        {
          name: "renderer",
          type: "MESHRENDER",
          links: [223],
        },
      ],
      properties: {
        "Node name for S&R": "Hy3DMeshVerticeInpaintTexture",
      },
      widgets_values: [],
    },
    {
      id: 136,
      pos: [-1060, 1060],
      mode: 0,
      size: [75, 26],
      type: "Reroute",
      flags: {},
      order: 20,
      inputs: [
        {
          link: 240,
          name: "",
          type: "*",
        },
      ],
      outputs: [
        {
          name: "",
          type: "IMAGE",
          links: [241],
          slot_index: 0,
        },
      ],
      properties: {
        horizontal: false,
        showOutputText: false,
      },
    },
    {
      id: 135,
      pos: [-1050, 1100],
      mode: 0,
      size: [75, 26],
      type: "Reroute",
      flags: {},
      order: 26,
      inputs: [
        {
          link: 261,
          name: "",
          type: "*",
        },
      ],
      outputs: [
        {
          name: "",
          type: "MASK",
          links: [231],
          slot_index: 0,
        },
      ],
      properties: {
        horizontal: false,
        showOutputText: false,
      },
    },
    {
      id: 55,
      pos: [-312.4496154785156, -786.0094604492188],
      mode: 0,
      size: [340.20001220703125, 82],
      type: "TransparentBGSession+",
      flags: {},
      order: 2,
      inputs: [],
      outputs: [
        {
          name: "REMBG_SESSION",
          type: "REMBG_SESSION",
          links: [74],
          slot_index: 0,
        },
      ],
      properties: {
        "Node name for S&R": "TransparentBGSession+",
      },
      widgets_values: ["base", true],
    },
    {
      id: 138,
      pos: [138.2086639404297, -621.7325439453125],
      mode: 0,
      size: [210, 246],
      type: "MaskPreview+",
      flags: {},
      order: 23,
      inputs: [
        {
          link: 244,
          name: "mask",
          type: "MASK",
        },
      ],
      outputs: [],
      properties: {
        "Node name for S&R": "MaskPreview+",
      },
      widgets_values: [],
    },
    {
      id: 17,
      pos: [308.6851806640625, -259.24041748046875],
      mode: 0,
      size: [315.6768493652344, 106],
      type: "Hy3DExportMesh",
      flags: {},
      order: 31,
      inputs: [
        {
          link: 86,
          name: "trimesh",
          type: "TRIMESH",
        },
      ],
      outputs: [
        {
          name: "glb_path",
          type: "STRING",
          links: [275],
          slot_index: 0,
        },
      ],
      properties: {
        "Node name for S&R": "Hy3DExportMesh",
      },
      widgets_values: ["3D/Hy3D", "glb", true],
    },
    {
      id: 59,
      pos: [301.78021240234375, -124.21797180175781],
      mode: 0,
      size: [315, 174],
      type: "Hy3DPostprocessMesh",
      flags: {},
      order: 29,
      inputs: [
        {
          link: 251,
          name: "trimesh",
          type: "TRIMESH",
        },
        {
          link: null,
          name: "mask",
          type: "MASK",
          shape: 7,
        },
      ],
      outputs: [
        {
          name: "trimesh",
          type: "TRIMESH",
          links: [86, 133],
          slot_index: 0,
        },
      ],
      properties: {
        "Node name for S&R": "Hy3DPostprocessMesh",
      },
      widgets_values: [true, true, true, 50000, false],
    },
    {
      id: 141,
      pos: [-430, 5.956213474273682],
      mode: 0,
      size: [315, 218],
      type: "Hy3DGenerateMesh",
      flags: {},
      order: 25,
      inputs: [
        {
          link: 252,
          name: "pipeline",
          type: "HY3DMODEL",
        },
        {
          link: 258,
          name: "image",
          type: "IMAGE",
        },
        {
          link: 260,
          name: "mask",
          type: "MASK",
          shape: 7,
        },
      ],
      outputs: [
        {
          name: "latents",
          type: "HY3DLATENT",
          links: [255],
        },
      ],
      properties: {
        "Node name for S&R": "Hy3DGenerateMesh",
      },
      widgets_values: [
        5.5,
        50,
        123,
        "fixed",
        "FlowMatchEulerDiscreteScheduler",
        true,
      ],
    },
    {
      id: 142,
      pos: [-649.8002319335938, -400.6730651855469],
      mode: 0,
      size: [75, 26],
      type: "Reroute",
      flags: {},
      order: 21,
      inputs: [
        {
          link: 256,
          name: "",
          type: "*",
        },
      ],
      outputs: [
        {
          name: "",
          type: "IMAGE",
          links: [257, 258],
          slot_index: 0,
        },
      ],
      properties: {
        horizontal: false,
        showOutputText: false,
      },
    },
    {
      id: 56,
      pos: [-316.1974182128906, -643.1515502929688],
      mode: 0,
      size: [327.5999755859375, 46],
      type: "ImageRemoveBackground+",
      flags: {},
      order: 22,
      inputs: [
        {
          link: 74,
          name: "rembg_session",
          type: "REMBG_SESSION",
        },
        {
          link: 257,
          name: "image",
          type: "IMAGE",
        },
      ],
      outputs: [
        {
          name: "IMAGE",
          type: "IMAGE",
          links: [],
          slot_index: 0,
        },
        {
          name: "MASK",
          type: "MASK",
          links: [244, 259],
          slot_index: 1,
        },
      ],
      properties: {
        "Node name for S&R": "ImageRemoveBackground+",
      },
      widgets_values: [],
    },
    {
      id: 143,
      pos: [-699.34765625, -22.30767250061035],
      mode: 0,
      size: [75, 26],
      type: "Reroute",
      flags: {},
      order: 24,
      inputs: [
        {
          link: 259,
          name: "",
          type: "*",
        },
      ],
      outputs: [
        {
          name: "",
          type: "MASK",
          links: [260, 261],
          slot_index: 0,
        },
      ],
      properties: {
        horizontal: false,
        showOutputText: false,
      },
    },
    {
      id: 52,
      pos: [-1104.0650634765625, -401.0750427246094],
      mode: 0,
      size: [315, 218],
      type: "ImageResize+",
      flags: {},
      order: 17,
      inputs: [
        {
          link: 278,
          name: "image",
          type: "IMAGE",
        },
      ],
      outputs: [
        {
          name: "IMAGE",
          type: "IMAGE",
          links: [240, 256],
          slot_index: 0,
        },
        {
          name: "width",
          type: "INT",
          links: null,
        },
        {
          name: "height",
          type: "INT",
          links: null,
        },
      ],
      properties: {
        "Node name for S&R": "ImageResize+",
      },
      widgets_values: [518, 518, "lanczos", "pad", "always", 2],
    },
    {
      id: 132,
      pos: [-590, 1310],
      mode: 0,
      size: [315, 106],
      type: "SolidMask",
      flags: {},
      order: 3,
      inputs: [],
      outputs: [
        {
          name: "MASK",
          type: "MASK",
          links: [226],
          slot_index: 0,
        },
      ],
      properties: {
        "Node name for S&R": "SolidMask",
      },
      widgets_values: [0.8, 512, 512],
    },
    {
      id: 144,
      pos: [1624.705810546875, 745.9616088867188],
      mode: 0,
      size: [260.3999938964844, 84.1800765991211],
      type: "PrimitiveNode",
      flags: {},
      order: 4,
      title: "Primitive: reference image size",
      inputs: [],
      outputs: [
        {
          name: "INT",
          type: "INT",
          links: [262, 263, 264],
          widget: {
            name: "width",
          },
          slot_index: 0,
        },
      ],
      properties: {
        "Run widget replace on values": false,
      },
      widgets_values: [512, "fixed"],
    },
    {
      id: 73,
      pos: [-540, 1140],
      mode: 0,
      size: [259.3616943359375, 99.84209442138672],
      type: "Note",
      color: "#432",
      flags: {},
      order: 5,
      inputs: [],
      bgcolor: "#653",
      outputs: [],
      properties: {},
      widgets_values: [
        "The level of the background affects the delighting a lot, fully black generally doesn't work, too dark makes the image red, fully white can be overbright, adjust the background level to your liking with the mask value level",
      ],
    },
    {
      id: 137,
      pos: [-450, -300],
      mode: 0,
      size: [312.0663146972656, 88],
      type: "Note",
      color: "#432",
      flags: {},
      order: 6,
      inputs: [],
      bgcolor: "#653",
      outputs: [],
      properties: {},
      widgets_values: [
        "https://huggingface.co/Kijai/Hunyuan3D-2_safetensors/blob/main/hunyuan3d-dit-v2-0-fp16.safetensors",
      ],
    },
    {
      id: 146,
      pos: [-1097.3349609375, -139.42422485351562],
      mode: 0,
      size: [312.0663146972656, 88],
      type: "Note",
      color: "#432",
      flags: {},
      order: 7,
      inputs: [],
      bgcolor: "#653",
      outputs: [],
      properties: {},
      widgets_values: [
        "The image encoder used works at 518x518, every input is resized to that automatically, but better to do it here first in controlled fashion",
      ],
    },
    {
      id: 111,
      pos: [1828.6090087890625, 1388.801025390625],
      mode: 0,
      size: [801.6017456054688, 562.7461547851562],
      type: "PreviewImage",
      flags: {},
      order: 39,
      title: "Preview Image: Multiview results",
      inputs: [
        {
          link: 192,
          name: "images",
          type: "IMAGE",
        },
      ],
      outputs: [],
      properties: {
        "Node name for S&R": "PreviewImage",
      },
      widgets_values: [],
    },
    {
      id: 125,
      pos: [2658.609130859375, 1378.801025390625],
      mode: 0,
      size: [503.22430419921875, 521.7835083007812],
      type: "PreviewImage",
      flags: {},
      order: 43,
      title: "Preview Image: Initial baked texture",
      inputs: [
        {
          link: 207,
          name: "images",
          type: "IMAGE",
        },
      ],
      outputs: [],
      properties: {
        "Node name for S&R": "PreviewImage",
      },
      widgets_values: [],
    },
    {
      id: 127,
      pos: [3738.609130859375, 1378.801025390625],
      mode: 0,
      size: [471.61279296875, 520.6934204101562],
      type: "PreviewImage",
      flags: {},
      order: 48,
      title: "Preview Image: fully inpainted texture",
      inputs: [
        {
          link: 209,
          name: "images",
          type: "IMAGE",
        },
      ],
      outputs: [],
      properties: {
        "Node name for S&R": "PreviewImage",
      },
      widgets_values: [],
    },
    {
      id: 99,
      pos: [4053.56396484375, 1224.027099609375],
      mode: 0,
      size: [315, 106],
      type: "Hy3DExportMesh",
      flags: {},
      order: 49,
      inputs: [
        {
          link: 163,
          name: "trimesh",
          type: "TRIMESH",
        },
      ],
      outputs: [
        {
          name: "glb_path",
          type: "STRING",
          links: [276],
          slot_index: 0,
        },
      ],
      properties: {
        "Node name for S&R": "Hy3DExportMesh",
      },
      widgets_values: ["3D/Hy3D_textured", "glb", true],
    },
    {
      id: 88,
      pos: [1917.5408935546875, 897.4906005859375],
      mode: 0,
      size: [311.7241516113281, 274],
      type: "Hy3DSampleMultiView",
      flags: {},
      order: 37,
      inputs: [
        {
          link: 139,
          name: "pipeline",
          type: "HY3DDIFFUSERSPIPE",
        },
        {
          link: 196,
          name: "ref_image",
          type: "IMAGE",
        },
        {
          link: 193,
          name: "normal_maps",
          type: "IMAGE",
        },
        {
          link: 142,
          name: "position_maps",
          type: "IMAGE",
        },
        {
          link: 273,
          name: "camera_config",
          type: "HY3DCAMERA",
          shape: 7,
        },
        {
          link: 267,
          name: "scheduler",
          type: "NOISESCHEDULER",
          shape: 7,
        },
        {
          link: null,
          name: "samples",
          type: "LATENT",
          shape: 7,
        },
        {
          link: 264,
          name: "view_size",
          type: "INT",
          widget: {
            name: "view_size",
          },
        },
      ],
      outputs: [
        {
          name: "image",
          type: "IMAGE",
          links: [192, 202, 205],
          slot_index: 0,
        },
      ],
      properties: {
        "Node name for S&R": "Hy3DSampleMultiView",
      },
      widgets_values: [512, 25, 1024, "fixed", 1],
    },
    {
      id: 35,
      pos: [-560, 870],
      mode: 0,
      size: [278.7183837890625, 222],
      type: "Hy3DDelightImage",
      flags: {},
      order: 30,
      inputs: [
        {
          link: 30,
          name: "delight_pipe",
          type: "HY3DDIFFUSERSPIPE",
        },
        {
          link: 99,
          name: "image",
          type: "IMAGE",
        },
        {
          link: 265,
          name: "scheduler",
          type: "NOISESCHEDULER",
          shape: 7,
        },
        {
          link: 262,
          name: "width",
          type: "INT",
          widget: {
            name: "width",
          },
        },
        {
          link: 263,
          name: "height",
          type: "INT",
          widget: {
            name: "height",
          },
        },
      ],
      outputs: [
        {
          name: "image",
          type: "IMAGE",
          links: [57, 196],
          slot_index: 0,
        },
      ],
      properties: {
        "Node name for S&R": "Hy3DDelightImage",
      },
      widgets_values: [50, 512, 512, 1, 0, "fixed"],
    },
    {
      id: 45,
      pos: [-230, 1110],
      mode: 0,
      size: [370.2379455566406, 396.4273376464844],
      type: "PreviewImage",
      flags: {},
      order: 33,
      inputs: [
        {
          link: 57,
          name: "images",
          type: "IMAGE",
        },
      ],
      outputs: [],
      properties: {
        "Node name for S&R": "PreviewImage",
      },
      widgets_values: [],
    },
    {
      id: 148,
      pos: [-567.3681640625, 726.651611328125],
      mode: 0,
      size: [288.13494873046875, 82],
      type: "Hy3DDiffusersSchedulerConfig",
      flags: {},
      order: 19,
      inputs: [
        {
          link: 266,
          name: "pipeline",
          type: "HY3DDIFFUSERSPIPE",
        },
      ],
      outputs: [
        {
          name: "diffusers_scheduler",
          type: "NOISESCHEDULER",
          links: [265],
        },
      ],
      properties: {
        "Node name for S&R": "Hy3DDiffusersSchedulerConfig",
      },
      widgets_values: ["Euler A", "default"],
    },
    {
      id: 140,
      pos: [-35.7520866394043, -127.73638153076172],
      mode: 0,
      size: [315, 222],
      type: "Hy3DVAEDecode",
      flags: {},
      order: 27,
      inputs: [
        {
          link: 250,
          name: "vae",
          type: "HY3DVAE",
        },
        {
          link: 255,
          name: "latents",
          type: "HY3DLATENT",
        },
      ],
      outputs: [
        {
          name: "trimesh",
          type: "TRIMESH",
          links: [251],
          slot_index: 0,
        },
      ],
      properties: {
        "Node name for S&R": "Hy3DVAEDecode",
      },
      widgets_values: [1.01, 384, 32000, 0, "mc", true, true],
    },
    {
      id: 149,
      pos: [1929.843994140625, 1232.3370361328125],
      mode: 0,
      size: [288.13494873046875, 82],
      type: "Hy3DDiffusersSchedulerConfig",
      flags: {},
      order: 18,
      inputs: [
        {
          link: 268,
          name: "pipeline",
          type: "HY3DDIFFUSERSPIPE",
        },
      ],
      outputs: [
        {
          name: "diffusers_scheduler",
          type: "NOISESCHEDULER",
          links: [267],
          slot_index: 0,
        },
      ],
      properties: {
        "Node name for S&R": "Hy3DDiffusersSchedulerConfig",
      },
      widgets_values: ["Euler A", "default"],
    },
    {
      id: 79,
      pos: [593.6895141601562, 914.635009765625],
      mode: 0,
      size: [342.5999755859375, 170],
      type: "Hy3DRenderMultiView",
      flags: {},
      order: 35,
      inputs: [
        {
          link: 134,
          name: "trimesh",
          type: "TRIMESH",
        },
        {
          link: 272,
          name: "camera_config",
          type: "HY3DCAMERA",
          shape: 7,
        },
      ],
      outputs: [
        {
          name: "normal_maps",
          type: "IMAGE",
          links: [148, 193],
          slot_index: 0,
        },
        {
          name: "position_maps",
          type: "IMAGE",
          links: [142, 199],
          slot_index: 1,
        },
        {
          name: "renderer",
          type: "MESHRENDER",
          links: [151],
        },
        {
          name: "masks",
          type: "MASK",
          links: null,
        },
      ],
      properties: {
        "Node name for S&R": "Hy3DRenderMultiView",
      },
      widgets_values: [1024, 2048, "world"],
    },
    {
      id: 117,
      pos: [2288.609130859375, 958.801025390625],
      mode: 0,
      size: [315, 218],
      type: "ImageResize+",
      flags: {},
      order: 40,
      inputs: [
        {
          link: 202,
          name: "image",
          type: "IMAGE",
        },
      ],
      outputs: [
        {
          name: "IMAGE",
          type: "IMAGE",
          links: [203],
          slot_index: 0,
        },
        {
          name: "width",
          type: "INT",
          links: null,
        },
        {
          name: "height",
          type: "INT",
          links: null,
        },
      ],
      properties: {
        "Node name for S&R": "ImageResize+",
      },
      widgets_values: [2048, 2048, "lanczos", "stretch", "always", 0],
    },
    {
      id: 115,
      pos: [324.2544860839844, 1137.7796630859375],
      mode: 0,
      size: [244.82861328125, 119.78506469726562],
      type: "Note",
      color: "#432",
      flags: {},
      order: 8,
      inputs: [],
      bgcolor: "#653",
      outputs: [],
      properties: {},
      widgets_values: [
        "These are the default camera views used, customizing is fully experimental. To customize.",
      ],
    },
    {
      id: 61,
      pos: [592.6513061523438, 1132.274658203125],
      mode: 0,
      size: [342.9443054199219, 154],
      type: "Hy3DCameraConfig",
      flags: {},
      order: 9,
      inputs: [],
      outputs: [
        {
          name: "camera_config",
          type: "HY3DCAMERA",
          links: [272, 273, 274],
          slot_index: 0,
        },
      ],
      properties: {
        "Node name for S&R": "Hy3DCameraConfig",
      },
      widgets_values: [
        "0, 90, 180, 270, 0, 180",
        "0, 0, 0, 0, 90, -90",
        "1, 0.1, 0.5, 0.1, 0.05, 0.05",
        1.45,
        1.2,
      ],
    },
    {
      id: 153,
      pos: [725.4800415039062, -605.6441650390625],
      mode: 0,
      size: [899.2444458007812, 1024.1732177734375],
      type: "Preview3D",
      flags: {},
      order: 34,
      inputs: [
        {
          link: null,
          name: "camera_info",
          type: "LOAD3D_CAMERA",
          shape: 7,
        },
        {
          link: 275,
          name: "model_file",
          type: "STRING",
          widget: {
            name: "model_file",
          },
        },
      ],
      outputs: [],
      properties: {
        "Camera Info": {
          zoom: 1,
          target: {
            x: 0,
            y: 0,
            z: 0,
          },
          position: {
            x: 10.066904097353866,
            y: 10.066904097353866,
            z: 10.066904097353868,
          },
          cameraType: "perspective",
        },
        "Node name for S&R": "Preview3D",
      },
      widgets_values: ["", ""],
    },
    {
      id: 154,
      pos: [4520, 640],
      mode: 0,
      size: [977.4424438476562, 1298.644287109375],
      type: "Preview3D",
      flags: {},
      order: 50,
      inputs: [
        {
          link: null,
          name: "camera_info",
          type: "LOAD3D_CAMERA",
          shape: 7,
        },
        {
          link: 276,
          name: "model_file",
          type: "STRING",
          widget: {
            name: "model_file",
          },
        },
      ],
      outputs: [],
      properties: {
        "Node name for S&R": "Preview3D",
      },
      widgets_values: ["", ""],
    },
    {
      id: 155,
      pos: [835.9649658203125, -764.7407836914062],
      mode: 0,
      size: [317.4715270996094, 108.64700317382812],
      type: "Note",
      color: "#432",
      flags: {},
      order: 10,
      inputs: [],
      bgcolor: "#653",
      outputs: [],
      properties: {},
      widgets_values: [
        "If the Preview3D node doesn't work, right click on it and select \"fix node\" or re-create the whole node. It's part of ComfyUI and often gets updated causing mismatch with the version that's in the workflow.",
      ],
    },
    {
      id: 156,
      pos: [4580.03173828125, 445.3966064453125],
      mode: 0,
      size: [317.4715270996094, 108.64700317382812],
      type: "Note",
      color: "#432",
      flags: {},
      order: 11,
      inputs: [],
      bgcolor: "#653",
      outputs: [],
      properties: {},
      widgets_values: [
        "If the Preview3D node doesn't work, right click on it and select \"fix node\" or re-create the whole node. It's part of ComfyUI and often gets updated causing mismatch with the version that's in the workflow.",
      ],
    },
    {
      id: 10,
      pos: [-460, -150],
      mode: 0,
      size: [372.8913269042969, 126],
      type: "Hy3DModelLoader",
      flags: {},
      order: 12,
      inputs: [
        {
          link: null,
          name: "compile_args",
          type: "HY3DCOMPILEARGS",
          shape: 7,
        },
      ],
      outputs: [
        {
          name: "pipeline",
          type: "HY3DMODEL",
          links: [252],
          slot_index: 0,
        },
        {
          name: "vae",
          type: "HY3DVAE",
          links: [250],
          slot_index: 1,
        },
      ],
      properties: {
        "Node name for S&R": "Hy3DModelLoader",
      },
      widgets_values: ["hunyuan3d-dit-v2-0-fp16.safetensors", "sdpa", false],
    },
    {
      id: 157,
      pos: [-1084.6236572265625, -824.1287231445312],
      mode: 0,
      size: [309.1890563964844, 366],
      type: "ComfyUIDeployExternalImage",
      flags: {},
      order: 13,
      inputs: [
        {
          link: null,
          name: "default_value",
          type: "IMAGE",
          shape: 7,
        },
      ],
      outputs: [
        {
          name: "image",
          type: "IMAGE",
          links: [278],
        },
      ],
      properties: {
        "Node name for S&R": "ComfyUIDeployExternalImage",
      },
      widgets_values: [
        "input_image",
        "",
        "",
        "https://comfy-deploy-output.s3.us-east-2.amazonaws.com/assets/img_b8w6LweUwR6JxAPG.png",
        "",
      ],
    },
    {
      id: 85,
      pos: [1909.106689453125, 766.966796875],
      mode: 0,
      size: [327.5999755859375, 58],
      type: "DownloadAndLoadHy3DPaintModel",
      flags: {},
      order: 14,
      inputs: [
        {
          link: null,
          name: "compile_args",
          type: "HY3DCOMPILEARGS",
          shape: 7,
        },
      ],
      outputs: [
        {
          name: "multiview_pipe",
          type: "HY3DDIFFUSERSPIPE",
          links: [139, 268],
        },
      ],
      properties: {
        "Node name for S&R": "DownloadAndLoadHy3DPaintModel",
      },
      widgets_values: ["hunyuan3d-paint-v2-0"],
    },
    {
      id: 28,
      pos: [-940, 870],
      mode: 0,
      size: [307.71990966796875, 58],
      type: "DownloadAndLoadHy3DDelightModel",
      flags: {},
      order: 15,
      inputs: [
        {
          link: null,
          name: "compile_args",
          type: "HY3DCOMPILEARGS",
          shape: 7,
        },
      ],
      outputs: [
        {
          name: "delight_pipe",
          type: "HY3DDIFFUSERSPIPE",
          links: [30, 266],
          slot_index: 0,
        },
      ],
      properties: {
        "Node name for S&R": "DownloadAndLoadHy3DDelightModel",
      },
      widgets_values: ["hunyuan3d-delight-v2-0"],
    },
  ],
  config: {},
  groups: [
    {
      id: 1,
      color: "#3f789e",
      flags: {},
      title: "Group",
      bounding: [
        -1168.8038330078125, -876.5914306640625, 2881.048095703125,
        1462.5147705078125,
      ],
      font_size: 24,
    },
    {
      id: 2,
      color: "#b58b2a",
      flags: {},
      title: "Delight",
      bounding: [
        -1166.68408203125, 627.7207641601562, 1369.6767578125, 888.11328125,
      ],
      font_size: 24,
    },
    {
      id: 3,
      color: "#b06634",
      flags: {},
      title: "RenderTextures",
      bounding: [
        216.74928283691406, 632.1493530273438, 1327.30810546875,
        1491.8914794921875,
      ],
      font_size: 24,
    },
    {
      id: 4,
      color: "#a1309b",
      flags: {},
      title: "TextureSampling",
      bounding: [
        1591.5169677734375, 633.6101684570312, 2813.541015625,
        1487.335205078125,
      ],
      font_size: 24,
    },
  ],
  version: 0.4,
  revision: 0,
  last_link_id: 278,
  last_node_id: 157,
  workflow_api: {
    "10": {
      _meta: {
        title: "Hy3DModelLoader",
      },
      inputs: {
        model: "hunyuan3d-dit-v2-0-fp16.safetensors",
        cublas_ops: false,
        attention_mode: "sdpa",
      },
      class_type: "Hy3DModelLoader",
    },
    "17": {
      _meta: {
        title: "Hy3DExportMesh",
      },
      inputs: {
        trimesh: ["59", 0],
        save_file: true,
        file_format: "glb",
        filename_prefix: "3D/Hy3D",
      },
      class_type: "Hy3DExportMesh",
    },
    "28": {
      _meta: {
        title: "(Down)Load Hy3D DelightModel",
      },
      inputs: {
        model: "hunyuan3d-delight-v2-0",
      },
      class_type: "DownloadAndLoadHy3DDelightModel",
    },
    "35": {
      _meta: {
        title: "Hy3DDelightImage",
      },
      inputs: {
        seed: 0,
        image: ["64", 0],
        steps: 50,
        width: 512,
        height: 512,
        cfg_image: 1,
        scheduler: ["148", 0],
        delight_pipe: ["28", 0],
      },
      class_type: "Hy3DDelightImage",
    },
    "45": {
      _meta: {
        title: "预览图像",
      },
      inputs: {
        images: ["35", 0],
      },
      class_type: "PreviewImage",
    },
    "52": {
      _meta: {
        title: "🔧 Image Resize",
      },
      inputs: {
        image: ["157", 0],
        width: 518,
        height: 518,
        method: "pad",
        condition: "always",
        multiple_of: 2,
        interpolation: "lanczos",
      },
      class_type: "ImageResize+",
    },
    "55": {
      _meta: {
        title: "🔧 InSPyReNet TransparentBG",
      },
      inputs: {
        mode: "base",
        use_jit: true,
      },
      class_type: "TransparentBGSession+",
    },
    "56": {
      _meta: {
        title: "🔧 Image Remove Background",
      },
      inputs: {
        image: ["52", 0],
        rembg_session: ["55", 0],
      },
      class_type: "ImageRemoveBackground+",
    },
    "59": {
      _meta: {
        title: "Hy3D Postprocess Mesh",
      },
      inputs: {
        trimesh: ["140", 0],
        max_facenum: 50000,
        reduce_faces: true,
        smooth_normals: false,
        remove_floaters: true,
        remove_degenerate_faces: true,
      },
      class_type: "Hy3DPostprocessMesh",
    },
    "61": {
      _meta: {
        title: "Hy3D Camera Config",
      },
      inputs: {
        ortho_scale: 1.2,
        view_weights: "1, 0.1, 0.5, 0.1, 0.05, 0.05",
        camera_azimuths: "0, 90, 180, 270, 0, 180",
        camera_distance: 1.45,
        camera_elevations: "0, 0, 0, 0, 90, -90",
      },
      class_type: "Hy3DCameraConfig",
    },
    "64": {
      _meta: {
        title: "合成图像（遮罩）",
      },
      inputs: {
        x: 0,
        y: 0,
        mask: ["56", 1],
        source: ["52", 0],
        destination: ["133", 0],
        resize_source: false,
      },
      class_type: "ImageCompositeMasked",
    },
    "79": {
      _meta: {
        title: "Hy3D Render MultiView",
      },
      inputs: {
        trimesh: ["83", 0],
        render_size: 1024,
        normal_space: "world",
        texture_size: 2048,
        camera_config: ["61", 0],
      },
      class_type: "Hy3DRenderMultiView",
    },
    "83": {
      _meta: {
        title: "Hy3D Mesh UV Wrap",
      },
      inputs: {
        trimesh: ["59", 0],
      },
      class_type: "Hy3DMeshUVWrap",
    },
    "85": {
      _meta: {
        title: "(Down)Load Hy3D PaintModel",
      },
      inputs: {
        model: "hunyuan3d-paint-v2-0",
      },
      class_type: "DownloadAndLoadHy3DPaintModel",
    },
    "88": {
      _meta: {
        title: "Hy3D Sample MultiView",
      },
      inputs: {
        seed: 1024,
        steps: 25,
        pipeline: ["85", 0],
        ref_image: ["35", 0],
        scheduler: ["149", 0],
        view_size: 512,
        normal_maps: ["79", 0],
        camera_config: ["61", 0],
        position_maps: ["79", 1],
        denoise_strength: 1,
      },
      class_type: "Hy3DSampleMultiView",
    },
    "90": {
      _meta: {
        title: "预览图像",
      },
      inputs: {
        images: ["79", 0],
      },
      class_type: "PreviewImage",
    },
    "92": {
      _meta: {
        title: "Hy3D Bake From Multiview",
      },
      inputs: {
        images: ["117", 0],
        renderer: ["79", 2],
        camera_config: ["61", 0],
      },
      class_type: "Hy3DBakeFromMultiview",
    },
    "98": {
      _meta: {
        title: "Hy3D Apply Texture",
      },
      inputs: {
        texture: ["104", 0],
        renderer: ["129", 2],
      },
      class_type: "Hy3DApplyTexture",
    },
    "99": {
      _meta: {
        title: "Hy3DExportMesh",
      },
      inputs: {
        trimesh: ["98", 0],
        save_file: true,
        file_format: "glb",
        filename_prefix: "3D/Hy3D_textured",
      },
      class_type: "Hy3DExportMesh",
    },
    "104": {
      _meta: {
        title: "CV2 Inpaint Texture",
      },
      inputs: {
        mask: ["129", 1],
        texture: ["129", 0],
        inpaint_method: "ns",
        inpaint_radius: 3,
      },
      class_type: "CV2InpaintTexture",
    },
    "111": {
      _meta: {
        title: "Preview Image: Multiview results",
      },
      inputs: {
        images: ["88", 0],
      },
      class_type: "PreviewImage",
    },
    "116": {
      _meta: {
        title: "预览图像",
      },
      inputs: {
        images: ["79", 1],
      },
      class_type: "PreviewImage",
    },
    "117": {
      _meta: {
        title: "🔧 Image Resize",
      },
      inputs: {
        image: ["88", 0],
        width: 2048,
        height: 2048,
        method: "stretch",
        condition: "always",
        multiple_of: 0,
        interpolation: "lanczos",
      },
      class_type: "ImageResize+",
    },
    "125": {
      _meta: {
        title: "Preview Image: Initial baked texture",
      },
      inputs: {
        images: ["92", 0],
      },
      class_type: "PreviewImage",
    },
    "126": {
      _meta: {
        title: "Preview Image: vertex inpainted texture",
      },
      inputs: {
        images: ["129", 0],
      },
      class_type: "PreviewImage",
    },
    "127": {
      _meta: {
        title: "Preview Image: fully inpainted texture",
      },
      inputs: {
        images: ["104", 0],
      },
      class_type: "PreviewImage",
    },
    "129": {
      _meta: {
        title: "Hy3D Mesh Vertice Inpaint Texture",
      },
      inputs: {
        mask: ["92", 1],
        texture: ["92", 0],
        renderer: ["92", 2],
      },
      class_type: "Hy3DMeshVerticeInpaintTexture",
    },
    "132": {
      _meta: {
        title: "纯块遮罩",
      },
      inputs: {
        value: 0.8,
        width: 512,
        height: 512,
      },
      class_type: "SolidMask",
    },
    "133": {
      _meta: {
        title: "遮罩转换为图像",
      },
      inputs: {
        mask: ["132", 0],
      },
      class_type: "MaskToImage",
    },
    "138": {
      _meta: {
        title: "🔧 Mask Preview",
      },
      inputs: {
        mask: ["56", 1],
      },
      class_type: "MaskPreview+",
    },
    "140": {
      _meta: {
        title: "Hy3D VAE Decode",
      },
      inputs: {
        vae: ["10", 1],
        box_v: 1.01,
        latents: ["141", 0],
        mc_algo: "mc",
        mc_level: 0,
        num_chunks: 32000,
        force_offload: true,
        enable_flash_vdm: true,
        octree_resolution: 384,
      },
      class_type: "Hy3DVAEDecode",
    },
    "141": {
      _meta: {
        title: "Hy3DGenerateMesh",
      },
      inputs: {
        mask: ["56", 1],
        seed: 123,
        image: ["52", 0],
        steps: 50,
        pipeline: ["10", 0],
        scheduler: "FlowMatchEulerDiscreteScheduler",
        force_offload: true,
        guidance_scale: 5.5,
      },
      class_type: "Hy3DGenerateMesh",
    },
    "148": {
      _meta: {
        title: "Hy3D Diffusers Scheduler Config",
      },
      inputs: {
        sigmas: "default",
        pipeline: ["28", 0],
        scheduler: "Euler A",
      },
      class_type: "Hy3DDiffusersSchedulerConfig",
    },
    "149": {
      _meta: {
        title: "Hy3D Diffusers Scheduler Config",
      },
      inputs: {
        sigmas: "default",
        pipeline: ["85", 0],
        scheduler: "Euler A",
      },
      class_type: "Hy3DDiffusersSchedulerConfig",
    },
    "153": {
      _meta: {
        title: "预览3D",
      },
      inputs: {
        image: "",
        model_file: ["17", 0],
      },
      class_type: "Preview3D",
    },
    "154": {
      _meta: {
        title: "预览3D",
      },
      inputs: {
        image: "",
        model_file: ["99", 0],
      },
      class_type: "Preview3D",
    },
    "157": {
      _meta: {
        title: "External Image (ComfyUI Deploy)",
      },
      inputs: {
        input_id: "input_image",
        description: "",
        display_name: "",
        default_value_url:
          "https://comfy-deploy-output.s3.us-east-2.amazonaws.com/assets/img_b8w6LweUwR6JxAPG.png",
      },
      class_type: "ComfyUIDeployExternalImage",
    },
  },
  environment: {
    comfyui_version: "158419f3a0017c2ce123484b14b6c527716d6ec8",
    gpu: "L40S",
    docker_command_steps: {
      steps: [
        {
          id: "d8665947-0",
          data: "# PARSE DOCKER FILE\nFROM nvidia/cuda:12.6.3-cudnn-devel-ubuntu22.04\nENV TORCH_CUDA_ARCH_LIST=8.9",
          type: "commands",
        },
        {
          id: "b68a6f5d-d-ubuntu24",
          data: "RUN apt-get update && \\\n    apt-get install -yq --no-install-recommends \\\n    build-essential \\\n    git \\\n    git-lfs \\\n    curl \\\n    ninja-build \\\n    ffmpeg \\\n    poppler-utils \\\n    aria2 \\\n    python3-dev \\\n    python3-pip \\\n    software-properties-common \\\n    && apt-get clean \\\n    && rm -rf /var/lib/apt/lists/*\n",
          type: "commands",
        },
        {
          id: "ad1481ee-0",
          data: "# GCC\nRUN apt-get update && \\\n    apt-get install -yq --no-install-recommends \\\n        build-essential \\\n        g++ \\\n        gcc-12 \\\n        g++-12 && \\\n    apt-get clean && \\\n    rm -rf /var/lib/apt/lists/*\n\n\nRUN pip3 install --upgrade pip setuptools wheel",
          type: "commands",
        },
        {
          id: "0e80dd22-9",
          data: '# SET ENVS\n\nENV CUDA_HOME=/usr/local/cuda\nENV PATH=${CUDA_HOME}/bin:${PATH}\nENV LD_LIBRARY_PATH=${CUDA_HOME}/lib64:${LD_LIBRARY_PATH}\nENV CUDA_LAUNCH_BLOCKING=1\nENV TORCH_USE_CUDA_DSA=1\n\nENV TORCH_CUDA_FLAGS="--allow-unsupported-compiler"\nENV CC=/usr/bin/gcc-12\nENV CXX=/usr/bin/g++-12',
          type: "commands",
        },
        {
          id: "a53fb461-1",
          data: "RUN pip install --pre -U xformers torch torchvision torchaudio --index-url https://download.pytorch.org/whl/nightly/cu128",
          type: "commands",
        },
        {
          id: "triton-install",
          data: "# install Triton\nRUN pip install triton\nRUN pip install sageattention\n#RUN MAX_JOBS=4 pip install flash-attn --no-build-isolation",
          type: "commands",
        },
        {
          id: "bnb-env-setup",
          data: "# SET COMPILE\nENV USE_COMPILE_API=1\nENV CUDA_VISIBLE_DEVICES=0",
          type: "commands",
        },
        {
          id: "verify-core",
          data: "# Print\nRUN python3 -c \"import torch; print('PyTorch version:', torch.__version__); print('CUDA available:', torch.cuda.is_available()); print('CUDA version:', torch.version.cuda)\"",
          type: "commands",
        },
        {
          id: "d1780483-6",
          data: {
            url: "https://github.com/kijai/ComfyUI-KJNodes",
            hash: "52c2e31a903fec2dd654fb614ea82ba2757d5028",
            meta: {
              message: "rename CFGZeroStar to avoid conflict",
              committer: {
                date: "2025-03-26T10:29:56.000Z",
                name: "kijai",
                email: "40791699+kijai@users.noreply.github.com",
              },
              commit_url:
                "https://github.com/kijai/ComfyUI-KJNodes/commit/52c2e31a903fec2dd654fb614ea82ba2757d5028",
              latest_hash: "52c2e31a903fec2dd654fb614ea82ba2757d5028",
              stargazers_count: 1090,
            },
            name: "KJNodes for ComfyUI",
            files: [],
            install_type: "git-clone",
          },
          type: "custom-node",
        },
        {
          id: "1dc0e908-e",
          data: "#Moars\nWORKDIR /comfyui/custom_nodes\n \nRUN git clone --recurse-submodules https://github.com/kijai/ComfyUI-Hunyuan3DWrapper.git && \\\n    cd ComfyUI-Hunyuan3DWrapper && \\\n    pip install -r requirements.txt && \\\n    cd hy3dgen/texgen/custom_rasterizer && \\\n    python setup.py install && \\\n    cd ../../../ && \\\n    cd hy3dgen/texgen/custom_rasterizer && \\\n    python setup.py install",
          type: "commands",
        },
        {
          id: "35b86f8b-0",
          data: {
            url: "https://github.com/807502278/ComfyUI-WJNodes",
            hash: "9b1876b0521acbee6423c70b6e5574c9241b52ae",
            meta: {
              message: "Remove printing test information",
              committer: {
                date: "2025-03-27T11:23:48.000Z",
                name: "807502278",
                email: "807502278@qq.com",
              },
              latest_hash: "9b1876b0521acbee6423c70b6e5574c9241b52ae",
            },
            name: "ComfyUI-WJNodes",
            files: ["https://github.com/807502278/ComfyUI-WJNodes"],
            install_type: "git-clone",
          },
          type: "custom-node",
        },
        {
          id: "a4908cbd-0",
          data: {
            url: "https://github.com/cubiq/ComfyUI_essentials",
            hash: "33ff89fd354d8ec3ab6affb605a79a931b445d99",
            meta: {
              message: "interpolate_pos_encoding is not True by default",
              committer: {
                date: "2024-12-07T09:40:22.000Z",
                name: "cubiq",
                email: "matteo@elf.io",
              },
              latest_hash: "33ff89fd354d8ec3ab6affb605a79a931b445d99",
            },
            name: "ComfyUI_essentials",
            files: ["https://github.com/cubiq/ComfyUI_essentials"],
            install_type: "git-clone",
          },
          type: "custom-node",
        },
        {
          id: "e9e91d5e-2",
          data: {
            url: "https://github.com/BennyKok/comfyui-deploy",
            hash: "b889f79baf9e099d5e54bd20bab4aa1e7c3296c0",
            meta: {
              message: "Merge branch 'benny/support-comfy-api-key'",
              committer: {
                date: "2025-05-12T09:06:08.000Z",
                name: "BennyKok",
                email: "itechbenny@gmail.com",
              },
              latest_hash: "b889f79baf9e099d5e54bd20bab4aa1e7c3296c0",
            },
            name: "comfyui-deploy",
            files: ["https://github.com/BennyKok/comfyui-deploy"],
            install_type: "git-clone",
          },
          type: "custom-node",
        },
      ],
    },
    max_containers: 1,
    install_custom_node_with_gpu: false,
    run_timeout: 300,
    scaledown_window: 60,
    extra_docker_commands: null,
    base_docker_image: "nvidia/cuda:12.6.3-cudnn-devel-ubuntu22.04",
    python_version: "3.12",
    extra_args: null,
    prestart_command: null,
    min_containers: 0,
    machine_hash:
      "21ee31c943968cf30362b59ec49682852e7a28826f429da065c1e25582e67146",
    disable_metadata: true,
  },
};

const bagel_workflow = {
  "id": "4d670fa5-e222-4474-b3e5-6c3f211659a8",
  "extra": {
      "ds": {
          "scale": 1.155889959860239,
          "offset": [
              -1736.9676847430605,
              -988.4071267851009
          ]
      },
      "frontendVersion": "1.20.7",
      "VHS_MetadataImage": true,
      "VHS_latentpreview": false,
      "VHS_KeepIntermediate": true,
      "VHS_latentpreviewrate": 0
  },
  "links": [
      [
          1,
          1,
          0,
          2,
          0,
          "BAGEL_MODEL"
      ],
      [
          3,
          2,
          1,
          4,
          0,
          "STRING"
      ],
      [
          9,
          1,
          0,
          7,
          0,
          "BAGEL_MODEL"
      ],
      [
          12,
          7,
          0,
          9,
          0,
          "STRING"
      ],
      [
          29,
          1,
          0,
          26,
          0,
          "BAGEL_MODEL"
      ],
      [
          31,
          26,
          1,
          28,
          0,
          "STRING"
      ],
      [
          32,
          30,
          0,
          2,
          1,
          "STRING"
      ],
      [
          35,
          1,
          0,
          20,
          0,
          "BAGEL_MODEL"
      ],
      [
          36,
          31,
          0,
          20,
          2,
          "STRING"
      ],
      [
          37,
          32,
          0,
          7,
          2,
          "STRING"
      ],
      [
          38,
          19,
          0,
          33,
          0,
          "IMAGE"
      ],
      [
          39,
          33,
          0,
          20,
          1,
          "IMAGE"
      ],
      [
          40,
          20,
          0,
          34,
          0,
          "IMAGE"
      ],
      [
          41,
          7,
          0,
          26,
          1,
          "STRING"
      ],
      [
          42,
          23,
          0,
          35,
          0,
          "IMAGE"
      ],
      [
          43,
          35,
          0,
          7,
          1,
          "IMAGE"
      ],
      [
          45,
          2,
          0,
          37,
          0,
          "IMAGE"
      ],
      [
          51,
          26,
          0,
          42,
          0,
          "IMAGE"
      ],
      [
          58,
          51,
          0,
          47,
          0,
          "IMAGE"
      ],
      [
          59,
          51,
          1,
          49,
          0,
          "STRING"
      ],
      [
          62,
          48,
          0,
          51,
          1,
          "STRING"
      ],
      [
          63,
          51,
          0,
          53,
          0,
          "IMAGE"
      ],
      [
          64,
          1,
          0,
          51,
          0,
          "BAGEL_MODEL"
      ],
      [
          65,
          45,
          0,
          26,
          2,
          "INT"
      ],
      [
          66,
          45,
          0,
          20,
          3,
          "INT"
      ],
      [
          67,
          45,
          0,
          2,
          2,
          "INT"
      ],
      [
          68,
          45,
          0,
          51,
          2,
          "INT"
      ],
      [
          69,
          2,
          0,
          46,
          0,
          "IMAGE"
      ],
      [
          70,
          4,
          0,
          39,
          0,
          "STRING"
      ],
      [
          71,
          9,
          0,
          38,
          0,
          "STRING"
      ],
      [
          72,
          20,
          1,
          54,
          0,
          "STRING"
      ],
      [
          73,
          54,
          0,
          41,
          0,
          "STRING"
      ],
      [
          74,
          49,
          0,
          50,
          0,
          "STRING"
      ],
      [
          75,
          28,
          0,
          40,
          0,
          "STRING"
      ]
  ],
  "nodes": [
      {
          "id": 35,
          "pos": [
              1790.7972412109375,
              63.095176696777344
          ],
          "mode": 0,
          "size": [
              309.1890563964844,
              154
          ],
          "type": "ComfyUIDeployExternalImage",
          "flags": {},
          "order": 8,
          "inputs": [
              {
                  "link": 42,
                  "name": "default_value",
                  "type": "IMAGE",
                  "shape": 7
              }
          ],
          "outputs": [
              {
                  "name": "image",
                  "type": "IMAGE",
                  "links": [
                      43
                  ]
              }
          ],
          "properties": {
              "Node name for S&R": "ComfyUIDeployExternalImage"
          },
          "widgets_values": [
              "ivl_img_input",
              "image-understanding-input",
              "",
              "",
              ""
          ]
      },
      {
          "id": 34,
          "pos": [
              3220.90380859375,
              1188.750244140625
          ],
          "mode": 0,
          "size": [
              281.9683532714844,
              342
          ],
          "type": "ComfyDeployOutputImage",
          "flags": {},
          "order": 22,
          "inputs": [
              {
                  "link": 40,
                  "name": "images",
                  "type": "IMAGE"
              }
          ],
          "outputs": [],
          "properties": {
              "Node name for S&R": "ComfyDeployOutputImage"
          },
          "widgets_values": [
              "ComfyUI",
              "jpg",
              90,
              "output_i2i"
          ]
      },
      {
          "id": 39,
          "pos": [
              3191.69873046875,
              -455.1521301269531
          ],
          "mode": 0,
          "size": [
              270,
              106
          ],
          "type": "ComfyDeployOutputText",
          "flags": {},
          "order": 24,
          "inputs": [
              {
                  "link": 70,
                  "name": "text",
                  "type": "STRING"
              }
          ],
          "outputs": [],
          "properties": {
              "Node name for S&R": "ComfyDeployOutputText"
          },
          "widgets_values": [
              "ComfyUI",
              "txt",
              "output_t2i_thinking"
          ]
      },
      {
          "id": 40,
          "pos": [
              3105.32080078125,
              515.3018798828125
          ],
          "mode": 0,
          "size": [
              270,
              106
          ],
          "type": "ComfyDeployOutputText",
          "flags": {},
          "order": 30,
          "inputs": [
              {
                  "link": 75,
                  "name": "text",
                  "type": "STRING"
              }
          ],
          "outputs": [],
          "properties": {
              "Node name for S&R": "ComfyDeployOutputText"
          },
          "widgets_values": [
              "ComfyUI",
              "txt",
              "output_understanding_thinking"
          ]
      },
      {
          "id": 33,
          "pos": [
              2307.723876953125,
              1204.6800537109375
          ],
          "mode": 0,
          "size": [
              309.1890563964844,
              154
          ],
          "type": "ComfyUIDeployExternalImage",
          "flags": {},
          "order": 9,
          "inputs": [
              {
                  "link": 38,
                  "name": "default_value",
                  "type": "IMAGE",
                  "shape": 7
              }
          ],
          "outputs": [
              {
                  "name": "image",
                  "type": "IMAGE",
                  "links": [
                      39
                  ]
              }
          ],
          "properties": {
              "Node name for S&R": "ComfyUIDeployExternalImage"
          },
          "widgets_values": [
              "i2i_img_input",
              "edit-image-input",
              "",
              "",
              ""
          ]
      },
      {
          "id": 23,
          "pos": [
              1412.9571533203125,
              61.397342681884766
          ],
          "mode": 0,
          "size": [
              274.080078125,
              314.0000305175781
          ],
          "type": "LoadImage",
          "flags": {},
          "order": 0,
          "inputs": [],
          "outputs": [
              {
                  "name": "IMAGE",
                  "type": "IMAGE",
                  "links": [
                      42
                  ]
              },
              {
                  "name": "MASK",
                  "type": "MASK",
                  "links": null
              }
          ],
          "properties": {
              "Node name for S&R": "LoadImage"
          },
          "widgets_values": [
              "1ca61801-5b3a-4e43-bcc1-e64d4f0b0fb4.jpeg",
              "image"
          ]
      },
      {
          "id": 41,
          "pos": [
              3243.80078125,
              1597.9720458984375
          ],
          "mode": 0,
          "size": [
              270,
              106
          ],
          "type": "ComfyDeployOutputText",
          "flags": {},
          "order": 29,
          "inputs": [
              {
                  "link": 73,
                  "name": "text",
                  "type": "STRING"
              }
          ],
          "outputs": [],
          "properties": {
              "Node name for S&R": "ComfyDeployOutputText"
          },
          "widgets_values": [
              "ComfyUI",
              "txt",
              "output_i2i_thinking"
          ]
      },
      {
          "id": 48,
          "pos": [
              1683.343505859375,
              2556.740478515625
          ],
          "mode": 0,
          "size": [
              400,
              200
          ],
          "type": "ComfyUIDeployExternalText",
          "flags": {},
          "order": 1,
          "inputs": [],
          "outputs": [
              {
                  "name": "text",
                  "type": "STRING",
                  "links": [
                      62
                  ]
              }
          ],
          "properties": {
              "Node name for S&R": "ComfyUIDeployExternalText"
          },
          "widgets_values": [
              "prompt_anim",
              "Create a 3d animation of a turtle racing a rabbit aesops fables illustration for childrens",
              "generate-anim-Prompt",
              ""
          ]
      },
      {
          "id": 50,
          "pos": [
              3379.82080078125,
              2622.69189453125
          ],
          "mode": 0,
          "size": [
              270,
              106
          ],
          "type": "ComfyDeployOutputText",
          "flags": {},
          "order": 25,
          "inputs": [
              {
                  "link": 74,
                  "name": "text",
                  "type": "STRING"
              }
          ],
          "outputs": [],
          "properties": {
              "Node name for S&R": "ComfyDeployOutputText"
          },
          "widgets_values": [
              "ComfyUI",
              "txt",
              "output_anim_thinking"
          ]
      },
      {
          "id": 53,
          "pos": [
              3043.62353515625,
              2231.145751953125
          ],
          "mode": 0,
          "size": [
              281.9683532714844,
              342
          ],
          "type": "ComfyDeployOutputImage",
          "flags": {},
          "order": 18,
          "inputs": [
              {
                  "link": 63,
                  "name": "images",
                  "type": "IMAGE"
              }
          ],
          "outputs": [],
          "properties": {
              "Node name for S&R": "ComfyDeployOutputImage"
          },
          "widgets_values": [
              "ComfyUI",
              "jpg",
              90,
              "output_anim"
          ]
      },
      {
          "id": 1,
          "pos": [
              1739.8939208984375,
              -694.58203125
          ],
          "mode": 0,
          "size": [
              315,
              106
          ],
          "type": "BagelModelLoader",
          "flags": {},
          "order": 2,
          "inputs": [],
          "outputs": [
              {
                  "name": "model",
                  "type": "BAGEL_MODEL",
                  "label": "model",
                  "links": [
                      1,
                      9,
                      29,
                      35,
                      64
                  ]
              }
          ],
          "properties": {
              "ver": "4bb49e5232604e4838463f130b3ba7026e428c1d",
              "aux_id": "neverbiasu/ComfyUI-Bagel",
              "Node name for S&R": "BagelModelLoader"
          },
          "widgets_values": [
              "models/BAGEL-7B-MoT",
              "bfloat16"
          ]
      },
      {
          "id": 46,
          "pos": [
              2537.99755859375,
              -406.5367126464844
          ],
          "mode": 0,
          "size": [
              270,
              270
          ],
          "type": "SaveImage",
          "flags": {},
          "order": 15,
          "inputs": [
              {
                  "link": 69,
                  "name": "images",
                  "type": "IMAGE"
              }
          ],
          "outputs": [],
          "properties": {},
          "widgets_values": [
              "ComfyUI"
          ]
      },
      {
          "id": 37,
          "pos": [
              3502.0390625,
              -561.8967895507812
          ],
          "mode": 0,
          "size": [
              281.9683532714844,
              342
          ],
          "type": "ComfyDeployOutputImage",
          "flags": {},
          "order": 14,
          "inputs": [
              {
                  "link": 45,
                  "name": "images",
                  "type": "IMAGE"
              }
          ],
          "outputs": [],
          "properties": {
              "Node name for S&R": "ComfyDeployOutputImage"
          },
          "widgets_values": [
              "ComfyUI",
              "jpg",
              90,
              "output_t2i"
          ]
      },
      {
          "id": 4,
          "pos": [
              2849.72265625,
              -448.93878173828125
          ],
          "mode": 0,
          "size": [
              295.9617614746094,
              404.6077880859375
          ],
          "type": "ShowText|pysssss",
          "flags": {
              "collapsed": false
          },
          "order": 16,
          "inputs": [
              {
                  "link": 3,
                  "name": "text",
                  "type": "STRING",
                  "label": "text"
              }
          ],
          "outputs": [
              {
                  "name": "STRING",
                  "type": "STRING",
                  "label": "STRING",
                  "links": [
                      70
                  ],
                  "shape": 6
              }
          ],
          "properties": {
              "ver": "1.2.5",
              "cnr_id": "comfyui-custom-scripts",
              "Node name for S&R": "ShowText|pysssss"
          },
          "widgets_values": [
              "<think>\nThe image should depict an elderly samurai in traditional Japanese attire, surrounded by autumnal elements like falling leaves and a serene garden setting, with a calm and reflective mood.\nThe comprehensive prompt is: An elderly samurai standing in a tranquil autumn garden, dressed in a weathered kimono with deep crimson and muted gold tones, his face lined with age and wisdom. He grips a sheathed katana with calm reverence, surrounded by gently falling maple leaves and a small koi pond reflecting the amber twilight. The atmosphere is serene and nostalgic, evoking honor, memory, and quiet strength. The scene is bathed in soft, warm lighting, with rich autumnal colors and a peaceful, timeless mood. Ultra-realistic details emphasize the texture of the kimono, the delicate motion of the leaves, and the subtle ripples in the pond, creating a harmonious and evocative composition.\n</think>"
          ]
      },
      {
          "id": 38,
          "pos": [
              2176.451171875,
              846.496337890625
          ],
          "mode": 0,
          "size": [
              270,
              106
          ],
          "type": "ComfyDeployOutputText",
          "flags": {},
          "order": 26,
          "inputs": [
              {
                  "link": 71,
                  "name": "text",
                  "type": "STRING"
              }
          ],
          "outputs": [],
          "properties": {
              "Node name for S&R": "ComfyDeployOutputText"
          },
          "widgets_values": [
              "ComfyUI",
              "txt",
              "output_image_description"
          ]
      },
      {
          "id": 54,
          "pos": [
              2812.54150390625,
              1639.7513427734375
          ],
          "mode": 0,
          "size": [
              295.9617614746094,
              404.6077880859375
          ],
          "type": "ShowText|pysssss",
          "flags": {},
          "order": 23,
          "inputs": [
              {
                  "link": 72,
                  "name": "text",
                  "type": "STRING",
                  "label": "text"
              }
          ],
          "outputs": [
              {
                  "name": "STRING",
                  "type": "STRING",
                  "label": "STRING",
                  "links": [
                      73
                  ],
                  "shape": 6
              }
          ],
          "properties": {
              "ver": "1.2.5",
              "cnr_id": "comfyui-custom-scripts",
              "Node name for S&R": "ShowText|pysssss"
          },
          "widgets_values": []
      },
      {
          "id": 49,
          "pos": [
              3037.84521484375,
              2628.9052734375
          ],
          "mode": 0,
          "size": [
              295.9617614746094,
              404.6077880859375
          ],
          "type": "ShowText|pysssss",
          "flags": {
              "collapsed": false
          },
          "order": 19,
          "inputs": [
              {
                  "link": 59,
                  "name": "text",
                  "type": "STRING",
                  "label": "text"
              }
          ],
          "outputs": [
              {
                  "name": "STRING",
                  "type": "STRING",
                  "label": "STRING",
                  "links": [
                      74
                  ],
                  "shape": 6
              }
          ],
          "properties": {
              "ver": "1.2.5",
              "cnr_id": "comfyui-custom-scripts",
              "Node name for S&R": "ShowText|pysssss"
          },
          "widgets_values": [
              "<think>\nThe model should generate an image showing a turtle and a rabbit in a race, with the turtle moving slowly but steadily and the rabbit appearing to run quickly but ultimately losing to the turtle, emphasizing the moral of the story.\nHere’s the finished detailed prompt: A vibrant and whimsical 3D animation of Aesop's Fables, featuring a turtle and a rabbit racing in a lush, colorful forest setting. The turtle is depicted moving slowly but steadily, its shell glistening with intricate textures, while the rabbit appears to run quickly but is shown slightly behind, emphasizing the moral of the story. The scene is lively and engaging, with dynamic motion and playful expressions on both characters. The lighting is soft and natural, with dappled sunlight filtering through the trees, creating a warm and inviting atmosphere. The background includes detailed foliage, flowers, and a winding path, adding depth and charm. The overall style is cartoonish and child-friendly, with smooth, rounded shapes and bright, harmonious colors.\n</think>"
          ]
      },
      {
          "id": 30,
          "pos": [
              1653.2440185546875,
              -518.94189453125
          ],
          "mode": 0,
          "size": [
              400,
              200
          ],
          "type": "ComfyUIDeployExternalText",
          "flags": {},
          "order": 3,
          "inputs": [],
          "outputs": [
              {
                  "name": "text",
                  "type": "STRING",
                  "links": [
                      32
                  ]
              }
          ],
          "properties": {
              "Node name for S&R": "ComfyUIDeployExternalText"
          },
          "widgets_values": [
              "prompt_t2i",
              "An elderly samurai standing in a tranquil autumn garden, dressed in a weathered kimono with deep crimson and muted gold tones. His face is lined with age and wisdom, and he grips a sheathed katana with calm reverence. Maple leaves drift gently around him, and a small koi pond reflects the amber twilight. The atmosphere is serene and nostalgic, evoking honor, memory, and quiet strength.",
              "generate-image-Prompt",
              ""
          ]
      },
      {
          "id": 31,
          "pos": [
              2196.019287109375,
              1575.060302734375
          ],
          "mode": 0,
          "size": [
              400,
              200
          ],
          "type": "ComfyUIDeployExternalText",
          "flags": {},
          "order": 4,
          "inputs": [],
          "outputs": [
              {
                  "name": "text",
                  "type": "STRING",
                  "links": [
                      36
                  ]
              }
          ],
          "properties": {
              "Node name for S&R": "ComfyUIDeployExternalText"
          },
          "widgets_values": [
              "prompt_i2i",
              "Extend the image 9:16 ratio and generate A full body shot the long side of the image should be 1024",
              "edit-image-prompt",
              ""
          ]
      },
      {
          "id": 42,
          "pos": [
              3123.12255859375,
              62.92445373535156
          ],
          "mode": 0,
          "size": [
              281.9683532714844,
              342
          ],
          "type": "ComfyDeployOutputImage",
          "flags": {},
          "order": 27,
          "inputs": [
              {
                  "link": 51,
                  "name": "images",
                  "type": "IMAGE"
              }
          ],
          "outputs": [],
          "properties": {
              "Node name for S&R": "ComfyDeployOutputImage"
          },
          "widgets_values": [
              "ComfyUI",
              "jpg",
              90,
              "output_understanding_image"
          ]
      },
      {
          "id": 28,
          "pos": [
              2721.386474609375,
              603.6243286132812
          ],
          "mode": 0,
          "size": [
              295.9617614746094,
              404.6077880859375
          ],
          "type": "ShowText|pysssss",
          "flags": {},
          "order": 28,
          "inputs": [
              {
                  "link": 31,
                  "name": "text",
                  "type": "STRING",
                  "label": "text"
              }
          ],
          "outputs": [
              {
                  "name": "STRING",
                  "type": "STRING",
                  "label": "STRING",
                  "links": [
                      75
                  ],
                  "shape": 6
              }
          ],
          "properties": {
              "ver": "1.2.5",
              "cnr_id": "comfyui-custom-scripts",
              "Node name for S&R": "ShowText|pysssss"
          },
          "widgets_values": [
              "<think>\nThe model should generate an image of a person in a crouched position on asphalt, emphasizing street-style fashion with oversized sunglasses, chunky sneakers, and high socks, set against an urban environment.\nHere’s the finished detailed prompt: A dynamic street-style shot featuring a person crouched on asphalt, wearing oversized sunglasses, chunky sneakers, and high socks, with a bold and urban backdrop. The scene is set in a gritty city environment with concrete textures, scattered debris, and muted tones, illuminated by natural daylight. The person’s outfit is modern and edgy, with a focus on oversized silhouettes and bold accessories. The image has a sharp, ultra-realistic quality with cinematic lighting, emphasizing the textures of the asphalt and the urban surroundings, while the person’s pose conveys a sense of movement and confidence.\n</think>"
          ]
      },
      {
          "id": 2,
          "pos": [
              2093.288330078125,
              -562.8455810546875
          ],
          "mode": 0,
          "size": [
              376.3270568847656,
              434.2239685058594
          ],
          "type": "BagelTextToImage",
          "flags": {},
          "order": 10,
          "inputs": [
              {
                  "link": 1,
                  "name": "model",
                  "type": "BAGEL_MODEL",
                  "label": "model"
              },
              {
                  "link": 32,
                  "name": "prompt",
                  "type": "STRING",
                  "widget": {
                      "name": "prompt"
                  }
              },
              {
                  "link": 67,
                  "name": "seed",
                  "type": "INT",
                  "widget": {
                      "name": "seed"
                  }
              }
          ],
          "outputs": [
              {
                  "name": "image",
                  "type": "IMAGE",
                  "label": "image",
                  "links": [
                      45,
                      69
                  ]
              },
              {
                  "name": "thinking",
                  "type": "STRING",
                  "label": "thinking",
                  "links": [
                      3
                  ]
              }
          ],
          "properties": {
              "ver": "4bb49e5232604e4838463f130b3ba7026e428c1d",
              "aux_id": "neverbiasu/ComfyUI-Bagel",
              "Node name for S&R": "BagelTextToImage"
          },
          "widgets_values": [
              "A female cosplayer portraying an ethereal fairy or elf, wearing a flowing dress made of delicate fabrics in soft, mystical colors like emerald green and silver. She has pointed ears, a gentle, enchanting expression, and her outfit is adorned with sparkling jewels and intricate patterns. The background is a magical forest with glowing plants, mystical creatures, and a serene atmosphere.",
              225609,
              "randomize",
              "1:1",
              4,
              50,
              true,
              0.4,
              3,
              0.1,
              "global",
              0.3
          ]
      },
      {
          "id": 26,
          "pos": [
              2604.43115234375,
              80.95854949951172
          ],
          "mode": 0,
          "size": [
              376.3270568847656,
              434.2239685058594
          ],
          "type": "BagelTextToImage",
          "flags": {},
          "order": 21,
          "inputs": [
              {
                  "link": 29,
                  "name": "model",
                  "type": "BAGEL_MODEL",
                  "label": "model"
              },
              {
                  "link": 41,
                  "name": "prompt",
                  "type": "STRING",
                  "widget": {
                      "name": "prompt"
                  }
              },
              {
                  "link": 65,
                  "name": "seed",
                  "type": "INT",
                  "widget": {
                      "name": "seed"
                  }
              }
          ],
          "outputs": [
              {
                  "name": "image",
                  "type": "IMAGE",
                  "label": "image",
                  "links": [
                      51
                  ]
              },
              {
                  "name": "thinking",
                  "type": "STRING",
                  "label": "thinking",
                  "links": [
                      31
                  ]
              }
          ],
          "properties": {
              "ver": "4bb49e5232604e4838463f130b3ba7026e428c1d",
              "aux_id": "neverbiasu/ComfyUI-Bagel",
              "Node name for S&R": "BagelTextToImage"
          },
          "widgets_values": [
              "A female cosplayer portraying an ethereal fairy or elf, wearing a flowing dress made of delicate fabrics in soft, mystical colors like emerald green and silver. She has pointed ears, a gentle, enchanting expression, and her outfit is adorned with sparkling jewels and intricate patterns. The background is a magical forest with glowing plants, mystical creatures, and a serene atmosphere.",
              890412,
              "randomize",
              "1:1",
              4,
              50,
              true,
              0.4,
              3,
              0,
              "global",
              0.3
          ]
      },
      {
          "id": 20,
          "pos": [
              2678.106201171875,
              1189.306640625
          ],
          "mode": 0,
          "size": [
              400,
              372
          ],
          "type": "BagelImageEdit",
          "flags": {},
          "order": 13,
          "inputs": [
              {
                  "link": 35,
                  "name": "model",
                  "type": "BAGEL_MODEL"
              },
              {
                  "link": 39,
                  "name": "image",
                  "type": "IMAGE"
              },
              {
                  "link": 36,
                  "name": "prompt",
                  "type": "STRING",
                  "widget": {
                      "name": "prompt"
                  }
              },
              {
                  "link": 66,
                  "name": "seed",
                  "type": "INT",
                  "widget": {
                      "name": "seed"
                  }
              }
          ],
          "outputs": [
              {
                  "name": "image",
                  "type": "IMAGE",
                  "links": [
                      40
                  ]
              },
              {
                  "name": "thinking",
                  "type": "STRING",
                  "links": [
                      72
                  ]
              }
          ],
          "properties": {
              "Node name for S&R": "BagelImageEdit"
          },
          "widgets_values": [
              "",
              609322,
              "randomize",
              4,
              2,
              50,
              false,
              0,
              3,
              0,
              "text_channel",
              0.3
          ]
      },
      {
          "id": 19,
          "pos": [
              1978.532958984375,
              1204.6800537109375
          ],
          "mode": 0,
          "size": [
              274.080078125,
              314.00006103515625
          ],
          "type": "LoadImage",
          "flags": {},
          "order": 5,
          "inputs": [],
          "outputs": [
              {
                  "name": "IMAGE",
                  "type": "IMAGE",
                  "links": [
                      38
                  ]
              },
              {
                  "name": "MASK",
                  "type": "MASK",
                  "links": null
              }
          ],
          "properties": {
              "Node name for S&R": "LoadImage"
          },
          "widgets_values": [
              "b37b543e-e194-40a2-bb07-88695b530fab.jpeg",
              "image"
          ]
      },
      {
          "id": 32,
          "pos": [
              1236.9964599609375,
              499.2970886230469
          ],
          "mode": 0,
          "size": [
              400,
              200
          ],
          "type": "ComfyUIDeployExternalText",
          "flags": {},
          "order": 6,
          "inputs": [],
          "outputs": [
              {
                  "name": "text",
                  "type": "STRING",
                  "links": [
                      37
                  ]
              }
          ],
          "properties": {
              "Node name for S&R": "ComfyUIDeployExternalText"
          },
          "widgets_values": [
              "prompt_vl",
              "generate a vivid word image description of the image add the art style, aesthetics, type of shot or composition no more than 50 words long",
              "image-uderstanding-Prompt",
              ""
          ]
      },
      {
          "id": 45,
          "pos": [
              1152.972412109375,
              -177.17318725585938
          ],
          "mode": 0,
          "size": [
              400,
              200
          ],
          "type": "ComfyUIDeployExternalNumberInt",
          "flags": {},
          "order": 7,
          "inputs": [],
          "outputs": [
              {
                  "name": "value",
                  "type": "INT",
                  "links": [
                      65,
                      66,
                      67,
                      68
                  ]
              }
          ],
          "properties": {
              "Node name for S&R": "ComfyUIDeployExternalNumberInt"
          },
          "widgets_values": [
              "seed",
              455521445,
              "",
              ""
          ]
      },
      {
          "id": 7,
          "pos": [
              2151.330810546875,
              84.67277526855469
          ],
          "mode": 0,
          "size": [
              400,
              204
          ],
          "type": "BagelImageUnderstanding",
          "flags": {},
          "order": 12,
          "inputs": [
              {
                  "link": 9,
                  "name": "model",
                  "type": "BAGEL_MODEL"
              },
              {
                  "link": 43,
                  "name": "image",
                  "type": "IMAGE"
              },
              {
                  "link": 37,
                  "name": "prompt",
                  "type": "STRING",
                  "widget": {
                      "name": "prompt"
                  }
              }
          ],
          "outputs": [
              {
                  "name": "text",
                  "type": "STRING",
                  "links": [
                      12,
                      41
                  ]
              }
          ],
          "properties": {
              "Node name for S&R": "BagelImageUnderstanding"
          },
          "widgets_values": [
              "What do you see in this image?",
              false,
              false,
              0.3,
              512
          ]
      },
      {
          "id": 9,
          "pos": [
              2162.37158203125,
              366.0086669921875
          ],
          "mode": 0,
          "size": [
              295.9617614746094,
              404.6077880859375
          ],
          "type": "ShowText|pysssss",
          "flags": {},
          "order": 20,
          "inputs": [
              {
                  "link": 12,
                  "name": "text",
                  "type": "STRING",
                  "label": "text"
              }
          ],
          "outputs": [
              {
                  "name": "STRING",
                  "type": "STRING",
                  "label": "STRING",
                  "links": [
                      71
                  ],
                  "shape": 6
              }
          ],
          "properties": {
              "ver": "1.2.5",
              "cnr_id": "comfyui-custom-scripts",
              "Node name for S&R": "ShowText|pysssss"
          },
          "widgets_values": [
              "A dynamic street-style shot captures a person crouched on asphalt, wearing oversized sunglasses, chunky sneakers, and high socks, with a bold, urban backdrop."
          ]
      },
      {
          "id": 47,
          "pos": [
              2710.28076171875,
              2257.26953125
          ],
          "mode": 0,
          "size": [
              210,
              246.00001525878906
          ],
          "type": "PreviewImage",
          "flags": {},
          "order": 17,
          "inputs": [
              {
                  "link": 58,
                  "name": "images",
                  "type": "IMAGE",
                  "label": "images"
              }
          ],
          "outputs": [],
          "properties": {
              "ver": "0.3.30",
              "cnr_id": "comfy-core",
              "Node name for S&R": "PreviewImage"
          },
          "widgets_values": []
      },
      {
          "id": 51,
          "pos": [
              2281.41162109375,
              2514.998291015625
          ],
          "mode": 0,
          "size": [
              376.3270568847656,
              434.2239685058594
          ],
          "type": "BagelTextToImage",
          "flags": {},
          "order": 11,
          "inputs": [
              {
                  "link": 64,
                  "name": "model",
                  "type": "BAGEL_MODEL",
                  "label": "model"
              },
              {
                  "link": 62,
                  "name": "prompt",
                  "type": "STRING",
                  "widget": {
                      "name": "prompt"
                  }
              },
              {
                  "link": 68,
                  "name": "seed",
                  "type": "INT",
                  "widget": {
                      "name": "seed"
                  }
              }
          ],
          "outputs": [
              {
                  "name": "image",
                  "type": "IMAGE",
                  "label": "image",
                  "links": [
                      58,
                      63
                  ]
              },
              {
                  "name": "thinking",
                  "type": "STRING",
                  "label": "thinking",
                  "links": [
                      59
                  ]
              }
          ],
          "properties": {
              "ver": "4bb49e5232604e4838463f130b3ba7026e428c1d",
              "aux_id": "neverbiasu/ComfyUI-Bagel",
              "Node name for S&R": "BagelTextToImage"
          },
          "widgets_values": [
              "A female cosplayer portraying an ethereal fairy or elf, wearing a flowing dress made of delicate fabrics in soft, mystical colors like emerald green and silver. She has pointed ears, a gentle, enchanting expression, and her outfit is adorned with sparkling jewels and intricate patterns. The background is a magical forest with glowing plants, mystical creatures, and a serene atmosphere.",
              368164,
              "randomize",
              "1:1",
              4,
              50,
              true,
              0.4,
              3,
              0,
              "global",
              0.3
          ]
      }
  ],
  "config": {},
  "groups": [],
  "version": 0.4,
  "revision": 0,
  "last_link_id": 75,
  "last_node_id": 55,
  "workflow_api": {
      "1": {
          "_meta": {
              "title": "BAGEL Model Loader"
          },
          "inputs": {
              "precision": "bfloat16",
              "model_path": "models/BAGEL-7B-MoT"
          },
          "class_type": "BagelModelLoader"
      },
      "2": {
          "_meta": {
              "title": "BAGEL Text to Image"
          },
          "inputs": {
              "seed": [
                  "45",
                  0
              ],
              "model": [
                  "1",
                  0
              ],
              "prompt": [
                  "30",
                  0
              ],
              "image_ratio": "1:1",
              "cfg_interval": 0.4,
              "num_timesteps": 50,
              "show_thinking": true,
              "cfg_renorm_min": 0.1,
              "cfg_text_scale": 4,
              "timestep_shift": 3,
              "cfg_renorm_type": "global",
              "text_temperature": 0.3
          },
          "class_type": "BagelTextToImage"
      },
      "4": {
          "_meta": {
              "title": "Show Text 🐍"
          },
          "inputs": {
              "text": [
                  "2",
                  1
              ],
              "text_0": "<think>\nThe image should depict an elderly samurai in traditional Japanese attire, surrounded by autumnal elements like falling leaves and a serene garden setting, with a calm and reflective mood.\nThe comprehensive prompt is: An elderly samurai standing in a tranquil autumn garden, dressed in a weathered kimono with deep crimson and muted gold tones, his face lined with age and wisdom. He grips a sheathed katana with calm reverence, surrounded by gently falling maple leaves and a small koi pond reflecting the amber twilight. The atmosphere is serene and nostalgic, evoking honor, memory, and quiet strength. The scene is bathed in soft, warm lighting, with rich autumnal colors and a peaceful, timeless mood. Ultra-realistic details emphasize the texture of the kimono, the delicate motion of the leaves, and the subtle ripples in the pond, creating a harmonious and evocative composition.\n</think>"
          },
          "class_type": "ShowText|pysssss"
      },
      "7": {
          "_meta": {
              "title": "BAGEL Image Understanding"
          },
          "inputs": {
              "image": [
                  "35",
                  0
              ],
              "model": [
                  "1",
                  0
              ],
              "prompt": [
                  "32",
                  0
              ],
              "do_sample": false,
              "show_thinking": false,
              "max_new_tokens": 512,
              "text_temperature": 0.3
          },
          "class_type": "BagelImageUnderstanding"
      },
      "9": {
          "_meta": {
              "title": "Show Text 🐍"
          },
          "inputs": {
              "text": [
                  "7",
                  0
              ],
              "text_0": "A dynamic street-style shot captures a person crouched on asphalt, wearing oversized sunglasses, chunky sneakers, and high socks, with a bold, urban backdrop."
          },
          "class_type": "ShowText|pysssss"
      },
      "19": {
          "_meta": {
              "title": "Load Image"
          },
          "inputs": {
              "image": "b37b543e-e194-40a2-bb07-88695b530fab.jpeg"
          },
          "class_type": "LoadImage"
      },
      "20": {
          "_meta": {
              "title": "BAGEL Image Edit"
          },
          "inputs": {
              "seed": [
                  "45",
                  0
              ],
              "image": [
                  "33",
                  0
              ],
              "model": [
                  "1",
                  0
              ],
              "prompt": [
                  "31",
                  0
              ],
              "cfg_interval": 0,
              "cfg_img_scale": 2,
              "num_timesteps": 50,
              "show_thinking": false,
              "cfg_renorm_min": 0,
              "cfg_text_scale": 4,
              "timestep_shift": 3,
              "cfg_renorm_type": "text_channel",
              "text_temperature": 0.3
          },
          "class_type": "BagelImageEdit"
      },
      "23": {
          "_meta": {
              "title": "Load Image"
          },
          "inputs": {
              "image": "1ca61801-5b3a-4e43-bcc1-e64d4f0b0fb4.jpeg"
          },
          "class_type": "LoadImage"
      },
      "26": {
          "_meta": {
              "title": "BAGEL Text to Image"
          },
          "inputs": {
              "seed": [
                  "45",
                  0
              ],
              "model": [
                  "1",
                  0
              ],
              "prompt": [
                  "7",
                  0
              ],
              "image_ratio": "1:1",
              "cfg_interval": 0.4,
              "num_timesteps": 50,
              "show_thinking": true,
              "cfg_renorm_min": 0,
              "cfg_text_scale": 4,
              "timestep_shift": 3,
              "cfg_renorm_type": "global",
              "text_temperature": 0.3
          },
          "class_type": "BagelTextToImage"
      },
      "28": {
          "_meta": {
              "title": "Show Text 🐍"
          },
          "inputs": {
              "text": [
                  "26",
                  1
              ],
              "text_0": "<think>\nThe model should generate an image of a person in a crouched position on asphalt, emphasizing street-style fashion with oversized sunglasses, chunky sneakers, and high socks, set against an urban environment.\nHere’s the finished detailed prompt: A dynamic street-style shot featuring a person crouched on asphalt, wearing oversized sunglasses, chunky sneakers, and high socks, with a bold and urban backdrop. The scene is set in a gritty city environment with concrete textures, scattered debris, and muted tones, illuminated by natural daylight. The person’s outfit is modern and edgy, with a focus on oversized silhouettes and bold accessories. The image has a sharp, ultra-realistic quality with cinematic lighting, emphasizing the textures of the asphalt and the urban surroundings, while the person’s pose conveys a sense of movement and confidence.\n</think>"
          },
          "class_type": "ShowText|pysssss"
      },
      "30": {
          "_meta": {
              "title": "External Text (ComfyUI Deploy)"
          },
          "inputs": {
              "input_id": "prompt_t2i",
              "description": "",
              "display_name": "generate-image-Prompt",
              "default_value": "An elderly samurai standing in a tranquil autumn garden, dressed in a weathered kimono with deep crimson and muted gold tones. His face is lined with age and wisdom, and he grips a sheathed katana with calm reverence. Maple leaves drift gently around him, and a small koi pond reflects the amber twilight. The atmosphere is serene and nostalgic, evoking honor, memory, and quiet strength."
          },
          "class_type": "ComfyUIDeployExternalText"
      },
      "31": {
          "_meta": {
              "title": "External Text (ComfyUI Deploy)"
          },
          "inputs": {
              "input_id": "prompt_i2i",
              "description": "",
              "display_name": "edit-image-prompt",
              "default_value": "Extend the image 9:16 ratio and generate A full body shot the long side of the image should be 1024"
          },
          "class_type": "ComfyUIDeployExternalText"
      },
      "32": {
          "_meta": {
              "title": "External Text (ComfyUI Deploy)"
          },
          "inputs": {
              "input_id": "prompt_vl",
              "description": "",
              "display_name": "image-uderstanding-Prompt",
              "default_value": "generate a vivid word image description of the image add the art style, aesthetics, type of shot or composition no more than 50 words long"
          },
          "class_type": "ComfyUIDeployExternalText"
      },
      "33": {
          "_meta": {
              "title": "External Image (ComfyUI Deploy)"
          },
          "inputs": {
              "input_id": "i2i_img_input",
              "description": "",
              "display_name": "edit-image-input",
              "default_value": [
                  "19",
                  0
              ],
              "default_value_url": ""
          },
          "class_type": "ComfyUIDeployExternalImage"
      },
      "34": {
          "_meta": {
              "title": "Image Output (ComfyDeploy)"
          },
          "inputs": {
              "images": [
                  "20",
                  0
              ],
              "quality": 90,
              "file_type": "jpg",
              "output_id": "output_i2i",
              "filename_prefix": "ComfyUI"
          },
          "class_type": "ComfyDeployOutputImage"
      },
      "35": {
          "_meta": {
              "title": "External Image (ComfyUI Deploy)"
          },
          "inputs": {
              "input_id": "ivl_img_input",
              "description": "",
              "display_name": "image-understanding-input",
              "default_value": [
                  "23",
                  0
              ],
              "default_value_url": ""
          },
          "class_type": "ComfyUIDeployExternalImage"
      },
      "37": {
          "_meta": {
              "title": "Image Output (ComfyDeploy)"
          },
          "inputs": {
              "images": [
                  "2",
                  0
              ],
              "quality": 90,
              "file_type": "jpg",
              "output_id": "output_t2i",
              "filename_prefix": "ComfyUI"
          },
          "class_type": "ComfyDeployOutputImage"
      },
      "38": {
          "_meta": {
              "title": "Text Output (ComfyDeploy)"
          },
          "inputs": {
              "text": [
                  "9",
                  0
              ],
              "file_type": "txt",
              "output_id": "output_image_description",
              "filename_prefix": "ComfyUI"
          },
          "class_type": "ComfyDeployOutputText"
      },
      "39": {
          "_meta": {
              "title": "Text Output (ComfyDeploy)"
          },
          "inputs": {
              "text": [
                  "4",
                  0
              ],
              "file_type": "txt",
              "output_id": "output_t2i_thinking",
              "filename_prefix": "ComfyUI"
          },
          "class_type": "ComfyDeployOutputText"
      },
      "40": {
          "_meta": {
              "title": "Text Output (ComfyDeploy)"
          },
          "inputs": {
              "text": [
                  "28",
                  0
              ],
              "file_type": "txt",
              "output_id": "output_understanding_thinking",
              "filename_prefix": "ComfyUI"
          },
          "class_type": "ComfyDeployOutputText"
      },
      "41": {
          "_meta": {
              "title": "Text Output (ComfyDeploy)"
          },
          "inputs": {
              "text": [
                  "54",
                  0
              ],
              "file_type": "txt",
              "output_id": "output_i2i_thinking",
              "filename_prefix": "ComfyUI"
          },
          "class_type": "ComfyDeployOutputText"
      },
      "42": {
          "_meta": {
              "title": "Image Output (ComfyDeploy)"
          },
          "inputs": {
              "images": [
                  "26",
                  0
              ],
              "quality": 90,
              "file_type": "jpg",
              "output_id": "output_understanding_image",
              "filename_prefix": "ComfyUI"
          },
          "class_type": "ComfyDeployOutputImage"
      },
      "45": {
          "_meta": {
              "title": "External Number Int (ComfyUI Deploy)"
          },
          "inputs": {
              "input_id": "seed",
              "description": "",
              "display_name": "",
              "default_value": 455521445
          },
          "class_type": "ComfyUIDeployExternalNumberInt"
      },
      "46": {
          "_meta": {
              "title": "Save Image"
          },
          "inputs": {
              "images": [
                  "2",
                  0
              ],
              "filename_prefix": "ComfyUI"
          },
          "class_type": "SaveImage"
      },
      "47": {
          "_meta": {
              "title": "Preview Image"
          },
          "inputs": {
              "images": [
                  "51",
                  0
              ]
          },
          "class_type": "PreviewImage"
      },
      "48": {
          "_meta": {
              "title": "External Text (ComfyUI Deploy)"
          },
          "inputs": {
              "input_id": "prompt_anim",
              "description": "",
              "display_name": "generate-anim-Prompt",
              "default_value": "Create a 3d animation of a turtle racing a rabbit aesops fables illustration for childrens"
          },
          "class_type": "ComfyUIDeployExternalText"
      },
      "49": {
          "_meta": {
              "title": "Show Text 🐍"
          },
          "inputs": {
              "text": [
                  "51",
                  1
              ],
              "text_0": "<think>\nThe model should generate an image showing a turtle and a rabbit in a race, with the turtle moving slowly but steadily and the rabbit appearing to run quickly but ultimately losing to the turtle, emphasizing the moral of the story.\nHere’s the finished detailed prompt: A vibrant and whimsical 3D animation of Aesop's Fables, featuring a turtle and a rabbit racing in a lush, colorful forest setting. The turtle is depicted moving slowly but steadily, its shell glistening with intricate textures, while the rabbit appears to run quickly but is shown slightly behind, emphasizing the moral of the story. The scene is lively and engaging, with dynamic motion and playful expressions on both characters. The lighting is soft and natural, with dappled sunlight filtering through the trees, creating a warm and inviting atmosphere. The background includes detailed foliage, flowers, and a winding path, adding depth and charm. The overall style is cartoonish and child-friendly, with smooth, rounded shapes and bright, harmonious colors.\n</think>"
          },
          "class_type": "ShowText|pysssss"
      },
      "50": {
          "_meta": {
              "title": "Text Output (ComfyDeploy)"
          },
          "inputs": {
              "text": [
                  "49",
                  0
              ],
              "file_type": "txt",
              "output_id": "output_anim_thinking",
              "filename_prefix": "ComfyUI"
          },
          "class_type": "ComfyDeployOutputText"
      },
      "51": {
          "_meta": {
              "title": "BAGEL Text to Image"
          },
          "inputs": {
              "seed": [
                  "45",
                  0
              ],
              "model": [
                  "1",
                  0
              ],
              "prompt": [
                  "48",
                  0
              ],
              "image_ratio": "1:1",
              "cfg_interval": 0.4,
              "num_timesteps": 50,
              "show_thinking": true,
              "cfg_renorm_min": 0,
              "cfg_text_scale": 4,
              "timestep_shift": 3,
              "cfg_renorm_type": "global",
              "text_temperature": 0.3
          },
          "class_type": "BagelTextToImage"
      },
      "53": {
          "_meta": {
              "title": "Image Output (ComfyDeploy)"
          },
          "inputs": {
              "images": [
                  "51",
                  0
              ],
              "quality": 90,
              "file_type": "jpg",
              "output_id": "output_anim",
              "filename_prefix": "ComfyUI"
          },
          "class_type": "ComfyDeployOutputImage"
      },
      "54": {
          "_meta": {
              "title": "Show Text 🐍"
          },
          "inputs": {
              "text": [
                  "20",
                  1
              ]
          },
          "class_type": "ShowText|pysssss"
      }
  },
  "environment": {
      "comfyui_version": "094306b626e9cf505690c5d8b445032b3b8a36fa",
      "gpu": "L40S",
      "docker_command_steps": {
          "steps": [
              {
                  "id": "d8665947-0",
                  "data": "FROM nvidia/cuda:12.8.1-cudnn-devel-ubuntu24.04\nENV TORCH_CUDA_ARCH_LIST=8.9",
                  "type": "commands"
              },
              {
                  "id": "b68a6f5d-d-ubuntu24",
                  "data": "RUN apt-get update && \\\n    apt-get install -yq --no-install-recommends \\\n    build-essential \\\n    git \\\n    git-lfs \\\n    curl \\\n    ninja-build \\\n    ffmpeg \\\n    poppler-utils \\\n    aria2 \\\n    python3-dev \\\n    python3-pip \\\n    software-properties-common \\\n    && apt-get clean \\\n    && rm -rf /var/lib/apt/lists/*\n\nRUN pip3 install --upgrade pip setuptools wheel",
                  "type": "commands"
              },
              {
                  "id": "0e80dd22-9",
                  "data": "ENV CUDA_HOME=/usr/local/cuda\nENV PATH=${CUDA_HOME}/bin:${PATH}\nENV LD_LIBRARY_PATH=${CUDA_HOME}/lib64:${LD_LIBRARY_PATH}\nENV CUDA_LAUNCH_BLOCKING=1\nENV TORCH_USE_CUDA_DSA=1\n\nRUN if [ -d \"/usr/local/cuda-12.8\" ]; then \\\n      echo \"Linking libraries from /usr/local/cuda-12.8\" && \\\n      ln -sf /usr/local/cuda-12.8/targets/x86_64-linux/lib/libcudart.so /usr/lib/libcudart.so && \\\n      ln -sf /usr/local/cuda-12.8/targets/x86_64-linux/lib/libcublas.so /usr/lib/libcublas.so && \\\n      ln -sf /usr/local/cuda-12.8/targets/x86_64-linux/lib/libcublasLt.so /usr/lib/libcublasLt.so && \\\n      ln -sf /usr/local/cuda-12.8/targets/x86_64-linux/lib/libcufft.so /usr/lib/libcufft.so && \\\n      ln -sf /usr/local/cuda-12.8/targets/x86_64-linux/lib/libnvrtc.so /usr/lib/libnvrtc.so; \\\n    elif [ -d \"/usr/local/cuda\" ]; then \\\n      echo \"Linking libraries from /usr/local/cuda\" && \\\n      ln -sf /usr/local/cuda/targets/x86_64-linux/lib/libcudart.so /usr/lib/libcudart.so && \\\n      ln -sf /usr/local/cuda/targets/x86_64-linux/lib/libcublas.so /usr/lib/libcublas.so && \\\n      ln -sf /usr/local/cuda/targets/x86_64-linux/lib/libcublasLt.so /usr/lib/libcublasLt.so && \\\n      ln -sf /usr/local/cuda/targets/x86_64-linux/lib/libcufft.so /usr/lib/libcufft.so && \\\n      ln -sf /usr/local/cuda/targets/x86_64-linux/lib/libnvrtc.so /usr/lib/libnvrtc.so; \\\n    else \\\n      echo \"Warning: Could not find CUDA directory for symlinking.\" ; \\\n    fi",
                  "type": "commands"
              },
              {
                  "id": "a53fb461-1",
                  "data": "RUN pip install --pre -U xformers torch torchvision torchaudio --index-url https://download.pytorch.org/whl/nightly/cu128",
                  "type": "commands"
              },
              {
                  "id": "triton-install",
                  "data": "\n#install\nRUN pip install triton\nRUN pip install sageattention\n#RUN MAX_JOBS=4 pip install flash-attn --no-build-isolation\n",
                  "type": "commands"
              },
              {
                  "id": "a6b8de0d-5",
                  "data": "RUN pip install https://huggingface.co/impactframes/linux_whl/resolve/main/flash_attn-2.7.4%2Bcu128torch2.7-cp312-cp312-linux_x86_64.whl",
                  "type": "commands"
              },
              {
                  "id": "bnb-env-setup",
                  "data": "ENV BNB_CUDA_VERSION=128\nENV USE_COMPILE_API=1\nENV CUDA_VISIBLE_DEVICES=0",
                  "type": "commands"
              },
              {
                  "id": "verify-core",
                  "data": "RUN python3 -c \"import torch; print('PyTorch version:', torch.__version__); print('CUDA available:', torch.cuda.is_available()); print('CUDA version:', torch.version.cuda)\"",
                  "type": "commands"
              },
              {
                  "id": "verify-bnb",
                  "data": "RUN python3 -c \"import bitsandbytes as bnb; print('BitsAndBytes version:', bnb.__version__)\" || echo \"BitsAndBytes import check complete\"",
                  "type": "commands"
              },
              {
                  "id": "f930aea2-6",
                  "data": {
                      "url": "https://github.com/ltdrdata/ComfyUI-Impact-Pack",
                      "hash": "f8e16df2be0ed2ce914ddd242ef9eadfa386bc2f",
                      "meta": {
                          "message": "bump version",
                          "committer": {
                              "date": "2025-05-18T23:33:30.000Z",
                              "name": "Dr.Lt.Data",
                              "email": "dr.lt.data@gmail.com"
                          },
                          "commit_url": "https://github.com/ltdrdata/ComfyUI-Impact-Pack/commit/f8e16df2be0ed2ce914ddd242ef9eadfa386bc2f",
                          "latest_hash": "f8e16df2be0ed2ce914ddd242ef9eadfa386bc2f",
                          "stargazers_count": 2408
                      },
                      "name": "ComfyUI Impact Pack",
                      "files": [],
                      "install_type": "git-clone"
                  },
                  "type": "custom-node"
              },
              {
                  "id": "87d04892-4",
                  "data": {
                      "url": "https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite",
                      "hash": "a7ce59e381934733bfae03b1be029756d6ce936d",
                      "meta": {
                          "message": "Fix Use Everywhere compatibility",
                          "committer": {
                              "date": "2025-04-26T20:27:20.000Z",
                              "name": "AustinMroz",
                              "email": "austinmroz@utexas.edu"
                          },
                          "commit_url": "https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite/commit/a7ce59e381934733bfae03b1be029756d6ce936d",
                          "latest_hash": "a7ce59e381934733bfae03b1be029756d6ce936d",
                          "stargazers_count": 1000
                      },
                      "name": "ComfyUI-VideoHelperSuite",
                      "files": [],
                      "install_type": "git-clone"
                  },
                  "type": "custom-node"
              },
              {
                  "id": "d1780483-6",
                  "data": {
                      "url": "https://github.com/kijai/ComfyUI-KJNodes",
                      "hash": "44565e9bffc89de454d06b4abe08137d1247652a",
                      "meta": {
                          "message": " Add choice of device for imageresize",
                          "committer": {
                              "date": "2025-05-20T13:50:55.000Z",
                              "name": "kijai",
                              "email": "40791699+kijai@users.noreply.github.com"
                          },
                          "commit_url": "https://github.com/kijai/ComfyUI-KJNodes/commit/44565e9bffc89de454d06b4abe08137d1247652a",
                          "latest_hash": "44565e9bffc89de454d06b4abe08137d1247652a",
                          "stargazers_count": 1362
                      },
                      "name": "KJNodes for ComfyUI",
                      "files": [],
                      "install_type": "git-clone"
                  },
                  "type": "custom-node"
              },
              {
                  "id": "85df8805-8",
                  "data": {
                      "url": "https://github.com/rgthree/rgthree-comfy",
                      "hash": "5288408220180af41ce50b0d29135e1ef5f83fdb",
                      "meta": {
                          "message": "Save the Display Any response to the pnginfo so it pre-exists when reloading the workflow.",
                          "committer": {
                              "date": "2025-05-19T03:59:31.000Z",
                              "name": "rgthree",
                              "email": "regis.gaughan@gmail.com"
                          },
                          "commit_url": "https://github.com/rgthree/rgthree-comfy/commit/5288408220180af41ce50b0d29135e1ef5f83fdb",
                          "latest_hash": "5288408220180af41ce50b0d29135e1ef5f83fdb",
                          "stargazers_count": 1880
                      },
                      "name": "rgthree's ComfyUI Nodes",
                      "files": [],
                      "install_type": "git-clone"
                  },
                  "type": "custom-node"
              },
              {
                  "id": "bf80e067-a",
                  "data": {
                      "url": "https://github.com/chflame163/ComfyUI_LayerStyle",
                      "hash": "a46b1e6d26d45be9784c49f7065ba44700ef2b63",
                      "meta": {
                          "message": "update readme images",
                          "committer": {
                              "date": "2025-05-17T12:58:01.000Z",
                              "name": "chflame163",
                              "email": "chflame@163.com"
                          },
                          "commit_url": "https://github.com/chflame163/ComfyUI_LayerStyle/commit/a46b1e6d26d45be9784c49f7065ba44700ef2b63",
                          "latest_hash": "a46b1e6d26d45be9784c49f7065ba44700ef2b63",
                          "stargazers_count": 2258
                      },
                      "name": "ComfyUI Layer Style",
                      "files": [],
                      "install_type": "git-clone"
                  },
                  "type": "custom-node"
              },
              {
                  "id": "4ab30b1c-4",
                  "data": {
                      "url": "https://github.com/cubiq/ComfyUI_essentials",
                      "hash": "9d9f4bedfc9f0321c19faf71855e228c93bd0dc9",
                      "meta": {
                          "message": "maintenance mode",
                          "committer": {
                              "date": "2025-04-14T07:33:21.000Z",
                              "name": "cubiq",
                              "email": "matteo@elf.io"
                          },
                          "commit_url": "https://github.com/cubiq/ComfyUI_essentials/commit/9d9f4bedfc9f0321c19faf71855e228c93bd0dc9",
                          "latest_hash": "9d9f4bedfc9f0321c19faf71855e228c93bd0dc9",
                          "stargazers_count": 836
                      },
                      "name": "ComfyUI Essentials",
                      "files": [],
                      "install_type": "git-clone"
                  },
                  "type": "custom-node"
              },
              {
                  "id": "8bfd5b9e-6",
                  "data": {
                      "url": "https://github.com/sipherxyz/comfyui-art-venture",
                      "hash": "fc00f4a094be1ba41d6c7bfcc157fb075d289573",
                      "meta": {
                          "message": "fix(web): error when redefine value property",
                          "committer": {
                              "date": "2025-04-15T08:23:05.000Z",
                              "name": "Tung Nguyen",
                              "email": "tung.nguyen@atherlabs.com"
                          },
                          "commit_url": "https://github.com/sipherxyz/comfyui-art-venture/commit/fc00f4a094be1ba41d6c7bfcc157fb075d289573",
                          "latest_hash": "fc00f4a094be1ba41d6c7bfcc157fb075d289573",
                          "stargazers_count": 253
                      },
                      "name": "comfyui-art-venture",
                      "files": [],
                      "install_type": "git-clone"
                  },
                  "type": "custom-node"
              },
              {
                  "id": "ffe77db4-f",
                  "data": {
                      "url": "https://github.com/comfy-deploy/comfyui-llm-toolkit",
                      "hash": "ed2cb7e9989e1405c95cd7a057d8bcca0aa94230",
                      "meta": {
                          "message": "Add files via upload",
                          "committer": {
                              "date": "2025-05-24T13:25:38.000Z",
                              "name": "GitHub",
                              "email": "noreply@github.com"
                          },
                          "commit_url": "https://github.com/comfy-deploy/comfyui-llm-toolkit/commit/ed2cb7e9989e1405c95cd7a057d8bcca0aa94230",
                          "latest_hash": "ed2cb7e9989e1405c95cd7a057d8bcca0aa94230",
                          "stargazers_count": 12
                      },
                      "name": "ComfyUI LLM Toolkit",
                      "files": [],
                      "install_type": "git-clone"
                  },
                  "type": "custom-node"
              },
              {
                  "id": "4387e0dd-3",
                  "data": {
                      "url": "https://github.com/pythongosssss/ComfyUI-Custom-Scripts",
                      "hash": "aac13aa7ce35b07d43633c3bbe654a38c00d74f5",
                      "meta": {
                          "message": "Update pyproject.toml",
                          "committer": {
                              "date": "2025-04-30T12:00:09.000Z",
                              "name": "GitHub",
                              "email": "noreply@github.com"
                          },
                          "latest_hash": "aac13aa7ce35b07d43633c3bbe654a38c00d74f5"
                      },
                      "name": "ComfyUI-Custom-Scripts",
                      "files": [
                          "https://github.com/pythongosssss/ComfyUI-Custom-Scripts"
                      ],
                      "install_type": "git-clone"
                  },
                  "type": "custom-node"
              },
              {
                  "id": "35d617c0-f",
                  "data": "# 2) Install all other requirements from default PyPI\nRUN pip3 install --no-cache-dir \\\n    accelerate \\\n    decord \\\n    einops \\\n    huggingface_hub \\\n    matplotlib \\\n    numpy \\\n    opencv_python \\\n    pyarrow \\\n    PyYAML \\\n    requests \\\n    safetensors \\\n    scipy \\\n    sentencepiece \\\n    transformers \\\n    bitsandbytes \\    \n    wandb",
                  "type": "commands"
              },
              {
                  "id": "comfyui-deploy",
                  "data": {
                      "url": "https://github.com/BennyKok/comfyui-deploy",
                      "hash": "7b734c415aabd51b8bb8fad9fd719055b5ba359d",
                      "meta": {
                          "message": "fix: import",
                          "committer": {
                              "date": "2025-05-27T07:14:29.000Z",
                              "name": "BennyKok",
                              "email": "itechbenny@gmail.com"
                          },
                          "commit_url": "https://github.com/BennyKok/comfyui-deploy/commit/7b734c415aabd51b8bb8fad9fd719055b5ba359d",
                          "latest_hash": "7b734c415aabd51b8bb8fad9fd719055b5ba359d",
                          "stargazers_count": 1335
                      },
                      "name": "ComfyUI Deploy",
                      "files": [
                          "https://github.com/BennyKok/comfyui-deploy"
                      ],
                      "install_type": "git-clone"
                  },
                  "type": "custom-node"
              },
              {
                  "id": "cad23787-8",
                  "data": {
                      "url": "https://github.com/city96/ComfyUI-GGUF",
                      "hash": "a2b75978fd50c0227a58316619b79d525b88e570",
                      "meta": {
                          "message": "Create pyproject.toml",
                          "committer": {
                              "date": "2025-05-08T23:08:35.000Z",
                              "name": "City",
                              "email": "125218114+city96@users.noreply.github.com"
                          },
                          "latest_hash": "a2b75978fd50c0227a58316619b79d525b88e570"
                      },
                      "name": "ComfyUI-GGUF",
                      "files": [
                          "https://github.com/city96/ComfyUI-GGUF"
                      ],
                      "install_type": "git-clone"
                  },
                  "type": "custom-node"
              },
              {
                  "id": "b9fa9cae-8",
                  "data": {
                      "url": "https://github.com/if-ai/BAGEL.git",
                      "hash": "07dd135c45eb6c2843e0b478776ca49f4297de74",
                      "meta": {
                          "message": "Fix: Remove undefined 'seed' variable call in ImageUnderstanding",
                          "committer": {
                              "date": "2025-05-30T06:24:09.000Z",
                              "name": "impactframes",
                              "email": "if@impactframes.ai"
                          },
                          "commit_url": "https://github.com/if-ai/BAGEL/commit/07dd135c45eb6c2843e0b478776ca49f4297de74",
                          "latest_hash": "07dd135c45eb6c2843e0b478776ca49f4297de74",
                          "stargazers_count": 0
                      },
                      "name": "BAGEL.git",
                      "files": [
                          "https://github.com/if-ai/BAGEL.git"
                      ],
                      "install_type": "git-clone"
                  },
                  "type": "custom-node"
              }
          ]
      },
      "max_containers": 2,
      "install_custom_node_with_gpu": false,
      "run_timeout": 300,
      "scaledown_window": 60,
      "extra_docker_commands": [],
      "base_docker_image": "nvidia/cuda:12.6.3-cudnn-devel-ubuntu22.04",
      "python_version": "3.12",
      "extra_args": null,
      "prestart_command": null,
      "min_containers": 0,
      "machine_hash": "610da88340d2be9d3e520d84b384a7b7dd45b3825652e4fc885b8173f1d7df5d",
      "disable_metadata": true
  }
};

export const defaultWorkflowTemplates: defaultWorkflowTemplateType[] = [
  {
    workflowId: "sd1.5",
    workflowName: "Stable Diffusion v1.5",
    workflowDescription: "Text to image with sd 1.5 base model. ",
    workflowJson: JSON.stringify(sd1_5),
    workflowApi: JSON.stringify(sd1_5_api),
    workflowImageUrl:
      "https://comfy-deploy-output.s3.amazonaws.com/outputs/runs/ae92370b-315a-4578-af29-ed83b00828d1/ComfyUI_00001_.png",
  },
  {
    workflowId: "flux",
    workflowName: "Flux Dev [fp8]",
    workflowDescription:
      "Text to image with Flux model, most popular and stunning model.",
    workflowJson: JSON.stringify(workflow_json_flux),
    workflowImageUrl:
      "https://comfy-deploy-output.s3.amazonaws.com/outputs/runs/3ee76358-51c6-4c61-ba4d-49de5d1b8b82/ComfyUI_00002_.webp",
    hasEnvironment: true,
  },
  {
    workflowId: "hunyuan3d",
    workflowName: "Hunyuan 3D",
    workflowDescription: "Image to 3D generation with Hunyuan3D model.",
    workflowJson: JSON.stringify(workflow_json_hunyuan3d),
    workflowImageUrl:
      "https://comfy-deploy-output-dev.s3.us-east-2.amazonaws.com/assets/file_sCSjHLFXvgq6WtE7.glb",
    hasEnvironment: true,
  },
  {
    workflowId: "bagel",
    workflowName: "BAGEL",
    workflowDescription: "BAGEL workflow for text to image and image editing.",
    workflowJson: JSON.stringify(bagel_workflow),
    workflowImageUrl: "", 
    hasEnvironment: true, 
  }
];
