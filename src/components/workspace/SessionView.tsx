"use client";

import { useUpdateServerActionDialog } from "@/components/auto-form/auto-form-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UploadZone } from "@/components/upload/upload-zone";
import { AssetsPanel } from "@/components/workspace/assets-panel";
import { useCurrentWorkflow } from "@/hooks/use-current-workflow";
import { useMachine } from "@/hooks/use-machine";
import { useSessionAPI } from "@/hooks/use-session-api";
import { useAuthStore } from "@/lib/auth-store";
import { machineGPUOptions } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { EventSourcePolyfill } from "event-source-polyfill";
import { Eye, Folder, Image, List, Plus, Wrench, X } from "lucide-react";
import { Info } from "lucide-react";
import { Loader2 } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { Suspense, useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AssetBrowser } from "../asset-browser";
import { ModelList } from "../storage/model-list";
import { ModelListHeader, ModelListView } from "../storage/model-list-view";
import { SidebarMenuButton } from "../ui/sidebar";
import { Skeleton } from "../ui/skeleton";
import { App } from "./App";
import { useLogStore } from "./LogContext";
import { LogDisplay } from "./LogDisplay";
import Workspace, { useAssetsBrowserStore } from "./Workspace";
// import { OnBoardingDialog } from "@/repo/components/ui/custom/workspace/OnBoardingDialog";
// import { SessionList } from "@/repo/components/ui/custom/workspace/SessionList";
// import { ModelsListLayout } from "@/repo/components/ui/custom/workspace/Windows";
// import { WorkspaceProvider } from "./WorkspaceContext";
import { useCDStore } from "./Workspace";
import { sendEventToCD } from "./sendEventToCD";
import { SessionCreate } from "./session-create";
import { useQuery } from "@tanstack/react-query";

const staticUrl = process.env.COMFYUI_FRONTEND_URL!;
console.log(staticUrl);

export function ModelsButton(props: {
  isPreview: boolean;
}) {
  const handleAssetClick = (asset: {
    url: string;
    name: string;
    id: string;
  }) => {
    if (asset.url) {
      sendEventToCD("add_node", {
        type: "ComfyUIDeployExternalImage",
        widgets_values: [asset.url],
      });
    }
  };

  return (
    <>
      {!props.isPreview && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="gap-1"
              size="sm"
              Icon={List}
              iconPlacement="left"
            >
              <span className="hidden lg:block">Logs</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-fit p-2">
            <LogDisplay />
          </PopoverContent>
        </Popover>
      )}
      {/* <Popover>
        <PopoverTrigger asChild> */}
      <Button
        variant="outline"
        className="gap-1"
        size="sm"
        Icon={Image}
        onClick={() => {
          useAssetsBrowserStore.getState().setOpen(true);
        }}
        iconPlacement="left"
      >
        <span className="hidden lg:block">Assets</span>
      </Button>
      {/* </PopoverTrigger>
        <PopoverContent className="w-fit p-2">
          <div className="h-[300px] w-[250px]">
            <AssetBrowser
              className="h-full w-full"
              showNewFolderButton={false}
              onItemClick={handleAssetClick}
            />
          </div>
        </PopoverContent>
      </Popover> */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="gap-1"
            size="sm"
            Icon={Folder}
            iconPlacement="left"
          >
            <span className="hidden lg:block">Models</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-fit p-2">
          <Suspense
            fallback={
              <div className="h-[540px] w-[300px]">
                <div className="flex items-center justify-start gap-2 pb-2 font-semibold">
                  <ModelListHeader />
                </div>
                <div className="flex h-full w-full flex-col gap-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-[18px] w-full" />
                  ))}
                </div>
              </div>
            }
          >
            <ModelListView className="h-[540px] w-[300px]">
              <ModelList
                apiEndpoint={process.env.COMFY_DEPLOY_SHARED_MACHINE_API_URL}
              />
            </ModelListView>
          </Suspense>
        </PopoverContent>
      </Popover>
    </>
  );
}

