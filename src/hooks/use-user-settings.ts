import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

export function useUserSettings() {
  return useQuery<any>({
    queryKey: ["platform", "user-settings"],
  });
}

const BATCH_SIZE = 20;

export function useAPIKeyList(debouncedSearchValue: string) {
  return useInfiniteQuery<any[]>({
    queryKey: ["platform", "api-keys"],
    queryKeyHashFn: (queryKey) =>
      [...queryKey, debouncedSearchValue].toString(),
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
