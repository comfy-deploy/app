import { queryClient } from "@/lib/providers";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

// Helper function for non-hook usage with the dedicated client
export async function getBranchInfo(gitUrl: string): Promise<BranchInfoData> {
  return queryClient.fetchQuery({
    queryKey: ["branch-info"],
    queryKeyHashFn: (queryKey) => [...queryKey, gitUrl].toString(),
    meta: {
      params: { git_url: gitUrl },
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 2,
  });
}

// Hook version
export function useGithubBranchInfo(gitUrl: string, enabled = true) {
  return useQuery({
    enabled,
    queryKey: ["branch-info"],
    queryKeyHashFn: (queryKey) => [...queryKey, gitUrl].toString(),
    meta: {
      params: { git_url: gitUrl },
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 2,
  });
}

const BranchInfoSchema = z.object({
  commit: z.object({
    sha: z.string(),
    commit: z.object({
      message: z.string(),
      // TODO: committer obj: this makes types work in custom-node-setup.tsx but doesn't match the API responsee
      committer: z.object({
        name: z.string(),
        email: z.string(),
        date: z.string(),
      }),
    }),
    html_url: z.string(),
  }),
  stargazers_count: z.number(),
});

export type BranchInfoData = z.infer<typeof BranchInfoSchema>;
