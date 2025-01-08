import { queryClient } from "@/lib/providers";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/analytics/")({
  loader: async () => {
    const sub = (await queryClient.ensureQueryData({
      queryKey: ["platform", "plan"],
    })) as { plans?: any };

    if (!sub?.plans?.length) {
      console.log("redirecting");
      throw redirect({
        to: "/workflows",
      });
    }

    return { sub };
  },
});
