"use client";

// import { useWorkflowVersion } from "@/components/WorkflowList";
import { InsertModal } from "@/components/auto-form/auto-form-dialog";
// import { useTurboStore } from "@/components/workspace/App";
// import { WorkspaceContext } from "@/components/workspace/WorkspaceContext";
import {
  useSessionIdInSessionView,
  useWorkflowIdInWorkflowPage,
} from "@/hooks/hook";
import { useAuth } from "@clerk/clerk-react";
import { Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { z } from "zod";
import { ScrollArea } from "../ui/scroll-area";
import { useSelectedVersion } from "../version-select";
import { DiffView, SnapshotDiffView } from "./DiffView";
import { useWorkflowStore } from "./Workspace";
import { serverAction } from "@/lib/workflow-version-api";
import { useGetWorkflowVersionData } from "@/hooks/use-get-workflow-version-data";

type WorkflowCommitVersionProps = {
  setOpen: (b: boolean) => void;
  endpoint: string;
  machine_id?: string;
  machine_version_id?: any;
  session_url?: string;
};

type SnapshotAction = "CREATE_AND_COMMIT" | "COMMIT_ONLY";

export function WorkflowCommitVersion({
  setOpen,
  endpoint: _endpoint,
  machine_id,
  machine_version_id,
  session_url,
}: WorkflowCommitVersionProps) {
  const { userId } = useAuth();

  // const { turbo } = useTurboStore();

  // const { workflowId, machineAPIEndPoint, readonly } = use(WorkspaceContext);

  const workflowId = useWorkflowIdInWorkflowPage();

  const { differences, workflow } = useWorkflowStore((state) => state);

  const {
    query,
    setVersion,
    is_fluid_machine,
    comfyui_snapshot,
    comfyui_snapshot_loading,
  } = useGetWorkflowVersionData({
    machine_id,
    machine_version_id,
    session_url,
    workflowId,
  });

  const { value: selectedVersion } = useSelectedVersion(workflowId);
  let [snapshotAction, setSnapshotAction] =
    useState<SnapshotAction>("CREATE_AND_COMMIT");

  const sessionId = useSessionIdInSessionView();

  const endpoint = _endpoint;
  // if (turbo) {
  //   endpoint = machineAPIEndPoint.replace("comfyui-api", "workspace");
  //   console.log("turbo", endpoint);
  // }

  // console.log("endpoint", endpoint);

  const handleSnapshotActionChange = useCallback((hasChanges: boolean) => {
    setSnapshotAction(hasChanges ? "CREATE_AND_COMMIT" : "COMMIT_ONLY");
  }, []);

  if (!is_fluid_machine) {
    snapshotAction = "COMMIT_ONLY";
  }

  // Make sure when there isnt any existing versioning.
  if (
    is_fluid_machine &&
    !comfyui_snapshot_loading &&
    !selectedVersion?.comfyui_snapshot
  ) {
    snapshotAction = "CREATE_AND_COMMIT";
  }

  return (
    <InsertModal
      trigger={<></>}
      open={true}
      setOpen={setOpen}
      dialogClassName="sm:max-w-[600px]"
      title="Commit changes"
      actionButtonName={
        snapshotAction === "CREATE_AND_COMMIT"
          ? "Update Workspace and Commit"
          : "Commit"
      }
      extraUI={
        <ScrollArea>
          {is_fluid_machine &&
            (comfyui_snapshot_loading ? (
              <div className="flex h-full items-center justify-center">
                Fetching snapshot...
                <Loader2 className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <SnapshotDiffView
                newSnapshot={comfyui_snapshot}
                oldSnapshot={selectedVersion?.comfyui_snapshot}
                onSnapshotActionChange={handleSnapshotActionChange}
              />
            ))}
          <DiffView
            className="max-h-[300px]"
            differences={differences}
            workflow={workflow}
            oldWorkflow={selectedVersion?.workflow}
          />
        </ScrollArea>
      }
      description="Commit a new version of the workflow"
      serverAction={async (data) =>
        await serverAction({
          comment: data.comment,
          endpoint,
          machine_id,
          machine_version_id,
          userId,
          workflowId,
          is_fluid_machine,
          query,
          setVersion,
          setOpen,
          snapshotAction,
          comfyui_snapshot,
          comfyui_snapshot_loading,
          sessionId,
        })
      }
      formSchema={z.object({
        comment: z.string().optional(),
      })}
    />
  );
}
