import { Link, useRouter } from "@tanstack/react-router";
import { useWorkspaceButtons } from "./workspace-control";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";
import { WorkflowList } from "@/components/workflow-dropdown";
import { VersionList } from "@/components/version-select";
import { WorkflowCommitVersion } from "./WorkflowCommitVersion";
import { useState, useEffect, useMemo } from "react";
import { useMatch } from "@tanstack/react-router";
import { useWorkflowIdInWorkflowPage } from "@/hooks/hook";
import { useCurrentWorkflow } from "@/hooks/use-current-workflow";
import { useWorkflowVersion } from "../workflow-list";
import { useWorkflowStore } from "./Workspace";
import { parseAsInteger, useQueryState } from "nuqs";
import { useQuery } from "@tanstack/react-query";
import { useMachine, useMachineVersions } from "@/hooks/use-machine";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { callServerPromise } from "@/lib/call-server-promise";
import { api } from "@/lib/api";
import { ExternalLink, History, Plus } from "lucide-react";
import { MachineVersionListItem } from "../machine/machine-deployment";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Progress } from "../ui/progress";
import { Timer } from "../workflows/Timer";
import { toast } from "sonner";

interface WorkspaceButtonProps {
  endpoint: string;
}

export function RightMenuButtons({ endpoint }: WorkspaceButtonProps) {
  const match = useMatch({
    from: "/sessions/$sessionId/",
    shouldThrow: false,
  });

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
        {
          id: "assets",
          icon: "pi-box",
          label: "Assets",
          //   icon: "pi-image",
          tooltip: "Assets",
          event: "assets",
          //   btnClasses:
          //     "p-button p-component p-button-icon-only p-button-secondary p-button-text",
        },
      ],
      buttonIdPrefix: "cd-button-",
    };
  }, []);

  const { data: session, refetch } = useQuery<any>({
    queryKey: ["session", match?.params.sessionId],
    enabled: !!match?.params.sessionId,
  });

  const { data: machine } = useMachine(session?.machine_id);

  useWorkspaceButtons(data, endpoint);

  const [machineName, setMachineName] = useState(machine?.name);

  const { data: machineVersions, isLoading: isLoadingMachineVersions } =
    useMachineVersions(machine?.id);

  const versions = machineVersions?.pages[0] || [];

  return (
    <Dialog open={isWorkflowDialogOpen} onOpenChange={setIsWorkflowDialogOpen}>
      <DialogContent hideOverlay className="sm:max-w-[600px]">
        <DialogTitle>Snapshot</DialogTitle>

        {!machine && (
          <div className="flex flex-col gap-2">
            <div className="text-muted-foreground text-sm">
              No existing machine, create a new one.
            </div>
            <Input
              placeholder="Machine Name"
              value={machineName}
              onChange={(e) => setMachineName(e.target.value)}
            />
            <div className="flex justify-end">
              <Button
                className="w-fit"
                onClick={async () => {
                  await callServerPromise(
                    api({
                      url: `session/${match?.params.sessionId}/snapshot`,
                      init: {
                        method: "POST",
                        body: JSON.stringify({
                          machine_name: machineName,
                        }),
                      },
                    }),
                  );
                  await refetch();
                }}
              >
                Create Machine
              </Button>
            </div>
          </div>
        )}

        {machine && (
          <div className="flex flex-col gap-2">
            <Link
              target="_blank"
              to="/machines/$machineId"
              className="flex items-center gap-2 hover:underline"
              params={{ machineId: machine.id }}
            >
              {machine.name}
              <ExternalLink className="w-4 h-4" />
            </Link>
            {versions?.map((version) => (
              <MachineVersionListItem
                key={version.id}
                machineVersion={version}
                machine={machine}
                target={"_blank"}
              />
            ))}
            <div className="flex justify-end">
              <Button
                onClick={async () => {
                  await callServerPromise(
                    api({
                      url: `session/${match?.params.sessionId}/snapshot`,
                      init: {
                        method: "POST",
                      },
                    }),
                  );
                }}
              >
                Create new Snapshot
              </Button>
            </div>
          </div>
        )}
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
  const match = useMatch({
    from: "/sessions/$sessionId/",
    shouldThrow: false,
  });

  const { data: session, refetch } = useQuery<any>({
    queryKey: ["session", match?.params.sessionId],
    enabled: !!match?.params.sessionId,
    refetchInterval: 1000,
  });

  const [timerDialogOpen, setTimerDialogOpen] = useState(false);
  const [selectedIncrement, setSelectedIncrement] = useState("5");

  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    if (!session?.timeout_end) return;

    const targetTime = new Date(session.timeout_end).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetTime - now;

      if (distance < 0) {
        setCountdown("00:00:00");
        return;
      }

      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setCountdown(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
      );
    };

    const intervalId = setInterval(updateCountdown, 1000);

    return () => clearInterval(intervalId);
  }, [session?.timeout_end]);

  const data = useMemo(() => {
    const targetTime = session?.timeout_end
      ? new Date(session.timeout_end).getTime()
      : 0;
    const now = new Date().getTime();
    const distance = targetTime - now;
    const isLessThan10Seconds = distance > 0 && distance < 20000;

    return {
      containerSelector: ".queue-button-group.flex",
      buttonConfigs: [
        {
          id: "timeout",
          label: `${countdown} left`,
          icon: "pi-stopwatch",
          tooltip: "Timeout",
          event: "timeout",
          style: {
            backgroundColor: isLessThan10Seconds
              ? "oklch(.476 .114 61.907)"
              : "",
          },
          btnClasses: "p-button p-component p-button-text",
          onClick: (_: string, __: unknown) => setTimerDialogOpen(true),
        },
      ],
      buttonIdPrefix: "cd-button-queue-",
    };
  }, [countdown, session?.timeout_end]);

  const timeIncrements = [
    { value: "1", label: "1 minute" },
    { value: "5", label: "5 minutes" },
    { value: "10", label: "10 minutes" },
    { value: "15", label: "15 minutes" },
  ];

  const incrementTime = async () => {
    if (!session) {
      toast.error("Session details not found");
      return;
    }

    await callServerPromise(
      api({
        url: `session/${match?.params.sessionId}/increase-timeout`,
        init: {
          method: "POST",
          body: JSON.stringify({
            minutes: Number(selectedIncrement),
          }),
        },
      }),
    );

    await refetch();
    // toast.success(`Session time increased by ${selectedIncrement} minutes`);
    setTimerDialogOpen(false);
  };

  useWorkspaceButtons(data, endpoint);

  return (
    <Dialog open={timerDialogOpen} onOpenChange={setTimerDialogOpen}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Increase Session Time</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center text-muted-foreground text-sm">
              <span className="flex items-center space-x-2">
                Instance:{" "}
                <span className="ml-1 font-medium">{session?.gpu}</span>
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center justify-between rounded-none bg-muted/50 px-0 px-2 py-3">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Time Remaining</span>
                </div>
                <span className="font-medium text-sm">{countdown}</span>
              </div>
              {session?.timeout && session?.created_at && (
                <Progress
                  value={
                    ((new Date(session.timeout_end).getTime() -
                      new Date().getTime()) /
                      (new Date(session.timeout_end).getTime() -
                        new Date(session.created_at).getTime())) *
                    100
                  }
                  className="h-2"
                />
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Select
              value={selectedIncrement}
              onValueChange={setSelectedIncrement}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Minutes" />
              </SelectTrigger>
              <SelectContent>
                {timeIncrements.map((increment) => (
                  <SelectItem key={increment.value} value={increment.value}>
                    {increment.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={incrementTime} className="flex-1">
              <Plus className="mr-2 h-4 w-4" /> Add Time
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface WorkflowButtonsProps extends WorkspaceButtonProps {
  machine_id?: string;
}

export function WorkflowButtons({
  endpoint,
  machine_id,
}: WorkflowButtonsProps) {
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
        <WorkflowCommitVersion
          setOpen={setDisplayCommit}
          endpoint={endpoint}
          machine_id={machine_id}
        />
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

  useWorkspaceButtons(
    {
      containerSelector:
        "body > div.graph-canvas-container > div > div.p-splitterpanel.p-splitterpanel-nested > div > div.p-splitterpanel.graph-canvas-panel.relative > div",
      buttonConfigs: [],
      buttonIdPrefix: "cd-button-p-",
      containerStyle: { order: "-1" },
      clearContainer: true,
    },
    endpoint,
  );

  return <></>;
}
