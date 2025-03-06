import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/explore")({
  component: RouteComponent,
});

interface FeaturedWorkflow {
  description: string;
  share_slug: string; // this is the url
  workflow: {
    cover_image: string;
    id: string;
    name: string;
  };
}

function RouteComponent() {
  const { data: allWorkflows, isLoading } = useQuery<FeaturedWorkflow[]>({
    queryKey: ["deployments", "featured"],
  });

  // Function to extract hashtags from description
  const extractHashtags = (description: string | null | undefined) => {
    if (!description) return [];

    // Updated regex to capture hashtags with hyphens
    const hashtagRegex = /#([\w-]+)/g;
    try {
      const matches = [...description.matchAll(hashtagRegex)];
      // Return just the tag text without the # symbol
      return matches.map((match) => match[0].substring(1));
    } catch (error) {
      return [];
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Group workflows by their first hashtag
  const groupedWorkflows: Record<string, FeaturedWorkflow[]> = {};
  const noTagWorkflows: FeaturedWorkflow[] = [];
  const featuredItems: FeaturedWorkflow[] = [];

  for (const workflow of allWorkflows ?? []) {
    const hashtags = extractHashtags(workflow.description);

    // Check if workflow has the "featured" tag
    if (hashtags.includes("featured")) {
      featuredItems.push(workflow);
    }

    if (hashtags.length > 0) {
      // Get the first non-"featured" tag for grouping
      const firstNonFeaturedTag = hashtags.find((tag) => tag !== "featured");

      if (firstNonFeaturedTag) {
        if (!groupedWorkflows[firstNonFeaturedTag]) {
          groupedWorkflows[firstNonFeaturedTag] = [];
        }
        groupedWorkflows[firstNonFeaturedTag].push(workflow);
      } else {
        // If only "featured" tag exists, put in noTagWorkflows
        noTagWorkflows.push(workflow);
      }
    } else {
      noTagWorkflows.push(workflow);
    }
  }

  // Get sorted group names for consistent order
  const sortedGroups = Object.keys(groupedWorkflows).sort();

  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Featured workflows section - displayed first */}
      {featuredItems.length > 0 && (
        <div className="mb-12">
          <div className="mb-6 flex items-center gap-4">
            <h2 className="flex items-center gap-2 font-medium text-xl">
              Featured <Sparkles className="h-5 w-5 " />
            </h2>
            <div className="h-px flex-grow rounded-full bg-gradient-to-r from-border/50 via-border to-border/50" />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {featuredItems.map((workflow) =>
              renderWorkflowCard(workflow, true),
            )}
          </div>
        </div>
      )}

      {/* Render each group */}
      {sortedGroups.map((groupName) => (
        <div key={groupName} className="mb-12">
          <div className="mb-6 flex items-center gap-4">
            <h2 className="font-medium text-xl">
              {capitalizeFirstLetter(groupName)}
            </h2>
            <div className="h-px flex-grow rounded-full bg-gradient-to-r from-border/50 via-border to-border/50" />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {groupedWorkflows[groupName].map((workflow) =>
              renderWorkflowCard(workflow),
            )}
          </div>
        </div>
      ))}

      {/* Render workflows with no tags at the bottom */}
      {noTagWorkflows.length > 0 && (
        <div className="mt-12">
          <div className="mb-6 flex items-center gap-4">
            <h2 className="font-medium text-xl">Others</h2>
            <div className="h-px flex-grow rounded-full bg-gradient-to-r from-border/50 via-border to-border/50" />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {noTagWorkflows.map((workflow) => renderWorkflowCard(workflow))}
          </div>
        </div>
      )}
    </div>
  );

  // Helper function to render a workflow card
  function renderWorkflowCard(workflow: FeaturedWorkflow, isFeatured = false) {
    const hashtags = extractHashtags(workflow.description);
    // Filter out "featured" from displayed tags
    const displayTags = hashtags.filter((tag) => tag !== "featured");

    const cleanDescription = workflow.description
      ? workflow.description
          .replace(/#[\w-]+/g, "") // Remove hashtags
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "") // Remove markdown links
          .trim()
      : "";
    const shareLink = workflow.share_slug.replace(/_/g, "/");

    return (
      <Link
        key={workflow.workflow.id}
        href={`/share/${shareLink}`}
        className="group hover:-translate-y-1 relative block overflow-hidden rounded-sm shadow-md transition-all duration-300 hover:shadow-lg"
      >
        <div className="relative aspect-square w-full">
          {/* Featured indicator */}
          {isFeatured && (
            <div className="absolute top-3 left-3 z-20">
              <div className="flex items-center gap-1 rounded-[4px] bg-yellow-400/80 px-2 py-0.5 text-2xs text-black backdrop-blur-sm">
                <Sparkles className="h-3 w-3" />
                <span>Featured</span>
              </div>
            </div>
          )}

          {/* Gradient overlay - darker on hover */}
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-90" />

          {/* Hashtags in top right corner */}
          {displayTags.length > 0 && (
            <div className="absolute top-3 right-3 z-20 flex flex-wrap justify-end gap-1">
              {displayTags.map((tag, index) => (
                <span
                  key={index}
                  className="rounded-[4px] bg-black/50 px-2 py-0.5 text-2xs text-white backdrop-blur-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <img
            src={workflow.workflow.cover_image}
            alt={workflow.workflow.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* Text overlay positioned at bottom */}
          <div className="absolute right-0 bottom-0 left-0 z-20 p-3 px-4 text-white">
            <div className="transform-gpu transition-all duration-300 group-hover:translate-y-[-8px]">
              {/* Title with CSS transition */}
              <h3 className="mb-0 line-clamp-1 font-medium text-lg transition-all duration-300 group-hover:text-base">
                {workflow.workflow.name}
              </h3>

              {/* Description with CSS transition */}
              {cleanDescription && (
                <div className="max-h-0 overflow-hidden opacity-0 transition-all duration-300 group-hover:mt-1 group-hover:max-h-[48px] group-hover:opacity-100">
                  <p className="line-clamp-2 text-white/80 text-xs leading-[1.4]">
                    {cleanDescription}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }
}
