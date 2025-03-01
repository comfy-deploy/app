"use client";

import TextWithTooltip from "@/components/custom/text-with-tooltip";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useCurrentWorkflow } from "@/hooks/use-current-workflow";
import { useMachine } from "@/hooks/use-machine";
import { useUserInfo } from "@/hooks/use-user-info";
import { api } from "@/lib/api";
import { UTCDate } from "@date-fns/utc";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { format, formatDistanceToNow } from "date-fns";
import { Check, Minus, X } from "lucide-react";
import { LoadingIcon } from "../ui/custom/loading-icon";
import { Skeleton } from "../ui/skeleton";
import type { ColumnSchema } from "./schema";

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
          className="max-w-[85px] font-mono text-[11px]"
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
      const utcDate = new Date(row.getValue("created_at"));
      const localDate = new Date(
        utcDate.getTime() - utcDate.getTimezoneOffset() * 60000,
      );

      return (
        <HoverCard openDelay={0} closeDelay={0}>
          <HoverCardTrigger asChild>
            <div className="whitespace-nowrap">
              {formatDistanceToNow(localDate, { addSuffix: true })}
            </div>
          </HoverCardTrigger>
          <HoverCardContent
            side="right"
            align="start"
            alignOffset={-4}
            className="z-10 w-auto p-2"
          >
            <dl className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-4 text-sm">
                <dt className="text-muted-foreground text-xs">Timestamp</dt>
                <dd className="truncate font-mono text-xs">
                  {localDate.getTime()}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <dt className="text-muted-foreground text-xs">UTC</dt>
                <dd className="truncate font-mono text-xs">
                  {format(new UTCDate(localDate), "LLL dd, y HH:mm:ss")}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <dt className="text-muted-foreground text-xs">{timezone}</dt>
                <dd className="truncate font-mono text-xs">
                  {format(localDate, "LLL dd, y HH:mm:ss")}
                </dd>
              </div>
            </dl>
          </HoverCardContent>
        </HoverCard>
      );
    },
    filterFn: "inDateRange",
    meta: {
      headerClassName: "h-5 text-xs max-w-[100px] text-muted-foreground",
    },
  },
  {
    accessorKey: "user",
    header: "User",
    accessorFn: (row) => row.user_id,
    cell: ({ row }) => {
      const value = row.getValue("user") as string;
      const { data: user, isLoading } = useUserInfo(value);

      if (isLoading) return <Skeleton className="h-5 w-20" />;

      if (!user) return null;

      return (
        <div className="flex items-center gap-3">
          <img
            src={user?.image_url ? user.image_url : ""}
            alt={`${user.first_name}'s avatar`}
            className="h-[20px] w-[20px] rounded-full"
          />
          <span className="text-muted-foreground">
            {user.username ?? `${user.first_name} ${user.last_name}`}
          </span>
        </div>
      );
    },
    meta: {
      headerClassName: "h-5 text-xs max-w-[100px] text-muted-foreground",
    },
  },
  {
    accessorKey: "machine_id",
    header: "Machine",
    accessorFn: (row) => row.machine_id,
    cell: ({ row }) => {
      const value = row.getValue("machine_id") as string;
      const { data: machine, isLoading } = useMachine(value);

      if (isLoading) return <Skeleton className="h-5 w-20" />;

      if (!machine) return null;

      return <TextWithTooltip className="max-w-[200px]" text={machine.name} />;
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
    accessorKey: "workflow_id",
    header: "Workflow Name",
    accessorFn: (row) => row.workflow_id,
    cell: ({ row }) => {
      const value = row.getValue("workflow_id") as string;
      const { workflow, isLoading } = useCurrentWorkflow(value);

      if (isLoading) return <Skeleton className="h-5 w-20" />;

      if (!workflow) return null;

      return <TextWithTooltip className="max-w-[200px]" text={workflow.name} />;
    },
    meta: {
      headerClassName: "h-5 text-xs max-w-[120px]",
    },
  },
  {
    accessorKey: "version",
    header: "Workflow Version",
    accessorFn: (row) => row.workflow_version_id,
    cell: ({ row }) => {
      const value = row.getValue("version") as string;
      const { data: version, isLoading } = useQuery({
        queryKey: ["workflow-version", value],
        queryFn: async ({ queryKey }) => {
          const response = await api({ url: queryKey.join("/") });
          return response;
        },
      });

      if (isLoading) return <Skeleton className="h-5 w-20" />;

      if (!version) return null;

      if (!version.version) return "-";

      return <Badge variant={"outline"}>{`v${version.version}`}</Badge>;
    },
    meta: {
      headerClassName: "h-5 text-xs max-w-[60px]",
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    filterFn: "arrIncludesSome",
    cell: ({ row }) => {
      const value = row.getValue("status") as string;

      switch (value) {
        case "success":
          return (
            <Badge variant={"green"}>
              <Check className="h-3 w-3" />
              <span className="leading-snug">{value}</span>
            </Badge>
          );
        case "failed":
          return (
            <Badge variant={"destructive"}>
              <X className="h-3 w-3" />
              <span className="leading-snug">{value}</span>
            </Badge>
          );
        case "cancelled":
        case "timeout":
          return (
            <Badge variant={"secondary"}>
              <Minus className="h-3 w-3" />
              <span className="text-muted-foreground leading-snug">
                {value}
              </span>
            </Badge>
          );
        default:
          return (
            <Badge variant={"yellow"}>
              <LoadingIcon className="h-3 w-3" />
              <span className="leading-snug">{value}</span>
            </Badge>
          );
      }
    },
    meta: {
      headerClassName: "h-5 text-xs",
    },
  },
  {
    id: "duration",
    accessorFn: (row) => row.duration,
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
