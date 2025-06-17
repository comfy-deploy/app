import { Fab } from "@/components/fab";
import WorkflowImport from "@/components/onboarding/workflow-import";
import { useIsAdminAndMember } from "@/components/permissions";
import { WorkflowList } from "@/components/workflow-list";
import { useCurrentPlan } from "@/hooks/use-current-plan";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";

export const Route = createLazyFileRoute("/workflows/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate({ from: "/workflows" });
  const { view } = Route.useSearch();
  const sub = useCurrentPlan();
  const isAdminOrMember = useIsAdminAndMember();

  useKeyboardShortcut(
    "c",
    () => {
      if (!sub?.features.workflowLimited) {
        navigate({
          search: { view: "import" },
        });
      }
    },
    {
      exactPath: "/workflows",
    },
  );

  return (
    <>
      {view === "import" ? <WorkflowImport /> : <WorkflowList />}

      {!view && (
        <Fab
          refScrollingContainerKey="fab-workflow-list [data-radix-scroll-area-viewport]"
          mainItem={{
            name: "Create Workflow",
            icon: Plus,
            onClick: () => {
              if (!sub?.features.workflowLimited && isAdminOrMember) {
                navigate({
                  search: { view: "import" },
                });
              }
            },
          }}
          disabled={{
            disabled: sub?.features.workflowLimited || !isAdminOrMember,
            disabledText: sub?.features.workflowLimited 
              ? "Workflow Limit Exceeded." 
              : "Insufficient permissions to create workflows.",
          }}
        />
      )}
    </>
  );
}
