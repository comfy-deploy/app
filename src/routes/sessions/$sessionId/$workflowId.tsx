import { WorkspaceClientWrapper } from "@/components/workspace/WorkspaceClientWrapper";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sessions/$sessionId/$workflowId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { sessionId, workflowId } = Route.useParams();
  return (
    <div className="h-full w-full">
      <WorkspaceClientWrapper workflow_id={workflowId} />
    </div>
  );
}
