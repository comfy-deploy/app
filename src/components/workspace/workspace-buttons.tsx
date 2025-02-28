import { Link, useRouter, useSearch } from "@tanstack/react-router";
import { useWorkspaceButtons } from "./workspace-control";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { WorkflowList } from "@/components/workflow-dropdown";
import { VersionList } from "@/components/version-select";
import { WorkflowCommitVersion } from "./WorkflowCommitVersion";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useMatch } from "@tanstack/react-router";
import { useWorkflowIdInWorkflowPage } from "@/hooks/hook";
import { useCurrentWorkflow } from "@/hooks/use-current-workflow";
import { useWorkflowVersion } from "../workflow-list";
import { useCDStore, useWorkflowStore } from "./Workspace";
import { parseAsInteger, useQueryState } from "nuqs";
import { useQuery } from "@tanstack/react-query";
import { useMachine, useMachineVersions } from "@/hooks/use-machine";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { callServerPromise } from "@/lib/call-server-promise";
import { api } from "@/lib/api";
import { ExternalLink, History, Loader2, Plus, X } from "lucide-react";
import { MachineVersionListItem } from "../machine/machine-deployment";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Progress } from "../ui/progress";
import { toast } from "sonner";
import { defaultWorkflowTemplates } from "@/utils/default-workflow";
import { sendEventToCD, sendWorkflow } from "./sendEventToCD";
import { Label } from "../ui/label";
import Cookies from "js-cookie";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { getOptimizedImage } from "@/lib/utils";

interface WorkspaceButtonProps {
  endpoint: string;
}

