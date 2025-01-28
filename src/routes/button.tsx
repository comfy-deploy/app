import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/button")({
  component: () => (
    <img src="/comfydeploy-button.svg" alt="button of comfy deploy" />
  ),
});
