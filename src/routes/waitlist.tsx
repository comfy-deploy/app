import { createFileRoute } from "@tanstack/react-router";
import { Waitlist } from "@clerk/clerk-react";

export const Route = createFileRoute("/waitlist")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Waitlist />
    </div>
  );
}
