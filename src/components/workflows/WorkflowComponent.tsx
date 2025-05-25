import { ErrorBoundary } from "@/components/error-boundary";
import { LogsViewer } from "@/components/log/logs-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OutputRenderRun } from "@/components/workflows/OutputRender";
import { RunInputs } from "@/components/workflows/RunInputs";
import {
  RunOutputs,
  WorkflowExecutionGraph,
  WorkflowNodesSchema,
} from "@/components/workflows/RunOutputs";
import { useRunsTableStore } from "@/components/workflows/RunsTable";
import { StatusBadge } from "@/components/workflows/StatusBadge";
import { useAuthStore } from "@/lib/auth-store";
import {
  AlertCircle,
  Archive,
  CheckCircle,
  ChevronDown,
  ExternalLink,
  Info,
  LinkIcon,
  Loader2,
  Settings2Icon,
  XCircle,
  Zap,
} from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { type ReactNode, useMemo } from "react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { EventSourcePolyfill } from "event-source-polyfill";
import { ApiPlaygroundDemo2 } from "../api-playground-demo";
import { MyDrawer } from "../drawer";
import { Alert, AlertDescription } from "../ui/alert";
import { CodeBlock } from "../ui/code-blocks";
import { TooltipTrigger } from "../ui/tooltip";
import { Tooltip, TooltipContent, TooltipProvider } from "../ui/tooltip";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import {
  getEnvColor,
  useWorkflowDeployments,
} from "../workspace/ContainersTable";
import { useMachine } from "@/hooks/use-machine";
import { UserIcon } from "../run/SharePageComponent";

export default function WorkflowComponent() {
  const [runId, setRunId] = useQueryState("run-id");
  const [tab, setTab] = useQueryState("tab", parseAsString);

  const { selectedRun, setSelectedRun } = useRunsTableStore();

  const handleCloseRun = () => {
    setSelectedRun(null);
    setRunId(null);
    setTab(null);
  };

  return (
    <>
      {runId && (
        <MyDrawer
          backgroundInteractive={true}
          desktopClassName="w-[600px] ring-1 ring-gray-200 shadow-xl"
          open={!!runId}
          onClose={() => {
            handleCloseRun();
          }}
        >
          <RunDetails run_id={runId} onClose={handleCloseRun} />
        </MyDrawer>
      )}
    </>
  );
}

