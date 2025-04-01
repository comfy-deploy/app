import { useQuery } from "@tanstack/react-query";
import { useDexieWorkflowList } from "@/lib/dexie/dexie-workflow-list";
import type { WorkflowData } from "@/lib/dexie/dexiedb";

export const BATCH_SIZE = 20;

export function useWorkflowList(
  debouncedSearchValue: string,
  limit: number = BATCH_SIZE,
) {
  // Use the cached version instead of direct API call
  return useDexieWorkflowList(debouncedSearchValue, limit);
}

export function useWorkflowsAll() {
  return useQuery<WorkflowData[]>({
    queryKey: ["workflows", "all"],
    refetchInterval: 5000,
  });
}

export interface FeaturedWorkflow {
  description: string;
  share_slug: string; // this is the url
  workflow: {
    cover_image: string;
    id: string;
    name: string;
    workflow: Record<string, unknown>; // this is a object json
  };
}

export function useFeaturedWorkflows() {
  return useQuery<FeaturedWorkflow[]>({
    queryKey: ["deployments", "featured"],
  });
}
