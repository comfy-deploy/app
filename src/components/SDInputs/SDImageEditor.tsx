import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Suspense, lazy, useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import type { ImgView } from "./SDImageInput";
import { Crop, Loader2, RefreshCcw, VenetianMask } from "lucide-react";
import { Button } from "../ui/button";
import { DrawerMenu } from "./SDMaskDrawer/DrawerMenu";
import { ImageInputsTooltip } from "../image-inputs-tooltip";

const SDImageCrop = lazy(() =>
  import("./SDImageCrop").then((mod) => ({ default: mod.SDImageCrop })),
);
const SDDrawerCanvas = lazy(() =>
  import("./SDMaskDrawer/SDDrawerCanvas").then((mod) => ({
    default: mod.SDDrawerCanvas,
  })),
);

interface SDImageEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onSave: (file: File) => void;
}

export function SDImageEditor({
  open,
  onOpenChange,
  imageUrl,
  onSave,
}: SDImageEditorProps) {
  const [activeTab, setActiveTab] = useState<"crop" | "mask">("crop");
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageData, setImageData] = useState<ImgView | null>(null);
  const canvasRef = useRef<any>(null);

  const validateAndLoadImage = async (url: string) => {
    setIsLoading(true);
    setImageError(false);

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";

      await new Promise((resolve, reject) => {
        img.onload = () => {
          const imgView: ImgView = {
            imgName: url.split("/").pop() || "image",
            imgURL: url,
            width: img.width,
            height: img.height,
          };
          setImageData(imgView);
          resolve(img);
        };
        img.onerror = () =>
          reject(
            new Error(
              "Failed to load image. Please check that the URL is valid and accessible.",
            ),
          );
        img.src = url;
      });

      setIsLoading(false);
    } catch (error) {
      console.error("Image validation error:", error);
      setImageError(true);
      setIsLoading(false);
    }
  };

  const handleSave = (file: File) => {
    onSave(file);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleMaskSave = async (dataURL: string) => {
    try {
      const response = await fetch(dataURL);
      const blob = await response.blob();
      const file = new File([blob], `mask_${Date.now()}.png`, {
        type: "image/png",
      });
      handleSave(file);
      toast.success("Mask saved successfully");
    } catch (error) {
      console.error("Error saving mask:", error);
      toast.error("Failed to save mask");
    }
  };

  const triggerMaskSave = () => {
    if (canvasRef.current) {
      canvasRef.current.requestData();
    }
  };

  useEffect(() => {
    if (open && imageUrl) {
      validateAndLoadImage(imageUrl);
    }
  }, [open, imageUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl dark:bg-zinc-900">
        <DialogHeader>
          <DialogTitle>Edit Image</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="p-6">
              <Loader2 className="animate-spin text-muted-foreground" />
            </div>
          </div>
        ) : imageError ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 py-4">
            <div className="text-center">
              <p className="font-medium text-lg">Failed to load image</p>
              <p className="text-muted-foreground text-sm">
                Please check that the URL is valid and points to an image
              </p>
            </div>
          </div>
        ) : (
          <>
            {!isLoading && !imageError && imageData && (
              <Tabs
                value={activeTab}
                onValueChange={(value) =>
                  setActiveTab(value as "crop" | "mask")
                }
                className="flex h-full flex-row gap-2"
              >
                <div className="flex h-full items-center">
                  <TabsList className="flex h-fit flex-col">
                    <TabsTrigger value="crop" className="px-1">
                      <ImageInputsTooltip tooltipText="Crop Image" side="right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-transparent"
                        >
                          <Crop className="h-4 w-4" />
                        </Button>
                      </ImageInputsTooltip>
                    </TabsTrigger>
                    <TabsTrigger value="mask" className="px-1">
                      <ImageInputsTooltip
                        tooltipText="Create Mask"
                        side="right"
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-transparent"
                        >
                          <VenetianMask className="h-4 w-4" />
                        </Button>
                      </ImageInputsTooltip>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="crop" className="mt-4 flex-1">
                  <Suspense
                    fallback={
                      <div className="flex h-full items-center justify-center">
                        <Loader2 className="animate-spin text-muted-foreground" />
                      </div>
                    }
                  >
                    <SDImageCrop
                      image={imageUrl}
                      onSave={handleSave}
                      onCancel={handleCancel}
                    />
                  </Suspense>
                </TabsContent>

                <TabsContent value="mask" className="mt-4 flex-1">
                  <div className="flex flex-col">
                    <div className="flex items-center justify-center overflow-hidden rounded-[8px] bg-zinc-900 dark:bg-zinc-800">
                      <div
                        className="self-center overflow-hidden"
                        style={(() => {
                          const maxWidth = Math.min(
                            imageData.width || 1,
                            window.innerWidth * 0.5,
                          );
                          const maxHeight = Math.min(
                            imageData.height || 1,
                            window.innerHeight * 0.5,
                          );
                          const aspectRatio =
                            (imageData.width || 1) / (imageData.height || 1);

                          let width = maxWidth;
                          let height = width / aspectRatio;

                          if (height > maxHeight) {
                            height = maxHeight;
                            width = height * aspectRatio;
                          }

                          return { width, height };
                        })()}
                      >
                        <Suspense
                          fallback={
                            <div className="flex h-full items-center justify-center">
                              <Loader2 className="animate-spin text-muted-foreground" />
                            </div>
                          }
                        >
                          <SDDrawerCanvas
                            ref={canvasRef}
                            image={imageData}
                            getCanvasURL={handleMaskSave}
                          />
                        </Suspense>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col items-center justify-center gap-2">
                      <span className="text-muted-foreground text-xs">
                        Scroll to adjust the brush size.
                      </span>
                      <DrawerMenu />
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button onClick={triggerMaskSave}>Save Mask</Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
