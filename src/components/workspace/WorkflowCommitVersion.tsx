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
import { use, useCallback, useMemo } from "react";
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

  const comfyui_snapshot_difference = useMemo(() => {
    return diff(selectedVersion?.comfyui_snapshot, comfyui_snapshot, {
      // keysToSkip: ["extra", "order", "$index"],
      // embeddedObjKeys: {
      //   nodes: "id",
      // },
    });
  }, [selectedVersion?.comfyui_snapshot, comfyui_snapshot]);

  return (
    <InsertModal
      trigger={<></>}
      open={true}
      setOpen={setOpen}
      dialogClassName="sm:max-w-[600px]"
      title="Commit changes"
      extraUI={
        <ScrollArea>
          {comfyui_snapshot_loading ? (
            <div className="flex h-full items-center justify-center">
              Fetching snapshot...
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <SnapshotDiffView
              newSnapshot={comfyui_snapshot}
              oldSnapshot={selectedVersion?.comfyui_snapshot}
            />
          )}
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

        try {
          const prompt = await getPromptWithTimeout();
          console.log("prompt", prompt);

          const dependencies = {
            comfyui: "",
            custom_nodes: {},
            missing_nodes: [],
            models: [],
            files: {},
          };

          const result = await callServerPromise(
            createNewWorkflowVersion({
              user_id: userId,
              workflow_id: workflowId,
              comment: data.comment,
              machine_id: machine_id,
              machine_version_id: machine_version_id,
              comfyui_snapshot: comfyui_snapshot,
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

          // await mutate(workflowId + "-version");
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
