"use client";

import { useCurrentWorkflow } from "@/hooks/use-current-workflow";
import { useMachine } from "@/hooks/use-machine";
import { useAuthStore } from "@/lib/auth-store";
import { EventSourcePolyfill } from "event-source-polyfill";
import { Loader2 } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { Suspense, useEffect } from "react";
import { toast } from "sonner";
import { useLogStore } from "./LogContext";
import { LogDisplay } from "./LogDisplay";
import Workspace from "./Workspace";
import { useCDStore } from "./Workspace";
import { useQuery } from "@tanstack/react-query";
import { sendWorkflow } from "./sendEventToCD";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { LoadingIcon } from "../ui/custom/loading-icon";

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
  const { cdSetup, setCDSetup } = useCDStore();

  const sessionId = props.sessionIdOverride;

  const { data: session } = useQuery<any>({
    enabled: !!sessionId,
    queryKey: ["session", sessionId],
  });

  const { workflow, isLoading: isLoadingWorkflow } = useCurrentWorkflow(
    props.workflowId ?? null,
  );

  const { data: machine, isLoading } = useMachine(
    workflow?.selected_machine_id,
  );

  const [workflowLink, setWorkflowLink] = useQueryState(
    "workflowLink",
    parseAsString,
  );

  const { data: workflowLinkJson, isFetching } = useQuery({
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
  });

  useEffect(() => {
    if (!cdSetup) return;
    if (!workflowLinkJson) return;

    console.log("sending workflow", workflowLinkJson);
    sendWorkflow(workflowLinkJson);
  }, [workflowLinkJson, cdSetup]);

  const url = session?.tunnel_url || session?.url;

  useEffect(() => {
    setCDSetup(false);
  }, [sessionId]);

  useLogListener({ sessionId: sessionId || "" });

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

  if (isLoadingWorkflow || isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <LoadingIcon />
      </div>
    );
  }

  if (!sessionId)
    return (
      <div className="flex h-full w-full items-center justify-center">
        Machine builder version{" "}
        <Badge className="mx-2">{machine?.machine_builder_version}</Badge> and{" "}
        <Badge className="mx-2">{machine?.type}</Badge> is not supported for
        workflow preview.
      </div>
    );

  if (!url || !isLive) {
    return <SessionLoading session={session} isLive={isLive ?? false} />;
  }

  if (url && isLive) {
    return (
      <>
        <div className="flex h-full w-full flex-col">
          <Workspace
            sessionIdOverride={props.sessionIdOverride}
            workflowId={props.workflowId}
            nativeMode={true}
            endpoint={url}
            workflowJson={props.workflowLatestVersion?.workflow}
          />
        </div>
      </>
    );
  }
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
