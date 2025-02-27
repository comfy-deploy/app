"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import {
  CheckCircle,
  Download,
  FileIcon,
  Link,
  Plus,
  RefreshCcw,
  Search,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { create } from "zustand";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

import { LoadingIcon } from "@/components/ui/custom/loading-icon";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { sendInetrnalEventToCD as sendInternalEventToCD } from "@/components/workspace/sendEventToCD";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { toast } from "sonner";

import { useModels } from "@/hooks/use-model";
import { useDebounce } from "use-debounce";

type RetryResponse = {
  id: string;
  download_url: string;
  folder_path: string;
  filename: string;
  upload_type: string;
};

export interface Model {
  id: string;
  path: string;
  name: string;
  size: number;
  type: string;
  isPrivate: boolean;
  isPublic: boolean;
  category: string;
  created_at?: Date;
  error_log?: string;
  status?: string;
}

type ViewMode = "mixed" | "private" | "public";

const CATEGORIES = [
  { id: "checkpoints", label: "checkpoints" },
  { id: "loras", label: "loras" },
  { id: "controlnet", label: "controlnet" },
];

export const JSON_TEMPLATES = {
  checkpoints: {
    type: "checkpoint",
    modelPath: "",
    name: "",
    isPrivate: false,
  },
  loras: {
    type: "lora",
    modelPath: "",
    name: "",
    isPrivate: false,
    strength: 0.5,
  },
  controlnet: {
    type: "controlnet",
    modelPath: "",
    name: "",
    isPrivate: false,
    controlnetType: "canny",
  },
  other: {
    type: "other",
    modelPath: "",
    name: "",
    isPrivate: false,
  },
};

export const generateJsonDefinition = (template: any, model: Model) => {
  return {
    ...template,
    modelPath: model.path,
    name: model.name,
    isPrivate: model.isPrivate,
  };
};

export function useModelRerfresher() {
  const { public_volume, private_volume } = useModels();
  useEffect(() => {
    const receiveMessage = async (event: any) => {
      // It's important to check the origin for security reasons
      if (event.data.internal) {
        switch (event.data.internal.type) {
          case "get_model_defs":
            sendInternalEventToCD({
              type: "refresh_defs",
              data: {
                volume_content: public_volume?.structure,
                source: "public",
                rewrite: true,
              },
            });
            sendInternalEventToCD({
              type: "refresh_defs",
              data: {
                volume_content: private_volume?.structure,
                source: "private",
                rewrite: true,
              },
            });
            return;

          default:
            break;
        }
      }
    };

    window.addEventListener("message", receiveMessage, {
      capture: true,
    });

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener("message", receiveMessage, {
        capture: true,
      });
    };
  }, [public_volume, private_volume]);

  return React.useCallback(() => {
    console.log("refreshing models", public_volume, private_volume);
    sendInternalEventToCD({
      type: "refresh_defs",
      data: {
        volume_content: public_volume?.structure,
        source: "public",
        rewrite: true,
      },
    });
    sendInternalEventToCD({
      type: "refresh_defs",
      data: {
        volume_content: private_volume?.structure,
        source: "private",
        rewrite: true,
      },
    });
  }, [public_volume, private_volume]);
}

type RetryMutationVariables = {
  modelId: string;
  modelName: string;
};

// export function useModels() {
//   const setIsPrivateModelRefreshing = modelBrowserState(
//     (s) => s.setIsPrivateModelRefreshing,
//   );

//   const setIsPublicModelRefreshing = modelBrowserState(
//     (s) => s.setIsPublicModelRefreshing,
//   );

//   // const [disableCache, setDisableCache] = useState(false);
//   const disableCacheRef = useRef(false);

