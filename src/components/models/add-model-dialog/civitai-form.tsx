import { useState, useEffect, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { VerifyCivitAIResponse, AddModelRequest } from "@/types/models";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { FolderPathDisplay } from "./folder-path-display";
import { Label } from "@/components/ui/label";

interface CivitaiFormProps {
  onSubmit: (request: AddModelRequest) => void;
  folderPath: string;
  className?: string;
  isSubmitting: boolean;
}

interface PreviewMediaProps {
  url: string;
}

function PreviewMedia({ url }: PreviewMediaProps) {
  const [isVideo, setIsVideo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkContentType = async () => {
      try {
        const response = await fetch(url, { method: "HEAD" });
        const contentType = response.headers.get("content-type");
        setIsVideo(contentType?.startsWith("video/") ?? false);
      } catch (error) {
        console.error("Error checking content type:", error);
        setIsVideo(/\.(mp4|webm|mov)$/i.test(url));
      } finally {
        setIsLoading(false);
      }
    };

    checkContentType();
  }, [url]);

  const mediaClasses = cn("max-h-64 w-full rounded-md bg-black object-contain");

  if (isLoading) {
    return <div className={cn(mediaClasses, "h-64 animate-pulse")} />;
  }

  if (isVideo) {
    return (
      <video src={url} controls className={mediaClasses}>
        <track kind="captions" />
      </video>
    );
  }

  return <img src={url} alt="Model preview" className={mediaClasses} />;
}

export function CivitaiForm({
  onSubmit,
  folderPath,
  className,
  isSubmitting,
}: CivitaiFormProps) {
  const [url, setUrl] = useState("");
  const [filename, setFilename] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validation, setValidation] = useState<VerifyCivitAIResponse | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const debouncedUrl = useDebounce(url, 500);

  useEffect(() => {
    if (!debouncedUrl) {
      setValidation(null);
      return;
    }
    validateUrl(debouncedUrl);
  }, [debouncedUrl]);

  useEffect(() => {
    if (validation?.filename) {
      setFilename(validation.filename);
    }
  }, [validation?.filename]);

  const validateUrl = async (modelUrl: string) => {
    setIsValidating(true);
    setError(null);

    try {
      const response = await api({
        url: "volume/validate/civitai",
        init: {
          method: "POST",
          body: JSON.stringify({ url: modelUrl }),
        },
      });

      console.log("Civitai validation response:", response);
      setValidation(response);
    } catch (err) {
      console.error("Validation error:", err);
      setError("Failed to validate Civitai URL");
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSubmitting && url.trim()) {
      e.preventDefault();
      onSubmit({
        source: "civitai",
        folderPath,
        filename,
        civitai: {
          url: url,
        },
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <FolderPathDisplay path={folderPath} />

      <div className="relative">
        <Input
          id="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://civitai.com/models/..."
          onKeyDown={handleKeyDown}
          className={cn(
            "pr-10",
            validation?.exists && "border-green-500",
            validation && !validation.exists && "border-red-500",
          )}
        />
        <div className="-translate-y-1/2 absolute top-1/2 right-3">
          {isValidating ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : validation?.exists ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : validation ? (
            <XCircle className="h-4 w-4 text-red-500" />
          ) : null}
        </div>
      </div>

      {validation?.exists && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            <div className="flex flex-col gap-4">
              <div className="font-medium">{validation.title}</div>
              {validation.preview_url && (
                <PreviewMedia url={validation.preview_url} />
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={() =>
          onSubmit({
            source: "civitai",
            folderPath,
            filename,
            civitai: {
              url: url,
            },
          })
        }
        disabled={isSubmitting || !url.trim() || !validation?.exists}
      >
        {isSubmitting ? "Downloading..." : "Download"}
      </Button>
    </div>
  );
}
