"use client";

import { useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";

export const useCurrentPlanQuery = () => {
  return useQuery<any>({
    queryKey: ["platform", "plan"],
    refetchInterval: 5000,
  });
};

export const useCurrentPlan = () => {
  const { isSignedIn } = useUser();
  const { data, isLoading } = useCurrentPlanQuery();
  // console.log(data);

  return data;
};

export const useCurrentPlanWithStatus = () => {
  return useCurrentPlanQuery();
};

export interface SubscriptionPlan {
  plans: {
    plans: string[];
    names: string[];
    prices: (number | null)[];
    amount: number[];
  };
  cancel_at_period_end: boolean;
  canceled_at: string | null;
}
