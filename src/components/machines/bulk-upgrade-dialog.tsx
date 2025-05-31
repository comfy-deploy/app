"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import { callServerPromise } from "@/lib/call-server-promise";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircleIcon, Info, Loader2, RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface CustomNodesVersionResponse {
  status: string;
  local_commit: {
    hash: string;
    message: string;
    date: string;
  };
  latest_commit: {
    hash: string;
    message: string;
    date: string;
  };
  is_up_to_date: boolean;
}

interface Machine {
  id: string;
  name: string;
  type: string;
  status: string;
  machine_builder_version?: string | number;
}

interface BulkUpdateDialogProps {
  selectedMachines: string[];
  machineData: Machine[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface UpdateStatus {
  machineId: string;
  status: "pending" | "processing" | "success" | "error";
  message?: string;
}

export function BulkUpdateDialog({
  selectedMachines,
  machineData,
  open,
  onOpenChange,
  onSuccess,
}: BulkUpdateDialogProps) {
  const queryClient = useQueryClient();
  const [upgradeStatuses, setUpgradeStatuses] = useState<UpdateStatus[]>([]);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [currentMachineIndex, setCurrentMachineIndex] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [customNodesData, setCustomNodesData] = useState<
    Record<string, CustomNodesVersionResponse>
  >({});
  const [isLoading, setIsLoading] = useState(true);

  // Memoize the filtered machines to prevent unnecessary re-renders
  const selectedMachineData = useMemo(() => {
    return machineData.filter((machine) =>
      selectedMachines.includes(machine.id),
    );
  }, [machineData, selectedMachines]);

  const machinesToUpgrade = machineData.filter(
    (machine: Machine) =>
      machine.type === "comfy-deploy-serverless" &&
      machine.status === "ready" &&
      selectedMachines.includes(machine.id) &&
      customNodesData[machine.id] &&
      !customNodesData[machine.id].is_up_to_date,
  );

  useEffect(() => {
    console.log([open, selectedMachines, selectedMachineData]);
    if (open && selectedMachines.length > 0) {
      setIsLoading(true);
      const fetchCustomNodesStatus = async () => {
        const statusData: Record<string, CustomNodesVersionResponse> = {};

        const promises = selectedMachines.map(async (machineId) => {
          try {
            const machine = selectedMachineData.find(
              (m: Machine) => m.id === machineId,
            );
            if (
              machine?.type === "comfy-deploy-serverless" &&
              machine?.status === "ready"
            ) {
              const response = await api({
                url: `machine/${machineId}/check-custom-nodes`,
              });

              return { machineId, response };
            }
          } catch (error) {
            console.error(
              `Error fetching custom nodes status for machine ${machineId}:`,
              error,
            );
          }
        });

        const results = await Promise.all(promises);

        results.map((result) => {
          if (result) {
            statusData[result.machineId] = result.response;
          }
        });

        setCustomNodesData(statusData);
        setIsLoading(false);
      };

      fetchCustomNodesStatus();
    }
  }, [open]);

  const handleUpgrade = async () => {
    if (machinesToUpgrade.length === 0) {
      toast.error("No machines selected that require custom nodes update");
      onOpenChange(false);
      return;
    }

    setIsUpgrading(true);

    const initialStatuses = machinesToUpgrade.map((machine: Machine) => ({
      machineId: machine.id,
      status: "pending" as const,
    }));
    setUpgradeStatuses(initialStatuses);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < machinesToUpgrade.length; i++) {
      const machine = machinesToUpgrade[i];
      setCurrentMachineIndex(i);

      setUpgradeStatuses((prev) =>
        prev.map((status) =>
          status.machineId === machine.id
            ? { ...status, status: "processing" }
            : status,
        ),
      );

      try {
        await callServerPromise(
          api({
            url: `machine/${machine.id}/update-custom-nodes`,
            init: {
              method: "POST",
            },
          }),
          {
            loadingText: `Updating custom nodes ${i + 1}/${machinesToUpgrade.length}...`,
          },
        );

        queryClient.invalidateQueries({
          predicate: (query) =>
            query.queryKey.includes("machine") &&
            query.queryKey.includes(machine.id),
        });

        setUpgradeStatuses((prev) =>
          prev.map((status) =>
            status.machineId === machine.id
              ? { ...status, status: "success" }
              : status,
          ),
        );
        successCount++;
      } catch (error) {
        console.error(
          `Error updating custom nodes for machine ${machine.id}:`,
          error,
        );

        setUpgradeStatuses((prev) =>
          prev.map((status) =>
            status.machineId === machine.id
              ? {
                  ...status,
                  status: "error",
                  message:
                    error instanceof Error ? error.message : "Unknown error",
                }
              : status,
          ),
        );
        errorCount++;
      }

      const progress = Math.round(((i + 1) / machinesToUpgrade.length) * 100);
      setOverallProgress(progress);
    }

    if (errorCount === 0) {
      toast.success(
        `Successfully updated custom nodes for ${successCount} machines`,
      );
    } else if (successCount === 0) {
      toast.error(
        `Failed to update custom nodes for all ${errorCount} machines`,
      );
    } else {
      toast.info(
        `Updated custom nodes for ${successCount} machines, failed to update ${errorCount} machines`,
      );
    }

    onSuccess();
    setIsUpgrading(false);
  };

  const resetState = () => {
    setUpgradeStatuses([]);
    setIsUpgrading(false);
    setCurrentMachineIndex(0);
    setOverallProgress(0);
    setCustomNodesData({});
    setIsLoading(true);
  };

  const handleClose = () => {
    if (!isUpgrading) {
      resetState();
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Bulk Update ComfyDeploy Plugin</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground text-sm">
                  Checking custom nodes status...
                </span>
              </div>
            ) : machinesToUpgrade.length > 0 ? (
              <>
                <p>
                  You are about to update custom nodes for{" "}
                  {machinesToUpgrade.length} machines. This process:
                </p>
                <ul className="list-disc pl-4 text-sm">
                  <li>Updates ComfyUI-Deploy custom nodes to latest version</li>
                  <li>Preserves your workflow configurations</li>
                  <li>Rebuilds each machine</li>
                </ul>

                <div className="mt-4 space-y-2">
                  <p className="font-medium text-sm">Selected machines:</p>
                  <div className="max-h-32 overflow-y-auto rounded border p-2">
                    {machinesToUpgrade.map((machine: Machine) => {
                      const customNodesInfo = customNodesData[machine.id];
                      return (
                        <div
                          key={machine.id}
                          className="flex items-center justify-between py-1"
                        >
                          <span className="text-sm">{machine.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {customNodesInfo?.local_commit?.hash?.slice(0, 7) ||
                              "Unknown"}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Alert variant="warning" className="mt-2 bg-yellow-50">
                  <AlertCircleIcon className="h-4 w-4" />
                  <AlertTitle>Production Deployments</AlertTitle>
                  <AlertDescription>
                    If you have any active production deployments using these
                    machines, it is{" "}
                    <span className="font-semibold">
                      recommended to clone new machines{" "}
                    </span>
                    and migrate to make sure your workflows are not affected.
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              <Alert variant="destructive" className="mt-2">
                <AlertCircleIcon className="h-4 w-4" />
                <AlertTitle>No Eligible Machines</AlertTitle>
                <AlertDescription>
                  None of the selected machines require custom nodes updates.
                  Please select machines that have outdated custom nodes.
                </AlertDescription>
              </Alert>
            )}

            {isUpgrading && (
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      Overall Progress
                    </span>
                    <span className="text-sm">{overallProgress}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-2" />
                </div>

                <div className="space-y-2">
                  <p className="font-medium text-sm">Machine Status:</p>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {upgradeStatuses.map((status) => {
                      const machine = machineData.find(
                        (m: Machine) => m.id === status.machineId,
                      );
                      return (
                        <div
                          key={status.machineId}
                          className={cn(
                            "flex items-center justify-between rounded border p-2",
                            status.status === "success" &&
                              "border-green-200 bg-green-50",
                            status.status === "error" &&
                              "border-red-200 bg-red-50",
                            status.status === "processing" &&
                              "border-blue-200 bg-blue-50",
                          )}
                        >
                          <span className="text-sm">{machine?.name}</span>
                          <Badge
                            variant={
                              status.status === "success"
                                ? "success"
                                : status.status === "error"
                                  ? "destructive"
                                  : status.status === "processing"
                                    ? "default"
                                    : "outline"
                            }
                            className="text-xs"
                          >
                            {status.status === "pending" && "Pending"}
                            {status.status === "processing" && "Processing"}
                            {status.status === "success" && "Success"}
                            {status.status === "error" && "Failed"}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isUpgrading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleUpgrade}
            disabled={isUpgrading || machinesToUpgrade.length === 0}
            className={cn(
              "flex items-center gap-2",
              isUpgrading && "cursor-not-allowed opacity-50",
            )}
          >
            {isUpgrading ? (
              "Updating..."
            ) : (
              <>
                <RefreshCcw className="h-4 w-4" />
                Update Custom Nodes
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
