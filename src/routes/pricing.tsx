import { createFileRoute } from "@tanstack/react-router";
import { useCurrentPlanWithStatus } from "@/hooks/use-current-plan";
import { useState } from "react";
import { Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { ENTERPRISE_TIER } from "@/components/pricing/tiers";
import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";
import { useGPUPricing } from "@/components/pricing/GPUPriceSimulator";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { UpgradeButton } from "@/components/pricing/plan-button";
import { api } from "@/lib/api";
import { callServerPromise } from "@/lib/call-server-promise";

export const Route = createFileRoute("/pricing")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      ready: search.ready as boolean | undefined,
      plan: search.plan as string | undefined,
    };
  },
});

type TierFeature = {
  Basic?: ReactNode | boolean | number;
  Creator?: ReactNode | boolean | number;
  Deployment?: ReactNode | boolean | number;
  Business?: ReactNode | boolean | number;
};

type Tier = {
  name: string;
  id: string;
  priceMonthly: string;
  priceYearly: string;
  description: ReactNode;
};

const tiers: Tier[] = [
  {
    name: "Free",
    id: "free",
    priceMonthly: "Free",
    priceYearly: "Free",
    description: "Run public workflows",
  },
  {
    name: "Creator",
    id: "creator",
    priceMonthly: "$34",
    priceYearly: "$340",
    description: "For individual creators, run ComfyUI anywhere",
  },
  {
    name: "Deployment",
    id: "deployment",
    priceMonthly: "$100",
    priceYearly: "$1000",
    description: "For production deployments, team collaboration",
  },
  {
    name: "Business",
    id: "business",
    priceMonthly: "from $998",
    priceYearly: "from $9980",
    description: "For growing businesses",
  },
  {
    name: "Enterprise",
    id: "large_enterprise",
    priceMonthly: "Custom",
    priceYearly: "Custom",
    description: "SSO + custom integration",
  },
];

const sections = [
  {
    name: "Features",
    features: [
      {
        name: "Run shared workflow",
        tiers: {
          Basic: true,
          Creator: true,
          Deployment: true,
          Business: true,
        },
      },
      {
        name: "GPU Concurrency",
        tiers: {
          Basic: "1",
          Creator: "1",
          Deployment: "10",
          Business: "Custom",
        },
      },
      {
        name: "Free usage credit",
        tiers: {
          Basic: false,
          Creator: "$5",
          Deployment: "$5",
          Business: "$5",
        },
      },
      {
        name: "GPU Types",
        tiers: {
          Basic: "Limited",
          Creator: "All GPU",
          Deployment: "All GPU",
          Business: "All GPU",
        },
      },
      {
        name: "Private workflows",
        tiers: {
          Basic: false,
          Creator: "Unlimited",
          Deployment: "Unlimited",
          Business: "Unlimited",
        },
      },
      {
        name: "Models",
        tiers: {
          Basic: "Limited",
          Creator: "Unlimited",
          Deployment: "Unlimited",
          Business: "Unlimited",
        },
      },
      {
        name: "Custom nodes",
        tiers: {
          Basic: false,
          Creator: "Unlimited",
          Deployment: "Unlimited",
          Business: "Unlimited",
        },
      },
      {
        name: "Workspace",
        tiers: {
          Basic: "Limited",
          Creator: "Unlimited",
          Deployment: "Unlimited",
          Business: "Unlimited",
        },
      },
      {
        name: "Share workflows",
        tiers: {
          Basic: false,
          Creator: true,
          Deployment: true,
          Business: true,
        },
      },
      {
        name: "APIs",
        tiers: {
          Basic: false,
          Creator: false,
          Deployment: true,
          Business: true,
        },
      },
      {
        name: "SDKs",
        tiers: {
          Basic: false,
          Creator: false,
          Deployment: true,
          Business: true,
        },
      },
      {
        name: "Production API endpoints",
        tiers: {
          Basic: false,
          Creator: false,
          Deployment: "Max 5",
          Business: "Unlimited",
        },
      },
      {
        name: "Organization",
        tiers: {
          Basic: false,
          Creator: false,
          Deployment: "1 org (max 4 people)",
          Business: "Uncap Seats",
        },
      },
      {
        name: "Internal APIs",
        tiers: {
          Basic: false,
          Creator: false,
          Deployment: false,
          Business: true,
        },
      },
    ],
  },
];

