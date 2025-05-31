import {
  ClerkProvider,
  useAuth,
  useClerk,
  useOrganizationList,
} from "@clerk/clerk-react";
import {
  type Route as RouteType,
  RouterProvider,
  createFileRoute,
  createRoute,
  createRouter,
  redirect,
  useLocation,
  useRouter,
} from "@tanstack/react-router";
import ReactDOM from "react-dom/client";
import { routeTree } from "./routeTree.gen";
import "./globals.css";
import { LoadingIcon } from "@/components/ui/custom/loading-icon";
import { getOrgPathInfo } from "@/utils/org-path";
import { useEffect } from "react";
import { orgPrefixPaths } from "./orgPrefixPaths";
// Set up a Router instance
import { type RootRouteContext, Route } from "./routes/__root";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { SidebarProvider } from "./components/ui/sidebar";
import { Providers } from "./lib/providers";
import { SidebarGhost } from "./components/ui/sidebar-ghost";
import { LoadingProgress } from "./components/ui/loading-progress";
import { AnimatePresence } from "framer-motion";

// Add this function before creating the orgRoute
function updateRoutePaths(route: RouteType) {
  // console.log(route.options);
  if (
    route.options.path &&
    orgPrefixPaths.some((prefix) => route.options.path.startsWith(prefix))
  ) {
    // Remove leading slash and add $orgId prefix
    const newPath = route.options.path.startsWith("/")
      ? route.options.path.slice(1)
      : route.options.path;
    // route.options.path = `$orgId/${newPath}`;
    // const existingBeforeLoad = route.options.beforeLoad;
    route.update({
      path: `$type/$orgId/${newPath}`,
    });
  }

  // Recursively update children if they exist
  if (route.children) {
    route.children.forEach(updateRoutePaths);
  }
}

// Update all routes in the routeTree that match orgPrefixPaths
(routeTree.children as unknown as any[])?.forEach(updateRoutePaths);

let orgSlug: string | null = "$orgId";
let type: string | null = "$type";

const existingBeforeLoad = routeTree.options.beforeLoad;
routeTree.update({
  beforeLoad: async (ctx) => {
    await existingBeforeLoad?.(ctx);

    const location = ctx.location;

    if (location.pathname.includes("$type/$orgId")) {
      location.pathname = location.pathname.replace("$type/$orgId", "");
    }
    // console.log("location", location);
    // if (location.pathname.includes(`/${type}/${orgSlug}`)) {
    //   location.pathname = location.pathname.replace(`/${type}/${orgSlug}`, "");
    // }

    const context: RootRouteContext = ctx.context;

    // Guard against redirect loops
    if (location.pathname === "/org-not-found") return;

    const memberships = context.clerk?.user?.organizationMemberships;
    const personalOrg = context.clerk?.user?.username ?? "personal";
    let currentOrg = context.clerk?.organization?.slug || null;

    const {
      inPathWithOrgPrefix,
      pathParts,
      currentRouteIncomingOrg,
      pathWithoutOrg,
    } = getOrgPathInfo(currentOrg, location.pathname);

    const isValidOrg = memberships?.some(
      (membership) => membership.organization.slug === currentRouteIncomingOrg,
    );
    const notPersonalOrg =
      currentRouteIncomingOrg !== personalOrg &&
      currentRouteIncomingOrg !== null;

    // log all items
    // console.log("shit", {
    //   inPathWithOrgPrefix,
    //   pathParts,
    //   currentRouteIncomingOrg,
    //   currentOrg,
    //   isValidOrg,
    //   notPersonalOrg,
    // });

    // To check org are valid, if not redirect to org-not-found, and apply incoming org to current org
    if (inPathWithOrgPrefix && currentRouteIncomingOrg !== currentOrg) {
      // If org doesn't exist and it's not personal org, redirect to org-not-found
      if (!isValidOrg && notPersonalOrg) {
        throw redirect({
          to: "/org-not-found",
          search: {
            org: currentRouteIncomingOrg,
          },
        });
      }

      if (currentRouteIncomingOrg !== currentOrg) {
        // console.log("shit", "setting org", currentRouteIncomingOrg);
        currentOrg = currentRouteIncomingOrg;
        context.clerk?.setActive({
          organization: currentRouteIncomingOrg,
        });
      }
    }

    // Add org prefix to path if needed
    currentOrg = currentOrg ?? personalOrg;

    if (
      inPathWithOrgPrefix &&
      currentOrg &&
      !location.pathname.includes(`/${currentOrg}/`)
    ) {
      // const shouldHaveOrgPrefix = orgPrefixPaths.some((path) =>
      //   location.pathname.startsWith(path),
      // );
      // if (shouldHaveOrgPrefix) {
      if (!notPersonalOrg) {
        // console.log(
        //   "shit",
        //   "redirecting to",
        //   `/user/${currentOrg}${location.pathname}`,
        // );
        orgSlug = currentOrg;
        type = "user";
        throw redirect({
          to: `/user/${currentOrg}${location.pathname}`,
          search: location.search,
        });
      }
      // console.log(
      //   "shit",
      //   "redirecting to",
      //   `/org/${currentOrg}${location.pathname}`,
      // );
      orgSlug = currentOrg;
      type = "org";
      throw redirect({
        to: `/org/${currentOrg}${location.pathname}`,
        search: location.search,
      });
    }
  },
});

