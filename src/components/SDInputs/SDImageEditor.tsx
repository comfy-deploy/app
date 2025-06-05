import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Suspense, lazy, useState, useEffect } from "react";
import { toast } from "sonner";
import type { ImgView } from "./SDImageInput";

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
        img.onerror = () => reject(new Error("Failed to load image. Please check that the URL is valid and accessible."));
        img.src = url;
      });

      setIsLoading(false);
    } catch (error) {
      console.error("Image validation error:", error);
      setImageError(true);
      setIsLoading(false);
      toast.error(
        error instanceof Error ? error.message : "Failed to load image",
      );
    }
  };

  const handleSave = (file: File) => {
    onSave(file);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const getCanvasURL = (canvas: HTMLCanvasElement) => {
    return new Promise<File>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `mask_${Date.now()}.png`, {
            type: "image/png",
          });
          resolve(file);
        }
      }, "image/png");
    });
  };

  const handleMaskSave = async (canvas: HTMLCanvasElement) => {
    try {
      const file = await getCanvasURL(canvas);
      handleSave(file);
      toast.success("Mask saved successfully");
    } catch (error) {
      console.error("Error saving mask:", error);
      toast.error("Failed to save mask");
    }
  };

  useEffect(() => {
    if (open && imageUrl) {
      validateAndLoadImage(imageUrl);
    }
  }, [open, imageUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] bg-black/90 border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Image</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-white">Loading image...</div>
          </div>
        )}

        {imageError && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="text-red-400 text-center">
              <p className="text-lg font-medium">Failed to load image</p>
              <p className="text-sm opacity-80">
                Please check that the URL is valid and points to an image
              </p>
            </div>
            <button
              onClick={() => validateAndLoadImage(imageUrl)}
              className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded hover:bg-white/20 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !imageError && imageData && (
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "crop" | "mask")}
            className="h-full flex flex-col"
          >
            <TabsList className="grid w-full grid-cols-2 bg-white/10 border-white/20">
              <TabsTrigger
                value="crop"
                className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white"
              >
                Crop Image
              </TabsTrigger>
              <TabsTrigger
                value="mask"
                className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white"
              >
                Create Mask
              </TabsTrigger>
            </TabsList>

            <TabsContent value="crop" className="flex-1 mt-4">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-full text-white">
                    Loading crop tool...
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

            <TabsContent value="mask" className="flex-1 mt-4">
              <div className="h-full flex flex-col">
                <div
                  className="flex-1 overflow-hidden rounded-lg"
                  style={{
                    aspectRatio:
                      (imageData.width || 1) / (imageData.height || 1),
                  }}
                >
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center h-full text-white">
                        Loading mask tool...
                      </div>
                    }
                  >
                    <SDDrawerCanvas
                      image={imageData}
                      getCanvasURL={handleMaskSave}
                    />
                  </Suspense>
                </div>
                <div className="mt-4 flex justify-between">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      toast.info(
                        "Use the drawing tools to create your mask, then save",
                      );
                    }}
                    className="px-4 py-2 bg-white/20 text-white border border-white/20 rounded hover:bg-white/30 transition-colors"
                  >
                    Save Mask
                  </button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
