import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DownloadingModel } from "@/types/models";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { X, ExternalLink, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

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
  const [isOpen, setIsOpen] = useState(false);

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

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="rounded-md border bg-card"
    >
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 truncate mr-2">
            <div className="font-medium truncate">{model.model_name}</div>
            <div className="text-xs text-muted-foreground">
              {sourceName} • {model.folder_path} • Started {timeAgo}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {model.status === "failed" && (
              <AlertCircle className="h-5 w-5 text-destructive" />
            )}
            {modelUrl && (
              <a
                href={modelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">Toggle details</span>
                {isOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-medium">Details</span>
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        <div className="mt-2">
          <Progress
            value={model.download_progress}
            className={cn(
              model.status === "failed" && "bg-destructive/20",
              "h-2",
            )}
            indicatorClassName={
              model.status === "failed" ? "bg-destructive" : undefined
            }
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
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

      <CollapsibleContent>
        <div className="border-t p-3 space-y-2">
          {model.civitai_model_response?.images &&
            model.civitai_model_response.images.length > 0 && (
              <div className="aspect-square w-full max-w-[200px] mx-auto overflow-hidden rounded-md">
                <img
                  src={model.civitai_model_response.images[0].url}
                  alt={model.model_name}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

          {model.civitai_model_response?.description && (
            <div className="text-sm">
              <div className="font-medium mb-1">Description</div>
              <div
                className="text-muted-foreground text-xs"
                dangerouslySetInnerHTML={{
                  __html:
                    model.civitai_model_response.description.substring(0, 300) +
                    (model.civitai_model_response.description.length > 300
                      ? "..."
                      : ""),
                }}
              />
            </div>
          )}

          {model.error_log && (
            <div className="text-sm">
              <div className="font-medium mb-1 text-destructive">Error</div>
              <pre className="text-xs text-destructive whitespace-pre-wrap bg-destructive/10 p-2 rounded">
                {model.error_log}
              </pre>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
