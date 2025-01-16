import { type LogsType, LogsViewer } from "@/components/log/logs-viewer";
import { getConnectionStatus } from "@/components/machine/get-connection-status";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingIcon } from "@/components/ui/custom/loading-icon";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMachines } from "@/hooks/use-machine";
import { useMachineBuildProgress } from "@/hooks/use-machine-build-progress";
import { useAuth } from "@clerk/clerk-react";
import { differenceInHours } from "date-fns";
import {
  ChevronDown,
  ChevronUp,
  Columns,
  LayoutGrid,
  List,
} from "lucide-react";
import { memo, useDeferredValue, useEffect, useMemo, useState } from "react";
import { create } from "zustand";

type ViewMode = "new" | "full" | "sideBySide";

interface DialogState {
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
}

const useDialogStore = create<DialogState>((set) => ({
  showDialog: false,
  setShowDialog: (show) => set({ showDialog: show }),
}));

export const MemoizedStepsUI = memo(StepsUI);
const MemoizedLogsViewer = memo(LogsViewer);

export function BuildStepsUI({
  machine,
  logs,
}: {
  machine: any;
  logs: LogsType;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>("new");

  return (
    <div className="flex h-full max-h-[calc(100vh-100px)] flex-col">
      <div className="mb-4 flex space-x-2">
        <Button
          variant={viewMode === "new" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("new")}
        >
          <LayoutGrid className="mr-2 h-4 w-4" />
          New Layout
        </Button>
        <Button
          variant={viewMode === "full" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("full")}
        >
          <List className="mr-2 h-4 w-4" />
          Full Log
        </Button>
        <Button
          variant={viewMode === "sideBySide" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("sideBySide")}
        >
          <Columns className="mr-2 h-4 w-4" />
          Side by Side
        </Button>
      </div>
      <div className="flex-grow">
        {viewMode === "new" && (
          <MemoizedStepsUI logs={logs} machine={machine} />
        )}
        {viewMode === "full" && (
          <MemoizedLogsViewer
            stickToBottom
            logs={logs}
            containerClassName="w-full h-[500px]"
            className="overflow-auto"
          />
        )}
        {viewMode === "sideBySide" && (
          <div className="grid grid-cols-2 gap-4">
            <MemoizedStepsUI logs={logs} machine={machine} />
            <MemoizedLogsViewer
              stickToBottom
              logs={logs}
              containerClassName="w-full h-[500px]"
              className="overflow-auto"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function StepsUI(props: { logs: LogsType; machine: any }) {
  const { logs, machine } = props;
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const toggleStep = (stepId: string) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };

  const steps = [
    {
      id: "initialization",
      name: "Builder Version:",
      displayName: "Setup Builder",
    },
    {
      id: "clone-comfyui",
      name: "Cloning into '/comfyui'...",
      displayName: "Setup ComfyUI",
    },
    ...(machine.docker_command_steps
      ? machine.docker_command_steps.steps.map((step: any, index: number) => {
          if (step.type === "custom-node") {
            return {
              id: `custom-node-${index}`,
              name: step.data.files?.[0] ?? "",
            };
          }
          if (step.type === "commands") {
            return {
              id: `install-node-${index}`,
              name: step.data?.split("\n")[0] ?? "",
            };
          }
          return { id: `install-node-${index}`, name: "" };
        })
      : []),
    {
      id: "install-comfydeploy",
      name: "https://github.com/bennykok/comfyui-deploy",
      displayName: "Install ComfyDeploy",
    },
    {
      id: "get-static-assets",
      name: "get_static_assets",
      displayName: "Bundle frontend assets",
    },
    {
      id: "finalization",
      name: "✓ Created objects.",
      displayName: "Deploy environment",
    },
  ] as { id: string; name: string; displayName?: string }[];

  const [lastRunningStep, setLastRunningStep] = useState<string | null>(null);

  useEffect(() => {
    let lastStep = null;
    for (let i = steps.length - 1; i >= 0; i--) {
      const stepLogs = getLogsForStep(steps[i].name, i);
      if (stepLogs.length > 0) {
        lastStep = steps[i].id;
        break;
      }
    }
    setLastRunningStep(lastStep);
    if (lastStep) {
      setExpandedStep(lastStep);
    }
  }, [logs]);

  const getLogsForStep = (stepName: string, index: number) => {
    // Handle error case
    if (!Array.isArray(logs) && (logs as any)?.error) {
      console.warn("Build log error:", (logs as any).error);
      return [];
    }
    if (logs.length === 0 || !logs) return [];
    const startIndex = logs.findIndex((log) => log.logs.includes(stepName));

    let endIndex = logs.length;
    for (let i = index + 1; i < steps.length; i++) {
      const nextStepIndex = logs.findIndex((log) =>
        log.logs.includes(steps[i].name),
      );
      if (nextStepIndex !== -1) {
        endIndex = nextStepIndex;
        break;
      }
    }

    return startIndex === -1 ? [] : logs.slice(startIndex, endIndex);
  };

  return (
    <ScrollArea className="h-[530px]">
      <div className="flex w-full flex-col space-y-1">
        {steps.map((step, index) => {
          const stepLogs = getLogsForStep(step.name, index);
          const isExpanded = expandedStep === step.id;
          const isCached = stepLogs.length === 0;
          const isPending =
            isCached &&
            lastRunningStep &&
            steps.findIndex((s) => s.id === lastRunningStep) < index;

          return (
            <div
              key={step.id}
              className={`w-full rounded border p-2 text-sm transition-all duration-300 ease-in-out ${
                step.id === lastRunningStep
                  ? "border-l-2 border-l-blue-500"
                  : ""
              } ${isCached && !isPending ? "bg-gray-100" : ""} ${
                isPending ? "bg-yellow-50" : ""
              }`}
            >
              <button
                type="button"
                className={`flex w-full items-center justify-between font-medium ${
                  isCached && !isPending ? "text-gray-400" : ""
                } ${isPending ? "text-yellow-600" : ""}`}
                onClick={() => !isCached && !isPending && toggleStep(step.id)}
                disabled={!!(isCached || isPending)}
              >
                {step.displayName || step.name}
                {isPending ? (
                  <span className="text-xs text-yellow-600">(Pending)</span>
                ) : isCached ? (
                  <span className="text-gray-400 text-xs">(Cached)</span>
                ) : (
                  <span className="transition-transform duration-300 ease-in-out">
                    {isExpanded ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </span>
                )}
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isExpanded ? "max-h-[310px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                {!isCached && (
                  // <ScrollArea className=" mt-2 text-xs">
                  <LogsViewer
                    stickToBottom
                    className="overflow-auto"
                    logs={stepLogs}
                    containerClassName="h-[300px] mt-2 text-xs"
                  />
                  // </ScrollArea>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

export function MachineBuildLog({
  machine_id,
  endpoint,
  instance_id,
  machine,
}: {
  machine_id: string;
  endpoint: string;
  instance_id: string;
  machine: any;
}) {
  const { getToken } = useAuth();
  const [auth_token, setAuthToken] = useState<string | null>(null);
  const { showDialog, setShowDialog } = useDialogStore();
  const [dialogShown, setDialogShown] = useState(false);
  const { refetch } = useMachines();

  useEffect(() => {
    getToken().then(setAuthToken);
  }, []);

  // Replace all the websocket logic with the hook
  const { logs, finished, status, readyState } = useMachineBuildProgress({
    machine_id,
    endpoint,
    instance_id,
    auth_token,
  });

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

  const connectionStatus = getConnectionStatus(readyState);
  const deferredLogs = useDeferredValue(logs);

  // Watch for finished state to show dialog
  useEffect(() => {
    if (finished) {
      setShowDialog(true);
      refetch();
    }
  }, [finished]);

  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="absolute top-1 right-1 z-40">
        <Badge variant={"outline"}>{connectionStatus}</Badge>
      </div>
      <div className="flex-grow overflow-auto">
        {deferredLogs && <BuildStepsUI machine={machine} logs={deferredLogs} />}
      </div>
      {!isStale && machine.status === "building" && !finished && (
        <div className="z-40 flex w-full flex-row items-center justify-center gap-2 pb-1 text-sm">
          Listening for logs <LoadingIcon />
        </div>
      )}

      <AlertDialog open={showDialog && !dialogShown}>
        <AlertDialogContent>
          {status === "success" ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Machine Built</AlertDialogTitle>
                <AlertDialogDescription>
                  Your machine is built, you can now integrate your API, or
                  directly run to check this machines.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => {
                    setShowDialog(false);
                  }}
                >
                  Next
                </AlertDialogCancel>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Machine Failed</AlertDialogTitle>
                <AlertDialogDescription>
                  Something went wrong with the machine build, please check the
                  log. Possible cause could be conflits with custom nodes, build
                  got stuck, timeout, or too many custom nodes installed. Please
                  attempt a rebuild or remove some of the custom nodes.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => {
                    setShowDialog(false);
                    setDialogShown(true);
                  }}
                >
                  See logs
                </AlertDialogCancel>
                {/* <AlertDialogAction
                    onClick={() => {
                      router.push("/machines");
                    }}
                  >
                    Back to machines
                  </AlertDialogAction> */}
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
