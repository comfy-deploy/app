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
      if (
        lastPage &&
        Array.isArray(lastPage) &&
        lastPage.length === BATCH_SIZE
      ) {
        return allPages.length * BATCH_SIZE;
      }
      return undefined;
    },
    initialPageParam: 0,
    select: (data) => {
      console.log('useSharedWorkflows select - raw data:', data);
      const result = {
        ...data,
        pages: data.pages.map(
          (page: SharedWorkflowListResponse | SharedWorkflow[]) => {
            console.log('useSharedWorkflows select - processing page:', page);
            // Handle the backend response structure
            const processedPage = (
              (page as SharedWorkflowListResponse)?.shared_workflows ||
              (page as SharedWorkflow[]) ||
              []
            );
            console.log('useSharedWorkflows select - processed page:', processedPage);
            return processedPage;
          },
        ),
      };
      console.log('useSharedWorkflows select - final result:', result);
      return result;
    },
  });
}
