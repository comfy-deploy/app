import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DownloadingModel } from "@/types/models";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Copy,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ImageIcon,
  Folder,
  Clock,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function DownloadingModels() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAllModels, setShowAllModels] = useState(false);
  const MAX_VISIBLE_MODELS = 3;

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

  // Determine if we need to use compact mode (many downloads)
  const useCompactMode = downloadingModels.length > 5;

  // Determine which models to show based on showAllModels state
  const visibleModels = showAllModels
    ? downloadingModels
    : downloadingModels.slice(0, MAX_VISIBLE_MODELS);

  const hiddenModelsCount = downloadingModels.length - visibleModels.length;

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={setIsExpanded}
      className="rounded-md border bg-card"
    >
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <h3 className="font-medium">Downloading Models</h3>
          <Badge variant="outline">{downloadingModels.length}</Badge>
        </div>
      </div>

      <CollapsibleContent>
        <div className="space-y-2 p-3 pt-0">
          {visibleModels.map((model) => (
            <DownloadingModelItem key={model.id} model={model} />
          ))}

          {hiddenModelsCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              onClick={() => setShowAllModels(!showAllModels)}
            >
              {showAllModels
                ? "Show Less"
                : `Show ${hiddenModelsCount} More Downloads`}
            </Button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function DownloadingModelItem({
  model,
}: {
  model: DownloadingModel;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const queryClient = useQueryClient();

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

  const cancelMutation = useMutation({
    mutationFn: async () => {
      return api({
        url: `file/${model.id}/cancel`,
        init: { method: "DELETE" }
      });
    },
    onSuccess: () => {
      toast.success("Download cancelled successfully");
      queryClient.invalidateQueries({ queryKey: ["volume", "downloading-models"] });
    },
    onError: (error) => {
      toast.error("Failed to cancel download");
    }
  });

  const copyModelUrl = () => {
    if (modelUrl) {
      navigator.clipboard.writeText(modelUrl);
      toast.success("Download link copied to clipboard");
    }
  };

  return (
    <div className="overflow-hidden rounded-md border bg-card">
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="mr-2 flex-1 truncate">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div className="truncate font-medium">{model.model_name}</div>
                <div className="mx-2 h-3 w-[1px] bg-gray-800" />
                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                  <span className="flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" />
                    {sourceName}
                  </span>
                  <span>•</span>
                  <span className="flex max-w-[120px] items-center gap-1 truncate">
                    <Folder className="h-3 w-3" />
                    {model.folder_path}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Started {timeAgo}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress bar section - below the model name */}
            <div className="mt-1 flex items-center gap-2">
              <Progress
                value={model.download_progress}
                className={cn(
                  "h-1.5 flex-1",
                  model.status === "failed" && "bg-destructive/20",
                )}
              />
              <span className="min-w-[2.5rem] text-right text-muted-foreground text-xs">
                {model.status === "failed"
                  ? "Failed"
                  : `${model.download_progress}%`}
              </span>
              {model.status !== "failed" && (
                <span className="min-w-[5rem] text-muted-foreground text-xs">
                  {model.download_progress === 100
                    ? "Processing..."
                    : "Downloading"}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {model.status === "failed" && (
              <AlertCircle className="h-5 w-5 text-destructive" />
            )}
            {/* Only show cancel button if download has been in progress for more than 1 hour */}
            {new Date().getTime() - new Date(model.created_at).getTime() > 60 * 60 * 1000 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                title="Cancel download"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
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
      </div>
    </div>
  );
}
