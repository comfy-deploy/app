import { useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";

// ==== deprecated plan check ====

export const useCurrentPlanQuery = () => {
  return useQuery<any>({
    queryKey: ["platform", "plan"],
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

// ==== New Autumn API ====

export interface CustomerPlan {
  customer: {
    id: string;
  };
  products: {
    id: string;
    name: string;
    status: string;
  };
  entitlements: {
    feature_id: string;
    balance: number;
  }[];
}

const useCustomerPlan = () => {
  const { isSignedIn } = useUser();

  return useQuery<CustomerPlan>({
    queryKey: ["platform", "autumn", "customer"],
    enabled: !!isSignedIn,
  });
};

export const usePlanType = () => {
  const { data, isLoading, error } = useCustomerPlan();

  const isPlan = (planName: string): boolean => {
    return data?.products?.id?.toLowerCase() === planName.toLowerCase();
  };

  const isFreePlan = (): boolean => {
    return !data?.products || isPlan("free");
  };

  return {
    currentPlan: data?.products?.name || "free",
    data,
    isPlan,
    isFreePlan,
    isLoading,
    error,
  };
};
