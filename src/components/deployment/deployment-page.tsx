import { useCurrentWorkflow } from "@/hooks/use-current-workflow";
import { useMachine } from "@/hooks/use-machine";
import { api } from "@/lib/api";
import { callServerPromise } from "@/lib/call-server-promise";
import { getRelativeTime } from "@/lib/get-relative-time";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  ChevronRight,
  Copy,
  Loader2,
  MoreVertical,
  Rocket,
  Server,
} from "lucide-react";
import { useQueryState } from "nuqs";
import { useOrganization } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { Area } from "recharts";
import { XAxis, YAxis } from "recharts";
import { AreaChart, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { create } from "zustand";
import { MyDrawer } from "../drawer";
import { ErrorBoundary } from "../error-boundary";
import type { GpuTypes } from "../onboarding/workflow-machine-import";
import { UserIcon } from "../run/SharePageComponent";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ChartTooltipContent } from "../ui/chart";
import { ChartTooltip } from "../ui/chart";
import { type ChartConfig, ChartContainer } from "../ui/chart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { VersionList } from "../version-select";
import { RealtimeWorkflowProvider } from "../workflows/RealtimeRunUpdate";
import { FilterDropdown, RunsTableVirtualized } from "../workflows/RunsTable";
import WorkflowComponent from "../workflows/WorkflowComponent";
import {
  getEnvColor,
  useWorkflowDeployments,
} from "../workspace/ContainersTable";
import { DeploymentDrawer } from "../workspace/DeploymentDisplay";
import { MachineSelect } from "../workspace/MachineSelect";
import { useIsDeploymentAllowed } from "@/hooks/use-current-plan";
import { queryClient } from "@/lib/providers";

export interface Deployment {
  id: string;
  environment: string;
  workflow_id: string;
  workflow_version_id: string;
  gpu: GpuTypes;
  concurrency_limit: number;
  run_timeout: number;
  idle_timeout: number;
  keep_warm: number;
  modal_image_id?: string;
  version?: {
    version: number;
  };
  dub_link?: string;
  machine_id: string;
  created_at: string;
  updated_at: string;
  machine: {
    name: string;
  };
}

interface Version {
  id: string;
  comfyui_snapshot: string;
  version: number;
  machine_id: string;
  machine_version_id: string;
  modal_image_id: string;
  comment: string;
  created_at: string;
  user_id: string;
  workflow: string;
  workflow_api: string;
}

interface SelectedDeploymentState {
  selectedDeployment: string | null;
  setSelectedDeployment: (deployment: string | null) => void;
}

export const useSelectedDeploymentStore = create<SelectedDeploymentState>(
  (set) => ({
    selectedDeployment: null,
    setSelectedDeployment: (deployment) => {
      set({ selectedDeployment: deployment });
    },
  }),
);

