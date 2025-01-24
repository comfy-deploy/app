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
import { useEffect } from "react";
import { sendWorkflow } from "./sendEventToCD";

interface WorkspaceClientWrapperProps {
  workflow_id?: string;
  className?: string;
  isPublic?: boolean;
  sessionIdOverride?: string;
}

export function WorkspaceClientWrapper({
  sessionIdOverride,
  ...props
}: WorkspaceClientWrapperProps) {
  const {
    workflow,
    mutateWorkflow,
    isLoading: isLoadingWorkflow,
  } = useCurrentWorkflow(props.workflow_id ?? null);

  const { data: versions, isLoading: isLoadingVersions } = useQuery<any>({
    enabled: !!props.workflow_id,
    queryKey: ["workflow", props.workflow_id, "versions"],
    queryKeyHashFn: (queryKey) => [...queryKey, "latest"].toString(),
    meta: {
      limit: 1,
    },
  });

  useEffect(() => {
    if (props.workflow_id && versions) {
      console.log("workflow", versions);
      sendWorkflow(versions[0].workflow);
    }
  }, [props.workflow_id, versions]);

  const { data: machine, isLoading } = useMachine(
    workflow?.selected_machine_id,
  );

  if (
    !sessionIdOverride &&
    (isLoadingWorkflow || isLoading || isLoadingVersions || !versions)
  ) {
    // return <WorkspaceLoading />;
    return (
      <div className="flex h-full w-full items-center justify-center">
        <LoadingIcon />
      </div>
    );
  }

  if (!sessionIdOverride && !machine && !isLoading && !isLoadingWorkflow)
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center",
          props.className,
        )}
      >
        No machine selected, please select a machine.
      </div>
    );

  if (
    !sessionIdOverride &&
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
  // || Number.parseInt(machineBuilderVersion) >= 4
  if (sessionIdOverride) {
    return (
      <SessionCreator
        workflowId={props.workflow_id}
        workflowLatestVersion={versions?.[0]}
        sessionIdOverride={sessionIdOverride}
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
