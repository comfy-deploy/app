import { useCallback, useEffect, useRef } from "react";
import { sendEventToCD } from "./sendEventToCD";
import {
  RightMenuButtons,
  LeftMenuButtons,
  QueueButtons,
  WorkflowButtons,
  ClearContainerButtons,
} from "./workspace-buttons";
import React from "react";

interface ButtonConfig {
  id: string;
  icon?: string;
  label?: string;
  tooltip?: string;
  event: string;
  eventData?: () => unknown;
  onClick?: (event: string, data: unknown) => void;
  btnClasses?: string;
  style?: React.CSSProperties;
}

interface WorkspaceButtonsProps {
  containerSelector: string;
  buttonConfigs: ButtonConfig[];
  buttonIdPrefix?: string;
  containerStyle?: React.CSSProperties;
  insertBefore?: string;
  clearContainer?: boolean;
}

interface MenuButtonsConfig {
  containerSelector: string;
  buttonConfigs: ButtonConfig[];
  buttonIdPrefix?: string;
  containerStyle?: React.CSSProperties;
  insertBefore?: string;
  clearContainer?: boolean;
}

function addMenuButtons(config: MenuButtonsConfig) {
  sendEventToCD("configure_menu_buttons", config);
}

function useWorkspaceEvents(
  callback: (event: string, data?: unknown) => void,
  endpoint: string,
) {
  useEffect(() => {
    const abortController = new AbortController();
    window.addEventListener(
      "message",
      (event) => {
        // console.log(event);
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
      //   console.log("aborting");
      abortController.abort();
    };
  }, [callback, endpoint]);
}

// Export the hook for use in button components
export function useWorkspaceButtons(
  props: WorkspaceButtonsProps,
  endpoint: string,
) {
  // Store onClick handlers
  const eventHandlers = useRef<Record<string, (data: unknown) => void>>({});
  // Initialize button configurations
  const update = useCallback(() => {
    // Strip out onClick handlers before sending to CD
    const configsWithoutHandlers = props.buttonConfigs.map((config) => {
      const { onClick, ...rest } = config;
      if (onClick) {
        // Convert two-parameter handler to single parameter handler
        eventHandlers.current[config.event] = (data: unknown) =>
          onClick(config.event, data);
      }
      return rest;
    });

    // console.log("adding buttons");

    addMenuButtons({
      containerSelector: props.containerSelector,
      buttonConfigs: configsWithoutHandlers,
      buttonIdPrefix: props.buttonIdPrefix,
      containerStyle: props.containerStyle,
      insertBefore: props.insertBefore,
      clearContainer: props.clearContainer,
    });
  }, [props]);

  useEffect(() => {
    update();
  }, [update]);

  const handleEvent = useCallback(
    (event: string, data: unknown) => {
      // console.log("handleEvent", event, data);
      if (event === "cd_plugin_setup") {
        update();
      }

      const handler = eventHandlers.current[event];
      if (handler) {
        handler(data);
      }
    },
    [update],
  );

  // Setup event listener
  useWorkspaceEvents(handleEvent, endpoint);

  return null;
}

export const WorkspaceControls = React.memo(function WorkspaceControls(props: {
  endpoint: string;
  machine_id?: string;
  machine_version_id?: string;
}) {
  return (
    <>
      {/* <RightMenuButtons endpoint={props.endpoint} /> */}
      {/* <LeftMenuButtons endpoint={props.endpoint} /> */}
      {/* <QueueButtons endpoint={props.endpoint} /> */}
      {/* <WorkflowButtons
        endpoint={props.endpoint}
        machine_id={props.machine_id}
        machine_version_id={props.machine_version_id}
      /> */}
      <ClearContainerButtons endpoint={props.endpoint} />
    </>
  );
});
