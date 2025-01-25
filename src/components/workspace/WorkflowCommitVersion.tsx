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
import { use, useCallback } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useWorkflowVersion } from "../workflow-list";

type WorkflowCommitVersionProps = {
  setOpen: (b: boolean) => void;
  endpoint: string;
  machine_id?: string;
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
      }),
    },
  });
}

export function WorkflowCommitVersion({
  setOpen,
  endpoint: _endpoint,
  machine_id,
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

  return (
    <InsertModal
      trigger={<></>}
      open={true}
      setOpen={setOpen}
      dialogClassName="sm:max-w-[600px]"
      title="Commit changes"
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
