"use client";

import { DialogTemplate } from "@/components/dialog-template";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentWorkflow } from "@/hooks/use-current-workflow";
import { useWorkflowList } from "@/hooks/use-workflow-list";
import { callServerPromise } from "@/lib/call-server-promise";
import { cn } from "@/lib/utils";
import { useMatch, useRouter, useSearch } from "@tanstack/react-router";
import { Check, ChevronsUpDown, ExternalLink, Search } from "lucide-react";
import * as React from "react";
import { useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import { VirtualizedInfiniteList } from "./virtualized-infinite-list";
import { renameWorkflow } from "./workflow-api";

interface WorkflowListProps {
  workflow_id: string;
  onNavigate?: (workflow_id: string) => void;
  className?: string;
}

export function WorkflowList({
  workflow_id,
  onNavigate,
  className,
}: WorkflowListProps) {
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearchValue] = useDebounce(searchValue, 250);
  const match = useMatch({
    from: "/workflows/$workflowId/$view",
    shouldThrow: false,
  });

  const router = useRouter();
  const query = useWorkflowList(debouncedSearchValue);
  // const workflows = useMemo(() => query.data?.pages.flat() ?? [], [query.data]);
  const { workflow } = useCurrentWorkflow(workflow_id);

  React.useEffect(() => {
    console.log("refetch");
    query.refetch();
  }, [debouncedSearchValue]);

  return (
    <div className={cn("w-[375px] overflow-hidden", className)}>
      <div className="relative p-2">
        <Search className="-translate-y-1/2 absolute top-1/2 left-6 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-12 text-sm"
          placeholder="Search workflows"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>
      <VirtualizedInfiniteList
        queryResult={query}
        renderItem={(item) => (
          <WorkflowItem
            key={item.id}
            item={item}
            selected={workflow}
            onSelect={(selectedItem) => {
              onNavigate?.(selectedItem.id);

              if (!onNavigate) {
                router.navigate({
                  to: "/workflows/$workflowId/$view",
                  params: {
                    workflowId: selectedItem.id,
                    view: match?.params.view || "workspace",
                  },
                });
              }
            }}
          />
        )}
        renderLoading={() => <LoadingWorkflowItem />}
        estimateSize={68}
      />
    </div>
  );
}

export function WorkflowDropdown({
  workflow_id,
  className,
  onNavigate,
}: WorkflowListProps) {
  const [open, setOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const { workflow } = useCurrentWorkflow(workflow_id);
  const query = useWorkflowList("");
  const { sessionId } = useSearch({ from: "/workflows/$workflowId/$view" });

  const openRenameDialog = () => {
    setRenameValue(workflow?.name || "");
    setRenameModalOpen(true);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild disabled={sessionId}>
          <button
            type="button"
            aria-expanded={open}
            className={cn(
              "flex w-full items-center justify-between rounded-sm px-2 py-1 text-sm",
              className,
            )}
            onDoubleClick={openRenameDialog}
          >
            <span className="truncate text-ellipsis text-start dark:text-zinc-100">
              {workflow?.name ?? "Select a workflow"}
            </span>
            <ChevronsUpDown
              className="ml-2 flex-shrink-0 opacity-50 dark:text-zinc-400"
              size={16}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[375px] overflow-hidden p-0" side="bottom">
          <WorkflowList workflow_id={workflow_id} onNavigate={onNavigate} />
        </PopoverContent>
      </Popover>

      <DialogTemplate
        open={renameModalOpen}
        onOpenChange={setRenameModalOpen}
        title="Rename"
        onCancel={() => setRenameModalOpen(false)}
        onConfirm={async () => {
          setRenameModalOpen(false);
          await callServerPromise(renameWorkflow(workflow_id, renameValue), {
            loadingText: "Renaming workflow",
            successMessage: `${workflow?.name} renamed successfully`,
          });
          query.refetch();
        }}
        onConfirmBtnProps={{
          disabled: renameValue === "" || renameValue === workflow?.name,
          className:
            renameValue === "" || renameValue === workflow?.name
              ? "opacity-50"
              : "",
        }}
        workflowName={workflow?.name || ""}
      >
        <Label className="pb-4">
          Please enter a new name for this workflow.
        </Label>
        <Input
          className="mt-3"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
        />
      </DialogTemplate>
    </>
  );
}

interface WorkflowItemProps {
  item: { id: string; name: string; user_name: string; user_icon?: string };
  selected: { id: string } | undefined;
  onSelect: (item: {
    id: string;
    name: string;
    user_name: string;
  }) => void;
}

function WorkflowItem({ item, selected, onSelect }: WorkflowItemProps) {
  return (
    <div
      className="flex items-center overflow-hidden transition-colors hover:bg-gray-200"
      onClick={() => onSelect(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onSelect(item);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="relative flex h-full w-[375px] max-w-[calc(100%-48px)] flex-shrink items-center gap-2 px-4 py-2 text-xs">
        <div className="flex w-full flex-col gap-1">
          <div className="overflow-hidden whitespace-nowrap">
            <span
              className="inline-block animate-marquee"
              style={{ "--duration": "10s" } as React.CSSProperties}
            >
              {item?.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={item.user_icon} alt={item.user_name} />
              <AvatarFallback>{item.user_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <Badge className="w-fit max-w-full truncate whitespace-nowrap">
              {item?.user_name}
            </Badge>
          </div>
        </div>
        <div>
          <Check
            className={cn(
              "ml-auto h-4 w-4",
              selected?.id === item.id ? "opacity-100" : "opacity-0",
            )}
          />
        </div>
      </div>
      <div className="h-full flex-col items-center justify-center">
        <Button variant="ghost" asChild>
          <a href={`/workflows/${item.id}`} target="_blank" rel="noreferrer">
            <ExternalLink size={14} />
          </a>
        </Button>
      </div>
    </div>
  );
}

function LoadingWorkflowItem() {
  return (
    <div className="flex items-center space-x-4 p-3 text-sm">
      <Skeleton className="h-6 w-6 rounded-full" />
      <div className="flex-grow">
        <Skeleton className="mb-2 h-4 w-20" />
        <Skeleton className="h-3 w-full" />
      </div>
      <Skeleton className="h-6 w-6" />
    </div>
  );
}
