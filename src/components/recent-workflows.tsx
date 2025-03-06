import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkflowCard } from "./workflow-list";
import {
  useWorkflowList,
  useFeaturedWorkflows,
  type FeaturedWorkflow,
} from "@/hooks/use-workflow-list";
import { Marquee } from "@/components/magicui/marquee";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

const FeaturedWorkflowCard = ({ workflow }: { workflow: FeaturedWorkflow }) => {
  const shareLink = workflow.share_slug.replace(/_/g, "/");

  return (
    <Link
      key={workflow.workflow.id}
      href={`/share/${shareLink}`}
      className={cn(
        "group relative h-32 w-60 overflow-hidden rounded-[10px] border transition-all duration-300",
        "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700",
      )}
    >
      <div className="absolute inset-0">
        {workflow.workflow.cover_image ? (
          <img
            src={workflow.workflow.cover_image}
            alt={workflow.workflow.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700" />
        )}
      </div>

      <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/70 to-transparent p-4 py-3">
        <h3 className="line-clamp-1 text-sm text-white">
          {workflow.workflow.name}
        </h3>
      </div>
    </Link>
  );
};

export function FeaturedWorkflowMarquee() {
  const { data: featuredWorkflows } = useFeaturedWorkflows();

  if (!featuredWorkflows) return null;
  return (
    <div className="space-y-4 border-y bg-gradient-to-r from-slate-50 to-gray-100 p-4">
      <p className="mx-2 text-muted-foreground text-sm">
        Check out these featured workflows to get started!
      </p>

      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
        <Marquee pauseOnHover className="[--duration:30s]">
          {featuredWorkflows.map((workflow) => (
            <FeaturedWorkflowCard
              key={workflow.workflow.id}
              workflow={workflow}
            />
          ))}
        </Marquee>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-slate-50" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-gray-100" />
      </div>
    </div>
  );
}

export function RecentWorkflows() {
  const { data: workflowsData, refetch } = useWorkflowList("", 4);
  const recentWorkflows = workflowsData?.pages[0] ?? [];
  const { data: featuredWorkflows } = useFeaturedWorkflows();

  const hasRecentWorkflows = recentWorkflows.length > 0;
  const hasFeaturedWorkflows =
    featuredWorkflows && featuredWorkflows.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-medium text-sm">
          {hasRecentWorkflows ? "Recent Workflows" : "Featured Workflows"}
        </div>
        <Button
          variant="link"
          size="sm"
          asChild
          className="gap-2 text-muted-foreground text-xs"
        >
          <Link to="/workflows">
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {hasRecentWorkflows ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {recentWorkflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              mutate={refetch}
              className="[&>div:first-child]:h-fit"
            />
          ))}
        </div>
      ) : (
        hasFeaturedWorkflows && <FeaturedWorkflowMarquee />
      )}
    </div>
  );
}
