import { useAuth, useOrganization, useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";

export const useCurrentPlanQuery = () => {
  return useQuery<any>({
    queryKey: ["platform", "plan"],
  });
};

export const ALLOWED_DEPLOYMENT_PLANS = [
  "deployment_monthly",
  "deployment_yearly",
  "business_monthly",
  "business_yearly",
] as const;

export const ALLOWED_BUSINESS_PLANS = [
  "business_monthly",
  "business_yearly",
] as const;

type MetadataKey = "isDeploymentAllowed" | "isBusinessAllowed";

export const useCurrentPlan = () => {
  const { isSignedIn } = useUser();
  const { data, isLoading } = useCurrentPlanQuery();
  // console.log(data);

  return data;
};

type PlanCheck = (plan: any) => boolean;

const useMetadataCheck = (metadataKey: string) => {
  const { orgId } = useAuth();
  const { user } = useUser();
  const { organization } = useOrganization();

  return orgId
    ? organization?.publicMetadata?.[metadataKey]
    : user?.publicMetadata?.[metadataKey];
};

const usePermissionCheck = (metadataKey: MetadataKey, planCheck: PlanCheck) => {
  const plan = useCurrentPlan();
  const metadataOverride = useMetadataCheck(metadataKey);

  return metadataOverride ?? planCheck(plan);
};

export const useIsDeploymentAllowed = () => {
  return usePermissionCheck("isDeploymentAllowed", (plan) =>
    ALLOWED_DEPLOYMENT_PLANS.includes(plan?.plans?.plans?.[0]),
  );
};

export const useIsBusinessAllowed = () => {
  return usePermissionCheck("isBusinessAllowed", (plan) =>
    ALLOWED_BUSINESS_PLANS.includes(plan?.plans?.plans?.[0]),
  );
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
