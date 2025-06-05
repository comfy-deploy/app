import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Image as ImageIcon,
  Loader2,
  Ratio,
  RotateCwSquare,
} from "lucide-react";
import { Suspense, lazy, useState, useCallback } from "react";
import { flushSync } from "react-dom";
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

const INITIAL_VALUES = {
  crop: { x: 0, y: 0 },
  zoom: 1,
  rotation: 0,
  aspectRatio: ASPECT_RATIOS[2].value,
};

export function SDImageCrop({ image, onSave, onCancel }: SDImageCropProps) {
  const [crop, setCrop] = useState(INITIAL_VALUES.crop);
  const [zoom, setZoom] = useState(INITIAL_VALUES.zoom);
  const [rotation, setRotation] = useState(INITIAL_VALUES.rotation);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(
    INITIAL_VALUES.aspectRatio,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const onCropComplete = useCallback(
    (_croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleReset = () => {
    flushSync(() => {
      setCrop(INITIAL_VALUES.crop);
      setZoom(INITIAL_VALUES.zoom);
      setRotation(INITIAL_VALUES.rotation);
      setSelectedAspectRatio(INITIAL_VALUES.aspectRatio);
      setCroppedAreaPixels(null);
      setResetKey((prev) => prev + 1);
    });
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });

  const getRotatedImage = (
    imageSrc: string,
    rotation: number,
  ): Promise<HTMLImageElement> =>
    new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          resolve(image);
          return;
        }

        // Calculate new canvas size for rotated image
        const radians = (rotation * Math.PI) / 180;
        const sin = Math.abs(Math.sin(radians));
        const cos = Math.abs(Math.cos(radians));
        const newWidth = image.width * cos + image.height * sin;
        const newHeight = image.width * sin + image.height * cos;

        canvas.width = newWidth;
        canvas.height = newHeight;

        // Rotate and draw the image
        ctx.translate(newWidth / 2, newHeight / 2);
        ctx.rotate(radians);
        ctx.drawImage(image, -image.width / 2, -image.height / 2);

        const rotatedImage = new Image();
        rotatedImage.onload = () => resolve(rotatedImage);
        rotatedImage.src = canvas.toDataURL();
      };
      image.src = imageSrc;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any,
    rotation = 0,
  ): Promise<File> => {
    const image = rotation
      ? await getRotatedImage(imageSrc, rotation)
      : await createImage(imageSrc);
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
      const croppedImage = await getCroppedImg(
        image,
        croppedAreaPixels,
        rotation,
      );
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
    <div className="flex h-full flex-col gap-4">
      {/* Cropper */}
      <div className="relative min-h-[400px] flex-1">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center">
              <Loader2 className="animate-spin text-muted-foreground" />
            </div>
          }
        >
          <Cropper
            key={resetKey}
            image={image}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={selectedAspectRatio}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            style={{
              containerStyle: {
                background: "dark:transparent rgba(0, 0, 0, 0.5)",
                borderRadius: "8px",
              },
              cropAreaStyle: {
                border: "2px solid rgba(255, 255, 255, 0.5)",
              },
            }}
          />
        </Suspense>
      </div>

      {/* Aspect Ratio Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Ratio className="mr-2 h-4 w-4 text-muted-foreground" />
        {ASPECT_RATIOS.map((ratio) => (
          <Button
            key={ratio.label}
            variant={
              selectedAspectRatio === ratio.value ? "default" : "outline"
            }
            size="sm"
            onClick={() => setSelectedAspectRatio(ratio.value)}
            className="text-xs"
          >
            {ratio.label}
          </Button>
        ))}
      </div>

      {/* Zoom & Rotation Controls */}
      <div className="flex items-center justify-between gap-4 px-2">
        <Button
          variant="ghost"
          className="text-muted-foreground"
          onClick={handleReset}
        >
          Reset
        </Button>
        <div className="flex flex-row items-center gap-4">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <Slider
            value={[zoom]}
            onValueChange={(value) => setZoom(value[0])}
            min={1}
            max={3}
            step={0.1}
            className="w-52 flex-1"
          />
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
        </div>
        <Button variant="ghost" onClick={handleRotate} size="icon">
          <RotateCwSquare className="h-5 w-5" />
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || !croppedAreaPixels}>
          {isSaving ? "Saving..." : "Apply"}
        </Button>
      </div>
    </div>
  );
}
