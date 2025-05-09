import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

/**
 * Hook for fetching multiple run details in a single request
 * This reduces the number of parallel API calls when viewing runs
 */
export function useBatchRunDetails(runIds: string[]) {
  return useQuery({
    queryKey: ["batch-runs", runIds],
    queryFn: async () => {
      if (!runIds.length) return {};
      
      const runs = await Promise.all(
        chunk(runIds, 10).map(async (idsChunk) => {
          const queryString = idsChunk.join(",");
          const response = await api({
            url: `runs/batch`,
            params: { ids: queryString },
          });
          return response;
        })
      );
      
      return runs.flat().reduce((acc, run) => {
        if (run && run.id) {
          acc[run.id] = run;
        }
        return acc;
      }, {} as Record<string, any>);
    },
    enabled: runIds.length > 0,
  });
}

function chunk<T>(array: T[], size: number): T[][] {
  const chunked: T[][] = [];
  let index = 0;
  while (index < array.length) {
    chunked.push(array.slice(index, index + size));
    index += size;
  }
  return chunked;
}
