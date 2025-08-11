import { useInfiniteQuery } from "@tanstack/react-query";

const BATCH_SIZE = 20;

interface SharedWorkflow {
  id: string;
  user_id: string;
  org_id: string;
  workflow_id: string;
  workflow_version_id: string;
  workflow_export: Record<string, unknown>;
  share_slug: string;
  title: string;
  description: string;
  cover_image: string;
  is_public: boolean;
  view_count: number;
  download_count: number;
  created_at: string;
  updated_at: string;
}

interface SharedWorkflowListResponse {
  shared_workflows: SharedWorkflow[];
  total: number;
}

export function useSharedWorkflows(
  debouncedSearchValue = "",
  user_id = "",
  limit = BATCH_SIZE,
) {
  return useInfiniteQuery<SharedWorkflow[]>({
    queryKey: ["shared-workflows"],
    queryKeyHashFn: (queryKey) => {
      return [...queryKey, debouncedSearchValue, limit, user_id].join(",");
    },
    meta: {
      limit: limit,
      offset: 0,
      params: {
        search: debouncedSearchValue ?? "",
        user_id: user_id,
      },
    },
    getNextPageParam: (lastPage, allPages) => {
      const pageItems = Array.isArray(lastPage)
        ? (lastPage as SharedWorkflow[])
        : (lastPage as SharedWorkflowListResponse)?.shared_workflows ?? [];

      if (pageItems.length === limit) {
        return allPages.length * limit;
      }

      return undefined;
    },
    initialPageParam: 0,
    select: (data) => ({
      ...data,
      pages: data.pages.map(
        (page: SharedWorkflowListResponse | SharedWorkflow[]) => {
          // Handle the backend response structure
          return (
            (page as SharedWorkflowListResponse)?.shared_workflows ||
            (page as SharedWorkflow[]) ||
            []
          );
        },
      ),
    }),
  });
}
