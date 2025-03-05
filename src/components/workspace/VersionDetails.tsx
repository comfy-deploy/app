"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { customInputNodes } from "@/lib/customInputNodes";
import { getInputsFromWorkflowAPI } from "@/lib/getInputsFromWorkflow";
import { useSelectedVersion } from "./Workspace";
import { useQuery } from "@tanstack/react-query";

export function ExternalInputsDisplay(props: {
  workflow_api?: any;
  version?: number;
}) {
  const inputs = getInputsFromWorkflowAPI(props.workflow_api);

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center gap-1 font-bold text-sm">
        External Inputs{" "}
        <Badge>{props.version ? `v${props.version}` : ""}</Badge>
        <a
          href="https://www.comfydeploy.com/docs/v2/deployments/inputs"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline text-xs text-muted-foreground"
        >
          Learn more
        </a>
      </div>
      <div className="rounded-lg border p-2">
        {inputs && inputs.length > 0 ? (
          <div className="flex flex-col gap-2">
            {inputs.map((value) => {
              if (!value || !value.class_type) return <> </>;
              const nodeType = (customInputNodes as any)[value.class_type];
              if (nodeType) {
                const input_id = value.input_id;
                const defaultValue = value.default_value;
                return (
                  <div key={input_id}>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="secondary">
                          <div>
                            {input_id}
                            {" : "}
                            <span className="text-orange-500">{nodeType}</span>
                          </div>
                        </Badge>
                        {/* {nodeType}{" "} */}
                        {/* <Button variant="outline">Hover</Button> */}
                      </TooltipTrigger>
                      <TooltipContent>
                        Default Value: {defaultValue}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                );
              }
              return <></>;
            })}
          </div>
        ) : (
          <span className="flex items-center gap-1 text-sm text-gray-500 px-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <title>Info Icon</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M12 20.5c4.694 0 8.5-3.806 8.5-8.5S16.694 3.5 12 3.5 3.5 7.306 3.5 12s3.806 8.5 8.5 8.5z"
              />
            </svg>
            No external inputs available
          </span>
        )}
      </div>
    </div>
  );
}

export function VersionDetails({
  workflow_version_id,
}: {
  workflow_version_id: string;
}) {
  const { data: versionData } = useQuery<any>({
    queryKey: ["workflow-version", workflow_version_id],
  });

  return (
    <ExternalInputsDisplay
      workflow_api={versionData?.workflow_api ?? undefined}
      version={versionData?.version ?? undefined}
    />
  );
}
