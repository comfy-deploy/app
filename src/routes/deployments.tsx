import { UserIcon } from "@/components/run/SharePageComponent";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DisplayWorkflowVersion } from "@/components/workflows/RunsTable";
import { getEnvColor } from "@/components/workspace/ContainersTable";
import { getRelativeTime } from "@/lib/get-relative-time";
import { queryClient } from "@/lib/providers";
import { cn } from "@/lib/utils";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CopyIcon, Droplets, ExternalLink, LinkIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { toast } from "sonner";
import {
  VersionDrawer,
  useSelectedDeploymentStore,
} from "./workflows/$workflowId/$view.lazy";

interface Deployment {
  id: string;
  environment: string;
  workflow_version_id: string;
  user_id: string;
  updated_at: string;
  workflow: {
    id: string;
    name: string;
  };
}

const getAllDeploymentsOptions = (
  environment: string | undefined = undefined,
  is_fluid = false,
) =>
  queryOptions<any>({
    queryKey: ["deployments"],
    queryKeyHashFn: (keys) => [...keys, is_fluid, environment].join(","),
    meta: {
      params: {
        is_fluid,
        environment: environment ? environment : undefined,
      },
    },
  });

function PendingComponent() {
  return (
    <div className="mx-auto flex w-full max-w-screen-md flex-col gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={`loading-${i}`} className="flex w-full flex-col gap-2">
          <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
          <div className="flex w-full flex-col divide-y">
            {Array.from({ length: 2 }).map((_, j) => (
              <div
                key={`loading-item-${j}`}
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
  // loader: async ({ context }) => {
  //   await queryClient.ensureQueryData(
  //     getAllDeploymentsOptions(undefined, true),
  //   );
  // },
  pendingComponent: PendingComponent,
});

function RouteComponent() {
  const [selectedTab, setSelectedTab] = useQueryState("tab", {
    defaultValue: "fluid",
    parse: (value): "fluid" | "standard" =>
      value === "standard" ? "standard" : "fluid",
  });
  const [selectedEnvironment, setSelectedEnvironment] = useQueryState("env", {
    defaultValue: "all",
    parse: (value): string =>
      ["all", "production", "staging", "preview"].includes(value)
        ? value
        : "all",
  });
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(
    null,
  );
  const { selectedDeployment, setSelectedDeployment } =
    useSelectedDeploymentStore();

  const { data: deployments } = useQuery(
    getAllDeploymentsOptions(
      selectedEnvironment !== "all" ? selectedEnvironment : undefined,
      selectedTab === "fluid",
    ),
  );

  const hasDeployments = deployments && deployments.length > 0;

  const filteredDeployments = deployments
    ? Object.entries(
        deployments.reduce((acc: Record<string, Deployment[]>, deployment) => {
          // if (
          //   selectedEnvironment !== "all" &&
          //   deployment.environment !== selectedEnvironment
          // ) {
          //   return acc;
          // }
          const workflowId = deployment.workflow.id;
          if (!acc[workflowId]) {
            acc[workflowId] = [];
          }
          acc[workflowId].push(deployment);
          return acc;
        }, {}),
      )
    : [];

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-2 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Tabs
            value={selectedTab}
            onValueChange={(value) =>
              setSelectedTab(value as "fluid" | "standard")
            }
          >
            <motion.div className="inline-flex items-center rounded-lg bg-white/95 p-0.5 ring-1 ring-gray-200/50">
              <TabsList className="relative flex w-fit gap-1 bg-transparent">
                <motion.div layout className="relative">
                  <TabsTrigger
                    value="fluid"
                    className={cn(
                      "font-medium px-4 py-1.5 rounded-md text-sm transition-all",
                      selectedTab === "fluid"
                        ? "bg-gradient-to-b from-white to-gray-100 ring-1 ring-gray-200/50 shadow-sm"
                        : "hover:bg-gray-100 text-gray-600",
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <Droplets className="h-3.5 w-3.5 text-blue-600" />
                      Fluid
                    </div>
                  </TabsTrigger>
                </motion.div>
                <motion.div layout className="relative">
                  <TabsTrigger
                    value="standard"
                    className={cn(
                      "font-medium px-4 py-1.5 rounded-md text-sm transition-all",
                      selectedTab === "standard"
                        ? "bg-gradient-to-b from-white to-gray-100 ring-1 ring-gray-200/50 shadow-sm"
                        : "hover:bg-gray-100 text-gray-600",
                    )}
                  >
                    Standard
                  </TabsTrigger>
                </motion.div>
              </TabsList>
            </motion.div>
          </Tabs>

          <Select
            value={selectedEnvironment}
            onValueChange={setSelectedEnvironment}
          >
            <SelectTrigger className="w-[200px] capitalize">
              <SelectValue placeholder="Select environment">
                {selectedEnvironment !== "all" && (
                  <Badge className={cn(getEnvColor(selectedEnvironment))}>
                    {selectedEnvironment}
                  </Badge>
                )}
                {selectedEnvironment === "all" && "All Environments"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Environments</SelectItem>
              <SelectItem value="production">
                <Badge className={cn(getEnvColor("production"))}>
                  Production
                </Badge>
              </SelectItem>
              <SelectItem value="staging">
                <Badge className={cn(getEnvColor("staging"))}>Staging</Badge>
              </SelectItem>
              <SelectItem value="preview">
                <Badge className={cn(getEnvColor("preview"))}>Preview</Badge>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!hasDeployments ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-8 text-center">
          <div className="font-medium text-lg">No deployments found</div>
          <p className="text-muted-foreground text-sm">
            When you deploy a workflow, it will appear here.
          </p>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-4">
          {filteredDeployments.map(([workflowId, deployments]) => (
            <div
              key={workflowId}
              className="bg-white border flex flex-col rounded-lg w-full overflow-hidden "
            >
              <Link
                to={`/workflows/${workflowId}/$view`}
                params={{
                  view: "requests",
                }}
                className="flex items-center gap-2 border-b bg-gray-50 p-4 font-medium text-sm hover:underline"
              >
                {deployments[0].workflow.name}
                <ExternalLink className="h-3 w-3" />
              </Link>
              <div className="flex w-full flex-col divide-y divide-gray-100 bg-white">
                {deployments.map((deployment) => (
                  // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
                  <div
                    key={deployment.id}
                    className="cursor-pointer flex hover:bg-gray-50 items-center justify-between gap-2 p-4 w-full"
                    onClick={() => {
                      setSelectedDeployment(deployment.id);
                      setSelectedWorkflowId(workflowId);
                    }}
                  >
                    <div className="flex w-full items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(deployment.id);
                          toast.success("Copied to clipboard");
                        }}
                        title="Click to copy full ID"
                        className="bg-gray-50 cursor-pointer flex font-mono gap-2 hover:opacity-70 items-center text-muted-foreground text-xs w-fit"
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
                        {!!deployment.modal_image_id ? (
                          <div className="flex items-center gap-1">
                            <div className="rounded-full bg-blue-100 p-0.5">
                              <Droplets
                                strokeWidth={2}
                                className="h-[12px] w-[12px] text-blue-600"
                              />
                            </div>
                            {deployment.environment}
                          </div>
                        ) : (
                          deployment.environment
                        )}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-muted-foreground text-xs whitespace-nowrap">
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
