import { cn } from "@/lib/utils";
import { Image } from "lucide-react";
import { buttonVariants } from "../ui/button";
import { ImageInputsTooltip } from "../image-inputs-tooltip";
import { useAssetsBrowserStore } from "../workspace/Workspace";
import type { AssetType } from "@/types/common";

interface Props {
  onChange: (file: File | string | undefined | FileList) => void;
}

export const SDAssetInput = ({ onChange }: Props) => {
  const { setOpen, setOnSelect } = useAssetsBrowserStore();

  const handleClick = () => {
    setOnSelect((asset: AssetType) => {
      onChange(asset.url);
    });
    setOpen(true);
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
                "flex cursor-pointer items-center justify-center rounded-[8px] transition-colors hover:bg-gray-50",
            }),
          )}
        >
          <Image size={18} />
        </button>
      </ImageInputsTooltip>
    </>
  );
};
