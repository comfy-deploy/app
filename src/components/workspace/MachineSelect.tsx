"use client";

import { usePostHog } from "posthog-js/react";

import { MachineStatus } from "@/components/machines/machine-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentWorkflow } from "@/hooks/use-current-workflow";
import { useMachine, useMachines } from "@/hooks/use-machine";
import { api } from "@/lib/api";
import { callServerPromise } from "@/lib/call-server-promise";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ExternalLink, Search, Settings } from "lucide-react";
import * as React from "react";
import { useDebounce } from "use-debounce";
import { VirtualizedInfiniteList } from "../virtualized-infinite-list";
import { MachineBuildSettingsDialog } from "./MachineBuildSettingsDialog";
import { Link } from "@tanstack/react-router";
// import { MachineBuildSettingsDialog } from "./MachineBuildSettingsDialog";

export function MachineSelect({
  workflow_id,
  leaveEmpty = false,
  className,
}: {
  workflow_id: string;
  leaveEmpty?: boolean;
  className?: string;
}) {
  const { workflow, mutateWorkflow } = useCurrentWorkflow(workflow_id);

  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const [debouncedSearchValue] = useDebounce(searchValue, 250);

  const query = useMachines(debouncedSearchValue);

  const flatData = React.useMemo(
    () => query.data?.pages.flat() ?? [],
    [query.data],
  );

  // const [value] = useSelectedMachine(undefined, workflow, true);
  const { data: value } = useMachine(workflow?.selected_machine_id);

  // const value = flatData?.find((x) => x.id === valueId);
  const posthog = usePostHog();

  React.useEffect(() => {
    query.refetch();
  }, [debouncedSearchValue]);

  return (
    <div className={cn("flex w-full items-center", className)}>
      <div className="min-w-0 flex-auto">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex w-full justify-between border-none bg-transparent pr-0 hover:bg-transparent"
            >
              <span className="w-full truncate text-ellipsis text-start">
                <>
                  {value ? (
                    <div className="flex w-full items-center">
                      <div className="flex min-w-0 flex-grow items-center">
                        {value?.gpu && (
                          <>
                            <span className="flex-shrink-0">{value?.gpu}</span>
                            <Separator
                              orientation="vertical"
                              className="mx-2"
                            />
                          </>
                        )}
                        <span className="truncate">{value?.name}</span>
                      </div>
                      <MachineStatus
                        machine={{
                          // disabled: false,
                          // status: "ready",
                          // static_assets_status: "ready",
                          // keep_warm: 0,
                          ...(value || {}),
                        }}
                        mini={true}
                      />
                    </div>
                  ) : (
                    "Select a machine"
                  )}
                </>
              </span>
              <ChevronDown className="mx-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            className="w-[400px] overflow-hidden p-0"
            side="bottom"
          >
            <div className="relative p-2">
              <Search className="-translate-y-1/2 absolute top-1/2 left-6 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search machines..."
                className="pl-12 text-sm"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
            <VirtualizedInfiniteList
              queryResult={query}
              renderItem={(item) => (
                <MachineRow
                  item={item}
                  selected={value}
                  onSelect={async (value) => {
                    await callServerPromise(
                      api({
                        url: `workflow/${workflow_id}`,
                        init: {
                          method: "PATCH",
                          body: JSON.stringify({
                            selected_machine_id: value.id,
                          }),
                        },
                      }),
                    );
                    mutateWorkflow();
                  }}
                  // shareMachine={shareMachine}
                />
              )}
              renderLoading={() => <LoadingRow />}
              estimateSize={80}
            />
          </PopoverContent>
        </Popover>
      </div>
      <Separator orientation="vertical" className="z-10 h-[40px] flex-none" />
      <Link to="/machines/$machineId" params={{ machineId: value?.id }}>
        <Button
          variant={"ghost"}
          className="flex-none border-none hover:bg-transparent"
        >
          <Settings size={14} />
        </Button>
      </Link>
    </div>
  );
}

function MachineRow({
  item,
  selected,
  onSelect,
}: {
  item: any;
  selected?: any;
  onSelect: (value: any) => void;
  // shareMachine?: any;
}) {
  // const isShareMachine = item.id === shareMachine?.id;

  return (
    <div
      className={cn(
        "flex h-full items-center overflow-hidden transition-colors",
        // isShareMachine && "bg-gray-100",
      )}
    >
      <div className="relative flex h-full w-[400px] flex-shrink items-center gap-2 px-4 py-2 text-xs ">
        <div className="flex w-full flex-col gap-1 ">
          <span className="flex w-full items-center justify-between gap-2 break-words">
            <div className="flex items-center gap-2">
              <MachineStatus machine={item} mini={true} />
              <div className="flex flex-col">
                {item?.name}
                <div className="text-2xs text-muted-foreground leading-tight">
                  {item?.id.slice(0, 8)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {item.gpu && <Badge>{item.gpu}</Badge>}
              <Button
                variant={"ghost"}
                // disabled={isShareMachine}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open("/machines/" + item.id, "_blank");
                }}
              >
                <ExternalLink size={14} />
              </Button>
              <Button
                variant={selected?.id === item.id ? "default" : "outline"}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelect(item);
                }}
              >
                Select
              </Button>
            </div>
          </span>
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
