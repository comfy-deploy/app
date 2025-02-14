import { createFileRoute, notFound, redirect } from "@tanstack/react-router";

const pages = [
  // "workspace",
  "requests",
  "containers",
  "deployment",
  "playground",
  "gallery",
];

export const Route = createFileRoute("/workflows/$workflowId/$view")({
  beforeLoad(ctx) {
    let { view } = ctx.params;

    // Redirect workspace to requests
    if (view === "workspace") {
      view = "requests";
      // You'll need to handle the redirect here
      throw redirect({
        to: "/workflows/$workflowId/$view",
        params: { view: "requests", workflowId: ctx.params.workflowId },
      });
    }

    if (!pages.includes(view)) {
      throw notFound();
    }
  },
});
