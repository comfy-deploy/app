"use client";

// import { useWorkflowVersion } from "@/components/WorkflowList";
import { InsertModal } from "@/components/auto-form/auto-form-dialog";
// import { useTurboStore } from "@/components/workspace/App";
// import { WorkspaceContext } from "@/components/workspace/WorkspaceContext";
import { sendEventToCD } from "@/components/workspace/sendEventToCD";
import { useWorkflowIdInWorkflowPage } from "@/hooks/hook";
import { api } from "@/lib/api";
import { callServerPromise } from "@/lib/call-server-promise";
import { useAuth } from "@clerk/clerk-react";
import { parseAsInteger, useQueryState } from "nuqs";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useWorkflowVersion } from "../workflow-list";
import { DiffView, SnapshotDiffView } from "./DiffView";
import { useSelectedVersion } from "../version-select";
import { useWorkflowStore } from "./Workspace";
import { ScrollArea } from "../ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { diff } from "json-diff-ts";
import { useMatch } from "@tanstack/react-router";

type WorkflowCommitVersionProps = {
  setOpen: (b: boolean) => void;
  endpoint: string;
  machine_id?: string;
  machine_version_id?: any;
  session_url?: string;
};

async function createNewWorkflowVersion(data: {
  workflow_data: {
    workflow: string;
    workflow_api: string;
  };
  user_id: string;
  workflow_id: string;
  comment: string;
  machine_id?: string;
  machine_version_id?: string;
  comfyui_snapshot?: string;
}) {
  return api({
    url: `workflow/${data.workflow_id}/version`,
    init: {
      method: "POST",
      body: JSON.stringify({
        workflow: data.workflow_data.workflow,
        workflow_api: data.workflow_data.workflow_api,
        comment: data.comment,
        machine_id: data.machine_id,
        machine_version_id: data.machine_version_id,
        comfyui_snapshot: data.comfyui_snapshot,
      }),
    },
  });
}

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

  const query = useWorkflowVersion(workflowId ?? undefined);
  const [, setVersion] = useQueryState("version", {
    defaultValue: 1,
    ...parseAsInteger,
  });

  const differences = useWorkflowStore((state) => state.differences);
  const workflow = useWorkflowStore((state) => state.workflow);
  const { value: selectedVersion } = useSelectedVersion(workflowId);
  let [snapshotAction, setSnapshotAction] =
    useState<SnapshotAction>("CREATE_AND_COMMIT");

  const match = useMatch({
    from: "/sessions/$sessionId/",
    shouldThrow: false,
  });

  const endpoint = _endpoint;
  // if (turbo) {
  //   endpoint = machineAPIEndPoint.replace("comfyui-api", "workspace");
  //   console.log("turbo", endpoint);
  // }

  // console.log("endpoint", endpoint);

  const getPromptWithTimeout = useCallback(
    async (timeoutMs = 5000) => {
      const getPrompt = new Promise<any>((resolve, reject) => {
        const eventListener = (event: any) => {
          // console.log(event.origin, endpoint, event.data);
          if (event.origin !== endpoint) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === "cd_plugin_onGetPrompt") {
              window.removeEventListener("message", eventListener, {
                capture: true,
              });
              resolve(data.data);
            }
          } catch (error) {
            console.error("Error parsing prompt:", error);
            reject(error);
          }
        };
        window.addEventListener("message", eventListener, {
          capture: true,
        });
        sendEventToCD("get_prompt");
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Timeout: Failed to get prompt")),
          timeoutMs,
        );
      });
      console.log("getPrompt", getPrompt);
      return Promise.race([getPrompt, timeoutPromise]);
    },
    [endpoint],
  );

  const { data: comfyui_snapshot, isLoading: comfyui_snapshot_loading } =
    useQuery({
      queryKey: ["comfyui_snapshot", session_url],
      queryFn: async () => {
        if (!session_url) return null;
        const response = await fetch(`${session_url}/snapshot/get_current`);
        return response.json();
      },
    });

  const handleSnapshotActionChange = useCallback((hasChanges: boolean) => {
    setSnapshotAction(hasChanges ? "CREATE_AND_COMMIT" : "COMMIT_ONLY");
  }, []);

  const { data: workspace_version, isLoading: is_workspace_version_loading } =
    useQuery<any>({
      queryKey: [
        "machine",
        "serverless",
        machine_id,
        "versions",
        machine_version_id,
      ],
    });

  const is_fluid_machine = !!workspace_version?.modal_image_id;

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
      serverAction={async (data) => {
        if (!userId) return;
        if (comfyui_snapshot_loading && is_fluid_machine) return;

        try {
          const prompt = await getPromptWithTimeout();
          // console.log("prompt", prompt);

          let new_machine_vesion_id: string | undefined;
          if (
            snapshotAction === "CREATE_AND_COMMIT" &&
            match?.params.sessionId
          ) {
            const snapshot_data = await callServerPromise(
              api({
                url: `session/${match.params.sessionId}/snapshot`,
                init: {
                  method: "POST",
                },
              }),
              {
                loadingText: "Saving snapshot...",
              },
            );
            new_machine_vesion_id = snapshot_data.version_id;
          }

          if (is_fluid_machine && !new_machine_vesion_id) {
            toast.error("Does't have a machine version id");
            return;
          }

          const result = await callServerPromise(
            createNewWorkflowVersion({
              user_id: userId,
              workflow_id: workflowId,
              comment: data.comment,
              machine_id: machine_id,
              machine_version_id: is_fluid_machine
                ? new_machine_vesion_id
                : null,
              comfyui_snapshot: is_fluid_machine ? comfyui_snapshot : null,
              workflow_data: {
                workflow: prompt.workflow,
                workflow_api: prompt.output,
              },
            }),
            {
              loadingText: "Creating a new version",
            },
          );

          await query.refetch();

          if (result?.version !== undefined) {
            setTimeout(() => {
              setVersion(result.version);
            }, 100);
          }
        } catch (error) {
          console.error("Error getting prompt:", error);
          toast.error("Failed to get prompt. Please try again.");
          return;
        }
      }}
      formSchema={z.object({
        comment: z.string().optional(),
      })}
    />
  );
}
