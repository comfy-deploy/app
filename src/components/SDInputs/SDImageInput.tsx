import { SDImageEditor } from "@/components/SDInputs/SDImageEditor";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Paperclip, Pencil, Trash } from "lucide-react";
import {
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SDAssetInput } from "./sd-asset-input";
import { ImageInputsTooltip } from "../image-inputs-tooltip";

type SDImageInputProps = {
  label?: string;
  className?: string;
  inputClasses?: string;
  file: File | undefined;
  multiple?: boolean;
  onChange: (file: File | string | undefined | FileList) => void;
  header?: ReactNode;
};

export function SDImageInput({
  label,
  className,
  inputClasses,
  file,
  onChange,
  multiple,
  header,
}: SDImageInputProps) {
  const dropRef: RefObject<HTMLDivElement> = useRef(null);
  const [openEditor, setOpenEditor] = useState(false);
  const ImgView: ImgView | null = useMemo(() => {
    if (file && typeof file === "object") {
      const imgURL = URL.createObjectURL(file);
      const imgView: ImgView = {
        imgName: (file as File).name,
        imgURL: imgURL,
      };
      const imageDOMElement = new Image();
      imageDOMElement.src = imgURL;
      imageDOMElement.onload = () => {
        imgView.height = imageDOMElement.height;
        imgView.width = imageDOMElement.width;
      };
      return imgView;
    }
    return null;
  }, [file]);

  // Check if there's text in the input (URL string)
  const hasTextInput =
    typeof file === "string" && String(file).trim().length > 0;

  function onDeleteImg() {
    if (!file) {
      return;
    }
    onChange(undefined);
  }

  useEffect(() => {
    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const { files } = e.dataTransfer;
      console.log(files);
      if (files?.length) {
        onChange(multiple ? files : files[0]);
      }
    };
    if (!dropRef.current) {
      return;
    }

    // dropRef.current.addEventListener('dragover', handleDragOver);
    dropRef.current.addEventListener("drop", handleDrop);

    return () => {
      if (!dropRef.current) {
        return;
      }
      // dropRef.current.removeEventListener('dragover', handleDragOver);
      dropRef.current.removeEventListener("drop", handleDrop);
    };
  }, [multiple, onChange]);

  return (
    <div className={className} ref={dropRef}>
      {header}
      <div className={`${inputClasses} flex gap-1`}>
        {!ImgView && (
          <>
            <Input
              className="rounded-[8px]"
              placeholder="Type your URL or drop a file"
              value={String(file || "")}
              onChange={(e) => onChange(e.target.value)}
            />

            {hasTextInput ? (
              <ImageInputsTooltip tooltipText="Edit">
                <Button
                  variant="outline"
                  type="button"
                  className="cursor-pointer rounded-[8px] transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  onClick={() => setOpenEditor(true)}
                >
                  <Pencil size={18} />
                </Button>
              </ImageInputsTooltip>
            ) : (
              <>
                <Input
                  id={`file-input-${label}`}
                  accept="image/*"
                  className="hidden"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    if (!e?.target.files) {
                      return;
                    }
                    onChange(e.target.files[0]);
                  }}
                  type="file"
                />
                <Label
                  htmlFor={`file-input-${label}`}
                  className={cn(
                    buttonVariants({
                      variant: "outline",
                      className:
                        "cursor-pointer rounded-[8px] transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50",
                    }),
                  )}
                >
                  <Paperclip size={18} />
                </Label>
                <div className="flex items-center justify-center">
                  <SDAssetInput onChange={onChange} />
                </div>
              </>
            )}
          </>
        )}
        {ImgView && (
          <div className="flex w-full items-center justify-between rounded-[8px] border border-gray-200 px-2 py-1 dark:border-gray-700">
            <div className="flex flex-auto items-center gap-2">
              <p className="line-clamp-1 font-medium text-xs">
                {ImgView.imgName}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <ImageInputsTooltip tooltipText="Edit">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setOpenEditor(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setOpenEditor(true);
                    }
                  }}
                >
                  <Pencil size={16} />
                </Button>
              </ImageInputsTooltip>
              <ImageInputsTooltip tooltipText="Delete">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={onDeleteImg}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onDeleteImg();
                    }
                  }}
                >
                  <Trash
                    className="text-red-700 hover:text-red-600"
                    size={16}
                  />
                </Button>
              </ImageInputsTooltip>
            </div>
          </div>
        )}
      </div>

      {/* Image Editor Dialog */}
      {(hasTextInput || ImgView) && (
        <SDImageEditor
          open={openEditor}
          onOpenChange={setOpenEditor}
          imageUrl={ImgView ? ImgView.imgURL : String(file || "")}
          onSave={(editedFile) => {
            onChange(editedFile);
            setOpenEditor(false);
          }}
        />
      )}
    </div>
  );
}

export type ImgView = {
  imgName: string;
  imgURL: string;
  width?: number;
  height?: number;
};
