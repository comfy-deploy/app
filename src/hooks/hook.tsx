"use client";

import { getOrgPathInfo } from "@/utils/org-path";
import { useAuth } from "@clerk/clerk-react";
import { useClerk } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useMatch, useMatchRoute } from "@tanstack/react-router";
import { useSearch } from "@tanstack/react-router";
import { parseAsString } from "nuqs";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { api } from "../lib/api";

export function useWorkflowIdInSessionView() {
  const match = useMatch({
    from: "/workflows/$workflowId/$view",
    shouldThrow: false,
  });
  const match2 = useMatch({
    from: "/sessions/$sessionId/",
    shouldThrow: false,
  });
  if (match) {
    return match.params.workflowId;
  }
  return match2?.search.workflowId;
}

export function useSessionIdInSessionView() {
  const match = useMatch({
    from: "/sessions/$sessionId/",
    shouldThrow: false,
  });
  const [sessionId] = useQueryState("sessionId", parseAsString);

  if (sessionId) {
    return sessionId;
  }
  return match?.params.sessionId;
}

export function useShareSlug() {
  const match = useMatch({
    from: "/share/$user/$slug",
    shouldThrow: false,
  });
  if (match) {
    return match.params.slug;
  }
  return null;
}

export function useWorkflowIdInWorkflowPage() {
  const location = useLocation();
  const pathname = location.pathname;
  const chunks = pathname.split("/").filter(Boolean);
  const { orgId, orgSlug } = useAuth();

  const { case1Match, case2Match, pathParts, pathWithoutOrg } = getOrgPathInfo(
    orgSlug ?? null,
    pathname.replace("//", "/"),
  );

  let parentPath = chunks[0];

  const clerk = useClerk();
  const personalOrg = clerk.user?.username ?? "personal";

  let workflowId = null;

  if (case2Match) {
    parentPath = chunks[2];
    if (parentPath === "workflows") {
      workflowId = chunks[3];
    }
  } else {
    parentPath = chunks[0];
    if (parentPath === "workflows") {
      workflowId = chunks[1];
    }
  }

  return workflowId;

  // const matchRoute = useMatchRoute();
  // const params = matchRoute({
  //   to: "/$type/$orgId/workflows/$workflowId/$view",
  // });
  // if (!params) {
  //   return null;
  // }
  // return params.workflowId;
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

        return await api({
          url: "assets/upload",
          skipDefaultHeaders: true,
          init: {
            method: "POST",
            body: formData,
          },
          params: {
            parent_path,
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.lengthComputable && onProgress) {
              const progress =
                (progressEvent.loaded / progressEvent.total) * 100;
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

        const xhr = new XMLHttpRequest();

        const uploadPromise = new Promise((resolve, reject) => {
          xhr.open("PUT", presignedUrlResponse.url, true);
          xhr.setRequestHeader("Content-Type", file.type);

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const progressPercentage = 10 + (e.loaded / e.total) * 80;
              onProgress?.(progressPercentage);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(xhr.response);
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = () => {
            reject(new Error("Network error during upload"));
          };

          xhr.send(file);
        });

        try {
          await uploadPromise;
        } catch (error: any) {
          throw new Error(
            "Failed to upload file to storage: " +
              (error.message || String(error)),
          );
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

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      assetId,
      path,
    }: { assetId: string; path: string }) => {
      return await api({
        url: `assets/${assetId}`,
        init: {
          method: "PATCH",
          body: JSON.stringify({ path }),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

export function useAddAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ url, path }: { url: string; path: string }) => {
      return await api({
        url: "assets/add",
        init: { method: "POST", body: JSON.stringify({ url, path }) },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

export function useMoveAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      assetId, 
      destinationPath 
    }: { 
      assetId: string;
      destinationPath: string;
    }) => {
      return await api({
        url: "assets/move",
        init: {
          method: "POST",
          body: JSON.stringify({ asset_id: assetId, destination_path: destinationPath }),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}
