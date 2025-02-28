"use client";

import { SDImageInputPreview } from "@/components/SDInputs/SDImageInputPreview";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Eye, Paperclip, Trash } from "lucide-react";
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
  accept?: string;
  isDisplayAssetInput?: boolean;
};

export function SDImageInput({
  label,
  className,
  inputClasses,
  file,
  onChange,
  multiple,
  header,
  accept = "image/*",
  isDisplayAssetInput,
}: SDImageInputProps) {
  const dropRef: RefObject<any> = useRef(null);
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
      if (files && files.length) {
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
  }, []);
  return (
    <div className={className} ref={dropRef}>
      {header}
      <div className={`${inputClasses} flex gap-2`}>
        {!ImgView && (
          <>
            <Input
              placeholder="Type your URL or drop a file"
              value={String(file || "")}
              onChange={(e) => onChange(e.target.value)}
            />

            <Label
              htmlFor={`file-input-${label}`}
              className="flex items-center justify-center"
            >
              <ImageInputsTooltip tooltipText="Upload">
                <div
                  className={cn(
                    buttonVariants({
                      variant: "outline",
                      className:
                        "cursor-pointer transition-colors hover:bg-gray-50",
                    }),
                  )}
                >
                  <Paperclip size={18} />
                </div>
              </ImageInputsTooltip>
            </Label>
            <Input
              id={`file-input-${label}`}
              accept={accept}
              className="hidden"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                if (!e?.target.files) {
                  return;
                }
                onChange(e.target.files[0]);
              }}
              type="file"
            />
            {isDisplayAssetInput && <SDAssetInput onChange={onChange} />}

            {/* <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                useAssetsBrowserStore.getState().setOpen(true);
              }}
            >
              Assets
            </Button> */}
          </>
        )}
        {ImgView && (
          <ListView
            viewList={[ImgView]}
            onDelete={onDeleteImg}
            onMaskChange={(file) => onChange(file)}
          />
        )}
      </div>
    </div>
  );
}

export type ImgView = {
  imgName: string;
  imgURL: string;
  width?: number;
  height?: number;
};
type listViewProps = {
  viewList: ImgView[] | null;
  onAddImg?: () => void;
  onDelete?: () => void;
  onEdit?: (index: number, img: File) => void;
  onMaskChange: (file: File) => void;
};
function ListView({ viewList, onDelete, onMaskChange }: listViewProps) {
  const [imgPreview, setImgPreview] = useState<ImgView | null>(null);

  if (!viewList) {
    return;
  }

  function handleOnMaskChange(file: File) {
    onMaskChange(file);
    setImgPreview(null);
  }
  return (
    <>
      {imgPreview && (
        <SDImageInputPreview
          image={imgPreview}
          onClose={() => setImgPreview(null)}
          onMaskChange={handleOnMaskChange}
        />
      )}
      <Table>
        <TableBody>
          {viewList.map((item, index) => {
            return (
              <TableRow key={item.imgName} className="w-full ">
                <TableCell className="flex w-full items-center justify-between py-2 font-medium">
                  <div
                    className="flex flex-auto cursor-pointer items-center justify-between duration-200 ease-in-out hover:text-slate-600"
                    onClick={(e) => {
                      e.preventDefault();
                      setImgPreview(item);
                    }}
                  >
                    <p className="max-w-[250px] overflow-hidden text-ellipsis">
                      {item.imgName}
                    </p>
                    <Eye />
                  </div>
                  {onDelete && (
                    <Button variant="ghost">
                      <Trash
                        className="text-red-700 ease-in-out hover:text-red-600"
                        size={20}
                        onClick={(e) => {
                          e.preventDefault();
                          onDelete();
                        }}
                      />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}
