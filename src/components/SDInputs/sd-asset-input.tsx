import { cn } from "@/lib/utils";
import { Image } from "lucide-react";
import { buttonVariants } from "../ui/button";
import { useState } from "react";
import { ImageInputsTooltip } from "../image-inputs-tooltip";
import { AssetsBrowserPopup } from "../workspace/assets-browser-drawer";
import { useAssetsBrowserStore } from "../workspace/Workspace";

interface Props {
  onChange: (file: File | string | undefined | FileList) => void;
}

export const SDAssetInput = ({ onChange }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const { setOpen } = useAssetsBrowserStore();

  const handleClick = () => {
    setIsOpen(true);
    setOpen(true);
  };

  const handleAsset = (asset: AssetType) => {
    onChange(asset.url);
    setIsOpen(false);
  };

  return (
    <>
      <ImageInputsTooltip tooltipText="Assets">
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            buttonVariants({
              variant: "outline",
              className:
                "flex cursor-pointer items-center justify-center transition-colors hover:bg-gray-50",
            }),
          )}
        >
          <Image size={18} />
        </button>
      </ImageInputsTooltip>
      {isOpen && <AssetsBrowserPopup isPlayground handleAsset={handleAsset} />}
    </>
  );
};
