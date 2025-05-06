"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { callServerPromise } from "@/lib/call-server-promise";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Code,
  Edit,
  Image,
  MoreHorizontal,
  PinIcon,
  Play,
  Workflow,
} from "lucide-react";
import * as React from "react";
import { getRelativeTime } from "../lib/get-relative-time";

import {
  cloneWorkflow,
  deleteWorkflow,
  pinWorkflow,
  renameWorkflow,
} from "@/components/workflow-api";

import { DialogTemplate } from "@/components/dialog-template";
// import { FileURLRender } from "@/components/output-render";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useUser } from "@clerk/clerk-react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";

import { AdminAndMember, useIsAdminAndMember } from "@/components/permissions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurrentPlan, useCurrentPlanQuery } from "@/hooks/use-current-plan";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { toast } from "sonner";
import { useWorkflowList } from "../hooks/use-workflow-list";
import { UserIcon } from "./run/SharePageComponent";
import { FileURLRender } from "./workflows/OutputRender";
import { UserFilterSelect } from "./user-filter-select";

export function useWorkflowVersion(
  workflow_id?: string,
  debouncedSearchValue?: string,
) {
  const BATCH_SIZE = 5;
  return useInfiniteQuery<any[]>({
    queryKey: ["workflow", workflow_id, "versions"],
    enabled: !!workflow_id,
    queryKeyHashFn: (queryKey) =>
      [...queryKey, "versions", debouncedSearchValue].toString(),
    meta: {
      limit: BATCH_SIZE,
      offset: 0,
      params: {
        search: debouncedSearchValue ?? "",
      },
    },
    getNextPageParam: (lastPage, allPages) => {
      // Check if lastPage is defined and has a length property
      if (
        lastPage &&
        Array.isArray(lastPage) &&
        lastPage.length === BATCH_SIZE
      ) {
        return allPages.length * BATCH_SIZE;
      }
      return undefined;
    },
    initialPageParam: 0,
  });
}

