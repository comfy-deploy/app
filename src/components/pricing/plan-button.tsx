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
import { useMatchRoute, useRouter, useSearch } from "@tanstack/react-router";
import { Sparkle } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "../auto-form/auto-form-dialog";

async function getUpgradeOrNewPlan(plan: string, coupon?: string) {
  return api({
    url: "platform/upgrade-plan",
    params: {
      plan,
      coupon,
    },
  });
}

function getButtonLabel(currentPlans: string[], targetPlan: string): string {
  const onThisPlan = !!currentPlans?.includes(targetPlan);

  if (onThisPlan) {
    return "Manage";
  }

  if (targetPlan === "basic") {
    return "Get started";
  }

  if (currentPlans.length === 0) {
    return "Get Started";
  }

  // console.log(targetPlan);

  const wsPlanPriority: Record<string, number> = {
    ws_basic: 1,
    ws_pro: 2,
  };

  const apiPlanPriority: Record<string, number> = {
    basic: 1,
    pro: 2,
    enterprise: 3,
    business: 4,
  };

  let currentPlanPriority = 0;
  let targetPlanPriority = 0;

  if (targetPlan.includes("ws")) {
    currentPlanPriority = Math.max(
      ...currentPlans.map((plan) => wsPlanPriority[plan] || 0),
    );
    targetPlanPriority = wsPlanPriority[targetPlan];
  } else {
    currentPlanPriority = Math.max(
      ...currentPlans.map((plan) => apiPlanPriority[plan] || 0),
    );
    targetPlanPriority = apiPlanPriority[targetPlan];
  }

  if (targetPlanPriority > currentPlanPriority) {
    return "Upgrade";
  } else if (targetPlanPriority < currentPlanPriority) {
    return "Downgrade";
  }

  return "Get Started"; // Default to "Upgrade" if same level (unlikely case)
}

export function UpgradeButton(props: {
  plan: any;
  href: string;
  className?: string;
  plans?: string[];
  trial?: boolean;
  data?: Record<string, any>;
  allowCoupon?: boolean;
}) {
  const { userId } = useAuth();
  const [invoice, setInvoice] = useState<any | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const posthog = usePostHog();

  const label = getButtonLabel(props.plans || [], props.plan);

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

  return (
    <>
      <Modal
        title={label}
        setOpen={async () => {
          setInvoice(undefined);
        }}
        open={invoice !== undefined}
        description="Preview plan changes."
        trigger={
          <Button
            Icon={Sparkle}
            className={cn(
              "relative w-fit",
              label === "Manage" && "bg-primary/60",
              props.className,
            )}
            iconPlacement="right"
            variant="expandIconOutline"
            isLoading={isLoading}
            onClick={async () => {
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
                const invoice = await callServerPromise(
                  getUpgradeOrNewPlan(props.plan, coupon),
                );

                if (!invoice || "error" in invoice) {
                  const res = await api({
                    url: "platform/checkout",
                    params: {
                      plan: props.plan,
                      trial: props.trial,
                      redirect_url: window.location.href,
                      coupon,
                    },
                  });

                  if (res.error) {
                    toast.error(res.error);
                  } else {
                    window.location.href = res.url;
                  }

                  // window.location.href =
                  //   props.href +
                  //   "&redirect=" +
                  //   encodeURIComponent(window.location.href) +
                  //   (props.trial ? "&trial=true" : "") +
                  //   (props.allowCoupon && coupon
                  //     ? "&coupon=" + encodeURIComponent(coupon)
                  //     : "");
                  // router.push();
                } else {
                  setInvoice(invoice);
                }
              } catch (error) {
                toast.error("Failed to process upgrade request");
              } finally {
                setIsLoading(false);
              }
            }}
          >
            {isCustom ? "Book a call" : label}
            {/* <BlueprintOutline /> */}
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
            {invoice.lines.data.map((line) => {
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
                  window.location.href = res.url;
                }

                await new Promise((resolve) => setTimeout(resolve, 5000));
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
