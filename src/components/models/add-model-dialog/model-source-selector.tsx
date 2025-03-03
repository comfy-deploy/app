import { Button } from "@/components/ui/button";
import type { ModelSource } from "@/types/models";
import { Globe, Link2, Upload } from "lucide-react";

// Import the HF logo - place the SVG in:
// src/assets/icons/huggingface.svg
import { ReactComponent as HuggingFaceLogo } from "@/assets/icons/huggingface.svg";

interface ModelSourceSelectorProps {
  onSelect: (source: ModelSource) => void;
}

export function ModelSourceSelector({ onSelect }: ModelSourceSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-4 py-4">
      <Button
        variant="outline"
        className="flex flex-col items-center justify-center gap-4 p-8"
        onClick={() => onSelect("huggingface")}
      >
        <HuggingFaceLogo className="h-8 w-8" />
        <span>Hugging Face</span>
      </Button>
      <Button
        variant="outline"
        className="flex flex-col items-center justify-center gap-4 p-8"
        onClick={() => onSelect("civitai")}
      >
        <Globe className="h-8 w-8" />
        <span>CivitAI</span>
      </Button>
      <Button
        variant="outline"
        className="flex flex-col items-center justify-center gap-4 p-8"
        onClick={() => onSelect("raw")}
      >
        <Link2 className="h-8 w-8" />
        <span>Raw Link</span>
      </Button>
      <Button
        variant="outline"
        className="flex flex-col items-center justify-center gap-4 p-8"
        onClick={() => onSelect("upload")}
      >
        <Upload className="h-8 w-8" />
        <span>Local Upload</span>
      </Button>
    </div>
  );
}
