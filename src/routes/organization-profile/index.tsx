import { useCurrentPlan } from "@/hooks/use-current-plan";
import { api } from "@/lib/api";
import { dark } from "@clerk/themes";
import { OrganizationProfile, useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useTheme } from "@/components/theme-provider";

export const Route = createFileRoute("/organization-profile/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { orgId } = useAuth();
  const plan = useCurrentPlan();
  const { theme } = useTheme();
  console.log("🚀 ~ RouteComponent ~ theme:", theme);

  if (!orgId) {
    return <div>Not Found</div>;
  }

  useQuery({
    queryKey: ["seats", plan?.plans?.plans?.[0], orgId],
    queryFn: () => {
      return api({
        url: "platform/seats",
        init: {
          method: "PATCH",
        },
      });
    },
    enabled: !!plan?.plans?.plans?.[0],
  });

  return (
    <OrganizationProfile
      routing="virtual"
      appearance={{
        baseTheme: theme === "dark" ? dark : undefined,
        elements: {
          rootBox:
            "w-full h-full shadow-none outline-none bg-transparent px-0 ring-0 border-0",
          cardBox:
            "max-w-full md:max-w-4xl w-full h-full shadow-none outline-none rounded-none bg-transparent border-0",
          scrollBox:
            "shadow-none outline-none rounded-none bg-transparent border-0",
        },
      }}
    />
  );
}
