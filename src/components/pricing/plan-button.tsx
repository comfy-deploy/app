"use client";

import { useAuth } from "@clerk/clerk-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearch } from "@tanstack/react-router";
import { useCustomer } from "autumn-js/react";
import { Check, Sparkle } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
// import { getUpgradeOrNewPlan } from "@/db/getUpgradeOrNewPlan";
import { callServerPromise } from "@/lib/call-server-promise";
import { cn } from "@/lib/utils";
import { Modal } from "../auto-form/auto-form-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Badge } from "../ui/badge";

async function getUpgradeOrNewPlan(plan: string, coupon?: string) {
  return api({
    url: "platform/upgrade-plan",
    params: {
      plan,
      coupon,
    },
  });
}

interface PlanButtonProps {
  plan: string;
  href: string;
  className?: string;
  plans?: string[];
  trial?: boolean;
  data?: Record<string, string>;
  allowCoupon?: boolean;
  subscription?: any;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  group: string;
  status: "active" | "scheduled" | "canceled";
  created_at: number;
  canceled_at: number | null;
  processor: {
    type: string;
    subscription_id: string | null;
  };
  prices: Array<{
    amount: number;
    interval: string;
  }>;
}

interface InvoiceLine {
  id: string;
  description: string;
  amount: number;
  currency: string;
  period: {
    start: number;
    end: number;
  };
}

interface Invoice {
  lines: {
    data: InvoiceLine[];
  };
  period_end: number;
  total: number;
}

// New interfaces for checkout preview data
interface CheckoutLineItem {
  description: string;
  amount: number;
  item: {
    feature_id: string | null;
    included_usage: number | null;
    interval: string | null;
    usage_model: string | null;
    price: number | null;
    billing_units: number | null;
    entity_feature_id: string | null;
    reset_usage_on_billing: boolean | null;
    reset_usage_when_enabled: boolean | null;
  };
}

interface CheckoutProduct {
  created_at: number;
  id: string;
  name: string;
  env: string;
  is_add_on: boolean;
  is_default: boolean;
  group: string;
  version: number;
  items: Array<{
    feature_id: string | null;
    included_usage: number | null;
    interval: string | null;
    usage_model: string | null;
    price: number | null;
    billing_units: number | null;
    entity_feature_id: string | null;
    reset_usage_on_billing: boolean | null;
    reset_usage_when_enabled: boolean | null;
  }>;
  free_trial: any | null;
  scenario: string;
  base_variant_id: string | null;
}

interface CheckoutPreviewData {
  url: string | null;
  customer_id: string;
  has_prorations: boolean;
  lines: CheckoutLineItem[];
  total: number;
  currency: string;
  options: any[];
  product: CheckoutProduct;
  current_product: CheckoutProduct;
  next_cycle: any | null;
}

interface CheckoutResponse {
  data?: CheckoutPreviewData;
  url?: string;
  error?: string | null;
}

function getButtonLabel(
  currentPlans: string[],
  targetPlan: string,
  scheduledPlans?: SubscriptionPlan[],
): string {
  const [planId, billing] = targetPlan.split("_");
  const isYearly = billing === "yearly";

  const activeProduct = scheduledPlans?.find(
    (plan: any) => plan.status === "active",
  );

  // Check if there's a scheduled plan change
  const hasScheduledChange = scheduledPlans?.find(
    (plan) => plan.status === "scheduled",
  );

  if (hasScheduledChange && activeProduct?.id === targetPlan) {
    return "Reactivate";
  }

  if (activeProduct?.id === targetPlan) {
    return "Manage";
  }

  if (hasScheduledChange && hasScheduledChange?.id === targetPlan) {
    if (activeProduct?.canceled_at)
      return `Scheduled for ${new Date(activeProduct?.canceled_at).toLocaleDateString()}`;
    return "Scheduled";
  }

  if (hasScheduledChange) {
    return "Scheduled plan change";
  }

  // Check if user is on this plan (either monthly or yearly)
  const isOnThisPlan = currentPlans?.some((p) => p.startsWith(planId));
  const isOnYearlyPlan = currentPlans?.includes(`${planId}_yearly`);
  const isOnMonthlyPlan = currentPlans?.includes(`${planId}_monthly`);

  if (isOnThisPlan) {
    // If viewing yearly tab and on yearly plan, or viewing monthly tab and on monthly plan
    if ((isYearly && isOnYearlyPlan) || (!isYearly && isOnMonthlyPlan)) {
      return "Manage";
    }

    // If viewing monthly tab and on yearly plan
    if (!isYearly && isOnYearlyPlan) {
      return "Switch to monthly";
    }

    // If viewing monthly tab and on monthly plan, or viewing yearly tab
    if (isYearly && isOnMonthlyPlan) {
      return "Switch to yearly";
    }
  }

  if (targetPlan === "basic") {
    return "Get started";
  }

  if (currentPlans.length === 0) {
    return "Get Started";
  }

  const apiPlanPriority: Record<string, number> = {
    basic: 1,
    pro: 2,
    creator: 3,
    enterprise: 4,
    deployment: 5,
    business: 6,
  };

  let currentPlanPriority = 0;
  let targetPlanPriority = 0;

  currentPlanPriority = Math.max(
    ...currentPlans.map((plan) => apiPlanPriority[plan.split("_")[0]] || 0),
  );
  targetPlanPriority = apiPlanPriority[planId];

  if (targetPlanPriority > currentPlanPriority) {
    return "Upgrade";
  }

  if (targetPlanPriority < currentPlanPriority) {
    return "Downgrade";
  }

  return "Get Started";
}

