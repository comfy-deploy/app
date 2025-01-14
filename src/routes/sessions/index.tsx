import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sessions/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/sessions"!</div>;
}
