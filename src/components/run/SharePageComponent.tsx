// import { DisplaySharePageSheet } from "@/components/DisplaySharePageSheet";
import { RunWorkflowInline } from "@/components/run/RunWorkflowInline";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSelectedVersion } from "@/components/version-select";
import { LiveStatus } from "@/components/workflows/LiveStatus";
import {
  FileURLRender,
  getTotalUrlCountAndUrls,
  OutputRenderRun,
  PlaygroundOutputRenderRun,
} from "@/components/workflows/OutputRender";
import {
  RunsTableVirtualized,
  useRuns,
} from "@/components/workflows/RunsTable";
import { useWorkflowIdInWorkflowPage } from "@/hooks/hook";
import { customInputNodes } from "@/lib/customInputNodes";
import { getDuration, getRelativeTime } from "@/lib/get-relative-time";
import { getDefaultValuesFromWorkflow } from "@/lib/getInputsFromWorkflow";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Forward,
  Loader2,
  Pencil,
  Play,
  Settings2,
  User,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { parseAsBoolean, useQueryState } from "nuqs";
import { type ReactNode, useEffect, useRef, useState } from "react";
// import Markdown from "react-markdown";
// import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { AssetsBrowserPopup } from "../workspace/assets-browser-drawer";
import {
  getEnvColor,
  useWorkflowDeployments,
} from "../workspace/ContainersTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Fab } from "../fab";
import { MyDrawer } from "../drawer";
import { useAssetsBrowserStore } from "../workspace/Workspace";
import { motion } from "framer-motion";
import { VirtualizedInfiniteList } from "../virtualized-infinite-list";
import { LogsTab, RunDetails } from "../workflows/WorkflowComponent";
import { LogsViewer } from "../log/logs-viewer";
import { Progress } from "../ui/progress";
import { Separator } from "../ui/separator";

type run = {
  status:
    | "running"
    | "uploading"
    | "not-started"
    | "queued"
    | "success"
    | "cancelled"
    | "failed";
  live_status?: string;
  progress?: number;
  outputs?: any[];
  id: string;
  created_at: string;
  run_duration?: number;
};

export function useRun(runId?: string) {
  const runQuery = useQuery<run>({
    queryKey: ["run", runId],
    queryKeyHashFn: (queryKey) => [...queryKey, "outputs"].toString(),
    refetchInterval: (query) => {
      if (
        query.state.data?.status !== "success" &&
        query.state.data?.status !== "failed"
      ) {
        return 2000;
      }
      return false;
    },
    enabled: !!runId,
  });

  return runQuery;
}