export function RunDetails(props: {
  run_id: string;
  onClose?: () => void;
  isShare?: boolean;
  isPlayground?: boolean;
}) {
  const { run_id, onClose, isShare = false, isPlayground = false } = props;

  const [selectedTab, setSelectedTab] = useQueryState("tab", parseAsString);
  const [tweakRunId, setTweakRunId] = useQueryState("runID");
  const navigate = useNavigate();

  const { data: run, isLoading } = useQuery<any>({
    queryKey: ["run", run_id],
    meta: {
      params: {
        queue_position: true,
      },
    },
    queryKeyHashFn: (queryKey) => [...queryKey, "outputs"].toString(),
    refetchInterval: (query) => {
      if (
        query.state.data?.status === "running" ||
        query.state.data?.status === "uploading" ||
        query.state.data?.status === "not-started" ||
        query.state.data?.status === "queued"
      ) {
        return 2000;
      }
      return false;
    },
  });

  useEffect(() => {
    if (run?.status === "failed") {
      setSelectedTab("logs");
    }
  }, [run]);

  useEffect(() => {
    if (isPlayground) {
      setSelectedTab("inputs");
    }
  }, [isPlayground]);

  useEffect(() => {
    if (!run?.webhook && selectedTab === "webhook") {
      setSelectedTab(null);
    }
  }, [run?.id]);

  const [isApiPlaygroundOpen, setIsApiPlaygroundOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (!run) {
    return (
      // <Card className="relative h-fit w-full lg:max-w-[500px]">
      // <CardContent className="space-y-6">
      <div className="py-8 text-center text-muted-foreground">
        No run data available
      </div>
      // </CardContent>
      // </Card>
    );
  }

  const handleClick = () => {
    if (!run) return;

    navigate({
      to: "/workflows/$workflowId/$view",
      params: {
        workflowId: run.workflow_id,
        view: isPlayground ? "playground" : "requests",
      },
      search: (prev) => ({
        ...prev,
        tweak: true,
      }),
    });
  };

  const content = (
    <>
      <div className="mb-4 flex flex-row items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl">Run Details</h2>
          <div className="flex items-center">
            <p className="line-clamp-1 font-mono text-2xs text-muted-foreground">
              #{run.id}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(run.id);
                toast.success("Run ID copied to clipboard");
              }}
              title="Copy run ID"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <UserIcon user_id={run.user_id} className="h-5 w-5" displayName />
          {run.batch_id && (
            <Link
              href={`/batch/${run.batch_id}`}
              className="text-primary hover:underline"
            >
              Batch #{run.batch_id}
            </Link>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClick} className="gap-1">
              <Settings2Icon size={16} /> Tweak
            </Button>
            {process.env.NODE_ENV === "development" &&
              run.machine_type === "comfy-deploy-serverless" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    window.open(
                      `https://modal.com/apps/comfy-deploy/main/deployed/${run.machine_id}`,
                      "_blank",
                    );
                  }}
                >
                  <Info size={14} className="mr-2 text-green-700" />
                  Modal
                </Button>
              )}
          </div>
        </div>
      </div>
      <div>
        <div className="grid grid-cols-3 gap-3">
          <InfoItem
            label="Status"
            value={<StatusBadge status={run.status} />}
          />
          <RunVersionAndDeployment run={run} />
          {run.machine_id && <RunMachine machineId={run.machine_id} />}
          {!props.isShare && (
            <InfoItem label="GPU" value={<Badge>{run.gpu || "N/A"}</Badge>} />
          )}
          {run.queue_position !== undefined && run.queue_position !== null && (
            <InfoItem label="Queue Position" value={run.queue_position} />
          )}
          <RunTimeline run={run} />
          {run.batch_id && (
            <InfoItem
              label="Batch"
              value={
                <Link
                  href={`/batch/${run.batch_id}`}
                  className="text-primary hover:underline"
                >
                  #{run.batch_id}
                </Link>
              }
            />
          )}
        </div>

        <Tabs
          defaultValue="outputs"
          className="mt-4"
          value={selectedTab ?? "outputs"}
          onValueChange={setSelectedTab}
        >
          <TabsList className="">
            <TabsTrigger value="inputs">Inputs</TabsTrigger>
            {!isPlayground && (
              <TabsTrigger value="outputs">Outputs</TabsTrigger>
            )}
            <>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              {/* <TabsTrigger value="graph">Execution</TabsTrigger> */}
              {run.webhook && (
                <TabsTrigger value="webhook">Webhook</TabsTrigger>
              )}
            </>
          </TabsList>
          <TabsContent value="inputs">
            <ScrollArea className="h-[calc(100vh-470px)]">
              <RunInputs run={run as any} />
            </ScrollArea>
          </TabsContent>
          <TabsContent
            value="outputs"
            className="flex w-fit flex-col justify-start gap-2"
          >
            <ScrollArea className="h-[calc(100vh-515px)]">
              <OutputRenderRun
                run={run as any}
                imgClasses="max-w-[230px] w-full h-[230px] object-cover object-center rounded-[8px]"
                canExpandToView={true}
                columns={2}
              />
            </ScrollArea>
            <div className="flex flex-row items-center justify-end gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="link" className="flex items-center gap-2">
                    View Full Outputs <ExternalLink size={16} />
                  </Button>
                </DialogTrigger>
                <DialogContent className="flex h-fit max-h-[calc(100vh-10rem)] max-w-3xl flex-col">
                  <DialogHeader>
                    <DialogTitle>Run outputs</DialogTitle>
                    <DialogDescription>
                      <div className="flex items-center justify-between">
                        You can view your run&apos;s outputs here
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="flex w-full flex-col pr-4">
                    <div className="w-full rounded-md border border-gray-200 bg-muted/50 p-2">
                      <RunInputs run={run as any} />
                    </div>
                    <div className="mt-4 w-full rounded-md border border-gray-200 bg-muted/50 p-2">
                      <RunOutputs run={run as any} />
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
              <Button
                variant={"ghost"}
                onClick={() => {
                  setIsApiPlaygroundOpen(true);
                }}
                className="flex items-center gap-2"
              >
                View Get Run API
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="graph">
            <FilteredWorkflowExecutionGraph run={run as any} />
          </TabsContent>
          <TabsContent value="logs">
            <span className="pl-2 text-2xs text-muted-foreground">
              *Logs are only available for <b>30 days</b>.
            </span>
            <ErrorBoundary fallback={() => <div>Error loading logs</div>}>
              <FinishedRunLogDisplay
                runId={run.id}
                modalFnCallId={run.modal_function_call_id}
                runUpdatedAt={run.updated_at}
              />
            </ErrorBoundary>
          </TabsContent>
          <TabsContent value="webhook">
            <WebhookTab run={run} webhook={run.webhook} />
          </TabsContent>
        </Tabs>

        <MyDrawer
          desktopClassName="w-[1100px]"
          open={isApiPlaygroundOpen}
          onClose={() => {
            setIsApiPlaygroundOpen(false);
          }}
        >
          <ApiPlaygroundDemo2
            defaultPathParams={{
              run_id: run.id,
            }}
          />
        </MyDrawer>
      </div>
    </>
  );

  return <div className="relative h-fit w-full">{content}</div>;
}

