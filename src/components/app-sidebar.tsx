import {
  ArrowLeft,
  Book,
  Box,
  CircleGauge,
  CreditCard,
  Database,
  ExternalLink,
  Folder,
  GitBranch,
  Github,
  History,
  Key,
  LineChart,
  LockKeyhole,
  MessageCircle,
  Plus,
  Receipt,
  Rss,
  Save,
  Server,
  Settings,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";

import { useIsAdminAndMember, useIsAdminOnly } from "@/components/permissions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { VersionList, useSelectedVersion } from "@/components/version-select";
import { WorkflowDropdown } from "@/components/workflow-dropdown";
import {
  SessionTimer,
  useSessionTimer,
} from "@/components/workspace/SessionTimer";
import {
  useSessionIdInSessionView,
  useShareSlug,
  useWorkflowIdInSessionView,
  useWorkflowIdInWorkflowPage,
} from "@/hooks/hook";
import {
  useCurrentPlan,
  useCurrentPlanWithStatus,
} from "@/hooks/use-current-plan";
import { api } from "@/lib/api";
import { callServerPromise } from "@/lib/call-server-promise";
import { cn } from "@/lib/utils";
import { WorkflowsBreadcrumb } from "@/routes/workflows/$workflowId/$view.lazy";
import { getOrgPathInfo } from "@/utils/org-path";
import {
  OrganizationSwitcher,
  UserButton,
  useAuth,
  useClerk,
} from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useRouter } from "@tanstack/react-router";
// import { VersionSelectV2 } from "@/components/VersionSelectV2";
// import { MachineSelect } from "@/components/MachineSelect";
// import { useCurrentPlan } from "@/components/useCurrentPlan";
import { motion } from "framer-motion";
import { parseAsString } from "nuqs";
import { useQueryState } from "nuqs";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MyDrawer } from "./drawer";
import { Chat } from "./master-comfy/chat";
import { WorkflowModelCheck } from "./onboarding/workflow-model-check";
import { Badge } from "./ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Separator } from "./ui/separator";
import { Skeleton } from "./ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { VersionSelectV2 } from "./version-select";
import { MachineSelect } from "./workspace/MachineSelect";
import { WorkflowCommitVersion } from "./workspace/WorkflowCommitVersion";
import { useWorkflowStore } from "./workspace/Workspace";
import {
  SessionIncrementDialog,
  useSessionIncrementStore,
} from "./workspace/increase-session";
import { sendWorkflow } from "./workspace/sendEventToCD";
import { Switch } from "./ui/switch";
import { serverAction } from "@/lib/workflow-version-api";
import { useGetWorkflowVersionData } from "@/hooks/use-get-workflow-version-data";
import type { Timeout } from "node_modules/@tanstack/react-router/dist/esm/utils";

// Add Session type
interface Session {
  created_at: string;
  timeout_end?: string;
  timeout?: number;
  url?: string;
  tunnel_url?: string;
  gpu?: string;
  machine_id?: string;
  machine_version_id?: string;
}

function UserMenu() {
  const isAdminOnly = useIsAdminOnly();
  const isAdminAndMember = useIsAdminAndMember();

  return (
    <div className="flex h-full w-10 items-center justify-center">
      <UserButton
        userProfileProps={{}}
        appearance={{
          elements: {
            userButtonPopoverRootBox: {
              pointerEvents: "initial",
            },
          },
        }}
      >
        <UserButton.MenuItems>
          {isAdminAndMember && (
            <UserButton.Action
              label="Billing"
              labelIcon={<Receipt size={14} />}
              onClick={async () => {
                const res = await callServerPromise(
                  api({
                    url: `platform/stripe/dashboard?redirect_url=${encodeURIComponent(
                      window.location.href,
                    )}`,
                  }),
                  {
                    loadingText: "Redirecting to Stripe...",
                  },
                );
                window.open(res.url, "_blank");
              }}
            />
          )}
          {/* 
          {isAdminAndMember && (
            <UserButton.Link
              label="API Keys"
              labelIcon={<Key size={14} />}
              href="/api-keys"
            />
          )} */}

          {/* {isAdminAndMember && (
            <UserButton.Link
              label="Settings"
              labelIcon={<Cog size={14} />}
              href="/settings"
            />
          )} */}

          {/* <UserButton.Link
            label="Pricing"
            labelIcon={<CircleDollarSign size={14} />}
            href="/pricing"
          /> */}
        </UserButton.MenuItems>
      </UserButton>
    </div>
  );
}

