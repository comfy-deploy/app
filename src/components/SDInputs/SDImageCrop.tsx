import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Suspense, lazy, useState, useCallback } from "react";
import { toast } from "sonner";

const Cropper = lazy(() =>
  import("react-easy-crop").then((mod) => ({ default: mod.default })),
);

interface SDImageCropProps {
  image: string;
  onSave: (croppedImageFile: File) => void;
  onCancel: () => void;
}

const ASPECT_RATIOS = [
  { label: "16:9", value: 16 / 9 },
  { label: "4:3", value: 4 / 3 },
  { label: "1:1", value: 1 },
  { label: "3:4", value: 3 / 4 },
  { label: "9:16", value: 9 / 16 },
];

export function SDImageCrop({ image, onSave, onCancel }: SDImageCropProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(
    ASPECT_RATIOS[2].value,
  );
  const [isSaving, setIsSaving] = useState(false);

  const onCropComplete = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any,
  ): Promise<File> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height,
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            throw new Error("Canvas is empty");
          }
          const file = new File([blob], `cropped_image_${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          resolve(file);
        },
        "image/jpeg",
        0.95,
      );
    });
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) {
      toast.error("Please select a crop area");
      return;
    }

    setIsSaving(true);
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onSave(croppedImage);
      toast.success("Image cropped successfully");
    } catch (error) {
      console.error("Error cropping image:", error);
      toast.error("Failed to crop image");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex flex-wrap gap-2">
        {ASPECT_RATIOS.map((ratio) => (
          <Button
            key={ratio.label}
            variant={
              selectedAspectRatio === ratio.value ? "default" : "outline"
            }
            size="sm"
            onClick={() => setSelectedAspectRatio(ratio.value)}
            className={cn(
              "text-xs",
              selectedAspectRatio === ratio.value
                ? "bg-white/20 text-white border-white/20"
                : "bg-white/10 text-white border-white/20 hover:bg-white/20",
            )}
          >
            {ratio.label}
          </Button>
        ))}
      </div>

      <div className="relative flex-1 min-h-[400px]">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full text-white">
              Loading cropper...
            </div>
          }
        >
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={selectedAspectRatio}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            style={{
              containerStyle: {
                background: "transparent",
              },
              cropAreaStyle: {
                border: "2px solid rgba(255, 255, 255, 0.5)",
              },
            }}
          />
        </Suspense>
      </div>

      <div className="mt-4 flex justify-between">
        <Button
          variant="outline"
          onClick={onCancel}
          className="bg-white/10 text-white border-white/20 hover:bg-white/20"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || !croppedAreaPixels}
          className="bg-white/20 text-white border-white/20 hover:bg-white/30"
        >
          {isSaving ? "Saving..." : "Save Crop"}
        </Button>
      </div>
    </div>
  );
}
