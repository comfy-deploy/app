"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { machineGPUOptions } from "../machine/machine-schema";
import { Card, CardDescription } from "@/components/ui/card";
import { BarChart2 } from "lucide-react";

const chartConfig = {
  views: {
    label: "GPU Usage",
  },
  ...Object.fromEntries(
    machineGPUOptions.map((gpu) => [
      gpu,
      {
        label: gpu,
        color: `var(--color-gpu-${gpu})`,
      },
    ]),
  ),
} satisfies ChartConfig;

export function UsageGraph({
  chartData,
}: {
  chartData: any[];
}) {
  // Find which GPU types have actual usage
  const activeGPUs = React.useMemo(() => {
    if (!chartData?.length) return [];

    // Get all GPU types that have non-zero values
    const usedGPUs = new Set<string>();
    for (const dayData of chartData) {
      for (const gpu of machineGPUOptions) {
        if (dayData[gpu] && dayData[gpu] > 0) {
          usedGPUs.add(gpu);
        }
      }
    }

    return Array.from(usedGPUs);
  }, [chartData]);

  // Filter chartConfig to only include active GPUs
  const filteredChartConfig = React.useMemo(() => {
    return {
      views: chartConfig.views,
      ...Object.fromEntries(
        activeGPUs.map((gpu) => [
          gpu,
          {
            label: gpu,
            color: `var(--color-gpu-${gpu})`,
          },
        ]),
      ),
    } satisfies ChartConfig;
  }, [activeGPUs]);

  // If no data or no active GPUs, show empty state
  if (!chartData?.length || activeGPUs.length === 0) {
    return (
      <Card className="aspect-auto flex h-[250px] items-center justify-center text-muted-foreground w-full">
        <div className="flex flex-col items-center gap-2">
          <BarChart2 className="h-8 w-8" />
          <CardDescription>No GPU usage data available</CardDescription>
        </div>
      </Card>
    );
  }

  return (
    // <Card>
    //   <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
    //     <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
    //       <CardTitle>GPU Usage - Daily Breakdown</CardTitle>
    //       <CardDescription>Showing GPU usage costs per day</CardDescription>
    //     </div>
    //   </CardHeader>
    //   <CardContent className="px-2 sm:p-6">
    <ChartContainer
      config={filteredChartConfig}
      className="aspect-auto h-[250px] w-full"
    >
      <BarChart
        accessibilityLayer
        data={chartData}
        margin={{
          left: 12,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          tickFormatter={(value) => {
            const date = new Date(value);
            return date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
          }}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              className="dolloar w-[150px]"
              labelFormatter={(value) => {
                return new Date(value).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
              }}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        {activeGPUs.map((gpu) => (
          <Bar
            key={gpu}
            dataKey={gpu}
            stackId="a"
            fill={`var(--color-${gpu})`}
            radius={[0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ChartContainer>
    //   </CardContent>
    // </Card>
  );
}
