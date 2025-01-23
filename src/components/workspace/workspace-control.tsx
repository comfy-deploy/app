import { useCallback, useEffect, useMemo, useRef } from "react";
import { sendEventToCD } from "./sendEventToCD";
import { useMatch, useRouter } from "@tanstack/react-router";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { WorkflowDropdown } from "@/components/workflow-dropdown";
import { useState } from "react";
import { useWorkflowIdInWorkflowPage } from "@/hooks/hook";
import { WorkflowList } from "@/components/workflow-dropdown";
import { VersionList } from "@/components/version-select";
import { parseAsInteger, useQueryState } from "nuqs";
import { useCurrentWorkflow } from "@/hooks/use-current-workflow";
import { useWorkflowStore } from "./Workspace";
import { useWorkflowVersion } from "../workflow-list";
import { WorkflowCommitVersion } from "./WorkflowCommitVersion";

function addMenuButtons(buttonConfigs: any) {
  sendEventToCD("configure_menu_buttons", buttonConfigs);
}

function addMenuLeftButtons(buttonConfigs: any) {
  addMenuButtons({
    containerSelector: "body > div.comfyui-body-top > div",
    buttonConfigs,
    buttonIdPrefix: "cd-button-left-",
    containerStyle: { order: "-1" },
  });
}

function addMenuRightButtons(buttonConfigs: any) {
  addMenuButtons({
    containerSelector: ".comfyui-menu-right .flex",
    buttonConfigs,
    buttonIdPrefix: "cd-button-",
    containerStyle: {},
  });
}

function configureWorkspaceButtons() {
  addMenuRightButtons([
    {
      id: "cd-button-save-image",
      icon: "pi-save",
      label: "Snapshot",
      tooltip: "Save the current image to your output directory.",
      event: "save_image",
      eventData: () => ({}),
    },
  ]);

  addMenuLeftButtons([
    {
      id: "cd-button-back",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
      tooltip: "Go back to the previous page.",
      event: "back",
      eventData: () => ({}),
    },
  ]);

  addMenuButtons({
    containerSelector: ".queue-button-group.flex",
    buttonIdPrefix: "cd-button-queue-",
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
  });

  addMenuButtons({
    containerSelector: "body > div.comfyui-body-top > div",
    buttonConfigs: [
      {
        id: "cd-button-workflow-1",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m16 3l4 4l-4 4m-6-4h10M8 13l-4 4l4 4m-4-4h9"/></svg>`,
        label: "Workflow",
        tooltip: "Go to Workflow 1",
        event: "workflow_1",
        // btnClasses: "",
        eventData: () => ({}),
      },
      {
        id: "cd-button-workflow-3",
        // icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m16 3l4 4l-4 4m-6-4h10M8 13l-4 4l4 4m-4-4h9"/></svg>`,
        label: "v1",
        tooltip: "Go to Workflow 1",
        event: "workflow_1",
        // btnClasses: "",
        eventData: () => ({}),
      },
      {
        id: "cd-button-workflow-2",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12 3v6"/><circle cx="12" cy="12" r="3"/><path d="M12 15v6"/></g></svg>`,
        label: "Commit",
        tooltip: "Commit the current workflow",
        event: "commit",
        style: {
          backgroundColor: "oklch(.476 .114 61.907)",
        },
        eventData: () => ({}),
      },
    ],
    buttonIdPrefix: "cd-button-workflow-",
    insertBefore: "body > div.comfyui-body-top > div > div.flex-grow",
    // containerStyle: { order: "3" }
  });

  addMenuButtons({
    containerSelector:
      "body > div.comfyui-body-top > div > div.flex-grow.min-w-0.app-drag.h-full",
    clearContainer: true,
    buttonConfigs: [],
    buttonIdPrefix: "cd-button-p-",
    containerStyle: { order: "-1" },
  });
}

function useWorkspaceEvents(
  callback: (event: string, data?: any) => void,
  endpoint: string,
) {
  useEffect(() => {
    const abortController = new AbortController();
    window.addEventListener(
      "message",
      (event) => {
        if (event.origin !== endpoint) return;

        try {
          if (typeof event.data !== "string") {
            return;
          }

          const data = JSON.parse(event.data);

          callback(data.type, data.data);
        } catch (error) {
          console.error("Error parsing message from iframe:", error);
        }
      },
      {
        capture: true,
        signal: abortController.signal,
      },
    );

    return () => {
      abortController.abort();
    };
  }, [callback, endpoint]);
}

