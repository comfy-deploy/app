import { UserIcon } from "@/components/run/SharePageComponent";
import { Badge } from "@/components/ui/badge";
import { getRelativeTime } from "@/lib/get-relative-time";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CopyIcon, ExternalLink, LinkIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/deployments")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: deployments } = useQuery<any>({
    queryKey: ["deployments"],
  });

  return (
    <div className="flex flex-col gap-4 max-w-screen-md w-full mx-auto">
      {/* <h1>Deployments</h1> */}
      <div className="flex flex-col gap-4 max-w-screen-md w-full mx-auto">
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
          <div key={workflowId} className="flex flex-col gap-2 w-full">
            <Link
              to="/workflows/$workflowId/$view"
              params={{ workflowId, view: "requests" }}
              className="text-sm font-medium hover:underline flex items-center gap-2"
            >
              {deployments[0].workflow.name}
              <ExternalLink className="w-3 h-3" />
            </Link>
            <div className="flex flex-col w-full divide-y">
              {deployments.map((deployment: any) => (
                <div
                  key={deployment.id}
                  className="flex items-center gap-2 justify-between w-full hover:bg-gray-50 py-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2 w-full">
                    <div
                      role="button"
                      onClick={() => {
                        navigator.clipboard.writeText(deployment.id);
                        toast.success("Copied to clipboard");
                      }}
                      title="Click to copy full ID"
                      className="flex items-center gap-2 font-mono cursor-pointer hover:opacity-70 w-fit bg-gray-50 text-muted-foreground text-xs"
                    >
                      {deployment.id.slice(0, 6)}

                      <CopyIcon className="w-3 h-3" />
                    </div>
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
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {getRelativeTime(deployment.updated_at)}
                    </div>
                    <UserIcon
                      user_id={deployment.user_id}
                      className="w-6 h-6"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
