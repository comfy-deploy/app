import { cn } from "@/lib/utils";
import { Image } from "lucide-react";
import { buttonVariants } from "../ui/button";
import { useState } from "react";
import { AssetsModal } from "../modals/assets-modal";
import { ImageInputsTooltip } from "../image-inputs-tooltip";

interface Props {
  onChange: (file: File | string | undefined | FileList) => void;
}

export const SDAssetInput = ({ onChange }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    setIsOpen(true);
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
                "cursor-pointer transition-colors hover:bg-gray-50 flex items-center justify-center",
            }),
          )}
        >
          <Image size={18} />
        </button>
      </ImageInputsTooltip>
      {isOpen && (
        <AssetsModal
          handleAsset={handleAsset}
          handleClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
