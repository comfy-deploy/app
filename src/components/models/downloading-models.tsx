import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DownloadingModel } from "@/types/models";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Copy, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function DownloadingModels() {
  const { data: downloadingModels, isLoading } = useQuery({
    queryKey: ["volume", "downloading-models"],
    queryFn: async ({ queryKey }) => {
      const response = await api({
        url: queryKey.join("/"),
      });
      return response as DownloadingModel[];
    },
    refetchInterval: 5000, // Refetch every 5 seconds to update progress
  });

  if (isLoading) {
    return null;
  }

  if (!downloadingModels || downloadingModels.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 space-y-2">
      <h3 className="font-medium">Downloading Models</h3>
      <div className="space-y-2">
        {downloadingModels.map((model) => (
          <DownloadingModelItem key={model.id} model={model} />
        ))}
      </div>
    </div>
  );
}

function DownloadingModelItem({ model }: { model: DownloadingModel }) {
  const getModelUrl = () => {
    if (model.civitai_url) return model.civitai_url;
    if (model.hf_url) return model.hf_url;
    if (model.user_url) return model.user_url;
    return null;
  };

  const getSourceName = () => {
    switch (model.upload_type) {
      case "civitai":
        return "Civitai";
      case "huggingface":
        return "Hugging Face";
      case "link":
        return "URL";
      default:
        return "Unknown";
    }
  };

  const getTimeAgo = () => {
    try {
      return formatDistanceToNow(new Date(model.created_at), {
        addSuffix: true,
      });
    } catch (e) {
      return "recently";
    }
  };

  const modelUrl = getModelUrl();
  const sourceName = getSourceName();
  const timeAgo = getTimeAgo();

  const copyModelUrl = () => {
    if (modelUrl) {
      navigator.clipboard.writeText(modelUrl);
      toast.success("Download link copied to clipboard");
    }
  };

  return (
    <div className="rounded-md border bg-card">
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="mr-2 flex-1 truncate">
            <div className="truncate font-medium">{model.model_name}</div>
            <div className="text-muted-foreground text-xs">
              {sourceName} • {model.folder_path} • Started {timeAgo}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {model.status === "failed" && (
              <AlertCircle className="h-5 w-5 text-destructive" />
            )}
            {modelUrl && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                onClick={copyModelUrl}
                title="Copy download link"
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="mt-2">
          <Progress
            value={model.download_progress}
            className={cn(
              model.status === "failed" && "bg-destructive/20",
              "h-2",
            )}
          />
          <div className="mt-1 flex justify-between text-muted-foreground text-xs">
            <span>
              {model.status === "failed"
                ? "Failed"
                : `${model.download_progress}%`}
            </span>
            {model.status !== "failed" && (
              <span>
                {model.download_progress === 100
                  ? "Processing..."
                  : "Downloading"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2 border-t p-3">
        {model.civitai_model_response?.images &&
          model.civitai_model_response.images.length > 0 && (
            <div className="mx-auto aspect-square w-full max-w-[200px] overflow-hidden rounded-md">
              <img
                src={model.civitai_model_response.images[0].url}
                alt={model.model_name}
                className="h-full w-full object-cover"
              />
            </div>
          )}

        {model.civitai_model_response?.description && (
          <div className="text-sm">
            <div className="mb-1 font-medium">Description</div>
            <div className="text-muted-foreground text-xs">
              {model.civitai_model_response.description.length > 300
                ? `${model.civitai_model_response.description.substring(0, 300)}...`
                : model.civitai_model_response.description}
            </div>
          </div>
        )}

        {model.error_log && (
          <div className="text-sm">
            <div className="mb-1 font-medium text-destructive">Error</div>
            <pre className="whitespace-pre-wrap rounded bg-destructive/10 p-2 text-destructive text-xs">
              {model.error_log}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