function usePages() {
  // const pathname = `/${pathnames.split("/")[1]}`;

  // const { has } = useAuth();

  const isAdminOnly = useIsAdminOnly();
  const isAdminAndMember = useIsAdminAndMember();
  const sub = useCurrentPlan();

  // const pricingPlanFlagEnable = useFeatureFlagEnabled("pricing-plan");
  const pages = [
    {
      name: "Workflows",
      path: "/workflows",
      icon: Workflow,
    },
    // {
    //   name: "Models",
    //   path: "/models",
    //   icon: Component,
    // },
    ...(isAdminAndMember
      ? [
          {
            name: "Machines",
            path: "/machines",
            icon: Server,
          },
        ]
      : []),
    {
      name: "Models",
      path: "/models",
      icon: Database,
    },
    {
      name: "Assets",
      path: "/assets",
      icon: Folder,
    },
  ];

  const metaPages = [
    ...(isAdminAndMember
      ? [
          {
            name: "Settings",
            path: "/settings",
            icon: Settings,
          },
          {
            name: "API Keys",
            path: "/api-keys",
            icon: Key,
          },
          // {
          //   name: "Secrets",
          //   path: "/secrets",
          //   icon: LockKeyhole,
          // },
        ]
      : []),

    ...(isAdminOnly
      ? [
          {
            name: "Usage",
            path: "/usage",
            icon: CircleGauge,
          },
        ]
      : []),

    ...(sub?.plans?.plans
      ? [
          {
            name: "Analytics",
            path: "/analytics",
            icon: LineChart,
          },
        ]
      : []),
    {
      name: "Plan",
      path: "/pricing",
      icon: CreditCard,
    },
  ];

  return {
    pages,
    flatPages: pages.flat(),
    metaPages: metaPages.flat(),
  };
}

const links = [
  {
    title: "Docs",
    url: "https://docs.comfydeploy.com",
    icon: Book,
  },
  {
    title: "Discord",
    url: "https://discord.com/invite/c222Cwyget",
    icon: MessageCircle,
  },
  {
    title: "Demo",
    url: "https://demo2.comfydeploy.com",
    icon: Box,
  },
  {
    title: "GitHub",
    url: "https://github.com/BennyKok/comfyui-deploy",
    icon: Github,
  },
  {
    title: "Blog",
    url: "https://www.comfydeploy.com/blog",
    icon: Rss,
  },
];

