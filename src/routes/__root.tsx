import {
  Link,
  Outlet,
  createRootRouteWithContext,
  redirect,
  useLocation,
  useMatchRoute,
  useRouter,
} from "@tanstack/react-router";
import React, { useEffect, useRef, useState } from "react";
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
import { AppSidebar } from "@/components/app-sidebar";
import { ComfyCommand } from "@/components/comfy-command";
import { Icon } from "@/components/icon-word";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { orgPrefixPaths } from "@/orgPrefixPaths";
import { SignedIn, type useClerk } from "@clerk/clerk-react";
import {
  RedirectToSignIn,
  SignedOut,
  useAuth,
  useOrganizationList,
} from "@clerk/clerk-react";
import { Toaster } from "sonner";
import { Providers, queryClient } from "../lib/providers";
import { ThemeProvider } from "@/components/theme-provider";

export type RootRouteContext = {
  auth?: ReturnType<typeof useAuth>;
  clerk?: ReturnType<typeof useClerk>;
};

const publicRoutes = [
  // "/home",
  "/auth/sign-in",
  "/auth/sign-up",
  "/waitlist",
  { path: "/share", wildcard: true },
];

export const Route = createRootRouteWithContext<RootRouteContext>()({
  component: RootComponent,
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

    // if (auth.orgId !== currentOrg.current) {
    //   router.navigate({
    //     to: "/",
    //   });
    // }

    currentOrg.current = auth.orgId;
    queryClient.resetQueries();
  }, [auth.orgId, router]);

  const { pathname } = useLocation();
  const isSessionPage = pathname.includes("/sessions/");
  const isAuthPage = publicRoutes.some((route) => {
    if (typeof route === "string") {
      return pathname === route;
    }
    return route.wildcard && pathname.startsWith(route.path);
  });

  return (
    <ThemeProvider defaultTheme="system">
      <div className="fixed z-[-1] h-full w-full bg-white dark:bg-gradient-to-br dark:from-zinc-800 dark:to-zinc-900">
        <div className="absolute h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] dark:bg-[radial-gradient(#333333_1px,transparent_1px)]" />
      </div>

      {!isSessionPage && (
        <SignedIn>
          <AppSidebar />
        </SignedIn>
      )}
      <div className="fixed top-0 z-50 flex h-[40px] w-full flex-row items-center gap-2 border-gray-200 border-b bg-transparent p-1 md:hidden">
        <SidebarTrigger className="h-8 w-8 rounded-none border-gray-200 border-r p-2" />
        <Link href="/" className="flex flex-row items-center justify-center">
          <Icon />
        </Link>
      </div>
      <div className="mt-[40px] flex max-h-[calc(100dvh-40px)] w-full flex-col items-center justify-start overflow-x-auto md:mt-0 md:max-h-[100dvh]">
        {!isAuthPage && (
          <SignedIn>
            <Outlet />
          </SignedIn>
        )}
        {isAuthPage && <Outlet />}
        {!isAuthPage && (
          <SignedOut>
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-2xl font-bold">You are signed out</p>
            </div>
          </SignedOut>
        )}
        <ComfyCommand />
        <Toaster richColors closeButton={true} />
      </div>
    </ThemeProvider>
  );
}
