import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useDrawerStore } from "@/stores/drawer-store";
import { useAuth } from "@clerk/clerk-react";
import { diff } from "json-diff-ts";
import { Download, Import, Link, Workflow } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  reloadIframe,
  sendEventToCD,
  sendInetrnalEventToCD,
  sendWorkflow,
} from "./sendEventToCD";
import { useWorkflowIdInSessionView } from "@/hooks/hook";
import { useCurrentWorkflow } from "@/hooks/use-current-workflow";
import { useMachine } from "@/hooks/use-machine";
import { useAuthStore } from "@/lib/auth-store";
import { useQuery } from "@tanstack/react-query";
import { parseAsBoolean, parseAsInteger, useQueryState } from "nuqs";
import { create } from "zustand";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import type { AssetType } from "../SDInputs/sd-asset-input";

export const useCDStore = create<{
  cdSetup: boolean;
  setCDSetup: (setup: boolean) => void;
}>((set) => ({
  cdSetup: false,
  setCDSetup: (setup: boolean) => set({ cdSetup: setup }),
}));

export function useSelectedVersion(workflow_id: string | null) {
  const { workflow } = useCurrentWorkflow(workflow_id);

  const [version, setVersion] = useQueryState("version", {
    defaultValue: workflow?.versions?.[0].version ?? 1,
    ...parseAsInteger,
  });

  const {
    data: versionData,
    isLoading,
    status,
  } = useQuery<any>({
    enabled: !!workflow_id,
    queryKey: ["workflow", workflow_id, "version", version.toString()],
  });

  return {
    value: versionData,
    // versions,
    setVersion,
    isLoading: isLoading || status === "pending",
    isValidating: status === "pending",
  };
}

interface WorkflowState {
  workflow: any;
  workflow_api: any;
  setWorkflow: (workflow: any) => void;
  setWorkflowAPI: (workflow_api: any) => void;
  hasChanged: boolean;
  setHasChanged: (hasChanged: boolean) => void;
  differences: ReturnType<typeof diff>;
  setDifferences: (differences: ReturnType<typeof diff>) => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  workflow: null,
  workflow_api: null,
  setWorkflow: (workflow) => set({ workflow }),
  setWorkflowAPI: (workflow_api) => set({ workflow_api }),
  hasChanged: false,
  setHasChanged: (hasChanged) => set({ hasChanged }),
  differences: [],
  setDifferences: (differences) => set({ differences }),
}));

export const useWorspaceLoadingState = create<{
  progress: number;
  setProgress: (progress: number | ((prevProgress: number) => number)) => void;
}>((set) => ({
  progress: 0,
  setProgress: (progressOrFn) =>
    set((state) => ({
      progress:
        typeof progressOrFn === "function"
          ? progressOrFn(state.progress)
          : progressOrFn,
    })),
}));

