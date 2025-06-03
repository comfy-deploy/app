import { MachineActivity } from "@/components/machine/machine-activity";
import {
  LastActiveEvent,
  MachineCostEstimate,
} from "@/components/machine/machine-overview";
import { MachineVersionBadge } from "@/components/machine/machine-version-badge";
import { useMachine } from "@/hooks/use-machine";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { ErrorBoundary } from "@/components/error-boundary";

export const Route = createFileRoute("/machines/$machineId/activity")({
  component: RouteComponent,
});

function RouteComponent() {
  const { machineId } = Route.useParams();
  const { data: machine } = useMachine(machineId);

  if (!machine) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full">
      <div className="sticky top-0 z-50 flex flex-row justify-between border-gray-200 border-b bg-[#fcfcfc] p-4 shadow-sm dark:border-zinc-700/50 dark:bg-zinc-900">
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
          <span className="text-gray-500 text-sm dark:text-gray-400">
            Activity
          </span>
        </div>
        <div className="flex flex-row gap-2">
          <ErrorBoundary fallback={(error) => <div>{error.message}</div>}>
            <MachineCostEstimate machineId={machine.id} />
          </ErrorBoundary>
          <LastActiveEvent machineId={machine.id} />
        </div>
      </div>

      <MachineActivity machine={machine} />
    </div>
  );
}
