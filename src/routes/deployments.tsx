import { UserIcon } from "@/components/run/SharePageComponent";
import { Badge } from "@/components/ui/badge";
import { DisplayWorkflowVersion } from "@/components/workflows/RunsTable";
import { getRelativeTime } from "@/lib/get-relative-time";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CopyIcon, ExternalLink, LinkIcon } from "lucide-react";
import { toast } from "sonner";
import {
  useSelectedVersionStore,
  VersionDrawer,
} from "./workflows/$workflowId/$view.lazy";

export const Route = createFileRoute("/deployments")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: deployments } = useQuery<any>({
    queryKey: ["deployments"],
  });
  const { selectedVersion, setSelectedVersion } = useSelectedVersionStore();

  return (
    <div className="mx-auto flex w-full max-w-screen-md flex-col gap-4">
      <div className="mx-auto flex w-full max-w-screen-md flex-col gap-4">
        {Object.entries(
          deployments?.reduce((acc: Record<string, any[]>, deployment: any) => {
            const workflowId = deployment.workflow.id;
            if (!acc[workflowId]) {
              acc[workflowId] = [];
            }
            acc[workflowId].push(deployment);
            return acc;
          }, {}) ?? {},
        ).map(([workflowId, deployments]) => (
          <div key={workflowId} className="flex w-full flex-col gap-2">
            <div className="flex items-center gap-2 font-medium text-sm hover:underline">
              {deployments[0].workflow.name}
              <ExternalLink className="h-3 w-3" />
            </div>
            <div className="flex w-full flex-col divide-y">
              {deployments.map((deployment: any) => (
                <div
                  key={deployment.id}
                  className="flex w-full cursor-pointer items-center justify-between gap-2 p-2 hover:bg-gray-50"
                  onClick={() => {
                    setSelectedVersion(deployment.workflow_version_id);
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
                      variant={
                        deployment.environment === "production"
                          ? "green"
                          : "amber"
                      }
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
            <VersionDrawer workflowId={workflowId} />
          </div>
        ))}
      </div>
    </div>
  );
}
