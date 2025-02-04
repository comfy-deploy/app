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

export function ExternalInputsDisplay(props: {
  workflow_api?: any;
  version?: number;
}) {
  const inputs = getInputsFromWorkflowAPI(props.workflow_api);

  return (
    <div className="mt-4 space-y-2">
      <div className="font-bold text-sm">
        Workflow Inputs{" "}
        <Badge>{props.version ? `(v${props.version})` : ""}</Badge>
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
          <span className="text-sm">No external inputs</span>
        )}
      </div>
    </div>
  );
}

export function VersionDetails({
  workflow_id,
}: {
  workflow_id: string;
}) {
  const { value } = useSelectedVersion(workflow_id);

  return (
    <ExternalInputsDisplay
      workflow_api={value?.workflow_api ?? undefined}
      version={value?.version ?? undefined}
    />
  );
}
