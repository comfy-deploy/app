"use client";

import { useConfirmServerActionDialog } from "@/components/auto-form/auto-form-dialog";
import { useIsAdminAndMember, useIsAdminOnly } from "@/components/permissions";
import { CopyWorkflowVersion } from "@/components/run/VersionSelect";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWorkflowVersion } from "@/components/workflow-list";
import { useWorkflowStore } from "@/components/workspace/Workspace";
import { sendWorkflow } from "@/components/workspace/sendEventToCD";
import { useCurrentWorkflow } from "@/hooks/use-current-workflow";
import { getRelativeTime } from "@/lib/get-relative-time";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown } from "lucide-react";
import { Search } from "lucide-react";
import { parseAsInteger, useQueryState } from "nuqs";
import * as React from "react";
import { useMemo } from "react";
import { useDebounce } from "use-debounce";
import { VirtualizedInfiniteList } from "./virtualized-infinite-list";

export function WorkflowLastEditTime({
  workflow_id,
}: {
  workflow_id: string;
}) {
  const { workflow } = useCurrentWorkflow(workflow_id);
  if (!workflow) return <Skeleton className="h-4 w-36 py-1" />;
  return <div>{getRelativeTime(workflow?.updated_at)}</div>;
}

export function useSelectedVersion(workflow_id?: string) {
  const { workflow } = useCurrentWorkflow(workflow_id ?? null);

  const [version, setVersion] = useQueryState("version", {
    defaultValue: workflow?.versions?.[0].version ?? 1,
    ...parseAsInteger,
  });

  // const {

  // } = useWorkflowVersion(workflow_id);

  const {
    data: versionData,
    isLoading,
    status,
  } = useQuery<any>({
    queryKey: ["workflow", workflow_id, "version", version.toString()],
    enabled: !!workflow_id,
  });

  // const {
  //   data: versions,
  //   isLoading,
  //   isValidating,
  // } = useSWR(
  //   workflow?.id + "-version",
  //   async () => {
  //     return getAllWorkflowVersion(workflow!.id, 0, 50);
  //   },
  //   {
  //     refreshInterval: 5000,
  //     dedupingInterval: 5000,
  //     revalidateOnFocus: false,
  //     revalidateIfStale: false,
  //     // revalidateOnMount: false,
  //   },
  // );

  // const value = versions?.find((x) => x.version == version);

  return {
    value: versionData,
    // versions,
    setVersion,
    isLoading: isLoading || status === "pending",
    isValidating: status === "pending",
  };
}

export function VersionList({
  workflow_id,
  onSelect,
  onClose,
  selectedVersion,
  className,
  height,
  renderItem,
  hideSearch,
  containerClassName,
}: {
  workflow_id: string;
  onSelect?: (version: WorkflowType) => void;
  onClose?: () => void;
  selectedVersion?: WorkflowType;
  className?: string;
  renderItem?: (item: WorkflowType) => React.ReactNode;
  height?: number;
  hideSearch?: boolean;
  containerClassName?: string;
}) {
  const [searchValue, setSearchValue] = React.useState("");
  const [debouncedSearchValue] = useDebounce(searchValue, 250);

  const query = useWorkflowVersion(workflow_id, debouncedSearchValue);
  const { hasChanged } = useWorkflowStore();
  const isAdminAndMember = useIsAdminAndMember();

  const flatData = React.useMemo(
    () => query.data?.pages.flat() ?? [],
    [query.data],
  );

  React.useEffect(() => {
    query.refetch();
  }, [debouncedSearchValue]);

  const [_version, setVersion] = useQueryState("version", {
    defaultValue: selectedVersion?.version ?? flatData[0]?.version ?? 1,
    ...parseAsInteger,
  });

  // _version = selectedVersion?.version || _version;

  const version = selectedVersion?.version || _version;

  const { dialog, setOpen: setOpenDialog } =
    useConfirmServerActionDialog<WorkflowType>({
      title: "Load to workspace",
      description:
        "This will load the workflow from the selected version to workspace, which will override the current workflow",
      action: async (value) => {
        sendWorkflow(value.workflow);
        setVersion(value.version);
        onClose?.();
      },
    });

  return (
    <div className={cn("w-[375px] overflow-hidden", className)}>
      {dialog}
      {!hideSearch && (
        <div className="relative p-2">
          <Search className="-translate-y-1/2 absolute top-1/2 left-6 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search versions..."
            className="pl-12 text-sm"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
      )}
      <VirtualizedInfiniteList
        queryResult={query}
        className={containerClassName}
        renderItem={(item) =>
          renderItem ? (
            renderItem(item)
          ) : (
            <VersionRow
              item={item as WorkflowType}
              selected={version}
              onSelect={(item) => {
                if (onSelect) {
                  onSelect(item);
                } else {
                  if (hasChanged) {
                    setOpenDialog(item);
                  } else {
                    setVersion(item.version);
                    sendWorkflow(item.workflow);
                    onClose?.();
                  }
                }
              }}
              isAdminAndMember={isAdminAndMember}
              setOpen={setOpenDialog}
            />
          )
        }
        renderLoading={() => <LoadingRow />}
        estimateSize={height ?? 100}
      />
    </div>
  );
}

