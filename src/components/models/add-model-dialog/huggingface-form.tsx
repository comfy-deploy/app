import { useState, useEffect, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { VerifyHFRepoResponse, AddModelRequest } from "@/types/models";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { FolderPathDisplay } from "./folder-path-display";
import { Label } from "@/components/ui/label";

interface HuggingfaceFormProps {
  onSubmit: (request: AddModelRequest) => void;
  folderPath: string;
  className?: string;
  isSubmitting?: boolean;
}

export function HuggingfaceForm({
  onSubmit,
  folderPath,
  className,
  isSubmitting = false,
}: HuggingfaceFormProps) {
  const [repoId, setRepoId] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validation, setValidation] = useState<VerifyHFRepoResponse | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [modelPath, setModelPath] = useState(folderPath);

  const debouncedRepoId = useDebounce(repoId, 500);

  useEffect(() => {
    if (!debouncedRepoId) {
      setValidation(null);
      setModelPath(folderPath);
      return;
    }
    validateRepo(debouncedRepoId);

    // Update the model path when repo ID changes
    const lastPart = debouncedRepoId.split("/").pop() || "";
    setModelPath(`${folderPath}/${lastPart}`);
  }, [debouncedRepoId, folderPath]);

  const validateRepo = async (id: string) => {
    setIsValidating(true);
    setError(null);

    try {
      const response = await api({
        url: "volume/validate/huggingface",
        init: {
          method: "POST",
          body: JSON.stringify({ repo_id: id }),
        },
      });

      setValidation(response);
    } catch (err) {
      setError("Failed to validate repository");
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = () => {
    if (!validation?.exists) return;

    onSubmit({
      source: "huggingface",
      folderPath,
      huggingface: {
        repoId: repoId,
      },
    });
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validation?.exists && !isSubmitting) {
      handleSubmit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSubmitting && repoId.trim()) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      className={cn("flex flex-col gap-4", className)}
    >
      <FolderPathDisplay path={folderPath} />

      <div className="relative">
        <Input
          placeholder="Enter repository ID (e.g. stabilityai/stable-diffusion-xl-base-1.0)"
          value={repoId}
          onChange={(e) => setRepoId(e.target.value)}
          className={cn(
            "pr-10",
            validation?.exists && "border-green-500",
            validation && !validation.exists && "border-red-500",
          )}
          onKeyDown={handleKeyDown}
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
            Model will be added to:{" "}
            <span className="font-medium">{modelPath}</span>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={!validation?.exists || isSubmitting}
        className="mt-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Adding Model...
          </>
        ) : (
          "Add Model"
        )}
      </Button>
    </form>
  );
}