function SessionSidebar() {
  const router = useRouter();
  const workflowId = useWorkflowIdInSessionView();
  const clerk = useClerk();
  const sub = useCurrentPlan();

  const [sessionId, setSessionId] = useQueryState("sessionId", parseAsString);
  const [displayCommit, setDisplayCommit] = useState(false);
  const { hasChanged, workflow } = useWorkflowStore();

  const {
    setOpen: setSessionIncrementOpen,
    setSessionId: setIncrementSessionId,
  } = useSessionIncrementStore();

  const {
    data: session,
    isLoading: isLoadingSession,
    isError,
    refetch,
  } = useQuery<Session>({
    enabled: !!sessionId,
    queryKey: ["session", sessionId],
    refetchInterval: 1000,
  });

  const url = session?.url || session?.tunnel_url;

  // Only calculate these values if we have timeout_end (non-legacy mode)
  const isLegacyMode = !session?.timeout_end;

  const handleTimerClick = () => {
    if (isLegacyMode) {
      setIncrementSessionId(sessionId);
      setSessionIncrementOpen(true);
    }
  };

  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<"model" | "chat" | null>(
    null,
  );
  const [workflowUpdateTrigger, setWorkflowUpdateTrigger] = useState(0);

  useEffect(() => {
    if (workflow) {
      setWorkflowUpdateTrigger((prev) => prev + 1);
    }
  }, [workflow]);

  const toggleDrawer = (drawer: "model" | "chat") => {
    setActiveDrawer((prevDrawer) => (prevDrawer === drawer ? null : drawer));
  };

  return (
    <>
      <SessionIncrementDialog /> {/* This will handle the legacy mode dialog */}
      {displayCommit && url && (
        <WorkflowCommitVersion
          endpoint={url}
          setOpen={setDisplayCommit}
          machine_id={session?.machine_id}
          machine_version_id={session?.machine_version_id}
        />
      )}
      <Dialog open={isVersionDialogOpen} onOpenChange={setIsVersionDialogOpen}>
        <DialogContent hideOverlay className="sm:max-0-w-[425px]">
          <VersionList
            className="w-full"
            workflow_id={workflowId || ""}
            onClose={() => {
              setIsVersionDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex flex-row items-start justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                if (workflowId) {
                  router.navigate({
                    to: "/workflows/$workflowId/$view",
                    params: { workflowId, view: "workspace" },
                  });
                } else {
                  router.navigate({
                    to: "/",
                  });
                }
                setSessionId(null);
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="p-1">
            <SidebarMenu>
              <SidebarMenuItem className="p-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setDisplayCommit(true);
                  }}
                  disabled={!hasChanged}
                  className={`mx-auto transition-colors ${
                    hasChanged ? "bg-orange-200 hover:bg-orange-300" : ""
                  }`}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </SidebarMenuItem>
              <SidebarMenuItem className="p-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsVersionDialogOpen(true);
                  }}
                  className="relative mx-auto"
                >
                  <GitBranch className="h-4 w-4" />
                  <div className="-right-1 -top-1 absolute flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary/10 font-medium text-[10px]">
                    v
                    {useSelectedVersion(workflowId || "").value?.version || "1"}
                  </div>
                </Button>
              </SidebarMenuItem>
              <Separator className="mx-auto my-1 w-7" />
              <SidebarMenuItem className="p-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    activeDrawer === "model" ? "bg-primary/10" : "",
                  )}
                  onClick={() => toggleDrawer("model")}
                >
                  <Box className="h-4 w-4" />
                </Button>
              </SidebarMenuItem>
              {sub?.plans?.plans?.length > 0 && (
                <SidebarMenuItem className="relative p-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      activeDrawer === "chat" ? "bg-primary/10" : "",
                    )}
                    onClick={() => toggleDrawer("chat")}
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                  <Badge
                    variant="purple"
                    className="-right-1 -top-1 !text-[7px] absolute h-4 px-1"
                  >
                    Beta
                  </Badge>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="px-0 py-2">
          {!isLegacyMode && (
            <WorkspaceConfigPopover
              setOpen={setDisplayCommit}
              workflowId={workflowId}
            />
          )}
          {session?.gpu && (
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <div className="px-2">
                    <Badge className="!text-[10px] !p-0 !w-full mb-1 flex items-center justify-center">
                      {session?.gpu.slice(0, 4)}
                    </Badge>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{session?.gpu}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {!isLegacyMode ? (
            <TimerPopover session={session} onRefetch={refetch} />
          ) : (
            <>
              {session && (
                <SessionTimer session={session} onClick={handleTimerClick} />
              )}
            </>
          )}
        </SidebarFooter>
      </Sidebar>
      {activeDrawer === "model" && (
        <MyDrawer
          backgroundInteractive
          open={activeDrawer === "model"}
          onClose={() => setActiveDrawer(null)}
          side="left"
          offset={14}
        >
          <div className="mt-2 space-y-4">
            <span className="font-medium">Model Check</span>
            <WorkflowModelCheck
              workflow={JSON.stringify(workflow)}
              key={workflowUpdateTrigger}
              onWorkflowUpdate={sendWorkflow}
            />
          </div>
        </MyDrawer>
      )}
      {activeDrawer === "chat" && (
        <MyDrawer
          backgroundInteractive
          open={activeDrawer === "chat"}
          onClose={() => setActiveDrawer(null)}
          side="left"
          offset={14}
        >
          <Chat />
        </MyDrawer>
      )}
    </>
  );
}

// First, extract the increaseSessionTimeout function
function increaseSessionTimeout(
  sessionId: string | null,
  minutes: number,
): Promise<any> {
  if (!sessionId) {
    return Promise.reject("No session ID provided");
  }

  return callServerPromise(
    api({
      url: `session/${sessionId}/increase-timeout`,
      init: {
        method: "POST",
        body: JSON.stringify({
          minutes: minutes,
        }),
      },
    }),
    {
      loadingText: "Increasing session time...",
      successMessage: "Session time extended",
    },
  );
}