export default function Workspace({
  endpoint: _endpoint,
  nativeMode = false,
  sessionIdOverride,
  machine_id,
  machine_version_id,
  gpu,
}: {
  endpoint: string;
  nativeMode?: boolean;
  sessionIdOverride?: string;
  machine_id?: string;
  machine_version_id?: string;
  gpu?: string;
}) {
  // const { workflowId, workflowLink, version, isFirstTime } = useSearch({
  //   from: "/sessions/$sessionId/",
  // });
  const workflowId = useWorkflowIdInSessionView();
  const workflowLink = undefined; //useWorkflowLinkInSessionView();
  const [version] = useQueryState("version", parseAsInteger);
  // const [isFirstTime] = useQueryState("isFirstTime", parseAsBoolean);
  const [isFirstTime, setIsFirstTime] = useQueryState(
    "isFirstTime",
    parseAsBoolean,
  );
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  const { workflow } = useCurrentWorkflow(workflowId ?? null);
  const { value: versionData, isLoading: isLoadingVersion } =
    useSelectedVersion(workflowId ?? null);

  const machineId = workflow?.selected_machine_id;

  const { data: machine } = useMachine(machineId);
  const isLocal = process.env.NODE_ENV === "development";

  const newPythonEndpoint = isLocal
    ? process.env.NEXT_PUBLIC_NGROK_CD_API_URL // or whatever your local Python API URL is
    : process.env.NEXT_PUBLIC_CD_API_URL;

  const { userId, orgId } = useAuth();
  const volumeName = `models_${orgId || userId}`;
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const { cdSetup, setCDSetup } = useCDStore();
  const { progress, setProgress } = useWorspaceLoadingState();
  const [hasSetupEventListener, setHasSetupEventListener] = useState(false);
  const currentWorkflowRef = useRef(null);
  const {
    setWorkflow,
    setWorkflowAPI,
    workflow: currentWorkflow,
    hasChanged,
    setHasChanged,
    differences,
    setDifferences,
  } = useWorkflowStore();

  const { value: selectedVersion } = useSelectedVersion(workflowId ?? null);

  const { data: workflowLinkJson, isLoading: isLoadingWorkflowLink } = useQuery(
    {
      queryKey: ["workflow", "link", workflowLink],
      enabled: !!workflowLink,
      queryFn: async () => {
        if (!workflowLink) return;
        console.log("fetching workflowLink", workflowLink);
        const response = await fetch(workflowLink);
        if (!response.ok) throw new Error("Failed to fetch workflow");
        return response.json();
      },
      staleTime: 1000 * 60 * 5, // Cache for 5 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  );

  useEffect(() => {
    if (!selectedVersion || !currentWorkflow) return;

    const differences = diff(selectedVersion.workflow, currentWorkflow, {
      keysToSkip: ["extra", "order", "$index"],
      embeddedObjKeys: {
        nodes: "id",
      },
    });

    setDifferences(differences);

    const isDraftDifferent = Object.keys(differences).length > 0;
    console.log(
      "isDraftDifferent",
      isDraftDifferent,
      selectedVersion.workflow,
      currentWorkflow,
      differences,
    );
    setHasChanged(isDraftDifferent);
    // return isDraftDifferent;
  }, [selectedVersion?.version, currentWorkflow]);

  const endpoint = _endpoint;

  useEffect(() => {
    if (machineId && !sessionIdOverride) {
      console.log("reloading iframe");
      setCDSetup(false);
      setProgress(0);
      reloadIframe();
    }
  }, [machineId, sessionIdOverride]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        const nextProgress = prevProgress + 6; // Increment by 6 each second to reach 60 in 10 seconds
        if (nextProgress >= 59 && !iframeLoaded) {
          return 59;
        }
        if (nextProgress >= 90 && !cdSetup) {
          clearInterval(interval);
          return 90;
        }
        return nextProgress;
      });
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [iframeLoaded, cdSetup]);

  useEffect(() => {
    if (!cdSetup) return;
    const deployInterval = setInterval(() => {
      sendEventToCD("deploy");
    }, 1000);

    return () => clearInterval(deployInterval);
  }, [cdSetup]);

  // Add new state for tracking workflow send status
  const [workflowSendAttempts, setWorkflowSendAttempts] = useState(0);
  const [isWorkflowLoaded, setIsWorkflowLoaded] = useState(false);
  const workflowToSend = useRef<any>(null);

  const setComfyUIWorkflow = (workflowJson: any) => {
    workflowToSend.current = workflowJson;
    setWorkflowSendAttempts(1); // Start first attempt
    currentWorkflowRef.current = workflowJson;
    sendWorkflow(workflowJson);
  };

  useEffect(() => {
    if (!cdSetup) return;
    if (isFirstTime) {
      setIsFirstTime(null);
      if (!workflowId && !workflowLink) {
        console.log("no workflow, setting empty");
        setComfyUIWorkflow({
          nodes: [],
        });
      } else {
        setIsImportDialogOpen(true);
      }
      return;
    }
  }, [
    workflowId,
    workflowLink,
    cdSetup,
    isLoadingVersion,
    isLoadingWorkflowLink,
    isFirstTime,
  ]);

  const { fetchToken } = useAuthStore();
  const { activeDrawer } = useDrawerStore();

  const getAPIInfo = () => {
    return {
      machine_id: machineId,
      url: endpoint,
      machine_url: machine?.url ?? endpoint,
      volume_name: volumeName,
      user_id: userId,
      org_id: orgId,
      machine_hash: machine?.machine_hash,
      // gpu: useGPUStore.getState().gpu,
      // timeout: useGPUStore.getState().gpuTimeout,
      // gpuEventId: useGPUStore.getState().gpuEventId,
    };
  };

  useEffect(() => {
    const receiveMessage = async (event: any) => {
      // It's important to check the origin for security reasons
      if (event.origin !== endpoint) return;

      if (event.data.internal) {
        switch (event.data.internal.type) {
          case "api_info":
            sendInetrnalEventToCD({
              type: "api_info",
              data: getAPIInfo(),
            });
            return;
          case "upload":
            console.log(event.data.internal.data);
            const file = event.data.internal.data.file;
            toast.promise(
              async () => {
                // TODO: Implement upload file
                // await uploadFile({
                //   volumeName: volumeName,
                //   file: file,
                //   subfolder: event.data.internal.data.subdir,
                //   apiEndpoint: apiEndpoint,
                // });
              },
              {
                loading: `Uploading ${file.name}`,
                success: "File uploaded",
                error: (error) => error.message,
              },
            );

            sendInetrnalEventToCD({
              type: "upload_done",
              data: {
                name: event.data.internal.data.file.name,
              },
            });
            return;
          default:
            break;
        }
      }

      try {
        if (typeof event.data !== "string") {
          return;
        }

        const data = JSON.parse(event.data);

        if (data.type === "assets") {
          console.log(data.data);
          useDrawerStore.getState().setActiveDrawer("assets");
          useAssetsBrowserStore.getState().setTargetNodeData(data.data);
        }

        // handleEvent(data.type, data.data);

        // console.log(data);
        if (data.type === "cd_plugin_setup") {
          setCDSetup(true);
          setProgress(100);
        } else if (data.type === "cd_plugin_onAfterChange") {
        } else if (data.type === "cd_plugin_onDeployChanges") {
          // console.log("current workflow", data.data.workflow);

          const differences = diff(
            currentWorkflowRef.current,
            data.data.workflow,
            {
              keysToSkip: ["extra", "order"],
              embeddedObjKeys: {
                nodes: "id",
              },
            },
          );

          if (Object.keys(differences).length > 0) {
            currentWorkflowRef.current = data.data.workflow;
            setWorkflow(data.data.workflow);
            setWorkflowAPI(data.data.output);
          }
        } else if (data.type === "workflow_info") {
          fetchToken().then((x) => {
            const info = {
              workflow_id: workflowId,
              machine_id: machineId,
              native_run_api_endpoint: new URL(
                "/api/run",
                newPythonEndpoint,
              ).toString(),
              cd_token: x,
              gpu_event_id: sessionIdOverride,
              gpu,
            };
            // console.log("sending workflow info", info);
            sendEventToCD("workflow_info", info);
          });
        } else if (data.type === "graph_loaded") {
          setIsWorkflowLoaded(true);
          setWorkflowSendAttempts(0);
        }
      } catch (error) {
        console.error("Error parsing message from iframe:", error);
      }
    };

    window.addEventListener("message", receiveMessage, {
      capture: true,
    });

    setHasSetupEventListener(true);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener("message", receiveMessage, {
        capture: true,
      });
    };
  }, [volumeName, machineId, endpoint]);

  useEffect(() => {
    if (!iframeLoaded) return;
    if (cdSetup) return;

    let timeout: ReturnType<typeof setTimeout>;
    const eventListener = (event: any) => {
      if (event.origin !== endpoint) return;

      try {
        const data = JSON.parse(event.data);
        if (data.type === "cd_plugin_onInit") {
          console.log("clear Timeout");
          clearTimeout(timeout);
          window.removeEventListener("message", eventListener, {
            capture: true,
          });
        }
      } catch (error) {}
    };
    console.log("event listner");

    window.addEventListener("message", eventListener, {
      capture: true,
    });
    timeout = setTimeout(() => {
      window.removeEventListener("message", eventListener);
      // setEndpointError((x) => {
      // 	if (x) return x;
      // 	return "timeout";
      // });
    }, 20000);

    return () => {
      window.removeEventListener("message", eventListener, {
        capture: true,
      });
    };
  }, [iframeLoaded, cdSetup, endpoint]);

  return (
    <>
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Import className="h-5 w-5" />
              Import Workflow
            </DialogTitle>
            <DialogDescription>
              You're about to import a workflow into your workspace.
              <br />
              Note: Please wait for the ComfyUI ready before importing.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col space-y-4 py-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <h4 className="mb-2 font-medium text-sm">Source</h4>
              {workflowLink ? (
                <div className="flex w-full flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Link className="h-4 w-4 flex-shrink-0 text-blue-500" />
                    <span className="font-medium text-sm">
                      External Workflow
                    </span>
                  </div>
                  <div className="max-h-20 overflow-y-auto rounded bg-muted/80 p-2">
                    <a
                      href={workflowLink}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all text-blue-500 text-xs hover:underline"
                    >
                      {workflowLink}
                    </a>
                  </div>
                </div>
              ) : workflowId ? (
                <div className="flex items-center gap-2">
                  <Workflow className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium text-sm">{workflow?.name}</span>
                  {version && (
                    <Badge variant="secondary" className="ml-1">
                      v{version}
                    </Badge>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setIsImportDialogOpen(false);
                if (workflowId) {
                  console.log("using workflowId", versionData.workflow);
                  setComfyUIWorkflow(versionData.workflow);
                } else if (workflowLink) {
                  console.log("using workflowLink", workflowLinkJson);
                  setComfyUIWorkflow(workflowLinkJson);
                }
              }}
              disabled={isLoadingVersion || isLoadingWorkflowLink}
              className="gap-1"
            >
              <Download className="h-4 w-4" />
              {isLoadingVersion || isLoadingWorkflowLink
                ? "Importing..."
                : "Load into Workspace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {hasSetupEventListener && (
        <iframe
          key={endpoint}
          id="workspace-iframe"
          src={
            nativeMode
              ? `${endpoint}?native_mode=true`
              : `${endpoint}?workspace_mode=true`
          }
          style={{
            userSelect: "none",
          }}
          className={cn(
            "inset-0 z-[20] h-full w-full border-none",
            !cdSetup && "pointer-events-none",
            iframeLoaded && "bg-[#353535] pt-12",
            activeDrawer === "assets" && "pointer-events-none blur-sm",
          )}
          title="iframeContent"
          allow="autoplay; encrypted-media; fullscreen; display-capture; camera; microphone"
          onLoad={() => {
            console.log("Iframe has finished loading");
            setIframeLoaded(true);
            setProgress(60);
          }}
        />
      )}
    </>
  );
}

interface AssetsBrowserState {
  open: boolean;
  setOpen: (open: boolean) => void;
  targetNodeData: any;
  setTargetNodeData: (targetNodeData: any) => void;
  sidebarMode: boolean;
  setSidebarMode: (mode: boolean) => void;
  onAssetSelect: ((asset: AssetType) => void) | null;
  setOnAssetSelect: (cb: ((asset: AssetType) => void) | null) => void;
}

export const useAssetsBrowserStore = create<AssetsBrowserState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  targetNodeData: null,
  setTargetNodeData: (targetNodeData) => set({ targetNodeData }),
  sidebarMode: false,
  setSidebarMode: (sidebarMode) => set({ sidebarMode }),
  onAssetSelect: null,
  setOnAssetSelect: (cb) => set({ onAssetSelect: cb }),
}));