//   const { data: private_volume, refetch: _refetchPrivateVolume } = useQuery({
//     queryKey: ["volume", "private-models"],
//     queryFn: async ({ queryKey }) => {
//       console.log("refreshing private models");
//       setIsPrivateModelRefreshing(true);
//       // const contents = await getPrivateVolumeList(true);
//       // const contents = await api({
//       //   url: queryKey.join("/"),
//       // });
//       const contents = await fetch(`/api/volume`, {
//         method: "POST",
//         body: JSON.stringify({
//           url: queryKey.join("/"),
//           type: "private-volume",
//           disableCache: disableCacheRef.current,
//         }),
//       })
//         .then((res) => res.json())
//         .then((data) => data);
//       setIsPrivateModelRefreshing(false);
//       disableCacheRef.current = false;
//       toast.success("Private Models Refreshed");
//       return {
//         structure: contents.structure as VolFSStructure,
//         models: contents.models as ModelType[],
//       };
//     },
//     refetchInterval: (data) => {
//       return 30000;
//     },
//     refetchOnMount: false,
//     refetchOnWindowFocus: false,
//     // enabled: false,
//   });

//   const { data: public_volume, refetch: _refetchPublicVolume } = useQuery({
//     queryKey: ["volume", "public-models"],
//     queryFn: async ({ queryKey }) => {
//       setIsPublicModelRefreshing(true);
//       // const contents = await getPublicVolumeList(true);
//       // const contents = await api({
//       //   url: queryKey.join("/"),
//       // });
//       const contents = await fetch(`/api/volume`, {
//         method: "POST",
//         body: JSON.stringify({
//           url: queryKey.join("/"),
//           type: "public-volume",
//           disableCache: disableCacheRef.current,
//         }),
//       })
//         .then((res) => res.json())
//         .then((data) => data);
//       setIsPublicModelRefreshing(false);
//       disableCacheRef.current = false;
//       // sendInternalEventToCD({
//       //   type: "refresh_defs",
//       //   data: {
//       //     volume_content: contents,
//       //     rewrite: true,
//       //   },
//       // });
//       toast.success("Public Models Refreshed");
//       return {
//         structure: contents.structure as VolFSStructure,
//         models: contents.models as ModelType[],
//       };
//     },
//     refetchOnMount: false,
//     refetchOnWindowFocus: false,
//     // enabled: false,
//   });

//   const { data: downloadingModels, refetch: refetchDownloadingModels } =
//     useQuery({
//       queryKey: ["volume", "downloading-models"],
//       queryFn: async ({ queryKey }) => {
//         // const contents = await getDownloadingModels();
//         const contents = await api({
//           url: queryKey.join("/"),
//         });
//         return contents;
//       },
//       refetchOnWindowFocus: false,
//       refetchInterval: (data) => {
//         if (data?.state.data?.length === 0) {
//           return 50000;
//         }
//         return 1000;
//       },
//     });

//   const flattenedModels = useMemo<Model[]>(() => {
//     const flatten = (
//       items: (VolFolder | VolFile)[],
//       models: ModelType[],
//       prefix = "",
//       isPrivate: boolean,
//     ): Model[] => {
//       return items.reduce<Model[]>((acc, item) => {
//         const path = `${item.path}`;
//         const pathParts = path.split("/");
//         const category = pathParts.length > 1 ? pathParts[0] : "other";
//         if (item.type === "file") {
//           const name = pathParts.pop() || "";
//           const type = pathParts[0];
//           const existingModel = acc.find((m) => m.path === path);
//           if (existingModel) {
//             existingModel.isPrivate = existingModel.isPrivate || isPrivate;
//             existingModel.isPublic = existingModel.isPublic || !isPrivate;
//           } else {
//             const model = models.find((m) => {
//               const folder_path = m.folder_path
//                 ? [m.folder_path, m.model_name].join("/")
//                 : m.model_name;
//               const status = m.status;
//               if (!folder_path || status !== "success") return false;
//               return folder_path?.includes(path);
//             });
//             if (!model?.id) return acc;
//             acc.push({
//               id: model?.id, // Use path as fallback ID if model is not found
//               path,
//               name,
//               type,
//               isPrivate,
//               isPublic: !isPrivate,
//               category,
//               created_at: model?.created_at || new Date(), // Add created time
//               error_log: model?.error_log || "",
//               status: model?.status || "failed", // Add status field
//               size: model?.size || 0,
//             });
//           }
//         } else if (item.type === "folder" && item.contents) {
//           return [
//             ...acc,
//             ...flatten(item.contents, models, `${path}/`, isPrivate),
//           ];
//         }
//         return acc;
//       }, []);
//     };

