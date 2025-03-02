import { cn } from "@/lib/utils";
import { Slider } from "@radix-ui/react-slider";
import { Switch } from "@radix-ui/react-switch";
import { useGLTF, Html, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Grid, Axis3D, RotateCcw, Sun, Settings } from "lucide-react";
import { useMemo, useEffect, useState, Suspense, lazy } from "react";
import * as THREE from "three";

// Model component for GLB files
function Model({ url }: { url: string }) {
  useGLTF.preload(url);

  const { scene } = useGLTF(url, undefined, undefined, (loader) => {
    loader.setCrossOrigin("anonymous");
  });

  const clonedScene = useMemo(() => scene.clone(), [scene]);

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
}: {
  url: string;
  mediaClasses?: string;
  isMainView?: boolean;
}) {
  const [showControls, setShowControls] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [lightIntensity, setLightIntensity] = useState(4);
  const [autoRotate, setAutoRotate] = useState(!isMainView);
  const [hoveredControl, setHoveredControl] = useState<string | null>(null);

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
        {/* Lighting setup with dynamic intensity */}
        <ambientLight intensity={lightIntensity} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} />

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

// Fallback loading component for the entire 3D renderer
function LoadingFallback({ mediaClasses }: { mediaClasses?: string }) {
  return (
    <div
      className={cn(
        "flex h-[70vh] w-[70vh] items-center justify-center bg-gray-100/50",
        mediaClasses,
      )}
    >
      <div className="flex flex-col items-center gap-2 text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    </div>
  );
}

// Create a lazy-loaded version of the component
const LazyModelRenderer = lazy(() =>
  import("./3d-renderer").then((module) => ({
    default: module.ModelRendererComponent,
  })),
);

// Export the wrapper component with Suspense
export function ModelRenderer(props: {
  url: string;
  mediaClasses?: string;
  isMainView?: boolean;
}) {
  return (
    <Suspense fallback={<LoadingFallback mediaClasses={props.mediaClasses} />}>
      <LazyModelRenderer {...props} />
    </Suspense>
  );
}

// Export the component directly for internal use
export { ModelRendererComponent };
