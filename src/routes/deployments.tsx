import { UserIcon } from "@/components/run/SharePageComponent";
import { Badge } from "@/components/ui/badge";
import { DisplayWorkflowVersion } from "@/components/workflows/RunsTable";
import { getEnvColor } from "@/components/workspace/ContainersTable";
import { getRelativeTime } from "@/lib/get-relative-time";
import { queryClient } from "@/lib/providers";
import { cn } from "@/lib/utils";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { CopyIcon, ExternalLink, LinkIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  VersionDrawer,
  useSelectedDeploymentStore,
} from "./workflows/$workflowId/$view.lazy";

const getAllDeploymentsOptions = queryOptions({
  queryKey: ["deployments"],
});

function PendingComponent() {
  return (
    <div className="mx-auto flex w-full max-w-screen-md flex-col gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex w-full flex-col gap-2">
          <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
          <div className="flex w-full flex-col divide-y">
            {Array.from({ length: 2 }).map((_, j) => (
              <div
                key={j}
                className="flex w-full items-center justify-between gap-2 p-2"
              >
                <div className="flex w-full items-center gap-2">
                  <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                  <div className="h-6 w-6 animate-pulse rounded-full bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export const Route = createFileRoute("/deployments")({
  component: RouteComponent,
  loader: async ({ context }) => {
    await queryClient.ensureQueryData(getAllDeploymentsOptions);
  },
  pendingComponent: PendingComponent,
});

function RouteComponent() {
  const { data: deployments } = useQuery(getAllDeploymentsOptions);
  const { selectedDeployment, setSelectedDeployment } =
    useSelectedDeploymentStore();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(
    null,
  );

  const hasDeployments = deployments && Object.keys(deployments).length > 0;

  return (
    <div className="flex h-full w-full flex-col gap-4 p-4">
      {!hasDeployments ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-8 text-center">
          <div className="text-lg font-medium">No deployments found</div>
          <p className="text-sm text-muted-foreground">
            When you deploy a workflow, it will appear here.
          </p>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-4">
          {Object.entries(
            deployments?.reduce(
              (acc: Record<string, any[]>, deployment: any) => {
                const workflowId = deployment.workflow.id;
                if (!acc[workflowId]) {
                  acc[workflowId] = [];
                }
                acc[workflowId].push(deployment);
                return acc;
              },
              {},
            ) ?? {},
          ).map(([workflowId, deployments]) => (
            <div key={workflowId} className="flex w-full flex-col gap-2">
              <div className="flex items-center gap-2 font-medium text-sm hover:underline">
                {deployments[0].workflow.name}
                <ExternalLink className="h-3 w-3" />
              </div>
              <div className="flex w-full flex-col divide-y">
                {deployments.map((deployment: any) => (
                  // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
                  <div
                    key={deployment.id}
                    className="flex w-full cursor-pointer items-center justify-between gap-2 p-2 hover:bg-gray-50"
                    onClick={() => {
                      setSelectedDeployment(deployment.id);
                      setSelectedWorkflowId(workflowId);
                    }}
                  >
                    <div className="flex w-full items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(deployment.id);
                          toast.success("Copied to clipboard");
                        }}
                        title="Click to copy full ID"
                        className="flex w-fit cursor-pointer items-center gap-2 bg-gray-50 font-mono text-muted-foreground text-xs hover:opacity-70"
                      >
                        {deployment.id.slice(0, 6)}

                        <CopyIcon className="h-3 w-3" />
                      </button>
                      <DisplayWorkflowVersion
                        versionId={deployment.workflow_version_id}
                        className="py-0 text-xs"
                      />
                      <Badge
                        className={cn(getEnvColor(deployment.environment))}
                      >
                        {deployment.environment}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="whitespace-nowrap text-muted-foreground text-xs">
                        {getRelativeTime(deployment.updated_at)}
                      </div>
                      <UserIcon
                        user_id={deployment.user_id}
                        className="h-6 w-6"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {selectedWorkflowId && <VersionDrawer workflowId={selectedWorkflowId} />}
    </div>
  );
}
