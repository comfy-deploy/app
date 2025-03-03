import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { AddModelRequest } from "@/types/models";
import { FolderPathDisplay } from "./folder-path-display";
import { cn } from "@/lib/utils";

interface LinkFormProps {
  onSubmit: (request: AddModelRequest) => void;
  folderPath: string;
  className?: string;
  isSubmitting?: boolean;
}

export function LinkForm({
  onSubmit,
  folderPath,
  className,
  isSubmitting = false,
}: LinkFormProps) {
  const [url, setUrl] = useState("");
  const [filename, setFilename] = useState("");

  const handleSubmit = () => {
    if (!url.trim() || !filename.trim()) return;

    onSubmit({
      source: "link",
      folderPath,
      filename,
      downloadLink: url,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSubmitting && url.trim() && filename.trim()) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className={cn("flex flex-col gap-4", className)}
    >
      <FolderPathDisplay path={folderPath} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="url">URL</Label>
        <Input
          id="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/model.safetensors"
          onKeyDown={handleKeyDown}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="filename">Filename</Label>
        <Input
          id="filename"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          placeholder="model.safetensors"
          onKeyDown={handleKeyDown}
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || !url.trim() || !filename.trim()}
      >
        {isSubmitting ? "Adding Model..." : "Add Model"}
      </Button>
    </form>
  );
}
