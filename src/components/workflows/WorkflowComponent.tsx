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
import { AlertCircle, ExternalLink, Info, Settings2Icon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { type ReactNode, useMemo } from "react";
import { useEffect, useState } from "react";
import { useMediaQuery } from "usehooks-ts";

import { Skeleton } from "@/components/ui/skeleton";
import { useMachine } from "@/hooks/use-machine";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Alert, AlertDescription } from "../ui/alert";

export default function WorkflowComponent() {
  const [runId, setRunId] = useQueryState("run-id");

  const { selectedRun, setSelectedRun } = useRunsTableStore();

  const handleCloseRun = () => {
    setSelectedRun(null);
    setRunId(null);
  };

  return (
    <AnimatePresence>
      {runId && (
        <motion.div
          className="relative h-fit w-full lg:max-w-[500px]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <RunDetails run_id={runId} onClose={handleCloseRun} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RunDetails(props: {
  run_id: string;
  onClose: () => void;
}) {
  const { run_id, onClose } = props;
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [selectedTab, setSelectedTab] = useQueryState("tab", parseAsString);
  const [_, setRunID] = useQueryState("runID");

  const { data: run, isLoading } = useQuery<any>({
    queryKey: ["run", run_id],
    queryKeyHashFn: (queryKey) => [...queryKey, "outputs"].toString(),
    refetchInterval: (query) => {
      if (query.state.data?.status === "running") {
        return 2000;
      }
      return false;
    },
  });

  if (isLoading) {
    return (
      <Card className="relative h-fit w-full lg:max-w-[500px]">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <Skeleton className="mb-2 h-8 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="mb-2 h-4 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>

            <div className="mt-4">
              <Skeleton className="mb-4 h-10 w-full" />
              <div className="space-y-4">
                <Skeleton className="h-[200px] w-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!run) {
    return (
      <Card className="relative h-fit w-full lg:max-w-[500px]">
        <CardContent className="space-y-6">
          <div className="py-8 text-center text-muted-foreground">
            No run data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleClick = () => {
    if (run) {
      setRunID(run.id);
    }
  };

  const content = (
    <>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl">Run Details</h2>
          {"number" in run && (
            <p className="text-muted-foreground">{run.number as number}</p>
          )}
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
      </CardHeader>
      <CardContent className="space-y-6" key={run.id}>
        <div>
          <div className="grid grid-cols-2 gap-4">
            <InfoItem
              label="Status"
              value={<StatusBadge status={run.status} />}
            />
            <InfoItem label="GPU" value={<Badge>{run.gpu || "N/A"}</Badge>} />
            <InfoItem
              label="Total Duration"
              value={
                // "duration" in run && run.duration ? (
                //   `${parseFloat(run.duration as string).toFixed(2)}s`
                // ) : (
                <RunDuration
                  showTotalDuration
                  run={run as any}
                  liveStatus={null}
                  status={run.status}
                  realtimeStatus={null}
                />
                // )
              }
            />
            {/* {"machine" in run && (
              <InfoItem label="Machine" value={(run.machine as any).name} />
            )} */}
            {run.machine_id && (
              <InfoItem
                label="Machine"
                value={<MachineLink machineId={run.machine_id} />}
              />
            )}
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
              <TabsTrigger value="outputs">Outputs</TabsTrigger>
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
              <OutputRenderRun
                run={run as any}
                imgClasses="max-w-full min-h-[230px] object-cover rounded-[8px]å"
                canExpandToView={true}
                canDownload={true}
              />
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
      </CardContent>
    </>
  );

  if (isMobile) {
    console.log("isMobile");

    return (
      <Sheet open={true} onOpenChange={props.onClose} modal={false}>
        <SheetContent side="bottom" className="h-full">
          <ScrollArea className="h-full">{content}</ScrollArea>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Card className="relative h-fit w-full lg:max-w-[500px]">
      <button
        onClick={props.onClose}
        className="absolute top-2 right-2 rounded-full p-1 hover:bg-gray-200"
        aria-label="Close"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      {content}
    </Card>
  );
}

function MachineLink({ machineId }: { machineId: string }) {
  const { data: machine, isLoading } = useMachine(machineId);

  if (isLoading) return <Skeleton className="h-4 w-24" />;

  return (
    <Link
      href={`/machines/${machineId}`}
      className="text-primary text-sm hover:underline"
    >
      {machine?.name}
    </Link>
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

function InfoItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function LogsTab({ runId }: { runId: string }) {
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
