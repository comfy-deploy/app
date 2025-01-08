import { AnalyticsClient } from "@/components/analytics/client";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/analytics/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <AnalyticsClient />;
}
