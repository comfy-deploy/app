import { useRouter } from "@tanstack/react-router";
import { useWorkspaceButtons } from "./workspace-control";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { WorkflowList } from "@/components/workflow-dropdown";
import { VersionList } from "@/components/version-select";
import { WorkflowCommitVersion } from "./WorkflowCommitVersion";
import { useState } from "react";
import { useMatch } from "@tanstack/react-router";
import { useWorkflowIdInWorkflowPage } from "@/hooks/hook";
import { useCurrentWorkflow } from "@/hooks/use-current-workflow";
import { useWorkflowVersion } from "../workflow-list";
import { useWorkflowStore } from "./Workspace";
import { parseAsInteger, useQueryState } from "nuqs";
import { useMemo } from "react";

interface WorkspaceButtonProps {
  endpoint: string;
}

export function RightMenuButtons({ endpoint }: WorkspaceButtonProps) {
  const [isWorkflowDialogOpen, setIsWorkflowDialogOpen] = useState(false);
  const data = useMemo(() => {
    return {
      containerSelector: ".comfyui-menu-right .flex",
      buttonConfigs: [
        {
          id: "save-image",
          icon: "pi-save",
          label: "Snapshot",
          tooltip: "Save the current image to your output directory.",
          event: "save_image",
          onClick: (_: string, __: unknown) => setIsWorkflowDialogOpen(true),
        },
      ],
      buttonIdPrefix: "cd-button-",
    };
  }, []);

  useWorkspaceButtons(data, endpoint);

  return (
    <Dialog open={isWorkflowDialogOpen} onOpenChange={setIsWorkflowDialogOpen}>
      <DialogContent hideOverlay className="sm:max-w-[425px]">
        hi
      </DialogContent>
    </Dialog>
  );
}

export function LeftMenuButtons({ endpoint }: WorkspaceButtonProps) {
  const router = useRouter();

  const data = useMemo(() => {
    return {
      containerSelector: "body > div.comfyui-body-top > div",
      buttonConfigs: [
        {
          id: "back",
          icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,
          tooltip: "Go back to the previous page.",
          event: "back",
          onClick: (_: string, __: unknown) => {
            router.navigate({
              to: "/home",
            });
          },
        },
      ],
      buttonIdPrefix: "cd-button-left-",
      containerStyle: { order: "-1" },
    };
  }, [router]);

  useWorkspaceButtons(data, endpoint);

  return <></>;
}

export function QueueButtons({ endpoint }: WorkspaceButtonProps) {
  const data = useMemo(() => {
    return {
      containerSelector: ".queue-button-group.flex",
      buttonConfigs: [
        {
          id: "assets",
          icon: "pi-image",
          tooltip: "Assets",
          event: "assets",
          btnClasses:
            "p-button p-component p-button-icon-only p-button-secondary p-button-text",
        },
      ],
      buttonIdPrefix: "cd-button-queue-",
    };
  }, []);

  useWorkspaceButtons(data, endpoint);

  return <></>;
}

interface WorkflowButtonsProps extends WorkspaceButtonProps {}

export function WorkflowButtons({ endpoint }: WorkflowButtonsProps) {
  const [isWorkflowDialogOpen, setIsWorkflowDialogOpen] = useState(false);
  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false);
  const [displayCommit, setDisplayCommit] = useState(false);

  const router = useRouter();
  const workflowId = useWorkflowIdInWorkflowPage();
  const match = useMatch({
    from: "/sessions/$sessionId/",
    shouldThrow: false,
  });

  const { workflow } = useCurrentWorkflow(workflowId);
  const query = useWorkflowVersion(workflowId || "", "");
  const { hasChanged } = useWorkflowStore();

  const flatData = useMemo(() => query.data?.pages.flat() ?? [], [query.data]);

  const [version] = useQueryState("version", {
    defaultValue: flatData[0]?.version ?? 1,
    ...parseAsInteger,
  });

  const handleWorkflowSelect = (id: string) => {
    router.navigate({
      to: "/sessions/$sessionId",
      params: {
        sessionId: match?.params.sessionId || "",
      },
      search: {
        workflowId: id,
      },
    });
    setIsWorkflowDialogOpen(false);
  };

  const data = useMemo(() => {
    return {
      containerSelector: "body > div.comfyui-body-top > div",
      buttonConfigs: [
        {
          id: "workflow-1",
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m16 3l4 4l-4 4m-6-4h10M8 13l-4 4l4 4m-4-4h9"/></svg>`,
          label: workflow?.name || "Workflow",
          tooltip: "Select a workflow",
          event: "change_workflow",
          onClick: (_: string, __: unknown) => setIsWorkflowDialogOpen(true),
        },
        {
          id: "workflow-3",
          label: `v${version}`,
          tooltip: "Select version",
          event: "change_version",
          onClick: (_: string, __: unknown) => setIsVersionDialogOpen(true),
        },
        {
          id: "workflow-2",
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12 3v6"/><circle cx="12" cy="12" r="3"/><path d="M12 15v6"/></g></svg>`,
          label: "Commit",
          tooltip: "Commit the current workflow",
          event: "commit",
          style: {
            backgroundColor: "oklch(.476 .114 61.907)",
            display: !hasChanged ? "none" : "flex",
          },
          onClick: (_: string, __: unknown) => setDisplayCommit(true),
        },
      ],
      buttonIdPrefix: "cd-button-workflow-",
      insertBefore: "body > div.comfyui-body-top > div > div.flex-grow",
    };
  }, [workflow?.name, version, hasChanged]);

  useWorkspaceButtons(data, endpoint);

  return (
    <>
      {displayCommit && (
        <WorkflowCommitVersion setOpen={setDisplayCommit} endpoint={endpoint} />
      )}

      <Dialog
        open={isWorkflowDialogOpen}
        onOpenChange={setIsWorkflowDialogOpen}
      >
        <DialogContent hideOverlay className="sm:max-w-[425px]">
          <WorkflowList
            workflow_id={workflowId || ""}
            onNavigate={handleWorkflowSelect}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isVersionDialogOpen} onOpenChange={setIsVersionDialogOpen}>
        <DialogContent hideOverlay className="sm:max-w-[425px]">
          <VersionList
            workflow_id={workflowId || ""}
            onClose={() => {
              setIsVersionDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ClearContainerButtons({ endpoint }: WorkspaceButtonProps) {
  useWorkspaceButtons(
    {
      containerSelector:
        "body > div.comfyui-body-top > div > div.flex-grow.min-w-0.app-drag.h-full",
      buttonConfigs: [],
      buttonIdPrefix: "cd-button-p-",
      containerStyle: { order: "-1" },
      clearContainer: true,
    },
    endpoint,
  );

  return <></>;
}
