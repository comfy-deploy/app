"use client";

import { cn } from "@/lib/utils";
// import { PreventNavigation } from "@/repo/components/ui/custom/prevent-navigation";
// import { createNewDraftVersion } from "@/server/actions/cdActions";
import { useAuth } from "@clerk/clerk-react";
// import { uploadFile } from "@repo/lib/uploadFile";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import { diff } from "json-diff-ts";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { WorkspaceLoading } from "./WorkspaceLoading";
import {
  reloadIframe,
  sendEventToCD,
  sendInetrnalEventToCD,
  sendWorkflow,
} from "./sendEventToCD";

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

import { useWorkflowIdInWorkflowPage } from "@/hooks/hook";
import { useCurrentWorkflow } from "@/hooks/use-current-workflow";
import { useMachine } from "@/hooks/use-machine";
import { useAuthStore } from "@/lib/auth-store";
import { useQuery } from "@tanstack/react-query";
// import { usePathname, useRouter } from "next/navigation";
import { parseAsInteger, useQueryState } from "nuqs";
import { useMediaQuery } from "usehooks-ts";
import { Drawer } from "vaul";
import { create } from "zustand";
import { AssetBrowser } from "../asset-browser";
import { UploadZone } from "../upload/upload-zone";
import { AssetsBrowserPopup } from "./assets-browser-drawer";
import {
  SessionIncrementDialog,
  useSessionIncrementStore,
} from "./increase-session";
import { WorkspaceControls } from "./workspace-control";

// import { useCurrentWorkflow } from "@/components/useCurrentWorkflow";
// import { useMachineStore } from "@/repo/components/ui/custom/workspace/DevSelectMachine";

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

function handleEvent(event: string, data?: any) {
  console.log("handleEvent", event, data);
}

export default function Workspace({
  endpoint: _endpoint,
  workflowJson,
  nativeMode = false,
  workflowId,
  sessionIdOverride,
}: {
  endpoint: string;
  workflowJson?: any;
  nativeMode?: boolean;
  workflowId?: string;
  sessionIdOverride?: string;
}) {
  // const workflowId = useWorkflowIdInWorkflowPage();

  const { workflow } = useCurrentWorkflow(workflowId ?? null);

  const machineId = workflow?.selected_machine_id;

  const { data: machine } = useMachine(machineId);

  // const newPythonEndpoint = process.env.NEXT_PUBLIC_CD_API_URL;
  const isLocal = process.env.NODE_ENV === "development";

  const newPythonEndpoint = isLocal
    ? process.env.NEXT_PUBLIC_NGROK_CD_API_URL // or whatever your local Python API URL is
    : process.env.NEXT_PUBLIC_CD_API_URL;

  const { userId, orgId } = useAuth();
  const volumeName = `models_${orgId || userId}`;
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const { cdSetup, setCDSetup } = useCDStore();
  const [progress, setProgress] = useState(0);
  const [hasSetupEventListener, setHasSetupEventListener] = useState(false);
  const currentWorkflowRef = useRef(workflowJson);
  const {
    setWorkflow,
    setWorkflowAPI,
    workflow: currentWorkflow,
    hasChanged,
    setHasChanged,
    differences,
    setDifferences,
  } = useWorkflowStore();

  useEffect(() => {
    setWorkflow(workflowJson);
    currentWorkflowRef.current = workflowJson;
  }, [workflowId, workflowJson]);

  const { value: selectedVersion } = useSelectedVersion(workflowId ?? null);

  const [sessionId] = useQueryState("sessionId", {
    defaultValue: "",
  });

  const isDraftDifferent = useMemo(() => {
    if (!selectedVersion || !currentWorkflow) return false;

    const differences = diff(selectedVersion.workflow, currentWorkflow, {
      keysToSkip: ["extra", "order", "$index"],
      embeddedObjKeys: {
        nodes: "id",
      },
    });

    setDifferences(differences);

    // console.log(
    //   "differences",
    //   differences,
    //   selectedVersion?.workflow,
    //   currentWorkflow,
    // );

    return Object.keys(differences).length > 0;
  }, [selectedVersion?.version, currentWorkflow]);

  useEffect(() => {
    setHasChanged(isDraftDifferent);
  }, [isDraftDifferent]);

  const endpoint = _endpoint;

  // useEffect(() => {
  //   console.log("reloading iframe");
  //   setCDSetup(false);
  //   setProgress(0);
  //   reloadIframe();
  // }, [turbo]);

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

  useEffect(() => {
    if (!cdSetup) return;

    console.log("sending workflow");
    sendWorkflow(currentWorkflowRef.current);

    return;
  }, [cdSetup]);

  const { fetchToken } = useAuthStore();

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
          // console.log(data.data);
          // toast.success("Open Assets");
          useAssetsBrowserStore.getState().setOpen(true);
          useAssetsBrowserStore.getState().setTargetNodeData(data.data);
        }
        if (data.type === "increase-session") {
          useSessionIncrementStore.getState().setOpen(true);
          useSessionIncrementStore.getState().setSessionId(sessionId);
        }

        // handleEvent(data.type, data.data);

        // console.log(data);
        if (data.type === "cd_plugin_setup") {
          if (workflowJson) {
            console.log("sending workflow");
            sendWorkflow(workflowJson);
          } else {
            sendWorkflow({
              nodes: [],
            });
          }
          setCDSetup(true);
          setProgress(100);

          // configureWorkspaceButtons();
          // sendEventToCD("configure_menu_right_buttons", [
          //   {
          //     id: "session",
          //     icon: "pi-clock",
          //     tooltip: "Increase the timeout of your current session",
          //     label: "Increase Timeout",
          //     btnClasses: "p-button-success",
          //     event: "increase-session",
          //     eventData: {},
          //   },
          // ]);
        } else if (data.type === "cd_plugin_onAfterChange") {
        } else if (data.type === "cd_plugin_onDeployChanges") {
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
              gpu_event_id: sessionId,
            };
            // console.log("sending workflow info", info);
            sendEventToCD("workflow_info", info);
          });
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
  }, [workflowJson, volumeName, machineId, endpoint]);

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

  const { data: session } = useQuery<any>({
    enabled: !!sessionIdOverride,
    queryKey: ["session", sessionIdOverride],
  });

  return (
    <>
      {sessionId !== "preview" && <SessionIncrementDialog />}
      <AnimatePresence>
        {!cdSetup && (
          <motion.div
            initial={{ opacity: 1 }}
            // animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[20]"
          >
            <WorkspaceLoading
              messages={[
                { message: "Connecting to ComfyUI", startProgress: 0 },
                { message: "Loading workspace", startProgress: 59 },
              ]}
              progress={progress}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AssetsBrowserPopup />

      <WorkspaceControls endpoint={endpoint} machine_id={session?.machine_id} />

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
            "inset-0 h-full w-full border-none transition-opacity ",
            !cdSetup && "opacity-0",
            cdSetup && "animate-blur-in",
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
}

export const useAssetsBrowserStore = create<AssetsBrowserState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  targetNodeData: null,
  setTargetNodeData: (targetNodeData) => set({ targetNodeData }),
}));
