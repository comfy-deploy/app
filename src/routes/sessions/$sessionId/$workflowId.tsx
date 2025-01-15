import {
  ComfyUIVersionSelectBox,
  GPUSelectBox,
} from "@/components/machine/machine-settings";
import { WorkspaceClientWrapper } from "@/components/workspace/WorkspaceClientWrapper";
import { comfyui_hash } from "@/utils/comfydeploy-hash";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";

export const Route = createFileRoute("/sessions/$sessionId/$workflowId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { sessionId, workflowId } = Route.useParams();

  return (
    <div className="h-full w-full">
      <WorkspaceClientWrapper
        workflow_id={workflowId}
        sessionIdOverride={sessionId}
      />
    </div>
  );
}