export function getSessionStatus(session: any, isLive: boolean | undefined) {
  if (!session) {
    return {
      message: "Session Not Found",
      description: "The session may have expired or been terminated.",
      isError: true,
    };
  }

  if (session.timeout_end) {
    const timeoutDate = new Date(session.timeout_end);
    const now = new Date();
    if (now > timeoutDate) {
      return {
        message: "Session Timeout",
        description: `Session timed out at ${timeoutDate.toLocaleTimeString()}`,
        isError: true,
      };
    }
  }

  if (isLive === false) {
    return {
      message: "Connecting",
      description: "Attempting to connect to your session...",
      isError: false,
    };
  }

  if (session.status === "error") {
    return {
      message: "Session Error",
      description: session.error || "An error occurred with your session.",
      isError: true,
    };
  }

  return {
    message: "Warming Up",
    description: "Your session is being prepared. This may take a few moments.",
    isError: false,
  };
}

export function SessionLoading({
  session,
  isLive,
}: { session?: any; isLive?: boolean }) {
  const status = getSessionStatus(session, isLive);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4 p-6">
        <h2 className="flex items-center gap-2 font-semibold">
          {status.message}{" "}
          {!status.isError && (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          )}
        </h2>
        <p className="text-center text-muted-foreground text-xs">
          {status.description}
        </p>
        <LogDisplay />
      </div>
    </div>
  );
}