// Now modify the WorkspaceConfigPopover to include auto-extension functionality
function WorkspaceConfigPopover({
  workflowId,
  setOpen,
}: {
  workflowId?: string;
  setOpen: (b: boolean) => void;
}) {
  // Load settings from localStorage with defaults
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem("workspaceConfig");
    return savedSettings
      ? JSON.parse(savedSettings)
      : {
          autoSave: false,
          autoSaveInterval: "60",
          autoExpandSession: false,
        };
  });

  const { userId } = useAuth();
  const { hasChanged } = useWorkflowStore((state) => state);

  const sessionId = useSessionIdInSessionView();
  const { data: session, refetch } = useQuery<Session>({
    queryKey: ["session", sessionId],
    enabled: !!sessionId && settings.autoExpandSession,
  });

  const { countdown } = useSessionTimer(session);
  const autoExtendInProgressRef = useRef(false);
  const isLegacyMode = !session?.timeout_end;

  const machine_id = session?.machine_id;
  const machine_version_id = session?.machine_version_id;
  const session_url = session?.url;
  const endpoint = session?.url || session?.tunnel_url;

  const {
    query,
    setVersion,
    is_fluid_machine,
    comfyui_snapshot,
    comfyui_snapshot_loading,
  } = useGetWorkflowVersionData({
    machine_id,
    machine_version_id,
    session_url,
    workflowId,
  });

  // Update settings and save to localStorage
  const updateSettings = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem("workspaceConfig", JSON.stringify(newSettings));
  };

  // Auto-extend functionality
  useEffect(() => {
    if (
      !settings.autoExpandSession ||
      !sessionId ||
      !countdown ||
      autoExtendInProgressRef.current ||
      isLegacyMode
    ) {
      return;
    }

    const [hours, minutes, seconds] = countdown.split(":").map(Number);
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    if (totalSeconds > 0 && totalSeconds < 60) {
      autoExtendInProgressRef.current = true;

      increaseSessionTimeout(sessionId, 5)
        .then(() => {
          refetch();
        })
        .catch((error) => {
          toast.error(`Failed to auto-extend session: ${error}`);
        })
        .finally(() => {
          // Add a small delay before allowing another auto-extension
          setTimeout(() => {
            autoExtendInProgressRef.current = false;
          }, 10000); // 10 seconds cooldown
        });
    }
  }, [countdown, settings.autoExpandSession, sessionId, refetch, isLegacyMode]);

  // Format interval text
  const getIntervalText = () => {
    if (!settings.autoSave) return "";
    return settings.autoSaveInterval === "30"
      ? "30 sec"
      : settings.autoSaveInterval === "300"
        ? "5 min"
        : "1 min";
  };

  useEffect(() => {
    let saveIntervalId: NodeJS.Timeout | undefined;

    const { autoSave, autoSaveInterval } = settings;

    if (hasChanged && autoSave) {
      saveIntervalId = setInterval(async () => {
        await serverAction({
          comment: "Auto Save",
          endpoint,
          machine_id,
          machine_version_id,
          userId,
          workflowId,
          is_fluid_machine,
          query,
          setVersion,
          setOpen,
          snapshotAction: "COMMIT_ONLY",
          comfyui_snapshot,
          comfyui_snapshot_loading,
          sessionId,
        });
      }, +autoSaveInterval * 1000);
    }

    return () => {
      if (saveIntervalId) {
        clearInterval(saveIntervalId);
        saveIntervalId = undefined;
      }
    };
  }, [settings, hasChanged]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="w-full">
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        sideOffset={14}
        align="end"
        className="w-[300px] p-3"
      >
        <h4 className="mb-3 font-medium text-sm">Workspace Configuration</h4>

        <div className="space-y-3">
          {/* Auto Save Toggle */}
          <div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-xs">Auto Save</span>
                  {settings.autoSave && (
                    <Badge
                      variant="outline"
                      className="!text-[10px] h-5 px-1.5"
                    >
                      {getIntervalText()}
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Auto commit to save progress
                </p>
              </div>
              <Switch
                checked={settings.autoSave}
                onCheckedChange={(checked) =>
                  updateSettings("autoSave", checked)
                }
              />
            </div>

            {settings.autoSave && (
              <div className="mt-1.5 flex items-center justify-end gap-2">
                <span className="ml-2 text-xs">Interval: </span>
                <Select
                  value={settings.autoSaveInterval}
                  onValueChange={(value) =>
                    updateSettings("autoSaveInterval", value)
                  }
                >
                  <SelectTrigger className="w-[150px] border-muted text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 sec</SelectItem>
                    <SelectItem value="60">1 min</SelectItem>
                    <SelectItem value="300">5 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Separator className="my-1" />

          {/* Auto Expand Session Time Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-medium text-xs">Auto Expand Session</span>
              <p className="text-[10px] text-muted-foreground">
                Prevent session timeout, until you leave the workspace
              </p>
            </div>
            <Switch
              checked={settings.autoExpandSession}
              onCheckedChange={(checked) =>
                updateSettings("autoExpandSession", checked)
              }
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TimerPopover({
  session,
  onRefetch,
}: {
  session: Session | undefined;
  onRefetch: () => Promise<unknown>;
}) {
  const [selectedIncrement, setSelectedIncrement] = useState("5");
  const sessionId = useSessionIdInSessionView();
  const { countdown } = useSessionTimer(session);
  const [isOpen, setIsOpen] = useState(false);

  const [hours, minutes, seconds] = countdown.split(":").map(Number);
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  // Auto-open popover when less than 30 seconds remaining
  useEffect(() => {
    if (totalSeconds > 0 && totalSeconds < 30) {
      setIsOpen(true);
    }
  }, [totalSeconds]);

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

    callServerPromise(
      api({
        url: `session/${sessionId}/increase-timeout`,
        init: {
          method: "POST",
          body: JSON.stringify({
            minutes: Number(selectedIncrement),
          }),
        },
      }),
      {
        loadingText: "Increasing session time...",
        successMessage: "Session time increased successfully",
      },
    ).then(() => {
      onRefetch();
      // Only close the popover when time is increased
      if (totalSeconds >= 30) {
        setIsOpen(false);
      }
    });
  };

  // Function to determine text color based on the time remaining
  const getTimeWarningClass = () => {
    if (totalSeconds < 30) {
      return "text-yellow-600";
    }
    return "text-muted-foreground";
  };

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        // Only allow closing the popover if time is < 30 seconds
        if (totalSeconds < 30 && !open) {
          return; // Prevent closing when time is < 30 seconds
        }
        setIsOpen(open);
      }}
    >
      <PopoverTrigger>
        {session && <SessionTimer session={session} />}
      </PopoverTrigger>
      <PopoverContent
        className="w-[340px]"
        side="right"
        sideOffset={14}
        align="end"
      >
        <span className="font-medium text-sm">Increase Session Time</span>
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center text-muted-foreground text-sm">
              <span className="flex items-center space-x-2">
                Instance:{" "}
                <span className="ml-1 font-medium">{session?.gpu}</span>
              </span>
            </div>
            <div className="flex flex-col">
              <div
                className={`flex items-center justify-between rounded-none bg-muted/50 px-2 py-3`}
              >
                <div className="flex items-center gap-2">
                  <History className={`h-4 w-4 ${getTimeWarningClass()}`} />
                  <span
                    className={`font-medium text-sm ${getTimeWarningClass()}`}
                  >
                    Time Remaining
                  </span>
                </div>
                {session && (
                  <SessionTimer
                    session={session}
                    size="sm"
                    className={getTimeWarningClass()}
                  />
                )}
              </div>
              {session?.timeout_end && session?.created_at && (
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full transition-all ${totalSeconds < 30 ? "bg-yellow-500" : "bg-primary"}`}
                    style={{
                      width: `${
                        ((new Date(session.timeout_end).getTime() -
                          new Date().getTime()) /
                          (new Date(session.timeout_end).getTime() -
                            new Date(session.created_at).getTime())) *
                        100
                      }%`,
                    }}
                  />
                </div>
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
      </PopoverContent>
    </Popover>
  );
}

function ShareSidebar() {
  const router = useRouter();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex flex-row items-start justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              router.navigate({
                to: "/",
              });
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
      </SidebarHeader>
      {/* <SidebarContent>
        <SidebarGroup className="p-1">
          <SidebarMenu>
            <SidebarMenuItem className="p-0">
              <Link
                href="/"
                className="flex flex-row items-start justify-between"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent> */}
    </Sidebar>
  );
}

export function AppSidebar() {
  const { pages, flatPages, metaPages } = usePages();
  const { orgId, orgSlug } = useAuth();
  const isFirstRender = useRef(true);
  const sessionId = useSessionIdInSessionView();
  const shareSlug = useShareSlug();
  const { setOpen } = useSidebar();

  const items = flatPages.map((page) => ({
    title: page.name,
    url: page.path,
    icon: page.icon,
  }));

  const metaItems = metaPages.map((page) => ({
    title: page.name,
    url: page.path,
    icon: page.icon,
  }));

  const location = useLocation();
  // console.log(location);

  const pathname = location.pathname;
  const chunks = pathname.split("/").filter(Boolean);

  const { case1Match, case2Match, pathParts, pathWithoutOrg } = getOrgPathInfo(
    orgSlug ?? null,
    pathname.replace("//", "/"),
  );

  let parentPath = chunks[0];

  const clerk = useClerk();
  const personalOrg = clerk.user?.username ?? "personal";

  if (case2Match) {
    parentPath = chunks[2];
  } else {
    parentPath = chunks[0];
  }

  // console.log("parentPath", case1Match, case2Match, parentPath, chunks);

  const isAdminAndMember = useIsAdminAndMember();
  const workflow_id = useWorkflowIdInWorkflowPage();

  const router = useRouter();

  const { data: currentGitBranch } = useQuery({
    queryKey: ["currentGitBranch"],
    queryFn: async () => {
      try {
        const response = await fetch("/git-info.json");
        const data = await response.json();
        return data;
      } catch (error) {
        return null;
      }
    },
    refetchInterval: 3000,
    enabled: window.location.hostname === "localhost",
  });

  useEffect(() => {
    setOpen(!sessionId && !shareSlug);
  }, [sessionId, shareSlug]);

  // If we're in a session, show the session-specific sidebar
  if (sessionId) {
    return <SessionSidebar />;
  }

  // If we're in a share page, show the share-specific sidebar
  if (shareSlug) {
    return <ShareSidebar />;
  }

  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <div className="flex flex-row items-start justify-between pt-2.5">
            <Link
              href="/"
              className="flex flex-row items-start justify-between"
            >
              <img
                src="/icon-light.svg"
                alt="comfydeploy"
                className="ml-1 h-7 w-7"
              />
              {/* <IconWord /> */}
            </Link>
            <div className="flex items-center gap-1">
              <PlanBadge />
              <UserMenu />
            </div>
          </div>

          {!(workflow_id && parentPath === "workflows") && (
            <div className="flex items-center gap-0 justify-center mt-1 bg-gray-100 rounded-[8px]">
              <OrganizationSwitcher
                organizationProfileUrl="/organization-profile"
                organizationProfileMode="navigation"
                afterSelectOrganizationUrl="/org/:slug/workflows"
                afterSelectPersonalUrl={`/user/${personalOrg}/workflows`}
                appearance={{
                  elements: {
                    rootBox:
                      "items-center justify-center p-0 w-full max-w-[221px] md:max-w-[190px]",
                    organizationSwitcherPopoverRootBox: {
                      pointerEvents: "initial",
                    },
                    organizationSwitcherTrigger: {
                      width: "100%",
                      justifyContent: "space-between",
                      padding: "12px 12px",
                    },
                  },
                }}
              />
              {orgId && (
                <Link
                  className="transition-colors bg-gray-200/40 hover:bg-gray-200 h-full flex items-center justify-center rounded-r-[8px] px-4"
                  to="/organization-profile#/organization-members"
                >
                  <Users className="h-4 w-4" />
                </Link>
              )}
            </div>
          )}

          {workflow_id && parentPath === "workflows" && (
            <>
              <WorkflowsBreadcrumb />
              <div className="flex flex-col relative">
                <div className="flex w-full flex-row gap-2 rounded-t-md rounded-b-none border bg-gray-100 p-2">
                  <WorkflowDropdown
                    workflow_id={workflow_id}
                    className="min-w-0 flex-grow"
                  />
                  <VersionSelectV2
                    workflow_id={workflow_id}
                    className="w-20 flex-shrink-0"
                  />
                </div>
                {workflow_id &&
                  parentPath === "workflows" &&
                  isAdminAndMember && (
                    <MachineSelect
                      workflow_id={workflow_id}
                      leaveEmpty
                      onSettingsClick={(machineId) => {
                        router.navigate({
                          to: "/workflows/$workflowId/$view",
                          params: { workflowId: workflow_id, view: "machine" },
                        });
                      }}
                      className="rounded-b-md rounded-t-none border-b border-x bg-slate-100"
                    />
                  )}
              </div>
            </>
          )}
        </SidebarHeader>
        <SidebarContent className="gap-0">
          <div id="sidebar-panel" />

          {(!workflow_id || parentPath !== "workflows") && (
            <>
              <SidebarGroup className="pt-0">
                {/* <SidebarGroupLabel>Application</SidebarGroupLabel> */}
                <SidebarGroupContent>
                  <SidebarMenu>
                    {items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        {`/${parentPath}` === item.url && (
                          <motion.div
                            className="absolute top-[5px] left-0 z-10 h-[20px] w-[2px] rounded-r-full bg-primary"
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 30,
                            }}
                          />
                        )}
                        <SidebarMenuButton asChild>
                          <Link href={item.url}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>

                        {item.url === "/models" && (
                          <div id="sidebar-panel-models" />
                        )}
                        {item.url === "/machines" && (
                          <div id="sidebar-panel-machines" />
                        )}
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel>Account</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {metaItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        {`/${parentPath}` === item.url && (
                          <motion.div
                            className="absolute top-[5px] left-0 z-10 h-[20px] w-[2px] rounded-r-full bg-primary"
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 30,
                            }}
                          />
                        )}
                        <SidebarMenuButton asChild>
                          <Link href={item.url}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              {/* <SidebarGroup>
                <SidebarGroupLabel>Links</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu></SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup> */}
            </>
          )}
        </SidebarContent>
        <SidebarFooter className="flex w-full flex-col justify-center gap-2 pb-4">
          {!(workflow_id && parentPath === "workflows") && (
            <div className="grid grid-cols-2 gap-2 px-2">
              {links.map((item) => (
                // <SidebarMenuItem key={item.title} className="gap-1">
                // <SidebarMenuButton asChild className="py-0 min-h-0 h-fit">
                <a href={item.url} target="_blank" rel="noreferrer">
                  <span className="flex w-full flex-row items-center justify gap-2 pr-2 text-2xs text-muted-foreground">
                    <item.icon size={16} className="w-3" />
                    <span>{item.title}</span>
                  </span>
                </a>
                // </SidebarMenuButton>
                // </SidebarMenuItem>
              ))}
            </div>
          )}
        </SidebarFooter>
      </Sidebar>

      {/* {window.location.hostname === "localhost" && (
        <div className="fixed top-11 left-2 z-[9999] flex items-center gap-2 opacity-65">
          <Badge className="pointer-events-none bg-orange-300 text-orange-700 shadow-md">
            Localhost
          </Badge>

          <Badge variant="emerald" className="pointer-events-none shadow-md">
            <GitBranch className="h-4 w-4" />
            {currentGitBranch?.branch || `Please run "bun githooks"`}
          </Badge>
        </div>
      )} */}
    </>
  );
}

