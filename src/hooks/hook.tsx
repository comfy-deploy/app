"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMatchRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "../lib/api";

export function useWorkflowIdInWorkflowPage() {
  const matchRoute = useMatchRoute();
  const params = matchRoute({ to: "/workflows/$workflowId/$view" });

  const search = useSearch({
    // from: "/sessions/$sessionId/",
    strict: false,
  });

  if (search.workflowId) {
    return search.workflowId;
  }

  if (!params) {
    return null;
  }

  return params.workflowId;
}

export function useAssetList(path = "/") {
  return useQuery({
    queryKey: ["assets", path],
    queryFn: async () => {
      const response = await api({
        url: "assets",
        params: { path },
      });
      return response;
    },
  });
}

export function useAssetUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      parent_path = "/",
      onProgress,
    }: {
      file: File;
      parent_path?: string;
      onProgress?: (progress: number) => void;
    }) => {
      if (file.size < 50 * 1024 * 1024) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("parent_path", parent_path);

        return await api({
          url: "assets/upload",
          skipDefaultHeaders: true,
          init: {
            method: "POST",
            body: formData,
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.lengthComputable && onProgress) {
              const progress = (progressEvent.loaded / progressEvent.total) * 100;
              onProgress(progress);
            }
          },
        });
      } else {
        onProgress?.(5); // Show initial progress
        const presignedUrlResponse = await api({
          url: "assets/presigned-url",
          params: {
            file_name: file.name,
            parent_path,
            size: file.size,
            type: file.type,
          },
        });
        
        onProgress?.(10); // URL obtained
        
        const uploadResponse = await fetch(presignedUrlResponse.url, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file to storage');
        }
        
        onProgress?.(90); // Almost done
        
        const registeredAsset = await api({
          url: "assets/register",
          init: {
            method: "POST",
            body: JSON.stringify({
              file_id: presignedUrlResponse.file_id,
              file_name: file.name,
              file_size: file.size,
              db_path: presignedUrlResponse.db_path,
              url: presignedUrlResponse.download_url,
              mime_type: file.type,
            }),
          },
        });
        
        onProgress?.(100); // Complete
        return registeredAsset;
      }
    },
    onSuccess: (data, variables) => {
      // Update the asset list query data
      queryClient.setQueryData<any[]>(
        ["assets", variables.parent_path],
        (old) => {
          if (!old) return [data];
          return [...old, data];
        },
      );

      // Also invalidate the query to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      parent_path = "/",
    }: {
      name: string;
      parent_path?: string;
    }) => {
      return await api({
        url: "assets/folder",
        init: {
          method: "POST",
          body: JSON.stringify({ name, parent_path }),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assetId: string) => {
      return await api({
        url: `assets/${assetId}`,
        init: {
          method: "DELETE",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}
