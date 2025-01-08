import { useAuthStore } from "@/lib/auth-store";
import type { Percentile } from "@/lib/request/percentile";
import type { MakeArray } from "@/types";
import { infiniteQueryOptions, keepPreviousData } from "@tanstack/react-query";
import type { ColumnSchema } from "./schema";
import { type SearchParamsType, searchParamsSerializer } from "./search-params";

export type InfiniteQueryMeta = {
  totalRowCount: number;
  filterRowCount: number;
  totalFilters: MakeArray<ColumnSchema>;
  currentPercentiles: Record<Percentile, number>;
  chartData: { timestamp: number; [key: string]: number }[];
};

const API_URL = `${process.env.NEXT_PUBLIC_CD_API_URL}/api/runs`;

export const dataOptions = (search: SearchParamsType) => {
  return infiniteQueryOptions({
    queryKey: ["data-table", searchParamsSerializer({ ...search, id: null })], // remove uuid as it would otherwise retrigger a fetch
    queryFn: async ({ pageParam = 0 }) => {
      const offset = (pageParam as number) * search.limit;
      const serialize = searchParamsSerializer({ ...search, offset });
      const fetchToken = useAuthStore.getState().fetchToken;
      const auth = await fetchToken();

      const response = await fetch(`${API_URL}${serialize}`, {
        headers: {
          Authorization: `Bearer ${auth}`,
        },
      });

      return response.json() as Promise<{
        data: ColumnSchema[];
        meta: InfiniteQueryMeta;
      }>;
    },
    initialPageParam: 0,
    getNextPageParam: (_lastGroup, groups) => groups.length,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
};
