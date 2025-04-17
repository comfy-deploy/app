import { useWorkflowVersion } from "@/components/workflow-list";
import { useQuery } from "@tanstack/react-query";
import { parseAsInteger, useQueryState } from "nuqs";

interface Props {
  machine_id?: string;
  machine_version_id?: any;
  session_url?: string;
  workflowId?: string | null;
}

export const useGetWorkflowVersionData = ({
  machine_id,
  machine_version_id,
  session_url,
  workflowId,
}: Props) => {
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

  const { data: comfyui_snapshot, isLoading: comfyui_snapshot_loading } =
    useQuery({
      queryKey: ["comfyui_snapshot", session_url],
      queryFn: async () => {
        if (!session_url) return null;
        const response = await fetch(`${session_url}/snapshot/get_current`);
        console.log(response, "snapshot response!!!");
        return response.json();
      },
    });

  const query = useWorkflowVersion(workflowId ?? undefined);
  const [, setVersion] = useQueryState("version", {
    defaultValue: 1,
    ...parseAsInteger,
  });

  return {
    is_fluid_machine: !!workspace_version?.modal_image_id,
    comfyui_snapshot,
    comfyui_snapshot_loading,
    query,
    setVersion,
  };
};
