import {
  createRootRouteWithContext,
  Link,
  Outlet,
  redirect,
  useLocation,
  useRouter,
} from "@tanstack/react-router";
import React, { useEffect, useRef } from "react";

const TanStackRouterDevtools =
  process.env.NODE_ENV === "production"
    ? () => null // Render nothing in production
    : React.lazy(() =>
        // Lazy load in development
        import("@tanstack/router-devtools").then((res) => ({
          default: res.TanStackRouterDevtools,
          // For Embedded Mode
          // default: res.TanStackRouterDevtoolsPanel
        })),
      );

import {
  SignedIn,
  SignedOut,
  useAuth,
  type useClerk,
} from "@clerk/clerk-react";
import { AutumnProvider } from "autumn-js/react";
import { Toaster } from "sonner";
import { PageViewTracker } from "@/components/analytics/page-view-tracker";
import { AppSidebar, GuestSidebar } from "@/components/app-sidebar";
import { ComfyCommand } from "@/components/comfy-command";
import { Icon } from "@/components/icon-word";
import { LocalGitDisplay } from "@/components/local-git-display";
import { useOrgSelector } from "@/components/OrgSelector";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { WorkflowNavbar } from "@/components/workflow-navbar";
import { AssetsBrowserPopup } from "@/components/workspace/assets-browser-drawer";
import { cn } from "@/lib/utils";
import { queryClient } from "../lib/providers";

export type RootRouteContext = {
  auth?: ReturnType<typeof useAuth>;
  clerk?: ReturnType<typeof useClerk>;
};

const publicRoutes = [
  // "/home",
  "/auth/sign-in",
  "/auth/sign-up",
  "/pricing",
  "/waitlist",
  "/explore",
  { path: "/share", wildcard: true },
];

export const Route = createRootRouteWithContext<RootRouteContext>()({
  component: AutumnProviderComponent,
  beforeLoad: async ({ context, location }) => {
    while (!context.clerk?.loaded) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const isPublicRoute = publicRoutes.some((route) => {
      if (typeof route === "string") {
        return location.pathname === route;
      }
      return route.wildcard && location.pathname.startsWith(route.path);
    });

    if (!context.clerk?.session && !isPublicRoute) {
      throw redirect({
        to: "/auth/sign-in",
        search: {
          redirect: location.href,
        },
      });
    }

    // Only redirect from root to home if user is signed in
    if (context.clerk?.session && location.pathname === "/") {
      throw redirect({
        to: "/workflows",
      });
    }
  },
});

function AutumnProviderComponent() {
  const auth = useAuth();

  if (!auth.isSignedIn) {
    return <RootComponent />;
  }

  return (
    <AutumnProvider includeCredentials>
      <RootComponent />
    </AutumnProvider>
  );
}

function RootComponent() {
  const auth = useAuth();

  const router = useRouter();
  const isFirstRender = useRef(true);
  const currentOrg = useRef(auth.orgId);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    currentOrg.current = auth.orgId;
    queryClient.resetQueries();
  }, [auth.orgId, router]);

  const { pathname } = useLocation();
  const isWorkflowPage = pathname.includes("/workflows/");
  const isAuthPage = publicRoutes.some((route) => {
    if (typeof route === "string") {
      return pathname === route;
    }
    return route.wildcard && pathname.startsWith(route.path);
  });

  return (
    <ThemeProvider defaultTheme="system">
      <PageViewTracker />
      <div className="fixed z-[-1] h-full w-full bg-white dark:bg-gradient-to-br dark:from-zinc-800 dark:to-zinc-900">
        <div className="absolute h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] dark:bg-[radial-gradient(#333333_1px,transparent_1px)]" />
      </div>

      {isAuthPage && !auth.isSignedIn ? (
        <GuestSidebar />
      ) : (
        !isWorkflowPage && (
          <SignedIn>
            <AppSidebar />
          </SignedIn>
        )
      )}
      <SignedIn>
        {isWorkflowPage && <WorkflowNavbar />}
        {!isWorkflowPage && (
          <div className="fixed top-0 z-50 flex h-[40px] w-full flex-row items-center gap-2 border-gray-200 border-b bg-transparent p-1 md:hidden dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-md">
            <SidebarTrigger className="h-8 w-8 rounded-none border-gray-200 border-r p-2 dark:border-zinc-700" />
            <Link
              href="/"
              className="flex flex-row items-center justify-center"
            >
              <Icon />
            </Link>
          </div>
        )}
      </SignedIn>
      <div
        className={cn(
          "flex w-full flex-col items-center justify-start overflow-x-auto md:mt-0 md:max-h-[100dvh]",
          !isWorkflowPage && "mt-[40px] max-h-[calc(100dvh-40px)]",
        )}
      >
        <SignedIn>
          <OrgSelectorComponent />
        </SignedIn>
        {isAuthPage && <Outlet />}
        {!isAuthPage && (
          <SignedOut>
            <div className="flex h-full flex-col items-center justify-center">
              <p className="font-bold text-2xl">You are signed out</p>
            </div>
          </SignedOut>
        )}
        <ComfyCommand />
        <Toaster richColors closeButton={true} />
        <LocalGitDisplay />
        <AssetsBrowserPopup isPlayground />
      </div>
    </ThemeProvider>
  );
}

function OrgSelectorComponent() {
  const { pathname } = useLocation();
  const isAuthPage = publicRoutes.some((route) => {
    if (typeof route === "string") {
      return pathname === route;
    }
    return route.wildcard && pathname.startsWith(route.path);
  });

  const orgSelector = useOrgSelector();

  return (
    <>
      {!orgSelector && !isAuthPage && <Outlet />}
      {!isAuthPage && orgSelector}
    </>
  );
}