export function VersionSelectV2({
  workflow_id,
  onSelect,
  selectedVersion,
  className,
}: {
  workflow_id: string;
  onSelect?: (version: WorkflowType) => void;
  selectedVersion?: WorkflowType;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  const flatData = useWorkflowVersion(workflow_id, "").data?.pages.flat() ?? [];
  const version = selectedVersion?.version || flatData[0]?.version;

  const value = React.useMemo<WorkflowType>(() => {
    if (selectedVersion) return selectedVersion;
    return flatData?.find((x) => x.version === version);
  }, [flatData, version, selectedVersion]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          aria-expanded={open}
          className={cn(
            "flex w-full justify-between border-0 bg-transparent px-2 py-1 hover:bg-gray-2000",
            className,
          )}
        >
          <span className="flex w-full gap-2 truncate text-ellipsis text-start text-sm">
            <Badge className="relative inline-block">
              v{value?.version || version}
            </Badge>
          </span>
          <ChevronDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[375px] overflow-hidden p-0" side="bottom">
        <VersionList
          workflow_id={workflow_id}
          onSelect={onSelect}
          selectedVersion={selectedVersion}
        />
      </PopoverContent>
    </Popover>
  );
}

type WorkflowType = NonNullable<any>[0];

function VersionRow({
  item,
  selected,
  onSelect,
  isAdminAndMember,
  setOpen,
}: {
  item: WorkflowType;
  selected: number;
  onSelect: (value: WorkflowType) => void;
  isAdminAndMember: boolean;
  setOpen: (workflow: any) => void;
}) {
  return (
    <div className="flex items-start space-x-4 p-3 text-sm transition-colors">
      <div className="relative w-8 flex-shrink-0">
        <Avatar className="h-6 w-6">
          <AvatarImage src={(item as any).user_icon ?? undefined} />
          <AvatarFallback>{item.user?.name?.[0]}</AvatarFallback>
        </Avatar>
      </div>
      <div className="flex-grow overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center space-x-2">
            <Badge variant="secondary" className="flex-shrink-0 text-xs">
              v{item.version}
            </Badge>
            <Tooltip>
              <TooltipTrigger>
                <span className="truncate font-medium text-xs">
                  {item.user?.name}
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px]">
                {item.user?.name}
              </TooltipContent>
            </Tooltip>
          </div>
          <span className="ml-2 flex-shrink-0 text-muted-foreground text-xs">
            {getRelativeTime(item.created_at)}
          </span>
        </div>
        <Tooltip>
          <TooltipTrigger className="block w-full text-left">
            <p className="mt-1 truncate text-xs">{item.comment || "-"}</p>
          </TooltipTrigger>
          <TooltipContent className="max-w-[300px] whitespace-normal break-words">
            {item.comment || "-"}
          </TooltipContent>
        </Tooltip>
        <div className="mt-2 flex flex-wrap gap-2">
          {isAdminAndMember && (
            <>
              {/* <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setOpen(item);
                  
                }}
              >
                <Edit className="h-3 w-3 mr-1" /> Edit
              </Button> */}
              <CopyWorkflowVersion
                workflow_id={item.workflow_id}
                version={item.version}
                className="h-7 text-xs"
              />
            </>
          )}
          <Button
            variant={selected === item.version ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => onSelect(item)}
          >
            {selected === item.version && <Check className="mr-1 h-3 w-3" />}
            {selected === item.version ? "Active" : "Set Active"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function LoadingRow() {
  return (
    <div className="flex items-center space-x-4 p-3 text-sm">
      <Skeleton className="h-6 w-6 rounded-full" />
      <div className="flex-grow">
        <Skeleton className="mb-2 h-4 w-20" />
        <Skeleton className="mb-2 h-3 w-full" />
        <div className="flex space-x-2">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-7 w-20" />
        </div>
      </div>
    </div>
  );
}
