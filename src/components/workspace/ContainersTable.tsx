"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Timer } from "@/components/workflows/Timer";
import { getDuration } from "@/lib/get-relative-time";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

import { useCurrentWorkflow } from "@/hooks/use-current-workflow";
import { useMachine } from "@/hooks/use-machine";
import { useQuery } from "@tanstack/react-query";

export function getEnvColor(env: string) {
  switch (env.toLowerCase()) {
    case "production":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400";
    case "staging":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400";
    case "development":
      return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400";
    case "public-share":
      return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400";
  }
}

export function useWorkflowDeployments(workflow_id: string) {
  return useQuery<any>({
    queryKey: ["workflow", workflow_id, "deployments"],
  });
}

export function useMachineEvents(machine_id: string) {
  return useQuery<any>({
    queryKey: ["machine", machine_id, "events"],
    refetchInterval: 5000,
  });
}

export function ContainersTable(props: { workflow_id: string }) {
  const { data: deployments } = useWorkflowDeployments(props.workflow_id);

  // const { machine } = selectedMachineStore();

  const { workflow } = useCurrentWorkflow(props.workflow_id);
  const { data: machine } = useMachine(workflow?.selected_machine_id);

  return (
    <div>
      {machine &&
        !deployments?.some(
          (deployment) => deployment.machine.id === machine.id,
        ) && <MachineEventStatus machine={machine} />}
      {deployments?.map((deployment) => (
        <MachineEventStatus
          key={deployment.id}
          machine={deployment.machine}
          env={deployment.environment}
        />
      ))}
    </div>
  );
}

function MachineEventStatus(props: {
  machine: any;
  env?: string;
}) {
  const { data: events, isLoading } = useMachineEvents(props.machine.id);

  const machineData = [
    {
      name: props.machine.name,
      env: props.env,
      events:
        events?.map((event) => ({
          id: event.id,
          running: !event.end_time,
          start: event.start_time,
          end: event.end_time,
          gpu: event.gpu,
        })) || [],
    },
  ];

  if (isLoading) return <Skeleton className="mb-2 h-[40px] w-full" />;

  return <MachineActivitiesList machineData={machineData} />;
}

const MachineActivitiesList = (props: {
  machineData: {
    name: string;
    env?: string;
    events: {
      id: string;
      running: boolean;
      start: Date | null;
      end: Date | null;
      gpu: string | null;
    }[];
  }[];
}) => {
  const [expandedMachines, setExpandedMachines] = useState(
    Object.fromEntries(
      props.machineData.map((machine) => [machine.name, true]),
    ),
  );

  const toggleMachine = (machineName: string) => {
    setExpandedMachines((prev) => ({
      ...prev,
      [machineName]: !prev[machineName],
    }));
  };

  return (
    <div className="space-y-2">
      {props.machineData.map((machine, index) => (
        <div
          key={machine.name}
          className={`overflow-hidden border-gray-200 border-b transition-all duration-300 ease-in-out ${expandedMachines[machine.name] ? "mb-4 rounded-lg shadow-sm ring-1 ring-gray-200" : ""}
              `}
        >
          <button
            className={`w-full px-4 py-3 text-left transition-colors duration-300 ease-in-out ${expandedMachines[machine.name] ? "rounded-t-lg bg-white" : "hover:bg-gray-50"} flex items-center justify-between `}
            onClick={() => toggleMachine(machine.name)}
          >
            <div className="flex items-center space-x-2">
              <span className="font-medium text-base text-gray-700">
                {machine.name}
              </span>
              {machine.env && (
                <span
                  className={`rounded-full px-2 py-0.5 font-medium text-xs ${getEnvColor(machine.env)}`}
                >
                  {machine.env}
                </span>
              )}
            </div>
            {expandedMachines[machine.name] ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </button>
          <ScrollArea
            className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedMachines[machine.name] ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}
                `}
          >
            <div className="max-h-96 rounded-b-lg bg-white px-4 py-3 opacity-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2 pr-2 font-medium">Start</th>
                    <th className="py-2 pr-2 font-medium">End</th>
                    <th className="py-2 pr-2 font-medium">Duration</th>
                    <th className="py-2 pr-2 font-medium">Status</th>
                    <th className="py-2 pr-2 font-medium">GPU</th>
                  </tr>
                </thead>
                <tbody>
                  {machine.events.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-4 text-center text-gray-500"
                      >
                        No events in the past 24 hours.
                      </td>
                    </tr>
                  ) : (
                    machine.events.map((event) => (
                      <tr key={event.id}>
                        <td className="py-1 pr-2">
                          {event.start?.toLocaleTimeString()}
                        </td>
                        <td className="py-1 pr-2">
                          {event.end?.toLocaleTimeString() || "Running"}
                        </td>
                        <td className="py-1 pr-2">
                          {event.end && event.start ? (
                            getDuration(
                              (event.end.getTime() - event.start.getTime()) /
                                1000,
                            )
                          ) : event.start ? (
                            <Timer start={event.start.getTime()} relative />
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td className="py-1 pr-2">
                          <span
                            className={`rounded-full px-2 py-0.5 font-medium text-xs ${
                              event.running
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {event.running ? "Running" : "Stopped"}
                          </span>
                        </td>
                        <td className="py-1 pr-2">{event.gpu}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </div>
      ))}
    </div>
  );
};