export function Playground(props: {
  title?: ReactNode;
  runOrigin?: any;
}) {
  const workflow_id = useWorkflowIdInWorkflowPage();
  const [runId, setRunId] = useQueryState("run-id");
  const [isTweak, setIsTweak] = useQueryState("tweak", parseAsBoolean);
  const [showRunInputsMobileLayout, setShowRunInputsMobileLayout] =
    useState(false);
  const [logsCollapsed, setLogsCollapsed] = useState(false);
  const { data: run, isLoading: isRunLoading } = useQuery({
    enabled: !!runId,
    queryKey: ["run", runId],
    queryKeyHashFn: (queryKey) => [...queryKey, "outputs"].toString(),
  });

  const { data: deployments, isLoading: isDeploymentsLoading } =
    useWorkflowDeployments(workflow_id);

  const [selectedDeployment, setSelectedDeployment] = useQueryState(
    "deployment",
    { defaultValue: deployments?.[0]?.id },
  );

  const deployment = deployments?.find(
    (deployment) => deployment.id === selectedDeployment,
  );

  const [default_values, setDefaultValues] = useState(
    getDefaultValuesFromWorkflow(deployment?.input_types),
  );

  useEffect(() => {
    setDefaultValues(getDefaultValuesFromWorkflow(deployment?.input_types));
  }, [deployment?.id]);

  const lastRunIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (runId && isTweak && run && runId !== lastRunIdRef.current) {
      setDefaultValues(getFormattedInputs(run));
      toast.success("Input values updated.");
      lastRunIdRef.current = runId;
      setIsTweak(null);
    }
  }, [runId, run, isTweak]);

  const runsQuery = useRuns({ workflow_id: workflow_id! });
  const virtualizerRef = useRef<HTMLDivElement>(null);
  const lastKeyPressTime = useRef<number>(0);
  const keyDebounceTime = 150; // milliseconds between allowed key presses

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!runsQuery.data?.pages || runsQuery.data.pages.length === 0) return;

      // Flatten all runs from all pages
      const allRuns = runsQuery.data.pages.flat();
      if (!allRuns.length) return;

      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        // Debounce key presses to prevent rapid navigation
        const now = Date.now();
        if (now - lastKeyPressTime.current < keyDebounceTime) {
          e.preventDefault();
          return;
        }
        lastKeyPressTime.current = now;

        e.preventDefault();

        // Find current index
        const currentIndex = runId
          ? allRuns.findIndex((run) => run.id === runId)
          : -1;

        let newIndex = currentIndex;
        if (e.key === "ArrowUp") {
          // Only go up if not at the first item
          if (currentIndex > 0) {
            newIndex = currentIndex - 1;
          } else if (currentIndex === -1) {
            // If no selection, select the last item
            newIndex = allRuns.length - 1;
          }
          // If already at first item (index 0), do nothing
        } else {
          // Only go down if not at the last item
          if (currentIndex < allRuns.length - 1) {
            newIndex = currentIndex + 1;
          } else if (currentIndex === -1) {
            // If no selection, select the first item
            newIndex = 0;
          }
          // If already at last item, do nothing
        }

        // Only update if the index actually changed
        if (newIndex !== currentIndex) {
          const newRunId = allRuns[newIndex]?.id;
          if (newRunId) {
            setRunId(newRunId);

            // Scroll the selected item into view
            if (virtualizerRef.current) {
              // Find the element with the matching run ID
              const elements = virtualizerRef.current.querySelectorAll(
                `[data-run-id="${newRunId}"]`,
              );
              if (elements.length > 0) {
                // Find the parent element with a data-index attribute
                const parent = elements[0].closest("[data-index]");
                if (parent) {
                  parent.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                  });
                }
              }
            }
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [runId, runsQuery.data, setRunId]);

  return (
    <>
      <div className="flex h-full w-full justify-between">
        <div className="hidden h-full w-[400px] flex-col xl:flex">
          <div
            className={cn(
              "flex flex-col transition-all",
              logsCollapsed ? "h-[calc(100%-60px)]" : "h-[calc(100%-370px)]",
            )}
          >
            <span className="mb-1 ml-2 font-semibold text-sm">Edit</span>
            <div className="flex-1 overflow-hidden rounded-sm border border-gray-200 bg-white p-3 shadow-sm">
              {isDeploymentsLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : deployment ? (
                <ScrollArea className="h-full">
                  <RunWorkflowInline
                    blocking={false}
                    default_values={default_values}
                    inputs={deployment?.input_types}
                    runOrigin={props.runOrigin}
                    deployment_id={deployment?.id}
                  />
                </ScrollArea>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2">
                  <p className="text-center font-medium text-muted-foreground text-sm">
                    No deployments found for this workflow.
                  </p>
                  <p className="mx-4 text-center text-muted-foreground text-xs leading-5">
                    Start a new workspace below to save a version, and promote
                    it to a deployment for testing in the playground.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div
            className={cn(
              "my-2 flex flex-col transition-all",
              logsCollapsed ? "h-[40px]" : "h-[350px]",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="ml-2 font-semibold text-sm">Logs</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLogsCollapsed(!logsCollapsed)}
                className="h-6 px-2"
              >
                {logsCollapsed ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </Button>
            </div>
            <div
              className={cn(
                "mt-2 overflow-auto rounded-sm border border-gray-200 p-2 shadow-sm",
                logsCollapsed
                  ? "h-0 opacity-0 transition-all"
                  : "h-[calc(100%-30px)] opacity-100 transition-all",
              )}
            >
              {runId && run?.modal_function_call_id ? (
                <LogsTab runId={runId} />
              ) : (
                <div className="h-[300px] w-full">
                  <LogsViewer
                    logs={[
                      {
                        timestamp: 0,
                        logs: "Listening for logs...",
                      },
                    ]}
                    stickToBottom
                    hideTimestamp
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full flex-1 lg:mx-4">
          <div className="relative h-full">
            {/* Useless Background */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="pointer-events-none absolute inset-0 z-0"
            >
              <div className="-translate-x-[20%] -translate-y-1/2 absolute inset-1/2 h-[450px] w-[450px] animate-[pulse_9s_ease-in-out_infinite] rounded-full bg-blue-400 bg-opacity-30 blur-3xl" />
              <div className="-translate-x-[90%] -translate-y-[10%] absolute inset-1/2 h-72 w-72 animate-[pulse_7s_ease-in-out_infinite] rounded-full bg-purple-400 bg-opacity-30 blur-3xl delay-300" />
              <div className="-translate-x-[90%] -translate-y-[120%] absolute inset-1/2 h-52 w-52 animate-[pulse_6s_ease-in-out_infinite] rounded-full bg-red-400 bg-opacity-40 blur-2xl delay-600" />
            </motion.div>

            <div className="relative z-10 h-full w-full">
              <RunDisplay runId={runId ?? undefined} />
              <ArrowIndicator
                disableTop={true}
                disableLeft={true}
                disableDown={true}
                disableRight={true}
              />
            </div>

            {/* Environment & GPU Info Bar */}
            {deployment && (
              <div className="-translate-x-1/2 absolute bottom-4 left-1/2 z-20 hidden lg:flex">
                <div className="flex items-center gap-2">
                  <div className="items-center gap-3 rounded-full border border-gray-200 bg-white/90 p-2 shadow-lg backdrop-blur-sm">
                    <Select
                      value={deployment?.id}
                      onValueChange={(value) => {
                        const selectedDeployment = deployments?.find(
                          (d) => d.id === value,
                        );
                        if (selectedDeployment) {
                          setSelectedDeployment(selectedDeployment.id);
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 w-[200px] border-none bg-transparent">
                        <SelectValue placeholder="Select environment" />
                      </SelectTrigger>
                      <SelectContent>
                        {deployments?.map((dep) => (
                          <SelectItem key={dep.id} value={dep.id}>
                            <div className="flex w-full items-center justify-between gap-2">
                              <Badge
                                variant="outline"
                                className={cn(getEnvColor(dep.environment))}
                              >
                                {dep.environment}
                              </Badge>
                              <span className="text-gray-500 text-xs">
                                {dep.gpu || "No GPU"}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        {/* biome-ignore lint/a11y/noNoninteractiveTabindex: <explanation> */}
                        <span tabIndex={0}>
                          <Button
                            variant="outline"
                            className="group h-12 w-[50px] rounded-full shadow-lg"
                            size="icon"
                            disabled={!runId}
                            onClick={() => {
                              setIsTweak(true);
                            }}
                          >
                            <Settings2 className="h-4 w-4 shrink-0" />
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {!runId ? (
                          <p>Please select a run in Gallery</p>
                        ) : (
                          <p>Tweak this run</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="hidden h-full w-[120px] flex-col lg:flex">
          <span className="mb-1 ml-2 font-semibold text-sm">Gallery</span>
          <div className="relative mb-2 flex-1 overflow-hidden rounded-sm border border-gray-200 shadow-sm">
            <VirtualizedInfiniteList
              ref={virtualizerRef}
              className="!h-full scrollbar-track-transparent scrollbar-thin scrollbar-none p-1.5"
              queryResult={runsQuery}
              renderItem={(run) => <RunGallery runId={run?.id} />}
              estimateSize={107}
              renderLoading={() => {
                return [...Array(4)].map((_, i) => (
                  <Skeleton
                    key={i}
                    className="aspect-square w-[100px] rounded-[8px]"
                  />
                ));
              }}
            />
            <div className="pointer-events-none absolute top-0 right-0 left-0 z-10 h-10 bg-gradient-to-b from-white to-transparent" />
            <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-10 bg-gradient-to-t from-white to-transparent" />
          </div>
        </div>
      </div>

      <Fab
        refScrollingContainerKey="fab-playground"
        className="z-50 xl:hidden"
        mainItem={{
          onClick: () =>
            setShowRunInputsMobileLayout(!showRunInputsMobileLayout),
          name: "Queue run",
          icon: Play,
        }}
      />

      {showRunInputsMobileLayout && (
        <MyDrawer
          open={showRunInputsMobileLayout}
          backgroundInteractive={true}
          onClose={() => setShowRunInputsMobileLayout(false)}
          desktopClassName="w-[500px] xl:hidden shadow-lg border border-gray-200"
        >
          <InputLayout
            deployment={deployment}
            setSelectedDeployment={setSelectedDeployment}
            deployments={deployments}
            default_values={default_values}
            runOrigin={props.runOrigin}
          />
        </MyDrawer>
      )}
    </>
  );
}

function RunDisplay({ runId }: { runId?: string }) {
  const { data: run, isLoading } = useRun(runId);
  const { total: totalUrlCount, urls: urlList } = getTotalUrlCountAndUrls(
    run?.outputs || [],
  );
  const [viewingImageIndex, setViewingImageIndex] = useState<number | null>(
    null,
  );

  // Handle keyboard navigation
  useEffect(() => {
    if (!urlList || urlList.length <= 1) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setViewingImageIndex((prev) =>
          prev === 0 ? urlList.length - 1 : prev - 1,
        );
      } else if (e.key === "ArrowRight") {
        e.preventDefault();

        if (viewingImageIndex === null) {
          setViewingImageIndex(0);
        } else {
          setViewingImageIndex((prev) =>
            prev === urlList.length - 1 ? 0 : prev + 1,
          );
        }
      } else if (
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "Escape"
      ) {
        setViewingImageIndex(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewingImageIndex, urlList.length]);

  // Common container styles for status messages
  const containerClass = "flex h-full w-full items-center justify-center";
  const messageClass =
    "animate-[pulse_4s_ease-in-out_infinite] text-muted-foreground text-sm";

  // Handle loading and empty states
  if (isLoading || !run) {
    return (
      <div className={containerClass}>
        <p className={messageClass}>
          {isLoading ? "Please wait ..." : "Press Run to start the queue"}
        </p>
      </div>
    );
  }

  // Handle different run statuses
  switch (run.status) {
    case "cancelled":
      return (
        <div className={containerClass}>
          <p className={messageClass}>Run cancelled.</p>
        </div>
      );

    case "failed":
      return (
        <div className={containerClass}>
          <p className={cn(messageClass, "text-red-500")}>
            Run failed. Scroll down to check the logs for more details.
          </p>
        </div>
      );

    case "success":
      return (
        <div className="scrollbar-track-transparent scrollbar-thin scrollbar-none h-full overflow-x-hidden overflow-y-scroll">
          <div className="sticky top-0 flex min-h-[calc(100%-20px)] w-full items-center justify-center">
            <div className="relative px-8">
              {viewingImageIndex !== null ? (
                // Image viewer mode
                <div className="relative flex flex-col items-center">
                  {/* Image thumbnails navigation bar */}
                  <div className="-top-24 absolute flex w-full items-center justify-center">
                    <div className="flex max-w-full gap-2 overflow-x-auto rounded-sm p-2">
                      {urlList.map((item, index) => (
                        <button
                          type="button"
                          key={index}
                          onClick={() => setViewingImageIndex(index)}
                          className={cn(
                            "relative flex-shrink-0 overflow-hidden rounded-md transition-all",
                            viewingImageIndex === index
                              ? "shadow-md outline outline-2 outline-purple-500 outline-offset-2"
                              : "opacity-70 ring-transparent hover:opacity-100",
                          )}
                        >
                          <div className="relative h-16 w-16">
                            <img
                              src={item.url}
                              alt={`Thumbnail ${index + 1}`}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <FileURLRender
                    url={urlList[viewingImageIndex].url}
                    imgClasses="max-h-[60vh] object-contain shadow-md max-w-full"
                    lazyLoading={false}
                  />
                </div>
              ) : (
                // Gallery mode
                <div className="relative">
                  <OutputRenderRun
                    run={run}
                    imgClasses={cn(
                      "shadow-md max-w-full",
                      totalUrlCount > 1
                        ? "max-h-[30vh]"
                        : "max-h-[80vh] object-contain",
                    )}
                    lazyLoading={true}
                    columns={totalUrlCount > 4 ? 3 : 2}
                  />
                </div>
              )}

              <div className="-bottom-12 absolute right-0 left-0 flex flex-col items-center justify-center">
                <span className="text-muted-foreground text-xs">
                  Scroll for details
                </span>
                <ChevronDown className="h-4 w-4" />
              </div>

              {totalUrlCount > 1 && (
                <>
                  <div className="-translate-y-1/2 absolute top-1/2 right-0 flex flex-col items-center justify-center">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                  <div className="-translate-y-1/2 absolute top-1/2 left-0 flex flex-col items-center justify-center">
                    <ChevronLeft className="h-4 w-4" />
                  </div>
                </>
              )}
            </div>
          </div>
          {runId && (
            <div className="relative z-10 flex w-full items-center justify-center rounded-t-sm border border-gray-200 bg-white/80 p-8 pb-16 drop-shadow-lg backdrop-blur-lg">
              <div className="w-full max-w-5xl px-4">
                <RunDetails run_id={runId} isPlayground={true} />
              </div>
            </div>
          )}
        </div>
      );

    // Default case for running, uploading, not-started, queued
    default:
      return (
        <div className="flex h-full w-full animate-[pulse_4s_ease-in-out_infinite] flex-col items-center justify-center gap-1">
          <p className="text-muted-foreground text-xs">
            {run.live_status || "Starting..."}
          </p>
          <Progress
            value={(run.progress || 0) * 100}
            className="w-64 opacity-60"
          />
        </div>
      );
  }
}

function RunGallery({ runId }: { runId: string }) {
  const { data: run, isLoading } = useRun(runId);
  const [currentRunId, setCurrentRunId] = useQueryState("run-id");

  if (isLoading) {
    return <Skeleton className="aspect-square w-[105px] rounded-[6px]" />;
  }

  if (!run) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
          <div
            data-run-id={runId}
            className="cursor-pointer"
            onClick={() => {
              if (runId !== currentRunId) {
                setCurrentRunId(runId);
              } else {
                setCurrentRunId(null);
              }
            }}
          >
            <PlaygroundOutputRenderRun
              run={run as any}
              isSelected={runId === currentRunId}
              imgClasses="w-[105px] aspect-square object-cover rounded-[6px] shrink-0 overflow-hidden"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" className="w-[250px] p-3 py-2">
          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              {run.run_duration && (
                <div className="flex items-center gap-2">
                  <Clock className="h-[14px] w-[14px]" />
                  <span className="text-xs">
                    {getDuration(run.run_duration)}
                  </span>
                </div>
              )}
              <Badge
                variant="outline"
                className={cn(
                  "px-1.5 py-0 text-[10px]",
                  run.status === "success"
                    ? "border-green-200 bg-green-50 text-green-600"
                    : run.status === "failed"
                      ? "border-red-200 bg-red-50 text-red-600"
                      : run.status === "running"
                        ? "border-blue-200 bg-blue-50 text-blue-600"
                        : "border-gray-200 bg-gray-50 text-gray-600",
                )}
              >
                {run.status}
              </Badge>
            </div>
          </div>

          <Separator className="my-2" />

          <div className="flex justify-between">
            <span className="font-mono text-[11px] text-muted-foreground">
              #{run.id.slice(0, 10)}
            </span>
            <span className="text-2xs text-muted-foreground">
              {getRelativeTime(run.created_at)}
            </span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ArrowIndicator({
  disableTop,
  disableLeft,
  disableDown,
  disableRight,
}: {
  disableTop: boolean;
  disableLeft: boolean;
  disableDown: boolean;
  disableRight: boolean;
}) {
  return (
    <>
      <div className="absolute right-2 bottom-8 flex flex-col items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-[6px] bg-white/90 shadow-sm backdrop-blur-sm"
          aria-label="Up"
          disabled={disableTop}
        >
          <ChevronUp size={16} />
        </Button>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-[6px] bg-white/90 shadow-sm backdrop-blur-sm"
            aria-label="Left"
            disabled={disableLeft}
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-[6px] bg-white/90 shadow-sm backdrop-blur-sm"
            aria-label="Down"
            disabled={disableDown}
          >
            <ChevronDown size={16} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-[6px] bg-white/90 shadow-sm backdrop-blur-sm"
            aria-label="Right"
            disabled={disableRight}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </>
  );
}

function InputLayout({
  deployment,
  setSelectedDeployment,
  deployments,
  default_values,
  runOrigin,
}: {
  deployment: any;
  setSelectedDeployment: (deployment: any) => void;
  deployments: any;
  default_values: any;
  runOrigin: string;
}) {
  return (
    <Tabs defaultValue="regular">
      <TabsContent value="regular">
        <Select
          value={deployment?.id}
          defaultValue={deployment?.id}
          onValueChange={(value) => {
            const deployment = deployments?.find((d) => d.id === value);
            if (deployment) {
              setSelectedDeployment(deployment.id);
            }
          }}
        >
          <SelectTrigger className="mb-4 w-[200px] capitalize">
            <SelectValue placeholder="Select deployment" />
          </SelectTrigger>
          <SelectContent>
            {deployments?.map((deployment) => (
              <SelectItem
                key={deployment.id}
                value={deployment.id}
                className="flex items-center justify-between capitalize"
              >
                {/* <span>{deployment.environment}</span> */}
                <Badge
                  variant="outline"
                  className={cn(getEnvColor(deployment.environment))}
                >
                  {deployment.environment}
                </Badge>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {deployment && (
          <RunWorkflowInline
            blocking={false}
            default_values={default_values}
            inputs={deployment?.input_types}
            runOrigin={runOrigin}
            deployment_id={deployment?.id}
          />
        )}
        {!deployment && (
          <div className="flex flex-col gap-2 text-center text-muted-foreground text-sm">
            <p>No deployment selected</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

type UserIconData = {
  image_url?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
};

export function UserIcon({
  user_id,
  className,
  displayName = false,
}: {
  user_id: string;
  className?: string;
  displayName?: boolean;
}) {
  const { data: userData } = useQuery<UserIconData>({
    queryKey: ["user", user_id],
  });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Avatar className={cn("h-8 w-8", className)}>
              <AvatarImage src={userData?.image_url || ""} />
              <AvatarFallback>
                <Skeleton className="h-full w-full" />
              </AvatarFallback>
            </Avatar>
            {displayName && (
              <span className="text-muted-foreground text-xs">
                {userData?.username ||
                  `${userData?.first_name} ${userData?.last_name}`}
              </span>
            )}
          </div>
        </TooltipTrigger>
        {/* At least firstName or LastName is required to display something */}
        {userData && (userData.last_name || userData.first_name) && (
          <TooltipContent side="bottom">
            <p>
              {" "}
              {userData?.username ||
                `${userData?.first_name} ${userData?.last_name}`}
            </p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

function getFormattedInputs(run: any): Record<string, any> {
  if (
    run.workflow_inputs &&
    typeof run.workflow_inputs === "object" &&
    Object.keys(run.workflow_inputs).length > 0
  ) {
    return run.workflow_inputs;
  }
  if (run.workflow_api) {
    return Object.entries(run.workflow_api).reduce(
      (acc, [nodeId, node]) => {
        if (
          customInputNodes.hasOwnProperty(
            node.class_type as keyof typeof customInputNodes,
          )
        ) {
          if (node.class_type === "ComfyUIDeployExternalImage") {
            // Handle external image case safely
            const linkedNodeId =
              Array.isArray(node.inputs.default_value) &&
              node.inputs.default_value.length > 0
                ? node.inputs.default_value[0]
                : null;
            const linkedNode = linkedNodeId
              ? run.workflow_api?.[linkedNodeId]
              : null;
            if (linkedNode?.inputs?.image) {
              acc[node.inputs.input_id] = linkedNode.inputs.image;
            } else {
              acc[node.inputs.input_id] = node.inputs.default_value || null;
            }
          } else {
            acc[node.inputs.input_id] = node.inputs.default_value || null;
          }
        }
        return acc;
      },
      {} as Record<string, any>,
    );
  }
  return {};
}