//     const publicModels = public_volume
//       ? flatten(
//           public_volume.structure.contents,
//           public_volume.models,
//           "",
//           false,
//         )
//       : [];
//     const privateModels = private_volume
//       ? flatten(
//           private_volume.structure.contents,
//           private_volume.models,
//           "",
//           true,
//         )
//       : [];

//     // Combine and merge public and private models, prioritizing private model IDs
//     return [...publicModels, ...privateModels].reduce((acc, model) => {
//       const existingModel = acc.find((m) => m.path === model.path);
//       if (existingModel) {
//         existingModel.isPrivate = existingModel.isPrivate || model.isPrivate;
//         existingModel.isPublic = existingModel.isPublic || model.isPublic;
//         // If the model is private, use its ID
//         if (model.isPrivate) existingModel.id = model.id;
//       } else {
//         acc.push(model);
//       }
//       return acc;
//     }, [] as Model[]);
//   }, [public_volume, private_volume]);

//   const refetchPrivateVolume = (disableCache = false) => {
//     disableCacheRef.current = disableCache;
//     return _refetchPrivateVolume();
//   };

//   const refetchPublicVolume = (disableCache = false) => {
//     disableCacheRef.current = disableCache;
//     return _refetchPublicVolume();
//   };

//   return {
//     flattenedModels,
//     public_volume,
//     private_volume,
//     downloadingModels,
//     refetchDownloadingModels,
//     refetchPrivateVolume,
//     refetchPublicVolume,
//   };
// }

const modelBrowserState = create<{
  addModelModalOpen: boolean;
  setAddModelModalOpen: (addModelModalOpen: boolean) => void;
  insertModalSource:
    | "huggingface"
    | "civitai"
    | "link"
    | "local"
    | "comfymanager"
    | undefined;
  setInsertModalSource: (
    insertModalSource:
      | "huggingface"
      | "civitai"
      | "link"
      | "local"
      | "comfymanager"
      | undefined,
  ) => void;

  filter: string;
  viewMode: ViewMode;
  // isMinimized: boolean;
  selectedCategories: string[];
  setFilter: (filter: string) => void;
  setViewMode: (viewMode: ViewMode) => void;
  setSelectedCategories: (selectedCategories: string[]) => void;
  isPrivateModelRefreshing: boolean;
  setIsPrivateModelRefreshing: (isPrivateModelRefreshing: boolean) => void;

  isPublicModelRefreshing: boolean;
  setIsPublicModelRefreshing: (isPublicModelRefreshing: boolean) => void;

  status: "ready" | "refreshing";
  setStatus: (status: "ready" | "refreshing") => void;
}>((set) => ({
  insertModalSource: undefined,
  setInsertModalSource: (
    insertModalSource:
      | "huggingface"
      | "civitai"
      | "link"
      | "local"
      | "comfymanager"
      | undefined,
  ) => set({ insertModalSource }),

  filter: "",
  viewMode: "private",
  // isMinimized: false,
  selectedCategories: [],
  setFilter: (filter: string) => set({ filter }),
  setViewMode: (viewMode: ViewMode) => set({ viewMode }),
  setSelectedCategories: (selectedCategories: string[]) =>
    set({ selectedCategories }),
  isPrivateModelRefreshing: false,
  setIsPrivateModelRefreshing: (isPrivateModelRefreshing: boolean) =>
    set({ isPrivateModelRefreshing }),

  isPublicModelRefreshing: false,
  setIsPublicModelRefreshing: (isPublicModelRefreshing: boolean) =>
    set({ isPublicModelRefreshing }),

  status: "ready",
  setStatus: (status: "ready" | "refreshing") => set({ status }),

  addModelModalOpen: false,
  setAddModelModalOpen: (addModelModalOpen: boolean) =>
    set({ addModelModalOpen }),
}));

