import { SDImageInputPreview } from "@/components/SDInputs/SDImageInputPreview";
import { SDImageEditor } from "@/components/SDInputs/SDImageEditor";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Eye, Paperclip, Pencil, Trash } from "lucide-react";
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
  const dropRef: RefObject<any> = useRef(null);
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
  }, []);
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
          <ListView
            viewList={[ImgView]}
            onDelete={onDeleteImg}
            onMaskChange={(file) => onChange(file)}
          />
        )}
      </div>

      {/* Image Editor Dialog */}
      {hasTextInput && (
        <SDImageEditor
          open={openEditor}
          onOpenChange={setOpenEditor}
          imageUrl={String(file || "")}
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
                    className="flex flex-auto cursor-pointer items-center justify-between gap-2 duration-200 ease-in-out hover:text-slate-600"
                    onClick={(e) => {
                      e.preventDefault();
                      setImgPreview(item);
                    }}
                  >
                    <p className="line-clamp-1">{item.imgName}</p>
                    <Eye />
                  </div>
                  {onDelete && (
                    <Button variant="ghost" type="button">
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
