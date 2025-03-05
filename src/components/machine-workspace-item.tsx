import { MachineListItem } from "@/components/machines/machine-list-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLogStore } from "@/components/workspace/LogContext";
import { useWorkflowIdInWorkflowPage } from "@/hooks/hook";
import { useCurrentWorkflow } from "@/hooks/use-current-workflow";
import { useMachinesAll } from "@/hooks/use-machine";
import { useSessionAPI } from "@/hooks/use-session-api";
import { api } from "@/lib/api";
import { callServerPromise } from "@/lib/call-server-promise";
import { getRelativeTime } from "@/lib/get-relative-time";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  ChevronsUpDown,
  Play,
  Search,
  Trash,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { MachineStatus } from "./machines/machine-status";
import { UserIcon } from "./run/SharePageComponent";
import { Badge } from "./ui/badge";
import { WorkflowLatestOutput } from "./workflow-list";

export function MachineWorkspaceItem({
  machine,
  index,
  isInWorkspace = false,
}: { machine: any; index: number; isInWorkspace: boolean }) {
  const router = useRouter();
  const { createDynamicSession, deleteSession } = useSessionAPI();
  const [openFocus, setOpenFocus] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const workflowId = useWorkflowIdInWorkflowPage();
  const handleStartSession = async () => {
    const response = await createDynamicSession.mutateAsync({
      machine_id: machine.id,
      gpu: machine.gpu,
      timeout: 15,
    });
    useLogStore.getState().clearLogs();

    router.navigate({
      to: "/sessions/$sessionId",
      params: {
        sessionId: response.session_id,
      },
      search: {
        ...(isInWorkspace && { workflowId: workflowId || undefined }),
        ...(!isInWorkspace && { machineId: machine.id }),
      },
    });
  };

  const { data: relatedWorkflows } = useQuery({
    queryKey: ["machine", machine?.id, "workflows"],
    enabled: !!machine?.id,
  });

  if (isInWorkspace) {
    return (
      <div>
        <AnimatePresence>
          {!openFocus && (
            <MachineSessionList
              isHovered={isHovered}
              currentMachine={machine}
              deleteSession={deleteSession}
            />
          )}
          {openFocus && (
            <MachineSelectList
              currentMachine={machine}
              setOpenFocus={setOpenFocus}
            />
          )}
        </AnimatePresence>
        {/* <div
          className="fixed inset-x-0 bottom-4 z-50 mx-auto max-w-[520px] overflow-hidden rounded-md border border-gray-200 drop-shadow-md transition-all"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {machine ? (
            <MachineListItem
              index={index}
              machine={machine}
              showMigrateDialog={false}
              overrideRightSide={
                <div className="flex flex-row items-center gap-2">
                  <SwitchMachineButton
                    openFocus={openFocus}
                    setOpenFocus={setOpenFocus}
                  />
                  <Button
                    variant="default"
                    className="rounded-[9px]"
                    onClick={handleStartSession}
                    disabled={machine.type !== "comfy-deploy-serverless"}
                  >
                    Start ComfyUI
                    <Play className="ml-2 h-3 w-3" />
                  </Button>
                </div>
              }
              machineActionItemList={<></>}
            />
          ) : (
            <div className="flex items-center justify-between bg-white p-3.5">
              <div className="flex gap-2">
                <Skeleton className="mt-1 h-3 w-3 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-[60px] rounded-full" />
                    <Skeleton className="h-4 w-[60px] rounded-full" />
                  </div>
                </div>
              </div>
              <div className="flex flex-row items-center gap-2">
                <SwitchMachineButton
                  openFocus={openFocus}
                  setOpenFocus={setOpenFocus}
                />
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger>
                      <Button
                        variant="default"
                        className="rounded-[9px]"
                        disabled
                        tabIndex={0}
                      >
                        Start ComfyUI
                        <Play className="ml-2 h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Please select a machine</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          )}
        </div> */}
      </div>
    );
  }

  return (
    <div className="h-full">
      <AnimatePresence mode="wait">
        {openFocus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/80"
            onClick={() => {
              setOpenFocus(false);
            }}
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col items-center justify-between gap-2 h-full">
        <MachineListItem
          key={machine.id}
          index={index}
          machine={machine}
          className="h-full"
          showMigrateDialog={false}
          overrideRightSide={
            <div className="flex flex-row items-center gap-2">
              <Button
                variant="outline"
                className="rounded-[9px]"
                onClick={handleStartSession}
              >
                Start
                <Play className="ml-2 h-3 w-3" />
              </Button>
            </div>
          }
          machineActionItemList={<></>}
        >
          {relatedWorkflows?.length > 0 && (
            <div className="z-[4] mt-4 flex w-full flex-row items-center justify-start gap-2 text-xs">
              {relatedWorkflows.map((workflow) => (
                <Link
                  to="/workflows/$workflowId/$view"
                  params={{ workflowId: workflow.id, view: "requests" }}
                >
                  <Badge
                    key={workflow.id}
                    variant="secondary"
                    className="bg-background ring-1 ring-border flex flex-row items-center gap-2 pr-4 pl-0 shadow-lg hover:bg-gray-200"
                  >
                    <WorkflowLatestOutput
                      workflow={workflow}
                      className="h-12 w-12"
                    />
                    <UserIcon user_id={workflow.user_id} className="h-4 w-4" />
                    {workflow.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </MachineListItem>
      </div>
    </div>
  );
}

function SwitchMachineButton({
  openFocus,
  setOpenFocus,
}: { openFocus: boolean; setOpenFocus: (open: boolean) => void }) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => {
            setOpenFocus(!openFocus);
          }}
        >
          <ChevronsUpDown className="h-[15px] w-[15px]" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Switch Machine</TooltipContent>
    </Tooltip>
  );
}

function MachineSessionList({
  currentMachine,
  deleteSession,
  isHovered,
}: { currentMachine: any; deleteSession: any; isHovered: boolean }) {
  const navigate = useNavigate();
  const workflowId = useWorkflowIdInWorkflowPage();
  const { data: activeSessions } = useQuery<any[]>({
    queryKey: ["sessions"],
    queryKeyHashFn: (queryKey) => [...queryKey, currentMachine?.id].toString(),
    enabled: !!currentMachine?.id,
    refetchInterval: 2000,
    select: (data) =>
      data?.filter((session) => session.machine_id === currentMachine.id),
  });

  const [isListHovered, setIsListHovered] = useState(false);
  const shouldShowList = isHovered || isListHovered;

  if (!activeSessions?.length) {
    return null;
  }

  return (
    <div
      className="-translate-x-1/2 fixed bottom-[45px] left-1/2 z-50 w-[520px] overflow-hidden rounded-lg border border-blue-200 bg-blue-50 pb-10 shadow-lg"
      onMouseEnter={() => setIsListHovered(true)}
      onMouseLeave={() => setIsListHovered(false)}
    >
      <span className="px-4 text-2xs text-blue-900">
        Active ComfyUI: {activeSessions.length}
      </span>
      <AnimatePresence>
        {shouldShowList && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: "circOut", delay: 0.2 }}
            className="mx-2 rounded-t-md bg-white shadow-inner"
          >
            {activeSessions.map((session, index) => (
              <div
                key={session.id}
                className={cn(
                  "flex items-center justify-between border-blue-200/50 border-b px-4 py-1",
                  index === 0 && "rounded-t-md pt-2",
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                  <UserIcon user_id={session.user_id} className="h-5 w-5" />
                  <span className="font-mono text-2xs text-muted-foreground">
                    {session.id.slice(0, 6)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">
                    {getRelativeTime(session.start_time)}
                  </span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={async (e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          e.nativeEvent.preventDefault();
                          navigate({
                            to: "/sessions/$sessionId",
                            params: {
                              sessionId: session.session_id,
                            },
                            search: { workflowId: workflowId || undefined },
                          });
                        }}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Resume</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={async (e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          e.nativeEvent.preventDefault();
                          await deleteSession.mutateAsync({
                            sessionId: session.session_id,
                          });
                        }}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MachineSelectList({
  currentMachine,
  setOpenFocus,
}: { currentMachine: any; setOpenFocus: (open: boolean) => void }) {
  const { data: machines, isLoading } = useMachinesAll();
  const [search, setSearch] = useState("");
  const workflowId = useWorkflowIdInWorkflowPage();
  const { mutateWorkflow } = useCurrentWorkflow(workflowId);

  const parentRef = useRef<HTMLDivElement>(null);

  const filteredMachines = useMemo(
    () =>
      machines?.filter((machine) =>
        currentMachine
          ? (machine.name.toLowerCase().includes(search.toLowerCase()) ||
              machine.id.includes(search)) &&
            machine.id !== currentMachine.id
          : machine.name.toLowerCase().includes(search.toLowerCase()) ||
            machine.id.includes(search),
      ) ?? [],
    [machines, search, currentMachine],
  );

  const virtualizer = useVirtualizer({
    count: filteredMachines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 43, // height of each row
    overscan: 5,
  });

  const handleSelectMachine = async (selectedMachine: any) => {
    await callServerPromise(
      api({
        url: `workflow/${workflowId}`,
        init: {
          method: "PATCH",
          body: JSON.stringify({
            selected_machine_id: selectedMachine.id,
          }),
        },
      }),
    );

    mutateWorkflow();
    setOpenFocus(false);
  };

  return (
    <motion.div
      initial={{ height: 0 }}
      animate={{ height: "400px" }}
      exit={{ height: 0 }}
      transition={{ duration: 0.2, ease: "circOut" }}
      className="-translate-x-1/2 fixed bottom-10 left-1/2 z-50 w-[520px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
    >
      <div className="px-3 py-2">
        <div className="mx-3 my-2 flex flex-row items-center justify-between">
          <h3 className="font-medium">Switch Machine</h3>
        </div>
        <div className="relative">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-gray-400" />
          {search && (
            <X
              className="-translate-y-1/2 absolute top-1/2 right-3 h-4 w-4 cursor-pointer text-gray-400"
              onClick={() => setSearch("")}
            />
          )}
          <Input
            placeholder="Search machines or IDs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-none border-gray-200 border-x-transparent border-t-transparent bg-transparent pl-10 focus-visible:ring-0"
          />
        </div>
      </div>

      <div
        ref={parentRef}
        className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent max-h-[250px] overflow-y-auto px-3"
      >
        {isLoading ? (
          Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center justify-between rounded-[6px] border-gray-50 px-3 py-2",
                index % 2 === 0 && "bg-gray-100",
              )}
            >
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-4 w-4" />
              </div>
            </div>
          ))
        ) : filteredMachines.length === 0 ? (
          <div className="flex items-center justify-center text-muted-foreground text-xs">
            No machines found.
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const machine = filteredMachines[virtualRow.index];
              return (
                <div
                  key={machine.id}
                  ref={virtualizer.measureElement}
                  data-index={virtualRow.index}
                  style={{
                    position: "absolute",
                    top: 0,
                    transform: `translateY(${virtualRow.start}px)`,
                    width: "100%",
                  }}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-[6px] border-gray-50 px-3 py-2 transition-colors hover:bg-gray-200",
                    virtualRow.index % 2 === 0 && "bg-gray-100",
                  )}
                  onClick={async () => {
                    await handleSelectMachine(machine);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <MachineStatus machine={machine} mini={true} />
                    <span className="max-w-[150px] truncate text-sm">
                      {machine.name}
                    </span>
                    <span className="font-mono text-[9px] text-gray-500">
                      {machine.id.slice(0, 8)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {machine.gpu && (
                      <Badge variant="outline" className="!text-2xs">
                        {machine.gpu}
                      </Badge>
                    )}
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
