import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

const BATCH_SIZE = 20;

export function useWorkflowList(debouncedSearchValue: string) {
  return useInfiniteQuery<any[]>({
    queryKey: ["workflows"],
    meta: {
      limit: BATCH_SIZE,
      offset: 0,
      params: {
        search: debouncedSearchValue ?? "",
      },
    },
    getNextPageParam: (lastPage, allPages) => {
      // Check if lastPage is defined and has a length property
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
  });
}

export function useWorkflowsAll() {
  return useQuery<any[]>({
    queryKey: ["workflows", "all"],
    refetchInterval: 5000,
  });
}
