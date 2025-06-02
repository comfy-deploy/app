import { MachineVersionListItem } from "@/components/machine/machine-deployment";
import { MachineSettingsWrapper } from "@/components/machine/machine-settings";
import {
  getLastActiveText,
  isMachineDeprecated,
  useHasActiveEvents,
} from "@/components/machines/machine-list-item";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMachineEvents,
  useMachineVersion,
  useMachineVersions,
  useMachineVersionsAll,
} from "@/hooks/use-machine";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
// import { machineRoute } from "@/routes/machines/$machineId";
import {
  AlertCircle,
  DollarSign,
  ExternalLink,
  GitBranch,
  Loader2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { VersionChecker } from "./version-checker";

// -----------------------components-----------------------

function UpdateCustomNodesDialog({
  machine,
  open,
  onOpenChange,
}: {
  machine: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async () => {
      return api({
        url: `machine/${machine.id}/update-custom-nodes`,
        init: {
          method: "POST",
        },
      });
    },
    onSuccess: () => {
      toast.success("Custom nodes update initiated");
      onOpenChange(false);
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey.includes("machine") &&
          query.queryKey.includes(machine.id),
      });
      // queryClient.invalidateQueries({
      //   queryKey: ["machine", machine.id, "versions"],
      // });
      // Remove the action query param
      navigate({
        to: "/machines/$machineId",
        params: { machineId: machine.id },
      });
    },
    onError: (error) => {
      toast.error("Failed to update custom nodes");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Update ComfyUI-Deploy Custom Nodes</DialogTitle>
          <DialogDescription>
            Review the changes and update your machine's custom nodes to the
            latest version.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <VersionChecker
            machineId={machine.id}
            variant="expanded"
            className="w-full"
            hideUpdateButton
          />

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                navigate({
                  to: "/machines/$machineId",
                  params: { machineId: machine.id },
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
              variant="default"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update & Rebuild"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function MachineOverview({ machine }: { machine: any }) {
  const { data: machineVersionsAll, isLoading: isLoadingVersions } =
    useMachineVersionsAll(machine.id);
  const search = useSearch({
    from: "/machines/$machineId/",
  });
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  useEffect(() => {
    if (search?.action === "update-custom-nodes") {
      setIsUpdateDialogOpen(true);
    }
  }, [search?.action]);

  const isDeprecated = isMachineDeprecated(machine);

  const isLatestVersion = useMemo(() => {
    if (isLoadingVersions || !machineVersionsAll) return true;

    return (
      machine?.machine_version_id !== null &&
      machineVersionsAll[0]?.id === machine.machine_version_id
    );
  }, [machine?.machine_version_id, machineVersionsAll, isLoadingVersions]);
  const navigate = useNavigate();

  return (
    <div className="w-full">
      <UpdateCustomNodesDialog
        machine={machine}
        open={isUpdateDialogOpen}
        onOpenChange={(open) => {
          setIsUpdateDialogOpen(open);
          navigate({
            to: "/machines/$machineId",
            params: { machineId: machine.id },
          });
        }}
      />
      <div className="px-4 py-1">
        <MachineAlert
          machine={machine}
          isDeprecated={isDeprecated}
          isLatestVersion={isLatestVersion}
        />
      </div>

      <div className="relative grid grid-cols-1 gap-8 px-4 py-2">
        <MachineVersionWrapper machine={machine} />
        <MachineSettingsWrapper machine={machine} />
        {/* {machine.type === "comfy-deploy-serverless" && (
          <div className="sticky bottom-0 inset-x-0 mx-auto max-w-xl z-20">
            <VersionChecker
              machineId={machine.id}
              variant="inline"
              onUpdate={() => setIsUpdateDialogOpen(true)}
            />
          </div>
        )} */}
      </div>
    </div>
  );
}

function MachineAlert({
  machine,
  isDeprecated,
  isLatestVersion,
}: {
  machine: any;
  isDeprecated: boolean;
  isLatestVersion: boolean;
}) {
  const [showDeprecated, setShowDeprecated] = useState(true);
  const [showImportFailed, setShowImportFailed] = useState(true);
  const [showRollback, setShowRollback] = useState(true);

  const hasImportFailedLogs = useMemo(() => {
    try {
      const failedLogs = JSON.parse(machine.import_failed_logs || "[]");
      return failedLogs.length > 0;
    } catch (error) {
      console.error("Error parsing import failed logs:", error);
      return false;
    }
  }, [machine.import_failed_logs]);

  const renderAlert = (
    show: boolean,
    setShow: (show: boolean) => void,
    variant: "warning" | "destructive",
    title: string,
    description: React.ReactNode,
    bgColor: string,
  ) =>
    show && (
      <Alert variant={variant} className={`rounded-[10px] ${bgColor} relative`}>
        <Button
          onClick={() => setShow(false)}
          className={`absolute top-1 right-1 p-1 hover:bg-${
            variant === "warning" ? "yellow" : "red"
          }-100`}
          variant="ghost"
          size="icon"
        >
          <X className="h-4 w-4" />
        </Button>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
      </Alert>
    );

  const importFailedDescription = useMemo(() => {
    try {
      const failedLogs = JSON.parse(machine.import_failed_logs || "[]");
      return (
        <div className="space-y-2">
          <p>The following custom nodes failed to import:</p>
          <ul className="list-disc space-y-1 pl-4 font-mono">
            {failedLogs.map(
              (log: { logs: string; timestamp: number }, index: number) => (
                <li key={index} className="text-sm">
                  {log.logs}
                </li>
              ),
            )}
          </ul>
        </div>
      );
    } catch (error) {
      return null;
    }
  }, [machine.import_failed_logs]);

  return (
    <div className="flex flex-col gap-2">
      {isDeprecated &&
        renderAlert(
          showDeprecated,
          setShowDeprecated,
          "warning",
          "Deprecated Machine",
          <>
            This machine is running an{" "}
            <span className="font-semibold">outdated version</span> and{" "}
            <span className="font-semibold">no longer supported</span>.
            <br /> Please upgrade to the latest version to ensure compatibility
            and access new features.
          </>,
          "bg-yellow-50",
        )}
      {!isLatestVersion &&
        machine.machine_version_id &&
        machine.status !== "building" &&
        renderAlert(
          showRollback,
          setShowRollback,
          "warning",
          "Rollback Version",
          <div className="mt-2">
            This machine is running a{" "}
            <span className="font-semibold">rollback version</span>. You can
            always switch back to the latest version when ready.
            <br />
            <a
              href="https://comfydeploy.com/docs/v2/machines/rollback"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-yellow-600 hover:text-yellow-700"
            >
              Learn more about Machine Rollback
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>,
          "bg-yellow-50",
        )}
      {hasImportFailedLogs &&
        importFailedDescription &&
        renderAlert(
          showImportFailed,
          setShowImportFailed,
          "destructive",
          "Custom Node Import Failed",
          importFailedDescription,
          "bg-red-50",
        )}
    </div>
  );
}

// -----------------------cards-----------------------

const MachineVersionSkeleton = () => {
  return (
    <div className="grid grid-cols-4 border-b px-4 py-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-8" /> {/* For "v6" */}
        <Skeleton className="h-5 w-16" /> {/* For "Ready" status */}
      </div>
      <Skeleton className="h-5 w-24" /> {/* For "43s (7d ago)" */}
      <Skeleton className="h-5 w-8" /> {/* For "L4" */}
      <Skeleton className="h-5 w-32" /> {/* For "7d ago by Karrix Lee" */}
    </div>
  );
};

export function MachineVersionWrapper({ machine }: { machine: any }) {
  const { data: machineVersion, isLoading: isLoadingMachineVersion } =
    useMachineVersion(machine.id, machine.machine_version_id);
  const { data: machineVersions, isLoading: isLoadingMachineVersions } =
    useMachineVersions(machine.id);

  if (!machineVersion) return null;

  const versions = machineVersions?.pages[0] || [];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col">
        <div className="flex items-center justify-between px-2 font-semibold text-xl">
          Machine History
        </div>
        <CardDescription className="px-2">
          Current version configuration, custom nodes, dependencies, and more.
        </CardDescription>
      </div>
      <div className="flex flex-col">
        <MachineVersionListItem
          machineVersion={machineVersion}
          machine={machine}
        />
        {isLoadingMachineVersions ? (
          machineVersion.version === 1 ? (
            <></>
          ) : machineVersion.version === 2 ? (
            <MachineVersionSkeleton />
          ) : (
            <>
              <MachineVersionSkeleton />
              <MachineVersionSkeleton />
            </>
          )
        ) : (
          versions
            .filter((version) => version.id !== machineVersion.id)
            .slice(0, 2)
            .map((version) => (
              <MachineVersionListItem
                key={version.id}
                machineVersion={version}
                machine={machine}
              />
            ))
        )}
      </div>
      <div className="flex justify-end">
        <Link
          to="/machines/$machineId/history"
          params={{ machineId: machine.id }}
        >
          <div className="flex items-center gap-2 font-normal text-muted-foreground text-sm hover:text-foreground">
            View All
            <GitBranch className="h-4 w-4" />
          </div>
        </Link>
      </div>
    </div>
  );
}

export function LastActiveEvent({ machineId }: { machineId: string }) {
  const { data: events, isLoading } = useMachineEvents(machineId);
  const { hasActiveEvents } = useHasActiveEvents(machineId);
  const navigate = useNavigate();

  return (
    <div className="flex items-center">
      <Badge
        variant="outline"
        className={cn(
          "flex h-6 cursor-pointer items-center gap-2 px-2",
          hasActiveEvents ? "border-yellow-500" : "",
        )}
        onClick={() =>
          navigate({
            to: "/machines/$machineId/activity",
            params: { machineId: machineId },
          })
        }
      >
        <div
          className={cn(
            "h-2 w-2 rounded-full",
            hasActiveEvents
              ? "animate-pulse bg-yellow-500 dark:bg-yellow-400"
              : "bg-gray-400 dark:bg-zinc-400",
          )}
        />
        <span
          className={cn(
            "text-xs",
            hasActiveEvents
              ? "text-yellow-500 dark:text-yellow-400"
              : "text-gray-600 dark:text-zinc-400",
          )}
        >
          Last Active: {getLastActiveText(events)}
        </span>
      </Badge>
    </div>
  );
}

export function MachineCostEstimate({ machineId }: { machineId: string }) {
  const { data: usage, isLoading } = useQuery<any>({
    queryKey: ["platform", "usage"],
  });

  // Calculate cost for this machine
  const machineCost = useMemo(() => {
    const machineUsage = usage?.usage?.find(
      (u: any) => u.machine_id === machineId,
    );
    return machineUsage?.cost || 0;
  }, [usage, machineId]);

  if (isLoading) {
    return <Skeleton className="h-6 w-24" />;
  }

  return (
    <Link to={"/usage"} className="hidden items-center md:flex">
      <Badge variant="outline" className="flex h-6 items-center gap-2 px-2">
        <DollarSign className="h-3 w-3 text-gray-600 dark:text-zinc-400" />
        <span className="text-gray-600 text-xs dark:text-zinc-400">
          ${machineCost.toFixed(2)} / mo
        </span>
      </Badge>
    </Link>
  );
}
