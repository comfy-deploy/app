import { CopyButton } from "@/components/ui/copy-button";
import { useQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { parseAsString } from "nuqs";
import { MyDrawer } from "../drawer";
import { Link2 } from "lucide-react";

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

  const { data: session } = useQuery<Session>({
    enabled: !!sessionId,
    queryKey: ["session", sessionId],
  });

  const url = session?.url || session?.tunnel_url;

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
        </div>
      </div>
    </MyDrawer>
  );
}
