import { useRouter } from "@tanstack/react-router";
import { useSessionAPI } from "@/hooks/use-session-api";
import { MachineListItem } from "@/components/machines/machine-list-item";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Play, ChevronRight, Search, X } from "lucide-react";
import { useLogStore } from "@/components/workspace/LogContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { useMachinesAll } from "@/hooks/use-machine";
import { Input } from "@/components/ui/input";
import { MachineStatus } from "./machines/machine-status";
import { Badge } from "./ui/badge";
import { useVirtualizer } from "@tanstack/react-virtual";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { callServerPromise } from "@/lib/call-server-promise";
import { useWorkflowIdInWorkflowPage } from "@/hooks/hook";
import { useCurrentWorkflow } from "@/hooks/use-current-workflow";

export function MachineWorkspaceItem({
  machine,
  index,
  isInWorkspace = false,
}: { machine: any; index: number; isInWorkspace: boolean }) {
  const router = useRouter();
  const { createDynamicSession } = useSessionAPI();
  const [openFocus, setOpenFocus] = useState(false);

  const StartSessionButton = () => {
    return (
      <Button
        variant="outline"
        className="rounded-[9px]"
        onClick={async () => {
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
              machineId: machine.id,
            },
          });
        }}
      >
        Start
        <Play className="ml-2 h-3 w-3" />
      </Button>
    );
  };

  return (
    <div>
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

      <AnimatePresence mode="wait">
        {openFocus && (
          <MachineSelectList
            currentMachine={machine}
            setOpenFocus={setOpenFocus}
          />
        )}
      </AnimatePresence>

      <div
        className={cn(
          "fixed inset-x-0 bottom-4 z-50 mx-auto max-w-[520px] overflow-hidden rounded-md border border-gray-200 shadow-md transition-all",
          openFocus && "drop-shadow-md",
        )}
      >
        <MachineListItem
          key={machine.id}
          index={index}
          machine={machine}
          showMigrateDialog={false}
          overrideRightSide={
            <div className="flex flex-row items-center gap-2">
              {isInWorkspace && (
                <SwitchMachineButton
                  openFocus={openFocus}
                  setOpenFocus={setOpenFocus}
                />
              )}
              <StartSessionButton />
            </div>
          }
          machineActionItemList={<></>}
        />
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

function MachineSelectList({
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
      machines?.filter(
        (machine) =>
          machine.name.toLowerCase().includes(search.toLowerCase()) &&
          machine.id !== currentMachine.id,
      ) ?? [],
    [machines, search, currentMachine.id],
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
      className="-translate-x-1/2 fixed bottom-10 left-1/2 z-50 w-[520px] overflow-hidden rounded-lg border border-gray-200 bg-gray-50 shadow-lg"
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
            placeholder="Search machines..."
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
