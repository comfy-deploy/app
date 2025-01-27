import { SessionCreator } from "@/components/workspace/SessionView";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sessions/$sessionId/$workflowId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { sessionId, workflowId } = Route.useParams();

  return (
    <div className="h-full w-full">
      <SessionCreator workflowId={workflowId} sessionIdOverride={sessionId} />
    </div>
  );
}
