import { MachineVersionBadge } from "@/components/machine/machine-version-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LoadingIcon } from "@/components/ui/custom/loading-icon";
import { useMachine, useMachineEvents } from "@/hooks/use-machine";
import { cn } from "@/lib/utils";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
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
  Clock,
  EllipsisVertical,
  Info,
  Pause,
  Copy,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { UserIcon } from "../run/SharePageComponent";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { api } from "@/lib/api";
import { callServerPromise } from "@/lib/call-server-promise";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useCurrentPlanQuery } from "@/hooks/use-current-plan";
import { DeleteMachineDialog, RebuildMachineDialog } from "./machine-list";

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
  machineId,
  isExpanded,
  refetchQuery,
  index,
  selectedTab,
  className,
  showMigrateDialog = true,
  children,
  isSelected,
  onSelectionChange,
}: {
  machine: any;
  machineId: any;
  isExpanded?: boolean;
  refetchQuery: any;
  index: number;
  selectedTab?: string;
  className?: string;
  showMigrateDialog?: boolean;
  children?: React.ReactNode;
  isSelected?: boolean;
  onSelectionChange?: (machineId: string, selected: boolean) => void;
}) {
  const { data: events, isLoading } = useMachineEvents(machineId);
  const { hasActiveEvents } = useHasActiveEvents(machineId);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [rebuildModalOpen, setRebuildModalOpen] = useState(false);
  const navigate = useNavigate({ from: "/machines" });
  const { refetch: refetchPlan } = useCurrentPlanQuery();
  const [machineActionDropdownOpen, setMachineActionDropdownOpen] =
    useState(false);
  const router = useRouter();
  const [isStartingSession, setIsStartingSession] = useState(false);
  // const { data: machine, isLoading: isMachineLoading } = useMachine(machineId);

  // Check if Docker command steps are null (for disabling buttons)
  const isDockerCommandStepsNull =
    machine?.docker_command_steps === null &&
    machine?.type === "comfy-deploy-serverless";

  const isStale = useMemo(() => {
    if (machine?.status === "building") {
      const buildDuration = differenceInHours(
        new Date(),
        new Date(machine?.updated_at),
      );
      return buildDuration >= 1;
    }
    return false;
  }, [machine?.status, machine?.updated_at]);

  const isDeprecated = isMachineDeprecated(machine);

  // const { createDynamicSession } = useSessionAPI();

  // const handleStartSession = async () => {
  //   setIsStartingSession(true);
  //   const response = await createDynamicSession.mutateAsync({
  //     machine_id: machine.id,
  //     gpu: machine.gpu,
  //     timeout: 15,
  //   });
  //   useLogStore.getState().clearLogs();

  //   router.navigate({
  //     to: "/sessions/$sessionId",
  //     params: {
  //       sessionId: response.session_id,
  //     },
  //     search: {
  //       machineId: machine.id,
  //     },
  //   });
  //   setIsStartingSession(false);
  // };

  // if (isMachineLoading) return null;

  const content = (
    <div
      className={cn(
        "group relative flex w-full flex-col items-center overflow-hidden rounded-none bg-white px-4 py-3",
        isStale && "bg-gray-50 contrast-75",
        index % 2 !== 0 && "bg-gray-50",
        isSelected && "bg-primary/5 ring-1 ring-primary/20",
        className,
      )}
    >
      <div className="z-[2] flex w-full flex-row justify-between">
        <div className="flex flex-row items-center gap-4">
          {/* Selection checkbox */}
          <div 
            className="z-20" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelectionChange?.(machineId, !isSelected);
            }}
          >
            <Checkbox 
              checked={isSelected}
              className="h-4 w-4 cursor-pointer"
              onCheckedChange={(checked) => {
                onSelectionChange?.(machineId, !!checked);
              }}
            />
          </div>
          
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
                <h2 className="whitespace-nowrap font-normal text-sm tracking-normal">
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

          {showMigrateDialog && <MigrateOldMachineDialog machine={machine} />}
        </div>
        <Link
          to={"/machines/$machineId"}
          className="absolute inset-0 h-full w-full hover:bg-gray-20"
          params={{ machineId: machine.id }}
          search={{ view: undefined }}
        />
        <div className="flex w-full flex-row items-center justify-end gap-2">
          <div className="z-10 flex flex-row items-center gap-2">
            <div className="hidden min-w-40 lg:block lg:w-full lg:max-w-[250px]">
              <MachineListItemEvents
                isExpanded={false}
                events={{ data: events, isLoading }}
                machine={machine}
              />
            </div>
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
            {/* {selectedTab === "workspace" && (
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      disabled={isStartingSession}
                      onClick={async (e) => {
                        e.preventDefault();
                        await handleStartSession();
                      }}
                    >
                      {isStartingSession ? (
                        <LoadingIcon className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Start session</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )} */}
            <DropdownMenu
              open={machineActionDropdownOpen}
              onOpenChange={setMachineActionDropdownOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <EllipsisVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40">
                <DropdownMenuItem
                  className="flex items-center justify-between"
                  disabled={
                    isDockerCommandStepsNull ||
                    machine.type !== "comfy-deploy-serverless"
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    setMachineActionDropdownOpen(false);
                    navigate({
                      to: "/machines",
                      search: { view: "create", machineId: machine.id },
                    });
                  }}
                >
                  Clone
                  <Copy className="h-4 w-4" />
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center justify-between"
                  disabled={
                    isDockerCommandStepsNull ||
                    machine.type !== "comfy-deploy-serverless"
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    setRebuildModalOpen(true);
                    setMachineActionDropdownOpen(false);
                  }}
                >
                  Rebuild
                  <RefreshCcw className="h-4 w-4" />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex items-center justify-between text-red-500 focus:text-red-500"
                  onClick={(e) => {
                    e.preventDefault();
                    setDeleteModalOpen(true);
                    setMachineActionDropdownOpen(false);
                  }}
                >
                  Delete
                  <Trash2 className="h-4 w-4" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {content}
      <DeleteMachineDialog
        machine={machine}
        refetch={refetchQuery}
        planRefetch={refetchPlan}
        dialogOpen={deleteModalOpen}
        setDialogOpen={setDeleteModalOpen}
      />
      <RebuildMachineDialog
        machine={machine}
        refetch={refetchQuery}
        dialogOpen={rebuildModalOpen}
        setDialogOpen={setRebuildModalOpen}
      />
    </>
  );
}

