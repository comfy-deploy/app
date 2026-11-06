"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useId, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDuration } from "@/lib/get-relative-time";
import { LoadingIcon } from "../loading-icon";

export function useGPUPricing() {
  const a = useQuery<any>({
    queryKey: ["platform", "gpu-pricing"],
  });
  return a;
}

export function useGPUCreditSchema() {
  return useQuery<{
    "gpu-credit": {
      name: string;
      display: { plural: string; singular: string };
      schema: Array<{
        credit_cost: number;
        metered_feature_id: string;
      }>;
    };
    "gpu-credit-topup": {
      name: string;
      display: { plural: string; singular: string };
      schema: Array<{
        credit_cost: number;
        metered_feature_id: string;
      }>;
    };
  }>({
    queryKey: ["platform", "gpu-credit-schema"],
  });
}

function PriceWithSavingsBadge({
  gpu,
  currentPrice,
  useTopupPricing,
  creditSchemaData,
}: {
  gpu: string;
  currentPrice: number;
  useTopupPricing: boolean;
  creditSchemaData:
    | {
        "gpu-credit": {
          name: string;
          display: { plural: string; singular: string };
          schema: Array<{
            credit_cost: number;
            metered_feature_id: string;
          }>;
        };
        "gpu-credit-topup": {
          name: string;
          display: { plural: string; singular: string };
          schema: Array<{
            credit_cost: number;
            metered_feature_id: string;
          }>;
        };
      }
    | null
    | undefined;
}) {
  // Get both pricing data for comparison
  const getPricingFromSchema = (
    schemaType: "gpu-credit" | "gpu-credit-topup",
  ) => {
    if (!creditSchemaData?.[schemaType]?.schema) return {};

    const pricing: Record<string, number> = {};
    creditSchemaData[schemaType].schema.forEach((item) => {
      const displayName = item.metered_feature_id
        .replace(/^gpu-/, "")
        .replace(/^cpu$/, "CPU")
        .toUpperCase();

      pricing[displayName] = item.credit_cost / 100;
    });

    return pricing;
  };

  const businessPricing = creditSchemaData
    ? getPricingFromSchema("gpu-credit")
    : null;
  const topupPricing = creditSchemaData
    ? getPricingFromSchema("gpu-credit-topup")
    : null;

  // Calculate savings if Business pricing is available and cheaper
  const businessPrice = businessPricing?.[gpu];
  const topupPrice = topupPricing?.[gpu];
  const hasSavings = businessPrice && topupPrice && businessPrice < topupPrice;
  const savingsPercentage = hasSavings
    ? Math.round(((topupPrice - businessPrice) / topupPrice) * 100)
    : 0;

  // Show savings when on Business pricing and there are savings
  if (!useTopupPricing && hasSavings && businessPrice && topupPrice) {
    return (
      <div className="flex items-center gap-2">
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="line-through text-[10px] text-gray-400"
        >
          ${topupPrice.toFixed(6)} / sec
        </motion.span>
        <Badge variant={"fuchsia"}>${currentPrice.toFixed(6)} / sec</Badge>
        <Badge
          variant="secondary"
          className="h-4 bg-green-50 px-1.5 py-0 text-[10px] text-green-700 dark:bg-green-900/50 dark:text-green-400"
        >
          -{savingsPercentage}%
        </Badge>
      </div>
    );
  }

  // Default price display
  return <Badge variant={"fuchsia"}>${currentPrice.toFixed(6)} / sec</Badge>;
}

