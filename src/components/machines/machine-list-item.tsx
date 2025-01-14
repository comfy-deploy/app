import { MachineVersionBadge } from "@/components/machine/machine-version-badge";
import { CustomNodeList } from "@/components/machines/custom-node-list";
import { MachineStatus } from "@/components/machines/machine-status";
import { ShineBorder } from "@/components/magicui/shine-border";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LoadingIcon } from "@/components/ui/custom/loading-icon";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useMachineEvents } from "@/hooks/use-machine";
import { getMachineBuildProgress } from "@/hooks/use-machine-build-progress";
import { getRelativeTime } from "@/lib/get-relative-time";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  addHours,
  differenceInHours,
  format,
  formatDistanceToNowStrict,
  isAfter,
  subHours,
} from "date-fns";
import {
  AlertCircleIcon,
  ChevronDown,
  Clock,
  ExternalLink,
  GitBranch,
  HardDrive,
  LineChart,
  MemoryStick,
  Pause,
  Settings,
  Zap,
} from "lucide-react";
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { UserIcon } from "../run/SharePageComponent";

// -------------------------constants-------------------------

export const CPU_MEMORY_MAP: Record<string, string> = {
  T4: "16GB",
  A10G: "24GB",
  L40S: "48GB",
  L4: "24GB",
  A100: "40GB",
  "A100-80GB": "80GB",
  H100: "80GB",
};

// -------------------------hooks-------------------------

function isEventActive(event: any) {
  // Check if event exists and has valid start_time
  if (!event || !event.start_time) return false;

  // If end_time is null/undefined or is in the future, the event is active
  if (!event.end_time) return true;

  // Additional safety: check if end_time is valid date
  try {
    const endTime = new Date(event.end_time);
    const now = new Date();
    return endTime > now;
  } catch (e) {
    console.error("Invalid date format for event:", event);
    return false;
  }
}

export function useHasActiveEvents(machineId: string) {
  const { data: events, isLoading } = useMachineEvents(machineId);
  return {
    hasActiveEvents: events?.some(isEventActive),
    isLoading,
  };
}

export const getLastActiveText = (events: any[] | undefined) => {
  if (!events?.length) return "Never";

  const mostRecentEvent = events.reduce(
    (latest, event) => {
      if (!event.start_time?.toLocaleString()) return latest;

      const eventStart = new Date(event.start_time?.toLocaleString() || "");
      if (
        !latest ||
        eventStart > new Date(latest.start_time?.toLocaleString() || "")
      ) {
        return event;
      }
      return latest;
    },
    null as (typeof events)[0] | null,
  );

  if (!mostRecentEvent?.start_time) return "Never";

  if (!mostRecentEvent.end_time) {
    return "Now";
  }

  try {
    return `${formatDistanceToNowStrict(new Date(mostRecentEvent.end_time), {
      addSuffix: true,
    })}`;
  } catch (e) {
    console.error("Invalid date format:", e);
    return "Unknown";
  }
};

export const isMachineDeprecated = (machine: any) =>
  (machine?.type === "comfy-deploy-serverless" &&
    machine?.machine_builder_version &&
    Number(machine.machine_builder_version) < 3) ||
  false;

// -------------------------components-------------------------

