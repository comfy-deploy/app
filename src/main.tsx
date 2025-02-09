import { ClerkProvider, useAuth, useClerk } from "@clerk/clerk-react";
import {
  RouterProvider,
  createRouter,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import ReactDOM from "react-dom/client";
import { routeTree } from "./routeTree.gen";
import "./globals.css";
import { LoadingIcon } from "@/components/ui/custom/loading-icon";
import { useEffect } from "react";
// Set up a Router instance
const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  context: {
    auth: undefined as ReturnType<typeof useAuth> | undefined,
    clerk: undefined as ReturnType<typeof useClerk> | undefined,
  },
});

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

function InnerApp() {
  const auth = useAuth();
  const clerk = useClerk();

  // We can use a loading state here to show a loading screen
  // if (!auth.isLoaded) {
  //   return (
  //     <div className="flex h-screen w-screen items-center justify-center">
  //       <LoadingIcon />
  //     </div>
  //   );
  // }

  // const router = useRouter();

  // useEffect(() => {
  //   if (auth.isLoaded) {
  //     router.navigate({
  //       to: "/workflows",
  //       // search: {
  //       // 	redirect: location.href,
  //       // },
  //     });
  //   }
  // }, [auth?.isLoaded]);

  return <RouterProvider router={router} context={{ auth, clerk }} />;
}

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      afterSignOutUrl="/"
    >
      <InnerApp />
    </ClerkProvider>,
  );
}