function PricingTier({
  tier,
  isLoading,
  plans,
  className,
  isYearly,
  showCreatorTier = true,
  showDeploymentTier = true,
}: {
  tier: Tier;
  isLoading: boolean;
  plans: string[];
  className?: string;
  isYearly: boolean;
  showCreatorTier?: boolean;
  showDeploymentTier?: boolean;
}) {
  const getAvailableFeatures = (tierName: string) => {
    if (tierName === "Business" && (!showCreatorTier || !showDeploymentTier)) {
      return sections[0].features.filter((feature) => {
        const value = feature.tiers[tierName as keyof TierFeature];
        if (
          (typeof value === "boolean" && value) ||
          (value !== undefined && value !== null)
        ) {
          return true;
        }

        if (!showCreatorTier && feature.tiers.Creator) {
          return true;
        }

        if (!showDeploymentTier && feature.tiers.Deployment) {
          return true;
        }

        return false;
      });
    }

    return sections[0].features.filter((feature) => {
      const value = feature.tiers[tierName as keyof TierFeature];
      if (typeof value === "boolean") return value;
      return value !== undefined && value !== null;
    });
  };

  const renderIncludesMessage = () => {
    if (tier.name === "Free") return null;
    if (tier.name === "Creator") return "Includes everything in Free";
    if (tier.name === "Deployment") {
      return showCreatorTier
        ? "Includes everything in Creator"
        : "Includes everything in Free";
    }
    if (tier.name === "Business") {
      if (showDeploymentTier) return "Includes everything in Deployment";
      if (showCreatorTier) return "Includes everything in Creator";
      return "Includes everything in Free";
    }
    return null;
  };

  const getMonthlyPrice = (price: string) => {
    if (price === "Free") return "Free";
    if (price === "Custom") return "Custom"; // Handle Custom price for Enterprise tier
    if (price.includes("from")) {
      if (!isYearly) return price;
      const amount = Number.parseInt(price.replace(/\D/g, ""));
      return `from $${Math.round((amount * 10) / 12)}`;
    }
    if (!isYearly) return price;
    const amount = Number.parseInt(price.replace(/\D/g, ""));
    return `$${Math.round((amount * 10) / 12)}`;
  };

  const getYearlyTotal = (price: string) => {
    if (price === "Free") return "Free";
    if (price === "Custom") return "Custom"; // Handle Custom price for Enterprise tier
    if (price.includes("from")) {
      const amount = Number.parseInt(price.replace(/\D/g, ""));
      return `from $${amount * 10}`;
    }
    const amount = Number.parseInt(price.replace(/\D/g, ""));
    return `$${amount * 10}`;
  };

  // const { data: subscription } = useCurrentPlanWithStatus();
  const { data: _sub } = useCurrentPlanWithStatus();

  // Check if this tier is the user's current plan
  const isCurrentPlan = _sub?.plans?.plans?.some((plan: string) =>
    plan.startsWith(tier.id),
  );

  return (
    <div className={cn("border-gray-200 flex flex-col relative", className)}>
      {isCurrentPlan && (
        <div className="absolute top-4 right-4">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const res = await callServerPromise(
                api({
                  url: `platform/stripe/dashboard?redirect_url=${encodeURIComponent(
                    window.location.href,
                  )}`,
                }),
                {
                  loadingText: "Redirecting to Stripe...",
                },
              );
              window.open(res.url, "_blank");
            }}
          >
            Manage Subscription
          </Button>
        </div>
      )}
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col p-4">
          <div>
            {tier.name !== "Free" && (
              <h3 className="font-bold text-lg">{tier.name}</h3>
            )}
            <div className="flex items-baseline mt-1">
              <AnimatePresence mode="wait">
                <motion.span
                  key={isYearly ? "yearly" : "monthly"}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="font-bold text-3xl"
                >
                  {getMonthlyPrice(tier.priceMonthly)}
                </motion.span>
              </AnimatePresence>
              {tier.priceMonthly !== "Free" &&
                !tier.priceMonthly.includes("from") && (
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={isYearly ? "yearly" : "monthly"}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="ml-1 text-gray-500 dark:text-zinc-400"
                    >
                      /month
                    </motion.span>
                  </AnimatePresence>
                )}
            </div>
            {isYearly && tier.priceMonthly !== "Free" && (
              <div className="text-sm text-gray-500 mt-1 dark:text-zinc-400">
                Billed yearly: {getYearlyTotal(tier.priceMonthly)}{" "}
                <span className="ml-1 text-green-600">(2 months free)</span>
              </div>
            )}
            <p className="mt-2 text-sm text-gray-600 dark:text-zinc-400">
              {tier.description}
            </p>
          </div>

          <ul className="mt-4 space-y-1.5 text-xs">
            {/* Include message for higher tiers */}
            {renderIncludesMessage() && (
              <li className="flex items-center">
                <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                <span className="ml-2 font-medium text-gray-900 dark:text-zinc-200">
                  {renderIncludesMessage()}
                </span>
              </li>
            )}

            {/* Show only available features */}
            {tier.name === "Free" ? (
              <li className="flex items-center">
                <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                <span className="ml-2 text-gray-600 dark:text-zinc-400">
                  Run public workflow{" "}
                  <Badge
                    variant="secondary"
                    className="ml-1 rounded-[4px] text-[10px]"
                  >
                    Max 1 concurrent run
                  </Badge>
                </span>
              </li>
            ) : (
              getAvailableFeatures(tier.name)
                .filter((feature) => {
                  const value = feature.tiers[tier.name as keyof TierFeature];
                  const prevTierValue =
                    tier.name === "Creator"
                      ? feature.tiers.Basic
                      : tier.name === "Deployment"
                        ? showCreatorTier
                          ? feature.tiers.Creator
                          : feature.tiers.Basic
                        : tier.name === "Business"
                          ? showDeploymentTier
                            ? feature.tiers.Deployment
                            : showCreatorTier
                              ? feature.tiers.Creator
                              : feature.tiers.Basic
                          : null;

                  if (tier.name === "Business") {
                    if (
                      !showDeploymentTier &&
                      feature.tiers.Deployment &&
                      JSON.stringify(feature.tiers.Deployment) !==
                        JSON.stringify(value) &&
                      JSON.stringify(feature.tiers.Deployment) !==
                        JSON.stringify(prevTierValue)
                    ) {
                      return true;
                    }

                    if (
                      !showCreatorTier &&
                      feature.tiers.Creator &&
                      JSON.stringify(feature.tiers.Creator) !==
                        JSON.stringify(value) &&
                      JSON.stringify(feature.tiers.Creator) !==
                        JSON.stringify(prevTierValue)
                    ) {
                      return true;
                    }
                  }

                  return (
                    JSON.stringify(value) !== JSON.stringify(prevTierValue)
                  );
                })
                .map((feature) => {
                  const value = feature.tiers[tier.name as keyof TierFeature];
                  return (
                    <li key={feature.name} className="flex items-center">
                      <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                      <span className="ml-2 text-gray-600 dark:text-zinc-400">
                        {feature.name}
                        {typeof value === "string" && (
                          <Badge
                            variant="secondary"
                            className="ml-1 rounded-[4px] text-[10px]"
                          >
                            {value}
                          </Badge>
                        )}
                      </span>
                    </li>
                  );
                })
            )}
          </ul>

          {tier.name === "Free" && <div className="h-2" />}
        </div>

        {tier.name !== "Free" && (
          <div className="mt-4">
            {tier.name === "Business" ? (
              <div className="grid grid-cols-2 gap-px">
                <UpgradeButton
                  plan={`${tier.id}_${isYearly ? "yearly" : "monthly"}`}
                  href={`/checkout?plan=${tier.id}`}
                  plans={plans}
                  className="border-b-0 border-t border-x-0 hover:bg-gray-900 hover:text-white p-6 rounded-none text-gray-900 transition-colors w-full dark:hover:bg-zinc-700 dark:hover:text-zinc-100 dark:text-gray-300"
                  trial={false}
                  allowCoupon={true}
                  data={{
                    tier: tier.name,
                    price: isYearly ? tier.priceYearly : tier.priceMonthly,
                    billing: isYearly ? "yearly" : "monthly",
                  }}
                  subscription={_sub?.plans?.autumn_data}
                />
                <Button
                  asChild
                  className="border-b-0 border-t border-x-0 hover:bg-purple-900 hover:text-white p-6 rounded-none text-gray-900 transition-colors w-full dark:hover:bg-purple-900/50 dark:hover:text-zinc-100 dark:text-purple-400"
                  variant="outline"
                >
                  <Link to="/onboarding-call" target="_blank">
                    Call with us
                    <ExternalLink className="h-4 ml-2 w-4" />
                  </Link>
                </Button>
              </div>
            ) : tier.name === "Enterprise" ? (
              <div className="grid grid-cols-1 gap-px">
                <Button
                  asChild
                  className="border-b-0 border-t border-x-0 hover:bg-indigo-900 hover:text-white p-6 rounded-none text-gray-900 transition-colors w-full dark:hover:bg-indigo-900/50 dark:hover:text-zinc-100 dark:text-indigo-400"
                  variant="outline"
                >
                  <Link to="/onboarding-call" target="_blank">
                    Call with us
                    <ExternalLink className="h-4 ml-2 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <UpgradeButton
                plan={`${tier.id}_${isYearly ? "yearly" : "monthly"}`}
                href={`/checkout?plan=${tier.id}`}
                plans={plans}
                className="border-b-0 border-t border-x-0 hover:bg-gray-900 hover:text-white p-6 rounded-none text-gray-900 transition-colors w-full dark:hover:bg-zinc-700 dark:hover:text-zinc-100 dark:text-zinc-200"
                trial={false}
                allowCoupon={true}
                data={{
                  tier: tier.name,
                  price: isYearly ? tier.priceYearly : tier.priceMonthly,
                  billing: isYearly ? "yearly" : "monthly",
                }}
                subscription={_sub?.plans?.autumn_data}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function GPUPricingTable() {
  const [activeTab, setActiveTab] = useState<"per_sec" | "per_hour">(
    "per_hour",
  );
  const { data: gpuPricing, isLoading: gpuPricingLoading } = useGPUPricing();

  return (
    <div className="mt-16 mx-auto max-w-5xl">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg dark:bg-zinc-900 dark:border-zinc-700">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-2xl text-gray-900 dark:text-zinc-200">
                GPU Pricing
              </h2>
              <p className="mt-1 text-gray-500 text-sm dark:text-zinc-400">
                Transparent, usage-based pricing for all GPU types
              </p>
            </div>
            <motion.div className="inline-flex items-center rounded-full bg-white/95 p-0.5 shadow-md ring-1 ring-gray-200/50 backdrop-blur-sm dark:bg-zinc-900 dark:ring-zinc-700/50">
              <Button
                variant="ghost"
                onClick={() => setActiveTab("per_sec")}
                className={cn(
                  "font-medium px-4 py-1.5 rounded-full text-sm transition-all",
                  activeTab === "per_sec"
                    ? "bg-gradient-to-b from-white to-gray-100 shadow-sm ring-1 ring-gray-200/50 dark:from-zinc-800 dark:to-zinc-700 dark:ring-zinc-700/50"
                    : "hover:bg-gray-100 text-gray-600 dark:text-zinc-400 dark:hover:bg-zinc-700/50",
                )}
              >
                Per second
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab("per_hour")}
                className={cn(
                  "font-medium px-4 py-1.5 rounded-full text-sm transition-all",
                  activeTab === "per_hour"
                    ? "bg-gradient-to-b from-white to-gray-100 shadow-sm ring-1 ring-gray-200/50 dark:from-zinc-800 dark:to-zinc-700 dark:ring-zinc-700/50"
                    : "hover:bg-gray-100 text-gray-600 dark:text-zinc-400 dark:hover:bg-zinc-700/50",
                )}
              >
                Per hour
              </Button>
            </motion.div>
          </div>
          <div className="relative w-full overflow-hidden">
            <Table>
              <TableBody>
                {gpuPricingLoading
                  ? // Skeleton loading state
                    Array.from({ length: 6 }).map((_, index) => (
                      <TableRow key={index} className="border-0">
                        <TableCell className="border-0 font-medium px-2 py-1 text-xs">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-20" />
                          </div>
                        </TableCell>
                        <TableCell className="border-0 px-2 py-1 text-right">
                          <Skeleton className="h-4 w-16 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  : Object.entries(gpuPricing || {}).map(([gpu, price]) => (
                      <TableRow key={gpu} className="border-0">
                        <TableCell className="border-0 font-medium px-2 py-1 text-xs">
                          <div className="flex items-center gap-2">
                            {gpu}
                            {gpu === "L40S" && (
                              <Badge
                                variant="secondary"
                                className="bg-blue-50 h-4 px-1 py-0 text-[10px] text-blue-700 dark:bg-blue-900/50 dark:text-blue-400"
                              >
                                NEW
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="border-0 px-2 py-1 text-right">
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={activeTab}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className="font-medium inline-block"
                            >
                              {activeTab === "per_sec" ? (
                                <span className="text-xs">
                                  ${price as number}
                                  <span className="ml-1 text-gray-500">
                                    / sec
                                  </span>
                                </span>
                              ) : (
                                <span className="text-xs">
                                  ${((price as number) * 60 * 60).toFixed(2)}
                                  <span className="ml-1 text-gray-500">
                                    / hour
                                  </span>
                                </span>
                              )}
                            </motion.div>
                          </AnimatePresence>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}

function RouteComponent() {
  return <PricingPage />;
}

export function PricingPage() {
  const { data: _sub, isLoading } = useCurrentPlanWithStatus();
  const [isYearly, setIsYearly] = useState(false);

  // Determine user's current plan
  const userPlans = _sub?.plans?.plans || [];
  const isOnCreatorPlan = userPlans.some((plan: string) =>
    plan.startsWith("creator"),
  );
  const isOnDeploymentPlan = userPlans.some((plan: string) =>
    plan.startsWith("deployment"),
  );
  const isOnBusinessPlan = userPlans.some((plan: string) =>
    plan.startsWith("business"),
  );

  const filteredTiers = tiers.filter((tier) => {
    if (tier.id === "free") return true;

    if (tier.id === "business") return true;

    if (tier.id === "large_enterprise") return true;

    if (tier.id === "creator" || tier.id === "deployment") {
      if (isOnCreatorPlan || isOnDeploymentPlan) return true;

      if (userPlans.length === 0 || isOnBusinessPlan) return false;

      return true;
    }

    return true;
  });

  const isCancelled = _sub?.sub?.cancel_at_period_end;

  return (
    <div className="min-h-screen">
      <div className="px-4 mx-auto pb-20">
        {/* Header */}
        <div className="mx-auto max-w-5xl py-12">
          <h1 className="font-bold sm:text-5xl text-4xl text-gray-900 tracking-tight dark:text-zinc-200">
            Power your teams with Cloud Hosted ComfyUI
          </h1>
          <p className="leading-8 mt-4 text-lg text-gray-600 dark:text-zinc-400">
            We work closely with you to bring your workflow to your teams.
          </p>
        </div>

        {/* Pricing Section */}
        <div className="relative mx-auto max-w-5xl">
          {isCancelled && (
            <div className="py-6 px-4 bg-yellow-50 border-b border-yellow-200 w-full">
              <div className="flex items-start justify-between w-full max-w-5xl mx-auto">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.485 2.495c.873-1.562 3.157-1.562 4.03 0l6.28 11.25c.873 1.562-.217 3.505-2.015 3.505H4.22c-1.798 0-2.888-1.943-2.015-3.505l6.28-11.25zm1.515 4.755v4h-1v-4h1zm-1 6v-1h1v1h-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Plan Cancellation Notice
                    </h3>
                    <div className="mt-1 text-sm text-yellow-700">
                      Your plan will be cancelled at the end of the billing
                      period.
                    </div>
                  </div>
                </div>
                <UpgradeButton
                  plan={_sub?.sub?.plan}
                  href={`/checkout?plan=${_sub?.sub?.plan}`}
                  plans={_sub?.plans?.plans ?? []}
                  className="ml-8 flex-shrink-0"
                />
              </div>
            </div>
          )}
          {/* Billing period toggle - Positioned on top of pricing cards */}
          <div className="absolute -top-6 left-1/2 z-20 -translate-x-1/2">
            <motion.div
              className="inline-flex items-center rounded-full bg-white/95 p-0.5 shadow-md ring-1 ring-gray-200/50 backdrop-blur-sm dark:bg-zinc-900/95 dark:ring-zinc-700/50"
              layout
            >
              <motion.div layout className="relative">
                <Button
                  variant="ghost"
                  onClick={() => setIsYearly(false)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                    !isYearly
                      ? "bg-gradient-to-b from-white to-gray-100 shadow-sm ring-1 ring-gray-200/50 dark:from-zinc-800 dark:to-zinc-700 dark:ring-zinc-700/50 dark:text-zinc-100"
                      : "text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-700/50",
                  )}
                >
                  Monthly
                </Button>
              </motion.div>
              <motion.div className="relative">
                <Button
                  variant="ghost"
                  onClick={() => setIsYearly(true)}
                  className={cn(
                    "relative rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                    isYearly
                      ? "bg-gradient-to-b from-white to-gray-100 shadow-sm ring-1 ring-gray-200/50 dark:from-zinc-800 dark:to-zinc-700 dark:ring-zinc-700/50 dark:text-zinc-100"
                      : "text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-700/50",
                  )}
                >
                  Yearly
                  <AnimatePresence mode="wait">
                    <motion.div
                      className="inline-flex items-center overflow-hidden"
                      initial={{ width: 0, marginLeft: 0 }}
                      animate={{ width: "auto", marginLeft: "0.5rem" }}
                      exit={{ width: 0, marginLeft: 0 }}
                      transition={{
                        duration: 0.2,
                        ease: "easeInOut",
                      }}
                    >
                      <motion.span
                        className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-600 whitespace-nowrap dark:bg-green-900/80 dark:text-green-300"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                          duration: 0.1,
                          ease: "easeInOut",
                        }}
                      >
                        2 months free
                      </motion.span>
                    </motion.div>
                  </AnimatePresence>
                </Button>
              </motion.div>
            </motion.div>
          </div>

          {/* Pricing Cards */}
          <div className="relative z-10 overflow-hidden rounded-sm shadow-lg dark:shadow-2xl dark:shadow-zinc-900">
            {/* Free Tier */}
            <div className="relative z-10">
              <div>
                {filteredTiers.find((tier) => tier.id === "free") && (
                  <PricingTier
                    tier={filteredTiers.find((tier) => tier.id === "free")!}
                    isLoading={isLoading}
                    plans={_sub?.plans?.plans ?? []}
                    className="rounded-t-sm border bg-gradient-to-bl from-gray-50/10 via-gray-50/80 to-gray-100 dark:border-zinc-700 dark:from-zinc-800/10 dark:via-zinc-800/80 dark:to-zinc-700"
                    isYearly={isYearly}
                    showCreatorTier={filteredTiers.some(
                      (tier) => tier.id === "creator",
                    )}
                    showDeploymentTier={filteredTiers.some(
                      (tier) => tier.id === "deployment",
                    )}
                  />
                )}
              </div>

              {/* Creator and Deployment Tiers */}
              {(filteredTiers.some((tier) => tier.id === "creator") ||
                filteredTiers.some((tier) => tier.id === "deployment")) && (
                <div
                  className={cn(
                    "grid border border-gray-200 border-t-0 dark:border-zinc-700",
                    filteredTiers.some((tier) => tier.id === "creator") &&
                      filteredTiers.some((tier) => tier.id === "deployment")
                      ? "grid-cols-1 lg:grid-cols-2"
                      : "grid-cols-1",
                  )}
                >
                  {filteredTiers.find((tier) => tier.id === "creator") && (
                    <PricingTier
                      tier={
                        filteredTiers.find((tier) => tier.id === "creator")!
                      }
                      isLoading={isLoading}
                      plans={_sub?.plans?.plans ?? []}
                      className={cn(
                        "bg-gradient-to-bl from-amber-50/10 via-amber-50/80 to-amber-100 dark:from-amber-900/10 dark:via-amber-900/30 dark:to-amber-800/50",
                        filteredTiers.some((tier) => tier.id === "deployment")
                          ? "lg:border-r dark:lg:border-zinc-700"
                          : "",
                      )}
                      isYearly={isYearly}
                      showCreatorTier={filteredTiers.some(
                        (tier) => tier.id === "creator",
                      )}
                      showDeploymentTier={filteredTiers.some(
                        (tier) => tier.id === "deployment",
                      )}
                    />
                  )}
                  {filteredTiers.find((tier) => tier.id === "deployment") && (
                    <PricingTier
                      tier={
                        filteredTiers.find((tier) => tier.id === "deployment")!
                      }
                      isLoading={isLoading}
                      plans={_sub?.plans?.plans ?? []}
                      className="bg-gradient-to-bl from-blue-50/10 via-blue-50/80 to-blue-100 dark:from-blue-900/10 dark:via-blue-900/30 dark:to-blue-800/50"
                      isYearly={isYearly}
                      showCreatorTier={filteredTiers.some(
                        (tier) => tier.id === "creator",
                      )}
                      showDeploymentTier={filteredTiers.some(
                        (tier) => tier.id === "deployment",
                      )}
                    />
                  )}
                </div>
              )}

              {/* Business Tier */}
              <div>
                {filteredTiers.find((tier) => tier.id === "business") && (
                  <PricingTier
                    tier={filteredTiers.find((tier) => tier.id === "business")!}
                    isLoading={isLoading}
                    plans={_sub?.plans?.plans ?? []}
                    className="border border-t-0 bg-gradient-to-bl from-purple-50/10 via-purple-50/80 to-purple-100 dark:border-zinc-700 dark:from-purple-900/10 dark:via-purple-900/30 dark:to-purple-800/50"
                    isYearly={isYearly}
                    showCreatorTier={filteredTiers.some(
                      (tier) => tier.id === "creator",
                    )}
                    showDeploymentTier={filteredTiers.some(
                      (tier) => tier.id === "deployment",
                    )}
                  />
                )}
              </div>

              {/* Enterprise Tier */}
              <div>
                {filteredTiers.find(
                  (tier) => tier.id === "large_enterprise",
                ) && (
                  <PricingTier
                    tier={
                      filteredTiers.find(
                        (tier) => tier.id === "large_enterprise",
                      )!
                    }
                    isLoading={isLoading}
                    plans={_sub?.plans?.plans ?? []}
                    className="overflow-hidden rounded-b-sm border border-t-0 bg-gradient-to-bl from-indigo-50/10 via-indigo-50/80 to-indigo-100 dark:border-zinc-700 dark:from-indigo-900/10 dark:via-indigo-900/30 dark:to-indigo-800/50"
                    isYearly={isYearly}
                    showCreatorTier={filteredTiers.some(
                      (tier) => tier.id === "creator",
                    )}
                    showDeploymentTier={filteredTiers.some(
                      (tier) => tier.id === "deployment",
                    )}
                  />
                )}
              </div>
            </div>

            <div className="absolute inset-0 h-full w-full bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem] bg-white dark:bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] dark:bg-zinc-900" />
          </div>
        </div>

        {/* GPU Pricing Table */}
        <GPUPricingTable />
      </div>
    </div>
  );
}
