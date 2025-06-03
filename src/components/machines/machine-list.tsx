import { InsertModal } from "@/components/auto-form/auto-form-dialog";
import { Fab } from "@/components/fab";
import {
  customFormSchema,
  serverlessFormSchema,
  sharedMachineConfig,
} from "@/components/machine/machine-schema";
import { MachineListItem } from "@/components/machines/machine-list-item";
import { BulkUpdateDialog } from "@/components/machines/bulk-upgrade-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { VirtualizedInfiniteList } from "@/components/virtualized-infinite-list";
import { useCurrentPlan, useIsBusinessAllowed } from "@/hooks/use-current-plan";
import { useMachines } from "@/hooks/use-machine";
import { api } from "@/lib/api";
import { callServerPromise } from "@/lib/call-server-promise";
import { cn } from "@/lib/utils";
import { comfyui_hash } from "@/utils/comfydeploy-hash";
import { useNavigate } from "@tanstack/react-router";
import {
  Cloud,
  CloudCog,
  EllipsisVertical,
  Plus,
  RefreshCcw,
  Server,
} from "lucide-react";
import { useQueryState } from "nuqs";
import { useCallback, useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Machine {
  id: string;
  name: string;
  type: string;
  status: string;
  machine_builder_version?: string | number;
  // Add other machine properties as needed
}

export function MachineList() {
  const [selectedMachines, setSelectedMachines] = useState<Set<string>>(
    new Set(),
  );
  const [bulkUpgradeDialogOpen, setBulkUpgradeDialogOpen] = useState(false);
  const [searchValue, setSearchValue] = useQueryState("search");
  const [openCustomDialog, setOpenCustomDialog] = useState(false);
  const [openServerlessDialog, setOpenServerlessDialog] = useState(false);
  const [debouncedSearchValue] = useDebounce(searchValue, 250);
  const navigate = useNavigate({ from: "/machines" });

  type TabType = "docker" | "workspace" | "self-hosted";
  const [selectedTab, setSelectedTab] = useState<TabType>(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    return tabParam === "docker" ||
      tabParam === "workspace" ||
      tabParam === "self-hosted"
      ? tabParam
      : "docker";
  });

  const handleTabChange = (value: string) => {
    setSelectedTab(value as TabType);
    navigate({
      search: (prev) => ({ ...prev, tab: value }),
    });
  };

  const sub = useCurrentPlan();
  const hasActiveSub = !sub || !!sub?.sub;
  const isBusinessAllowed = useIsBusinessAllowed();

  const query = useMachines(
    debouncedSearchValue ?? undefined,
    20,
    undefined,
    false,
    selectedTab === "workspace",
    selectedTab === "self-hosted",
    selectedTab === "docker",
  );

  // Memoize the flattened machine data to prevent unnecessary re-renders
  const machineData = useMemo(() => {
    return query.data?.pages.flat() || [];
  }, [query.data]);

  // Calculate total machines across all loaded pages
  const totalLoadedMachines = useMemo(() => {
    if (!query.data?.pages) return 0;
    return query.data.pages.reduce((total, page) => total + page.length, 0);
  }, [query.data]);

  // Calculate checkbox state based on all loaded machines
  const isAllSelected = useMemo(() => {
    if (totalLoadedMachines === 0) return false;
    if (selectedMachines.size === 0) return false;

    // Check if all loaded machines are selected
    for (const page of query.data?.pages || []) {
      for (const machine of page) {
        if (!selectedMachines.has(machine.id)) {
          return false;
        }
      }
    }
    return true;
  }, [totalLoadedMachines, selectedMachines, query.data]);

  const isPartiallySelected = selectedMachines.size > 0 && !isAllSelected;

  return (
    <div className="mx-auto h-[calc(100vh-100px)] max-h-full w-full p-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Input
              placeholder="Filter machines..."
              value={searchValue ?? ""}
              onChange={(event) => setSearchValue(event.target.value)}
              className="pr-12"
            />
            <kbd className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-3 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-[10px] text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>

          {query.data?.pages[0] && query.data.pages[0].length > 0 && (
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      layout
                      className="group flex w-fit items-center gap-2 rounded-full border bg-white/80 px-4 py-2 shadow-sm transition-all hover:border-gray-300 hover:shadow-md dark:bg-zinc-900"
                      transition={{
                        layout: {
                          duration: 0.15,
                          ease: "easeOut",
                        },
                      }}
                    >
                      <Checkbox
                        id="select-all"
                        checked={
                          isAllSelected
                            ? true
                            : isPartiallySelected
                              ? "indeterminate"
                              : false
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            const allMachineIds = new Set<string>();
                            for (const page of query.data?.pages || []) {
                              for (const machine of page) {
                                allMachineIds.add(machine.id);
                              }
                            }
                            setSelectedMachines(allMachineIds);
                          } else {
                            setSelectedMachines(new Set());
                          }
                        }}
                        className="data-[state=checked]:border-primary data-[state=indeterminate]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:bg-primary"
                      />
                      <label
                        htmlFor="select-all"
                        className="cursor-pointer select-none whitespace-nowrap font-medium text-muted-foreground text-xs group-hover:text-gray-900 dark:group-hover:text-zinc-300"
                      >
                        Select All
                      </label>
                      <AnimatePresence>
                        {selectedMachines.size > 0 && (
                          <>
                            {/* <div className="mx-2 h-4 w-[1px] bg-gray-300" /> */}
                            <motion.span
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: "auto" }}
                              exit={{ opacity: 0, width: 0 }}
                              className="whitespace-nowrap font-medium text-gray-500 text-xs"
                              transition={{ duration: 0.15 }}
                            >
                              {selectedMachines.size} of {totalLoadedMachines}
                            </motion.span>
                          </>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {isAllSelected
                        ? "Click to deselect all machines"
                        : isPartiallySelected
                          ? "Click to select all machines"
                          : "Select all machines to perform bulk actions"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <AnimatePresence>
                {selectedMachines.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                    transition={{ duration: 0.15 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex h-auto items-center gap-1.5 rounded-full px-3 py-1.5"
                      onClick={() => setBulkUpgradeDialogOpen(true)}
                    >
                      <RefreshCcw className="h-3.5 w-3.5" />
                      <span className="text-xs">Bulk Update</span>
                    </Button>
                    {/* <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto rounded-full px-3 py-1.5 text-xs"
                      onClick={() => setSelectedMachines(new Set())}
                    >
                      Clear
                    </Button> */}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        <Tabs value={selectedTab} onValueChange={handleTabChange}>
          <motion.div className="inline-flex items-center rounded-lg bg-white/95 py-0.5 ring-1 ring-gray-200/50 dark:bg-zinc-900">
            <TabsList className="relative flex w-fit gap-1 bg-transparent">
              <motion.div layout className="relative">
                <TabsTrigger
                  value="docker"
                  className={cn(
                    "rounded-md px-4 py-1.5 font-medium text-sm transition-all",
                    selectedTab === "docker"
                      ? "bg-gradient-to-b from-white to-gray-100 shadow-sm ring-1 ring-gray-200/50 dark:from-zinc-800 dark:to-zinc-700 dark:ring-zinc-700"
                      : "text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-700",
                  )}
                >
                  Docker Machine
                </TabsTrigger>
              </motion.div>
              <motion.div layout className="relative">
                <TabsTrigger
                  value="self-hosted"
                  className={cn(
                    "rounded-md px-4 py-1.5 font-medium text-sm transition-all",
                    selectedTab === "self-hosted"
                      ? "bg-gradient-to-b from-white to-gray-100 shadow-sm ring-1 ring-gray-200/50 dark:from-zinc-800 dark:to-zinc-700 dark:ring-zinc-700"
                      : "text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-700",
                  )}
                >
                  Self Hosted
                </TabsTrigger>
              </motion.div>
              {/* <motion.div layout className="relative">
                <TabsTrigger
                  value="workspace"
                  className={cn(
                    "rounded-md px-4 py-1.5 font-medium text-sm transition-all",
                    selectedTab === "workspace"
                      ? "bg-gradient-to-b from-white to-gray-100 shadow-sm ring-1 ring-gray-200/50"
                      : "text-gray-600 hover:bg-gray-100",
                  )}
                >
                  Workspace
                </TabsTrigger>
              </motion.div> */}
            </TabsList>
          </motion.div>
        </Tabs>
      </div>

      {query.isLoading ? (
        <div className="mx-auto w-full max-w-screen-2xl overflow-clip rounded-xl border">
          {[...Array(8)].map((_, i) => (
            <div
              key={`loading-${i}`}
              className="flex h-[68px] w-full animate-pulse items-center justify-between border-b bg-white p-4 dark:bg-zinc-900"
            >
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-row items-center gap-2">
                    <div className="h-[10px] w-[10px] rounded-full bg-gray-200 dark:bg-zinc-700" />
                    <div className="h-4 w-60 rounded bg-gray-200 dark:bg-zinc-700" />
                  </div>
                  <div className="h-3 w-32 rounded bg-gray-200 dark:bg-zinc-700" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-12 rounded-md bg-gray-200 dark:bg-zinc-700" />
                <div className="h-5 w-20 rounded-md bg-gray-200 dark:bg-zinc-700" />
                <div className="h-5 w-12 rounded-md bg-gray-200 dark:bg-zinc-700" />
                <Button variant="ghost" size="icon">
                  <EllipsisVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : query.data?.pages[0].length === 0 ? (
        <div className="mx-auto w-full max-w-screen-2xl">
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-xl border bg-white/50 p-8 text-center dark:bg-zinc-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Server className="h-6 w-6 text-primary" />
            </div>
            <div>
              {selectedTab === "workspace" ? (
                <>
                  <h3 className="font-semibold text-lg">No Workspace Found</h3>
                  <p className="text-muted-foreground text-sm">
                    Create your first workspace to get started with ComfyUI
                  </p>
                </>
              ) : (
                <>
                  <h3 className="font-semibold text-lg">No machines found</h3>
                  <p className="text-muted-foreground text-sm">
                    Get started by creating your first machine
                  </p>
                </>
              )}
            </div>
            {selectedTab === "workspace" ? (
              <Button
                onClick={() => {
                  navigate({ to: "/home" });
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Workspace
              </Button>
            ) : (
              <Button
                onClick={() => {
                  if (!sub?.features.machineLimited) {
                    navigate({
                      search: { view: "create" },
                    });
                  }
                }}
                disabled={sub?.features.machineLimited}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Machine
              </Button>
            )}
          </div>
        </div>
      ) : (
        <VirtualizedInfiniteList
          className="!h-full fab-machine-list mx-auto w-full max-w-screen-2xl rounded-xl border"
          containerClassName="divide-y divide-border"
          queryResult={query}
          renderItem={(machine: Machine, index) => (
            <MachineListItem
              machine={machine as any}
              key={machine.id}
              index={index}
              machineId={machine.id}
              refetchQuery={query.refetch}
              selectedTab={selectedTab}
              isSelected={selectedMachines.has(machine.id)}
              onSelectionChange={(machineId, selected) => {
                setSelectedMachines((prev) => {
                  const newSet = new Set(prev);
                  if (selected) {
                    newSet.add(machineId);
                  } else {
                    newSet.delete(machineId);
                  }
                  return newSet;
                });
              }}
            />
          )}
          renderLoading={() => {
            return [...Array(4)].map((_, i) => (
              <div
                key={`loading-item-${i}`}
                className="flex h-[80px] w-full animate-pulse items-center justify-between border bg-white p-4 dark:bg-zinc-900"
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-row items-center gap-2">
                      <div className="h-[10px] w-[10px] rounded-full bg-gray-200 dark:bg-zinc-700" />
                      <div className="h-4 w-60 rounded bg-gray-200 dark:bg-zinc-700" />
                    </div>
                    <div className="h-3 w-32 rounded bg-gray-200 dark:bg-zinc-700" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-12 rounded-md bg-gray-200 dark:bg-zinc-700" />
                  <div className="h-5 w-20 rounded-md bg-gray-200 dark:bg-zinc-700" />
                  <div className="h-5 w-12 rounded-md bg-gray-200 dark:bg-zinc-700" />
                  <Button variant="ghost" size="icon">
                    <EllipsisVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ));
          }}
          estimateSize={68}
        />
      )}

      <InsertModal
        hideButton
        open={openCustomDialog}
        mutateFn={query.refetch}
        setOpen={setOpenCustomDialog}
        title="Self Hosted Machine"
        disabled={!hasActiveSub}
        tooltip={!hasActiveSub ? "Upgrade in pricing tab!" : ""}
        description="Add self hosted comfyui machines to your account."
        serverAction={async (data) => {
          console.log("custom machine", data);
          try {
            const machine = await api({
              url: "machine/custom",
              init: {
                method: "POST",
                body: JSON.stringify(data),
              },
            });
            console.log("machine", machine);
            toast.success(`${data.name} created successfully!`);
            // toast.info("Redirecting to machine page...");
            await new Promise((resolve) => setTimeout(resolve, 1000));
            navigate({
              to: "/machines/$machineId",
              params: { machineId: machine.id },
              search: { view: undefined },
            });
            return {}; // Return empty object since we're handling navigation manually
          } catch (error) {
            toast.error(`Failed to create: ${error}`);
            throw error;
          }
        }}
        formSchema={customFormSchema}
      />

      <InsertModal
        hideButton
        open={openServerlessDialog}
        mutateFn={query.refetch}
        setOpen={setOpenServerlessDialog}
        disabled={sub?.features.machineLimited}
        dialogClassName="!max-w-[1200px] !max-h-[calc(90vh-10rem)]"
        containerClassName="flex-col"
        tooltip={
          sub?.features.machineLimited
            ? `Max ${sub?.features.machineLimit} ComfyUI machine for your account, upgrade to unlock more configuration.`
            : `Max ${sub?.features.machineLimit} ComfyUI machine for your account`
        }
        title="Create New Machine"
        description="Create a new serverless ComfyUI machine based on the analyzed workflow."
        serverAction={async (data: any) => {
          try {
            const machine = await api({
              url: "machine/serverless",
              init: {
                method: "POST",
                body: JSON.stringify(data),
              },
            });

            toast.success(`${data.name} created successfully!`);
            // toast.info("Redirecting to machine page...");
            await new Promise((resolve) => setTimeout(resolve, 1000));
            navigate({
              to: "/machines/$machineId",
              params: { machineId: machine.id },
              search: { view: "history" },
            });

            return {}; // Return empty object since we're handling navigation manually
          } catch (error) {
            toast.error(`Failed to create: ${error}`);
            throw error;
          }
        }}
        formSchema={serverlessFormSchema}
        fieldConfig={sharedMachineConfig}
        data={{
          name: "My Machine",
          gpu: "A10G",
          comfyui_version: comfyui_hash,
          machine_builder_version: "4",
          docker_command_steps: {
            steps: [],
          },

          // default values
          allow_concurrent_inputs: 1,
          concurrency_limit: 2,
          run_timeout: 300,
          idle_timeout: 60,
          ws_timeout: 2,
          python_version: "3.11",
        }}
      />

      {/* Bulk update dialog */}
      <BulkUpdateDialog
        selectedMachines={Array.from(selectedMachines)}
        machineData={machineData}
        open={bulkUpgradeDialogOpen}
        onOpenChange={setBulkUpgradeDialogOpen}
        onSuccess={() => {
          setSelectedMachines(new Set());
          query.refetch();
        }}
      />

      <Fab
        refScrollingContainerKey="fab-machine-list"
        mainItem={{
          name: "Create Machine",
          icon: Plus,
        }}
        disabled={{
          disabled: sub?.features.machineLimited,
          disabledText: "Max Machines Exceeded. ",
        }}
        subItems={[
          {
            name: sub
              ? `Docker Machine (${sub.features.currentMachineCount}/${sub.features.machineLimit})`
              : "Docker Machine",
            icon: Cloud,
            onClick: () => {
              if (!sub?.features.machineLimited) {
                navigate({
                  search: { view: "create" },
                });
              }
            },
            disabled: {
              disabled: sub?.features.machineLimited,
              disabledText: `Max ${sub?.features.machineLimit} Docker machines for your account. Upgrade to create more machines.`,
            },
          },
          {
            name: "Self Hosted Machine",
            icon: Server,
            onClick: () => {
              if (!sub?.features.machineLimited && isBusinessAllowed) {
                setOpenCustomDialog(true);
              }
            },
            disabled: {
              disabled: !isBusinessAllowed || sub?.features.machineLimited,
              disabledText: sub?.features.machineLimited
                ? `Max ${sub?.features.machineLimit} Self-hosted machines for your account. Upgrade to create more machines.`
                : "Upgrade to Business plan to create self-hosted machines.",
            },
          },
        ]}
      />
    </div>
  );
}

interface MachineDialogProps {
  machine: any;
  refetch?: () => void;
  dialogOpen: boolean;
  setDialogOpen: (dialogOpen: boolean) => void;
}

export function DeleteMachineDialog({
  machine,
  refetch,
  planRefetch,
  dialogOpen,
  setDialogOpen,
}: MachineDialogProps & { planRefetch?: () => void }) {
  const navigate = useNavigate();

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className={cn("sm:max-w-[425px]")}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {"Delete"} <Badge variant={"secondary"}>{machine.name}</Badge>
          </DialogTitle>
          <DialogDescription className="text-primary">
            Careful this is destructive and cannot be undone.
            {machine.type === "workspace" && (
              <>
                <br />
                <br />
                Deleting Workspaces will remove all outputs, contact us if you
                want to save your configuration
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex w-full justify-end gap-2">
          <Button
            className="w-fit"
            variant={"outline"}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();

              setDialogOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            className="w-fit"
            variant="destructive"
            onClick={async (e) => {
              e.stopPropagation();
              e.preventDefault();

              if (machine?.keep_warm !== undefined && machine.keep_warm > 0) {
                toast.error(
                  "Please set keep warm to 0 before deleting the machine.",
                );
                return;
              }

              await callServerPromise(
                api({
                  url: `machine/${machine.id}`,
                  init: {
                    method: "DELETE",
                  },
                }),
                {
                  loadingText: "Deleting machine",
                  errorAction: {
                    name: "Force delete",
                    action: async () => {
                      await callServerPromise(
                        api({
                          url: `machine/${machine.id}`,
                          init: {
                            method: "DELETE",
                          },
                          params: {
                            force: true,
                          },
                        }),
                        {
                          loadingText: "Deleting machine",
                        },
                      );
                      await planRefetch();
                    },
                  },
                },
              );

              await refetch();
              setDialogOpen(false);

              navigate({
                to: "/machines",
                search: { view: undefined },
              });
            }}
          >
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RebuildMachineDialog({
  machine,
  refetch,
  dialogOpen,
  setDialogOpen,
}: MachineDialogProps) {
  const navigate = useNavigate();
  const oldVersion = machine.machine_builder_version < 4;

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className={cn("sm:max-w-[425px]")}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {"Rebuild"} <Badge variant={"secondary"}>{machine.name}</Badge>
          </DialogTitle>
          <DialogDescription className="text-primary">
            Rebuild the machine to get the latest version of the machine builder
            or resolve any build issues.
            {oldVersion && (
              <div className="mt-4 rounded-md border-2 border-yellow-500/20 bg-yellow-500/10 p-3">
                <div className="flex items-center gap-2 text-yellow-700">
                  <CloudCog className="h-5 w-5" />
                  <span className="font-semibold">Version Update Required</span>
                </div>
                <p className="mt-1 text-yellow-700">
                  Your current version{" "}
                  <Badge
                    variant="red"
                    className="border-yellow-500 text-yellow-700"
                  >
                    v{machine.machine_builder_version}
                  </Badge>{" "}
                  is <span className="font-semibold">no longer supported</span>.
                  The machine will be automatically upgraded to{" "}
                  <Badge
                    variant="green"
                    className="border-yellow-500 text-yellow-700"
                  >
                    v4
                  </Badge>{" "}
                  after rebuild.
                </p>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex w-full justify-end gap-2">
          <div className="flex gap-2">
            <Button
              className="w-fit"
              variant={"outline"}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              className="w-fit"
              onClick={async (e) => {
                e.stopPropagation();
                e.preventDefault();
                try {
                  await callServerPromise(
                    api({
                      url: `machine/serverless/${machine.id}`,
                      init: {
                        method: "PATCH",
                        body: JSON.stringify({
                          is_trigger_rebuild: true,
                          ...(oldVersion && {
                            machine_builder_version: 4,
                          }),
                        }),
                      },
                    }),
                    {
                      loadingText: "Rebuilding machine",
                      successMessage: "Redirecting to machine page...",
                      onSuccess: () => {
                        navigate({
                          to: "/machines/$machineId",
                          params: { machineId: machine.id },
                        });
                      },
                    },
                  );
                  await new Promise((resolve) => setTimeout(resolve, 1000));
                } catch {
                  toast.error("Failed to rebuild machine");
                }
                setDialogOpen(false);
              }}
            >
              Confirm
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
