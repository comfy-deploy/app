import {
  ArrowLeft,
  Book,
  Box,
  CircleGauge,
  CreditCard,
  Database,
  ExternalLink,
  FileClockIcon,
  Folder,
  GitBranch,
  Github,
  History,
  Key,
  LineChart,
  MessageCircle,
  MessageSquare,
  Moon,
  Plus,
  Receipt,
  Rss,
  Save,
  Search,
  Server,
  Settings,
  Sun,
  Users,
  Workflow,
  Link2,
  BookText,
  UserPlus,
  LogIn,
} from "lucide-react";

import { useIsAdminAndMember, useIsAdminOnly } from "@/components/permissions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  useIsBusinessAllowed,
} from "@/hooks/use-current-plan";
import { api } from "@/lib/api";
import { callServerPromise } from "@/lib/call-server-promise";
import { cn, isDarkTheme } from "@/lib/utils";
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
import { motion, AnimatePresence } from "framer-motion";
import { parseAsString } from "nuqs";
import { useQueryState } from "nuqs";
import React, { useEffect, useRef, useState, useMemo } from "react";
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
import { useWorkflowStore } from "./workspace/Workspace";
import {
  SessionIncrementDialog,
  useSessionIncrementStore,
} from "./workspace/increase-session";
import { sendWorkflow } from "./workspace/sendEventToCD";
import { Switch } from "./ui/switch";
import { serverAction } from "@/lib/workflow-version-api";
import { useGetWorkflowVersionData } from "@/hooks/use-get-workflow-version-data";
import { LogDisplay } from "./workspace/LogDisplay";
import { CopyButton } from "@/components/ui/copy-button";
import { WorkflowCommitSidePanel } from "./workspace/WorkflowCommitSidePanel";
import { ExternalNodeDocs } from "./workspace/external-node-docs";
import { AssetBrowserSidebar } from "./workspace/assets-browser-sidebar";
import { AssetType } from "./SDInputs/sd-asset-input";
import { useDrawerStore } from "@/stores/drawer-store";
import { useTheme } from "./theme-provider";
import { dark } from "@clerk/themes";
import { GuideDialog } from "./guide/GuideDialog";
import { Icon } from "./icon-word";

// Add Session type
export interface Session {
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
  const { theme } = useTheme();

