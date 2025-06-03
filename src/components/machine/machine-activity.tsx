import { MachineListItemEvents } from "@/components/machines/machine-list-item";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMachineEvents } from "@/hooks/use-machine";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { differenceInMilliseconds } from "date-fns";
import {
  Box,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  LineChart,
  Loader2,
  TableIcon,
  Workflow,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export function MachineActivity({ machine }: { machine: any }) {
  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-4 py-4">
      <MachineWorkflowDeployment machine={machine} />
      <MachineContainerGraph machine={machine} />
      <MachineContainerTable machine={machine} />
    </div>
  );
}

function MachineWorkflowDeployment({ machine }: { machine: any }) {
  const [activeTab, setActiveTab] = useState<"workflows" | "deployments">(
    "workflows",
  );
  const { data: workflows, isLoading: isWorkflowsLoading } = useQuery({
    queryKey: ["workflows", "all"],
  });
  const { data: deployments, isLoading: isDeploymentsLoading } = useQuery({
    queryKey: ["deployments"],
  });

  return (
    <Card className="flex h-full min-h-[300px] flex-col rounded-[10px]">
      <CardHeader className="flex-none pb-4">
        <CardTitle className="flex items-center justify-between font-semibold text-xl">
          Workflows & Deployments
          <div className="flex items-center">
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col overflow-hidden">
        <div className="mb-4 flex flex-none rounded-[8px] bg-muted p-1">
          <button
            className={cn(
              "flex-1 rounded-[8px] px-3 py-1 font-medium text-sm transition-all",
              activeTab === "workflows"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setActiveTab("workflows")}
          >
            Workflows
          </button>
          <button
            className={cn(
              "flex-1 rounded-[8px] px-3 py-1 font-medium text-sm transition-all",
              activeTab === "deployments"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setActiveTab("deployments")}
          >
            Deployments
          </button>
        </div>

        <ScrollArea className="flex-1">
          {activeTab === "workflows" ? (
            <div>
              {(
                workflows as Array<{
                  id: string;
                  selected_machine_id: string;
                  name: string;
                }>
              )
                ?.filter((w) => w.selected_machine_id === machine.id)
                .map((workflow, index) => (
                  <Link
                    key={workflow.id}
                    to="/workflows/$workflowId/$view"
                    params={{
                      workflowId: workflow.id,
                      view: "workspace",
                    }}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex flex-row items-center gap-2 rounded-[4px] p-1 text-xs transition-all hover:bg-gray-100 dark:hover:bg-zinc-800",
                      index % 2 === 1 && "bg-gray-50 dark:bg-zinc-800/50",
                    )}
                  >
                    <Box className="h-4 w-4" />
                    {workflow.name}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                ))}
            </div>
          ) : (
            <div>
              {(
                deployments as Array<{
                  id: string;
                  machine_id: string;
                  workflow_id: string;
                  environment: string;
                  workflow: {
                    name: string;
                  };
                }>
              )
                ?.filter((d) => d.machine_id === machine.id)
                .map((deployment, index) => (
                  <div
                    key={deployment.id}
                    className={cn(
                      "flex flex-row items-center justify-between rounded-[4px] p-1 transition-all hover:bg-gray-100 dark:hover:bg-zinc-800",
                      index % 2 === 1 && "bg-gray-50 dark:bg-zinc-800/50",
                    )}
                  >
                    <Link
                      to="/workflows/$workflowId/$view"
                      params={{
                        workflowId: deployment.workflow_id,
                        view: "deployment",
                      }}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-row items-center gap-2 rounded-[4px] text-xs"
                    >
                      <GitBranch className="h-4 w-4" />
                      {deployment.workflow.name}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    <Badge
                      variant={
                        deployment.environment === "production"
                          ? "blue"
                          : "yellow"
                      }
                      className="!text-2xs !leading-tight"
                    >
                      {deployment.environment}
                    </Badge>
                  </div>
                ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function MachineContainerGraph({ machine }: { machine: any }) {
  const { data: events, isLoading } = useMachineEvents(machine.id);

  return (
    <Card className="h-full rounded-[10px]">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between font-semibold text-xl">
          Container Activity
          <div className="flex items-center">
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <MachineListItemEvents
          isExpanded={true}
          events={{ data: events, isLoading }}
          machine={machine}
        />
      </CardContent>
    </Card>
  );
}

function MachineContainerTable({ machine }: { machine: any }) {
  const { data: events, isLoading } = useMachineEvents(machine.id);

  return (
    <Card className="flex h-full min-h-[500px] flex-col rounded-[10px]">
      <CardHeader className="flex-none pb-4">
        <CardTitle className="flex items-center justify-between font-semibold text-xl">
          Container History
          <div className="flex items-center">
            <TableIcon className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardTitle>
        <CardDescription>
          Container history for the last 24 hours
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="p-6 pt-0">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>GPU</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events?.map((event) => {
                  const startTime = new Date(event.start_time ?? "");
                  const endTime = event.end_time
                    ? new Date(event.end_time)
                    : new Date();
                  const duration = differenceInMilliseconds(endTime, startTime);
                  const status = event.end_time ? "Done" : "Running";

                  // Format duration to be more readable
                  const durationSeconds = Math.floor(duration / 1000);
                  const durationMinutes = Math.floor(durationSeconds / 60);
                  const durationHours = Math.floor(durationMinutes / 60);

                  let durationText = "";
                  if (durationHours > 0) {
                    durationText += `${durationHours}h `;
                  }
                  if (durationMinutes % 60 > 0) {
                    durationText += `${durationMinutes % 60}m `;
                  }
                  if (durationSeconds % 60 > 0) {
                    durationText += `${durationSeconds % 60}s`;
                  }

                  return (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">
                        {startTime.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {event.end_time ? (
                          endTime.toLocaleString()
                        ) : (
                          <Skeleton className="h-4 w-16 rounded-[4px]" />
                        )}
                      </TableCell>
                      <TableCell>{durationText.trim() || "0s"}</TableCell>
                      <TableCell>
                        <Badge variant={status === "Done" ? "green" : "yellow"}>
                          {status === "Done" ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          )}
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell>{event.gpu}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
