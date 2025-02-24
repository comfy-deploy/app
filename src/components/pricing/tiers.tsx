import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { satisfies } from "semver";

export const FREE_TIER = {
  name: "Basic",
  id: "basic",
  startingAt: false,
  href: "/api/stripe/checkout?plan=basic",
  priceMonthly: "Free",
  description: "Explore Comfy",
  mostPopular: false,
} satisfies Tier;

export const PRO_TIER = {
  name: "Pro",
  id: "pro",
  startingAt: false,
  href: "/api/stripe/checkout?plan=pro",
  priceMonthly: "$20",
  description: (
    <Tooltip>
      <TooltipTrigger className="flex items-center justify-center gap-2">
        Early Adopter Plan <Info size={14} />
      </TooltipTrigger>
      <TooltipContent className="w-[300px]">
        <span className="font-bold">Notice</span>
        <br />
        Congrats, you are on one of our early adopter plan.
        <br />
        <br />
        We are no longer offering the Pro plan for new users due to support
        overhead and we wanted to focus on the production use case.
        <br />
        <br />
        You get to keep the pro plan for now, cause you are early!
        <br />
      </TooltipContent>
    </Tooltip>
  ),
  mostPopular: false,
} satisfies Tier;

export const BUSSINESS_TIER_OLD = {
  name: "Deployment",
  id: "deployment",
  startingAt: false,
  href: "/api/stripe/checkout?plan=deployment",
  priceMonthly: "$100",
  // description: "Scale your product",
  mostPopular: true,
  description: (
    <Tooltip>
      <TooltipTrigger className="flex items-center justify-center gap-2">
        Early Adopter Plan <Info size={14} />
      </TooltipTrigger>
      <TooltipContent className="w-[300px]">
        <span className="font-bold">Notice</span>
        <br />
        Congrats, you are on one of our early adopter plan.
        <br />
        <br />
        We are no longer offering this Business plan for new users due to
        support overhead and we wanted to focus on the production use case.
        <br />
        <br />
        You get to keep the Business plan for now, cause you are early!
        <br />
      </TooltipContent>
    </Tooltip>
  ),
} satisfies Tier;

export const BUSSINESS_TIER = {
  name: "Business",
  id: "business",
  startingAt: false,
  href: "/api/stripe/checkout?plan=business",
  priceMonthly: "$998",
  description: "Scale your product",
  mostPopular: true,
} satisfies Tier;

export const ENTERPRISE_TIER = {
  name: "Enterprise",
  id: "large_enterprise",
  startingAt: false,
  href: "https://cal.com/team/comfy-deploy",
  priceMonthly: "Custom",
  description: "Custom Solutions",
  mostPopular: false,
} satisfies Tier;

export type Tier = {
  name: string;
  id: string;
  startingAt: boolean;
  href: string;
  priceMonthly: string;
  description: ReactNode;
  mostPopular: boolean;
};

export const tiersNew_2 = [
  FREE_TIER,
  // PRO_TIER,
  ENTERPRISE_TIER,
] satisfies Tier[];

export const tiersNew = [
  FREE_TIER,
  // PRO_TIER,
  BUSSINESS_TIER,
  ENTERPRISE_TIER,
] satisfies Tier[];

export const tiersOld_2 = [
  FREE_TIER,
  // PRO_TIER,
  BUSSINESS_TIER_OLD,
  ENTERPRISE_TIER,
] satisfies Tier[];

export const tiersOld = [
  FREE_TIER,
  PRO_TIER,
  // BUSSINESS_TIER,
  ENTERPRISE_TIER,
] satisfies Tier[];
