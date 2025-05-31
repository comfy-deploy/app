import { createFileRoute, useRouter } from "@tanstack/react-router";
import { usePostHog } from "posthog-js/react";
import { z } from "zod";

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
import { useSelectedVersion } from "@/components/version-select";
import { VirtualizedInfiniteList } from "@/components/virtualized-infinite-list";
import { SessionCreator } from "@/components/workspace/SessionView";
import { WorkflowCommitVersion } from "@/components/workspace/WorkflowCommitVersion";
import { WorkflowDiff } from "@/components/workspace/WorkflowDiff";
import { useWorkflowStore } from "@/components/workspace/Workspace";
import { sendWorkflow } from "@/components/workspace/sendEventToCD";
import { useMachine, useMachines } from "@/hooks/use-machine";
import { api } from "@/lib/api";
import { callServerPromise } from "@/lib/call-server-promise";
import { cn } from "@/lib/utils";
import { AnimatePresence, easeOut, motion } from "framer-motion";
import {
  ChevronDown,
  ExternalLink,
  RefreshCcw,
  Save,
  Search,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";

export const Route = createFileRoute("/sessions/$sessionId/")({
  component: RouteComponent,
  validateSearch: z.object({
    machineId: z.string().optional(),
    workflowId: z.string().optional(),
    workflowLink: z.string().optional(),
    version: z.number().optional(),
    isFirstTime: z.boolean().optional(),
  }),
});

function RouteComponent() {
  const { sessionId } = Route.useParams();
  const { machineId, workflowId } = Route.useSearch();
  const router = useRouter();

  if (sessionId === "new" && machineId) {
    return (
      <div>
        <MachineSelect machineId={machineId} />
      </div>
    );
  }

  // const { data: session } = useQuery<any>({
  //   enabled: !!sessionId,
  //   queryKey: ["session", sessionId],
  // });

  return (
    <motion.div
      className="z-[10] h-full w-full bg-[#141414] relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: easeOut }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 backdrop-blur-sm"
        style={{
          backgroundImage: `linear-gradient(#2c2c2c 1px, transparent 1px),
                           linear-gradient(90deg, #2c2c2c 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: easeOut }}
      />
      <SessionCreator
        workflowId={workflowId ?? undefined}
        sessionIdOverride={sessionId}
      />
    </motion.div>
  );
}

function WorkspaceStatusBar({
  endpoint,
  className,
  btnsClassName,
  workflowId,
}: {
  endpoint: string;
  className?: string;
  btnsClassName?: string;
  workflowId: string;
}) {
  // const { workflowId, readonly } = use(WorkspaceContext);
  const readonly = false;
  const { value: selectedVersion } = useSelectedVersion(workflowId);
  const hasChanged = useWorkflowStore((state) => state.hasChanged);
  const setHasChanged = useWorkflowStore((state) => state.setHasChanged);

  const [displayDiff, setDisplayDiff] = React.useState(false);
  const [displayCommit, setDisplayCommit] = React.useState(false);

  return (
    <>
      {displayCommit && !readonly && (
        <WorkflowCommitVersion setOpen={setDisplayCommit} endpoint={endpoint} />
      )}

      {displayDiff && !readonly && (
        <WorkflowDiff
          workflowId={workflowId}
          onClose={() => setDisplayDiff(false)}
          onSave={() => {
            setDisplayDiff(false);
            setDisplayCommit(true);
          }}
        />
      )}
      <AnimatePresence>
        {hasChanged && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className={cn("overflow-hidden", className)}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-yellow-100/80 px-2 py-1 text-xs">
              {/* <div className="flex items-center gap-2">
                <AlertTriangle size={12} className="text-yellow-800" />
                <span className="text-yellow-800">Unsaved changes</span>
              </div> */}

              <div className={cn("flex items-center gap-2", btnsClassName)}>
                <Button
                  className="pointer-events-auto"
                  disabled={readonly}
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    sendWorkflow(selectedVersion.workflow);
                    setHasChanged(false);
                    toast.success("Discarded changes");
                  }}
                  Icon={RefreshCcw}
                  iconPlacement="right"
                  confirm
                >
                  {/* Revert */}
                </Button>
                {/* <Button
                  className="pointer-events-auto"
                  disabled={readonly}
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    setDisplayDiff(true);
                  }}
                  Icon={Diff}
                  iconPlacement="right"
                >
                  Diff
                </Button> */}
                <Button
                  className="pointer-events-auto"
                  disabled={readonly}
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    setDisplayCommit(true);
                  }}
                  Icon={Save}
                  iconPlacement="right"
                >
                  Save
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// import { MachineBuildSettingsDialog } from "./MachineBuildSettingsDialog";

export function MachineSelect({
  machineId,
  className,
}: {
  machineId: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const [debouncedSearchValue] = useDebounce(searchValue, 250);

  const query = useMachines(debouncedSearchValue);

  const flatData = React.useMemo(
    () => query.data?.pages.flat() ?? [],
    [query.data],
  );

  // const [value] = useSelectedMachine(undefined, workflow, true);
  const { data: value } = useMachine(machineId);

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
              className="flex w-full justify-between border"
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
      {/* <Separator orientation="vertical" className="z-10 h-[40px] flex-none" /> */}
      {/* {value ? (
        <MachineBuildSettingsDialog
          machineId={value.id}
          buttonVariant={"ghost"}
          className="flex-none border-none bg-transparent"
        />
      ) : (
        <Button
          variant={"ghost"}
          className="flex-none border-none hover:bg-transparent"
          // disabled={valueId === shareMachine?.id}
        >
          <Settings size={14} />
        </Button>
      )} */}
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
