"use client";

import { Icon as IconWord } from "@/components/icon-word";

import {
  Book,
  BookCheck,
  Box,
  CircleGauge,
  CreditCard,
  Database,
  ExternalLink,
  Folder,
  Github,
  Key,
  LineChart,
  MessageCircle,
  Receipt,
  Rss,
  Server,
  Settings,
  Workflow,
} from "lucide-react";

import { useIsAdminAndMember, useIsAdminOnly } from "@/components/permissions";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
} from "@/components/ui/sidebar";
import { WorkflowDropdown } from "@/components/workflow-dropdown";
import { useWorkflowIdInWorkflowPage } from "@/hooks/hook";
import { api } from "@/lib/api";
import { callServerPromise } from "@/lib/call-server-promise";
import { WorkflowsBreadcrumb } from "@/routes/workflows/$workflowId/$view.lazy";
import { OrganizationSwitcher, UserButton } from "@clerk/clerk-react";
import { Link, useLocation } from "@tanstack/react-router";
// import { VersionSelectV2 } from "@/components/VersionSelectV2";
// import { MachineSelect } from "@/components/MachineSelect";
// import { useCurrentPlan } from "@/components/useCurrentPlan";
import { motion } from "framer-motion";
import React, { use } from "react";
import { VersionSelectV2 } from "./version-select";
import { MachineSelect } from "./workspace/MachineSelect";

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
      name: "Storage",
      path: "/storage",
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

    {
      name: "Analytics",
      path: "/analytics",
      icon: LineChart,
    },
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

export function AppSidebar() {
  const { pages, flatPages, metaPages } = usePages();
  // const sub = useCurrentPlan();

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
  const pathname = location.pathname;
  const chunks = pathname.split("/");
  const parentPath = chunks[1];

  const isAdminAndMember = useIsAdminAndMember();
  const workflow_id = useWorkflowIdInWorkflowPage();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex flex-row items-start justify-between">
          <Link href="/" className="flex flex-row items-start justify-between">
            <IconWord />
          </Link>
          <UserMenu />
        </div>

        {workflow_id && parentPath === "workflows" && (
          <>
            <WorkflowsBreadcrumb />
            <div className="flex w-full flex-row gap-2 rounded-md border bg-gray-100 p-2">
              <WorkflowDropdown
                workflow_id={workflow_id}
                className="min-w-0 flex-grow"
              />
              <VersionSelectV2
                workflow_id={workflow_id}
                className="w-20 flex-shrink-0"
              />
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
        {workflow_id && parentPath === "workflows" && isAdminAndMember && (
          <MachineSelect
            workflow_id={workflow_id}
            leaveEmpty
            className="rounded-full border bg-slate-100 p-2"
          />
        )}

        <OrganizationSwitcher
          organizationProfileUrl="/organization-profile"
          organizationProfileMode="navigation"
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
  );
}
