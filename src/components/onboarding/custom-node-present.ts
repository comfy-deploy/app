export interface NodePreset {
  url: string;
  steps: any[];
}

export const CUSTOM_NODE_PRESETS: NodePreset[] = [
  {
    url: "https://github.com/kijai/ComfyUI-Hunyuan3DWrapper",
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
        id: "1dc0e908-e",
        data: "#Moars\nWORKDIR /comfyui/custom_nodes\n \nRUN git clone --recurse-submodules https://github.com/kijai/ComfyUI-Hunyuan3DWrapper.git && \\\n    cd ComfyUI-Hunyuan3DWrapper && \\\n    pip install -r requirements.txt && \\\n    cd hy3dgen/texgen/custom_rasterizer && \\\n    python setup.py install && \\\n    cd ../../../ && \\\n    cd hy3dgen/texgen/custom_rasterizer && \\\n    python setup.py install",
        type: "commands",
      },
    ],
  },
  {
    url: "https://github.com/if-ai/ComfyUI-IF_Trellis",

    steps: [
      {
        id: "4c3779a6-7",
        data: "# CUDA image docker pull nvidia/cuda:12.1.0-cudnn8-devel-ubuntu22.04\n\nFROM nvidia/cuda:12.1.0-cudnn8-devel-ubuntu22.04\n# For A10G is 8.6 L40s 8.9\nENV TORCH_CUDA_ARCH_LIST=8.9",
        type: "commands",
      },
      {
        id: "2b543063-e",
        data: "# BUILDS \nRUN apt-get update && \\\n    apt-get install -yq --no-install-recommends \\\n    python3 \\\n    python3-dev \\\n    git \\\n    git-lfs \\\n    curl \\\n    ninja-build \\\n    ffmpeg \\\n    aria2\n\n\nRUN apt-get update && \\\n    apt-get install -yq --no-install-recommends \\\n        build-essential \\\n        g++ \\\n        gcc-12 \\\n        g++-12 && \\\n    apt-get clean && \\\n    rm -rf /var/lib/apt/lists/*\n\n\nRUN pip install --upgrade pip setuptools wheel\n",
        type: "commands",
      },
      {
        id: "aa7f3a42-2",
        data: '# list cuda path\nRUN ls -l /usr/local/cuda && \\\n    echo "CUDA Home content:" && \\\n    ls -l /usr/local/cuda-12.1 && \\\n    echo "Library path:" && \\\n    ls -l /usr/local/cuda/lib64',
        type: "commands",
      },
      {
        id: "b09a6324-5",
        data: "# EVNS\nENV CUDA_HOME=/usr/local/cuda\nENV PATH=${CUDA_HOME}/bin:${PATH}\nENV LD_LIBRARY_PATH=${CUDA_HOME}/lib64:${LD_LIBRARY_PATH}",
        type: "commands",
      },
      {
        id: "38b50416-8",
        data: '# SET ENVS\n# ENV LD_LIBRARY_PATH=/usr/local/cuda-12.1/lib64:/usr/lib/x86_64-linux-gnu\n# ENV PATH=/usr/local/cuda-12.1/bin:$PATH\n# ENV CUDA_HOME=/usr/local/cuda-12.1\nENV TORCH_CUDA_FLAGS="--allow-unsupported-compiler"\nENV CC=/usr/bin/gcc-12\nENV CXX=/usr/bin/g++-12',
        type: "commands",
      },
      {
        id: "d65521df-2",
        data: "# pypi\nRUN curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py \\\n    && python3 get-pip.py \\\n    && rm get-pip.py\n\n\n# COMFY\nWORKDIR /comfyui\nRUN pip install -r requirements.txt",
        type: "commands",
      },
      {
        id: "0b31acdc-c",
        data: "# XFORMERS\nRUN pip install -U xformers torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121\n\n\n# TRANSFORMERS\nRUN pip install bitsandbytes\nRUN pip uninstall -y accelerate transformers\nRUN pip install accelerate==1.2.0\nRUN pip install transformers==4.47.0\n\n\n# BASIC\nRUN pip install \\\n    pillow imageio imageio-ffmpeg tqdm easydict opencv-python-headless scipy ninja trimesh xatlas pyvista pymeshfix igraph av ffmpeg\nRUN pip install git+https://github.com/EasternJournalist/utils3d.git@9a4eb15e4021b67b12c460c7057d642626897ec8\n\n# TRITON\nRUN pip install triton\n\n\n# FLASHATTN\nRUN pip install flash-attn\n\n\n# KAOLIN\nRUN pip install kaolin -f https://nvidia-kaolin.s3.us-east-2.amazonaws.com/torch-2.5.1_cu121.html",
        type: "commands",
      },
      {
        id: "125cf593-b",
        data: '# NVDIFFRAST 729261d\nRUN pip install git+https://github.com/NVlabs/nvdiffrast.git\n\n\n# DIFFOCTREERAST\nRUN mkdir -p /tmp/extensions/diffoctreerast && \\\n    git clone --recurse-submodules https://github.com/JeffreyXiang/diffoctreerast.git /tmp/extensions/diffoctreerast && \\\n    cd /tmp/extensions/diffoctreerast && \\\n    pip install build wheel setuptools && \\\n    NVCC_FLAGS="--allow-unsupported-compiler" python setup.py bdist_wheel && \\\n    pip install dist/*.whl\n\n\n# MIPGAUSSIAN\nRUN mkdir -p /tmp/extensions/mip-splatting && \\\n    git clone --recurse-submodules https://github.com/autonomousvision/mip-splatting.git /tmp/extensions/mip-splatting && \\\n    cd /tmp/extensions/mip-splatting/submodules/diff-gaussian-rasterization && \\\n    pip install build wheel setuptools && \\\n    NVCC_FLAGS="--allow-unsupported-compiler" python setup.py bdist_wheel && \\\n    pip install /tmp/extensions/mip-splatting/submodules/diff-gaussian-rasterization/dist/*.whl',
        type: "commands",
      },
      {
        id: "524a4b96-3",
        data: '# TRELLIS\nWORKDIR /comfyui/custom_nodes\nRUN git clone --recurse-submodules https://github.com/if-ai/ComfyUI-IF_Trellis.git --recursive\nWORKDIR /comfyui/custom_nodes/ComfyUI-IF_Trellis\nRUN git reset --hard f3174221c3703e7a181dca381a4280c3a39213bb\nRUN if [ -f requirements.txt ]; then python -m pip install -r requirements.txt; fi\nRUN if [ -f install.py ]; then python install.py || echo "install script failed"; fi\n\n\n# VOX2SEQ\nRUN pip install /comfyui/custom_nodes/ComfyUI-IF_Trellis/extensions/vox2seq\n\n\n#ONNX\nRUN pip install flatbuffers numpy packaging protobuf sympy\n# Uninstall existing packages\nRUN pip uninstall -y tensorrt onnx onnxruntime onnxruntime-gpu\n\n\n# Install required packages\nRUN pip install "tensorrt>=10.2" \\\n    "onnx==1.17.0" \\\n    "onnx2torch==1.5.15" \\\n    "onnxruntime-gpu==1.20.1" \\\n    "onnxruntime==1.20.1" \n\n\n# First install TensorRT\nRUN pip install tensorrt\n\n\n# ADD MORE LIBS\nENV LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/usr/lib/x86_64-linux-gnu\n\n\n# SPCONV\nRUN pip uninstall -y spconv cumm\nRUN pip install spconv-cu120',
        type: "commands",
      },
      {
        id: "922fdd29-0",
        data: "# SAGE\nRUN pip install sageattention\n",
        type: "commands",
      },
    ],
  },
];