export function UpgradeButton(props: PlanButtonProps) {
  const { checkout, attach, openBillingPortal } = useCustomer();

  const { userId, orgId } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [checkoutPreview, setCheckoutPreview] = useState<
    CheckoutPreviewData | undefined
  >();
  const [showCheckoutPreview, setShowCheckoutPreview] = useState(false);
  const [showDowngradePreview, setShowDowngradePreview] = useState(false);
  const [downgradePreviewData, setDowngradePreviewData] = useState<
    CheckoutPreviewData | undefined
  >();
  const queryClient = useQueryClient();

  const router = useRouter();

  const posthog = usePostHog();

  // Parse the subscription data from props.data
  const subscriptionData = props.subscription;
  const hasScheduledChange = subscriptionData?.products?.find(
    (plan: any) => plan.status === "scheduled",
  );

  const label = getButtonLabel(
    props.plans || [],
    props.plan,
    subscriptionData?.products,
  );

  // Check if user is on business plan
  const isOnBusinessPlan = (props.plans || []).some((plan) =>
    ["business", "business_monthly", "business_yearly"].includes(plan),
  );

  const [coupon, setCoupon] = useState<string>();

  const ready = true; //search?.ready;

  let isCustom = (props.plan as any) === "large_enterprise";
  const isBasic = props.plan === "basic";

  if (!ready && label !== "Manage") {
    isCustom = true;
  }

  if (props.plan === "basic") {
    isCustom = false;
  }

  const isDisabled =
    !(hasScheduledChange && props.plan === hasScheduledChange.id) &&
    !label.includes("Manage") &&
    !label.includes("Upgrade") &&
    !label.includes("Downgrade") &&
    !label.includes("Switch") &&
    !label.includes("Started") &&
    !label.includes("Reactivate");

  const handlePlanChange = async () => {
    setIsLoading(true);
    try {
      const res = await callServerPromise(
        api({
          url: "platform/checkout",
          params: {
            plan: props.plan,
            trial: props.trial,
            redirect_url: window.location.href,
            upgrade: true,
            coupon,
          },
        }),
      );

      if (res.error) {
        toast.error(res.error);
      } else if (res.url) {
        window.location.href = res.url;
      }
    } catch (error) {
      toast.error("Failed to process request");
    } finally {
      setIsLoading(false);
      setShowConfirmDialog(false);
    }
  };

  // Determine if button should be disabled
  // const isDisabled = hasScheduledChange && label !== "Manage";

  return (
    <>
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {label === "Upgrade"
                ? "Confirm Upgrade"
                : label === "Downgrade"
                  ? "Confirm Downgrade"
                  : label.startsWith("Switch to")
                    ? `Confirm ${label}`
                    : "Confirm Plan Change"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {label === "Upgrade"
                ? "Are you sure you want to upgrade your plan? You will be charged immediately."
                : label === "Downgrade"
                  ? "Are you sure you want to downgrade your plan? This will take effect at the end of your current billing period."
                  : label === "Switch to yearly"
                    ? "Are you sure you want to switch to yearly billing? You will be charged immediately. This may provide savings compared to monthly billing."
                    : label === "Switch to monthly"
                      ? "Are you sure you want to switch to monthly billing? You will be charged immediately."
                      : "Are you sure you want to change your plan? This will update your subscription terms."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePlanChange}>
              {label.startsWith("Switch to")
                ? "Confirm Switch"
                : label === "Upgrade"
                  ? "Confirm Upgrade"
                  : "Confirm Downgrade"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Checkout Preview Dialog */}
      <AlertDialog
        open={showCheckoutPreview}
        onOpenChange={(open) => {
          setShowCheckoutPreview(open);
          if (!open) {
            setCheckoutPreview(undefined);
          }
        }}
      >
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm{" "}
              {checkoutPreview?.product.scenario === "upgrade"
                ? "Upgrade"
                : "Plan Change"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Review your plan change details before proceeding.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {checkoutPreview && (
            <div className="space-y-4">
              {/* Plan Comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Current Plan
                  </h4>
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium">
                      {checkoutPreview.current_product.name}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    New Plan
                  </h4>
                  <div className="p-3 border rounded-lg bg-blue-50">
                    <p className="font-medium">
                      {checkoutPreview.product.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature Comparison */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Feature Changes</h4>
                <ul className="space-y-0.5">
                  {(() => {
                    // Create a map of current features
                    const currentFeatures = new Map();
                    checkoutPreview.current_product.items.forEach((item) => {
                      if (item.feature_id && item.included_usage !== null) {
                        currentFeatures.set(
                          item.feature_id,
                          item.included_usage,
                        );
                      }
                    });

                    // Create a map of new features
                    const newFeatures = new Map();
                    checkoutPreview.product.items.forEach((item) => {
                      if (item.feature_id && item.included_usage !== null) {
                        newFeatures.set(item.feature_id, item.included_usage);
                      }
                    });

                    // Get all unique feature IDs
                    const allFeatureIds = new Set([
                      ...currentFeatures.keys(),
                      ...newFeatures.keys(),
                    ]);

                    // Helper function to format feature names
                    const formatFeatureName = (featureId: string) => {
                      const names: Record<string, string> = {
                        gpu_concurrency_limit: "GPU Concurrency",
                        machine_limit: "Machine Limit",
                        workflow_limit: "Workflow Limit",
                        seats: "Team Seats",
                        self_hosted_machines: "Self-Hosted Machines",
                      };
                      return (
                        names[featureId] ||
                        featureId
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())
                      );
                    };

                    const formatValue = (value: number | undefined) => {
                      if (value === undefined) return "Not included";
                      if (value === null) return "Unlimited";
                      return value.toLocaleString();
                    };

                    return Array.from(allFeatureIds)
                      .map((featureId) => {
                        // Skip GPU Credit features
                        if (
                          featureId.includes("gpu-credit") ||
                          featureId.includes("gpu_credit")
                        ) {
                          return null;
                        }

                        const currentValue = currentFeatures.get(featureId);
                        const newValue = newFeatures.get(featureId);

                        // Skip if both are undefined/null
                        if (
                          currentValue === undefined &&
                          newValue === undefined
                        )
                          return null;

                        let changeType:
                          | "increase"
                          | "decrease"
                          | "new"
                          | "removed"
                          | "same" = "same";
                        let changeText = "";

                        if (
                          currentValue === undefined &&
                          newValue !== undefined
                        ) {
                          changeType = "new";
                          changeText = `+${formatValue(newValue)} (new feature)`;
                        } else if (
                          currentValue !== undefined &&
                          newValue === undefined
                        ) {
                          changeType = "removed";
                          changeText = "Feature removed";
                        } else if (currentValue !== newValue) {
                          if ((newValue || 0) > (currentValue || 0)) {
                            changeType = "increase";
                            const diff = (newValue || 0) - (currentValue || 0);
                            changeText = `+${diff.toLocaleString()} (${formatValue(currentValue)} → ${formatValue(newValue)})`;
                          } else {
                            changeType = "decrease";
                            const diff = (currentValue || 0) - (newValue || 0);
                            changeText = `-${diff.toLocaleString()} (${formatValue(currentValue)} → ${formatValue(newValue)})`;
                          }
                        } else {
                          changeText = "No change";
                        }

                        const bgColor = {
                          increase: "bg-green-50 border-green-200",
                          new: "bg-green-50 border-green-200",
                          decrease: "bg-red-50 border-red-200",
                          removed: "bg-red-50 border-red-200",
                          same: "bg-gray-50",
                        }[changeType];

                        const textColor = {
                          increase: "text-green-700",
                          new: "text-green-700",
                          decrease: "text-red-700",
                          removed: "text-red-700",
                          same: "text-gray-600",
                        }[changeType];

                        const icon = {
                          increase: "📈",
                          new: "✨",
                          decrease: "📉",
                          removed: "❌",
                          same: "➡️",
                        }[changeType];

                        return (
                          <li
                            key={featureId}
                            className="flex items-center justify-between py-0.5 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <Check className="h-3 w-3 flex-shrink-0 text-green-500" />
                              <span className="font-medium text-gray-600 dark:text-zinc-400">
                                {formatFeatureName(featureId)}
                              </span>
                              <span
                                className={`text-xs ${textColor} font-medium`}
                              >
                                {changeText}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {formatValue(newValue) !== "Not included" && (
                                <Badge
                                  variant="secondary"
                                  className="h-4 px-1.5 py-0 text-[10px] rounded-sm"
                                >
                                  {formatValue(newValue)}
                                </Badge>
                              )}
                            </div>
                          </li>
                        );
                      })
                      .filter(Boolean);
                  })()}
                </ul>
              </div>

              {/* Billing Details */}
              <div className="space-y-3">
                <h4 className="font-medium">Billing Details</h4>
                {checkoutPreview.lines.map((line, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-2 px-3 rounded-md bg-gray-50"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{line.description}</p>
                      {line.item.interval && (
                        <p className="text-xs text-muted-foreground">
                          Billed {line.item.interval}ly
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {line.description.toLowerCase().includes("gpu credit")
                          ? "On demand billing"
                          : line.amount === 0
                            ? "Included"
                            : `$${line.amount.toFixed(2)}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <p className="text-base font-semibold">Total</p>
                  <p className="text-base font-semibold">
                    ${checkoutPreview.total.toFixed(2)}{" "}
                    {checkoutPreview.currency}
                  </p>
                </div>
                {checkoutPreview.has_prorations && (
                  <p className="text-xs text-muted-foreground mt-1">
                    * Includes prorations for the current billing period
                  </p>
                )}
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isLoading}
              onClick={async () => {
                if (!checkoutPreview) return;

                setIsLoading(true);
                try {
                  await attach({
                    productId: props.plan,
                  });

                  toast.success("Plan updated successfully!");
                  setShowCheckoutPreview(false);

                  // Invalidate queries to refresh the UI
                  await queryClient.invalidateQueries({
                    queryKey: ["platform", "plan"],
                  });
                } catch (error) {
                  console.error("Attach error:", error);
                  toast.error("Failed to update plan. Please try again.");
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              {isLoading ? "Processing..." : "Confirm Plan Change"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Downgrade Preview Dialog for Business Plan Users */}
      <AlertDialog
        open={showDowngradePreview}
        onOpenChange={(open) => {
          setShowDowngradePreview(open);
          if (!open) {
            setDowngradePreviewData(undefined);
          }
        }}
      >
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Manage Business Plan</AlertDialogTitle>
            <AlertDialogDescription>
              If you downgrade to the Free plan, you'll lose access to these
              features and limits:
            </AlertDialogDescription>
          </AlertDialogHeader>

          {downgradePreviewData && (
            <div className="space-y-4">
              {/* Current vs Free Plan Comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Current Plan
                  </h4>
                  <div className="p-3 border rounded-lg bg-blue-50">
                    <p className="font-medium">
                      {downgradePreviewData.current_product.name}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Downgrade To
                  </h4>
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium">
                      {downgradePreviewData.product.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Features You'll Lose */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-red-700">
                  ⚠️ Features & Limits You'll Lose
                </h4>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <ul className="space-y-2">
                    {(() => {
                      // Create a map of current features
                      const currentFeatures = new Map();
                      downgradePreviewData.current_product.items.forEach(
                        (item) => {
                          if (item.feature_id && item.included_usage !== null) {
                            currentFeatures.set(
                              item.feature_id,
                              item.included_usage,
                            );
                          }
                        },
                      );

                      // Create a map of new features
                      const newFeatures = new Map();
                      downgradePreviewData.product.items.forEach((item) => {
                        if (item.feature_id && item.included_usage !== null) {
                          newFeatures.set(item.feature_id, item.included_usage);
                        }
                      });

                      // Helper function to format feature names
                      const formatFeatureName = (featureId: string) => {
                        const names: Record<string, string> = {
                          gpu_concurrency_limit: "GPU Concurrency Limit",
                          machine_limit: "Machine Limit",
                          workflow_limit: "Workflow Limit",
                          seats: "Team Seats",
                          self_hosted_machines: "Self-Hosted Machines",
                        };
                        return (
                          names[featureId] ||
                          featureId
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())
                        );
                      };

                      const formatValue = (value: number | undefined) => {
                        if (value === undefined) return "Not included";
                        if (value === null) return "Unlimited";
                        return value.toLocaleString();
                      };

                      // Get all unique feature IDs and focus on losses
                      const allFeatureIds = new Set([
                        ...currentFeatures.keys(),
                        ...newFeatures.keys(),
                      ]);

                      return Array.from(allFeatureIds)
                        .map((featureId) => {
                          // Skip GPU Credit features
                          if (
                            featureId.includes("gpu-credit") ||
                            featureId.includes("gpu_credit")
                          ) {
                            return null;
                          }

                          const currentValue = currentFeatures.get(featureId);
                          const newValue = newFeatures.get(featureId);

                          // Only show items where user will lose something
                          if (
                            currentValue === undefined ||
                            newValue === undefined ||
                            (newValue || 0) >= (currentValue || 0)
                          ) {
                            return null;
                          }

                          const loss = (currentValue || 0) - (newValue || 0);

                          return (
                            <li
                              key={featureId}
                              className="flex items-center justify-between py-1"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-red-600 font-bold">
                                  -
                                </span>
                                <span className="font-medium text-red-700">
                                  {formatFeatureName(featureId)}
                                </span>
                                <span className="text-sm text-red-600">
                                  ({formatValue(currentValue)} →{" "}
                                  {formatValue(newValue)})
                                </span>
                              </div>
                              <div className="text-sm font-medium text-red-700">
                                -{loss.toLocaleString()} lost
                              </div>
                            </li>
                          );
                        })
                        .filter(Boolean);
                    })()}
                  </ul>
                </div>
              </div>

              {/* Warning Message */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600 font-bold text-lg">⚠️</span>
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Important:</p>
                    <ul className="space-y-1 text-xs">
                      <li>
                        • Any machines/workflows exceeding free limits will be
                        disabled
                      </li>
                      <li>
                        • You'll lose access to advanced features immediately
                      </li>
                      <li>
                        • This change will take effect at your next billing
                        cycle
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setShowDowngradePreview(false);
                await openBillingPortal({
                  openInNewTab: true,
                });
              }}
            >
              Go to Billing Settings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Modal
        title={label}
        setOpen={async (open) => {
          if (!open) {
            setInvoice(undefined);
          }
        }}
        open={invoice !== undefined}
        description={
          hasScheduledChange
            ? "You have a pending plan change. Please cancel it first before making any changes."
            : "Preview plan changes."
        }
        trigger={
          <Button
            Icon={Sparkle}
            className={cn(
              "group",
              "relative",
              "w-fit",
              label === "Manage",
              props.className,
              isDisabled && "cursor-not-allowed opacity-50",
            )}
            iconPlacement="right"
            variant="expandIconOutline"
            isLoading={isLoading}
            disabled={isDisabled}
            onClick={async () => {
              if (hasScheduledChange && isDisabled) {
                toast.error(
                  "You have a pending plan change. Please cancel it first before making any changes.",
                );
                return;
              }

              if (isBasic) {
                router.navigate({
                  to: "/workflows",
                  search: {},
                });
                return;
              }

              if (!userId && !isCustom) {
                router.navigate({
                  to: "/auth/sign-in",
                  search: {},
                });
                return;
              }

              posthog.capture("pricing_option:click", {
                ...props.data,
              });

              if (isCustom) {
                router.navigate({
                  to: "/onboarding-call",
                  search: {},
                });
                return;
              }

              if (!orgId) {
                router.navigate({
                  to: "/create-org",
                  search: {},
                });
                return;
              }

              if (label === "Manage" || label.includes("Manage")) {
                // Show downgrade preview for business plan users
                if (isOnBusinessPlan) {
                  setIsLoading(true);
                  try {
                    // Call checkout with basic plan to get preview of what they'll lose
                    const result = (await checkout({
                      productId: "free",
                    })) as CheckoutResponse;

                    if (result.error) {
                      toast.error(result.error);
                      await openBillingPortal({
                        openInNewTab: true,
                      });
                      return;
                    }

                    // If we get preview data, show the downgrade dialog
                    if (result.data) {
                      setDowngradePreviewData(result.data);
                      setShowDowngradePreview(true);
                      return;
                    }

                    // Fallback to billing portal if no preview data
                    await openBillingPortal({
                      openInNewTab: true,
                    });
                  } catch (error) {
                    console.error("Downgrade preview error:", error);
                    // Fallback to billing portal on error
                    await openBillingPortal({
                      openInNewTab: true,
                    });
                  } finally {
                    setIsLoading(false);
                  }
                  return;
                }

                // For non-business users, go to billing portal directly
                await openBillingPortal({
                  openInNewTab: true,
                });
                return;
              }

              if (
                label === "Upgrade" ||
                label === "Downgrade" ||
                label === "Switch to monthly" ||
                label === "Switch to yearly"
              ) {
                setIsLoading(true);
                try {
                  const result = (await checkout({
                    productId: props.plan,
                  })) as CheckoutResponse;

                  if (result.error) {
                    toast.error(result.error);
                    return;
                  }

                  // If we get a URL, redirect immediately
                  if (result.url) {
                    window.location.href = result.url;
                    return;
                  }

                  // If we get preview data, show the confirmation dialog
                  if (result.data) {
                    setCheckoutPreview(result.data);
                    setShowCheckoutPreview(true);
                    return;
                  }

                  // Fallback error
                  toast.error("No checkout data received");
                } catch (error) {
                  console.error("Checkout error:", error);
                  toast.error("Failed to process checkout");
                } finally {
                  setIsLoading(false);
                }
                return;
              }

              await handlePlanChange();
            }}
          >
            {isCustom ? "Book a call" : label}
            {(label?.toLowerCase().includes("manage") ||
              label?.toLowerCase().includes("switch") ||
              label?.toLowerCase().includes("reactivate")) && (
              <Badge variant="cyan" className="ml-2 group-hover:text-white">
                Current plan
              </Badge>
            )}
            {hasScheduledChange && props.plan === hasScheduledChange.id && (
              <Badge variant="yellow" className="ml-2">
                Change Scheduled
              </Badge>
            )}
          </Button>
        }
      >
        {props.allowCoupon && label !== "Downgrade" ? (
          <div className="flex gap-2">
            <Input
              placeholder="Coupon code"
              onChange={(e) => {
                setCoupon(e.target.value);
              }}
            />
            <Button
              onClick={async (e) => {
                e.preventDefault();
                posthog.capture("pricing_option:click:apply_coupon", {
                  ...props.data,
                });

                const invoice = await callServerPromise(
                  getUpgradeOrNewPlan(props.plan, coupon),
                );

                if (!invoice || "error" in invoice) {
                  // toast.error("Invalid coupon");
                  // router.push();
                } else {
                  setInvoice(invoice);
                }
              }}
            >
              Apply
            </Button>
          </div>
        ) : null}
        {invoice && (
          <>
            {invoice.lines.data.map((line: InvoiceLine) => {
              return (
                <div
                  key={line.id}
                  className="grid grid-cols-2 items-center justify-between"
                >
                  <div className="flex flex-col">
                    <div className="text-sm">{line.description}</div>
                    <Separator className="my-2" />
                    <div className="text-xs">
                      {new Date(line.period.start * 1000).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    {(line.amount / 100).toLocaleString("en-US", {
                      style: "currency",
                      currency: line.currency,
                    })}
                  </div>
                </div>
              );
            })}

            <div className="mt-4 grid grid-cols-2">
              <strong>
                Total due on{" "}
                {new Date(invoice.period_end * 1000).toLocaleDateString()}:
              </strong>{" "}
              <div className="text-right">
                {(invoice.total / 100).toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })}
              </div>
            </div>

            <Button
              onClick={async () => {
                const res = await api({
                  url: "platform/checkout",
                  params: {
                    plan: props.plan,
                    trial: props.trial,
                    redirect_url: window.location.href,
                  },
                });

                if (res.error) {
                  toast.error(res.error);
                } else {
                  // Invalidate the plan query before redirecting
                  await queryClient.invalidateQueries({
                    queryKey: ["platform", "plan"],
                  });
                  setInvoice(undefined); // Close the dialog
                  window.location.href = res.url;
                }
              }}
            >
              Confirm
            </Button>
          </>
        )}
      </Modal>
    </>
  );
}
