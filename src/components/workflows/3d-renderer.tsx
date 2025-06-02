import { cn } from "@/lib/utils";
import { useGLTF, Html, OrbitControls } from "@react-three/drei";
import { Canvas, useLoader } from "@react-three/fiber";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Grid,
  Axis3D,
  RotateCcw,
  Sun,
  Settings,
  Box,
} from "lucide-react";
import { useMemo, useEffect, useState, Suspense } from "react";
import * as THREE from "three";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import {
  GLTFLoader,
  type GLTF,
} from "three/examples/jsm/loaders/GLTFLoader.js";
import { Environment } from "@react-three/drei";

// Global thumbnail cache to avoid regenerating same thumbnails
const thumbnailCache = new Map<string, string>();

// Shared WebGL context for thumbnail generation
let sharedRenderer: THREE.WebGLRenderer | null = null;
let sharedScene: THREE.Scene | null = null;
let sharedCamera: THREE.PerspectiveCamera | null = null;

// Queue system to prevent simultaneous thumbnail generation
let isGenerating = false;
const generationQueue: Array<{
  url: string;
  resolve: (dataUrl: string) => void;
  reject: (error: unknown) => void;
}> = [];

function initSharedRenderer() {
  if (!sharedRenderer) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;

    sharedRenderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    sharedRenderer.setSize(256, 256);
    sharedRenderer.setClearColor(0xf5f5f5, 1);
    sharedRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    sharedRenderer.toneMappingExposure = 1;

    sharedScene = new THREE.Scene();
    sharedCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    sharedCamera.position.set(0, 0, 5);

    // Add enhanced lighting to match the main renderer
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3);

    directionalLight1.position.set(5, 5, 5);
    directionalLight2.position.set(-5, 5, -5);

    sharedScene.add(ambientLight);
    sharedScene.add(directionalLight1);
    sharedScene.add(directionalLight2);

    // Add environment map for better lighting (neutral white instead of sunset)
    const pmremGenerator = new THREE.PMREMGenerator(sharedRenderer);
    pmremGenerator.compileEquirectangularShader();

    // Create a neutral white environment map
    const envMapCanvas = document.createElement("canvas");
    envMapCanvas.width = 512;
    envMapCanvas.height = 256;
    const ctx = envMapCanvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get context");
    }

    // Create neutral white gradient (light gray to white)
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, "#ffffff"); // white top
    gradient.addColorStop(0.5, "#f8f8f8"); // light gray middle
    gradient.addColorStop(1, "#e8e8e8"); // light gray bottom

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 256);

    const envTexture = new THREE.CanvasTexture(envMapCanvas);
    envTexture.mapping = THREE.EquirectangularReflectionMapping;

    const envMap = pmremGenerator.fromEquirectangular(envTexture).texture;
    sharedScene.environment = envMap;

    envTexture.dispose();
    pmremGenerator.dispose();
  }
}

async function processQueue() {
  if (isGenerating || generationQueue.length === 0) {
    return;
  }

  isGenerating = true;
  const { url, resolve, reject } = generationQueue.shift()!;

  try {
    const result = await generateThumbnailInternal(url);
    resolve(result);
  } catch (error) {
    reject(error);
  } finally {
    isGenerating = false;
    // Process next item in queue
    setTimeout(processQueue, 50); // Small delay to ensure cleanup
  }
}

async function generateThumbnail(url: string): Promise<string> {
  // Check cache first
  const cached = thumbnailCache.get(url);
  if (cached) {
    return cached;
  }

  return new Promise((resolve, reject) => {
    generationQueue.push({ url, resolve, reject });
    processQueue();
  });
}

async function generateThumbnailInternal(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      initSharedRenderer();

      if (!sharedRenderer || !sharedScene || !sharedCamera) {
        throw new Error("Failed to initialize shared renderer");
      }

      // Clear the entire scene (except lights) completely
      const children = [...sharedScene.children]; // Create a copy to avoid mutation during iteration
      for (const child of children) {
        if (
          !(child instanceof THREE.Light) &&
          child.type !== "AmbientLight" &&
          child.type !== "DirectionalLight"
        ) {
          sharedScene.remove(child);

          // Dispose recursively
          child.traverse((obj) => {
            if (obj instanceof THREE.Mesh) {
              obj.geometry?.dispose();
              if (Array.isArray(obj.material)) {
                for (const mat of obj.material) {
                  mat?.dispose();
                }
              } else {
                obj.material?.dispose();
              }
            }
          });
        }
      }

      const fileExtension = url.split(".").pop()?.toLowerCase();

      if (fileExtension === "obj") {
        const loader = new OBJLoader();
        loader.load(
          url,
          (obj) => {
            processModel(obj, url, resolve, reject);
          },
          undefined,
          reject,
        );
      } else {
        const loader = new GLTFLoader();
        loader.setCrossOrigin("anonymous");
        loader.load(
          url,
          (gltf: GLTF) => {
            processModel(gltf.scene, url, resolve, reject);
          },
          undefined,
          reject,
        );
      }
    } catch (error) {
      reject(error);
    }
  });
}

