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
import { LogsTab } from "../workflows/WorkflowComponent";
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
  duration?: number;
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

  return (
    <>
      <div className="flex h-full w-full justify-between">
        <div className="hidden h-full w-[400px] flex-col lg:flex">
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

        <div className="mx-4 w-full flex-1">
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
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Tweak this run</p>
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
        className="lg:hidden"
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
          desktopClassName="w-[500px] lg:hidden shadow-lg border border-gray-200"
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
  const { total: totalUrlCount } = getTotalUrlCountAndUrls(run?.outputs || []);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="animate-[pulse_4s_ease-in-out_infinite] text-muted-foreground text-sm">
          Please wait ...
        </p>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="animate-[pulse_4s_ease-in-out_infinite] text-muted-foreground text-sm">
          Press Run to start the queue
        </p>
      </div>
    );
  }

  if (run.status === "cancelled") {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="animate-[pulse_4s_ease-in-out_infinite] text-muted-foreground text-sm">
          Run cancelled.
        </p>
      </div>
    );
  }

  if (run.status === "failed") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2">
        <p className="animate-[pulse_4s_ease-in-out_infinite] text-red-500 text-sm">
          Run failed. You can check the logs for more details.
        </p>
        {runId && (
          <div className="mx-auto max-w-2xl">
            <LogsTab runId={runId} />
          </div>
        )}
      </div>
    );
  }

  if (run.status === "success") {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="px-8">
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
      </div>
    );
  }

  return (
    <div className="flex h-full w-full animate-[pulse_4s_ease-in-out_infinite] flex-col items-center justify-center gap-1">
      <p className="text-muted-foreground text-xs">
        {run.live_status || "Starting..."}
      </p>
      <Progress value={(run.progress || 0) * 100} className="w-64 opacity-60" />
    </div>
  );
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
              {run.duration && (
                <div className="flex items-center gap-2">
                  <Clock className="h-[14px] w-[14px]" />
                  <span className="text-xs">{getDuration(run.duration)}</span>
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

function RunRow({
  run: _run,
}: {
  run: any;
}) {
  const {
    data: run,
    isLoading,
    refetch,
  } = useQuery<any>({
    queryKey: ["run", _run?.id],
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
  const [_, setRunId] = useQueryState("run-id");

  const { data: versionData } = useQuery<any>({
    enabled: !!run?.workflow_version_id,
    queryKey: ["workflow-version", run?.workflow_version_id],
  });

  const { total: totalUrlCount } = getTotalUrlCountAndUrls(run?.outputs || []);

  const DisplayInputs = ({
    title,
    input,
  }: {
    title: string;
    input: string | number;
  }) => {
    return (
      <div className="mb-1 flex flex-col">
        <span className="font-semibold">{title}</span>
        <span
          className={`overflow-hidden ${
            shouldBreakAll(String(input)) ? "break-all" : "break-words"
          }`}
        >
          {String(input)}
        </span>
      </div>
    );
  };

  const [isScrollable, setIsScrollable] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkScrollable = () => {
      if (scrollRef.current) {
        setIsScrollable(
          scrollRef.current.scrollWidth > scrollRef.current.clientWidth,
        );
      }
    };

    checkScrollable();
    window.addEventListener("resize", checkScrollable);
    return () => window.removeEventListener("resize", checkScrollable);
  }, []);

  if (!run) {
    return (
      <div className="flex h-full flex-col overflow-hidden border-b p-2">
        <div className="grid w-full grid-cols-12 items-center gap-2">
          <Skeleton className="col-span-1 h-4 w-8" />
          <Skeleton className="col-span-2 h-6 w-16" />
          <Skeleton className="col-span-2 h-4 w-12" />
          <Skeleton className="col-span-2 h-4 w-20" />
          <div className="col-span-5 flex justify-end">
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
        <div className="mt-2 flex gap-2">
          <Skeleton className="h-[340px] w-[340px] flex-shrink-0" />
          <Skeleton className="h-[340px] w-[340px] flex-shrink-0" />
          <Skeleton className="h-[340px] w-[340px] flex-shrink-0" />
          <Skeleton className="h-[340px] w-[340px] flex-shrink-0" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-3 py-2",
          run.origin === "manual" ? "flex-row-reverse" : "flex-row",
        )}
      >
        <p className="font-mono text-2xs text-muted-foreground">
          #{run.id.slice(0, 6)}
        </p>
        {versionData?.version && (
          <Badge className="w-fit rounded-[10px] text-xs">
            {`v${versionData.version}`}
          </Badge>
        )}
        {run.gpu && (
          <Badge className="w-fit rounded-[10px] text-2xs text-gray-500">
            {run.gpu}
          </Badge>
        )}
        <p className="flex items-center whitespace-nowrap text-gray-500 text-sm">
          {getRelativeTime(run.created_at)}
        </p>
      </div>
      <div
        className={cn(
          "group flex gap-2",
          run.origin === "manual" ? "flex-row-reverse" : "flex-row",
        )}
      >
        {run.origin === "manual" && run.user_id ? (
          <div className="flex flex-col gap-2">
            <UserIcon user_id={run.user_id} />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
              <User className="h-5 w-5" />
            </div>
            <Badge className="w-fit rounded-[10px] text-xs">{run.origin}</Badge>
          </div>
        )}
        <div
          className={cn(
            "flex h-full min-w-[240px] max-w-[1400px] flex-wrap rounded-[12px] border drop-shadow-md",
            totalUrlCount === 1 && "w-[240px] xl:w-auto",
            totalUrlCount === 2 && "w-[475px] xl:w-auto",
            totalUrlCount === 3 && "w-[710px] xl:w-auto",
            (() => {
              switch (run.status) {
                case "failed":
                  return "border-red-300 bg-red-100";
                case "timeout":
                  return "border-gray-300 bg-gray-100 opacity-70";
                default:
                  return "border-gray-200 bg-white";
              }
            })(),
          )}
        >
          <div className="w-full xl:w-64">
            <div className="flex h-full flex-col items-start justify-center">
              <div className="w-full px-4 pt-4">
                <ScrollArea>
                  <div className="max-h-[150px] text-2xs leading-normal">
                    {Object.entries(getFormattedInputs(run)).map(
                      ([key, value]) => (
                        <DisplayInputs key={key} title={key} input={value} />
                      ),
                    )}
                  </div>
                </ScrollArea>
              </div>
              <LiveStatus run={run} isForRunPage refetch={refetch} />
            </div>
            {run.status === "success" && (
              <div className="absolute top-2 left-2 flex gap-1 opacity-0 transition-all group-hover:opacity-100">
                {/* show run output */}
                {/* <Popover>
                  <PopoverTrigger>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-gray-200 text-gray-700"
                    >
                      <ChevronDown size={16} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[600px]" align="start">
                    <RunInputs run={run as any} />
                  </PopoverContent>
                </Popover> */}

                {/* edit input */}

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="bg-gray-200/80 text-gray-700"
                        onClick={() => {
                          setRunId(run.id);
                        }}
                      >
                        <Pencil size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Tweak this run</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* favorite */}
                {/* <Button
                  hideLoading
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "bg-gray-200",
                    favoriteStatus
                      ? "text-yellow-500 hover:text-yellow-400"
                      : "text-gray-700"
                  )}
                  onClick={async (e) => {
                    e.stopPropagation();
                    const newFavoriteStatus =
                      await toggleWorkflowRunFavoriteStatus(run.id);
                    toast.success(
                      newFavoriteStatus
                        ? "Added to favorites"
                        : "Removed from favorites"
                    );
                    mutateFavoriteStatus();
                  }}
                >
                  <Star size={16} />
                </Button> */}
              </div>
            )}
          </div>

          {run.status === "running" && (
            <div className="flex flex-row gap-1 py-1" ref={scrollRef}>
              <Skeleton className="aspect-square h-[250px] rounded-[8px]" />
            </div>
          )}
          {run.status === "success" && (
            <ScrollArea className="grid min-h-[238px] flex-[1_0_230px] px-1">
              <div
                ref={scrollRef}
                className={cn("flex max-h-[250px] flex-row gap-1 py-1")}
              >
                {/* {imageRender} */}
                <OutputRenderRun
                  run={run as any}
                  imgClasses="max-w-full min-h-[230px] object-cover rounded-[8px]"
                  canExpandToView={true}
                  lazyLoading={true}
                  canDownload={true}
                />
              </div>

              {isScrollable && (
                <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-12 rounded-r-[8px] bg-gradient-to-l from-10% from-white to-transparent" />
              )}
            </ScrollArea>
          )}
        </div>

        <div className="grid grid-rows-3 opacity-0 transition-opacity group-hover:opacity-100">
          <div />
          {/* share */}
          <div
            className={cn(
              "flex items-center",
              run.origin === "manual" && "justify-end",
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              className="bg-transparent text-gray-700"
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set("view", "api");
                url.searchParams.set("run-id", run.id);
                navigator.clipboard.writeText(url.toString());
                toast.success("Copied to clipboard!");
              }}
            >
              <Forward size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
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

function shouldBreakAll(str: string): boolean {
  // Check if it's a URL
  try {
    new URL(str);
    return true;
  } catch {}

  // Check if it's JSON
  try {
    JSON.parse(str);
    return true;
  } catch {}

  // If it's neither a URL nor JSON, return false
  return false;
}