function PlanBadge() {
  const { data: plan, isLoading } = useCurrentPlanWithStatus();
  console.log(isLoading);

  const planId = plan?.plans?.plans[0] || "";

  let displayPlan = "Free";
  let badgeColor = "secondary";

  // Logic to determine which plan to display
  if (planId.includes("pro")) {
    displayPlan = "Pro";
  } else if (planId.includes("creator") || planId.includes("creator_")) {
    displayPlan = "Creator";
    badgeColor = "yellow";
  } else if (planId.includes("deployment")) {
    displayPlan = "Deployment";
    badgeColor = "blue";
  } else if (planId.includes("business")) {
    displayPlan = "Business";
    badgeColor = "purple";
  }

  if (isLoading) {
    return <Skeleton className="h-5 w-12" />;
  }

  return (
    <Badge
      variant={badgeColor as "secondary" | "yellow" | "purple" | "blue"}
      className="!text-2xs py-0 font-medium"
    >
      {displayPlan}
    </Badge>
  );
}

function V3Dialog() {
  const [isHovered, setIsHovered] = useState(false);
  const [isOverflowVisible, setIsOverflowVisible] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const loadedImages = useRef(new Set());

  const handleImageLoad = (imageSrc: string) => {
    loadedImages.current.add(imageSrc);
    if (loadedImages.current.size === 3) {
      // We have 3 images total
      setImagesLoaded(true);
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isHovered) {
      timeoutId = setTimeout(() => {
        setIsOverflowVisible(true);
      }, 100);
    } else {
      setIsOverflowVisible(false);
    }
    return () => clearTimeout(timeoutId);
  }, [isHovered]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: imagesLoaded ? 1 : 0,
        y: imagesLoaded ? 0 : 10,
      }}
      transition={{ duration: 0.3, delay: 0.5 }}
      className="group rounded-[8px] border bg-white p-3"
    >
      <Link
        // @ts-ignore
        to="https://comfydeploy.link/beta"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex flex-col gap-1 text-xs">
          <div className="font-medium">
            {(() => {
              const targetDate = new Date("2025-03-05"); // 3 days from Feb 27, 2025
              const today = new Date();
              const diffTime = Math.ceil(
                (targetDate.getTime() - today.getTime()) /
                  (1000 * 60 * 60 * 24),
              );
              return `v3 Beta is coming in ${diffTime} days`;
            })()}
          </div>
          <div className="text-muted-foreground leading-5">
            New Experience. New Platform. Same ComfyUI.
          </div>

          <motion.div
            className="relative mt-2 rounded-[6px]"
            animate={{
              height: isHovered ? "150px" : "75px",
            }}
            style={{
              overflow: isOverflowVisible ? "visible" : "hidden",
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.3,
            }}
          >
            <div className="relative h-[75px]">
              <motion.div
                className="absolute w-full"
                animate={{
                  rotateZ: isHovered ? -5 : 0,
                  x: isHovered ? -20 : 0,
                  y: isHovered ? -10 : 0,
                  scale: isHovered ? 0.95 : 1,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
              >
                <img
                  src="https://cd-misc.s3.us-east-2.amazonaws.com/sidebar/third.webp"
                  alt="Platform Preview 3"
                  className="w-full rounded-[6px] border border-gray-200 object-cover shadow-lg"
                  loading="lazy"
                  onLoad={() => handleImageLoad("third.webp")}
                />
              </motion.div>

              <motion.div
                className="absolute w-full"
                animate={{
                  rotateZ: isHovered ? 0 : 0,
                  x: isHovered ? 0 : 0,
                  y: isHovered ? -5 : 0,
                  scale: isHovered ? 0.97 : 1,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
              >
                <img
                  src="https://cd-misc.s3.us-east-2.amazonaws.com/sidebar/second.webp"
                  alt="Platform Preview 2"
                  className="w-full rounded-[6px] border border-gray-200 object-cover shadow-lg"
                  loading="lazy"
                  onLoad={() => handleImageLoad("second.webp")}
                />
              </motion.div>

              <motion.div
                className="absolute w-full"
                animate={{
                  rotateZ: isHovered ? 5 : 0,
                  x: isHovered ? 20 : 0,
                  y: isHovered ? 0 : 0,
                  scale: isHovered ? 1 : 1,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
              >
                <img
                  src="https://cd-misc.s3.us-east-2.amazonaws.com/sidebar/first.webp"
                  alt="Platform Preview 1"
                  className="w-full rounded-[6px] border border-gray-200 object-cover shadow-lg"
                  loading="lazy"
                  onLoad={() => handleImageLoad("first.webp")}
                />
              </motion.div>
            </div>

            <motion.div
              className="absolute right-0 bottom-0 left-0 h-10 bg-gradient-to-b from-transparent to-white"
              animate={{ opacity: isHovered ? 0 : 1 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.3,
              }}
            />
          </motion.div>
          <motion.div
            className="flex justify-end text-2xs text-muted-foreground underline"
            animate={{
              opacity: isHovered ? 1 : 0,
              height: isHovered ? "auto" : "0px",
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.3,
            }}
          >
            <span className="flex flex-row items-center gap-1">
              Try it out <ExternalLink size={12} />
            </span>
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
}