export function MachineListItem({
  machine,
  isExpanded,
  setIsExpanded,
  machineActionItemList,
  index,
  className,
  overrideRightSide,
}: {
  machine: any;
  isExpanded?: boolean;
  setIsExpanded?: (isExpanded: boolean) => void;
  machineActionItemList?: React.ReactNode;
  index: number;
  className?: string;
  overrideRightSide?: React.ReactNode;
}) {
  const { data: events, isLoading } = useMachineEvents(machine.id);
  const { hasActiveEvents } = useHasActiveEvents(machine.id);
  const modalBuilderEndpoint = `${process.env.NEXT_PUBLIC_CD_API_URL}/api/machine`;

  const isStale = useMemo(() => {
    if (machine.status === "building") {
      const buildDuration = differenceInHours(
        new Date(),
        new Date(machine.updated_at),
      );
      return buildDuration >= 1;
    }
    return false;
  }, [machine.status, machine.updated_at]);

  const isDeprecated = isMachineDeprecated(machine);
  const isDockerCommandStepsNull =
    machine?.docker_command_steps === null &&
    machine?.type === "comfy-deploy-serverless";

  const content = (
    <div
      className={cn(
        "group relative flex min-h-[80px] w-full flex-col items-center overflow-hidden rounded-none bg-white p-4",
        isStale && "bg-gray-50 contrast-75",
        machine.status === "error" && "bg-red-100",
        machine.import_failed_logs &&
          JSON.parse(machine.import_failed_logs).length > 0 &&
          "bg-yellow-50",
        isDeprecated && !isStale && "bg-yellow-50",
        hasActiveEvents && "bg-green-50/80",
        index % 2 === 0 && "bg-gray-50",
        className,
      )}
    >
      <BuildProgressWrapper
        machine={machine}
        modalBuilderEndpoint={modalBuilderEndpoint}
        isStale={isStale}
      />

      <div className="z-[2] flex w-full flex-row justify-between">
        <div className="flex flex-row items-center gap-4">
          <div className="flex flex-col justify-center">
            <div className="flex flex-row items-center gap-2">
              {(() => {
                switch (true) {
                  case machine.status === "building" && !isStale:
                    return <LoadingIcon className="h-4 w-4" />;
                  case machine.status === "error":
                    return (
                      <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                    );
                  case isStale:
                    return <Clock className="h-3 w-3" />;
                  case (machine.import_failed_logs &&
                    JSON.parse(machine.import_failed_logs).length > 0) ||
                    isDeprecated:
                    return (
                      <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
                    );
                  case machine.status === "ready":
                    return (
                      <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                    );
                  default:
                    return null;
                }
              })()}
              <Link
                to="/machines/$machineId"
                params={{
                  machineId: machine.id,
                }}
                search={{ view: undefined }}
              >
                <h2 className="whitespace-nowrap font-medium text-base">
                  {machine.name}
                </h2>
              </Link>
              {isExpanded && machine.machine_version_id && (
                <MachineVersionBadge machine={machine} isExpanded={true} />
              )}
            </div>

            {!isExpanded && (
              <div className="ml-4 flex flex-row items-center gap-2 font-medium text-2xs">
                {/* <HardDrive className="h-[14px] w-[14px]" /> */}
                <UserIcon user_id={machine.user_id} className="h-4 w-4" />
                {machine.gpu && (
                  <Badge
                    variant={"emerald"}
                    className={cn(
                      "!text-[11px] !font-semibold !py-0 whitespace-nowrap",
                    )}
                  >
                    {machine.gpu}
                  </Badge>
                )}
                {machine.machine_version_id && (
                  <MachineVersionBadge machine={machine} isExpanded={false} />
                )}
                {machine.type && machine.type !== "comfy-deploy-serverless" && (
                  <Badge
                    variant={"outline"}
                    className="!text-2xs !font-semibold !py-0 !text-[11px] w-fit whitespace-nowrap"
                  >
                    {(() => {
                      switch (machine.type) {
                        case "comfy-deploy-serverless":
                          return "serverless";
                        case "runpod-serverless":
                          return "runpod";
                        default:
                          return machine.type;
                      }
                    })()}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* {!isExpanded && (
            <>
              <div className="hidden xl:block">
                <MachineListItemDeployments
                  machine={machine}
                  isExpanded={false}
                />
              </div>

              <div className="hidden items-center space-x-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 xl:flex">
                <MachineListActionBar
                  machine={machine}
                  isExpanded={false}
                  isDockerCommandStepsNull={isDockerCommandStepsNull}
                />
              </div>
            </>
          )} */}
        </div>
        <Link
          to={"/machines/$machineId"}
          className="absolute inset-0 z-[2] h-full w-full hover:bg-gray-20"
          params={{ machineId: machine.id }}
          search={{ view: undefined }}
        />
        <div className="flex w-full flex-row items-center justify-end gap-2">
          <div className="flex flex-row items-center gap-2 z-10">
            {overrideRightSide ?? (
              <>
                {!isExpanded && (
                  <div className="hidden xl:block min-w-40 xl:w-full xl:max-w-[250px]">
                    <MachineListItemEvents
                      isExpanded={false}
                      events={{ data: events, isLoading }}
                      machine={machine}
                    />
                  </div>
                )}
                <Badge
                  variant={hasActiveEvents ? "green" : "secondary"}
                  className="!text-2xs !font-semibold flex items-center gap-1"
                >
                  {hasActiveEvents ? (
                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                  ) : (
                    <Pause className="h-3 w-3 text-muted-foreground" />
                  )}
                  {hasActiveEvents ? "Running" : "Idle"}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="min-w-12 h-12"
                  onClick={() => setIsExpanded?.(!isExpanded)}
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div
        className={`z-[2] grid w-full transition-all duration-300 ${
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div
          className={cn(
            "overflow-hidden transition-opacity delay-150 duration-200",
            isExpanded ? "opacity-100" : "opacity-0",
          )}
        >
          {isExpanded && (
            <>
              {/* details */}
              <div className="space-y-3 py-3">
                <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                  <div className="space-y-2">
                    <div className="mb-2 flex flex-row items-center gap-2">
                      <Zap
                        className={`h-4 w-4 ${
                          hasActiveEvents
                            ? "text-yellow-500"
                            : "text-muted-foreground"
                        }`}
                      />
                      <span
                        className={`text-xs ${
                          hasActiveEvents
                            ? "font-medium text-yellow-500"
                            : "text-muted-foreground"
                        }`}
                      >
                        Last active: {getLastActiveText(events)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col justify-center">
                        <h3 className="font-medium text-xs">Machine ID</h3>
                        <span className="block w-full truncate font-mono text-2xs text-muted-foreground">
                          {machine.id}
                        </span>
                      </div>
                      <div className="flex flex-col justify-center">
                        <h3 className="font-medium text-xs">Status</h3>
                        <MachineStatus machine={machine} />
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-xs">Specifications</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-row items-center gap-2 text-xs">
                          <HardDrive className="h-4 w-4" />
                          {machine.gpu}
                        </div>
                        <div className="flex flex-row items-center gap-2 text-xs">
                          <MemoryStick className="h-4 w-4" />
                          {machine.gpu ? CPU_MEMORY_MAP[machine.gpu] : ""}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-xs">Custom Nodes</h3>
                      <CustomNodeList machine={machine} />
                    </div>

                    <div>
                      <h3 className="font-medium text-xs">Workflows</h3>
                      <MachineListItemWorkflows machine={machine} />
                    </div>

                    <div>
                      <h3 className="font-medium text-xs">Deployments</h3>
                      <MachineListItemDeployments machine={machine} />
                    </div>

                    {isDeprecated && (
                      <div>
                        <Alert
                          variant="warning"
                          className="mt-2 max-w-[500px] rounded-sm px-3 py-2"
                        >
                          <div className="flex flex-row items-center gap-2">
                            <div className="flex items-center justify-center">
                              <AlertCircleIcon className="h-3 w-3" />
                            </div>
                            <AlertTitle className="mb-0 text-xs">
                              Deprecated Machine
                            </AlertTitle>
                          </div>
                          <AlertDescription className="ml-5 text-2xs">
                            This machine is running an{" "}
                            <span className="font-semibold">
                              outdated version
                            </span>{" "}
                            and{" "}
                            <span className="font-semibold">
                              no longer supported
                            </span>
                            .
                            <br /> Please upgrade to the latest version to
                            ensure compatibility and access new features.
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                  </div>

                  <div>
                    <MachineListItemEvents
                      isExpanded={true}
                      events={{ data: events, isLoading }}
                      machine={machine}
                    />
                  </div>
                </div>
              </div>
              {/* footer */}
              <div className="flex flex-row items-center justify-between">
                <div className="flex flex-col items-start gap-2 lg:flex-row lg:items-center">
                  {machine.machine_version && (
                    <Badge
                      variant={"outline"}
                      className="!text-[11px] !font-semibold !font-mono"
                    >
                      v{machine.machine_version}
                    </Badge>
                  )}
                  {machine.type && (
                    <Badge
                      variant={"outline"}
                      className="!text-2xs !font-semibold"
                    >
                      {machine.type}
                    </Badge>
                  )}
                  <span className="text-muted-foreground text-xs">
                    {getRelativeTime(machine.updated_at)}
                  </span>
                </div>

                {machineActionItemList}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Conditionally wrap with ShineBorder
  return hasActiveEvents ? (
    <ShineBorder
      color="green"
      className="w-full p-[2px]"
      borderRadius={14}
      borderWidth={2}
    >
      {content}
    </ShineBorder>
  ) : (
    content
  );
}

const MachineListActionBar = ({
  machine,
  isExpanded,
  isDockerCommandStepsNull,
}: {
  machine: any;
  isExpanded: boolean;
  isDockerCommandStepsNull: boolean;
}) => {
  return (
    <>
      {!isDockerCommandStepsNull && (
        <>
          <Link href={`/machines/${machine.id}?view=settings`}>
            <Button variant="ghost" size={isExpanded ? "sm" : "icon"}>
              {isExpanded && (
                <span className="mr-2 font-normal text-muted-foreground text-xs">
                  Settings
                </span>
              )}
              <Settings className="h-4 w-4 text-muted-foreground" />
            </Button>
          </Link>
          <Separator orientation="vertical" className="h-4" />
        </>
      )}
      <Link href={`/machines/${machine.id}?view=history`}>
        <Button variant="ghost" size={isExpanded ? "sm" : "icon"}>
          {isExpanded && (
            <span className="mr-2 font-normal text-muted-foreground text-xs">
              History
            </span>
          )}
          <GitBranch className="h-4 w-4 text-muted-foreground" />
        </Button>
      </Link>
    </>
  );
};

const BuildProgressWrapper = ({
  machine,
  modalBuilderEndpoint,
  isStale,
}: {
  machine: any;
  modalBuilderEndpoint: string | undefined;
  isStale: boolean;
}) => {
  if (
    !modalBuilderEndpoint ||
    machine.type !== "comfy-deploy-serverless" ||
    isStale ||
    machine.status !== "building"
  ) {
    return null;
  }

  const progress = getMachineBuildProgress({
    machine_id: machine.id,
    endpoint: modalBuilderEndpoint,
    instance_id: machine.build_machine_instance_id,
    machine,
  });

  return (
    <div
      className="absolute inset-0 z-[1] bg-orange-300/50 transition-[width] duration-1000 ease-in-out"
      style={{ width: `${progress}%` }}
    />
  );
};

export function MachineListItemEvents({
  isExpanded,
  events,
  machine,
}: {
  isExpanded: boolean;
  events: {
    data: Awaited<ReturnType<typeof useMachineEvents>>["data"];
    isLoading: boolean;
  };
  machine: any;
}) {
  // Generate chart data for last 24 hours
  const generateChartData = () => {
    if (!events.data) return [];

    const now = new Date();

    // Create hourly slots for the last 24 hours
    const hourlySlots = Array.from({ length: 24 }, (_, i) => {
      const hour = subHours(now, 23 - i);
      return {
        dateTime: format(hour, "MM/dd HH:mm"),
        time: format(hour, "HH:mm"),
        containers: 0,
      };
    });

    // Count active containers for each hour
    hourlySlots.forEach((slot, index) => {
      const slotStart = subHours(now, 23 - index);
      const slotEnd = index === 23 ? now : subHours(now, 22 - index);

      let activeContainers = 0;
      events.data?.forEach((event) => {
        const startTime = new Date(event.start_time?.toLocaleString() || "");
        const endTime = event.end_time
          ? new Date(event.end_time.toLocaleString() || "")
          : addHours(now, 1);

        if (
          isAfter(startTime, slotEnd) === false &&
          isAfter(endTime, slotStart) === true
        ) {
          activeContainers++;
        }
      });

      slot.containers = activeContainers;
    });
    return hourlySlots;
  };

  const chartData = generateChartData();

  const chartConfig = {
    containers: {
      label: "Containers",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  if (machine.type !== "comfy-deploy-serverless") {
    return null;
  }

  return (
    <div>
      {isExpanded && (
        <h3 className="mb-2 font-medium text-xs">24hrs Activity</h3>
      )}
      <ChartContainer
        config={chartConfig}
        className={cn(
          "w-full",
          isExpanded ? "h-[250px] max-h-[250px]" : "h-[40px] max-h-[40px]",
        )}
      >
        <AreaChart
          height={isExpanded ? 250 : 40}
          accessibilityLayer
          data={chartData}
          margin={{
            left: 12,
            right: 12,
            top: 5,
            bottom: isExpanded ? 20 : 5,
          }}
        >
          <defs>
            <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="hsl(var(--primary))"
                stopOpacity={0.8}
              />
              <stop
                offset="100%"
                stopColor="hsl(var(--primary))"
                stopOpacity={0.0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          {isExpanded && (
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
          )}
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          {isExpanded && (
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={[0, "auto"]}
              allowDecimals={false}
            />
          )}
          <Area
            dataKey="containers"
            type="step"
            fill="url(#fillDesktop)"
            fillOpacity={0.4}
            stroke="hsl(var(--primary))"
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
      {isExpanded && (
        <span className="text-2xs text-muted-foreground">
          Note: Number of containers running in the past 24 hours.
        </span>
      )}
    </div>
  );
}

function MachineListItemWorkflows({ machine }: { machine: any }) {
  const { data: workflows, isLoading: isWorkflowsLoading } = useQuery({
    queryKey: ["workflows", "all"],
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return (
    <>
      {isWorkflowsLoading ? (
        <div className="flex items-center text-muted-foreground text-xs">
          <Skeleton className="h-4 w-20" />
        </div>
      ) : (
        <div className="flex flex-row flex-wrap gap-2">
          {(
            workflows as Array<{
              id: string;
              selected_machine_id: string;
              name: string;
            }>
          )
            ?.filter((w) => w.selected_machine_id === machine.id)
            .map((workflow) => (
              <Link
                key={workflow.id}
                to="/workflows/$workflowId/$view"
                params={{
                  workflowId: workflow.id,
                  view: "workspace",
                }}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-fit items-center gap-2 rounded-sm bg-gray-50 px-2 py-0.5 text-2xs"
              >
                <span className="truncate">{workflow.name}</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            ))}
        </div>
      )}
    </>
  );
}

function MachineListItemDeployments({
  machine,
  isExpanded = true,
}: {
  machine: any;
  isExpanded?: boolean;
}) {
  const { data: deployments, isLoading: isDeploymentsLoading } = useQuery({
    queryKey: ["deployments"],
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return (
    <>
      {isDeploymentsLoading ? (
        isExpanded ? (
          <div className="flex items-center text-muted-foreground text-xs">
            <Skeleton className="h-4 w-20" />
          </div>
        ) : (
          <></>
        )
      ) : (
        <div className="flex flex-row flex-wrap gap-2">
          {(
            deployments as Array<{
              id: string;
              machine_id: string;
              workflow_id: string;
              environment: string;
              workflow: {
                name: string;
              };
            }>
          )
            ?.filter((d) => d.machine_id === machine.id)
            .slice(0, isExpanded ? undefined : 1)
            .map((deployment) => (
              <div
                key={deployment.id}
                className="flex w-fit items-center justify-between gap-2 rounded-sm bg-gray-50 px-2 py-0.5 text-2xs"
              >
                <Link
                  to="/workflows/$workflowId/$view"
                  params={{
                    workflowId: deployment.workflow_id,
                    view: "deployment",
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <span className="truncate">{deployment.workflow.name}</span>
                  <Badge
                    variant={
                      deployment.environment === "production"
                        ? "blue"
                        : "yellow"
                    }
                    className="!text-[10px] !leading-tight"
                  >
                    {deployment.environment}
                  </Badge>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            ))}
        </div>
      )}
    </>
  );
}
