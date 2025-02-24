"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Check, ExternalLink, Info, LinkIcon, Minus } from "lucide-react";

import { Modal } from "@/components/auto-form/auto-form-dialog";
import {
  GPUPriceSimulator,
  useGPUPricing,
} from "@/components/pricing/GPUPriceSimulator";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BlueprintOutline } from "@/components/ui/custom/blueprint-outline";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCurrentPlan,
  useCurrentPlanWithStatus,
} from "@/hooks/use-current-plan";
import {
  Link,
  useMatch,
  useMatchRoute,
  useSearch,
} from "@tanstack/react-router";
import { Fragment, type JSX, useEffect, useState } from "react";
import { LoadingIcon } from "../loading-icon";
import { DefaultFeatureLimits } from "./DefaultFeatureLimits";
import { UpgradeButton } from "./plan-button";
import { type Tier, tiersNew, tiersNew_2, tiersOld, tiersOld_2 } from "./tiers";

type TierFeature = {
  Basic?: string | JSX.Element | boolean | number;
  Pro?: string | JSX.Element | boolean | number;
  Business?: string | JSX.Element | boolean | number;
  ["Deployment"]?: string | JSX.Element | boolean | number;
  Enterprise?: string | JSX.Element | boolean | number;
};

type Feature = {
  name: string;
  tiers: TierFeature;
};

type Section = {
  name: string;
  features: Feature[];
};

