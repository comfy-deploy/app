import { useQuery } from "@tanstack/react-query";
import { dexieDB } from "./dexiedb";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect } from "react";
import { useLocation } from "@tanstack/react-router";

interface CurrentPlan {
  plans: {
    plans: string[];
  };
}

export function useDexieCurrentPlan() {
  const location = useLocation();
  // Extract type and orgId from URL path
  const pathParts = location.pathname.split("/").filter(Boolean);
  const type = pathParts[0] || null;
  const orgIdFromParams = pathParts[1] || null;

  // Create a combined ID as the primary identifier
  const id = type && orgIdFromParams ? `${type}_${orgIdFromParams}` : null;

  // Get cached data from Dexie
  const cachedPlan = useLiveQuery(
    async () => {
      if (!id) return null;
      return await dexieDB.plans.get(id);
    },
    [id],
    null,
  );

  // Fetch real data
  const { data: realData, isLoading } = useQuery<CurrentPlan>({
    queryKey: ["platform", "plan"],
  });

  useEffect(() => {
    if (!id || isLoading) return;

    const currentPlan = realData?.plans?.plans[0];

    // If no cached plan exists at all, create a new entry
    if (!cachedPlan) {
      dexieDB.plans.put({
        id,
        plan: currentPlan,
      });
    }
    // If cached plan exists but plan data has changed
    else if (cachedPlan.plan !== currentPlan) {
      dexieDB.plans.update(id, {
        plan: currentPlan,
      });
    }
  }, [id, realData, cachedPlan, isLoading]);

  // First time loading without cache
  if (isLoading && !cachedPlan) {
    return {
      plan: undefined,
      isLoading: true,
    };
  }

  // Return cached data while loading, or real data if available
  return {
    plan: realData?.plans?.plans[0] || cachedPlan?.plan,
    isLoading: isLoading && !cachedPlan,
  };
}
