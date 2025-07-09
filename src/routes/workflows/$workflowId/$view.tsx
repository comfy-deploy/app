import { createFileRoute, notFound } from "@tanstack/react-router";

const pages = [
  "workspace",
  "requests",
  "containers",
  "deployment",
  "playground",
  "gallery",
  "machine",
  "model",
];

export const Route = createFileRoute("/workflows/$workflowId/$view")({
  beforeLoad(ctx) {
    const { view } = ctx.params;

    if (!pages.includes(view)) {
      throw notFound();
    }
  },
});
