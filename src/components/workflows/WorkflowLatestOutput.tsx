import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "../../lib/utils";
import { FileURLRender } from "./OutputRender";

export function WorkflowLatestOutput({
  workflow,
  className,
}: {
  workflow: any;
  className?: string;
}) {
  const { data: latest_runs } = useQuery<any[]>({
    queryKey: ["workflow", workflow.id, "run", "latest"],
    queryKeyHashFn: (queryKey) => [...queryKey, "latest"].toString(),
  });

  const latest_output = latest_runs?.[0]?.outputs?.[0]?.data;
  const lastest_run_at = latest_runs?.[0]?.created_at;
  const status = latest_runs?.[0]?.status;
  
  const findVideoFile = (output: any) => {
    if (!output?.files) return null;
    return output.files.find((f: any) => f.filename?.endsWith('.mp4') || f.filename?.endsWith('.webm'));
  };
  
  const videoFile = latest_output ? findVideoFile(latest_output) : null;
  
  return (
    <>
      {latest_output?.images?.[0]?.url || videoFile?.url ? (
        <FileURLRender
          url={latest_output?.images?.[0]?.url || videoFile?.url}
          imgClasses={cn("w-full h-full rounded-[8px] object-cover", className)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted rounded-[8px]">
          <span className="text-muted-foreground text-sm">No preview</span>
        </div>
      )}
    </>
  );
}
