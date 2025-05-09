import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { EventSourcePolyfill } from "event-source-polyfill";
import { convertDateFields } from "@/lib/api";
import { toast } from "sonner";
import { throttle } from "lodash";

export interface ProgressUpdate {
  run_id: string;
  workflow_id: string;
  machine_id: string;
  progress: number;
  status: string;
  node_class: string;
  timestamp: string;
}

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export function useProgressUpdates({
  runId,
  workflowId,
  machineId,
  onUpdate,
  returnRun,
  fromStart,
  reconnect,

  status,
  deploymentId,
}: {
  runId?: string;
  workflowId?: string;
  machineId?: string;
  onUpdate?: (update: ProgressUpdate) => void;
  returnRun?: boolean;
  fromStart?: boolean;
  reconnect?: boolean;

  status?: string;
  deploymentId?: string;
}) {
  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([]);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("connecting");
  const fetchToken = useAuthStore((state) => state.fetchToken);
  
  const throttledSetProgressUpdates = useRef(
    throttle((update: ProgressUpdate) => {
      setProgressUpdates((prevUpdates) => [...prevUpdates, update]);
    }, 500) // Throttle to update at most every 500ms
  ).current;

  useEffect(() => {
    // Clear the timeline when runId changes
    setProgressUpdates([]);

    let eventSource: EventSource;
    let unmounted = false;
    let retryCount = 0;
    const maxRetries = 5;
    const retryDelay = 3000; // 3 seconds

    const setupEventSource = async () => {
      setConnectionStatus("connecting");
      const token = await fetchToken();

      if (unmounted) return;

      const url = new URL(
        `${process.env.NEXT_PUBLIC_CD_API_URL}/api/stream-progress`,
      );
      if (runId) {
        url.searchParams.append("run_id", runId);
      }
      if (workflowId) {
        url.searchParams.append("workflow_id", workflowId);
      }
      if (machineId) {
        url.searchParams.append("machine_id", machineId);
      }
      if (returnRun) {
        url.searchParams.append("return_run", "true");
      }
      if (fromStart) {
        url.searchParams.append("from_start", "true");
      }

      if (status) {
        url.searchParams.append("status", status);
      }
      if (deploymentId) {
        url.searchParams.append("deployment_id", deploymentId);
      }

      eventSource = new EventSourcePolyfill(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }) as unknown as EventSource;

      eventSource.onmessage = (event) => {
        let data = JSON.parse(event.data);
        data = convertDateFields(data);
        if (data.type === "keepalive") {
          return;
        }
        console.log("Progress update:", data);
        if (onUpdate) {
          onUpdate(data);
        }
        throttledSetProgressUpdates(data);
        setConnectionStatus("connected");
      };

      eventSource.onerror = (event) => {
        console.error("EventSource failed:", event);
        eventSource.close();
        setConnectionStatus("error");

        if (reconnect) {
          if (retryCount < maxRetries && !unmounted) {
            retryCount++;
            console.log(
              `Attempting to reconnect (${retryCount}/${maxRetries})...`,
            );
            toast.info(
              `Attempting to reconnect (${retryCount}/${maxRetries})...`,
            );
            setTimeout(setupEventSource, retryDelay);
          } else if (retryCount >= maxRetries) {
            console.error("Max retries reached. Giving up on reconnection.");
          }
        }
      };

      eventSource.onopen = () => {
        console.log("EventSource connection opened");
        setConnectionStatus("connected");
        retryCount = 0; // Reset retry count on successful connection
      };
    };

    setupEventSource();

    return () => {
      unmounted = true;
      if (eventSource) {
        eventSource.close();
      }
      throttledSetProgressUpdates.cancel(); // Cancel any pending throttled calls
      setConnectionStatus("disconnected");
    };
  }, [runId, workflowId, machineId, fetchToken]);

  return { progressUpdates, connectionStatus };
}