function RunMachine({ machineId }: { machineId: string }) {
  const { data: machine } = useMachine(machineId);

  return (
    <InfoItem
      label="Machine"
      value={<div className="text-xs">{machine?.name}</div>}
    />
  );
}

function RunVersionAndDeployment({ run }: { run: any }) {
  const { data: versionData, isLoading } = useQuery<any>({
    queryKey: ["workflow-version", run.workflow_version_id],
    enabled: !!run.workflow_version_id,
  });
  const { data: deploymentData } = useWorkflowDeployments(run.workflow_id);

  if (!versionData || isLoading) return null;

  // Find the matching deployment once instead of multiple times
  const matchingDeployment = deploymentData?.find(
    (deployment) => deployment.id === run.deployment_id,
  );
  const isDeployment = !!matchingDeployment;

  return (
    <InfoItem
      label="Run Version"
      value={
        <div className="flex items-center gap-2">
          {isDeployment && (
            <Badge className={getEnvColor(matchingDeployment.environment)}>
              {matchingDeployment.environment}
            </Badge>
          )}
          <Badge variant="outline">v{versionData.version}</Badge>
          {versionData.comment && (
            <span className="line-clamp-1 text-muted-foreground text-xs">
              {versionData.comment}
            </span>
          )}
        </div>
      }
    />
  );
}