function useWorkspaceButtons(
  props: {
    containerSelector: string;
    buttonConfigs: Array<{
      id: string;
      icon?: string;
      label?: string;
      tooltip?: string;
      event: string;
      eventData?: () => any;
      onClick?: (event: string, data: any) => void;
      btnClasses?: string;
      style?: React.CSSProperties;
    }>;
    buttonIdPrefix?: string;
    containerStyle?: React.CSSProperties;
    insertBefore?: string;
    clearContainer?: boolean;
  },
  endpoint: string,
) {
  // Store onClick handlers
  const eventHandlers = useRef<Record<string, (data: any) => void>>({});

  // Initialize button configurations
  useEffect(() => {
    // Strip out onClick handlers before sending to CD
    const configsWithoutHandlers = props.buttonConfigs.map((config) => {
      const { onClick, ...rest } = config;
      if (onClick) {
        eventHandlers.current[config.event] = onClick;
      }
      return rest;
    });

    addMenuButtons({
      containerSelector: props.containerSelector,
      buttonConfigs: configsWithoutHandlers,
      buttonIdPrefix: props.buttonIdPrefix,
      containerStyle: props.containerStyle,
      insertBefore: props.insertBefore,
      clearContainer: props.clearContainer,
    });
  }, [props]);

  // Handle events
  const handleEvent = useCallback((event: string, data: any) => {
    // console.log("handleEvent", event, data);
    const handler = eventHandlers.current[event];
    if (handler) {
      handler(data);
    }
  }, []);

  // Setup event listener
  useWorkspaceEvents(handleEvent, endpoint);

  return null;
}

export function WorkspaceControls(props: {
  endpoint: string;
}) {
  const [isWorkflowDialogOpen, setIsWorkflowDialogOpen] = useState(false);
  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false);
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

  const [version, setVersion] = useQueryState("version", {
    defaultValue: flatData[0]?.version ?? 1,
    ...parseAsInteger,
  });

  const [displayCommit, setDisplayCommit] = useState(false);

  // Right menu buttons
  useWorkspaceButtons(
    {
      containerSelector: ".comfyui-menu-right .flex",
      buttonConfigs: [
        {
          id: "save-image",
          icon: "pi-save",
          label: "Snapshot",
          tooltip: "Save the current image to your output directory.",
          event: "save_image",
        },
      ],
      buttonIdPrefix: "cd-button-",
    },
    props.endpoint,
  );

  // Left menu buttons
  useWorkspaceButtons(
    {
      containerSelector: "body > div.comfyui-body-top > div",
      buttonConfigs: [
        {
          id: "back",
          icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`,
          tooltip: "Go back to the previous page.",
          event: "back",
          onClick: (event, data) => {
            router.navigate({
              to: "/home",
            });
          },
        },
      ],
      buttonIdPrefix: "cd-button-left-",
      containerStyle: { order: "-1" },
    },
    props.endpoint,
  );

  // Queue buttons
  useWorkspaceButtons(
    {
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
    },
    props.endpoint,
  );

  // Workflow buttons
  useWorkspaceButtons(
    {
      containerSelector: "body > div.comfyui-body-top > div",
      buttonConfigs: [
        {
          id: "workflow-1",
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m16 3l4 4l-4 4m-6-4h10M8 13l-4 4l4 4m-4-4h9"/></svg>`,
          label: workflow?.name || "Workflow",
          tooltip: "Select a workflow",
          event: "change_workflow",
          onClick: () => {
            setIsWorkflowDialogOpen(true);
          },
        },
        {
          id: "workflow-3",
          label: `v${version}`,
          tooltip: "Select version",
          event: "change_version",
          onClick: () => {
            setIsVersionDialogOpen(true);
          },
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
          onClick: (event, data) => {
            setDisplayCommit(true);
          },
        },
      ],
      buttonIdPrefix: "cd-button-workflow-",
      insertBefore: "body > div.comfyui-body-top > div > div.flex-grow",
    },
    props.endpoint,
  );

  // Clear container buttons
  useWorkspaceButtons(
    {
      containerSelector:
        "body > div.comfyui-body-top > div > div.flex-grow.min-w-0.app-drag.h-full",
      buttonConfigs: [],
      buttonIdPrefix: "cd-button-p-",
      containerStyle: { order: "-1" },
      clearContainer: true,
    },
    props.endpoint,
  );

  return (
    <>
      {displayCommit && (
        <WorkflowCommitVersion
          setOpen={setDisplayCommit}
          endpoint={props.endpoint}
        />
      )}

      <Dialog
        open={isWorkflowDialogOpen}
        onOpenChange={setIsWorkflowDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <WorkflowList
            workflow_id={workflowId || ""}
            onNavigate={(id) => {
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
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isVersionDialogOpen} onOpenChange={setIsVersionDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <VersionList
            workflow_id={workflowId || ""}
            onClose={() => {
              setIsVersionDialogOpen(false);
            }}
            // onSelect={(version) => {
            //   setIsVersionDialogOpen(false);
            // }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
