"use client";

import { ErrorBoundary } from "@/components/error-boundary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RunDuration } from "@/components/workflows/RunDuration";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/lib/api";
import { getDuration } from "@/lib/get-relative-time";
// import { cancelFunction } from "@/server/curdMachine";
import { CircleX, Zap } from "lucide-react";
import { type ReactNode, useCallback, useMemo } from "react";
import { toast } from "sonner";

export function LiveStatus({
  run,
  minimal = false,
  isForRunPage = false,
  refetch,
}: {
  run: any;
  minimal?: boolean;
  isForRunPage?: boolean;
  refetch?: () => void;
}) {
  const { workflow_api, workflow_inputs, run_log, ...rest } = run;

  const { status, liveStatus, realtimeStatus, canBeCancelled, ended } =
    useMemo(() => {
      const status = run.status;
      let liveStatus: ReactNode = null;
      const realtimeStatus: ReactNode = run.live_status
        ?.replace("Executing", "")
        .trim();

      if (status !== "success" && !run.is_realtime) {
        liveStatus = realtimeStatus;
      }

      if (run.is_realtime) {
        liveStatus = (
          <div className="flex items-center gap-2 text-sm">
            Realtime <Zap size={14} />
          </div>
        );
      }

      const ended = ["success", "failed", "timeout", "cancelled"].includes(
        run.status,
      );

      const canBeCancelled =
        run.machine_type === "comfy-deploy-serverless" &&
        !ended &&
        run.modal_function_call_id;

      return { status, liveStatus, realtimeStatus, canBeCancelled, ended };
    }, [run]);

  const handleCancel = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (run.modal_function_call_id) {
        try {
          const res = await api({
            url: `run/${run.id}/cancel`,
            init: {
              method: "POST",
              body: JSON.stringify({
                function_id: run.modal_function_call_id,
              }),
            },
          });

          toast.success(res.message);
          refetch?.();
        } catch (error: any) {
          toast.error(`Failed to cancel: ${error.message}`);
        }
      }
    },
    [run.id, run.modal_function_call_id, refetch],
  );

  if (isForRunPage) {
    return (
      <div className="flex w-full flex-col p-4">
        <div className="col-span-2 flex-col items-start gap-2 text-2xs">
          {!ended && realtimeStatus && (
            <>
              <p className="flex justify-center">{liveStatus}</p>
              <Progress value={run.progress * 100} className="w-full" />
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          <ErrorBoundary fallback={(error) => <div>{error.message}</div>}>
            <RunDuration
              run={run}
              liveStatus={liveStatus}
              status={status}
              realtimeStatus={realtimeStatus}
            />
          </ErrorBoundary>
          {/* <div className="overflow-hidden text-ellipsis whitespace-nowrap text-2xs">
            {!ended &&
              !liveStatus &&
              run.machine_type === "comfy-deploy-serverless" &&
              (run.queued_at !== undefined ? (
                <Badge>Cold Starting</Badge>
              ) : (
                <Badge>In Queue</Badge>
              ))}
          </div> */}
        </div>
        {/* <div className="flex justify-end items-center col-span-3 space-x-2">
          <div className="flex items-start flex-col">
            <div className="text-2xs text-ellipsis whitespace-nowrap overflow-hidden">
              {!ended &&
                !liveStatus &&
                (run.queued_at != undefined ? (
                  <Badge>Cold Starting</Badge>
                ) : (
                  <Badge>In Queue</Badge>
                ))}
            </div>
          </div>
        </div> */}
        {canBeCancelled && (
          <div className="flex justify-center">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCancel}
              className="h-8 rounded-[10px] px-2 py-1 text-2xs"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ended = false;
  // realtimeStatus = "Executing";
  // liveStatus = "Executing";

  return (
    <>
      {!ended && realtimeStatus && (
        <div className="col-span-2 w-full max-w-[260px] flex-col items-start gap-1 text-2xs">
          {liveStatus}
          <Progress
            value={run.progress * 100}
            className="w-full max-w-[260px]"
          />
        </div>
      )}
      <div className="col-span-3 flex items-center justify-end space-x-2">
        {/* <div className="flex flex-col items-start">
          <div className="overflow-hidden text-ellipsis whitespace-nowrap text-2xs">
            {!ended &&
              !liveStatus &&
              run.machine_type === "comfy-deploy-serverless" &&
              (run.queued_at !== undefined ? (
                <Badge className="text-2xs">Cold Starting</Badge>
              ) : (
                <Badge className="text-2xs">In Queue</Badge>
              ))}
          </div>
        </div> */}
        <ErrorBoundary
          fallback={(error) => (
            <Tooltip>
              <TooltipTrigger className=" rounded-md p-1 hover:bg-gray-100">
                <CircleX className="text-red-500" />
              </TooltipTrigger>
              <TooltipContent
                className="flex flex-col gap-1 p-2"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              >
                <h1 className="font-bold text-lg">Error</h1>
                <h3>{error.message}</h3>
                {liveStatus}
                <div>Total: {getDuration(run.duration)}</div>

                <div className="h-[200px]">
                  <ScrollArea className="h-full w-full">
                    <pre className="h-fit whitespace-pre-wrap">
                      {JSON.stringify(rest, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        >
          <RunDuration
            run={run}
            liveStatus={liveStatus}
            status={status}
            realtimeStatus={realtimeStatus}
          />
        </ErrorBoundary>
        {canBeCancelled && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="h-6 rounded-[10px] px-2 py-1 text-2xs"
          >
            Cancel
          </Button>
        )}
      </div>
    </>
  );
}
