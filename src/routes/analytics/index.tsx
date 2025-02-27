import { queryClient } from "@/lib/providers";
import { createFileRoute, redirect } from "@tanstack/react-router";
import type { CustomerPlan } from "@/hooks/use-current-plan";

export const Route = createFileRoute("/analytics/")({
  loader: async () => {
    const customerPlan = (await queryClient.ensureQueryData({
      queryKey: ["platform", "autumn", "customer"],
    })) as CustomerPlan;

    // Replicate the logic from your hook
    const isFreePlan =
      !customerPlan?.products ||
      customerPlan?.products?.id?.toLowerCase() === "free";

    if (isFreePlan) {
      throw redirect({ to: "/workflows" });
    }

    return { customerPlan };
  },
});
