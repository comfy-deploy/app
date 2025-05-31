import { useCurrentWorkflow } from "@/hooks/use-current-workflow";
import { useMachine } from "@/hooks/use-machine";
import { useAuthStore } from "@/lib/auth-store";
import { EventSourcePolyfill } from "event-source-polyfill";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLogStore } from "./LogContext";
import { LogDisplay } from "./LogDisplay";
import Workspace, { useWorspaceLoadingState } from "./Workspace";
import { useCDStore } from "./Workspace";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "../ui/badge";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Button } from "../ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { WorkspaceLoading } from "./WorkspaceLoading";
import { useWorkflowIdInSessionView } from "@/hooks/hook";

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
  isLoadingSession,
}: {
  session?: any;
  isLive?: boolean;
  isLoadingSession?: boolean;
}) {
  const status = getSessionStatus(session, isLive);
  const now = new Date();
  const isTimeout = now > new Date(session?.timeout_end);
  const navigate = useNavigate();
  const workflowId = useWorkflowIdInSessionView();

  if (isLoadingSession) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center dark">
        <div className="flex flex-col items-center gap-4 p-6">
          <h2 className="flex items-center gap-2 font-semibold text-gray-100">
            Loading Session{" "}
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </h2>
          <p className="text-center text-muted-foreground text-xs">
            Please wait while we load your session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center dark">
      <div className="text-gray-100 flex flex-col items-center gap-4 p-6">
        <h2 className="flex items-center gap-2 font-semibold">
          {status.message}{" "}
          {!status.isError && (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          )}
        </h2>
        <p className="text-center text-muted-foreground text-xs">
          {status.description}
        </p>

        {!session || isTimeout ? (
          <Button
            variant="outline"
            onClick={() => {
              if (workflowId) {
                navigate({
                  to: "/workflows/$workflowId/$view",
                  params: { workflowId, view: "requests" },
                });
              } else {
                navigate({
                  to: "/home",
                });
              }
            }}
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        ) : (
          <LogDisplay newInterface={true} />
        )}
      </div>
    </div>
  );
}

const NoSessionId = ({ workflowId }: { workflowId?: string }) => {
  const { workflow } = useCurrentWorkflow(workflowId ?? null);

  const { data: machine } = useMachine(workflow?.machine_id);

  return (
    <div className="flex h-full w-full items-center justify-center">
      Machine builder version{" "}
      <Badge className="mx-2">{machine?.machine_builder_version}</Badge> and{" "}
      <Badge className="mx-2">{machine?.type}</Badge> is not supported for
      workflow preview.
    </div>
  );
};

export function SessionCreator(props: {
  workflowId?: string;
  workflowLatestVersion?: any;
  sessionIdOverride?: string;
}) {
  const { cdSetup, setCDSetup } = useCDStore();
  const [hasInitiallyConnected, setHasInitiallyConnected] = useState(false);
  const sessionId = props.sessionIdOverride;

  const {
    data: session,
    isLoading: isLoadingSession,
    isError,
  } = useQuery<any>({
    enabled: !!sessionId,
    queryKey: ["session", sessionId],
    refetchInterval: (data) => (data ? 1000 : false),
  });

  const url = session?.url || session?.tunnel_url;

  const { progress, setProgress } = useWorspaceLoadingState();

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

        // Set hasInitiallyConnected to true on first successful connection
        if (!hasInitiallyConnected) {
          setHasInitiallyConnected(true);
        }
        return true;
      } catch (e) {
        // Only show toast if we previously had a successful connection
        const prevIsLive = queryKey[3] as boolean | undefined;
        if (prevIsLive) {
          toast.error("Session disconnected");
          // Don't reset cdSetup here anymore
          // setCDSetup(false);
        }
        return false;
      }
    },
    enabled: !!url && !hasInitiallyConnected, // Only run the query until we get first connection
    refetchInterval: 1000,
  });

  // Reset hasInitiallyConnected when session changes
  useEffect(() => {
    setHasInitiallyConnected(false);
  }, [sessionId]);

  useEffect(() => {
    // When session id changed
    if (sessionId) {
      setProgress(0);
    }
  }, [sessionId]);

  if (!sessionId) return <NoSessionId workflowId={props.workflowId} />;

  // if ()

  if (!session || isError) {
    return (
      <SessionLoading
        session={session}
        isLive={isLive ?? false}
        // isLoadingSession={isLoadingSession}
      />
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <AnimatePresence>
        {!cdSetup && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[20]"
          >
            <WorkspaceLoading
              messages={[
                { message: "Connecting to ComfyUI", startProgress: 0 },
                { message: "Loading workspace", startProgress: 59 },
              ]}
              progress={progress}
              session={session}
              isLive={isLive ?? false}
              isLoadingSession={isLoadingSession}
              workflowId={props.workflowId}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {url && (hasInitiallyConnected || isLive) && (
        <Workspace
          sessionIdOverride={props.sessionIdOverride}
          nativeMode={true}
          endpoint={url}
          gpu={session?.gpu}
          machine_id={session?.machine_id}
          machine_version_id={session?.machine_version_id}
        />
      )}
    </div>
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
