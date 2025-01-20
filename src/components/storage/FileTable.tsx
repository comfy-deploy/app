"use client";

import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@tanstack/react-router";
// import type { EnhancedFileEntry } from "@/server/volume";
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, FileIcon, FolderIcon, Slash } from "lucide-react";
import React from "react";

export function StorageBreadCrumb({ path }: { path: string }) {
  const pathSegments = path.split("/").filter(Boolean);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem key="base">
          <BreadcrumbLink href="/storage">Storage</BreadcrumbLink>
        </BreadcrumbItem>
        {pathSegments.map((segment, index) => (
          <>
            <BreadcrumbSeparator>
              <Slash className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem key={`item-${index}`}>
              <BreadcrumbLink
                href={`/storage/${pathSegments.slice(0, index + 1).join("/")}`}
              >
                {segment}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export const columns: ColumnDef<EnhancedFileEntry>[] = [
  {
    accessorKey: "type",
    header: () => null,
    cell: ({ row }) => {
      return (
        <div className="pl-2">
          {row.original.type === 2 ? <FolderIcon /> : <FileIcon />}
        </div>
      );
    },
  },
  {
    accessorKey: "path",
    header: ({ column }) => {
      return (
        <button
          className="flex items-center hover:underline"
          onClick={() =>
            column.toggleSorting(
              column.getIsSorted() === "desc"
                ? undefined
                : column.getIsSorted() === "asc"
                  ? true
                  : false,
            )
          }
        >
          path
          <ArrowUpDown className="ml-2 h-4 w-4" />{" "}
        </button>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          {row.original.type === 2 ? (
            <Link
              href={`/storage/${row.original.path}`}
              className="hover:underline"
            >
              {row.original.path.split("/").pop()}
            </Link>
          ) : (
            row.original.path.split("/").pop()
          )}
        </div>
      );
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "type",
    header: ({ column }) => {
      return (
        <button
          className="flex items-center hover:underline"
          onClick={() =>
            column.toggleSorting(
              column.getIsSorted() === "desc"
                ? undefined
                : column.getIsSorted() === "asc"
                  ? true
                  : false,
            )
          }
        >
          Type
          <ArrowUpDown className="ml-2 h-4 w-4" />{" "}
        </button>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          {row.original.type === 2 ? (
            <Badge variant="green">Folder</Badge>
          ) : row.original?.model?.status === "started" &&
            !isModelStale(row.original.model) ? (
            <Badge variant="yellow">In progress</Badge>
          ) : row.original?.model?.status === "started" ? (
            <Badge variant="orange">Stale</Badge>
          ) : row.original?.model?.status === "failed" ? (
            <Badge variant="red">Failed</Badge>
          ) : (
            <Badge variant="blue">File</Badge>
          )}
        </div>
      );
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "size",
    header: ({ column }) => {
      return (
        <button
          className="flex items-center hover:underline"
          onClick={() =>
            column.toggleSorting(
              column.getIsSorted() === "desc"
                ? undefined
                : column.getIsSorted() === "asc"
                  ? true
                  : false,
            )
          }
        >
          Size
          <ArrowUpDown className="ml-2 h-4 w-4" />{" "}
        </button>
      );
    },
    cell: ({ row }) => {
      if (row.original.type === 2) {
        return <div className="flex items-center gap-2" />;
      }
      const sizeString = formatFileSize(row.original.size);
      return <div className="flex items-center gap-2">{sizeString}</div>;
    },
    enableSorting: true,
    enableHiding: false,
  },
];

export function formatFileSize(fileSize: number) {
  let sizeString;
  if (fileSize >= 1073741824) {
    sizeString = `${(fileSize / 1073741824).toFixed(2)} GB`;
  } else if (fileSize >= 1048576) {
    sizeString = `${(fileSize / 1048576).toFixed(2)} MB`;
  } else if (fileSize >= 1024) {
    sizeString = `${(fileSize / 1024).toFixed(2)} KB`;
  } else {
    sizeString = `${fileSize} bytes`;
  }
  return sizeString;
}

export const MODEL_STALE_TIME = 15 * 60 * 1000;

export const isModelStale = (model: { updated_at: Date }) => {
  return new Date(model.updated_at).getTime() < Date.now() - MODEL_STALE_TIME;
};
