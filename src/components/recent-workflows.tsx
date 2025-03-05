import { useWorkflowList } from "@/hooks/use-workflow-list";
import { WorkflowCard } from "./workflow-list";
import { Button } from "./ui/button";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export function RecentWorkflows() {
  const { data: workflowsData, refetch } = useWorkflowList("", 4);
  const recentWorkflows = workflowsData?.pages[0] ?? [];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-medium text-sm">Recent Workflows</div>
        <Button
          variant="link"
          size="sm"
          asChild
          className="gap-2 text-xs text-muted-foreground"
        >
          <Link to="/workflows">
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
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
    </div>
  );
}
