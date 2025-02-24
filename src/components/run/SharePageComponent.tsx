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
} from "@/components/workflows/OutputRender";
import { RunsTableVirtualized } from "@/components/workflows/RunsTable";
import { useWorkflowIdInWorkflowPage } from "@/hooks/hook";
import { customInputNodes } from "@/lib/customInputNodes";
import { getRelativeTime } from "@/lib/get-relative-time";
import { getDefaultValuesFromWorkflow } from "@/lib/getInputsFromWorkflow";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  Forward,
  Pencil,
  Play,
  User,
} from "lucide-react";
import { useQueryState } from "nuqs";
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

export function Playground(props: {
  title?: ReactNode;
  runOrigin?: any;
}) {
  const workflow_id = useWorkflowIdInWorkflowPage();
  const [runId, setRunId] = useQueryState("run-id");
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
    if (runId && run && runId !== lastRunIdRef.current) {
      setDefaultValues(getFormattedInputs(run));
      toast.success("Input values updated.");
      lastRunIdRef.current = runId;
    }
  }, [runId, run]);

  return (
    <>
      {/* <div className="grid h-full w-full grid-rows-[1fr,1fr] gap-4 pt-4 lg:grid-cols-[1fr,minmax(auto,500px)]">
        <div className="flex flex-col gap-4">
          <div className="rounded-sm ring-1 ring-gray-200">
            <RunsTableVirtualized
              className="fab-playground h-[calc(100vh-7rem)]"
              workflow_id={workflow_id}
              itemHeight={400}
              RunRowComponent={RunRow}
              setInputValues={setDefaultValues}
            />
          </div>
        </div>

        <Card className="h-fit w-full">
          {props.title}

          <CardContent className="flex w-full flex-col gap-4 px-3 py-2">
            <InputLayout
              deployment={deployment}
              setSelectedDeployment={setSelectedDeployment}
              deployments={deployments}
              default_values={default_values}
              runOrigin={props.runOrigin}
            />
          </CardContent>
        </Card>
      </div> */}

      {/* Useless Background */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="pointer-events-none"
      >
        <div className="-translate-x-[20%] -translate-y-1/2 absolute inset-1/2 h-[450px] w-[450px] animate-[pulse_9s_ease-in-out_infinite] rounded-full bg-blue-400 bg-opacity-30 blur-3xl" />
        <div className="-translate-x-[90%] -translate-y-[10%] absolute inset-1/2 h-72 w-72 animate-[pulse_7s_ease-in-out_infinite] rounded-full bg-purple-400 bg-opacity-30 blur-3xl delay-300" />
        <div className="-translate-x-[90%] -translate-y-[120%] absolute inset-1/2 h-52 w-52 animate-[pulse_6s_ease-in-out_infinite] rounded-full bg-red-400 bg-opacity-40 blur-2xl delay-600" />
      </motion.div>

      <div className="flex h-full w-full justify-between">
        <div className="flex h-full w-[400px] flex-col">
          <div
            className={cn(
              "flex flex-col overflow-hidden",
              logsCollapsed ? "h-[calc(100%-60px)]" : "h-[calc(60%-20px)]",
            )}
          >
            <span className="mb-1 ml-2 text-muted-foreground text-sm">
              Edit
            </span>
            <div className="flex-1 overflow-hidden rounded-sm border border-gray-200 bg-white p-3">
              <RunWorkflowInline
                blocking={false}
                default_values={default_values}
                inputs={deployment?.input_types}
                runOrigin={props.runOrigin}
                deployment_id={deployment?.id}
              />
            </div>
          </div>

          <div
            className={cn(
              "mt-2 flex flex-col",
              logsCollapsed ? "h-[40px]" : "h-[40%] min-h-[150px]",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="ml-2 text-muted-foreground text-sm">Logs</span>
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
                "mt-2 overflow-auto rounded-sm border border-gray-200 p-2",
                logsCollapsed
                  ? "h-0 opacity-0"
                  : "h-[calc(100%-30px)] opacity-100",
              )}
            >
              {/* Logs content will go here */}
            </div>
          </div>
        </div>

        <div className="mx-4 flex-1">{/* full width image */}</div>

        <div className="flex h-full w-[200px] flex-col">
          <span className="mb-1 ml-2 text-muted-foreground text-sm">
            Gallery
          </span>
          <div className="mb-4 flex-1 overflow-auto rounded-sm border border-gray-200">
            {/* Gallery content will go here */}
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