  return (
    <div className="flex h-full w-10 items-center justify-center">
      <UserButton
        userProfileProps={{}}
        appearance={{
          baseTheme: isDarkTheme(theme) ? dark : undefined,
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
    {
      name: "Explore",
      path: "/explore",
      icon: Search,
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
      name: "Sessions",
      path: "/sessions",
      icon: History,
    },
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

    // ...(sub?.plans?.plans
    //   ? [
    //       {
    //         name: "Analytics",
    //         path: "/analytics",
    //         icon: LineChart,
    //       },
    //     ]
    //   : []),
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
  {
    title: "Plan",
    url: "/pricing",
    icon: CreditCard,
    internal: true,
  },
];

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
  const { theme, setTheme } = useTheme();
  const isBusinessAllowed = Boolean(useIsBusinessAllowed());

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
                className="ml-1 h-7 w-7 dark:hidden"
              />
              <img
                src="/icon.svg"
                alt="comfydeploy"
                className="ml-1 hidden h-7 w-7 dark:block"
              />
            </Link>
            <div className="flex items-center gap-1">
              <PlanBadge />
              <UserMenu />
            </div>
          </div>

          {!(workflow_id && parentPath === "workflows") && (
            <div className="mt-1 flex items-center justify-center gap-0 rounded-[8px] bg-gray-100 dark:bg-gradient-to-r dark:from-zinc-800 dark:to-zinc-900">
              <div className="flex min-h-[44px] w-full items-center justify-center">
                <OrganizationSwitcher
                  organizationProfileUrl={`/org/${orgSlug}/organization-profile`}
                  organizationProfileMode="navigation"
                  afterSelectOrganizationUrl="/org/:slug/workflows"
                  afterSelectPersonalUrl={`/user/${personalOrg}/workflows`}
                  appearance={{
                    baseTheme: isDarkTheme(theme) ? dark : undefined,
                    elements: {
                      rootBox: cn(
                        "items-center justify-center p-0 w-full",
                        orgId && "max-w-[221px] md:max-w-[190px]",
                      ),
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
              </div>
              {orgId && (
                <Link
                  className="flex h-full items-center justify-center rounded-r-[8px] bg-gray-200/40 px-4 transition-colors hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
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
              <div className="relative flex flex-col">
                <div className="flex w-full flex-row gap-2 rounded-t-md rounded-b-none border bg-gray-100 p-2 dark:bg-gradient-to-br dark:from-zinc-800 dark:to-zinc-900">
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
                      className="rounded-t-none rounded-b-md border-x border-b bg-slate-100 dark:bg-gradient-to-tr dark:from-zinc-800 dark:to-zinc-900"
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
                        <SidebarMenuButton
                          asChild
                          className={cn(
                            "transition-colors dark:hover:bg-zinc-700/40",
                            item.url === `/${parentPath}` &&
                              "dark:bg-zinc-800/40",
                          )}
                        >
                          <Link href={item.url}>
                            <item.icon
                              className={cn(
                                "transition-colors dark:text-gray-400",
                                item.url === `/${parentPath}` &&
                                  "dark:text-white",
                              )}
                            />
                            <span
                              className={cn(
                                "transition-colors dark:text-gray-400",
                                item.url === `/${parentPath}` &&
                                  "dark:text-white",
                              )}
                            >
                              {item.title}
                            </span>
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
                        <SidebarMenuButton
                          asChild
                          className={cn(
                            "transition-colors dark:hover:bg-zinc-700/40",
                            item.url === `/${parentPath}` &&
                              "dark:bg-zinc-800/40",
                          )}
                        >
                          <Link href={item.url}>
                            <item.icon
                              className={cn(
                                "transition-colors dark:text-gray-400",
                                item.url === `/${parentPath}` &&
                                  "dark:text-white",
                              )}
                            />
                            <span
                              className={cn(
                                "transition-colors dark:text-gray-400",
                                item.url === `/${parentPath}` &&
                                  "dark:text-white",
                              )}
                            >
                              {item.title}
                            </span>
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
              {links.map((item, index) =>
                item.internal ? (
                  <Link
                    key={index}
                    to={item.url}
                    className="justify flex w-full flex-row items-center gap-2 pr-2 text-2xs text-muted-foreground"
                  >
                    <item.icon size={16} className="w-3" />
                    <span>{item.title}</span>
                  </Link>
                ) : (
                  <a
                    href={item.url}
                    key={index}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="justify flex w-full flex-row items-center gap-2 pr-2 text-2xs text-muted-foreground">
                      <item.icon size={16} className="w-3" />
                      <span>{item.title}</span>
                    </span>
                  </a>
                ),
              )}

              {/* Theme Switch Item */}
              {isBusinessAllowed && (
                // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
                <div
                  className="flex w-full cursor-pointer flex-row items-center justify-between gap-2 pr-2 text-2xs text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => {
                    setTheme(isDarkTheme(theme) ? "light" : "dark");
                  }}
                >
                  <div className="flex items-center gap-2">
                    {isDarkTheme(theme) ? (
                      <Moon size={16} className="w-3" />
                    ) : (
                      <Sun size={16} className="w-3" />
                    )}
                    <span>Theme</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </SidebarFooter>
      </Sidebar>
      {window.location.hostname === "localhost" && (
        <div className="fixed top-2 right-2 z-[9999] flex items-center gap-2 opacity-65">
          <Badge className="pointer-events-none bg-orange-300 text-orange-700 shadow-md dark:bg-orange-900/50 dark:text-orange-400">
            Localhost
          </Badge>

          <Badge variant="emerald" className="pointer-events-none shadow-md">
            <GitBranch className="h-4 w-4" />
            {currentGitBranch?.branch || `Please run "bun githooks"`}
          </Badge>
        </div>
      )}
      <GuideDialog guideType="machine" />
    </>
  );
}

function PlanBadge() {
  const { data: plan, isLoading } = useCurrentPlanWithStatus();

  const { displayPlan, badgeColor } = useMemo(() => {
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

    return { displayPlan, badgeColor };
  }, [plan?.plans?.plans]);

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

export function GuestSidebar() {
  const router = useRouter();
  const location = useLocation();

  const guestLinks = [
    {
      title: "Explore",
      url: "/explore",
      icon: Search,
      internal: true,
    },
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

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex flex-row items-start justify-between">
          <Link
            to="https://comfydeploy.com"
            className="flex flex-row items-start justify-between"
          >
            <Icon />
          </Link>
        </div>

        {/* Hero Section */}
        <div className="space-y-3 px-2">
          {/* CTA Buttons */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => router.navigate({ to: "/auth/sign-in" })}
              className="w-full"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {guestLinks.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {location.pathname === item.url && item.internal && (
                    <motion.div
                      className="absolute top-[5px] left-0 z-10 h-[20px] w-[2px] rounded-r-full bg-primary"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "transition-colors dark:hover:bg-zinc-700/40",
                      item.internal &&
                        item.url === location.pathname &&
                        "dark:bg-zinc-800/40",
                    )}
                  >
                    {item.internal ? (
                      <Link href={item.url}>
                        <item.icon
                          className={cn(
                            "transition-colors dark:text-gray-400",
                            item.internal &&
                              item.url === location.pathname &&
                              "dark:text-white",
                          )}
                        />
                        <span
                          className={cn(
                            "transition-colors dark:text-gray-400",
                            item.internal &&
                              item.url === location.pathname &&
                              "dark:text-white",
                          )}
                        >
                          {item.title}
                        </span>
                      </Link>
                    ) : (
                      <a href={item.url} target="_blank" rel="noreferrer">
                        <item.icon className="transition-colors dark:text-gray-400" />
                        <span className="transition-colors dark:text-gray-400">
                          {item.title}
                        </span>
                        <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
                      </a>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="pb-4">
        {/* Pricing Link */}
        <div className="px-2">
          <Link
            to="/pricing"
            className="flex w-full items-center justify-between rounded-lg border bg-gradient-to-r from-blue-50 to-purple-50 p-3 transition-colors hover:from-blue-100 hover:to-purple-100 dark:from-blue-950/50 dark:to-purple-950/50 dark:hover:from-blue-900/50 dark:hover:to-purple-900/50"
          >
            <div>
              <p className="font-medium text-sm text-foreground">
                View Pricing
              </p>
              <p className="text-muted-foreground text-xs">
                Start free, scale as you grow
              </p>
            </div>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
