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
import { Loader2, Sparkles } from "lucide-react";
import { useCallback, useState } from "react";
import { z } from "zod";
import { ScrollArea } from "../ui/scroll-area";
import { useSelectedVersion } from "../version-select";
import { DiffView, getMinimalWorkflowDiff, SnapshotDiffView } from "./DiffView";
import { useWorkflowStore } from "./Workspace";
import { serverAction } from "@/lib/workflow-version-api";
import { useGetWorkflowVersionData } from "@/hooks/use-get-workflow-version-data";
import { FormMessage } from "../ui/form";
import { FormControl } from "../ui/form";
import { FormItem } from "../ui/form";
import AutoFormLabel from "../auto-form/common/label";
import { Input } from "../ui/input";
import type { AutoFormInputComponentProps } from "../auto-form/types";
import { Button } from "../ui/button";
import { useAuthStore } from "@/lib/auth-store";

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
      fieldConfig={{
        comment: {
          fieldType: CommentInput,
        },
      }}
    />
  );
}

function CommentInput({
  label,
  isRequired,
  fieldProps,
  field,
}: AutoFormInputComponentProps) {
  const { showLabel: _showLabel } = fieldProps;
  const showLabel = _showLabel === undefined ? true : _showLabel;
  const { workflow, workflow_api } = useWorkflowStore((state) => state);
  const workflowId = useWorkflowIdInWorkflowPage();
  const { value: selectedVersion } = useSelectedVersion(workflowId ?? "");
  const [isGenerating, setIsGenerating] = useState(false);
  const fetchToken = useAuthStore((state) => state.fetchToken);

  const diffResult = getMinimalWorkflowDiff(
    selectedVersion?.workflow,
    workflow,
    workflow_api,
  );

  const handleGenerateComment = async (workflow_diff: any) => {
    const token = await fetchToken();
    const apiUrl =
      "https://comfy-deploy--master-comfy-fastapi-app.modal.run/v1/workflow/comment";
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        workflow_diff: workflow_diff,
      }),
    });

    return await response.json();
  };

  const handleSparklesClick = async () => {
    try {
      setIsGenerating(true);
      const data = await handleGenerateComment(diffResult);

      if (data?.message) {
        field.onChange(data.message);
      }
    } catch (error) {
      console.error("Failed to generate comment:", error);
      // Fallback on error
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-row items-center space-x-2">
      <FormItem className="flex w-full flex-col justify-start">
        {showLabel && <AutoFormLabel label={label} isRequired={isRequired} />}
        <FormControl>
          <div className="relative">
            <Input value={field.value || ""} onChange={field.onChange} />
            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="-translate-y-1/2 absolute top-1/2 right-2"
              onClick={handleSparklesClick}
              disabled={isGenerating}
              hideLoading
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </Button>
          </div>
        </FormControl>
        <FormMessage />
      </FormItem>
    </div>
  );
}
