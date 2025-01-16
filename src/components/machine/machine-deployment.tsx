import { BuildStepsUI } from "@/components/machine/machine-build-log";
import {
  type Change,
  CommandChanges,
  CustomNodeChanges,
  type DiffViewerProps,
  FieldChanges,
  processChanges,
} from "@/components/machine/machine-version-diff";
import { CustomNodeList } from "@/components/machines/custom-node-list";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingIcon } from "@/components/ui/custom/loading-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { VirtualizedInfiniteList } from "@/components/virtualized-infinite-list";
import { useCurrentPlan } from "@/hooks/use-current-plan";
import { useMachineVersion, useMachineVersions } from "@/hooks/use-machine";
import { useUserInfo } from "@/hooks/use-user-info";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { differenceInSeconds } from "date-fns";
import {
  CheckCircle,
  ChevronDown,
  ChevronRight,
  CircleArrowUp,
  CircleX,
  Ellipsis,
  ExternalLink,
  HardDrive,
  Library,
  Lock,
  Puzzle,
  RotateCcw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function formatExactTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

export function formatShortDistanceToNow(date: Date): string {
  const seconds = differenceInSeconds(new Date(), date);
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Then in your UserInfo component
const UserInfoForDeployment = ({ machineVersion }: { machineVersion: any }) => {
  const { data: user, isLoading } = useUserInfo(machineVersion.user_id);

  if (isLoading || !user) return null;

  return (
    <div className="flex items-center gap-3">
      <span className="text-gray-500 text-xs">
        {formatShortDistanceToNow(new Date(machineVersion.created_at))} by{" "}
        {user.username ?? `${user.first_name} ${user.last_name}`}
      </span>
      <img
        src={user.image_url ?? ""}
        alt={`${user.first_name}'s avatar`}
        className="h-[22px] w-[22px] rounded-full"
      />
    </div>
  );
};

const MachineStatusBadge = ({
  status,
  createdAt,
}: {
  status: string;
  createdAt?: string;
}) => {
  if (!status) return null;

  const isStale =
    status === "building" &&
    createdAt &&
    differenceInSeconds(new Date(), new Date(createdAt)) > 3600;

  return (
    <>
      <div className="flex shrink-0 items-center justify-center">
        <div
          className={`h-[9px] w-[9px] animate-pulse rounded-full ${
            isStale
              ? "bg-gray-500"
              : status === "ready"
                ? "bg-green-500"
                : status === "error"
                  ? "bg-red-500"
                  : status === "building"
                    ? "bg-yellow-500"
                    : "bg-gray-500"
          }`}
        />
      </div>
      <span className="truncate text-gray-600 text-sm">
        {isStale ? "Stale" : status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    </>
  );
};

export const LoadingMachineVerSkeleton = () => {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="mb-4 rounded-[8px] border bg-white p-4 shadow-sm"
        >
          <div className="grid grid-cols-[minmax(120px,1fr)_minmax(150px,1fr)_minmax(180px,2fr)_auto] items-center gap-x-4">
            {/* ID and Version */}
            <div className="grid grid-cols-1 gap-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-12" />
            </div>

            {/* Status and Time */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>

            {/* GPU and Nodes */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-40" />
            </div>

            {/* User Info */}
            <div className="flex items-center gap-2 justify-self-end">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-[22px] w-[22px] rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export function MachineDeployment(props: { machine: any }) {
  const { machine } = props;
  const query = useMachineVersions(machine.id);
  const [estimatedSize, setEstimatedSize] = useState(41);

  useEffect(() => {
    const updateSize = () => {
      setEstimatedSize(window.innerWidth < 768 ? 330 : 41);
    };

    updateSize();

    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  if (!machine.machine_version_id || machine.machine_version_id === null) {
    return !machine?.build_log ? (
      <div className="flex h-full w-full items-center justify-center">
        <span className="text-gray-500">No logs found</span>
      </div>
    ) : (
      <BuildStepsUI machine={machine} logs={JSON.parse(machine.build_log)} />
    );
  }

  if (query.isLoading) {
    return (
      <div className="mx-auto h-[calc(100vh-100px)] max-h-full w-full max-w-[1500px] px-2 py-4 md:px-4">
        <LoadingMachineVerSkeleton />
      </div>
    );
  }

  if (!query.data?.pages[0]?.length) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <span className="text-gray-500">No deployments or logs found</span>
      </div>
    );
  }

  return (
    <>
      <h3 className="px-2 pt-4 font-semibold text-xl md:px-4">
        Machine History
      </h3>
      <a
        href="https://www.comfydeploy.com/docs/v2/machines/versioning"
        target="_blank"
        className="flex cursor-pointer flex-row items-center gap-x-1 px-2 text-gray-500 text-xs hover:text-gray-600 hover:underline md:px-4"
        rel="noreferrer"
      >
        Learn more about machine version control
        <ExternalLink className="h-3 w-3" />
      </a>
      <div className="mx-auto h-[calc(100vh-120px)] max-h-full w-full max-w-[1500px] px-2 py-4 md:px-4">
        <VirtualizedInfiniteList
          className="!h-full fab-machine-list w-full"
          queryResult={query}
          renderItem={(machineVersion) => (
            <div className="flex flex-col">
              <MachineVersionListItem
                machineVersion={machineVersion}
                machine={machine}
              />
            </div>
          )}
          estimateSize={estimatedSize}
          renderLoading={() => <LoadingMachineVerSkeleton />}
        />
      </div>
    </>
  );
}

export function MachineVersionListItem({
  machineVersion,
  machine,
}: {
  machineVersion: any;
  machine: any;
}) {
  const navigate = useNavigate({
    from: "/machines/$machineId",
  });
  const sub = useCurrentPlan();
  const isBusinessOrEnterprise = Boolean(
    sub?.plans?.plans[0] &&
      ["business", "enterprise"].includes(sub.plans.plans[0].toLowerCase()),
  );

  // Single state to track the build start time
  const [buildStartTime, setBuildStartTime] = useState<Date | null>(null);

  // Modify useEffect to check for stale builds
  useEffect(() => {
    if (machineVersion.status === "building") {
      const startTime = new Date(machineVersion.created_at);
      const isStale = differenceInSeconds(new Date(), startTime) > 3600; // 1 hour

      if (isStale) {
        setBuildStartTime(null);
        return;
      }

      if (!buildStartTime) {
        setBuildStartTime(startTime);
      }

      const interval = setInterval(() => {
        if (buildStartTime) {
          setBuildStartTime(new Date(buildStartTime.getTime()));
        }
      }, 1000);

      return () => clearInterval(interval);
    }
    setBuildStartTime(null);
  }, [machineVersion.status, buildStartTime, machineVersion.created_at]);

  return (
    <div className="border-b px-4 hover:bg-gray-100">
      <div className="grid grid-cols-[minmax(120px,1fr)_minmax(150px,1fr)_minmax(100px,1fr)_minmax(250px,auto)] items-center gap-x-4">
        {/* Wrap only the content that should be clickable in Link */}
        <Link
          key={machineVersion.id}
          className="contents"
          to={`/machines/${machine.id}/${machineVersion.id}`}
        >
          {/* ID and Version */}
          <div className="grid grid-cols-1 gap-y-1 min-w-0 cursor-pointer">
            <div className="flex flex-row gap-x-2 items-center">
              <div className="bg-gray-100 leading-snug px-2 py-0 rounded-md text-gray-500 text-xs w-fit">
                v{machineVersion.version}
              </div>
              {machineVersion.id === machine.machine_version_id && (
                <Badge
                  variant="green"
                  className="flex items-center gap-x-1 !text-2xs"
                >
                  <CircleArrowUp className="h-3 w-3" />
                  <span>Current</span>
                </Badge>
              )}
            </div>
          </div>

          {/* Status and Time */}
          <div className="flex flex-row gap-4">
            <div className="flex min-w-0 items-center gap-x-1.5">
              <MachineStatusBadge
                status={machineVersion.status}
                createdAt={machineVersion.created_at}
              />
              {machineVersion.status === "building" ? (
                <LoadingIcon className="h-[14px] w-[14px] shrink-0 text-gray-600" />
              ) : (
                <div className="w-[14px] shrink-0" />
              )}
            </div>

            <span className="truncate text-gray-500 text-sm">
              {machineVersion.status === "building"
                ? differenceInSeconds(
                    new Date(),
                    new Date(machineVersion.created_at),
                  ) > 3600
                  ? "-"
                  : formatExactTime(
                      buildStartTime
                        ? differenceInSeconds(new Date(), buildStartTime)
                        : 0,
                    )
                : machineVersion.created_at === machineVersion.updated_at
                  ? "-"
                  : `${formatExactTime(
                      differenceInSeconds(
                        new Date(machineVersion.updated_at),
                        new Date(machineVersion.created_at),
                      ),
                    )} (${formatShortDistanceToNow(
                      new Date(machineVersion.updated_at),
                    )})`}
            </span>
          </div>

          {/* GPU and Nodes */}
          <div className="grid grid-cols-[auto,1fr] items-center gap-x-2">
            <HardDrive className="h-[14px] w-[14px] shrink-0" />
            <div className="flex items-center">
              <span className="text-xs text-gray-600">
                {machineVersion.gpu}
              </span>
            </div>
          </div>
        </Link>

        {/* Keep interactive elements outside of Link */}
        <div className="justify-self-end flex flex-row gap-x-2 items-center">
          <UserInfoForDeployment machineVersion={machineVersion} />
          <InstantRollback
            machineVersion={machineVersion}
            machine={machine}
            isBusinessOrEnterprise={isBusinessOrEnterprise}
          />
        </div>
      </div>
    </div>
  );
}

function InstantRollback({
  machineVersion,
  machine,
  isBusinessOrEnterprise,
}: {
  machineVersion: any;
  machine: any;
  isBusinessOrEnterprise: boolean;
}) {
  const [rollbackAlertOpen, setRollbackAlertOpen] = useState(false);
  const { data: currentMachineVersion } = useMachineVersion(
    machine.id,
    machine.machine_version_id,
  );
  const navigate = useNavigate({
    from: "/machines/$machineId",
  });

  const handleRollback = async () => {
    if (!isBusinessOrEnterprise) {
      return;
    }

    try {
      await api({
        url: `machine/serverless/${machine.id}/rollback`,
        init: {
          method: "POST",
          body: JSON.stringify({
            machine_version_id: machineVersion.id,
          }),
        },
      });
      toast.success(`Rollback to v${machineVersion.version}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to rollback. ");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Ellipsis className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[200px]" align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={
              !isBusinessOrEnterprise ||
              machineVersion.id === machine.machine_version_id ||
              machineVersion.status !== "ready" ||
              machine.status === "building"
            }
            className="text-red-500"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setRollbackAlertOpen(true);
            }}
          >
            Rollback
            <DropdownMenuShortcut>
              {isBusinessOrEnterprise ? (
                <RotateCcw className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          {/* <DropdownMenuItem>
            Promote to Production
            <DropdownMenuShortcut>
              <CircleArrowUp className="w-4 h-4" />
            </DropdownMenuShortcut>
          </DropdownMenuItem> */}
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate({
                to: "/machines/$machineId/$machineVersionId",
                params: {
                  machineVersionId: machineVersion.id,
                },
              });
            }}
          >
            <span>Details</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={rollbackAlertOpen} onOpenChange={setRollbackAlertOpen}>
        <AlertDialogContent className="w-[900px] max-w-full">
          <AlertDialogHeader>
            <AlertDialogTitle>Machine Rollback</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="mb-4">
                You are about to rollback from
                <span className="bg-gray-100 leading-snug px-2 py-1 rounded-md text-gray-500 text-xs w-fit mx-1">
                  v{currentMachineVersion?.version}
                </span>
                to
                <span className="bg-gray-100 leading-snug px-2 py-1 rounded-md text-gray-500 text-xs w-fit mx-1">
                  v{machineVersion.version}
                </span>
                .
              </div>

              <div className="flex flex-col md:flex-row items-center gap-4">
                {/* Current Version Card */}
                <div className="flex-1 flex justify-between bg-gray-100 rounded-[6px] p-2 border border-gray-200 w-full md:w-auto">
                  <div className="flex flex-row gap-x-4 items-center">
                    <div>
                      <CircleX className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <div className="text-xs text-gray-600 font-medium font-mono flex flex-row gap-x-2 items-center">
                        {currentMachineVersion?.id.slice(0, 8)}
                        <span className="bg-gray-200 leading-snug px-2 py-1 rounded-md text-gray-500 text-xs w-fit">
                          v{currentMachineVersion?.version}
                        </span>
                      </div>
                      <div className="flex flex-row gap-x-2 items-center">
                        <MachineStatusBadge
                          status={currentMachineVersion?.status}
                          createdAt={currentMachineVersion?.created_at}
                        />
                      </div>
                      <UserInfoForDeployment
                        machineVersion={currentMachineVersion}
                      />
                    </div>
                  </div>
                  <div>
                    <Badge
                      variant="green"
                      className="!px-3 !py-1 rounded-[6px]"
                    >
                      Current
                    </Badge>
                  </div>
                </div>

                <div className="hidden md:block">
                  <ChevronRight className="h-4 w-4 shrink-0" />
                </div>

                <div className="block md:hidden">
                  <ChevronDown className="h-4 w-4 shrink-0" />
                </div>

                {/* Previous Version Card */}
                <div className="flex-1 flex justify-between bg-white rounded-[6px] p-2 border border-gray-200 shadow-lg w-full md:w-auto">
                  <div className="flex flex-row gap-x-4 items-center">
                    <div>
                      <RotateCcw className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="flex flex-col">
                      <div className="text-xs text-gray-600 font-medium font-mono flex flex-row gap-x-2 items-center">
                        {machineVersion.id.slice(0, 8)}
                        <span className="bg-gray-200 leading-snug px-2 py-1 rounded-md text-gray-500 text-xs w-fit">
                          v{machineVersion.version}
                        </span>
                      </div>
                      <div className="flex flex-row gap-x-2 items-center">
                        <MachineStatusBadge
                          status={machineVersion.status}
                          createdAt={machineVersion.created_at}
                        />
                      </div>
                      <UserInfoForDeployment machineVersion={machineVersion} />
                    </div>
                  </div>
                  <div>
                    <Badge
                      variant="yellow"
                      className="!px-3 !py-1 rounded-[6px]"
                    >
                      Previous
                    </Badge>
                  </div>
                </div>
              </div>
              <DiffViewer
                currentMachineVersion={currentMachineVersion}
                machineVersion={machineVersion}
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRollback}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function NoChanges() {
  return (
    <div className="mt-4 flex items-center justify-center rounded-[6px] border border-gray-200 bg-gray-50 p-6">
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <CheckCircle className="h-4 w-4" />
        No significant changes detected
      </div>
    </div>
  );
}

// ChangeItem component
function ChangeItem({ change }: { change: Change }) {
  if (change.type === "steps-changes") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 font-medium text-sm">
          <Puzzle className="h-4 w-4" />
          Steps Changes
        </div>
        <div className="space-y-1">
          <CustomNodeChanges nodes={change.nodes} />
          <CommandChanges commands={change.commands} />
        </div>
      </div>
    );
  }

  return <FieldChanges {...change} />;
}

export function DiffViewer({
  currentMachineVersion,
  machineVersion,
}: DiffViewerProps) {
  const changes = processChanges(currentMachineVersion, machineVersion);

  if (changes.length === 0) {
    return <NoChanges />;
  }

  return (
    <div className="mt-4 max-h-[500px] space-y-2 overflow-y-auto pb-3">
      {changes.map((change, index) => (
        <div
          key={index}
          className="rounded-lg border border-gray-100 bg-white p-4"
        >
          <ChangeItem change={change} />
        </div>
      ))}
    </div>
  );
}
