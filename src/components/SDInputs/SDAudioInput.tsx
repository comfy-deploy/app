"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Paperclip, Trash } from "lucide-react";
import React, {
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
  useEffect,
  useRef,
} from "react";

type SDAudioInputProps = {
  label?: string;
  className?: string;
  inputClasses?: string;
  file: File | undefined;
  multiple?: boolean;
  onChange: (file: File | string | undefined) => void;
  header?: ReactNode;
};

export function SDAudioInput({
  label,
  className,
  inputClasses,
  file,
  onChange,
  header,
}: SDAudioInputProps) {
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dropElement = dropRef.current;
    if (!dropElement) {
      return;
    }

    const handleDrop = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      const dragEvent = e as unknown as DragEvent;
      const files = dragEvent.dataTransfer?.files;
      if (files?.length) {
        onChange(files[0]);
      }
    };

    const handleDragOver = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    dropElement.addEventListener("dragover", handleDragOver);
    dropElement.addEventListener("drop", handleDrop);

    return () => {
      dropElement.removeEventListener("dragover", handleDragOver);
      dropElement.removeEventListener("drop", handleDrop);
    };
  }, [onChange]);

  function onDelete() {
    if (!file) {
      return;
    }
    onChange(undefined);
  }

  const displayAudioName = !!file?.name;
  return (
    <div className={className} ref={dropRef}>
      {header}
      <div className={`${inputClasses} flex gap-2`}>
        {!displayAudioName && (
          <>
            <Input
              placeholder="Type your URL or drop an audio file"
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
                      "cursor-pointer transition-colors hover:bg-gray-50",
                  }),
                )}
              >
                <Paperclip size={18} />
              </div>
            </Label>
            <Input
              id={`file-input-${label}`}
              accept="audio/*"
              className="hidden"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                if (!e?.target.files) {
                  return;
                }
                onChange(e.target.files[0]);
              }}
              type="file"
            />
          </>
        )}
        {displayAudioName && <ViewAudio file={file} onDelete={onDelete} />}
      </div>
    </div>
  );
}

type AudioViewProps = {
  file: File;
  onDelete?: () => void;
};

function ViewAudio({ file, onDelete }: AudioViewProps) {
  if (!file) {
    return null;
  }

  return (
    <div className="flex w-full items-center justify-between px-2 py-2 font-medium transition-colors hover:bg-muted/50">
      <button
        type="button"
        className="flex flex-auto items-center justify-between duration-200 ease-in-out hover:text-slate-600"
        onClick={(e) => {
          e.preventDefault();
        }}
      >
        <p className="max-w-[350px] overflow-hidden text-ellipsis">
          {file.name}
        </p>
      </button>
      {onDelete && (
        <Button variant="ghost" onClick={onDelete}>
          <Trash
            className="text-red-700 ease-in-out hover:text-red-600"
            size={20}
          />
        </Button>
      )}
    </div>
  );
}