export function WorkflowList() {
  const [modalType, setModalType] = React.useState<"json" | "new" | null>(null);
  const [view, setView] = React.useState<"list" | "grid">("grid");

  const user = useUser();
  const sub = useCurrentPlan();

  const [searchValue, setSearchValue] = React.useState<string | null>(null);
  const [debouncedSearchValue] = useDebounce(searchValue, 250);
  const [selectedUserIds, setSelectedUserIds] = React.useState<string>("");

  const {
    data: workflowsFromPythonApi,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useWorkflowList(debouncedSearchValue ?? "", selectedUserIds);

  const parentRef = React.useRef<HTMLDivElement>(null);
  useInfiniteScroll(parentRef, fetchNextPage, hasNextPage, isFetchingNextPage);

  const flatData = React.useMemo(
    () => workflowsFromPythonApi?.pages.flat() ?? [],
    [workflowsFromPythonApi],
  );

  React.useEffect(() => {
    refetch();
  }, [debouncedSearchValue]);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex w-full flex-row items-center gap-2 px-4 py-4">
        <div className="relative max-w-sm flex-1">
          <Input
            placeholder="Filter workflows..."
            value={searchValue ?? ""}
            onChange={(event) => {
              if (event.target.value === "") {
                setSearchValue(null);
              } else {
                setSearchValue(event.target.value);
              }
            }}
            className="pr-12" // Add padding to prevent text overlap with kbd
          />
          <kbd className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-3 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-[10px] text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
        
        {/* User filter component */}
        <UserFilterSelect onFilterChange={setSelectedUserIds} />
        
        <AdminAndMember>
          <div className="ml-auto flex gap-2">
            <Tooltip>
              <TooltipTrigger>
                {sub && (
                  <Badge
                    className={cn(
                      sub?.features.workflowLimited
                        ? "border-gray-400 text-gray-500"
                        : "",
                    )}
                  >
                    <div className="flex items-center gap-2 px-2 text-xs">
                      {sub?.features.currentWorkflowCount}/
                      {sub?.features.workflowLimit}
                    </div>
                  </Badge>
                )}
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Current workflows: {sub?.features.currentWorkflowCount} / Max:{" "}
                  {sub?.features.workflowLimit}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </AdminAndMember>
      </div>
      <ScrollArea className="fab-workflow-list flex-grow" ref={parentRef}>
        {isLoading ? (
          <div className="mx-auto grid w-full max-w-screen-2xl grid-cols-1 justify-items-center gap-4 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <WorkflowCardSkeleton key={index} />
            ))}
          </div>
        ) : flatData?.length === 0 ? (
          <div className="absolute inset-0 flex h-full flex-col items-center justify-center p-4 text-center">
            {debouncedSearchValue ? (
              <>
                <h3 className="mb-2 font-semibold text-lg">No results found</h3>
                <p className="mb-4 text-muted-foreground">
                  Try adjusting your search or filter to find what you're
                  looking for.
                </p>
              </>
            ) : (
              <>
                <h3 className="mb-2 font-semibold text-lg">
                  Welcome{" "}
                  {user.user?.username ??
                    (user.user?.firstName ?? "") +
                      " " +
                      (user.user?.lastName ?? "")}
                </h3>
                <p className="mb-4 text-muted-foreground">
                  Click the + button in the bottom right to create your first
                  workflow
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="mx-auto grid w-full max-w-screen-2xl grid-cols-1 justify-items-center gap-4 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {flatData &&
              flatData.map((workflow) => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  mutate={refetch}
                />
              ))}
            {isFetchingNextPage && (
              <>
                {Array.from({ length: 8 }, (_, index) => (
                  <WorkflowCardSkeleton key={index} />
                ))}
              </>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function WorkflowCardSkeleton() {
  return (
    <div className="flex w-full flex-col md:max-w-[320px]">
      <Card className="group relative flex aspect-square w-full flex-col overflow-hidden rounded-md">
        <div className="flex h-full w-full flex-col items-center justify-center">
          <Skeleton className="mb-2 h-10 w-10 rounded-full" />
        </div>
        <div className="absolute top-2 right-2">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </Card>
      <div className="flex flex-col px-2 pt-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="mt-1 flex justify-between">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
    </div>
  );
}

function WorkflowCard({
  workflow,
  mutate,
}: {
  workflow: any;
  mutate: () => void;
}) {
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState<string>();
  const [renameValue, setRenameValue] = React.useState("");
  const navigate = useNavigate();

  const { refetch: refetchPlan } = useCurrentPlanQuery();

  const openRenameDialog = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setRenameValue(workflow.name);
    setModalOpen("rename");
  };

  const isAdminAndMember = useIsAdminAndMember();

  const { data: latest_runs } = useQuery<any[]>({
    queryKey: ["workflow", workflow.id, "run", "latest"],
    queryKeyHashFn: (queryKey) => [...queryKey, "latest"].toString(),
  });

  const latest_output = latest_runs?.[0]?.outputs?.[0]?.data;
  const lastest_run_at = latest_runs?.[0]?.created_at;
  const status = latest_runs?.[0]?.status;

  return (
    <>
      <DialogTemplate
        open={modalOpen === "rename"}
        onOpenChange={(open) => {
          if (!open) setModalOpen(undefined);
          setRenameValue(workflow.name);
        }}
        title="Rename"
        onCancel={() => setModalOpen(undefined)}
        onConfirm={async () => {
          setModalOpen(undefined);
          await callServerPromise(renameWorkflow(workflow.id, renameValue), {
            loadingText: "Renaming workflow",
            successMessage: `${workflow.name} renamed successfully`,
          });
          mutate();
        }}
        onConfirmBtnProps={{
          disabled: renameValue === "" || renameValue === workflow.name,
          className:
            renameValue === "" || renameValue === workflow.name
              ? "opacity-50"
              : "",
        }}
        workflowName={workflow.name}
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
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className={cn("sm:max-w-[425px]")}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {"Delete"} <Badge variant={"secondary"}>{workflow.name}</Badge>
            </DialogTitle>
            <DialogDescription className="text-primary">
              Careful this is destructive and cannot be undone.
              <Alert variant="warning" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  Any existing runs will keep running, before deleting make sure
                  your workflow is not currently running.
                </AlertDescription>
              </Alert>
            </DialogDescription>
          </DialogHeader>
          <div className="flex w-full justify-end gap-2">
            <Button
              className="w-fit"
              variant={"outline"}
              onClick={() => {
                setDeleteModalOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              className="w-fit"
              variant="destructive"
              onClick={async () => {
                await callServerPromise(deleteWorkflow(workflow.id), {
                  loadingText: "Deleting workflow",
                  successMessage: `${workflow.name} deleted successfully`,
                });
                await refetchPlan();
                mutate();
                setDeleteModalOpen(false);
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Link
        href={
          isAdminAndMember
            ? `/workflows/${workflow.id}/workspace`
            : `/workflows/${workflow.id}/playground`
        }
        className="flex w-full flex-col md:max-w-[320px]"
      >
        <Card className="group relative flex aspect-square w-full flex-col overflow-hidden rounded-md transition-all duration-300 ease-in-out hover:shadow-lg">
          <div className="h-full w-full">
            {workflow.cover_image || latest_output?.images?.[0]?.url ? (
              <FileURLRender
                url={workflow.cover_image ?? latest_output.images[0].url}
                imgClasses="w-full h-full max-w-full max-h-full rounded-[8px] object-cover transition-all duration-300 ease-in-out group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center ">
                <Workflow
                  size={40}
                  strokeWidth={1.5}
                  className="mb-2 text-gray-400"
                />
              </div>
            )}
          </div>
          <div className="absolute top-2 right-2">
            <AdminAndMember>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 bg-black/30 p-0 text-white opacity-0 transition-all duration-300 group-hover:opacity-100 data-[state=open]:opacity-100"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Workflow Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={(e) => openRenameDialog(e)}>
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async (e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const newWorkflow = await callServerPromise(
                        cloneWorkflow(workflow.id),
                        {
                          loadingText: "Cloning workflow",
                          successMessage: `${workflow.name} cloned successfully`,
                        },
                      );
                      mutate();
                      toast.info(`Redirecting to ${newWorkflow.name}...`);
                      navigate({
                        to: `/workflows/${newWorkflow.id}/workspace`,
                      });
                    }}
                  >
                    Clone
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setDeleteModalOpen(true);
                    }}
                  >
                    Delete
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async (e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const newPinnedState = !workflow.pinned;
                      await callServerPromise(
                        pinWorkflow(workflow.id, newPinnedState),
                        {
                          loadingText: newPinnedState
                            ? "Pinning workflow"
                            : "Unpinning workflow",
                          successMessage: `${workflow.name} ${newPinnedState ? "pinned" : "unpinned"} successfully`,
                        },
                      );
                      mutate();
                    }}
                  >
                    {workflow.pinned ? "Unpin" : "Pin"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </AdminAndMember>
          </div>

          {workflow.pinned && (
            <div className="absolute top-4 left-4">
              <PinIcon className="rotate-45 text-white drop-shadow-md" />
            </div>
          )}
        </Card>
        <div className="flex flex-col px-2 pt-2">
          <div className="flex w-full flex-row justify-between truncate font-medium text-gray-700 text-md">
            <div className="mr-2 truncate text-sm">{workflow.name}</div>
            {status && (
              <Badge
                variant={status === "success" ? "success" : "secondary"}
                className="shrink-0"
              >
                {status}
              </Badge>
            )}
          </div>
          <div className="flex flex-row justify-between">
            <div className="flex items-center gap-2 truncate text-muted-foreground text-xs">
              {workflow.user_id && (
                <UserIcon user_id={workflow.user_id} className="h-4 w-4" />
              )}
              {workflow.user_name || "Unknown"}
            </div>
            <div className="shrink-0 text-2xs text-muted-foreground">
              {lastest_run_at ? (
                getRelativeTime(lastest_run_at)
              ) : (
                <Skeleton className="h-4 w-16" />
              )}
            </div>
          </div>
        </div>
      </Link>
    </>
  );
}
