import { useInfiniteQuery } from "@tanstack/react-query";
import { dexieDB, type WorkflowData } from "./dexiedb";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect } from "react";
import { useLocation } from "@tanstack/react-router";
import React from "react";

const INITIAL_CACHE_SIZE = 20;

export function useDexieWorkflowList(debouncedSearchValue = "", limit = 20) {
  const location = useLocation();
  // Extract type and orgId from URL path
  const pathParts = location.pathname.split("/").filter(Boolean);
  const type = pathParts[0] || null;
  const orgIdFromParams = pathParts[1] || null;

  // Create a combined ID as the primary identifier (include search in the key)
  const id = type && orgIdFromParams ? `${type}_${orgIdFromParams}` : null;

  // Get cached data from Dexie
  const cachedWorkflows = useLiveQuery(
    async () => {
      if (!id) return null;
      // Always return cached data regardless of age
      return await dexieDB.workflows.get(id);
    },
    [id],
    null,
  );

  // Fetch real data
  const result = useInfiniteQuery<WorkflowData[]>({
    queryKey: ["workflows"],
    queryKeyHashFn: (queryKey) => {
      return [...queryKey, debouncedSearchValue, limit].join(",");
    },
    meta: {
      limit,
      offset: 0,
      params: {
        search: debouncedSearchValue,
      },
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage && Array.isArray(lastPage) && lastPage.length === limit) {
        return allPages.length * limit;
      }
      return undefined;
    },
    initialPageParam: 0,
  });

  const { data, isLoading } = result;

  // Calculate flattened data for the current result
  const flatData = data?.pages.flat() || [];

  // Track if this is the first load after a page refresh
  const isFirstLoad = React.useRef(true);

  // Update cache on first successful data load after page refresh
  useEffect(() => {
    // Only update if:
    // 1. We have data
    // 2. We're not loading
    // 3. This is the first load after a page refresh
    if (flatData.length > 0 && !isLoading && isFirstLoad.current && id) {
      // Mark that we've updated the cache
      isFirstLoad.current = false;

      // Cache the first batch of items
      const cacheData = flatData.slice(0, INITIAL_CACHE_SIZE);

      dexieDB.workflows.put({
        id,
        workflows: cacheData,
        timestamp: Date.now(),
      });

      //   console.log("🔄 Cache updated on page refresh", {
      //     cacheId: id,
      //     itemCount: cacheData.length,
      //     timestamp: new Date().toLocaleString(),
      //   });
    }
  }, [id, flatData, isLoading]);

  // Add log to show when cache is being used
  //   useEffect(() => {
  //     if (isLoading && cachedWorkflows) {
  //       console.log("🚀 Using cached workflows", {
  //         cacheId: id,
  //         cacheAge: `${Date.now() - cachedWorkflows.timestamp}ms`,
  //         cachedItemCount: cachedWorkflows.workflows.length,
  //         cachedAt: new Date(cachedWorkflows.timestamp).toLocaleString(),
  //       });
  //     }
  //   }, [isLoading, cachedWorkflows, id]);

  // Combine cached and fresh data for faster UI response
  const combinedData =
    isLoading && cachedWorkflows
      ? {
          pages: [cachedWorkflows.workflows],
          pageParams: [0],
        }
      : data;

  return {
    ...result,
    // Override data with combined data
    data: combinedData,
    // Show loading only if we don't have cache
    isLoading: isLoading && !cachedWorkflows,
    cachedWorkflows: cachedWorkflows?.workflows || [],
  };
}
