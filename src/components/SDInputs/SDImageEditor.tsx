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
import { Loader2, RefreshCcw } from "lucide-react";
import { Button } from "../ui/button";

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
                className="flex h-full flex-col"
              >
                <TabsList className="grid w-full grid-cols-2 ">
                  <TabsTrigger value="crop">Crop Image</TabsTrigger>
                  <TabsTrigger value="mask">Create Mask</TabsTrigger>
                </TabsList>

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
                  <div className="flex h-full max-h-[500px] flex-col">
                    <div
                      className="flex-1 overflow-hidden rounded-lg"
                      style={{
                        aspectRatio:
                          (imageData.width || 1) / (imageData.height || 1),
                      }}
                    >
                      <Suspense
                        fallback={
                          <div className="flex h-full items-center justify-center">
                            <Loader2 className="animate-spin text-muted-foreground" />
                          </div>
                        }
                      >
                        <SDDrawerCanvas
                          image={imageData}
                          getCanvasURL={handleMaskSave}
                        />
                      </Suspense>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button>Save Mask</Button>
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
