"use client";

import { useCurrentWorkflow } from "@/hooks/use-current-workflow";
import { useMachine } from "@/hooks/use-machine";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "../ui/badge";
import { LoadingIcon } from "../ui/custom/loading-icon";
import { useWorkflowVersion } from "../workflow-list";
import { SessionCreator } from "./SessionView";
import { WorkspaceLoading, WorkspaceMachineLoading } from "./WorkspaceLoading";

interface WorkspaceClientWrapperProps {
  workflow_id: string;
  className?: string;
  isPublic?: boolean;
  sessionIdOverride?: string;
}

export function WorkspaceClientWrapper({
  ...props
}: WorkspaceClientWrapperProps) {
  const {
    workflow,
    mutateWorkflow,
    isLoading: isLoadingWorkflow,
  } = useCurrentWorkflow(props.workflow_id);

  const { data: versions, isLoading: isLoadingVersions } = useQuery({
    enabled: !!props.workflow_id,
    queryKey: ["workflow", props.workflow_id, "versions"],
    queryKeyHashFn: (queryKey) => [...queryKey, "latest"].toString(),
    meta: {
      limit: 1,
    },
  });

  const { data: machine, isLoading } = useMachine(
    workflow?.selected_machine_id,
  );

  if (isLoadingWorkflow || isLoading || isLoadingVersions || !versions) {
    // return <WorkspaceLoading />;
    return (
      <div className="flex h-full w-full items-center justify-center">
        <LoadingIcon />
      </div>
    );
  }

  if (!machine && !isLoading && !isLoadingWorkflow)
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center",
          props.className,
        )}
      >
        No machine selected, please select a machine at the bottom left.
      </div>
    );

  if (
    machine?.type === "comfy-deploy-serverless" &&
    machine?.status === "building"
  )
    return (
      <WorkspaceMachineLoading
        machine={machine}
        endpoint={`${process.env.NEXT_PUBLIC_CD_API_URL}/api/machine`}
      />
    );

  const machineBuilderVersion = machine?.machine_builder_version;

  if (Number.parseInt(machineBuilderVersion) >= 4) {
    return (
      <SessionCreator
        workflowId={props.workflow_id}
        workflowLatestVersion={versions[0]}
        sessionIdOverride={props.sessionIdOverride}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center",
        props.className,
      )}
    >
      Machine builder version{" "}
      <Badge className="mx-2">{machineBuilderVersion}</Badge> and{" "}
      <Badge className="mx-2">{machine?.type}</Badge> is not supported for
      workflow preview.
    </div>
  );
}
