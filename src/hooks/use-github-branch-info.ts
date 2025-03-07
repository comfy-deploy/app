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

const ReleaseSchema = z.object({
  tag_name: z.string(),
  name: z.string(),
  published_at: z.string(),
  body: z.string(),
  html_url: z.string(),
  tarball_url: z.string(),
  zipball_url: z.string(),
  target_commitish: z.string(),
});

export type ReleaseData = z.infer<typeof ReleaseSchema>;

// Helper function for non-hook usage with the dedicated client
export async function getGithubReleases(
  gitUrl: string,
): Promise<ReleaseData[]> {
  const [owner, repo] = gitUrl.replace("https://github.com/", "").split("/");
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases`,
  );
  const data = await response.json();
  const releases = data.slice(0, 10);

  // Fetch commit SHA for each release
  const releasesWithCommits = await Promise.all(
    releases.map(async (release: any) => {
      try {
        // Get the commit for this tag
        const tagResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/git/refs/tags/${release.tag_name}`,
        );
        const tagData = await tagResponse.json();

        // If it's an annotated tag, we need one more request to get the commit
        if (tagData.object.type === "tag") {
          const commitResponse = await fetch(tagData.object.url);
          const commitData = await commitResponse.json();
          return ReleaseSchema.parse({
            ...release,
            target_commitish: commitData.object.sha,
          });
        }

        // For lightweight tags, we can use the SHA directly
        return ReleaseSchema.parse({
          ...release,
          target_commitish: tagData.object.sha,
        });
      } catch (error) {
        console.error(
          `Failed to fetch commit for release ${release.tag_name}:`,
          error,
        );
        // Fall back to the original target_commitish if we can't get the commit SHA
        return ReleaseSchema.parse(release);
      }
    }),
  );

  return releasesWithCommits;
}

// Hook version
export function useGithubReleases(gitUrl: string, enabled = true) {
  return useQuery({
    enabled,
    queryKey: ["github-releases", gitUrl],
    queryFn: () => getGithubReleases(gitUrl),
    staleTime: 60 * 60 * 24, // 1 day
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 2,
  });
}
