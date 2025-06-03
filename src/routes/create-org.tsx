import { useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";
import { CreateOrganization } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/create-org")({
  beforeLoad: async ({ context }) => {
    const org_id = context.auth?.orgId;

    if (org_id) {
      return redirect({
        to: "/pricing",
        search: { ready: undefined, plan: undefined },
      });
    }
  },
  component: CreateOrgPage,
});

export function CreateOrgPage() {
  const { theme } = useTheme();

  return (
    <div className="mt-28 flex flex-col justify-center gap-4 p-4">
      <div className="max-w-lg">
        <div className="mb-2 flex items-center gap-3">
          <h1 className="font-bold text-2xl">Before checking out...</h1>
          <Badge variant="purple" className="!text-2xs py-0.5">
            Required
          </Badge>
        </div>
        <p className="text-gray-600 text-sm leading-[22px] dark:text-gray-400">
          Setting up an organization allows you to collaborate with team
          members, share workflows, and manage resources together. You can
          invite members and manage permissions later.
        </p>
      </div>
      <div className="mx-auto">
        <CreateOrganization
          afterCreateOrganizationUrl="/pricing"
          appearance={{
            baseTheme: theme === "dark" ? dark : undefined,
            elements: {
              cardBox: "dark:border-zinc-700",
            },
          }}
        />
      </div>
    </div>
  );
}