// Add the org route and its children
// routeTree.addChildren([orgRoute]);

// Create a router instance
const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  context: {
    auth: undefined as ReturnType<typeof useAuth> | undefined,
    clerk: undefined as ReturnType<typeof useClerk> | undefined,
  },
});

const existingGetMatchedRoutes = router.getMatchedRoutes;
// To map all non org routes to org routes
router.getMatchedRoutes = (next, opts) => {
  if (
    opts?.to &&
    orgPrefixPaths.some((prefix) => opts?.to?.startsWith(prefix))
  ) {
    const memberships = publicClerk?.user?.organizationMemberships;
    const personalOrg = publicClerk?.user?.username ?? "personal";
    const currentOrg = publicClerk?.organization?.slug || null;

    const {
      inPathWithOrgPrefix,
      pathParts,
      currentRouteIncomingOrg,
      pathWithoutOrg,
    } = getOrgPathInfo(currentOrg, opts?.to);

    const notPersonalOrg =
      currentRouteIncomingOrg !== personalOrg &&
      currentRouteIncomingOrg !== null;

    // Remove leading slash and add $orgId prefix
    const newPath = opts?.to?.startsWith("/") ? opts?.to?.slice(1) : opts?.to;

    type = notPersonalOrg ? "org" : "user";
    orgSlug = notPersonalOrg ? currentOrg : personalOrg;

    // console.log("shit log", next, opts, next.pathname, newPath);
    opts.to = `/${type}/${orgSlug}/${newPath}`;
  }

  const result = existingGetMatchedRoutes(next, opts);
  return result;
};

// Register things for typesafety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  throw new Error("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set");
}

const rootElement = document.getElementById("app");

if (!rootElement) {
  throw new Error("Root element not found");
}

let publicClerk: ReturnType<typeof useClerk> | undefined;

function InnerApp() {
  const auth = useAuth();
  const clerk = useClerk();
  publicClerk = clerk;

  return (
    <div className="animate-in" style={{ animationDuration: "300ms" }}>
      <div className="pointer-events-none fixed inset-0 z-[-1] flex flex-row bg-white">
        <div className="absolute h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        <SidebarGhost />
        <AnimatePresence mode="wait">
          {!auth.isLoaded && <LoadingProgress key="loading" />}
        </AnimatePresence>
      </div>
      <SidebarProvider>
        <Providers>
          <RouterProvider router={router} context={{ auth, clerk }} />
        </Providers>
      </SidebarProvider>
    </div>
  );
}

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <ClerkProvider
      appearance={{
        elements: {
          cardBox: "rounded-lg shadow-md border border-gray-100 border-1",
        },
      }}
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      afterSignOutUrl="/"
    >
      <InnerApp />
    </ClerkProvider>,
  );
}