const sections: Section[] = [
  {
    name: "Features",
    features: [
      {
        name: "GPU",
        tiers: {
          Basic: "T4, L4, A10G",
          Pro: "T4, L4, A10G",
          Business: "T4, L4, A10G, L40S, A100, A100-80GB, H100",
          ["Deployment"]: "T4, L4, A10G, L40S, A100, A100-80GB, H100",
          Enterprise: "T4, L4, A10G, L40S, A100, A100-80GB, H100",
        },
      },
      {
        name: "Compute Credit",
        tiers: {
          Basic: (
            <Tooltip>
              <TooltipTrigger className="flex items-center justify-center gap-2">
                $5 credit + usage <Info size={14} />
              </TooltipTrigger>
              <TooltipContent>See the GPU pricing table below</TooltipContent>
            </Tooltip>
          ),
          Pro: (
            <Tooltip>
              <TooltipTrigger className="flex items-center justify-center gap-2">
                $5 credit + usage <Info size={14} />
              </TooltipTrigger>
              <TooltipContent>See the GPU pricing table below</TooltipContent>
            </Tooltip>
          ),
          ["Deployment"]: (
            <Tooltip>
              <TooltipTrigger className="flex items-center justify-center gap-2">
                $5 credit + usage <Info size={14} />
              </TooltipTrigger>
              <TooltipContent>See the GPU pricing table below</TooltipContent>
            </Tooltip>
          ),
          Business: (
            <Tooltip>
              <TooltipTrigger className="flex items-center justify-center gap-2">
                $5 credit + usage <Info size={14} />
              </TooltipTrigger>
              <TooltipContent>See the GPU pricing table below</TooltipContent>
            </Tooltip>
          ),
          Enterprise: (
            <Tooltip>
              <TooltipTrigger className="flex items-center justify-center gap-2">
                Custom Usage <Info size={14} />
              </TooltipTrigger>
              <TooltipContent>See the GPU pricing table below</TooltipContent>
            </Tooltip>
          ),
        },
      },
      {
        name: "Workflows",
        tiers: {
          Basic: DefaultFeatureLimits.free.workflow.toString(),
          Pro: DefaultFeatureLimits.pro.workflow.toString(),
          ["Deployment"]: DefaultFeatureLimits.creator.workflow.toString(),
          Business: DefaultFeatureLimits.business.workflow.toString(),
          Enterprise: "Custom",
        },
      },
      {
        name: "Serverless Machines",
        tiers: {
          Basic: DefaultFeatureLimits.free.machine.toString(),
          Pro: DefaultFeatureLimits.pro.machine.toString(),
          ["Deployment"]: DefaultFeatureLimits.creator.machine.toString(),
          Business: DefaultFeatureLimits.business.machine.toString(),
          Enterprise: "Custom",
        },
      },
      {
        name: "GPU Concurrency (Parallel GPU)",
        tiers: {
          Basic: 10,
          Pro: 10,
          ["Deployment"]: 10,
          Business: "Custom",
          Enterprise: "Custom",
        },
      },
      {
        name: "Any Custom Nodes",
        tiers: {
          Basic: "Unlimited",
          Pro: "Unlimited",
          ["Deployment"]: "Unlimited",
          Business: "Unlimited",
          Enterprise: "Custom",
        },
      },
      {
        name: "Any Models",
        tiers: {
          Basic: "Public models only",
          Pro: "Unlimited",
          ["Deployment"]: "Unlimited",
          Business: "Unlimited",
          Enterprise: "Custom",
        },
      },
      {
        name: "Outputs Storage",
        tiers: {
          Basic: "1 GB",
          Pro: "Unlimited",
          ["Deployment"]: "Unlimited",
          Business: "100 GB",
          Enterprise: "Custom",
        },
      },
      {
        name: "Team seat",
        tiers: {
          Basic: false,
          Pro: true,
          ["Deployment"]: "3",
          Business: "Custom",
          Enterprise: "Custom",
        },
      },
      {
        name: "White glove Onboarding",
        tiers: {
          Basic: false,
          Pro: true,
          ["Deployment"]: true,
          Business: true,
          Enterprise: true,
        },
      },
      {
        name: "Community Support",
        tiers: {
          Basic: true,
          Pro: true,
          ["Deployment"]: true,
          Business: true,
          Enterprise: true,
        },
      },
      {
        name: "Dedicated Support",
        tiers: {
          Basic: false,
          Pro: false,
          ["Deployment"]: false,
          Business: true,
          Enterprise: true,
        },
      },
      // {
      //   name: "Private Model Hosting",
      //   tiers: {
      //     Basic: false,
      //     Pro: false,
      //     ["Deployment"]: true,
      //     Business: true,
      //     Enterprise: true,
      //   },
      // },
      {
        name: "API",
        tiers: {
          Basic: true,
          Pro: true,
          ["Deployment"]: true,
          Business: true,
          Enterprise: true,
        },
      },
      {
        name: "SDKs (TS, Python, Ruby)",
        tiers: {
          Basic: true,
          Pro: true,
          ["Deployment"]: true,
          Business: true,
          Enterprise: true,
        },
      },
      // {
      //   name: "Workspace Machine",
      //   tiers: {
      //     Pro: false,
      //     Enterprise: "1",
      //     Super_Enterprise: false,
      //   },
      // },
      // {
      //   name: "Public Discord Group",
      //   tiers: {
      //     Basic: true,
      //     Pro: true,
      //     Business: true,
      //     Enterprise: true,
      //   },
      // },
      // {
      //   name: "Private Discord Group",
      //   tiers: {
      //     Basic: false,
      //     Pro: false,
      //     Business: true,
      //     Enterprise: true,
      //   },
      // },
      {
        name: "Custom S3 Integration",
        tiers: {
          Basic: false,
          Pro: false,
          ["Deployment"]: false,
          Business: false,
          Enterprise: true,
        },
      },
      // {
      //   name: "Dedicated servers",
      //   tiers: {
      //     // Pro: "-",
      //     // Enterprise: "Coming Soon",
      //     Enterprise: "Talk with us",
      //   },
      // },
      // {
      //   name: "Custom Integrations",
      //   tiers: {
      //     Basic: false,
      //     Pro: false,
      //     Business: false,
      //     Enterprise: "Talk with us",
      //   },
      // },
      // {
      //   name: "On Premise Hosting",
      //   tiers: {
      //     Basic: false,
      //     Pro: false,
      //     Business: false,
      //     Enterprise: "Talk with us",
      //   },
      // },
    ],
  },
];

