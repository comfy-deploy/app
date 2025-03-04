import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef } from "react";
import { toast } from "sonner";
import { create } from "zustand";

type ViewMode = "mixed" | "private" | "public";

export type VolFSStructure = {
  contents: (VolFolder | VolFile)[];
};

export type VolFolder = {
  path: string;
  type: "folder";
  contents: (VolFolder | VolFile)[];
};

export type VolFile = {
  path: string;
  type: "file";
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

export type FileEntry = {
  path: string;
  type: 1 | 2; // 1 for file, 2 for folder
  mtime: number;
  size: number;
};

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
  viewMode: "mixed",
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

export function useModels() {
  const setIsPrivateModelRefreshing = modelBrowserState(
    (s) => s.setIsPrivateModelRefreshing,
  );

  const setIsPublicModelRefreshing = modelBrowserState(
    (s) => s.setIsPublicModelRefreshing,
  );

  const disableCacheRef = useRef(false);

  const { data: privateFiles, refetch: _refetchPrivateVolume } = useQuery({
    queryKey: ["volume", "private-models"],
    queryFn: async ({ queryKey }) => {
      console.log("refreshing private models");
      setIsPrivateModelRefreshing(true);
      const contents = await api({
        url: queryKey.join("/"),
        params: {
          disable_cache: disableCacheRef.current,
        },
      });
      setIsPrivateModelRefreshing(false);
      disableCacheRef.current = false;
      return contents as FileEntry[];
    },
    refetchInterval: 30000,
  });

  const { data: publicFiles, refetch: _refetchPublicVolume } = useQuery({
    queryKey: ["volume", "public-models"],
    queryFn: async ({ queryKey }) => {
      setIsPublicModelRefreshing(true);
      const contents = await api({
        url: queryKey.join("/"),
      });
      setIsPublicModelRefreshing(false);
      return contents as FileEntry[];
    },
  });

  const { data: downloadingModels, refetch: refetchDownloadingModels } =
    useQuery({
      queryKey: ["volume", "downloading-models"],
      queryFn: async ({ queryKey }) => {
        const contents = await api({
          url: queryKey.join("/"),
        });
        return contents;
      },
      refetchOnWindowFocus: false,
      refetchInterval: (data) => {
        if (data?.state.data?.length === 0) {
          return 50000;
        }
        return 1000;
      },
    });

  const flattenedModels = useMemo<Model[]>(() => {
    if (!privateFiles || !publicFiles) return [];

    const processFiles = (files: FileEntry[], isPrivate: boolean): Model[] => {
      const models: Model[] = [];

      for (const file of files) {
        // Only process files (type 1), not folders (type 2)
        if (file.type === 1) {
          const path = file.path;
          const pathParts = path.split("/");
          const name = pathParts[pathParts.length - 1];
          const type = pathParts[0];
          const category = pathParts.length > 1 ? pathParts[0] : "other";

          models.push({
            id: path, // Use path as ID since we don't have explicit IDs
            path,
            name,
            type,
            isPrivate,
            isPublic: !isPrivate,
            category,
            created_at: new Date(file.mtime * 1000),
            size: file.size,
            status: "success", // Assume success for existing files
          });
        }
      }

      return models;
    };

    const privateModels = processFiles(privateFiles, true);
    const publicModels = processFiles(publicFiles, false);

    // Combine and merge public and private models
    return [...publicModels, ...privateModels].reduce((acc, model) => {
      const existingModel = acc.find((m) => m.path === model.path);
      if (existingModel) {
        existingModel.isPrivate = existingModel.isPrivate || model.isPrivate;
        existingModel.isPublic = existingModel.isPublic || model.isPublic;
      } else {
        acc.push(model);
      }
      return acc;
    }, [] as Model[]);
  }, [privateFiles, publicFiles]);

  const refetchPrivateVolume = (disableCache = false) => {
    disableCacheRef.current = disableCache;
    return _refetchPrivateVolume();
  };

  const refetchPublicVolume = (disableCache = false) => {
    disableCacheRef.current = disableCache;
    return _refetchPublicVolume();
  };

  return {
    flattenedModels,
    publicFiles,
    privateFiles,
    downloadingModels,
    refetchDownloadingModels,
    refetchPrivateVolume,
    refetchPublicVolume,
  };
}
