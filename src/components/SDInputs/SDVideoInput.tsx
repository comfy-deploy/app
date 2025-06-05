import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Eye, Paperclip, Trash } from "lucide-react";
import { SDAssetInput } from "./sd-asset-input";
import React, {
  type ChangeEvent,
  type DragEvent,
  ReactElement,
  type ReactNode,
  type RefObject,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

type SDVideoInputProps = {
  label?: string;
  className?: string;
  inputClasses?: string;
  file: File | undefined;
  multiple?: boolean;
  onChange: (file: File | string | undefined | FileList) => void;
  header?: ReactNode;
  isDisplayAssetInput?: boolean;
};

export function SDVideoInput({
  label,
  className,
  inputClasses,
  file,
  onChange,
  header,
  isDisplayAssetInput,
}: SDVideoInputProps) {
  const dropRef: RefObject<any> = useRef(null);

  useEffect(() => {
    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const { files } = e.dataTransfer;
      console.log(files);
      if (files && files.length) {
        onChange(files[0]);
      }
    };
    if (!dropRef.current) {
      return;
    }

    dropRef.current.addEventListener("drop", handleDrop);

    return () => {
      if (!dropRef.current) {
        return;
      }
      dropRef.current.removeEventListener("drop", handleDrop);
    };
  }, []);

  function onDelete() {
    if (!file) {
      return;
    }
    onChange(undefined);
  }

  const displayVideoName = !!file?.name;
  return (
    <div className={className} ref={dropRef}>
      {header}
      <div className={`${inputClasses} flex gap-1`}>
        {!displayVideoName && (
          <>
            <Input
              className="rounded-[8px]"
              placeholder="Type your URL or drop a file"
              value={String(file?.name || file || "")}
              onChange={(e) => onChange(e.target.value)}
            />

            <Label
              htmlFor={`file-input-${label}`}
              className="flex items-center justify-center"
            >
              <div
                className={cn(
                  buttonVariants({
                    variant: "outline",
                    className:
                      "cursor-pointer rounded-[8px] transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50",
                  }),
                )}
              >
                <Paperclip size={18} />
              </div>
            </Label>
            <Input
              id={`file-input-${label}`}
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                if (!e?.target.files) {
                  return;
                }
                onChange(e.target.files[0]);
              }}
              type="file"
            />
            {isDisplayAssetInput && (
              <div className="flex items-center justify-center">
                <SDAssetInput onChange={onChange} />
              </div>
            )}
          </>
        )}
        {displayVideoName && <ViewVideo file={file} onDelete={onDelete} />}
      </div>
    </div>
  );
}

export type ImgView = {
  file: File;
};
type listViewProps = {
  file: File;
  onDelete?: () => void;
};
function ViewVideo({ file, onDelete }: listViewProps) {
  // const [imgPreview, setImgPreview] = useState<ImgView | null>(null);

  if (!file) {
    return;
  }

  return (
    <>
      <div className="flex w-full items-center justify-between px-2 py-2 font-medium transition-colors hover:bg-muted/50">
        <div
          className="flex flex-auto items-center justify-between duration-200 ease-in-out hover:text-slate-600"
          onClick={(e) => {
            e.preventDefault();
            // setImgPreview(file)
          }}
        >
          <p className="max-w-[350px] overflow-hidden text-ellipsis">
            {file.name}
          </p>
          {/* <Eye /> */}
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
      </div>
    </>
  );
}
