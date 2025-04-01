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
  MessageCircle,
  Plus,
  Receipt,
  Rss,
  Save,
  Server,
  Settings,
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
import { SessionTimer } from "@/components/workspace/SessionTimer";
import {
  useSessionIdInSessionView,
  useWorkflowIdInSessionView,
  useWorkflowIdInWorkflowPage,
} from "@/hooks/hook";
import {
  useCurrentPlan,
  useCurrentPlanWithStatus,
} from "@/hooks/use-current-plan";
import { api } from "@/lib/api";
import { callServerPromise } from "@/lib/call-server-promise";
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
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import { VersionSelectV2 } from "./version-select";
import { MachineSelect } from "./workspace/MachineSelect";
import { WorkflowCommitVersion } from "./workspace/WorkflowCommitVersion";
import { useWorkflowStore } from "./workspace/Workspace";
import {
  SessionIncrementDialog,
  useSessionIncrementStore,
} from "./workspace/increase-session";
import { useDexieCurrentPlan } from "@/lib/dexie/dexie-current-plan";

// Add Session type
interface Session {
  created_at: string;
  timeout_end?: string;
  timeout?: number;
  url?: string;
  tunnel_url?: string;
  gpu?: string;
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
    title: "Documentation",
    url: "https://docs.comfydeploy.com",
    icon: Book,
  },
  {
    title: "Discord",
    url: "https://discord.com/invite/c222Cwyget",
    icon: MessageCircle,
  },
  {
    title: "NextJS Demo",
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

  const [sessionId, setSessionId] = useQueryState("sessionId", parseAsString);
  const [displayCommit, setDisplayCommit] = useState(false);
  const { hasChanged } = useWorkflowStore();
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
    } else {
      setTimerDialogOpen(true);
    }
  };

  const [timerDialogOpen, setTimerDialogOpen] = useState(false);
  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false);

  return (
    <>
      {!isLegacyMode && (
        <TimerDialog
          open={timerDialogOpen}
          onOpenChange={setTimerDialogOpen}
          session={session}
          onRefetch={refetch}
        />
      )}
      <SessionIncrementDialog /> {/* This will handle the legacy mode dialog */}
      {displayCommit && (
        <WorkflowCommitVersion endpoint={url} setOpen={setDisplayCommit} />
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
                  <div className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary/10 font-medium text-[10px]">
                    v
                    {useSelectedVersion(workflowId || "").value?.version || "1"}
                  </div>
                </Button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          {session && (
            <SessionTimer session={session} onClick={handleTimerClick} />
          )}
        </SidebarFooter>
      </Sidebar>
    </>
  );
}

// Update TimerDialog component
function TimerDialog({
  open,
  onOpenChange,
  session,
  onRefetch,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | undefined;
  onRefetch: () => Promise<unknown>;
}) {
  const [selectedIncrement, setSelectedIncrement] = useState("5");
  const sessionId = useSessionIdInSessionView();

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

    toast.promise(
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
      ).then(() => onRefetch()),
      {
        loading: "Increasing session time...",
        success: "Session time increased successfully",
        error: "Failed to increase session time",
      },
    );

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              <div className="flex items-center justify-between rounded-none bg-muted/50 px-2 py-3">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Time Remaining</span>
                </div>
                {session && <SessionTimer session={session} size="sm" />}
              </div>
              {session?.timeout_end && session?.created_at && (
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

export function AppSidebar() {
  const { pages, flatPages, metaPages } = usePages();
  const { orgId, orgSlug } = useAuth();
  const isFirstRender = useRef(true);
  const sessionId = useSessionIdInSessionView();
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
    setOpen(!sessionId);
  }, [sessionId]);

  // If we're in a session, show the session-specific sidebar
  if (sessionId) {
    return <SessionSidebar />;
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

          {/* <div id="sidebar-header"></div> */}
          {/* </SidebarMenuItem> */}
          {/* </SidebarMenu> */}
        </SidebarHeader>
        <SidebarContent>
          <div id="sidebar-panel" />

          {(!workflow_id || parentPath !== "workflows") && (
            <>
              <SidebarGroup>
                <SidebarGroupLabel>Application</SidebarGroupLabel>
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

              <SidebarGroup>
                <SidebarGroupLabel>Links</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {links.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <a href={item.url} target="_blank" rel="noreferrer">
                            <item.icon />
                            <span className="flex w-full flex-row items-center justify-between gap-2 pr-2">
                              <span>{item.title}</span>
                              <ExternalLink size={14} />
                            </span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </>
          )}
        </SidebarContent>
        <SidebarFooter className="flex w-full flex-col justify-center gap-2">
          <OrganizationSwitcher
            organizationProfileUrl="/organization-profile"
            organizationProfileMode="navigation"
            afterSelectOrganizationUrl="/org/:slug/workflows"
            afterSelectPersonalUrl={`/user/${personalOrg}/workflows`}
            appearance={{
              elements: {
                rootBox: "items-center justify-center p-2",
                organizationSwitcherPopoverRootBox: {
                  pointerEvents: "initial",
                },
              },
            }}
          />
        </SidebarFooter>
      </Sidebar>

      {window.location.hostname === "localhost" && (
        <div className="fixed top-11 left-2 z-[9999] flex items-center gap-2 opacity-65">
          <Badge className="pointer-events-none bg-orange-300 text-orange-700 shadow-md">
            Localhost
          </Badge>

          <Badge variant="emerald" className="pointer-events-none shadow-md">
            <GitBranch className="h-4 w-4" />
            {currentGitBranch?.branch || `Please run "bun githooks"`}
          </Badge>
        </div>
      )}
    </>
  );
}

function PlanBadge() {
  const { plan, isLoading } = useDexieCurrentPlan();

  let displayPlan = "Free";
  let badgeColor = "secondary";

  // Logic to determine which plan to display
  if (plan?.includes("pro")) {
    displayPlan = "Pro";
  } else if (plan?.includes("creator") || plan?.includes("creator_")) {
    displayPlan = "Creator";
    badgeColor = "yellow";
  } else if (plan?.includes("deployment")) {
    displayPlan = "Deployment";
    badgeColor = "blue";
  } else if (plan?.includes("business")) {
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