function MigrateOldMachineDialog({ machine }: { machine: any }) {
  const navigate = useNavigate();
  const shouldShowDialog =
    machine.machine_builder_version &&
    Number(machine.machine_builder_version) < 4 &&
    machine.type === "comfy-deploy-serverless" &&
    machine.docker_command_steps &&
    machine.status === "ready";

  if (!shouldShowDialog) return null;

  const handleUpgrade = async () => {
    // Create a copy of the machine object
    const updatedMachine = {
      ...machine,
      machine_builder_version: "4", // Update builder version to 4
      docker_command_steps: {
        ...machine.docker_command_steps,
        steps: machine.docker_command_steps.steps.filter(
          (step) =>
            step?.type !== "custom-node" ||
            !step?.data?.url
              ?.toLowerCase()
              ?.includes("github.com/bennykok/comfyui-deploy"),
        ),
      },
    };

    console.log("updatedMachine", updatedMachine);

    try {
      await callServerPromise(
        api({
          url: `machine/serverless/${machine.id}`,
          init: {
            method: "PATCH",
            body: JSON.stringify({
              machine_builder_version: "4",
              docker_command_steps: updatedMachine.docker_command_steps,
              is_trigger_rebuild: true,
            }),
          },
        }),
        {
          loadingText: "Upgrading machine to v4...",
        },
      );
      toast.success("Upgrade machine successfully");
      // toast.info("Redirecting to machine page...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      navigate({
        to: "/machines/$machineId/history",
        params: { machineId: machine.id },
      });
    } catch {
      toast.error("Failed to rebuild machine");
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger className="z-[3]">
        <div className="flex cursor-pointer items-center gap-2 rounded-md border border-yellow-200 border-dashed bg-yellow-50 px-2.5 py-1.5 transition-colors duration-200 hover:bg-yellow-100">
          <Info className="h-3.5 w-3.5 shrink-0 text-yellow-600" />
          <span className="whitespace-nowrap font-medium text-xs text-yellow-700">
            Update required
          </span>
        </div>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Upgrade Machine to v4</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              We'll upgrade your machine to v4 to ensure compatibility and
              access to the latest features. This process:
            </p>
            <ul className="list-disc pl-4 text-sm">
              <li>Upgrade comfy deploy node to latest version</li>
              <li>Preserves your custom nodes</li>
            </ul>

            <Alert variant="warning" className="mt-2 bg-yellow-50">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertTitle>Production Deployments</AlertTitle>
              <AlertDescription>
                If you have any active production deployments using this
                machine, it is{" "}
                <span className="font-semibold">
                  recommended to clone a new machine{" "}
                </span>
                and migrate to make sure your workflows are not affected.
              </AlertDescription>
            </Alert>

            <p className="text-muted-foreground text-sm">
              Need help? Join our{" "}
              <a
                href="https://discord.gg/ygb6VZwaMt"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Discord community
              </a>{" "}
              for support.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleUpgrade}>
            Upgrade Machine
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

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
