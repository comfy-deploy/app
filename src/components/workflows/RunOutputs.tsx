"use client";

import { OutputRender } from "@/components/output-render";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-blocks";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LogDialog } from "@/components/workflows/LogDialog";
import { StatusBadge } from "@/components/workflows/StatusBadge";
import { ExternalLink } from "lucide-react";

import { z } from "zod";

import { formatFileSize } from "@/lib/utils";

export const WorkflowNodeSchema = z.object({
  id: z.string(),
  time: z.number(),
  vram_used: z.number(),
  class_type: z.string(),
});

export const WorkflowNodesSchema = z.array(WorkflowNodeSchema);

export function WorkflowExecutionGraph({
  run,
}: { run: z.infer<typeof WorkflowNodesSchema> }) {
  return (
    <Table className="text-xs">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">ID</TableHead>
          <TableHead className="w-[200px]">Node</TableHead>
          <TableHead className="w-[100px] text-right">Time</TableHead>
          <TableHead className="w-[100px] text-right">VRAM</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {run.map((node) => (
          <TableRow key={node.id}>
            <TableCell className="font-medium text-muted-foreground">
              {node.id}
            </TableCell>
            <TableCell className="font-medium">
              <Badge>{node.class_type}</Badge>
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
              {node.time.toFixed(2)}
            </TableCell>
            <TableCell className="text-ellipsis whitespace-nowrap text-right text-muted-foreground">
              {formatFileSize(node.vram_used)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>Total</TableCell>
          <TableCell className="text-right">
            {run.reduce((acc, node) => acc + node.time, 0).toFixed(2)}
          </TableCell>
          <TableCell />
        </TableRow>
      </TableFooter>
    </Table>
  );
}

export function RunOutputs({ run }: { run: any }) {
  const id = run.id;

  const data = "outputs" in run ? run.outputs : undefined;

  if (!data) {
    return <div>No outputs available</div>;
  }

  return (
    <Table className="table-fixed">
      <TableHeader className="sticky top-0">
        <TableRow>
          <TableHead className="w-[200px]">File</TableHead>
          <TableHead className="">Output</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {run.webhook_status && (
          <TableRow>
            <TableCell>Webhook Status</TableCell>
            <TableCell className="">
              <StatusBadge status={run.webhook_status} />
            </TableCell>
          </TableRow>
        )}
        {run.run_log ? (
          <TableRow key={run.id}>
            <TableCell className="break-words">Run log</TableCell>
            <TableCell>
              <LogDialog run={run}>
                <Button variant="secondary" className="w-fit">
                  View Log <ExternalLink size={14} />
                </Button>
              </LogDialog>
            </TableCell>
          </TableRow>
        ) : (
          <></>
        )}

        {data?.map((run: any) => {
          const files = [
            ...(run.data.images || []),
            ...(run.data.files || []),
            ...(run.data.gifs || []),
            ...(run.data.mesh || []),

            // for klingAI video outputs
            ...(run.data.video_url || []),
          ];

          if (files.length === 0) {
            const parseResult = WorkflowNodesSchema.safeParse(run.data);
            if (parseResult.success) {
              return <></>;
              // return (
              //   <TableRow key={run.id}>
              //     <TableCell className="" colSpan={2}>
              //       <span className="font-medium">Execution Graph</span>
              //       <WorkflowExecutionGraph run={parseResult.data} />
              //     </TableCell>
              //   </TableRow>
              // );
            }

            return (
              <TableRow key={run.id}>
                <TableCell>
                  Output
                  {run.node_meta && (
                    <Badge>
                      {run.node_meta.node_class} - {run.node_meta.node_id}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="">
                  <CodeBlock
                    code={JSON.stringify(run.data, null, 2)}
                    lang="json"
                  />
                </TableCell>
              </TableRow>
            );
          }

          return files.map((file, index) => {
            return (
              <TableRow key={`${run.id}-${index}`}>
                <TableCell className="break-words">
                  {file.filename}
                  {run.node_meta && (
                    <Badge>
                      {run.node_meta.node_class} - {run.node_meta.node_id}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {typeof file === "string" ? (
                    <OutputRender url={file} />
                  ) : (
                    <OutputRender url={file.url} />
                  )}
                </TableCell>
              </TableRow>
            );
          });
        })}
      </TableBody>
    </Table>
  );
}
