import type { ImgView } from "@/components/SDInputs/SDImageInput";
import { SDMaskDrawer } from "@/components/SDInputs/SDMaskDrawer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getOptimizedImage } from "@/lib/utils";
import { Pencil } from "lucide-react";
import { useState } from "react";

type SDImageInputPreviewProps = {
  image: ImgView;
  onClose: () => void;
  onMaskChange: (file: File) => void;
};
export function SDImageInputPreview({
  image,
  onClose,
  onMaskChange,
}: SDImageInputPreviewProps) {
  const [openMask, setOpenMask] = useState(false);

  function onCloseMask() {
    setOpenMask(false);
  }

  return (
    <>
      {openMask && (
        <SDMaskDrawer
          image={image}
          onClose={onCloseMask}
          onMaskChange={onMaskChange}
        />
      )}
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="overflow-hidden text-ellipsis">
              {image.imgName}
            </DialogTitle>
          </DialogHeader>
          <div className="relative">
            <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
              <Button
                Icon={Pencil}
                iconPlacement="right"
                onClick={() => setOpenMask(true)}
                className="flex items-center"
              >
                Create Mask
              </Button>
            </div>
            <img
              className="w-full rounded-xl drop-shadow-lg"
              src={getOptimizedImage(image.imgURL)}
              alt={image.imgName}
              width={200}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
