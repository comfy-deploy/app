"use client";

import { useConfirmServerActionDialog } from "@/components/auto-form/auto-form-dialog";
import { useIsAdminAndMember, useIsAdminOnly } from "@/components/permissions";
import { UserIcon } from "@/components/run/SharePageComponent";
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
import { Check, ChevronDown, Loader2 } from "lucide-react";
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
  containerStyle,
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
  containerStyle?: React.CSSProperties;
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

  if (query.isLoading) {
    return (
      <div
        className={cn(
          "flex h-[200px] w-[375px] items-center justify-center",
          className,
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

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
        containerStyle={containerStyle}
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
        estimateSize={height ?? 30}
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
  const [version] = useQueryState("version", {
    defaultValue: selectedVersion?.version || flatData[0]?.version,
    ...parseAsInteger,
  });

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
          containerStyle={{ overflowX: "hidden" }}
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
    // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
    <div
      className={cn(
        "flex cursor-pointer flex-row items-center justify-between gap-1 rounded-[6px] px-2 py-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/50",
        item.version === 1 && "rounded-b-sm",
        selected === item.version && "bg-gray-100 dark:bg-gray-500/50",
      )}
      onClick={() => onSelect(item)}
    >
      <div className="grid grid-cols-[14px_38px_auto_1fr] items-center gap-2">
        <div className="flex h-full items-center justify-center">
          <div
            className={cn(
              "absolute w-[2px] bg-gray-300",
              item.version === 1 ? "top-0 h-[50%]" : "h-full",
            )}
          />
          <div className="relative z-10 flex h-[6px] w-[6px] items-center justify-center rounded-full bg-gray-300" />
        </div>

        <Badge
          className={cn(
            "!py-0 !text-2xs w-fit whitespace-nowrap rounded-sm",
            selected === item.version && "bg-primary text-primary-foreground",
          )}
        >
          v{item.version}
        </Badge>

        <div className="truncate text-muted-foreground text-xs">
          {item.comment || "-"}
        </div>
      </div>
      <div className="grid grid-cols-[auto_auto_50px_30px] items-center gap-2">
        <div />
        <UserIcon user_id={item.user_id} className="h-4 w-4" />
        <div className="whitespace-nowrap text-[10px] text-muted-foreground">
          {getRelativeTime(item.created_at)}
        </div>
        <div className="flex items-center gap-1">
          {isAdminAndMember && (
            <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <CopyWorkflowVersion
                workflow_id={item.workflow_id}
                version={item.version}
                machine_version_id={item.machine_version_id}
                className="h-6 text-[10px] w-fit"
              />
            </div>
          )}
          <Button
            variant={selected === item.version ? "default" : "ghost"}
            size="sm"
            className="h-6 text-[10px] px-1"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(item);
            }}
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
    <div className="flex items-center space-x-4 text-sm">
      <Skeleton className="h-6 w-full" />
    </div>
  );
}