export function openAddModelModal() {
  modelBrowserState.getState().setAddModelModalOpen(true);
}

export function useModelBrowser() {
  const { public_volume, private_volume } = useModels();
  const [isMinimized, setIsMinimized] = useLocalStorage<boolean>(
    "modelBrowserIsMinimized",
    false,
  );

  const {
    insertModalSource,
    setInsertModalSource,
    filter,
    viewMode,
    selectedCategories,
    setFilter,
    setViewMode,
    setSelectedCategories,
    addModelModalOpen,
    setAddModelModalOpen,
  } = modelBrowserState();

  return {
    insertModalSource,
    setInsertModalSource,
    addModelModalOpen,
    setAddModelModalOpen,
    public_volume,
    private_volume,
    filter,
    viewMode,
    isMinimized,
    selectedCategories,
    setFilter,
    setViewMode,
    setIsMinimized,
    setSelectedCategories,
  };
}

export function ModelListHeader() {
  const isPrivateModelRefreshing = modelBrowserState(
    (s) => s.isPrivateModelRefreshing,
  );

  const isPublicModelRefreshing = modelBrowserState(
    (s) => s.isPublicModelRefreshing,
  );

  const {
    private_volume,
    flattenedModels,
    downloadingModels,
    refetchDownloadingModels,
    refetchPrivateVolume,
    refetchPublicVolume,
  } = useModels();

  const [modelToRetry, setModelToRetry] = useState<{
    id: string;
    name: string | null;
  } | null>(null);

  const { mutateAsync: retryDownload } = useMutation({
    mutationKey: ["volume", "file", "retry"],
    mutationFn: async ({ modelId, modelName }: RetryMutationVariables) => {
      return await api({
        url: `volume/file/${modelId}/retry`,
        init: {
          method: "POST",
        },
      });
    },
    onSuccess: (data, variables) => {
      toast.success(`Retrying download for ${variables.modelName}`);
      refetchDownloadingModels();
      setModelToRetry(null);
    },
    onError: (error) => {
      toast.error(`Failed to retry download: ${error.message}`);
      setModelToRetry(null);
    },
  });

  useEffect(() => {
    downloadingModels?.forEach((model: any) => {
      if (model.is_done) {
        refetchPrivateVolume(true);
        toast.success(`${model.model_name} downloaded`);
      } else if (model.error) {
        toast.error(`Error downloading ${model.model_name}: ${model.error}`);
      }
    });
  }, [downloadingModels]);

  const recentlyInstalledModels = useMemo(() => {
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000,
    ).getTime();
    return private_volume?.models.filter((model) => {
      const installedAt = new Date(model.created_at || new Date()).getTime();
      return installedAt > twentyFourHoursAgo;
    });
  }, [private_volume, downloadingModels]);

  return (
    <>
      <div className="flex items-center justify-center">Model Browser</div>
      <div className="flex items-center justify-center">
        <div className="flex h-6 items-center gap-2">
          <HoverCard>
            <HoverCardTrigger>
              <Badge
                variant="outline"
                className="flex h-6 items-center gap-1 px-2"
              >
                <div
                  className={`h-2 w-2 rounded-full ${
                    isPrivateModelRefreshing || isPublicModelRefreshing
                      ? "animate-pulse bg-yellow-400"
                      : "bg-green-400"
                  }`}
                />
                <span className="text-xs">
                  {isPrivateModelRefreshing || isPublicModelRefreshing
                    ? "Checking"
                    : "Ready"}
                </span>
              </Badge>
            </HoverCardTrigger>
            <HoverCardContent className="w-fit">
              <div className="flex flex-col justify-center gap-2 text-xs">
                {isPublicModelRefreshing ? (
                  <div className="flex flex-row items-center gap-2">
                    <LoadingIcon className="h-6 w-6 p-1" />
                    Refreshing public models from volume...
                  </div>
                ) : (
                  <div className="flex flex-row items-center gap-2">
                    <CheckCircle className="h-6 w-6 p-1 text-green-400" />
                    Public volume is ready
                  </div>
                )}
                {isPrivateModelRefreshing ? (
                  <div className="flex flex-row items-center gap-2">
                    <LoadingIcon className="h-6 w-6 p-1" />
                    Refreshing private models from volume...
                  </div>
                ) : (
                  <div className="flex flex-row items-center gap-2">
                    <CheckCircle className="h-6 w-6 p-1 text-green-400" />
                    Private volume is ready
                  </div>
                )}
              </div>
            </HoverCardContent>
          </HoverCard>
          {isPrivateModelRefreshing || isPublicModelRefreshing ? (
            <LoadingIcon className="h-6 w-6 p-1" />
          ) : (
            <Button
              variant="ghost"
              size="sm"
              hideLoading
              className="h-6 w-6 p-1"
              onClick={() => {
                refetchDownloadingModels();
                refetchPrivateVolume(true);
                refetchPublicVolume(true);
              }}
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  hideLoading
                  className="h-6 w-6 p-1"
                >
                  <Download className="h-4 w-4" />
                </Button>
                {downloadingModels && downloadingModels.length > 0 && (
                  <span className="pointer-events-none absolute right-0 bottom-0 flex h-3 w-3 items-center justify-center rounded-full bg-black text-[10px] text-white">
                    {downloadingModels.length}
                  </span>
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end" alignOffset={-8}>
              {downloadingModels && downloadingModels.length > 0 ? (
                <div className="space-y-2">
                  {downloadingModels.map((model: any) => (
                    <div key={model.id} className="flex flex-col">
                      <span className="truncate font-medium text-sm">
                        {model.model_name}
                      </span>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={model.download_progress}
                          className="h-2 flex-grow"
                        />
                        <span className="text-muted-foreground text-xs">
                          {model.download_progress
                            ? model.download_progress.toFixed(0)
                            : "0"}
                          %
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              {recentlyInstalledModels &&
                recentlyInstalledModels.length > 0 && (
                  <div className="mt-4">
                    <h3 className="mb-2 font-semibold text-sm">
                      Recently Installed Models (24h)
                    </h3>
                    <ul className="scrollbar scrollbar-thumb-gray-200 scrollbar-track-transparent max-h-[400px] space-y-1 overflow-y-auto">
                      {recentlyInstalledModels.map((model) => (
                        <HoverCard key={model.id}>
                          <HoverCardTrigger asChild>
                            <li className="flex cursor-pointer items-center gap-2 text-sm">
                              <span className="flex-1 truncate">
                                {model.model_name}
                              </span>
                              <div className="flex flex-shrink-0 items-center gap-2">
                                {model.status === "failed" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setModelToRetry({
                                        id: model.id,
                                        name: model.model_name,
                                      });
                                    }}
                                  >
                                    <RefreshCcw className="h-4 w-4" />
                                  </Button>
                                )}
                                <Badge
                                  variant={
                                    model.status === "success"
                                      ? "success"
                                      : model.status === "failed"
                                        ? "destructive"
                                        : "yellow"
                                  }
                                >
                                  {model.status}
                                </Badge>
                              </div>
                            </li>
                          </HoverCardTrigger>
                          <HoverCardContent side="right" className="w-80">
                            <ModelItemHoverDetails model={model} />
                          </HoverCardContent>
                        </HoverCard>
                      ))}
                    </ul>
                  </div>
                )}
              {(!downloadingModels || downloadingModels.length === 0) &&
                recentlyInstalledModels &&
                recentlyInstalledModels.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm">
                    No models currently downloading or recently installed
                  </p>
                )}
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <Dialog open={!!modelToRetry} onOpenChange={() => setModelToRetry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retry Download</DialogTitle>
            <DialogDescription>
              Are you sure you want to retry downloading {modelToRetry?.name}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModelToRetry(null)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (modelToRetry) {
                  await retryDownload({
                    modelId: modelToRetry.id,
                    modelName: modelToRetry.name || "",
                  });
                }
              }}
            >
              Retry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ModelItemHoverDetails(props: { model: any }) {
  const { model } = props;
  return (
    <>
      <div className="flex flex-col space-y-2">
        <span className="font-semibold text-base">{model.model_name}</span>
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">Status:</span>
          <div className="flex items-center gap-2">
            {/* {model.status === "failed" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setModelToRetry({
                    id: model.id,
                    name: model.model_name,
                  });
                }}
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            )} */}
            <Badge
              variant={
                model.status === "success"
                  ? "success"
                  : model.status === "failed"
                    ? "destructive"
                    : "yellow"
              }
            >
              {model.status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">Installed:</span>
          <span className="text-sm">
            {new Date(model.created_at || new Date()).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">Path:</span>
          <span className="max-w-[200px] truncate text-sm">
            {model.folder_path?.endsWith("/")
              ? model.folder_path
              : `${model.folder_path}/`}
          </span>
        </div>
        {model.error_log && (
          <div className="mt-2 rounded-md bg-red-100 p-2">
            <span className="font-medium text-red-800 text-sm">Error:</span>
            <p className="mt-1 text-red-700 text-xs">{model.error_log}</p>
          </div>
        )}
      </div>
    </>
  );
}

export function ModelListView(props: {
  children: React.ReactNode;
  className?: string;
}) {
  const {
    filter,
    viewMode,
    isMinimized,
    selectedCategories,
    setFilter,
    setViewMode,
    setIsMinimized,
    setSelectedCategories,
    insertModalSource,
    setInsertModalSource,
    addModelModalOpen,
    setAddModelModalOpen,
  } = useModelBrowser();

  const toggleCategory = (category: string) => {
    setSelectedCategories(
      selectedCategories.includes(category)
        ? selectedCategories.filter((c) => c !== category)
        : [...selectedCategories, category],
    );
  };

  const [inputValue, setInputValue] = useState(filter);
  const [debouncedInputValue] = useDebounce(inputValue, 300);

  useEffect(() => {
    setFilter(debouncedInputValue);
  }, [debouncedInputValue, setFilter]);

  const { data: ctx } = useSuspenseQuery<any>({
    queryKey: ["platform", "plan"],
  });

  // if (!ctx) return null;

  return (
    <div className={cn("relative flex h-full flex-col gap-2", props.className)}>
      <>
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            {["private", "mixed", "public"].map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? "default" : "outline"}
                onClick={() => setViewMode(mode as ViewMode)}
                size="sm"
                className="h-6 px-2 text-xs"
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Button>
            ))}
          </div>

          {!ctx.features.priavteModels ? (
            <Tooltip>
              <TooltipTrigger>
                <Button
                  className="h-6 min-h-0 p-1 px-2 text-xs opacity-100 transition-all"
                  size="sm"
                  disabled={true}
                  Icon={Plus}
                  onClick={() => setAddModelModalOpen(true)}
                  iconPlacement="right"
                >
                  Add
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Private models are not available on your plan
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              className="h-6 min-h-0 p-1 px-2 text-xs opacity-100 transition-all"
              size="sm"
              Icon={Plus}
              onClick={() => setAddModelModalOpen(true)}
              iconPlacement="right"
            >
              Add
            </Button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute top-1.5 left-2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Search models..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="h-6 pl-7 text-xs"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((category) => (
            <Button
              key={category.id}
              variant={
                selectedCategories.includes(category.id) ? "default" : "outline"
              }
              // onClick={() => toggleCategory(category.id)}
              onClick={() => toggleCategory(category.id)}
              size="sm"
              className="h-6 px-2 text-xs"
            >
              {category.label}
            </Button>
          ))}
        </div>
      </>
      <div className="scrollbar scrollbar-thumb-gray-200 scrollbar-track-transparent h-full overflow-y-auto pr-2">
        <ul className="space-y-1">{props.children}</ul>
      </div>
    </div>
  );
}
