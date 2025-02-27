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
  }[];
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

  // Find the active product (if any)
  const activeProduct = data?.products?.find(
    (product) => product.status.toLowerCase() === "active",
  );

  /**
   * Check if user has a specific plan type
   * @param planName The plan name to check (e.g., "business", "creator")
   * @param options Configuration options
   * @param options.activeOnly Only check active plans (default: true)
   */
  const hasPlan = (
    planName: string,
    options = { activeOnly: true },
  ): boolean => {
    if (!data?.products?.length) return false;

    return data.products.some((product) => {
      const matchesPlan = product.id
        .toLowerCase()
        .includes(planName.toLowerCase());
      return options.activeOnly
        ? matchesPlan && product.status.toLowerCase() === "active"
        : matchesPlan;
    });
  };

  const isFreePlan = (): boolean => {
    return !activeProduct || hasPlan("free");
  };

  return {
    currentPlan: activeProduct?.name || "free",
    activeProduct,
    data,
    hasPlan,
    isFreePlan,
    isLoading,
    error,
  };
};