function processModel(
  model: THREE.Object3D,
  url: string,
  resolve: (dataUrl: string) => void,
  reject: (error: unknown) => void,
) {
  try {
    if (!sharedRenderer || !sharedScene || !sharedCamera) {
      throw new Error("Shared renderer not initialized");
    }

    const clonedModel = model.clone();
    clonedModel.name = "thumbnail-model";

    // Center and scale the model
    const box = new THREE.Box3().setFromObject(clonedModel);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    clonedModel.position.x = -center.x;
    clonedModel.position.y = -center.y;
    clonedModel.position.z = -center.z;

    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const scale = 2 / maxDim;
      clonedModel.scale.set(scale, scale, scale);
    }

    sharedScene.add(clonedModel);

    // Render and capture
    sharedRenderer.render(sharedScene, sharedCamera);
    const dataUrl = sharedRenderer.domElement.toDataURL("image/png", 0.8);

    // Cache the result
    thumbnailCache.set(url, dataUrl);

    resolve(dataUrl);
  } catch (error) {
    reject(error);
  }
}

function Model({ url }: { url: string }) {
  const fileExtension = url.split(".").pop()?.toLowerCase();

  let modelScene: THREE.Object3D;

  if (fileExtension === "obj") {
    // Handle OBJ files
    const obj = useLoader(OBJLoader, url);
    modelScene = obj;
  } else {
    // Handle GLB/GLTF files (default)
    useGLTF.preload(url);
    const { scene } = useGLTF(url, undefined, undefined, (loader) => {
      loader.setCrossOrigin("anonymous");
    });
    modelScene = scene;
  }

  const clonedScene = useMemo(() => modelScene.clone(), [modelScene]);

  useEffect(() => {
    if (clonedScene) {
      const box = new THREE.Box3().setFromObject(clonedScene);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      clonedScene.position.x = -center.x;
      clonedScene.position.y = -center.y;
      clonedScene.position.z = -center.z;

      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0) {
        const scale = 2 / maxDim;
        clonedScene.scale.set(scale, scale, scale);
      }
    }
  }, [clonedScene]);

  return <primitive object={clonedScene} />;
}

// Loading indicator for 3D models
function ModelLoader() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center gap-2 text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    </Html>
  );
}

