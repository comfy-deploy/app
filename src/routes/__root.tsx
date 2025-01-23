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
import { SignedIn, type useAuth } from "@clerk/clerk-react";
import { RedirectToSignIn, SignedOut } from "@clerk/clerk-react";
import React from "react";
import { Toaster } from "sonner";
import { Providers } from "../lib/providers";
import { NavBar } from "@/components/nav-bar";
import { cn } from "@/lib/utils";

type Context = {
  auth?: ReturnType<typeof useAuth>;
};

export const Route = createRootRouteWithContext<Context>()({
  component: RootComponent,
  beforeLoad: ({ context, location }) => {
    if (!context.auth?.isLoaded) {
      return;
    }

    if (
      context.auth &&
      !context.auth.isSignedIn &&
      location.pathname !== "/auth/sign-in"
    ) {
      throw redirect({
        to: "/auth/sign-in",
        // search: {
        // 	redirect: location.href,
        // },
      });
    }
    if (context.auth?.isSignedIn && location.pathname === "/") {
      throw redirect({
        to: "/home",
      });
    }
  },
});

function RootComponent() {
  const { pathname } = useLocation();
  const isSession = pathname.includes("/sessions/");

  return (
    <SidebarProvider defaultOpen={false}>
      <Providers>
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
        <SignedIn>
          <AppSidebar />
        </SignedIn>
        <div
          className="flex max-h-[100dvh] w-full flex-col items-center justify-start overflow-x-auto "
          style={{
            scrollbarGutter: isSession ? "unset" : "stable",
          }}
        >
          <div className="fixed z-[-1] h-full w-full bg-white">
            <div className="absolute h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
          </div>
          <SidebarTrigger className="fixed top-4 left-2 z-50 h-8 w-8 rounded-full bg-secondary p-2 md:hidden" />
          {!isSession && <NavBar />}
          <div
            className={cn(
              "w-full",
              !isSession ? "h-[calc(100%-62px)]" : "h-full",
            )}
          >
            <Outlet />
          </div>
          <ComfyCommand />
          <Toaster richColors closeButton={true} />
        </div>
      </Providers>
      {/* <TanStackRouterDevtools position="bottom-right" /> */}
    </SidebarProvider>
  );
}
