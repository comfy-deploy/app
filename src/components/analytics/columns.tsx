"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { ColumnSchema } from "./schema";
import { format, formatDistanceToNow } from "date-fns";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import TextWithTooltip from "@/components/custom/text-with-tooltip";
import { UTCDate } from "@date-fns/utc";
import { Badge } from "@/components/ui/badge";

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const columns: ColumnDef<ColumnSchema>[] = [
  {
    id: "id",
    accessorKey: "id",
    header: "",
    cell: ({ row }) => {
      const value = row.getValue("id") as string;
      return (
        <TextWithTooltip
          className="font-mono text-[11px] max-w-[85px]"
          text={value}
        />
      );
    },
    meta: {
      label: "ID",
      headerClassName: "h-5",
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" className="text-xs" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return (
        <HoverCard openDelay={0} closeDelay={0}>
          <HoverCardTrigger asChild>
            <div className="whitespace-nowrap">
              {formatDistanceToNow(date, { addSuffix: true })}
            </div>
          </HoverCardTrigger>
          <HoverCardContent
            side="right"
            align="start"
            alignOffset={-4}
            className="p-2 w-auto z-10"
          >
            <dl className="flex flex-col gap-1">
              <div className="flex gap-4 text-sm justify-between items-center">
                <dt className="text-muted-foreground text-xs">Timestamp</dt>
                <dd className="font-mono truncate text-xs">{date.getTime()}</dd>
              </div>
              <div className="flex gap-4 text-sm justify-between items-center">
                <dt className="text-muted-foreground text-xs">UTC</dt>
                <dd className="font-mono truncate text-xs">
                  {format(new UTCDate(date), "LLL dd, y HH:mm:ss")}
                </dd>
              </div>
              <div className="flex gap-4 text-sm justify-between items-center">
                <dt className="text-muted-foreground text-xs">{timezone}</dt>
                <dd className="font-mono truncate text-xs">
                  {format(date, "LLL dd, y HH:mm:ss")}
                </dd>
              </div>
            </dl>
          </HoverCardContent>
        </HoverCard>
      );
    },
    filterFn: "inDateRange",
    meta: {
      headerClassName: "h-5 text-xs max-w-[100px]",
    },
  },
  {
    accessorKey: "machine",
    header: "Machine",
    accessorFn: (row) => row.machine.name,
    cell: ({ row }) => {
      const value = row.getValue("machine") as string;
      return <TextWithTooltip className="max-w-[200px]" text={value} />;
    },
    meta: {
      headerClassName: "h-5 text-xs",
    },
  },
  {
    accessorKey: "gpu",
    header: "GPU",
    filterFn: "arrIncludesSome",
    cell: ({ row }) => {
      const value = row.getValue("gpu") as string;
      return <Badge variant={"secondary"}>{value}</Badge>;
    },
    meta: {
      headerClassName: "h-5 text-xs",
    },
  },
  {
    accessorKey: "origin",
    header: "Origin",
    filterFn: "arrIncludesSome",
    cell: ({ row }) => {
      const value = row.getValue("origin") as string;
      return <TextWithTooltip className="max-w-[120px]" text={value} />;
    },
    meta: {
      headerClassName: "h-5 text-xs",
    },
  },
  {
    accessorKey: "workflow name",
    header: "Workflow Name",
    accessorFn: (row) => row.workflow?.name,
    cell: ({ row }) => {
      const value = row.getValue("workflow name") as string;
      return <TextWithTooltip className="max-w-[200px]" text={value} />;
    },
    meta: {
      headerClassName: "h-5 text-xs",
    },
  },
  {
    accessorKey: "version",
    header: "Workflow Version",
    accessorFn: (row) => row.workflow_version,
    cell: ({ row }) => {
      const value = row.getValue("version") as string;
      return <Badge variant={"outline"}>{`v${value}`}</Badge>;
    },
    meta: {
      headerClassName: "h-5 text-xs",
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    filterFn: "arrIncludesSome",
    cell: ({ row }) => {
      const value = row.getValue("status") as string;
      return <TextWithTooltip className="max-w-[120px]" text={value} />;
    },
    meta: {
      headerClassName: "h-5 text-xs",
    },
  },
  {
    accessorKey: "workflow_id",
    header: "Workflow ID",
    accessorFn: (row) => row.workflow?.id,
    cell: ({ row }) => {
      const value = row.getValue("workflow_id") as string;
      return <TextWithTooltip className="max-w-[200px]" text={value} />;
    },
    meta: {
      headerClassName: "h-5 text-xs",
    },
  },
  {
    id: "duration",
    accessorFn: (row) => row["duration"],
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Duration"
        className="text-xs"
      />
    ),
    cell: ({ row }) => {
      const value = row.getValue("duration");
      if (!value || typeof value !== "string") return "-";
      return (
        <TextWithTooltip
          className="max-w-[100px]"
          text={`${Number(value).toFixed(1)} secs`}
        />
      );
    },
    filterFn: "inNumberRange",
    meta: {
      label: "Duration",
      headerClassName: "h-5 text-xs",
    },
  },
];
