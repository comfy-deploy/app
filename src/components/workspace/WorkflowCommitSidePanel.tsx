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
import { Button } from "../ui/button";
import { useAuthStore } from "@/lib/auth-store";
import { useAuth } from "@clerk/clerk-react";
import {
  useSessionIdInSessionView,
  useWorkflowIdInWorkflowPage,
} from "@/hooks/hook";
import { Loader2, Save, Sparkles } from "lucide-react";
import AutoForm from "../auto-form";

type SnapshotAction = "CREATE_AND_COMMIT" | "COMMIT_ONLY";

interface WorkflowCommitSidePanelProps {
  endpoint: string;
  machine_id?: string;
  machine_version_id?: string;
  session_url?: string;
  onClose: () => void;
}

export function WorkflowCommitSidePanel({
  endpoint: _endpoint,
  machine_id,
  machine_version_id,
  session_url,
  onClose,
}: WorkflowCommitSidePanelProps) {
  const { userId } = useAuth();
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

  const { value: selectedVersion } = useSelectedVersion(workflowId || "");
  const [snapshotAction, setSnapshotAction] =
    useState<SnapshotAction>("CREATE_AND_COMMIT");
  const sessionId = useSessionIdInSessionView();
  const endpoint = _endpoint;
  const [isLoading, setIsLoading] = useState(false);

  const handleSnapshotActionChange = useCallback((hasChanges: boolean) => {
    setSnapshotAction(hasChanges ? "CREATE_AND_COMMIT" : "COMMIT_ONLY");
  }, []);

  let effectiveSnapshotAction = snapshotAction;
  if (!is_fluid_machine) {
    effectiveSnapshotAction = "COMMIT_ONLY";
  } else if (!comfyui_snapshot_loading && !selectedVersion?.comfyui_snapshot) {
    effectiveSnapshotAction = "CREATE_AND_COMMIT";
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 p-4">
        <Save className="h-4 w-4" />
        <span className="font-medium">Save Changes</span>
      </div>
      <div className="space-y-4 p-4">
        {/* Snapshot Section */}
        {/* Comment Section */}
        <div className="rounded-md border bg-muted/50 p-3">
          <AutoForm
            formSchema={z.object({
              comment: z.string().optional(),
            })}
            fieldConfig={{
              comment: {
                fieldType: CommentInput,
              },
            }}
            onSubmit={async (data) => {
              setIsLoading(true);
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
                setOpen: onClose,
                snapshotAction: effectiveSnapshotAction,
                comfyui_snapshot,
                comfyui_snapshot_loading,
                sessionId,
              });
              setIsLoading(false);
              onClose();
            }}
          >
            <div className="mt-4 flex justify-end">
              <Button
                type="submit"
                variant="expandIcon"
                isLoading={isLoading}
                Icon={Save}
                iconPlacement="right"
              >
                {effectiveSnapshotAction === "CREATE_AND_COMMIT"
                  ? "Update Workspace and Save"
                  : "Save Changes"}
              </Button>
            </div>
          </AutoForm>
        </div>

        <div className="rounded-md border bg-muted/50 p-3">
          <ScrollArea className="flex-1">
            {is_fluid_machine && (
              <>
                <div className="mb-3 flex items-center gap-2">
                  <span className="font-medium text-sm">
                    Workspace Snapshot
                  </span>
                  {comfyui_snapshot_loading && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {!comfyui_snapshot_loading && (
                  <SnapshotDiffView
                    newSnapshot={comfyui_snapshot}
                    oldSnapshot={selectedVersion?.comfyui_snapshot}
                    onSnapshotActionChange={handleSnapshotActionChange}
                  />
                )}
              </>
            )}

            {/* Changes Section */}
            <div className="mb-3">
              <span className="font-medium text-sm">Workflow Changes</span>
            </div>
            <DiffView
              className="max-h-[300px]"
              differences={differences}
              workflow={workflow}
              oldWorkflow={selectedVersion?.workflow}
            />
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

function CommentInput({
  label,
  isRequired,
  fieldProps,
  field,
}: {
  label: string;
  isRequired: boolean;
  fieldProps: { showLabel?: boolean };
  field: { value: string; onChange: (value: string) => void };
}) {
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

  const handleGenerateComment = async (workflow_diff: unknown) => {
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
              className="absolute right-2 top-1/2 -translate-y-1/2"
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