export function PricingList(props: { trial?: boolean }) {
  const { data: _sub, isLoading } = useCurrentPlanWithStatus();

  const [plans, setPlans] = useState<any[]>([]);

  const search = useSearch({
    from: "/pricing",
  });

  const { data: gpuPricing, isLoading: gpuPricingLoading } = useGPUPricing();

  const ready = search?.ready;
  const targetPlan = search?.plan;

  const plansMapping = _sub?.plans?.plans
    ? _sub?.plans?.plans?.map((plan: string) => {
        if (plan.includes("monthly")) {
          return plan.replace("_monthly", "");
        }
        if (plan.includes("yearly")) {
          return plan.replace("_yearly", "");
        }
        return plan;
      })
    : [];

  useEffect(() => {
    if (!ready && plansMapping) {
      setPlans(plansMapping ?? []);
    }

    if (ready) {
      setPlans([]);
    }
  }, [_sub, ready]);

  const isOldProPlan = plans.some((plan) =>
    ["pro", "creator_legacy_monthly"].includes(plan),
  ); // $20
  const isOldBusinessPlan = plans.some((plan) =>
    [
      "creator",
      "creator_monthly",
      "creator_yearly",
      "deployment",
      "deployment_yearly",
      "deployment_monthly",
    ].includes(plan),
  ); // $100
  const isNewBusinessPlan = plans.some((plan) =>
    ["business", "business_monthly", "business_yearly"].includes(plan),
  ); // $998

  // isOldBusinessPlan = true;

  let tiers: Tier[] = tiersNew_2;
  if (isOldProPlan) {
    tiers = tiersOld;
  } else if (isOldBusinessPlan) {
    tiers = tiersOld_2;
  } else if (isNewBusinessPlan) {
    tiers = tiersNew;
  } else if (ready) {
    tiers = tiersNew;
  }

  if (targetPlan === "deployment" && ready) {
    tiers = tiersOld_2;
  }

  // isOldProPlan = true;
  // tiers = tiersOld;

  if (gpuPricingLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <LoadingIcon />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {process.env.NODE_ENV === "development" && (
        <Card className="mx-auto mb-4 w-fit px-4 py-2">
          <div className="flex items-center gap-4">
            <span className="font-semibold">Debug Plan:</span>
            <select
              className="rounded border px-2 py-1"
              value={
                isOldProPlan
                  ? "pro"
                  : isOldBusinessPlan
                    ? "creator"
                    : isNewBusinessPlan
                      ? "business"
                      : "basic"
              }
              onChange={(e) => {
                const value = e.target.value;
                setPlans([value]);
              }}
            >
              <option value="basic">Basic</option>
              <option value="pro">Pro (Old - $20)</option>
              <option value="creator">Creator (Old - $100)</option>
              <option value="business">Business (New - $998)</option>
            </select>
          </div>
        </Card>
      )}
      <Card className="mx-auto mb-4 flex w-fit flex-col items-center justify-center gap-4 px-4 py-4 font-semibold md:flex-row md:py-2">
        <span>Ready to get your workflow running in an hour?</span>
        <Button asChild>
          <Link
            // href="https://cal.com/forms/2007157f-bc77-478f-8604-2029f58b364a?solution=ComfyDeploy%20Business"
            // href="/workflows"
            href="/onboarding-call"
            target="_blank"
          >
            Book an onboarding call with us
          </Link>
        </Button>
      </Card>

      {/* xs to lg */}
      <div className="mx-auto max-w-md space-y-8 sm:mt-16 lg:hidden">
        {tiers.map((tier) => (
          <section
            key={tier.id}
            className={cn(
              tier.mostPopular
                ? "rounded-xl bg-gray-400/5 ring-1 ring-gray-200 ring-inset"
                : "",
              "p-8",
            )}
          >
            <h3
              id={tier.id}
              className="font-semibold text-gray-900 text-sm leading-6"
            >
              {tier.name}
            </h3>
            <div className="mt-2 flex items-baseline gap-x-1 text-gray-900">
              {tier.startingAt && (
                <span className="font-semibold text-sm">starting</span>
              )}
              <span className="font-bold text-4xl">{tier.priceMonthly}</span>
              <span className="font-semibold text-sm">/month + usage</span>
            </div>
            <br />
            <div className="font-semibold text-xl">{tier.description}</div>
            <UpgradeButton
              data={tier}
              trial={props.trial}
              className="mt-2 w-full"
              plan={tier.id as any}
              plans={plansMapping}
              href={`/api/stripe/checkout?plan=${tier.id}`}
              allowCoupon
            />
            {plansMapping.includes(tier.id as any) &&
              _sub?.plans?.cancel_at_period_end && (
                <div className="mt-2 text-muted-foreground text-sm">
                  Cancelling at the end of your current billing period.
                </div>
              )}
            {/* <a
              onClick={() => handlePricingOptionClick(tier)}
              href={getHrefFromTier(tier)}
              aria-describedby={tier.id}
              className={cn(
                tier.mostPopular
                  ? "bg-indigo-600 text-white hover:bg-indigo-500"
                  : "text-indigo-600 ring-1 ring-inset ring-indigo-200 hover:ring-indigo-300",
                "mt-8 block rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600",
              )}
            >
              {getNameFromTier(tier)}
            </a> */}
            <ul
              role="list"
              className="mt-10 space-y-4 text-gray-900 text-sm leading-6"
            >
              {sections.map((section) => (
                <li key={section.name}>
                  <ul role="list" className="space-y-4">
                    {section.features.map((feature) =>
                      feature.tiers[tier.name as keyof TierFeature] ? (
                        <li key={feature.name} className="flex gap-x-3">
                          <Check
                            className="h-6 w-5 flex-none text-indigo-600"
                            aria-hidden="true"
                          />
                          <span>
                            {feature.name}{" "}
                            {typeof feature.tiers[
                              tier.name as keyof TierFeature
                            ] === "string" ? (
                              <span className="text-gray-500 text-sm leading-6">
                                ({feature.tiers[tier.name as keyof TierFeature]}
                                )
                              </span>
                            ) : null}
                          </span>
                        </li>
                      ) : null,
                    )}
                  </ul>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* lg+ */}
      <div className="isolate hidden w-full rounded-lg lg:block">
        <div className="relative ">
          {/* {tiers.some((tier) => tier.mostPopular) || tiers.length == 1 ? (
            <div className="absolute inset-x-2 inset-y-0 -z-10 flex">
              <div
                className={cn("flex px-4")}
                aria-hidden="true"
                style={{
                  width: `calc(100% / ${tiers.length + 1})`,
                  marginLeft: `${
                    tiers.length > 1
                      ? (tiers.findIndex((tier) => tier.mostPopular) + 1) *
                        (isOldProPlan ? 25 : 25)
                      : 25
                  }%`,
                }}
              >
                <div className="w-full rounded-t-xl border-x border-t border-gray-900/10 bg-gray-400/5" />
              </div>
            </div>
          ) : null} */}
          <table className="table w-full table-fixed border-separate border-spacing-x-0 text-left">
            <caption className="sr-only">Pricing plan comparison</caption>
            <colgroup>
              {/* {tiers.length > 1 && (
                <>


                  {isOldProPlan && (
                    <>
                      <col className="w-1/4" />
                      <col className="w-1/4" />
                      <col className="w-1/4" />
                      <col className="w-1/4" />
                    </>
                  )}
                  {!isOldProPlan && (
                    <>
                      <col className="w-1/4" />
                      <col className="w-1/4" />
                      <col className="w-1/4" />
                      <col className="w-1/4" />
                    </>
                  )}
                </>
              )}
              {tiers.length == 1 && (
                <>
                  <col className="w-1/3" />
                  <col className="w-1/3" />
                  <col className="w-1/3" />
                </>
              )} */}

              {Array.from({ length: tiers.length + 1 }).map((_, idx) => (
                <col
                  key={idx}
                  // className={`w-1/${tiers.length}`}
                  style={{
                    width: `calc(100% / ${tiers.length})`,
                  }}
                />
              ))}
            </colgroup>
            <thead>
              <tr>
                <td />
                {tiers.map((tier) => (
                  <th
                    key={tier.id}
                    scope="col"
                    className="px-6 pt-6 xl:px-8 xl:pt-8"
                  >
                    <div className="font-semibold text-gray-900 text-sm leading-7">
                      {tier.name}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">
                  <span className="sr-only">Price</span>
                </th>
                {tiers.map((tier) => (
                  <td key={tier.id} className="px-10 pt-2">
                    <div className="flex flex-wrap items-baseline gap-x-1 text-gray-900">
                      {tier.startingAt && (
                        <>
                          <span className="w-full font-semibold text-sm">
                            starting
                          </span>
                          <br />
                        </>
                      )}
                      <span className="font-bold text-4xl">
                        {tier.priceMonthly}
                      </span>
                      <span className="font-semibold text-sm leading-6">
                        /month + usage
                      </span>
                    </div>
                    <br />
                    <div className="font-semibold text-md">
                      {tier.description}
                    </div>
                    <UpgradeButton
                      data={tier}
                      trial={props.trial}
                      className="mt-2 w-full"
                      plan={tier.id as any}
                      plans={plansMapping}
                      href={`/api/stripe/checkout?plan=${tier.id}`}
                      allowCoupon
                    />
                    {plansMapping.includes(tier.id as any) &&
                      _sub?.plans?.cancel_at_period_end && (
                        <div className="mt-2 text-muted-foreground text-sm">
                          Cancelling at the end of your current billing period.
                        </div>
                      )}
                  </td>
                ))}
              </tr>
              {sections.map((section, sectionIdx) => (
                <Fragment key={section.name}>
                  <tr>
                    <th
                      scope="colgroup"
                      colSpan={4}
                      className={cn(
                        sectionIdx === 0 ? "pt-4" : "pt-8",
                        "py-2 font-semibold text-gray-900 text-sm",
                      )}
                    >
                      {section.name}
                      <div className="absolute inset-x-2 mt-0 h-px bg-gray-900/10" />
                    </th>
                  </tr>
                  {section.features.map((feature) => (
                    <tr key={feature.name}>
                      <th
                        scope="row"
                        className="py-1 font-normal text-gray-900 text-sm leading-6"
                      >
                        {feature.name}
                        <div className="absolute inset-x-2 mt-1 h-px bg-gray-900/5" />
                      </th>
                      {tiers.map((tier) => (
                        <td key={tier.id} className="">
                          {typeof feature.tiers[
                            tier.name as keyof TierFeature
                          ] === "string" ||
                          typeof feature.tiers[
                            tier.name as keyof TierFeature
                          ] === "object" ? (
                            <div className="flex items-center justify-center text-center text-gray-500 text-sm leading-6">
                              {feature.tiers[tier.name as keyof TierFeature]}
                            </div>
                          ) : (
                            <>
                              {feature.tiers[tier.name as keyof TierFeature] ===
                              true ? (
                                <Check
                                  className="mx-auto h-5 w-5 text-indigo-600"
                                  aria-hidden="true"
                                />
                              ) : (
                                <Minus
                                  className="mx-auto h-5 w-5 text-gray-400"
                                  aria-hidden="true"
                                />
                              )}
                              <span className="sr-only">
                                {feature.tiers[
                                  tier.name as keyof TierFeature
                                ] === true
                                  ? "Included"
                                  : "Not included"}{" "}
                                in {tier.name}
                              </span>
                            </>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="relative mt-10 flex flex-col gap-2">
        <div className="flex-grow">
          <Tabs defaultValue="per_sec" className="w-full">
            <div className="flex justify-between">
              <CardHeader>
                <CardTitle id="gpu-price" className="flex items-center gap-2">
                  <a href="#gpu-price">
                    <LinkIcon size={18} />
                  </a>
                  GPU Price
                </CardTitle>
                <CardDescription>
                  See the GPU pricing table below
                </CardDescription>
              </CardHeader>
              <div className="flex flex-col items-end justify-center pr-2">
                <Modal
                  dialogClassName="sm:max-w-[600px]"
                  title="GPU Price Simulator"
                  description="Simulate the price of a GPU"
                  trigger={
                    <Button
                      Icon={ExternalLink}
                      iconPlacement="right"
                      variant={"link"}
                    >
                      GPU Simulator
                    </Button>
                  }
                >
                  <GPUPriceSimulator />
                </Modal>
                <TabsList>
                  <TabsTrigger value="per_sec">Per second</TabsTrigger>
                  <TabsTrigger value="per_hour">Per hour</TabsTrigger>
                </TabsList>
              </div>
            </div>
            <CardContent>
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow className="px-0">
                    <TableHead className="h-fit px-0">GPU</TableHead>
                    <TableHead className="h-fit px-0 text-right">
                      Cost
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TabsContent value="per_sec" asChild>
                    <>
                      {Object.entries(gpuPricing).map(([gpu, price]) => (
                        <TableRow key={gpu} className="h-fit p-1">
                          <TableCell className="h-fit p-1 ">{gpu}</TableCell>
                          <TableCell className="h-fit p-1 text-right">
                            ${price} /sec
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  </TabsContent>
                  <TabsContent value="per_hour" asChild>
                    <>
                      {Object.entries(gpuPricing).map(([gpu, price]) => (
                        <TableRow className="h-fit p-1" key={gpu}>
                          <TableCell className="h-fit p-1">{gpu}</TableCell>
                          <TableCell className="h-fit p-1 text-right">
                            ${(price * 60 * 60).toFixed(2)} /hour
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  </TabsContent>
                </TableBody>
              </Table>
            </CardContent>
          </Tabs>

          <BlueprintOutline />
        </div>
      </div>
    </div>
  );
}