export function SessionCreator(props: {
  workflowId?: string;
  workflowLatestVersion?: any;
  sessionIdOverride?: string;
}) {
  const { workflow } = useCurrentWorkflow(props.workflowId ?? null);
  const machineId = workflow?.selected_machine_id;

  const { data: machine } = useMachine(machineId);

  const machineBuilderVersion = machine?.machine_builder_version;

  const { cdSetup, setCDSetup } = useCDStore();

  const sessionId = props.sessionIdOverride;

  const { data: session } = useQuery<any>({
    enabled: !!sessionId,
    queryKey: ["session", sessionId],
  });

  const [workflowLink, setWorkflowLink] = useQueryState(
    "workflowLink",
    parseAsString,
  );

  const { data: workflowLinkJson, isFetching } = useQuery({
    queryKey: ["workflowLink", workflowLink],
    queryFn: async () => {
      if (!workflowLink) return;
      console.log("fetching workflowLink", workflowLink);
      const response = await fetch(workflowLink);
      if (!response.ok) throw new Error("Failed to fetch workflow");
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // const session = sessions?.find((session) => session.session_id === sessionId);
  const url = session?.tunnel_url || session?.url;

  useEffect(() => {
    setCDSetup(false);
  }, [sessionId]);

  useLogListener({ sessionId: sessionId || "" });

  // // probably session closed
  // useEffect(() => {
  //   if (sessionId === "preview") {
  //     return;
  //   }
  //   if (sessionId && !session) {
  //     setSessionId("");
  //   }

  //   // if (session) {
  //   //   useGPUStore.getState().setGpuEventId(session.id);
  //   // }
  // }, [session, sessionId]);

  const { data: isLive } = useQuery({
    queryKey: ["session", "live", url],
    queryFn: async ({ queryKey }) => {
      if (!url) return null;
      try {
        const response = await fetch(url, { method: "HEAD" });
        if (!response.ok) throw new Error("Failed to connect");
        return true;
      } catch (e) {
        // Only show toast if we previously had a successful connection
        const prevIsLive = queryKey[3] as boolean | undefined;
        if (prevIsLive) {
          toast.error("Session disconnected");
          setCDSetup(false);
        }
        return false;
      }
    },
    enabled: !!url,
    refetchInterval: 2000,
  });

  if (sessionId === "preview") {
    return (
      <>
        <UploadZone
          className="relative flex h-full w-full"
          iframeEndpoint={staticUrl}
        >
          <div className="flex h-full w-full flex-col">
            <Workspace
              sessionIdOverride={sessionId}
              workflowId={props.workflowId}
              // key={props.workflowId}
              nativeMode={false}
              endpoint={staticUrl}
              workflowJson={props.workflowLatestVersion?.workflow}
            />
            <App endpoint={staticUrl}>
              <div className="flex w-full justify-between gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="mx-2 flex cursor-help items-center gap-1">
                        <span className="text-gray-600 text-sm">
                          Preview Mode
                        </span>
                        <Info className="h-4 w-4 text-gray-400" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>
                        You're currently viewing a edit-only preview of this
                        workflow. To run the workflow, you'll need to create a
                        new ComfyUI session.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Button
                  variant="default"
                  size="sm"
                  className="flex items-center gap-1"
                  Icon={X}
                  iconPlacement="left"
                  onClick={() => {
                    setSessionId("");
                  }}
                >
                  Close Preview
                </Button>

                {/* <Button
                  variant="default"
                  size="sm"
                  className="flex items-center gap-1"
                  Icon={Plus}
                  iconPlacement="left"
                  onClick={() => {
                    setOpen({
                      gpu: (localStorage.getItem("lastGPUSelection") ||
                        "A10G") as (typeof machineGPUOptions)[number],
                      timeout: Number.parseInt(
                        localStorage.getItem("lastTimeoutSelection") || "15",
                      ),
                    });
                  }}
                >
                  Session
                </Button> */}
                {/* <ModelsButton isPreview={true} /> */}
              </div>
            </App>
          </div>
          {/* <AssetsPanel /> */}
        </UploadZone>
      </>
    );
  }

  if (!!props.sessionIdOverride && Number.parseInt(machineBuilderVersion) < 4) {
    return (
      <div className={cn("flex h-full w-full items-center justify-center")}>
        Machine builder version {machineBuilderVersion} is not supported for
        workspace.
      </div>
    );
  }

  if (sessionId) {
    if (!url || !isLive) {
      return <SessionLoading session={session} isLive={isLive} />;
    }

    if (url && isLive) {
      return (
        <>
          <div className="flex h-full w-full flex-col">
            <Workspace
              sessionIdOverride={props.sessionIdOverride}
              workflowId={props.workflowId}
              // key={props.workflowId}
              nativeMode={true}
              endpoint={url}
              workflowJson={
                workflowLinkJson
                  ? workflowLinkJson
                  : props.workflowLatestVersion?.workflow
              }
            />
          </div>
        </>
      );
    }
  }

  return (
    <></>
    // <div className="flex h-full w-full items-center justify-center">
    //   <div className="flex items-center gap-2">
    //     {/* <SidebarMenuButton> */}
    //     <SessionCreate
    //       btnSize="sm"
    //       // workflowId={props.workflowId}
    //       // setSessionId={setSessionId}
    //       btnText="Start ComfyUI"
    //     />
    //     {/* </SidebarMenuButton> */}
    //     {/* <Button
    //       variant="outline"
    //       size="sm"
    //       className="flex flex-row gap-1"
    //       onClick={() => {
    //         setSessionId("preview");
    //       }}
    //     >
    //       Preview Workflow <Eye size={16} />
    //     </Button> */}
    //   </div>
    // </div>
  );
}

function useLogListener({ sessionId }: { sessionId?: string }) {
  const fetchToken = useAuthStore((state) => state.fetchToken);

  useEffect(() => {
    if (!sessionId) return;
    if (sessionId === "preview") return;

    console.log("sessionId", sessionId);

    let eventSource: EventSource;
    let unmounted = false;

    const setupEventSource = async () => {
      const token = await fetchToken();

      if (unmounted) return;

      const url = new URL(
        `${process.env.NEXT_PUBLIC_CD_API_URL}/api/stream-logs`,
      );
      url.searchParams.append("session_id", sessionId);
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

          // console.log("got logs", parsedLogs);

          const log =
            "data:" +
            JSON.stringify({
              timestamp: new Date(data.timestamp).getTime() / 1000,
              logs: data.message,
            });
          // console.log("log", log);

          useLogStore.getState().addLog(log);

          // if (Array.isArray(parsedLogs)) {
          //   setLogs((prevLogs) => [...prevLogs, ...parsedLogs]);
          // } else {
          //   setLogs((prevLogs) => [
          //     ...prevLogs,
          //     {
          //       timestamp: data.timestamp,
          //       logs: JSON.stringify(parsedLogs),
          //     },
          //   ]);
          //   // console.error("Parsed message is not an array:", parsedLogs);
          // }
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
  }, [sessionId, fetchToken]); // Added runId to the dependency array
}