export function RightMenuButtons({ endpoint }: WorkspaceButtonProps) {
  const match = useMatch({
    from: "/sessions/$sessionId/",
    shouldThrow: false,
  });

  const { data: session } = useQuery<any>({
    queryKey: ["session", match?.params.sessionId],
    enabled: !!match?.params.sessionId,
  });

  const { data: machine } = useMachine(session?.machine_id);

  const [isWorkflowDialogOpen, setIsWorkflowDialogOpen] = useState(false);
  const data = useMemo(() => {
    return {
      containerSelector: ".comfyui-menu-right .flex",
      buttonConfigs: [
        {
          id: "save-image",
          icon: "pi-save",
          label: machine ? machine.name : "New Workspace",
          style: {
            color: !machine ? "#9ca3af" : "",
          },
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
  }, [machine?.id, machine?.name]);

  useWorkspaceButtons(data, endpoint);

  // const { data: machineVersions, isLoading: isLoadingMachineVersions } =
  //   useMachineVersions(machine?.id);

  // const versions = machineVersions?.pages[0] || [];

  return (
    <>
      <CreateWorkspaceDialog
        open={isWorkflowDialogOpen}
        setOpen={setIsWorkflowDialogOpen}
        sessionMachineId={session?.machine_id}
      />
    </>
  );
}

export function CreateWorkspaceDialog({
  open,
  setOpen,
  sessionMachineId,
  setFirstCreateDialogOpen, // for new workspace and new workflow
  setDisplayCommit, // for new workspace but exist workflow
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  sessionMachineId: string;
  setFirstCreateDialogOpen?: (open: boolean) => void;
  setDisplayCommit?: (open: boolean) => void;
}) {
  const { data: machine, refetch: refetchMachine } =
    useMachine(sessionMachineId);
  const [machineName, setMachineName] = useState(machine?.name);
  const match = useMatch({
    from: "/sessions/$sessionId/",
    shouldThrow: false,
  });
  const { workflowId } = useSearch({
    from: "/sessions/$sessionId/",
  });

  const { refetch } = useQuery<any>({
    queryKey: ["session", match?.params.sessionId],
    enabled: !!match?.params.sessionId,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent hideOverlay className="sm:max-w-[600px]">
        <DialogTitle>Workspace</DialogTitle>

        {!machine && (
          <div className="flex flex-col gap-2">
            <div className="text-muted-foreground text-sm">
              No existing workspace, create a new one.
            </div>
            <Input
              placeholder="Workspace Name"
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
                  setOpen(false);
                  toast.promise(
                    async () => {
                      await refetch();
                      await refetchMachine();
                    },
                    {
                      loading: "Creating workspace...",
                      error: "Failed to create workspace. Please try again.",
                    },
                  );
                  if (setFirstCreateDialogOpen) {
                    if (workflowId) {
                      setDisplayCommit?.(true);
                    } else {
                      setFirstCreateDialogOpen(true);
                    }
                  }
                }}
              >
                Create
              </Button>
            </div>
          </div>
        )}

        {/* {machine && (
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
        )} */}
      </DialogContent>
    </Dialog>
  );
}

export function LeftMenuButtons({ endpoint }: WorkspaceButtonProps) {
  const router = useRouter();
  const { workflowId } = useSearch({
    from: "/sessions/$sessionId/",
  });

  const data = useMemo(() => {
    console.log("=====", " re calculating left menu buttons");
    return {
      containerSelector: ".comfyui-menu",
      buttonConfigs: [
        {
          id: "back",
          icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,
          tooltip: "Go back to the previous page.",
          event: "back",
          onClick: (_: string, __: unknown) => {
            if (workflowId) {
              router.navigate({
                to: "/workflows/$workflowId/$view",
                params: { workflowId, view: "requests" },
              });
            } else {
              router.navigate({
                to: "/home",
              });
            }
          },
        },
      ],
      buttonIdPrefix: "cd-button-left-",
      containerStyle: { order: "-1" },
    };
  }, [workflowId]);

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
  machine_version_id?: string;
}

export function WorkflowButtons({
  endpoint,
  machine_id,
  machine_version_id,
}: WorkflowButtonsProps) {
  const [isWorkflowDialogOpen, setIsWorkflowDialogOpen] = useState(false);
  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false);
  const [isNewWorkspaceDialogOpen, setIsNewWorkspaceDialogOpen] =
    useState(false);
  const [isClearWorkflowDialogOpen, setIsClearWorkflowDialogOpen] =
    useState(false);
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

  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [isNewWorkflowOpen, setIsNewWorkflowOpen] = useState(false);
  const { workflowId: workflowIdFromSearch, workflowLink } = useSearch({
    from: "/sessions/$sessionId/",
  });
  const { cdSetup } = useCDStore();
  const endpointParts = endpoint.split("//")[1].split(".");
  const endpointId = `${endpointParts[0]}-${endpointParts[1]}`;

  useEffect(() => {
    if (!cdSetup) return;
    if (workflowId || workflowLink) return;

    const hasShownTemplate = Cookies.get(`cd_templateShown_${endpointId}`);
    if (hasShownTemplate) return;

    setTimeout(() => {
      setIsTemplateOpen(true);
      Cookies.set(`cd_templateShown_${endpointId}`, "true", {
        expires: 1 / 24,
      });
    }, 1000);
  }, [cdSetup, workflowId, workflowLink]);

  const { data: session, refetch } = useQuery<any>({
    queryKey: ["session", match?.params.sessionId],
    enabled: !!match?.params.sessionId,
  });

  const { data: machine } = useMachine(session?.machine_id);

  const data = useMemo(() => {
    return {
      containerSelector: ".comfyui-menu",
      buttonConfigs: [
        {
          id: "workflow-1",
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m16 3l4 4l-4 4m-6-4h10M8 13l-4 4l4 4m-4-4h9"/></svg>`,
          label: workflow?.name || "Empty Workflow",
          style: {
            color: !workflow?.name ? "#9ca3af" : "",
          },
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
          id: "workflow-template",
          icon: "pi-plus",
          tooltip: "Workflow Template",
          event: "workflow_template",
          // style: {
          //   height: "28px",
          //   marginLeft: "7px",
          //   borderRadius: "4px",
          //   display: "flex",
          // },
          onClick: (_: string, __: unknown) => {
            if (workflowIdFromSearch) {
              setIsClearWorkflowDialogOpen(true);
            } else {
              setIsTemplateOpen(true);
            }
          },
        },

        {
          id: "workflow-2",
          icon: "pi-save",
          // icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12 3v6"/><circle cx="12" cy="12" r="3"/><path d="M12 15v6"/></g></svg>`,
          label: "Save",
          tooltip: "Commit the current workflow",
          event: "commit",
          style: {
            backgroundColor: "oklch(.476 .114 61.907)",
            display: !hasChanged ? "none" : "flex",
          },
          onClick: (_: string, __: unknown) => {
            if (!machine) {
              // toast.error("Please create a workspace first");
              setIsNewWorkspaceDialogOpen(true);
              return;
            }
            setDisplayCommit(true);
          },
        },

        // {
        //   id: "workflow-4",
        //   icon: "pi-diff",
        //   label: "Diff",
        //   tooltip: "Diff",
        //   event: "diff",
        //   onClick: (_: string, __: unknown) => setDisplayDiff(true),
        // },

        {
          id: "save-new-workflow",
          icon: "pi-save",
          label: "Create new workflow",
          tooltip: "New Workflow",
          event: "save_new_workflow",
          onClick: (_: string, __: unknown) => {
            if (!machine) {
              toast.error("Please create a workspace first");
              setIsNewWorkspaceDialogOpen(true);
              return;
            }
            setIsNewWorkflowOpen(true);
          },
          style: {
            backgroundColor: "oklch(.476 .114 61.907)",
            // height: "28px",
            // marginLeft: "7px",
            // borderRadius: "4px",
            display: workflowId || workflowLink ? "none" : "flex",
          },
        },
      ],
      buttonIdPrefix: "cd-button-workflow-",
      insertBefore: ".comfyui-menu>:nth-of-type(2)",
    };
  }, [
    workflow?.name,
    version,
    hasChanged,
    workflowId,
    workflowLink,
    machine?.id,
    machine?.name,
  ]);

  const [_, setWorkflowId] = useQueryState("workflowId");
  useWorkspaceButtons(data, endpoint);

  return (
    <>
      {displayCommit && (
        <WorkflowCommitVersion
          setOpen={setDisplayCommit}
          endpoint={endpoint}
          machine_id={machine_id}
          machine_version_id={machine_version_id}
          session_url={session?.url}
        />
      )}

      <CreateWorkspaceDialog
        open={isNewWorkspaceDialogOpen}
        setOpen={setIsNewWorkspaceDialogOpen}
        sessionMachineId={session?.machine_id}
        setFirstCreateDialogOpen={setIsNewWorkflowOpen} // for new workspace and new workflow
        setDisplayCommit={setDisplayCommit} // for new workspace but exist workflow
      />

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

      <>
        {/* New Workflow Dialog */}
        <NewWorkflowDialog
          open={isNewWorkflowOpen}
          setOpen={setIsNewWorkflowOpen}
        />
        {/* popover clear current workflow */}
        <Popover
          open={isClearWorkflowDialogOpen}
          onOpenChange={setIsClearWorkflowDialogOpen}
        >
          <PopoverTrigger asChild>
            <div id="cd-button-workflow-workflow-template" />
          </PopoverTrigger>
          <PopoverContent sideOffset={50} className="w-80">
            <div className="flex flex-col gap-2">
              <div className="font-medium text-sm">Clear Workflow</div>
              <div className="text-xs leading-5">
                Are you sure you want to clear the current workflow?
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setIsClearWorkflowDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="xs"
                  onClick={() => {
                    setWorkflowId(null);
                    setIsClearWorkflowDialogOpen(false);
                    setIsTemplateOpen(true);
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Template Dialog */}
        <Dialog open={isTemplateOpen} onOpenChange={setIsTemplateOpen}>
          <DialogContent
            hideOverlay
            className="border-zinc-800 bg-zinc-900 text-white drop-shadow-md sm:max-w-[850px]"
          >
            <DialogHeader>
              <DialogTitle>Welcome to ComfyDeploy!</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Choose a workflow template to kickstart your creative journey.
                Each template is designed to help you explore different
                possibilities in AI image generation.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-1 py-2 md:grid-cols-2 lg:grid-cols-3">
              {defaultWorkflowTemplates.map((template) => (
                // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
                <div
                  key={template.workflowId}
                  onClick={() => {
                    sendWorkflow(JSON.parse(template.workflowJson));
                  }}
                  className="group relative cursor-pointer overflow-hidden rounded-md border border-zinc-800 bg-zinc-950 p-4 transition-all hover:border-zinc-700"
                >
                  <div className="mb-3 aspect-square overflow-hidden rounded-[10px]">
                    <img
                      src={template.workflowImageUrl}
                      alt={template.workflowName}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-sm text-white">
                      {template.workflowName}
                    </h3>
                    <p className="line-clamp-2 text-xs text-zinc-400 leading-snug">
                      {template.workflowDescription}
                    </p>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs backdrop-blur-sm">
                      Use Template
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </>
    </>
  );
}

export function ClearContainerButtons({ endpoint }: WorkspaceButtonProps) {
  useWorkspaceButtons(
    {
      containerSelector: ".comfyui-menu>.flex-grow",
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

function NewWorkflowDialog({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [newName, setNewName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { workflow } = useWorkflowStore();
  const router = useRouter();
  const match = useMatch({
    from: "/sessions/$sessionId/",
    shouldThrow: false,
  });

  const { data: session } = useQuery<any>({
    queryKey: ["session", match?.params.sessionId],
    enabled: !!match?.params.sessionId,
  });

  const getPromptWithTimeout = useCallback(
    async (timeoutMs = 5000) => {
      const getPrompt = new Promise<{ workflow: string; output: string }>(
        (resolve, reject) => {
          const eventListener = (event: MessageEvent<string>) => {
            if (event.origin !== session?.url) return;
            try {
              const data = JSON.parse(event.data);
              if (data.type === "cd_plugin_onGetPrompt") {
                window.removeEventListener("message", eventListener, {
                  capture: true,
                });
                resolve(data.data);
              }
            } catch (error) {
              console.error("Error parsing prompt:", error);
              reject(error);
            }
          };
          window.addEventListener("message", eventListener, {
            capture: true,
          });
          sendEventToCD("get_prompt");
        },
      );

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Timeout: Failed to get prompt")),
          timeoutMs,
        );
      });
      return Promise.race([getPrompt, timeoutPromise]);
    },
    [session?.url],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!newName || newName.trim() === "") {
      toast.error("Workflow name cannot be empty");
      return;
    }

    if (!session?.url) {
      toast.error("Session URL is not available");
      return;
    }

    try {
      setIsLoading(true);

      // Get snapshot
      const snapshotResponse = await fetch(
        `${session.url}/snapshot/get_current`,
      );
      const comfyui_snapshot = await snapshotResponse.json();

      // Get prompt
      const prompt = await getPromptWithTimeout();

      const requestBody = {
        name: newName.trim(),
        workflow_json: JSON.stringify(workflow),
        workflow_api: JSON.stringify(prompt.output),
        machine_version_id: session?.machine_version_id,
        comfyui_snapshot,
      };

      const result = await api({
        url: "workflow",
        init: {
          method: "POST",
          body: JSON.stringify(requestBody),
        },
      });

      toast.success("Workflow created successfully");
      router.navigate({
        to: "/sessions/$sessionId",
        params: {
          sessionId: match?.params.sessionId || "",
        },
        search: {
          workflowId: result.workflow_id,
        },
      });
      setOpen(false);
    } catch (error) {
      console.error("Error creating workflow:", error);
      toast.error(
        typeof error === "string" ? error : "Failed to create new workflow",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex flex-row items-center gap-2">
              Create New Workflow
            </DialogTitle>
            <DialogDescription>
              Save your workflow to prevent it from being lost.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newName}
                placeholder="Enter a new name"
                className="col-span-3"
                onChange={(e) => setNewName(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading || !newName.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