function RunTimeline({ run }: { run: any }) {
  // Extract timing data with safeguards for missing/invalid values
  const coldStartDurationTotal = run.cold_start_duration_total || 0;
  const coldStartDuration = run.cold_start_duration || 0;
  const runDuration = run.run_duration || 0;
  const totalDuration = run.duration || 0;

  // Calculate queue time, ensuring it's not negative
  const queueTime = Math.max(0, coldStartDurationTotal - coldStartDuration);
  const coldStartTime = coldStartDuration;

  // Determine if we have complete timing data or just partial data
  const hasCompleteTimingData = queueTime > 0 && runDuration > 0;

  // Check if warm based on cold start duration
  const isWarm =
    run.started_at !== undefined &&
    (run.cold_start_duration === undefined || run.cold_start_duration <= 5);

  // Format time helper function
  const formatTime = (seconds: number) => {
    return seconds < 1
      ? `${(seconds * 1000).toFixed(0)}ms`
      : `${seconds.toFixed(1)}s`;
  };

  const getPercentage = (value: number) => {
    return totalDuration > 0 ? (value / totalDuration) * 100 : 0;
  };

  const queueEndTime = queueTime;
  const executionStartTime = queueEndTime + coldStartTime;

  // Replace the single MIN_SEGMENT_PERCENT with specific minimums for each segment
  const MIN_WIDTHS = {
    queue: 15, // Queue time minimum width
    coldStart: 10, // Cold start minimum width
    run: 24, // Run duration minimum width
  };

  const getVisualPercentages = () => {
    // First, calculate how many segments we actually have
    const hasQueue = queueTime > 0;
    const hasColdStart = coldStartTime > 0;
    const hasRun = runDuration > 0;

    // Get base percentages with their specific minimums
    let queuePercent = hasQueue
      ? Math.max(getPercentage(queueTime), MIN_WIDTHS.queue)
      : 0;
    let coldStartPercent = hasColdStart
      ? Math.max(getPercentage(coldStartTime), MIN_WIDTHS.coldStart)
      : 0;
    let runPercent = hasRun
      ? Math.max(getPercentage(runDuration), MIN_WIDTHS.run)
      : 0;

    // Calculate total of current percentages
    const totalPercent = queuePercent + coldStartPercent + runPercent;

    // If total exceeds 100%, normalize all segments proportionally
    if (totalPercent > 100) {
      const normalizationFactor = 100 / totalPercent;
      queuePercent *= normalizationFactor;
      coldStartPercent *= normalizationFactor;
      runPercent *= normalizationFactor;
    }

    return {
      queueWidth: queuePercent,
      coldStartWidth: coldStartPercent,
      runWidth: runPercent,
    };
  };

  // Calculate normalized visual percentages
  const { queueWidth, coldStartWidth, runWidth } = getVisualPercentages();

  // Only show cold start segment if duration is greater than zero
  const showColdStart = coldStartTime > 0;

  // Calculate visual positions for segments
  const visualQueuePos = queueWidth;
  const visualExecStartPos = queueWidth + coldStartWidth;

  return (
    <InfoItem
      label="Run Timeline"
      value={
        <div className="mt-2 w-full pb-2">
          {/* Time Labels - with conditional rendering */}
          <div className="relative flex h-5 w-full">
            <div className="-translate-x-0 absolute left-0 transform whitespace-nowrap font-medium text-[10px] text-gray-600">
              {formatTime(0)}
            </div>

            {hasCompleteTimingData && queueTime > 0 && (
              <div
                className="-translate-x-1/2 absolute transform whitespace-nowrap font-medium text-[10px] text-gray-600"
                style={{ left: `${visualQueuePos}%` }}
              >
                {formatTime(queueEndTime)}
              </div>
            )}

            {hasCompleteTimingData && showColdStart && (
              <div
                className="-translate-x-1/2 absolute transform whitespace-nowrap font-medium text-[10px] text-gray-600"
                style={{ left: `${visualExecStartPos}%` }}
              >
                {formatTime(executionStartTime)}
              </div>
            )}

            <div className="absolute right-0 translate-x-0 transform whitespace-nowrap font-medium text-[10px] text-gray-600">
              {formatTime(totalDuration)}
            </div>
          </div>

          {/* Timeline - Middle Row */}
          <div className="relative flex h-5 w-full items-center">
            {/* Base timeline track */}
            <div className="absolute h-5 w-full shadow-inner" />

            {/* Conditional rendering based on available data */}
            {hasCompleteTimingData ? (
              <>
                {queueTime > 0 && (
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div
                          className="absolute h-5 cursor-pointer overflow-hidden rounded-[2px] bg-gray-200/80 shadow-sm backdrop-blur-sm"
                          style={{
                            width: `${queueWidth}%`,
                            left: 0,
                          }}
                        >
                          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent,5px,rgba(0,0,0,0.05)_5px,rgba(0,0,0,0.05)_10px)] opacity-20" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        {formatTime(queueTime)}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {showColdStart && (
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div
                          className={`absolute h-5 cursor-pointer rounded-[2px] shadow-sm ${
                            isWarm
                              ? "bg-amber-200/70 backdrop-blur-sm"
                              : "bg-purple-200/70 backdrop-blur-sm"
                          }`}
                          style={{
                            width: `${coldStartWidth}%`,
                            left: `${queueWidth}%`,
                          }}
                        >
                          {isWarm && (
                            <>
                              <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.8)_0%,transparent_70%)] opacity-30" />
                              <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 transform text-amber-500/80">
                                <Zap size={16} />
                              </div>
                            </>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        {formatTime(coldStartTime)}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "absolute h-5 cursor-pointer rounded-[2px] shadow-sm backdrop-blur-sm",
                          run.status === "timeout"
                            ? "bg-amber-200/70"
                            : "bg-blue-200/70",
                        )}
                        style={{
                          width: `${runWidth}%`,
                          left: `${visualExecStartPos}%`,
                        }}
                      >
                        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.5)_50%,rgba(255,255,255,0)_100%)] opacity-30" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {formatTime(runDuration)}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            ) : (
              // Simplified view when we don't have complete timing data
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "absolute h-5 cursor-pointer rounded-[2px] shadow-sm backdrop-blur-sm",
                        run.status === "timeout"
                          ? "bg-amber-200/70"
                          : "bg-blue-200/70",
                      )}
                      style={{
                        width: "100%",
                        left: 0,
                      }}
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.5)_50%,rgba(255,255,255,0)_100%)] opacity-30" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {formatTime(totalDuration)}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Timeline markers - always show start and end */}
            <div className="absolute left-0 z-10 h-6 w-0.5 rounded-full bg-gray-700" />

            {/* Only show intermediate markers if we have the data */}
            {hasCompleteTimingData && queueTime > 0 && (
              <div
                className="absolute z-10 h-6 w-0.5 rounded-full bg-gray-700"
                style={{ left: `${visualQueuePos}%` }}
              />
            )}

            {/* Only show cold start marker if there's a cold start duration */}
            {hasCompleteTimingData && showColdStart && (
              <div
                className="absolute z-10 h-6 w-0.5 rounded-full bg-gray-700"
                style={{ left: `${visualExecStartPos}%` }}
              />
            )}

            <div
              className="absolute z-10 h-6 w-0.5 rounded-full bg-gray-700"
              style={{ right: 0 }}
            />
          </div>

          {/* Event Labels - with conditional rendering */}
          <div className="relative mt-1.5 h-8 w-full">
            <div className="-translate-x-0 absolute left-0 transform whitespace-normal border-gray-400 border-l-2 pl-1 font-medium text-[10px] text-gray-700">
              Submitted
            </div>

            {hasCompleteTimingData && queueTime > 0 && (
              <div
                className="absolute transform whitespace-normal font-medium text-[10px]"
                style={{
                  left: `${visualQueuePos}%`,
                }}
              >
                <div
                  className={cn(
                    "flex flex-col items-start border-l-2 pl-1",
                    isWarm
                      ? "border-amber-500 text-amber-500"
                      : "border-purple-600 text-purple-600",
                  )}
                >
                  {!showColdStart ? (
                    <>
                      <span>Execution</span>
                      <span>Started</span>
                    </>
                  ) : isWarm ? (
                    <>
                      <span>Warm</span>
                      <span>Start</span>
                    </>
                  ) : (
                    <>
                      <span>Cold</span>
                      <span>Start</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {hasCompleteTimingData && showColdStart && (
              <div
                className="absolute transform whitespace-normal font-medium text-[10px] text-blue-700"
                style={{
                  left: `${visualExecStartPos}%`,
                }}
              >
                <div className="flex flex-col items-start border-blue-500 border-l-2 pl-1">
                  <span>Execution</span>
                  <span>Started</span>
                </div>
              </div>
            )}

            <div
              className={`absolute right-0 flex translate-x-0 transform flex-col items-end whitespace-normal border-r-2 pr-1 font-medium text-[10px] ${
                run.status === "timeout"
                  ? "border-amber-500 text-amber-500"
                  : "border-green-500 text-green-700"
              }`}
            >
              <span>Execution</span>
              <span>{run.status === "timeout" ? "Timeout" : "Finished"}</span>
            </div>
          </div>
        </div>
      }
      className="col-span-3"
    />
  );
}

function FilteredWorkflowExecutionGraph({ run }: { run: any }) {
  const data = useMemo(() => {
    const output = run.outputs?.find((output: any) => {
      const parseResult = WorkflowNodesSchema.safeParse(output.data);
      return parseResult.success;
    });
    if (!output) return null;
    return WorkflowNodesSchema.parse(output?.data);
  }, [run]);

  if (!data)
    return (
      <div className="w-full rounded-md bg-muted p-4 text-center text-muted-foreground text-xs">
        No execution data
      </div>
    );

  return <WorkflowExecutionGraph run={data} />;
}

function InfoItem({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(className)}>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

export function LogsTab({ runId }: { runId: string }) {
  const [logs, setLogs] = useState<Array<{ timestamp: number; logs: string }>>(
    [],
  );
  const fetchToken = useAuthStore((state) => state.fetchToken);

  useEffect(() => {
    // Reset logs when runId changes
    setLogs([]);

    let eventSource: EventSource;
    let unmounted = false;

    const setupEventSource = async () => {
      const token = await fetchToken();

      if (unmounted) return;

      const url = new URL(
        `${process.env.NEXT_PUBLIC_CD_API_URL}/api/stream-logs`,
      );
      url.searchParams.append("run_id", runId);
      url.searchParams.append("log_level", "info");

      eventSource = new EventSourcePolyfill(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }) as unknown as EventSource;

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "keepalive") return;
        // console.log("Received data:", data);
        // console.log("data.message type:", typeof data.message);
        // console.log("data.message content:", data.message);

        try {
          let parsedLogs;
          if (typeof data.message === "string") {
            try {
              parsedLogs = JSON.parse(data.message);
            } catch (error) {
              parsedLogs = [
                {
                  timestamp: new Date(data.timestamp).getTime() / 1000,
                  logs: data.message,
                },
              ];
            }
          } else if (Array.isArray(data.message)) {
            parsedLogs = data.message;
          } else {
            console.error("Unexpected data.message format:", data.message);
            return;
          }

          if (Array.isArray(parsedLogs)) {
            setLogs((prevLogs) => [...prevLogs, ...parsedLogs]);
          } else {
            setLogs((prevLogs) => [
              ...prevLogs,
              {
                timestamp: data.timestamp,
                logs: JSON.stringify(parsedLogs),
              },
            ]);
            // console.error("Parsed message is not an array:", parsedLogs);
          }
        } catch (error) {
          console.error("Error processing message:", error);
          console.error("Problematic data:", data.message);
        }
      };

      eventSource.onerror = (event) => {
        console.error("EventSource failed:", event);
        eventSource.close();
      };
    };

    setupEventSource();

    return () => {
      unmounted = true;
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [runId, fetchToken]); // Added runId to the dependency array

  return (
    <div className="h-[300px] w-full">
      <LogsViewer logs={logs} stickToBottom hideTimestamp />
    </div>
  );
}

type WebhookData = {
  timestamp: string;
  type: string;
  message: {
    status: number;
    latency_ms: number;
    message?: string;
    payload?: string;
  };
};

function WebhookTab({ run, webhook }: { run: any; webhook: string }) {
  const fetchToken = useAuthStore((state) => state.fetchToken);
  const [webhookEvents, setWebhookEvents] = useState<WebhookData[]>([]);
  const [expandedEventIndex, setExpandedEventIndex] = useState<number | null>(
    null,
  );

  useEffect(() => {
    let eventSource: EventSource;
    let unmounted = false;

    setWebhookEvents([]);
    setExpandedEventIndex(null);

    const setupEventSource = async () => {
      const token = await fetchToken();

      if (unmounted) return;

      const url = new URL(
        `${process.env.NEXT_PUBLIC_CD_API_URL}/api/stream-logs`,
      );
      url.searchParams.append("run_id", run.id);
      url.searchParams.append("log_level", "webhook");

      eventSource = new EventSourcePolyfill(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }) as unknown as EventSource;

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "keepalive") return;

        try {
          const parsedMessage = JSON.parse(data.message);
          const webhookData: WebhookData = {
            timestamp: data.timestamp,
            type: data.type,
            message: parsedMessage,
          };

          setWebhookEvents((prev) => [...prev, webhookData]);
        } catch (error) {
          console.error("Error parsing webhook data:", error);
        }
      };

      eventSource.onerror = (event) => {
        console.error("EventSource failed:", event);
        eventSource.close();
      };
    };

    setupEventSource();

    return () => {
      unmounted = true;
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [run.id, fetchToken]);

  const toggleExpand = (index: number) => {
    setExpandedEventIndex(expandedEventIndex === index ? null : index);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatLatency = (ms: number) => {
    if (ms >= 1000) {
      return `${(ms / 1000).toFixed(2)}s`;
    }
    return `${ms.toFixed(0)}ms`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-muted-foreground">
          <LinkIcon size={14} />
          <span className="text-sm">URL</span>
        </div>
        <div className="flex items-center gap-2 rounded-md border px-3 py-2">
          <span className="overflow-hidden text-ellipsis text-muted-foreground text-xs">
            {webhook}
          </span>
        </div>
      </div>

      <div className="rounded-md border">
        <div className="border-b bg-muted/40 px-3 py-2">
          <h3 className="text-sm">Events</h3>
        </div>

        <ScrollArea className="h-[300px]">
          <ul className="divide-y">
            {webhookEvents
              .slice()
              .reverse()
              .map((event, index) => {
                return (
                  <li key={index} className="px-3 py-2">
                    {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                    <button
                      onClick={() => toggleExpand(index)}
                      className="flex w-full items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {event.message.status === 200 ? (
                          <CheckCircle size={16} className="text-green-500" />
                        ) : (
                          <XCircle size={16} className="text-red-500" />
                        )}
                        <span className="text-2xs text-muted-foreground">
                          {formatTime(event.timestamp)}
                        </span>
                        <Badge
                          variant={
                            event.message.status === 200
                              ? "green"
                              : "destructive"
                          }
                          className="!text-2xs !py-0"
                        >
                          {event.message.status}
                        </Badge>
                        {event.message.payload && (
                          <ErrorBoundary
                            fallback={() => {
                              return (
                                <Badge
                                  variant="outline"
                                  className="!text-2xs !py-0"
                                >
                                  -
                                </Badge>
                              );
                            }}
                          >
                            <Badge
                              variant="outline"
                              className="!text-2xs !py-0"
                            >
                              {JSON.parse(event.message.payload)?.event_type}
                            </Badge>
                          </ErrorBoundary>
                        )}
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2 font-mono text-2xs text-muted-foreground">
                          {formatLatency(event.message.latency_ms)}
                        </span>
                        <ChevronDown
                          size={16}
                          className={cn(
                            "text-muted-foreground transition-transform",
                            expandedEventIndex === index
                              ? "rotate-180 transform"
                              : "",
                          )}
                        />
                      </div>
                    </button>

                    {expandedEventIndex === index && (
                      <div className="mt-2 rounded bg-muted/40 p-2 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="font-medium">Created at</p>
                            <p className="text-muted-foreground">
                              {formatDateTime(event.timestamp)}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium">Status</p>
                            <p className="text-muted-foreground">
                              {event.message.status}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium">Latency</p>
                            <p className="font-mono text-muted-foreground">
                              {formatLatency(event.message.latency_ms)}
                            </p>
                          </div>
                          {event.message.payload && (
                            <div className="col-span-2">
                              <p className="font-medium">Payload</p>
                              <CodeBlock
                                className="h-[200px] text-2xs"
                                code={JSON.stringify(
                                  JSON.parse(event.message.payload),
                                  null,
                                  2,
                                )}
                                lang="json"
                              />
                            </div>
                          )}
                          {event.message.message && (
                            <div className="col-span-2">
                              <p className="font-medium">Error Message</p>
                              <div className="mt-1 rounded bg-gray-100 p-2 font-mono text-2xs">
                                <pre className="whitespace-pre-wrap break-words text-red-600">
                                  {typeof event.message.message === "string"
                                    ? event.message.message
                                    : JSON.stringify(
                                        event.message.message,
                                        null,
                                        2,
                                      )}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}

            {run.status !== "success" &&
              run.status !== "failed" &&
              run.status !== "cancelled" && (
                <div className="flex items-center justify-center p-2 text-2xs text-muted-foreground">
                  <Loader2 className="mr-2 h-[14px] w-[14px] animate-spin" />
                  Waiting for webhook events...
                </div>
              )}
          </ul>
        </ScrollArea>
      </div>
    </div>
  );
}

type RunLog = {
  run_id: string;
  timestamp: string;
  log: string;
};

function FinishedRunLogDisplay({
  runId,
  modalFnCallId,
  runUpdatedAt,
}: { runId: string; modalFnCallId: string; runUpdatedAt: string }) {
  const { data: runLogs, isLoading } = useQuery<RunLog[]>({
    queryKey: ["clickhouse-run-logs", runId],
    enabled: !!runId,
  });

  const [showRawLogs, setShowRawLogs] = useState(false);

  // Add check for logs older than 30 days
  const isLogsExpired = useMemo(() => {
    if (!runUpdatedAt) return false;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(runUpdatedAt) < thirtyDaysAgo;
  }, [runUpdatedAt]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (isLogsExpired) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex max-w-md flex-col items-center rounded-lg border border-muted bg-muted/30 px-6 py-8 text-center shadow-md">
          <div className="mb-2 rounded-full bg-muted/50 p-3">
            <Archive className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="mb-1 font-medium text-sm">
            Log Retention Limit Reached
          </h3>
          <p className="text-muted-foreground text-xs leading-5">
            These logs are no longer available as they have exceeded our 30-day
            retention period.
          </p>
        </div>
      </div>
    );
  }

  if (!runLogs || runLogs.length === 0) {
    return (
      <div>
        {modalFnCallId ? (
          <LogsTab runId={runId} />
        ) : (
          <Alert
            variant="default"
            className="w-auto max-w-md border-muted bg-muted/50"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-muted-foreground text-sm">
              We're unable to display logs for runs from the workspace.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  // Function to try parsing JSON in log entries
  const formatLogContent = (logText: string) => {
    if (!logText) return;

    try {
      const jsonData = JSON.parse(logText);

      // Handle validation error format
      if (jsonData.error?.error?.type === "prompt_outputs_failed_validation") {
        const nodeErrors = jsonData.error.node_errors;
        const firstError = Object.values(nodeErrors)[0] as any;

        return (
          <div className="space-y-2">
            {/* Simplified error message */}
            <div className="rounded-md bg-red-50 p-2">
              <div className="font-medium text-2xs text-destructive">
                {firstError.errors[0].message}
              </div>
            </div>

            {/* Full error details in collapsible */}
            <details>
              <summary className="cursor-pointer font-medium text-2xs text-muted-foreground">
                View full error details
              </summary>
              <pre className="mt-1 rounded bg-muted p-2 text-[10px] leading-snug">
                {JSON.stringify(jsonData, null, 2)}
              </pre>
            </details>
          </div>
        );
      }

      // If it's an exception log with traceback, format it specially
      if (jsonData.exception_message && jsonData.traceback) {
        return (
          <div className="text-2xs">
            <div className="rounded-md bg-red-50 p-2">
              <div className="font-medium text-destructive">
                {jsonData.exception_type}: {jsonData.exception_message}
              </div>
            </div>
            <pre className="mt-1 rounded bg-muteds p-1 text-[10px] leading-snug">
              {jsonData.traceback.join("")}
            </pre>
            {jsonData.current_inputs && (
              <details className="mt-1">
                <summary className="cursor-pointer font-medium text-2xs">
                  Inputs
                </summary>
                <pre className="mt-1 rounded bg-muted p-1 text-[10px] leading-snug">
                  {JSON.stringify(jsonData.current_inputs, null, 2)}
                </pre>
              </details>
            )}
          </div>
        );
      }

      // Otherwise just pretty-print the JSON with improved formatting
      return (
        <pre className="whitespace-pre-wrap break-words rounded bg-muted p-1 text-[10px] leading-snug">
          {JSON.stringify(jsonData, null, 2)}
        </pre>
      );
    } catch {
      // Not JSON, return as plain text with word wrapping
      return (
        <div className="whitespace-pre-wrap text-2xs">
          {logText.replace(/\r/g, "\n")}
        </div>
      );
    }
  };

  return (
    <div className="overflow-hidden rounded-[10px] border">
      <div className="flex items-center justify-between border-b bg-muted/50 px-3 py-1.5 font-medium text-xs">
        <span>Logs</span>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="xs"
            className={cn(
              "h-6 rounded-none text-[10px]",
              !showRawLogs
                ? "-mb-[2px] border-primary border-b-2 bg-muted/80"
                : "text-muted-foreground",
            )}
            onClick={() => setShowRawLogs(false)}
          >
            Grouped
          </Button>
          <Button
            variant="ghost"
            size="xs"
            className={cn(
              "h-6 rounded-none text-[10px]",
              showRawLogs
                ? "-mb-[2px] border-primary border-b-2 bg-muted/80"
                : "text-muted-foreground",
            )}
            onClick={() => setShowRawLogs(true)}
          >
            Raw
          </Button>
        </div>
      </div>

      {showRawLogs ? (
        <div>
          {modalFnCallId ? (
            <LogsTab runId={runId} />
          ) : (
            <Alert
              variant="default"
              className="w-auto max-w-md border-muted bg-muted/50"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-muted-foreground text-sm">
                We're unable to display logs for runs from the workspace.
              </AlertDescription>
            </Alert>
          )}
        </div>
      ) : (
        <ScrollArea>
          <div className="h-[calc(100vh-550px)]">
            {runLogs.map((entry, index) => {
              return (
                <div
                  key={index}
                  className="border-b px-3 py-1 hover:bg-muted/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex w-20 flex-shrink-0 justify-end">
                      <TooltipProvider>
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger>
                            <div className="mt-[3px] font-mono text-[10px] text-muted-foreground">
                              {new Date(entry.timestamp).toLocaleTimeString()}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            <div className="font-mono text-[11px]">
                              <div className="grid grid-cols-[70px_auto]">
                                <div>Date</div>
                                <div>
                                  {new Date(entry.timestamp).toLocaleString()}
                                </div>
                                <div>Timestamp</div>
                                <div>{Number(entry.timestamp)}</div>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex-grow">
                      {formatLogContent(entry.log)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
