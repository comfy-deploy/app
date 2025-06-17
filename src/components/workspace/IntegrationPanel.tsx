import { CopyButton } from "@/components/ui/copy-button";
import { CodeBlock } from "@/components/ui/code-blocks";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { parseAsString } from "nuqs";
import { MyDrawer } from "../drawer";
import { Link2 } from "lucide-react";
import { useWorkflowIdInWorkflowPage } from "@/hooks/hook";
import { useCurrentWorkflow } from "@/hooks/use-current-workflow";
import { getInputsFromWorkflow } from "@/lib/getInputsFromWorkflow";

const backendRoute = `import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const inputs = await req.json()
  const res = await fetch('https://api.comfydeploy.com/api/run/deployment/queue', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + process.env.COMFY_DEPLOY_API_KEY,
    },
    body: JSON.stringify({ deployment_id: '<ID>', inputs })
  })
  const { run_id } = await res.json()
  return NextResponse.json({ run_id })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const run_id = searchParams.get('id')
  const res = await fetch('https://api.comfydeploy.com/api/run/' + run_id, {
    headers: { Authorization: 'Bearer ' + process.env.COMFY_DEPLOY_API_KEY }
  })
  const data = await res.json()
  return NextResponse.json(data)
}
`;

interface Session {
  url?: string;
  tunnel_url?: string;
}

interface IntegrationPanelProps {
  open: boolean;
  onClose: () => void;
}

export function IntegrationPanel({ open, onClose }: IntegrationPanelProps) {
  const [sessionId] = useQueryState("sessionId", parseAsString);

  const workflowId = useWorkflowIdInWorkflowPage();
  const { workflow } = useCurrentWorkflow(workflowId);
  const inputs = getInputsFromWorkflow(workflow?.version);

  const { data: session } = useQuery<Session>({
    enabled: !!sessionId,
    queryKey: ["session", sessionId],
  });

  const url = session?.url || session?.tunnel_url;

  const prompt = `Build a simple React form to trigger a ComfyDeploy deployment. Use the following inputs schema:\n${JSON.stringify(inputs, null, 2)}\nAsk the user for their ComfyDeploy API token and POST the form data to /api/comfy. Poll '/api/comfy?id=<run_id>' every 2 seconds until status is success and display the result.`;

  const encoded = typeof window !== "undefined" ? btoa(backendRoute) : "";
  const v0Url = `https://v0.dev/chat/api/open?title=ComfyDeploy%20Integration&prompt=${encodeURIComponent(prompt)}&content=${encoded}&target=app/api/comfy/route.ts`;

  if (!url) return null;

  return (
    <MyDrawer
      backgroundInteractive
      open={open}
      onClose={onClose}
      side="left"
      offset={14}
    >
      <div className="mt-2 space-y-4">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          <span className="font-medium">Integration</span>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/50 p-3">
            <div className="truncate text-muted-foreground text-sm">{url}</div>
            <CopyButton text={url} variant="outline" className="shrink-0" />
          </div>
          <CodeBlock lang="ts" code={backendRoute} />
          <div>
            <a href={v0Url} target="_blank" rel="noopener noreferrer">
              <img
                src="https://v0.dev/chat-static/button.svg"
                alt="Open in v0"
                width={99}
                height={32}
              />
            </a>
          </div>
        </div>
      </div>
    </MyDrawer>
  );
}
