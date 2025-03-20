import { ErrorBoundary } from "@/components/error-boundary";
import { LogsViewer } from "@/components/log/logs-viewer"; // Add this import
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
  ExternalLink,
  Info,
  Loader2,
  Settings2Icon,
  Zap,
} from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { type ReactNode, useMemo } from "react";
import { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Alert, AlertDescription } from "../ui/alert";
import { MyDrawer } from "../drawer";
import {
  getEnvColor,
  useWorkflowDeployments,
} from "../workspace/ContainersTable";
import { cn } from "@/lib/utils";
import { EventSourcePolyfill } from "event-source-polyfill";

export default function WorkflowComponent() {
  const [runId, setRunId] = useQueryState("run-id");

  const { selectedRun, setSelectedRun } = useRunsTableStore();

  const handleCloseRun = () => {
    setSelectedRun(null);
    setRunId(null);
  };

  return (
    <>
      {runId && (
        <MyDrawer
          backgroundInteractive={true}
          desktopClassName="w-[600px] ring-1 ring-gray-200"
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
    if (isShare) {
      // setInputValues(run.workflow_inputs);
    } else if (isPlayground) {
      navigate({
        to: "/workflows/$workflowId/$view",
        params: {
          workflowId: run.workflow_id,
          view: "playground",
        },
        search: (prev) => ({
          ...prev,
          tweak: true,
        }),
      });
    } else {
      setTweakRunId(run.id);
      onClose?.();
    }
  };

  const content = (
    <>
      <div className="mb-4 flex flex-row items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl">Run Details</h2>
          <p className="text-muted-foreground">#{run.id.slice(0, 8)}</p>
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
            <Button variant="outline" onClick={handleClick}>
              <Settings2Icon size={16} /> Tweak it
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
        <div className="grid grid-cols-2 gap-4">
          <InfoItem
            label="Status"
            value={<StatusBadge status={run.status} />}
          />
          {!props.isShare && (
            <InfoItem label="GPU" value={<Badge>{run.gpu || "N/A"}</Badge>} />
          )}
          <RunVersionAndDeployment run={run} />
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
              {/* <TabsTrigger value="timeline">Timeline</TabsTrigger> */}
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="graph">Execution</TabsTrigger>
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
            <ScrollArea className="h-[calc(100vh-490px)]">
              <OutputRenderRun
                run={run as any}
                imgClasses="max-w-[230px] w-full h-[230px] object-cover object-center rounded-[8px]"
                canExpandToView={true}
                canDownload={true}
                columns={2}
              />
            </ScrollArea>
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
                      <Button variant="outline" onClick={handleClick}>
                        <Settings2Icon size={16} /> Tweak it
                      </Button>
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
          </TabsContent>
          <TabsContent value="graph">
            <FilteredWorkflowExecutionGraph run={run as any} />
          </TabsContent>
          <TabsContent value="logs">
            <ErrorBoundary fallback={() => <div>Error loading logs</div>}>
              {run.modal_function_call_id && <LogsTab runId={run.id} />}
              {!run.modal_function_call_id && (
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
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );

  return <div className="relative h-fit w-full">{content}</div>;
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
            <span className="text-muted-foreground text-xs">
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
                  <div
                    className="absolute h-5 overflow-hidden rounded-[2px] bg-gray-200/80 shadow-sm backdrop-blur-sm"
                    style={{
                      width: `${queueWidth}%`,
                      left: 0,
                    }}
                  >
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent,5px,rgba(0,0,0,0.05)_5px,rgba(0,0,0,0.05)_10px)] opacity-20" />
                  </div>
                )}

                {showColdStart && (
                  <div
                    className={`absolute h-5 rounded-[2px] shadow-sm ${
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
                )}

                <div
                  className="absolute h-5 rounded-[2px] bg-blue-200/70 shadow-sm backdrop-blur-sm"
                  style={{
                    width: `${runWidth}%`,
                    left: `${visualExecStartPos}%`,
                  }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.5)_50%,rgba(255,255,255,0)_100%)] opacity-30" />
                </div>
              </>
            ) : (
              // Simplified view when we don't have complete timing data
              <div
                className="absolute h-5 rounded-[2px] bg-blue-200/70 shadow-sm backdrop-blur-sm"
                style={{
                  width: "100%",
                  left: 0,
                }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.5)_50%,rgba(255,255,255,0)_100%)] opacity-30" />
              </div>
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

            <div className="absolute right-0 flex translate-x-0 transform flex-col items-end whitespace-normal border-green-500 border-r-2 pr-1 font-medium text-[10px] text-green-700">
              <span>Execution</span>
              <span>Finished</span>
            </div>
          </div>
        </div>
      }
      className="col-span-2"
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
      <p className="text-muted-foreground text-sm">{label}</p>
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