// Main renderer component
function ModelRendererComponent({
  url,
  mediaClasses,
  isMainView = false,
  isSmallView = false,
}: {
  url: string;
  mediaClasses?: string;
  isMainView?: boolean;
  isSmallView?: boolean;
}) {
  const [showControls, setShowControls] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [lightIntensity, setLightIntensity] = useState(4);
  const [autoRotate, setAutoRotate] = useState(!isMainView);
  const [hoveredControl, setHoveredControl] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);

  // Generate thumbnail for small views
  useEffect(() => {
    if (isSmallView && !thumbnail && !isGeneratingThumbnail) {
      setIsGeneratingThumbnail(true);
      generateThumbnail(url)
        .then((dataUrl) => {
          setThumbnail(dataUrl);
          setIsGeneratingThumbnail(false);
        })
        .catch((error) => {
          console.error("Failed to generate thumbnail:", error);
          setIsGeneratingThumbnail(false);
        });
    }
  }, [url, isSmallView, thumbnail, isGeneratingThumbnail]);

  // If it's a small view, show thumbnail or loading state
  if (isSmallView) {
    if (thumbnail) {
      return (
        <div
          className={cn(
            "!shadow-none relative h-[70vh] w-[70vh]",
            mediaClasses,
          )}
        >
          <img
            src={thumbnail}
            alt="3D Model Thumbnail"
            className="h-full w-full rounded-lg bg-gray-100 object-contain dark:bg-gray-800"
          />
          <Box size={12} className="absolute right-0 bottom-0 dark:shadow-lg" />
        </div>
      );
    }

    return (
      <div
        className={cn("!shadow-none relative h-[70vh] w-[70vh]", mediaClasses)}
      >
        <div className="flex h-full w-full items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  // Control items configuration
  const controlItems = [
    {
      id: "grid",
      icon: <Grid size={16} />,
      label: "Grid",
      value: showGrid,
      onChange: setShowGrid,
      type: "toggle",
    },
    {
      id: "axes",
      icon: <Axis3D size={16} />,
      label: "Axes",
      value: showAxes,
      onChange: setShowAxes,
      type: "toggle",
    },
    {
      id: "rotate",
      icon: <RotateCcw size={16} />,
      label: "Auto Rotate",
      value: autoRotate,
      onChange: setAutoRotate,
      type: "toggle",
    },
    {
      id: "light",
      icon: <Sun size={16} />,
      label: "Light",
      value: lightIntensity,
      onChange: setLightIntensity,
      min: 0,
      max: 10,
      step: 0.1,
      type: "slider",
    },
  ];

  return (
    <div
      className={cn("!shadow-none relative h-[70vh] w-[70vh]", mediaClasses)}
    >
      <Canvas
        shadows
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
        }}
        performance={{ min: 0.5 }}
      >
        {/* Modify lighting setup */}
        <ambientLight intensity={lightIntensity} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={lightIntensity * 0.25}
          castShadow
        />
        <directionalLight
          position={[-5, 5, -5]}
          intensity={lightIntensity * 0.125}
        />

        {/* Add environment lighting */}
        <Environment preset="sunset" />

        <Suspense fallback={<ModelLoader />}>
          <Model url={url} />

          {/* Enhanced features for main view only */}
          {isMainView && (
            <>
              {/* Grid helper - conditionally rendered */}
              {showGrid && <gridHelper args={[20, 20, "#666666", "#444444"]} />}

              {/* Axis helper - conditionally rendered */}
              {showAxes && <axesHelper args={[5]} />}

              {/* Ground plane with shadow */}
              <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, -1, 0]}
                receiveShadow
              >
                <planeGeometry args={[20, 20]} />
                <shadowMaterial opacity={0.2} />
              </mesh>
            </>
          )}
        </Suspense>

        <OrbitControls
          autoRotate={autoRotate}
          autoRotateSpeed={1}
          enableZoom={true}
          enablePan={true}
          minDistance={1}
          maxDistance={20}
          makeDefault
        />
      </Canvas>

      {/* Bubble Controls - only for main view */}
      {isMainView && (
        <div className="absolute right-4 bottom-4 z-10">
          {/* Fixed position container for all controls */}
          <div className="relative">
            {/* Main control button - fixed position */}
            <motion.button
              type="button"
              onClick={() => setShowControls(!showControls)}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-black/70 text-white shadow-lg backdrop-blur-md transition-all hover:bg-black/90"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.1 }}
            >
              <Settings
                size={20}
                className={cn(
                  "transition-transform duration-200",
                  showControls && "rotate-90",
                )}
              />
            </motion.button>

            {/* Bubble controls - absolute positioned relative to the fixed container */}
            <AnimatePresence>
              {showControls && (
                <div className="absolute right-0 bottom-14 flex flex-col items-end gap-2">
                  {controlItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      className="relative"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{
                        duration: 0.2,
                        delay: index * 0.05,
                      }}
                    >
                      {/* Control panel that appears on hover - with buffer zone to prevent flickering */}
                      <div
                        className="group"
                        onMouseEnter={() => setHoveredControl(item.id)}
                        onMouseLeave={() => setHoveredControl(null)}
                      >
                        {/* Invisible buffer zone to prevent flickering */}
                        <div className="-translate-x-12 absolute top-0 right-0 h-10 w-[200px] translate-y-0" />

                        <AnimatePresence>
                          {hoveredControl === item.id && (
                            <motion.div
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              transition={{ duration: 0.15 }}
                              className="absolute top-0 right-12 z-10 overflow-hidden rounded-lg bg-black/80 p-3 text-white backdrop-blur-md"
                            >
                              <div className="flex items-center gap-3 whitespace-nowrap">
                                <span className="font-medium text-sm">
                                  {item.label}
                                </span>

                                {item.type === "toggle" ? (
                                  <Switch
                                    checked={item.value as boolean}
                                    onCheckedChange={
                                      item.onChange as (
                                        checked: boolean,
                                      ) => void
                                    }
                                    className="data-[state=checked]:bg-purple-500"
                                  />
                                ) : (
                                  <div className="flex w-32 flex-col gap-1 p-2 pt-0">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs">
                                        {(item.value as number).toFixed(1)}
                                      </span>
                                    </div>
                                    <Slider
                                      min={item.min}
                                      max={item.max}
                                      step={item.step}
                                      value={[item.value as number]}
                                      onValueChange={(value) =>
                                        (
                                          item.onChange as (
                                            value: number,
                                          ) => void
                                        )(value[0])
                                      }
                                      className="dark"
                                    />
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Bubble button */}
                        <motion.button
                          type="button"
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full shadow-md",
                            item.type === "toggle" && (item.value as boolean)
                              ? "bg-purple-500/90 text-white"
                              : "bg-black/80 text-white backdrop-blur-md",
                          )}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ duration: 0.1 }}
                        >
                          {item.icon}
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

// Export the component directly for internal use
export { ModelRendererComponent };
