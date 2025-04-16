"use client";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StatusBadge } from "@/components/workflows/StatusBadge";
import { Timer } from "@/components/workflows/Timer";
import { getDuration } from "@/lib/get-relative-time";
import { Zap } from "lucide-react";

interface TimerProps {
  run: any;
  startTime?: number;
  time?: number;
  variant?: BadgeProps["variant"];
}

function ShowTimerWhenDurationIsEmpty({
  run,
  startTime,
  time,
  variant = "cyan",
}: TimerProps) {
  if (time) {
    return (
      <Badge variant={variant} className="px-2 py-0">
        {getDuration(time)}
      </Badge>
    );
  }

  if (["success", "failed", "timeout", "cancelled"].includes(run.status)) {
    return <>N/A</>;
  }

  return (
    <Badge variant={variant} className="px-2 py-0">
      <Timer start={startTime!} relative />
    </Badge>
  );
}

interface RunDurationProps {
  run: any;
  liveStatus: React.ReactNode;
  status: string;
  realtimeStatus: React.ReactNode;
  showTotalDuration?: boolean;
}

export function RunDuration({
  run,
  liveStatus,
  showTotalDuration,
}: RunDurationProps) {
  const durationDisplay = getDuration(run.run_duration);

  const isWarm =
    run.started_at !== undefined &&
    (run.cold_start_duration === undefined || run.cold_start_duration <= 5);

  const { workflow_api, workflow_inputs, run_log, status, ...rest } = run;

  const parseDateIfString = (
    date: Date | string | undefined,
  ): Date | undefined =>
    date && typeof date === "string"
      ? new Date(date)
      : (date as Date | undefined);

  const started_at = run.started_at
    ? parseDateIfString(run.started_at ?? "")
    : undefined;
  const queued_at = run.queued_at
    ? parseDateIfString(run.queued_at ?? "")
    : undefined;
  const created_at = parseDateIfString(run.created_at ?? "");

  const createBadge = (
    key: string,
    startTime?: number,
    time?: number,
    variant?: BadgeProps["variant"],
  ) => (
    <ShowTimerWhenDurationIsEmpty
      key={`${key}-${run.id}`}
      run={run}
      startTime={startTime}
      time={time}
      variant={variant}
    />
  );

  const queueTimeBadge = createBadge(
    "queue-time",
    created_at?.getTime(),
    run.comfy_deploy_cold_start,
    "orange",
  );
  // let coldStartBadge = undefined;
  const coldStartBadge =
    run.comfy_deploy_cold_start !== undefined && queued_at != null
      ? createBadge(
          "cold-start",
          queued_at?.getTime(),
          run.cold_start_duration,
          "lime",
        )
      : undefined;
  const runDurationBadge =
    run.cold_start_duration !== undefined && started_at != null
      ? createBadge(
          "run-duration",
          started_at?.getTime(),
          run.run_duration,
          "green",
        )
      : undefined;

  if (status === "not-started") {
    return (
      <div className="flex justify-between gap-2 truncate">
        <div className="flex items-center gap-2 text-2xs">
          <StatusBadge status={run.status} mini={true} />
        </div>
      </div>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger className="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-zinc-600/40">
        <div className="flex justify-between gap-2 truncate">
          <div className="flex items-center gap-2 text-2xs">
            {run.machine_type !== "comfy-deploy-serverless" ||
            showTotalDuration ? (
              createBadge(
                "normal",
                created_at?.getTime(),
                run.duration,
                "purple",
              )
            ) : durationDisplay.length > 0 ? (
              <div className="flex items-center gap-1">
                {durationDisplay}
                {isWarm && <Zap size={14} />}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                {runDurationBadge ?? coldStartBadge ?? queueTimeBadge}
              </div>
            )}
            <StatusBadge status={run.status} mini={true} />
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent
        className="flex flex-col gap-1 p-2"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        {isWarm && (
          <>
            <Badge className="w-fit" variant="orange">
              Warm container
            </Badge>
            <Separator />
          </>
        )}
        {liveStatus}
        <div>Queue time: {queueTimeBadge}</div>
        <div>ComfyUI cold start: {coldStartBadge}</div>
        <div>Run duration: {runDurationBadge}</div>
        <div>Total: {getDuration(run.duration)}</div>

        {process.env.NODE_ENV !== "production" && (
          <div className="h-[200px]">
            <ScrollArea className="h-full w-full">
              <pre className="h-fit whitespace-pre-wrap">
                {JSON.stringify(rest, null, 2)}
              </pre>
            </ScrollArea>
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
