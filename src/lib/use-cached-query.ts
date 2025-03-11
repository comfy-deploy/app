import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
import { queryClient } from "./providers";

// Initialize localStorage persistence only once
let isStorageInitialized = false;

function initializeStorage() {
  if (typeof window === "undefined" || isStorageInitialized) return;

  isStorageInitialized = true;

  // Load all cached queries from localStorage on startup
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("query_cache_")) {
        const queryKey = key.replace("query_cache_", "");
        const cachedItem = localStorage.getItem(key);

        if (cachedItem) {
          const { data, expiry } = JSON.parse(cachedItem);
          const now = Date.now();

          // Only use cache if it hasn't expired
          if (now < expiry) {
            queryClient.setQueryData(queryKey.split("_"), data);
          } else {
            // Clean up expired cache
            localStorage.removeItem(key);
          }
        }
      }
    }
  } catch (e) {
    console.error("Error loading cached queries:", e);
  }
}

// Custom hook that adds flexible caching
/**
 * @Important NEVER cache confidential data
 */
export function useCachedQuery<TData = unknown>(
  options: UseQueryOptions<TData> & {
    queryKey: string[];
    cacheTime?: number;
  },
): UseQueryResult<TData> {
  // Initialize storage on first render
  if (typeof window !== "undefined" && !isStorageInitialized) {
    initializeStorage();
  }

  const { cacheTime, queryKey, ...queryOptions } = options;

  // Determine if this query should be cached
  const shouldCache = cacheTime !== undefined && cacheTime > 0;

  // Use the standard useQuery
  const result = useQuery<TData>({
    ...queryOptions,
    queryKey,
    gcTime: shouldCache ? cacheTime : 5 * 60 * 1000,
  });

  // Save successful query results to localStorage
  if (
    shouldCache &&
    result.data &&
    !result.isLoading &&
    typeof window !== "undefined"
  ) {
    const storageKey = `query_cache_${queryKey.join("_")}`;

    // Check if we have existing cache
    const existingCache = localStorage.getItem(storageKey);
    if (existingCache) {
      const { expiry } = JSON.parse(existingCache);
      const now = Date.now();

      // Only update if cache has expired
      if (now >= expiry) {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            data: result.data,
            expiry: now + cacheTime,
          }),
        );
      }
    } else {
      // No existing cache, create new one
      const now = Date.now();
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          data: result.data,
          expiry: now + cacheTime,
        }),
      );
    }
  }

  return result;
}