export function DeploymentPage() {
  const { workflowId } = useParams({ from: "/workflows/$workflowId/$view" });
  const [deploymentId, setDeploymentId] = useQueryState("filter-deployment-id");
  const [status, setStatus] = useQueryState("filter-status");
  const navigate = useNavigate();
  const { data: deployments, isLoading: isDeploymentsLoading } =
    useWorkflowDeployments(workflowId);

  return (
    <>
      <div className="mx-auto max-w-screen-lg py-10">
        <div className="mb-4 flex flex-col gap-2">
          <h2 className="font-bold text-2xl">Deployment</h2>
          <p className="text-muted-foreground text-sm">
            Select a version and deploy it to an environment.
          </p>
        </div>
        <h3 className="mb-2 ml-2 font-medium text-sm">Environment</h3>
        <div className="rounded-md bg-background p-1 shadow-sm ring-1 ring-gray-200 dark:ring-zinc-700/80">
          {isDeploymentsLoading ? (
            <div className="flex h-[80px] flex-col items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            <>
              {deployments?.some((d: Deployment) =>
                ["production", "staging"].includes(d.environment),
              ) ? (
                <div className="flex flex-col">
                  {deployments
                    .filter((d: Deployment) =>
                      ["production", "staging"].includes(d.environment),
                    )
                    .map((deployment: Deployment) => (
                      <DeploymentHistory
                        key={deployment.id}
                        deployment={deployment}
                      />
                    ))}
                </div>
              ) : (
                <div className="flex h-[80px] flex-col items-center justify-center">
                  <p className="text-muted-foreground text-xs">
                    No deployments yet
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="relative mt-2 ">
          <h3 className="mt-4 mb-2 ml-2 font-medium text-sm">Versions</h3>
          <DeploymentWorkflowVersionList workflowId={workflowId} />
        </div>

        <div className="mx-2 mt-10 mb-1 flex items-center justify-between">
          <h3 className="font-medium text-sm">Requests</h3>
          <FilterDropdown
            workflowId={workflowId}
            buttonSize="sm"
            isDeploymentPage={true}
          />
        </div>

        <div className="h-[310px] overflow-clip rounded-md bg-background p-1 shadow-sm ring-1 ring-gray-200 dark:ring-zinc-700/80">
          {deployments?.some((d: Deployment) =>
            ["production", "staging"].includes(d.environment),
          ) ? (
            <RealtimeWorkflowProvider
              workflowId={workflowId}
              status={status ?? undefined}
              deploymentId={deploymentId ?? undefined}
            >
              <RunsTableVirtualized
                workflow_id={workflowId}
                className="h-[300px]"
              />
              <WorkflowComponent />
            </RealtimeWorkflowProvider>
          ) : (
            <div className="flex h-full flex-col items-center justify-center">
              <p className="text-muted-foreground text-xs">
                No deployments yet
              </p>
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <Button
            variant="link"
            size="sm"
            className="text-muted-foreground text-xs"
            onClick={() => {
              navigate({
                to: "/workflows/$workflowId/$view",
                params: { workflowId, view: "requests" },
                search: (prev) => ({
                  ...prev,
                  "filter-rf": undefined,
                }),
              });
            }}
          >
            View all <ChevronRight size={13} className="ml-1" />
          </Button>
        </div>

        <div className="mx-2 mt-4 mb-1 flex items-center justify-between">
          <h3 className="font-medium text-sm">Requests Status (Last 24 hrs)</h3>
          <FilterDropdown
            workflowId={workflowId}
            buttonSize="sm"
            isDeploymentPage={true}
            hideTimeFilter={true}
          />
        </div>
        <ErrorBoundary fallback={(error) => <div>Error: {error.message}</div>}>
          <DeploymentStatusGraph workflowId={workflowId} />
        </ErrorBoundary>
      </div>
      {/* <ApiPlaygroundDemo /> */}
      <DeploymentDrawer />
    </>
  );
}

function DeploymentHistory({ deployment }: { deployment: Deployment }) {
  const { setSelectedDeployment } = useSelectedDeploymentStore();
  const navigate = useNavigate();

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
    <div
      className="grid cursor-pointer grid-cols-3 items-center rounded-[8px] border-gray-100 border-b px-4 py-1.5 text-xs last:border-b-0 hover:bg-gray-50 dark:border-zinc-700/80 dark:hover:bg-zinc-800/40"
      onClick={() => {
        setSelectedDeployment(deployment.id);
      }}
    >
      {/* Left column */}
      <div className="flex items-center gap-3">
        <span className="shrink-0 font-mono text-2xs text-muted-foreground">
          #{deployment.id.slice(0, 8)}
        </span>
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0.5"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.nativeEvent.preventDefault();
                  e.nativeEvent.stopPropagation();
                  navigator.clipboard.writeText(deployment.id);
                  toast.success("ID copied to clipboard");
                }}
              >
                <Copy size={13} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-2xs">Copy ID</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Badge className={cn("!text-2xs", getEnvColor(deployment.environment))}>
          {deployment.environment === "public-share" ||
          deployment.environment === "community-share"
            ? "Link Share"
            : deployment.environment}
        </Badge>

        {deployment.version?.version && (
          <Badge variant="secondary" className="!text-2xs py-0 font-medium">
            v{deployment.version.version}
          </Badge>
        )}
      </div>

      {/* Center column - Machine info */}
      <div className="flex items-center justify-start overflow-hidden">
        <Button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.nativeEvent.preventDefault();
            e.nativeEvent.stopPropagation();
            navigate({
              to: "/machines/$machineId",
              params: { machineId: deployment.machine_id },
            });
          }}
          variant="link"
          size="sm"
          className="flex h-5 max-w-[150px] items-center gap-1 truncate text-2xs text-muted-foreground"
          title={deployment.machine.name}
        >
          <Server size={13} className="shrink-0" />
          {deployment.machine.name}
        </Button>
        {deployment.gpu && (
          <Badge variant="outline" className="!text-2xs font-normal">
            {deployment.gpu}
          </Badge>
        )}
      </div>

      {/* Right column */}
      <div className="flex items-center justify-end gap-3">
        <span className="whitespace-nowrap text-2xs text-muted-foreground">
          {getRelativeTime(deployment.updated_at)}
        </span>

        <span className="flex items-center gap-1 text-2xs text-muted-foreground hover:underline">
          API docs <ChevronRight size={13} />
        </span>
      </div>
    </div>
  );
}

interface DeploymentDialogProps {
  open: boolean;
  onClose: () => void;
  selectedVersion: Version | null;
  workflowId: string;
  onSuccess?: (deploymentId: string) => void;
  publicLinkOnly?: boolean;
  existingDeployments?: Deployment[];
}

export function DeploymentDialog({
  open,
  onClose,
  selectedVersion,
  workflowId,
  onSuccess,
  publicLinkOnly = false,
  existingDeployments = [],
}: DeploymentDialogProps) {
  const { selectedDeployment } = useSelectedDeploymentStore();

  const [selectedEnvironment, setSelectedEnvironment] = useState<
    | "staging"
    | "production"
    | "public-share"
    | "private-share"
    | "community-share"
  >(publicLinkOnly ? "public-share" : "staging");

  useEffect(() => {
    const deployment = existingDeployments.find(
      (d: Deployment) => d.id === selectedDeployment,
    );
    console.log("deployment", deployment);

    if (deployment) {
      setSelectedEnvironment(deployment.environment as any);
    }
  }, [selectedDeployment]);

  const { organization } = useOrganization();
  const showCommunity = true;
  // const showCommunity = organization?.id === "org_2am4LjkQ5IaWGRYMHxGXfHdHcjA";
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(
    null,
  );
  const [isPromoting, setIsPromoting] = useState(false);
  const { workflow, isLoading: isWorkflowLoading } =
    useCurrentWorkflow(workflowId);
  const { data: machine } = useMachine(workflow?.selected_machine_id);
  const { data: deployments, refetch: refetchDeployments } =
    useWorkflowDeployments(workflowId);
  const final_machine = useMachine(selectedMachineId ?? machine?.id);

  useEffect(() => {
    if (publicLinkOnly && machine?.id) {
      setSelectedMachineId(machine.id);
      return;
    }

    if (deployments) {
      const deployment = deployments.find(
        (d: Deployment) => d.environment === selectedEnvironment,
      );
      if (deployment?.machine_id) {
        setSelectedMachineId(deployment?.machine_id);
        return;
      }
    }
    if (machine?.id) {
      setSelectedMachineId(machine.id);
    }
  }, [deployments, selectedEnvironment, machine?.id, publicLinkOnly]);

  const handlePromoteToEnv = async () => {
    try {
      setIsPromoting(true);

      const myDeployment = existingDeployments.find(
        (d: Deployment) => d.id === selectedDeployment,
      );

      // Look for existing deployment to update:
      // 1. First check if there's already a deployment in the target environment
      // 2. If not, look for any deployment with this version (to support environment changes)

      const deployment = await callServerPromise(
        api({
          url: "deployment",
          init: {
            method: "POST",
            body: JSON.stringify({
              workflow_id: workflowId,
              workflow_version_id: selectedVersion?.id,
              machine_id: final_machine.data?.id,
              machine_version_id: final_machine.data?.machine_version_id,
              environment: selectedEnvironment,
              ...(myDeployment && {
                deployment_id: myDeployment.id,
              }),
            }),
          },
        }),
      );
      refetchDeployments();
      onSuccess?.(deployment.id);
      toast.success("Deployment promoted successfully");
      onClose();
      queryClient.invalidateQueries({
        queryKey: ["deployment", selectedDeployment],
      });
      queryClient.invalidateQueries({
        queryKey: ["workflow", workflowId, "deployments"],
      });
    } finally {
      setIsPromoting(false);
    }
  };

  if (!selectedVersion) return null;

  return (
    <MyDrawer open={open} onClose={onClose}>
      <div className="space-y-4">
        <h3 className="font-medium text-lg">
          Deploy Version <Badge>v{selectedVersion.version}</Badge>
        </h3>
        <div className="space-y-2">
          <h3 className="font-medium text-sm">
            {publicLinkOnly ? "Visibility" : "Environment"}
          </h3>
          <Tabs
            value={selectedEnvironment}
            onValueChange={(value) =>
              setSelectedEnvironment(
                value as
                  | "staging"
                  | "production"
                  | "public-share"
                  | "private-share"
                  | "community-share",
              )
            }
          >
            <TabsList className="inline-flex h-fit items-center rounded-lg bg-white/95 ring-1 ring-gray-200/50 dark:bg-zinc-800 dark:ring-zinc-700/50">
              {!publicLinkOnly ? (
                <>
                  <TabsTrigger
                    value="staging"
                    className={cn(
                      "rounded-md px-4 py-1.5 font-medium text-sm transition-all",
                      selectedEnvironment === "staging"
                        ? "bg-gradient-to-b from-white to-yellow-100 shadow-sm ring-1 ring-gray-200/50 dark:from-zinc-800 dark:to-yellow-900 dark:ring-yellow-900/50"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-700",
                    )}
                  >
                    Staging
                  </TabsTrigger>
                  <TabsTrigger
                    value="production"
                    className={cn(
                      "rounded-md px-4 py-1.5 font-medium text-sm transition-all",
                      selectedEnvironment === "production"
                        ? "bg-gradient-to-b from-white to-blue-100 shadow-sm ring-1 ring-gray-200/50 dark:from-zinc-800 dark:to-blue-900 dark:ring-blue-900/50"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-700",
                    )}
                  >
                    Production
                  </TabsTrigger>
                </>
              ) : (
                <>
                  <TabsTrigger
                    value="public-share"
                    className={cn(
                      "rounded-md px-4 py-1.5 font-medium text-sm transition-all",
                      selectedEnvironment === "public-share"
                        ? "bg-gradient-to-b from-white to-green-100 shadow-sm ring-1 ring-gray-200/50 dark:from-zinc-800 dark:to-green-900 dark:ring-green-900/50"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-700",
                    )}
                  >
                    Link Access
                  </TabsTrigger>
                  {showCommunity && (
                    <TabsTrigger
                      value="community-share"
                      className={cn(
                        "rounded-md px-4 py-1.5 font-medium text-sm transition-all",
                        selectedEnvironment === "community-share"
                          ? "bg-gradient-to-b from-white to-orange-100 shadow-sm ring-1 ring-gray-200/50 dark:from-zinc-800 dark:to-orange-900 dark:ring-orange-900/50"
                          : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-700",
                      )}
                    >
                      Community
                    </TabsTrigger>
                  )}
                  <TabsTrigger
                    value="private-share"
                    className={cn(
                      "rounded-md px-4 py-1.5 font-medium text-sm transition-all",
                      selectedEnvironment === "private-share"
                        ? "bg-gradient-to-b from-white to-purple-100 shadow-sm ring-1 ring-gray-200/50 dark:from-zinc-800 dark:to-purple-900 dark:ring-purple-900/50"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-700",
                    )}
                  >
                    Internal
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </Tabs>
          <div className="mt-1 ml-2 text-2xs text-muted-foreground">
            {selectedEnvironment === "public-share"
              ? "This deployment will be accessible via a public link. Anyone with the link can access it."
              : selectedEnvironment === "private-share"
                ? "This deployment will only be accessible within your organization."
                : selectedEnvironment === "community-share"
                  ? "This deployment will be visible in the community."
                  : null}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-sm">Machine</h3>
          <MachineSelect
            workflow_id={workflowId}
            leaveEmpty
            value={selectedMachineId ?? ""}
            onChange={(value) => setSelectedMachineId(value)}
            className="rounded-md border bg-background"
          />
        </div>

        {!selectedVersion.workflow_api && (
          <div className="text-center text-muted-foreground text-sm">
            Please save a new version in ComfyUI to deploy this workflow.
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedEnvironment("staging");
              setSelectedMachineId(null);
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            disabled={
              isPromoting ||
              !selectedMachineId ||
              final_machine.isLoading ||
              !selectedVersion.workflow_api
            }
            onClick={handlePromoteToEnv}
          >
            {/* {isPromoting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} */}
            Deploy
          </Button>
        </div>
      </div>
    </MyDrawer>
  );
}

function DeploymentWorkflowVersionList({ workflowId }: { workflowId: string }) {
  const isDeploymentAllowed = useIsDeploymentAllowed();

  const { data: deployments } = useWorkflowDeployments(workflowId);
  const { data: versions } = useQuery<Version[]>({
    queryKey: ["workflow", workflowId, "versions"],
    meta: {
      params: {
        limit: 1,
        offset: 0,
      },
    },
  });
  const { setSelectedDeployment } = useSelectedDeploymentStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);

  return (
    <>
      {versions?.[0] && (
        <div className="-top-1 absolute right-2">
          <Button
            variant="default"
            className="h-[30px] rounded-[8px] text-2xs focus-visible:ring-transparent dark:bg-gradient-to-br dark:from-zinc-100 dark:to-zinc-300"
            size="sm"
            onClick={() => {
              setSelectedVersion(versions[0]);
              setIsDrawerOpen(true);
            }}
            disabled={!isDeploymentAllowed}
          >
            Deploy Latest
            <Badge
              variant="outline"
              className="!text-[11px] ml-2 h-[18px] bg-gray-400/50 py-0 text-white dark:bg-zinc-900 dark:text-zinc-100"
            >
              v{versions?.[0].version}
            </Badge>
            <Rocket className="ml-2" size={13} />
          </Button>
        </div>
      )}
      <VersionList
        hideSearch
        workflow_id={workflowId || ""}
        className="relative z-[1] w-full rounded-md bg-background p-1 shadow-sm ring-1 ring-gray-200 dark:ring-zinc-700/80"
        containerClassName="max-h-[200px]"
        height={30}
        renderItem={(item: Version) => {
          const myDeployments = deployments?.filter(
            (deployment: Deployment) =>
              deployment.workflow_version_id === item.id,
          );

          return (
            <div
              className={cn(
                "flex flex-row items-center justify-between gap-2 rounded-[6px] px-4 transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800/40",
                item.version === 1 && "rounded-b-sm",
                item.version === versions?.[versions.length - 1]?.version &&
                  "rounded-t-sm",
              )}
            >
              <div className="grid grid-cols-[14px_38px_auto_1fr] items-center gap-4">
                <div className="flex h-full items-center justify-center">
                  {versions && (
                    <>
                      <div
                        className={cn(
                          "absolute w-[2px] bg-gray-300",
                          item.version === 1
                            ? "top-0 h-[50%]"
                            : item.version === versions?.[0]?.version
                              ? "bottom-0 h-[50%]"
                              : "h-full",
                        )}
                      />
                      <div className="relative z-10 flex h-[6px] w-[6px] items-center justify-center rounded-full bg-gray-300" />
                    </>
                  )}
                </div>

                <Badge className="!py-0 !text-2xs w-fit whitespace-nowrap rounded-sm">
                  v{item.version}
                </Badge>

                <div className="truncate text-muted-foreground text-xs">
                  {item.comment}
                </div>
              </div>
              <div className="grid grid-cols-[auto_auto_110px_30px] items-center gap-4">
                {myDeployments?.length > 0 ? (
                  <div className="flex flex-row gap-2">
                    {myDeployments
                      .filter(
                        (deployment: Deployment) =>
                          deployment.environment === "production" ||
                          deployment.environment === "staging" ||
                          deployment.environment === "public-share" ||
                          deployment.environment === "community-share",
                      )
                      .map((deployment: Deployment) => (
                        <Badge
                          key={deployment.id}
                          className={cn(
                            "!text-2xs w-fit cursor-pointer whitespace-nowrap rounded-md capitalize hover:shadow-sm",
                            getEnvColor(deployment.environment),
                          )}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.nativeEvent.preventDefault();
                            e.nativeEvent.stopPropagation();

                            setSelectedDeployment(deployment.id);
                          }}
                        >
                          {deployment.environment === "public-share" ||
                          deployment.environment === "community-share"
                            ? "Link Share"
                            : deployment.environment}
                        </Badge>
                      ))}
                  </div>
                ) : (
                  <div />
                )}
                <UserIcon user_id={item.user_id} className="h-5 w-5" />
                <div className="whitespace-nowrap text-2xs text-muted-foreground">
                  {getRelativeTime(item.created_at)}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild
                    className="h-full w-full cursor-pointer rounded-sm p-2 hover:bg-gray-50 dark:hover:bg-zinc-800/40"
                    onClick={(e) => e.stopPropagation()} // Prevent triggering the row click
                  >
                    <MoreVertical size={16} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[200px]">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVersion(item);
                        setIsDrawerOpen(true);
                      }}
                      disabled={!isDeploymentAllowed}
                    >
                      Deploy Version
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        }}
      />
      <DeploymentDialog
        open={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedVersion(null);
        }}
        selectedVersion={selectedVersion}
        workflowId={workflowId}
        onSuccess={setSelectedDeployment}
        existingDeployments={deployments || []}
      />
    </>
  );
}

