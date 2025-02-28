"use client";

import { Button } from "@/components/ui/button";
import { BlueprintOutline } from "@/components/ui/custom/blueprint-outline";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
// import { getUpgradeOrNewPlan } from "@/db/getUpgradeOrNewPlan";
import { callServerPromise } from "@/lib/call-server-promise";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/clerk-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMatchRoute, useRouter, useSearch } from "@tanstack/react-router";
import { Sparkle } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "../auto-form/auto-form-dialog";
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
  const { userId } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const router = useRouter();

  const posthog = usePostHog();

  // Parse the subscription data from props.data
  const subscriptionData = props.subscription;
  console.log(subscriptionData?.products);
  const hasScheduledChange = subscriptionData?.products?.find(
    (plan: any) => plan.status === "scheduled",
  );

  console.log(subscriptionData);

  const label = getButtonLabel(
    props.plans || [],
    props.plan,
    subscriptionData?.products,
  );

  const [coupon, setCoupon] = useState<string>();

  const search = useSearch({
    from: "/pricing",
  });

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

  // Determine if button should be disabled
  // const isDisabled = hasScheduledChange && label !== "Manage";

  return (
    <>
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
                });
                return;
              }

              if (!userId && !isCustom) {
                router.navigate({
                  to: "/auth/sign-in",
                });
                return;
              }

              posthog.capture("pricing_option:click", {
                ...props.data,
              });

              if (isCustom) {
                router.navigate({
                  to: "/onboarding-call",
                });
                // window.open(
                //   "https://cal.com/forms/2007157f-bc77-478f-8604-2029f58b364a?solution=" +
                //     encodeURIComponent("ComfyDeploy Enterprise"),
                //   "_blank",
                // );
                return;
              }

              setIsLoading(true);
              try {
                // const invoice = await callServerPromise(
                //   getUpgradeOrNewPlan(props.plan, coupon),
                // );

                // if (!invoice || "error" in invoice) {
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
                toast.error("Failed to process upgrade request");
              } finally {
                setIsLoading(false);
              }
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
