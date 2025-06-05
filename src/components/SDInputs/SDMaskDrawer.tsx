"use client";

import type { ImgView } from "@/components/SDInputs/SDImageInput";
import { DrawerMenu } from "@/components/SDInputs/SDMaskDrawer/DrawerMenu";
import { Suspense, lazy, useRef } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

const SDDrawerCanvas = lazy(() =>
  import("@/components/SDInputs/SDMaskDrawer/SDDrawerCanvas").then((mod) => ({
    default: mod.SDDrawerCanvas,
  })),
);

type SDMaskDrawerProps = {
  image: ImgView;
  onClose: () => void;
  onMaskChange: (file: File) => void;
};
export function SDMaskDrawer({
  image,
  onClose,
  onMaskChange,
}: SDMaskDrawerProps) {
  if (!image || Object.keys(image).length === 0) {
    return;
  }

  const childRef: any = useRef(undefined);

  async function getCanvasURL(canvasURL: string) {
    const response = await fetch(canvasURL);
    const blob = await response.blob();
    const newImg = new File([blob], `mask_${image.imgName}`, {
      type: "image/png",
      lastModified: new Date().getTime(),
    });
    onMaskChange(newImg);
  }

  function handleCreateMask() {
    console.log("requestData");
    if (!childRef.current) {
      return;
    }
    childRef.current.requestData();
  }

  function handleUndo() {
    if (childRef.current) {
      childRef.current.undo();
    }
  }
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="flex h-[90vh] max-h-[90vh] w-[90vw] max-w-[90vw] flex-col">
        <DialogHeader>
          <DialogTitle className="overflow-hidden text-ellipsis">
            Mask Editor
          </DialogTitle>
        </DialogHeader>
        <div
          className="h-[100%] self-center overflow-hidden"
          style={{ aspectRatio: (image?.width || 1) / (image?.height || 1) }}
        >
          <Suspense fallback={<div>Loading canvas...</div>}>
            <SDDrawerCanvas
              image={image}
              getCanvasURL={getCanvasURL}
              ref={childRef}
            />
          </Suspense>
        </div>
        <div className="flex gap-4 self-center">
          <DrawerMenu onUndo={handleUndo} />
          <Button onClick={handleCreateMask}>Save Mask</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