export function GPUPriceSimulator() {
  const [gpu, setGPU] = useState<string>("T4");
  const [duration, setDuration] = useState(30);
  const [idleTime, setIdleTime] = useState(60);
  const [coldStart] = useState(30);
  const [useTopupPricing, setUseTopupPricing] = useState(false);
  const pricingToggleId = useId();

  const { data: oldPricingData, isLoading } = useGPUPricing();
  const { data: creditSchemaData, isLoading: isLoadingSchema } =
    useGPUCreditSchema();

  // Convert credit schema to pricing format for backward compatibility
  const getPricingFromSchema = (
    schemaType: "gpu-credit" | "gpu-credit-topup",
  ) => {
    if (!creditSchemaData?.[schemaType]?.schema) return {};

    const pricing: Record<string, number> = {};
    creditSchemaData[schemaType].schema.forEach((item) => {
      // Convert metered_feature_id to display format (gpu-t4 -> T4)
      const displayName = item.metered_feature_id
        .replace(/^gpu-/, "")
        .replace(/^cpu$/, "CPU")
        .toUpperCase();

      pricing[displayName] = item.credit_cost / 100; // Convert from cents to dollars
    });

    return pricing;
  };

  // Use either old pricing data or new credit schema data
  const data = creditSchemaData
    ? getPricingFromSchema(useTopupPricing ? "gpu-credit-topup" : "gpu-credit")
    : oldPricingData;

  // Ensure selected GPU exists in data, otherwise select the first available
  if (data && Object.keys(data).length > 0 && !data[gpu]) {
    setGPU(Object.keys(data)[0]);
  }

  const final = data?.[gpu] ? (coldStart + duration + idleTime) * data[gpu] : 0;
  const finalWarm = (times: number) =>
    data?.[gpu] ? (coldStart + duration * times + idleTime) * data[gpu] : 0;

  if (isLoading || isLoadingSchema) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <LoadingIcon />
      </div>
    );
  }

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-gray-500 text-sm">No pricing data available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Pricing Plan Toggle */}
      {creditSchemaData && (
        <div className="flex items-center space-x-2">
          <Switch
            id={pricingToggleId}
            checked={useTopupPricing}
            onCheckedChange={setUseTopupPricing}
          />
          <Label htmlFor={pricingToggleId} className="text-sm">
            {useTopupPricing ? "Top-up Pricing" : "Standard Pricing"}
          </Label>
          <Badge variant="outline" className="text-xs">
            {useTopupPricing
              ? creditSchemaData["gpu-credit-topup"]?.name
              : creditSchemaData["gpu-credit"]?.name}
          </Badge>
        </div>
      )}

      <div className="flex flex-col gap-2">
        My workflow running approximately (warm)
        <Slider
          defaultValue={[duration]}
          onValueChange={(a) => {
            setDuration(a[0]);
          }}
          // className="md:max-w-[200px]"
          min={1}
          max={600}
          step={1}
        />
        <div className="text-gray-500 text-sm">{getDuration(duration)}</div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        with
        <Select
          value={gpu}
          onValueChange={(value) => {
            setGPU(value);
          }}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="GPU" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(data).map(([gpuName]) => (
              <SelectItem key={gpuName} value={gpuName}>
                {gpuName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <PriceWithSavingsBadge
          gpu={gpu}
          currentPrice={data?.[gpu] || 0}
          useTopupPricing={useTopupPricing}
          creditSchemaData={creditSchemaData}
        />
      </div>
      <div className="flex items-center gap-2">
        approx comfyui cold start = <Badge variant={"rose"}>30 secs</Badge>
      </div>
      <div className="flex items-center gap-2">
        idle timeout =
        <Select
          value={idleTime.toString()}
          onValueChange={(value) => {
            setIdleTime(Number(value));
          }}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Idle Timeout" />
          </SelectTrigger>
          <SelectContent>
            {["0", "15", "30", "60", "120", "240"].map((value) => (
              <SelectItem key={value} value={value}>
                {value} sec
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <div className="text-gray-500 text-sm">
          Formula = (cold start + warm run time + idle timeout) * gpu per sec
        </div>
        <div className="text-sm">
          1 workflow run ={" "}
          <Badge variant={"blue"} className="text-sm">
            ${final.toFixed(2)}
          </Badge>
        </div>
        <Tabs defaultValue="all_warm" className="w-full text-sm">
          <div className="flex items-center gap-2">
            All
            <TabsList className="grid max-w-[100px] grid-cols-2">
              <TabsTrigger value="all_warm">warm</TabsTrigger>
              <TabsTrigger value="all_cold">cold</TabsTrigger>
            </TabsList>
            runs
          </div>
          <TabsContent value="all_cold">
            <div>
              10 workflow run ={" "}
              <Badge variant={"blue"} className="text-sm">
                ${(final * 10).toFixed(2)}
              </Badge>
            </div>
            <div>
              100 workflow run ={" "}
              <Badge variant={"blue"} className="text-sm">
                ${(final * 100).toFixed(2)}
              </Badge>
            </div>
          </TabsContent>
          <TabsContent value="all_warm" className="">
            <div>
              10 workflow run ={" "}
              <Badge variant={"blue"} className="text-sm">
                ${finalWarm(10).toFixed(2)}
              </Badge>
            </div>
            <div>
              100 workflow run ={" "}
              <Badge variant={"blue"} className="text-sm">
                ${finalWarm(100).toFixed(2)}
              </Badge>
            </div>
          </TabsContent>
          <Alert className="mt-6 max-w-[400px] text-gray-500 text-sm">
            {/* <AlertTitle>Notice</AlertTitle> */}
            <AlertDescription>
              Warm meaning all the runs is running in the same warm instance,
              with only the first cold start. Cold meaning all the runs are
              running with cold start, and full idle time. The actual cost will
              vary between all warm and all cold cost.
            </AlertDescription>
          </Alert>
        </Tabs>
      </div>
    </div>
  );
}
