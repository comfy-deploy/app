import {
  BuildStepsUI,
  MachineBuildLog,
} from "@/components/machine/machine-build-log";
import { Badge } from "@/components/ui/badge";
import { useMachineVersion } from "@/hooks/use-machine";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { LastActiveEvent, MachineCostEstimate } from "./machine-overview";
import { MachineVersionBadge } from "./machine-version-badge";
import { MachineSettingsWrapper } from "./machine-settings";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

export function MachineVersionDetail({
  machineId,
  machineVersionId,
}: { machineId: string; machineVersionId: string }) {
  const { data: machine, isLoading } = useQuery<any>({
    queryKey: ["machine", machineId],
    refetchInterval: 5000,
  });
  const { data: machineVersion, isLoading: machineVersionLoading } =
    useMachineVersion(machineId, machineVersionId);
  const [init, setInit] = useState(false);

  const [selectedTab, setSelectedTab] = useState<
    "build-log" | "version-detail"
  >("build-log");

  useEffect(() => {
    if (machineVersion?.status === "ready" && !init) {
      setSelectedTab("version-detail");
      setInit(true);
    }
  }, [machineVersion, init]);

  if (isLoading || machineVersionLoading) return <div>Loading...</div>;

  return (
    <div className="mx-auto w-full">
      <div className="sticky top-0 z-50 flex flex-row justify-between border-gray-200 border-b bg-[#fcfcfc] p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex flex-row items-center gap-4">
          <Link
            to={`/machines/${machine.id}`}
            params={{ machineId: machine.id }}
            className="flex flex-row items-center gap-2 font-medium text-md"
          >
            {machine.name}
            {machine.machine_version_id && (
              <MachineVersionBadge machine={machine} isExpanded={true} />
            )}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link
            to={`/machines/${machine.id}/history`}
            params={{ machineId: machine.id }}
            className="text-gray-500 text-sm dark:text-zinc-400"
          >
            History
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-500 text-sm dark:text-zinc-400">
            v{machineVersion.version}
          </span>
          <Badge
            variant={
              machineVersion.status === "building"
                ? "yellow"
                : machineVersion.status === "error"
                  ? "red"
                  : "green"
            }
          >
            <div
              className={`h-[6px] w-[6px] animate-pulse rounded-full bg-${
                machineVersion.status === "building"
                  ? "yellow"
                  : machineVersion.status === "error"
                    ? "red"
                    : "green"
              }-500`}
            />
            {machineVersion.status === "building"
              ? "Building"
              : machineVersion.status === "error"
                ? "Error"
                : "Ready"}
          </Badge>
        </div>
        <div className="flex flex-row gap-2">
          <MachineCostEstimate machineId={machine.id} />
          <LastActiveEvent machineId={machine.id} />
        </div>
      </div>

      <div className="mx-auto max-w-[1200px]">
        <div className="mt-4 mb-2 flex justify-end">
          <Tabs
            value={selectedTab}
            onValueChange={(value) =>
              setSelectedTab(value as "build-log" | "version-detail")
            }
          >
            <motion.div className="inline-flex items-center rounded-lg bg-white/95 py-0.5 ring-1 ring-gray-200/50 dark:bg-zinc-800 dark:ring-zinc-700/50">
              <TabsList className="relative flex w-fit gap-1 bg-transparent">
                <motion.div layout className="relative">
                  <TabsTrigger
                    value="version-detail"
                    className={cn(
                      "rounded-md px-4 py-1.5 font-medium text-sm transition-all",
                      selectedTab === "version-detail"
                        ? "bg-gradient-to-b from-white to-gray-100 shadow-sm ring-1 ring-gray-200/50 dark:from-zinc-800 dark:to-zinc-700 dark:ring-zinc-700"
                        : "text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-700",
                    )}
                  >
                    Version Details
                  </TabsTrigger>
                </motion.div>
                <motion.div layout className="relative">
                  <TabsTrigger
                    value="build-log"
                    className={cn(
                      "rounded-md px-4 py-1.5 font-medium text-sm transition-all",
                      selectedTab === "build-log"
                        ? "bg-gradient-to-b from-white to-gray-100 shadow-sm ring-1 ring-gray-200/50 dark:from-zinc-800 dark:to-zinc-700 dark:ring-zinc-700"
                        : "text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-700",
                    )}
                  >
                    Build Log
                  </TabsTrigger>
                </motion.div>
              </TabsList>
            </motion.div>
          </Tabs>
        </div>
        {selectedTab === "version-detail" && (
          <MachineSettingsWrapper
            machine={machine}
            title={
              <div className="ml-2 font-medium text-xl">Version Details</div>
            }
            disableUnsavedChangesWarningServerless={true}
            readonly
          />
        )}
        {selectedTab === "build-log" && (
          <MachineVersionBuildLog
            machine={machine}
            machineVersion={machineVersion}
          />
        )}
      </div>
    </div>
  );
}

function MachineVersionBuildLog({
  machine,
  machineVersion,
}: { machine: any; machineVersion: any }) {
  const machineEndpoint = `${process.env.NEXT_PUBLIC_CD_API_URL}/api/machine`;

  return (
    <div className="flex flex-col gap-2">
      <div className="mt-3 ml-2 font-medium text-xl">Build Log</div>
      <div className="rounded-lg border border-gray-200 p-4 dark:border-zinc-700">
        {machineVersion.status === "building" ? (
          <MachineBuildLog
            machine={machine}
            instance_id={machine.build_machine_instance_id!}
            machine_id={machine.id}
            endpoint={machineEndpoint}
          />
        ) : machineVersion.build_log ? (
          <BuildStepsUI
            logs={JSON.parse(machineVersion.build_log ?? "")}
            machine={machineVersion}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            No logs
          </div>
        )}
      </div>
    </div>
  );
}
