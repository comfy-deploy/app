import { sendEventToCD } from "@/components/workspace/sendEventToCD";
import type {
  InfiniteData,
  UseInfiniteQueryResult,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "./api";
import { callServerPromise } from "@/lib/call-server-promise";
import type { Options } from "nuqs";

const getPromptWithTimeout = async ({
  timeoutMs = 5000,
  endpoint,
}: {
  timeoutMs?: number;
  endpoint?: string;
}) => {
  if (!endpoint) return;
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
};

async function createNewWorkflowVersion(data: {
  workflow_data: {
    workflow: string;
    workflow_api: string;
  };
  user_id: string;
  workflow_id: string;
  comment?: string;
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

interface Props {
  query: UseInfiniteQueryResult<InfiniteData<any[], unknown>, Error>;
  comment?: string;
  userId: string | null | undefined;
  workflowId?: string | null;
  setVersion: (
    value: number | ((old: number) => number | null) | null,
    options?: Options,
  ) => Promise<URLSearchParams>;
  sessionId: string | undefined;
  is_fluid_machine: boolean;
  comfyui_snapshot_loading: boolean;
  endpoint?: string;
  machine_id?: string;
  machine_version_id?: string;
  comfyui_snapshot?: string;
  snapshotAction: "CREATE_AND_COMMIT" | "COMMIT_ONLY";
  setOpen: (b: boolean) => void;
}

export const serverAction = async ({
  comment,
  query,
  userId,
  workflowId,
  setVersion,
  sessionId,
  is_fluid_machine,
  comfyui_snapshot_loading,
  endpoint,
  machine_id,
  machine_version_id,
  comfyui_snapshot,
  snapshotAction,
  setOpen,
}: Props) => {
  console.log("PLEASE!!!");
  if (!userId) return;
  if (!workflowId) return;
  if (comfyui_snapshot_loading && is_fluid_machine) return;

  console.log("RUN PLEASE!!!", endpoint);
  try {
    const prompt = await getPromptWithTimeout({ endpoint });
    // console.log("prompt", prompt);

    let new_machine_vesion_id: string | undefined = machine_version_id;
    if (snapshotAction === "CREATE_AND_COMMIT" && sessionId) {
      const snapshot_data = await callServerPromise(
        api({
          url: `session/${sessionId}/snapshot`,
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
        comment,
        machine_id,
        user_id: userId,
        workflow_id: workflowId,
        machine_version_id: new_machine_vesion_id,
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
    setOpen(false);

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
};
