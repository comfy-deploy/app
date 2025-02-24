import { PricingList } from "@/components/pricing/PricingPlan";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/pricing")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    console.log(search);

    return {
      ready: search.ready as boolean | undefined,
      plan: search.plan as string | undefined,
    };
  },
});

function RouteComponent() {
  return (
    <div className="bg-white py-4">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* <h2 className="text-base font-semibold leading-7 text-indigo-600">
          Pricing
        </h2> */}
          <p className="mx-10 mt-2 font-bold text-4xl text-gray-900 tracking-tight sm:text-5xl">
            {/* Turn any workflow into API */}
            Power your teams with Cloud Hosted ComfyUI
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-gray-600 text-lg leading-8">
          We work closly to you to bring your workflow to your teams.
        </p>

        <div className="mt-10">
          <PricingList trial />
        </div>
      </div>
    </div>
  );
}
