"use client";
import { ErrorBoundary } from "@/components/error-boundary";
import { LogsViewer } from "@/components/log/logs-viewer"; // Add this import
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OutputRenderRun } from "@/components/workflows/OutputRender";
import { RunDuration } from "@/components/workflows/RunDuration";
import { RunInputs } from "@/components/workflows/RunInputs";
import {
  RunOutputs,
  WorkflowExecutionGraph,
  WorkflowNodesSchema,
} from "@/components/workflows/RunOutputs";
import { useRunsTableStore } from "@/components/workflows/RunsTable";
import { StatusBadge } from "@/components/workflows/StatusBadge";
import { useProgressUpdates } from "@/hooks/use-progress-update";
import { useAuthStore } from "@/lib/auth-store";
import { getRelativeTime } from "@/lib/get-relative-time";
import { EventSourcePolyfill } from "event-source-polyfill";
import {
  AlertCircle,
  ExternalLink,
  Info,
  Settings2Icon,
  Zap,
} from "lucide-react";
import { parseAsBoolean, parseAsString, useQueryState } from "nuqs";
import { type ReactNode, useMemo } from "react";
import { useEffect, useState } from "react";
import { useMediaQuery } from "usehooks-ts";

import { Skeleton } from "@/components/ui/skeleton";
import { useMachine } from "@/hooks/use-machine";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Alert, AlertDescription } from "../ui/alert";
import { MyDrawer } from "../drawer";
import { publicRunStore } from "../run/VersionSelect";
import { getDefaultValuesFromWorkflow } from "@/lib/getInputsFromWorkflow";
import {
  getEnvColor,
  useWorkflowDeployments,
} from "../workspace/ContainersTable";
import { cn } from "@/lib/utils";

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
  const isMobile = useMediaQuery("(max-width: 768px)");
  const navigate = useNavigate();

  const [selectedTab, setSelectedTab] = useQueryState("tab", parseAsString);
  const [_, setRunId] = useQueryState("run-id");
  const [isTweak, setIsTweak] = useQueryState("tweak", parseAsBoolean);
  const { setInputValues } = publicRunStore();

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
    if (isShare || isPlayground) {
      setSelectedTab("inputs");
    }
  }, [isShare, isPlayground]);

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
      setInputValues(run.workflow_inputs);
    } else {
      setRunId(run.id);
      setIsTweak(true);
      navigate({
        to: "/workflows/$workflowId/$view",
        params: {
          workflowId: run.workflow_id,
          view: "playground",
        },
      });
    }
  };

  const content = (
    <>
      <div className="flex flex-row items-center justify-between mb-4">
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
            {!isPlayground && (
              <Button variant="outline" onClick={handleClick}>
                <Settings2Icon size={16} /> Tweak it
              </Button>
            )}
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
            <RunInputs run={run as any} />
          </TabsContent>
          <TabsContent
            value="outputs"
            className="flex w-fit flex-col justify-start gap-2"
          >
            <ScrollArea className="h-[calc(100vh-380px)]">
              <OutputRenderRun
                run={run as any}
                imgClasses="max-w-full min-h-[230px] object-cover rounded-[8px]"
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
  const queueTime = run.cold_start_duration_total - run.cold_start_duration;
  const coldStartTime = run.cold_start_duration;
  const runDuration = run.run_duration;
  const totalDuration = run.duration || queueTime + coldStartTime + runDuration;
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

  const queuePos = getPercentage(queueTime);
  const execStartPos = getPercentage(queueTime + coldStartTime);
  const isStartCloseToQueue = execStartPos - queuePos < 18;

  return (
    <InfoItem
      label="Run Timeline"
      value={
        <div className="mt-2 w-full pb-2">
          <div className="relative mb-1 flex h-6 w-full">
            <div className="-translate-x-0 absolute left-0 transform whitespace-nowrap font-medium text-gray-600 text-xs">
              {formatTime(0)}
            </div>

            <div
              className="-translate-x-1/2 absolute transform whitespace-nowrap font-medium text-gray-600 text-xs"
              style={{ left: `${queuePos}%` }}
            >
              {formatTime(queueEndTime)}
            </div>

            <div
              className="-translate-x-1/2 absolute transform whitespace-nowrap font-medium text-gray-600 text-xs"
              style={{ left: `${execStartPos}%` }}
            >
              {formatTime(executionStartTime)}
            </div>

            <div className="absolute right-0 translate-x-0 transform whitespace-nowrap font-medium text-gray-600 text-xs">
              {formatTime(totalDuration)}
            </div>
          </div>

          {/* Timeline - Middle Row */}
          <div className="relative flex h-5 w-full items-center">
            {/* Base timeline track */}
            <div className="absolute h-5 w-full shadow-inner" />

            {/* Queue segment with subtle pattern - no rounded-l */}
            {queueTime > 0 && (
              <div
                className="absolute h-5 overflow-hidden rounded-[2px] bg-gray-300 shadow-sm"
                style={{
                  width: `${getPercentage(queueTime) - 1}%`,
                  left: 6,
                }}
              >
                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent,5px,rgba(0,0,0,0.1)_5px,rgba(0,0,0,0.1)_10px)] opacity-10" />
              </div>
            )}

            {/* Cold start / Warm start segment */}
            <div
              className={`absolute h-5 rounded-[2px] shadow-sm ${
                isWarm
                  ? "bg-gradient-to-r from-amber-300 to-amber-400"
                  : "bg-gradient-to-r from-purple-500 to-amber-400"
              }`}
              style={{
                width: `${getPercentage(coldStartTime) - 0.9}%`,
                left: `${getPercentage(queueTime) + 0.5}%`,
              }}
            >
              {isWarm && (
                <>
                  <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.8)_0%,transparent_70%)] opacity-20" />
                  <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 transform text-amber-600">
                    <Zap size={16} />
                  </div>
                </>
              )}
            </div>

            {/* Run duration segment - no rounded-r */}
            <div
              className="absolute h-5 rounded-[2px] bg-gradient-to-r from-blue-400 to-blue-600 shadow-sm"
              style={{
                width: `${getPercentage(runDuration) - 1.1}%`,
                left: `${getPercentage(queueTime + coldStartTime) + 0.6}%`,
              }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.5)_50%,rgba(255,255,255,0)_100%)] opacity-20" />
            </div>

            <div className="absolute left-0 z-10 h-6 w-0.5 rounded-full bg-gray-700" />
            <div
              className="absolute z-10 h-6 w-0.5 rounded-full bg-gray-700"
              style={{ left: `${queuePos}%` }}
            />
            <div
              className="absolute z-10 h-6 w-0.5 rounded-full bg-gray-700"
              style={{ left: `${execStartPos}%` }}
            />
            <div
              className="absolute z-10 h-6 w-0.5 rounded-full bg-gray-700"
              style={{ right: 0 }}
            />
          </div>

          <div className="relative mt-1.5 h-8 w-full">
            <div className="-translate-x-0 absolute left-0 transform whitespace-nowrap border-gray-400 border-l-2 pl-1 font-medium text-gray-700 text-xs">
              Submitted
            </div>

            <div
              className="absolute transform whitespace-nowrap font-medium text-xs"
              style={{
                left: `${queuePos}%`,
                transform: `translateX(${isStartCloseToQueue ? "-90%" : "-50%"})`,
                color: isWarm ? "#d97706" : "#b45309",
              }}
            >
              <div className="flex items-center border-amber-500 border-l-2 pl-1">
                {isWarm ? "Warm Start" : "Cold Start"}
              </div>
            </div>

            <div
              className="absolute transform whitespace-nowrap font-medium text-blue-700 text-xs"
              style={{
                left: `${execStartPos}%`,
                transform: `translateX(${isStartCloseToQueue ? "-10%" : "-50%"})`,
              }}
            >
              <div className="flex items-center border-blue-500 border-l-2 pl-1">
                Execution Started
              </div>
            </div>

            <div className="absolute right-0 translate-x-0 transform whitespace-nowrap border-green-500 border-r-2 pr-1 font-medium text-green-700 text-xs">
              Execution Finished
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