const chartConfig = {
  success: {
    label: "success",
    color: "green",
  },
  failed: {
    label: "failed",
    color: "red",
  },
} satisfies ChartConfig;

function DeploymentStatusGraph({ workflowId }: { workflowId: string }) {
  const [deploymentId] = useQueryState("filter-deployment-id");
  const [deploymentStatus] = useQueryState("filter-status");
  const [timeInterval, setTimeInterval] = useState<10 | 30 | 60>(60);

  const {
    data: runs,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["workflow", workflowId, "runs", "day"],
    meta: {
      params: {
        deployment_id: deploymentId,
      },
    },
    enabled: !!deploymentId,
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (deploymentId) {
      refetch();
    }
  }, [deploymentId, refetch]);

  // Determine the best time interval based on data distribution
  useEffect(() => {
    if (!runs || !Array.isArray(runs) || runs.length === 0) {
      setTimeInterval(60); // Default to 60 minutes if no data
      return;
    }

    // Get distribution of data across 24 hours
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Filter runs from the last 24 hours
    const recentRuns = runs.filter(
      (run: any) => new Date(run.created_at) >= twentyFourHoursAgo,
    );

    if (recentRuns.length === 0) {
      setTimeInterval(60);
      return;
    }

    // Check how many different hours have data
    const hourSet = new Set();
    for (const run of recentRuns) {
      const hour = new Date(run.created_at).getHours();
      hourSet.add(hour);
    }

    // Count how many different slots would have data at different granularities
    const hoursWithData = hourSet.size;

    // Check if data is well distributed throughout the day
    if (hoursWithData >= 12) {
      // Data spread across at least half of the day, use finer granularity
      setTimeInterval(10);
    } else if (hoursWithData >= 6) {
      // Data spread across at least a quarter of the day
      setTimeInterval(30);
    } else {
      // Data is sparse, use coarser granularity
      setTimeInterval(60);
    }
  }, [runs]);

  // Process the data to group by the chosen interval from 24 hours ago until now
  const processDataForChart = (
    runsData: Array<{
      created_at: string;
      status: string;
    }> = [],
  ) => {
    if (!runsData || !runsData.length) return [];

    // Get current time and 24 hours ago
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Calculate how many slots we need based on the interval (in minutes)
    const slotsCount = Math.ceil((24 * 60) / timeInterval);

    // Create time slots for the last 24 hours
    const timeSlotData: Array<{
      timeLabel: string;
      timestamp: number;
      hour: number; // Store the hour for easier filtering
      success: number;
      failed: number;
    }> = [];

    // Generate time slots backward from now
    for (let i = 0; i < slotsCount; i++) {
      const slotTime = new Date(now.getTime() - i * timeInterval * 60 * 1000);
      const slotStart = new Date(slotTime);

      // Round to the nearest interval
      slotStart.setMinutes(
        Math.floor(slotStart.getMinutes() / timeInterval) * timeInterval,
        0,
        0,
      );

      // Format the time label
      const hours = slotStart.getHours().toString().padStart(2, "0");
      const mins = slotStart.getMinutes().toString().padStart(2, "0");
      const timeLabel = `${hours}:${mins}`;

      timeSlotData.unshift({
        timeLabel,
        timestamp: slotStart.getTime(),
        hour: slotStart.getHours(),
        success: 0,
        failed: 0,
      });
    }

    // Count runs for each time slot
    for (const run of runsData) {
      const runDate = new Date(run.created_at);

      // Skip runs older than 24 hours
      if (runDate < twentyFourHoursAgo) continue;

      // Find the right time slot for this run
      for (let i = 0; i < timeSlotData.length - 1; i++) {
        if (
          runDate.getTime() >= timeSlotData[i].timestamp &&
          runDate.getTime() < timeSlotData[i + 1].timestamp
        ) {
          if (run.status === "success") {
            timeSlotData[i].success += 1;
          } else if (run.status === "failed") {
            timeSlotData[i].failed += 1;
          }
          break;
        }
      }

      // Check the last slot
      if (
        runDate.getTime() >= timeSlotData[timeSlotData.length - 1].timestamp
      ) {
        if (run.status === "success") {
          timeSlotData[timeSlotData.length - 1].success += 1;
        } else if (run.status === "failed") {
          timeSlotData[timeSlotData.length - 1].failed += 1;
        }
      }
    }

    return timeSlotData;
  };

  const chartData = processDataForChart(Array.isArray(runs) ? runs : []);

  // Calculate the appropriate interval for x-axis labels based on time interval
  const getLabelInterval = () => {
    switch (timeInterval) {
      case 10:
        return 3; // Show every hour (6 x 10min = 60min)
      case 30:
        return 2; // Show every hour (2 x 30min = 60min)
      case 60:
        return 2; // Show every 2 hours
      default:
        return 1;
    }
  };

  // Add a formatted timestamp to show in the tooltip for better context
  const formatTimeLabel = (timeLabel: string) => {
    const now = new Date();
    const [hoursStr, minsStr] = timeLabel.split(":");
    const hours = Number.parseInt(hoursStr);
    const mins = Number.parseInt(minsStr);

    // Create a date object for the label time
    const labelTime = new Date(now);
    labelTime.setHours(hours, mins, 0, 0);

    // Calculate the difference in minutes
    let diffMs = now.getTime() - labelTime.getTime();
    if (diffMs < 0) {
      diffMs += 24 * 60 * 60 * 1000; // Add 24 hours if the time is for tomorrow
    }

    const diffMins = Math.round(diffMs / (60 * 1000));

    if (diffMins < 1) {
      return "Just now";
    }
    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
    }
    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;

    if (remainingMins === 0) {
      return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
    }
    return `${diffHours}h ${remainingMins}m ago`;
  };

  return (
    <div className="rounded-md bg-background p-4 shadow-sm ring-1 ring-gray-200 dark:ring-zinc-700/80">
      {isLoading ? (
        <div className="flex h-[300px] items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : (
        <>
          {!runs || !Array.isArray(runs) || runs.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center">
              <p className="text-muted-foreground text-xs">
                No requests data in the last 24 hours
              </p>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart
                accessibilityLayer
                data={chartData}
                height={200}
                margin={{
                  left: 10,
                  right: 20,
                  top: 10,
                  bottom: 0,
                }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="timeLabel"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 10 }}
                  interval={getLabelInterval()}
                  tickFormatter={(value, index) => {
                    const [hours, mins] = value.split(":");
                    // For very dense charts, we may want to only show the hour marks
                    // for better readability
                    if (timeInterval <= 15) {
                      // For 10 minute intervals
                      return mins === "00" ? `${hours}:00` : "";
                    }
                    return value;
                  }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) =>
                    Number.isInteger(value) ? value.toString() : ""
                  }
                  width={30}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label) => {
                        return `${label} (${formatTimeLabel(label)})`;
                      }}
                    />
                  }
                />
                <defs>
                  <linearGradient id="fillSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="rgb(34, 197, 94)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="rgb(34, 197, 94)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient id="fillFailed" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="rgb(239, 68, 68)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="rgb(239, 68, 68)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                {(!deploymentStatus || deploymentStatus === "failed") && (
                  <Area
                    dataKey="failed"
                    type="linear"
                    fill="url(#fillFailed)"
                    fillOpacity={0.6}
                    stroke="rgb(239, 68, 68)"
                    stackId="1"
                  />
                )}
                {(!deploymentStatus || deploymentStatus === "success") && (
                  <Area
                    dataKey="success"
                    type="linear"
                    fill="url(#fillSuccess)"
                    fillOpacity={0.6}
                    stroke="rgb(34, 197, 94)"
                    stackId="1"
                  />
                )}
              </AreaChart>
            </ChartContainer>
          )}
        </>
      )}
    </div>
  );
}
