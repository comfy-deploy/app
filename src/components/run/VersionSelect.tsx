import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Copy } from "lucide-react";
import { parseAsInteger, useQueryState } from "nuqs";
import { usePostHog } from "posthog-js/react";
import { type RefObject, useEffect, useState } from "react";
import { toast } from "sonner";
import { create } from "zustand";

import { type LogsType, LogsViewer } from "@/components/log/logs-viewer";
import { useCurrentWorkflow } from "@/hooks/use-current-workflow";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

export function useWorkflowVersion(workflow: any) {
  return useQueryState("version", {
    defaultValue: workflow?.versions?.[0].version ?? 1,
    ...parseAsInteger,
  });
}

type SelectedMachineStore = {
  selectedMachine: string | undefined;
  setSelectedMachine: (machine: string) => void;
  machine: Omit<MachineType, "build_log"> | undefined;
  setMachine: (machine: Omit<MachineType, "build_log">) => void;
};

export const selectedMachineStore = create<SelectedMachineStore>((set) => ({
  selectedMachine: undefined,
  setSelectedMachine: (machine) => set(() => ({ selectedMachine: machine })),
  machine: undefined,
  setMachine: (machine) => set(() => ({ machine: machine })),
}));

type status = {
  state: string;
  live_status: string;
  progress: number;
};

type PublicRunStore = {
  image:
    | {
        url: string;
      }[]
    | null;
  loading: boolean;
  runId: string;
  status: status | null;
  logs: LogsType;
  addLogs: (logs: LogsType) => void;
  setImage: (image: { url: string }[]) => void;
  setLoading: (loading: boolean) => void;
  setRunId: (runId: string) => void;
  setStatus: (status: status) => void;
};

export const publicRunStore = create<PublicRunStore>((set) => ({
  image: null,
  loading: false,
  runId: "",
  status: null,
  logs: [],
  setImage: (image) => set({ image }),
  setLoading: (loading) => set({ loading }),
  setRunId: (runId) => set({ runId }),
  setStatus: (status) => set({ status }),

  addLogs: (logs) => set((state) => ({ logs: [...state.logs, ...logs] })),
}));

export function SharedRunLogs() {
  const { logs } = publicRunStore();
  return (
    <LogsViewer
      stickToBottom
      logs={logs}
      containerClassName="w-full h-[300px]"
      className="overflow-auto "
    />
  );
}

function useOnScreen(ref: RefObject<any>, rootMargin = "0px") {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        rootMargin,
      },
    );

    const currentElement = ref?.current;

    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      observer.unobserve(currentElement);
    };
  }, []);

  return isVisible;
}

export async function getWorkflowJSON(
  workflow_name: string,
  workflow_id: string,
  version: number,
  auth: string | null,
) {
  if (!auth) {
    toast.error("No auth token");
    throw new Error("No auth token");
  }

  const id = toast.loading("Version loading...");

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_CD_API_URL}/api/workflow/${workflow_id}/version/${version}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth}`,
      },
    },
  );
  const data = await response.json();

  toast.dismiss(id);

  if (!data) {
    toast.error("Unable to load version");
    throw new Error("Unable to load version");
  }

  data?.workflow?.nodes.forEach((x: any) => {
    if (x?.type === "ComfyDeploy") {
      console.log(x);

      x.widgets_values[0] = workflow_name;
      x.widgets_values[1] = workflow_id;
      x.widgets_values[2] = data.version;
    }
  });

  return data;
}

export function CopyWorkflowVersion({
  workflow_id,
  version,
  machine_version_id,
  className,
}: {
  workflow_id: string;
  version: number;
  machine_version_id?: string;
  className?: string;
}) {
  const { workflow } = useCurrentWorkflow(workflow_id);
  const fetchToken = useAuthStore((state) => state.fetchToken);
  const posthog = usePostHog();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className={cn("h-9 gap-2", className)} variant="ghost">
          <Copy size={12} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuItem
          onClick={async (e) => {
            e.stopPropagation();
            e.preventDefault();
            if (!workflow) return;

            const data = await getWorkflowJSON(
              workflow.name,
              workflow.id,
              version,
              await fetchToken(),
            );

            posthog.capture("workflow_page:copy_workflow_button_click", {
              workflow_id: workflow.id,
              workflow_version_id: data.id,
              workflow_version: version,
              workflow_copy_type: "classic",
            });

            navigator.clipboard.writeText(JSON.stringify(data?.workflow));
            toast("Copied to clipboard");
          }}
        >
          Copy (JSON)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async (e) => {
            e.stopPropagation();
            e.preventDefault();
            if (!workflow) return;
            const id = toast.loading("Version loading...");
            const data = await getWorkflowJSON(
              workflow.name,
              workflow.id,
              version,
              await fetchToken(),
            );
            toast.dismiss(id);

            if (!data) {
              toast.error("Unable to load version");
              return;
            }

            posthog.capture("workflow_page:copy_workflow_button_click", {
              workflow_id: workflow.id,
              workflow_version_id: data.id,
              workflow_version: version,
              workflow_copy_type: "api",
            });

            navigator.clipboard.writeText(JSON.stringify(data?.workflow_api));
            toast("Copied to clipboard");
          }}
        >
          Copy API (JSON)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async (e) => {
            e.stopPropagation();
            e.preventDefault();
            if (!workflow) return;

            const id = toast.loading("Loading export format...");
            try {
              const data = await api({
                url: `workflow/${workflow_id}/export`,
                params: { version },
              });

              posthog.capture("workflow_page:copy_workflow_button_click", {
                workflow_id: workflow.id,
                workflow_version: version,
                workflow_copy_type: "export",
              });

              navigator.clipboard.writeText(JSON.stringify(data));
              toast("Copied export format to clipboard");
            } catch (error) {
              console.error("Error copying export format:", error);
              toast.error("Failed to copy export format");
            } finally {
              toast.dismiss(id);
            }
          }}
          disabled={!machine_version_id}
        >
          Copy Export Format
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function getWorkflowVersionFromVersionIndex(
  workflow: any,
  version: number,
) {
  const workflow_version = workflow?.versions.find(
    (x) => x.version === version,
  );

  return workflow_version;
}
