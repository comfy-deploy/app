import {
  Outlet,
  createRootRouteWithContext,
  redirect,
  useLocation,
} from "@tanstack/react-router";
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
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SignedIn, type useClerk, type useAuth } from "@clerk/clerk-react";
import { RedirectToSignIn, SignedOut } from "@clerk/clerk-react";
import React from "react";
import { Toaster } from "sonner";
import { Providers } from "../lib/providers";
import { NavBar, SignedOutNavBar } from "@/components/nav-bar";
import { cn } from "@/lib/utils";

type Context = {
  auth?: ReturnType<typeof useAuth>;
  clerk?: ReturnType<typeof useClerk>;
};

const publicRoutes = [
  "/home",
  "/auth/sign-in",
  "/auth/sign-up",
  "/waitlist",
  "/share",
];

export const Route = createRootRouteWithContext<Context>()({
  component: RootComponent,
  beforeLoad: async ({ context, location }) => {
    while (!context.clerk?.loaded) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Define public routes that don't require authentication
    if (
      !context.clerk?.session &&
      !publicRoutes.some((route) => location.pathname.startsWith(route))
    ) {
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
        to: "/home",
      });
    }
  },
});

function RootComponent() {
  const { pathname } = useLocation();
  const isSession = pathname.includes("/sessions/");
  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));
  return (
    <SidebarProvider defaultOpen={false}>
      <Providers>
        <div
          className="flex max-h-[100dvh] w-full flex-col items-center justify-start overflow-x-auto "
          style={{
            scrollbarGutter: isSession ? "unset" : "stable",
          }}
        >
          <div className="fixed z-[-1] h-full w-full bg-white">
            <div className="absolute h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
          </div>
          <SignedOut>{isPublic && <SignedOutNavBar />}</SignedOut>
          <SignedIn>{!isSession && <NavBar />}</SignedIn>
          <div
            className={cn(
              "w-full",
              !isSession ? "h-[calc(100%-62px)]" : "h-full",
            )}
          >
            <Outlet />
          </div>
          <SignedIn>
            <ComfyCommand />
          </SignedIn>
          <Toaster richColors closeButton={true} />
        </div>
      </Providers>
      {/* <TanStackRouterDevtools position="bottom-right" /> */}
    </SidebarProvider>
  );
}
