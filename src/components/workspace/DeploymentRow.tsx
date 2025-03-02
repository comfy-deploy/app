"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { getRelativeTime } from "@/lib/get-relative-time";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Droplets, ChevronRight } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function getEnvColor(env: string) {
  switch (env) {
    case "development":
      return "bg-emerald-50 text-emerald-700 hover:bg-emerald-100";
    case "staging":
      return "bg-amber-50 text-amber-700 hover:bg-amber-100";
    case "production":
      return "bg-red-50 text-red-700 hover:bg-red-100";
    case "public-share":
      return "bg-purple-50 text-purple-700 hover:bg-purple-100";
    default:
      return "bg-zinc-50 text-zinc-700 hover:bg-zinc-100";
  }
}

export function DeploymentRow({
  deployment,
}: {
  deployment: any;
}) {
  const is_fluid = !!deployment.modal_image_id;

  return (
    <>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(getEnvColor(deployment.environment))}
          >
            {deployment.environment}
          </Badge>
          {is_fluid && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="secondary"
                    className="bg-blue-50 flex items-center gap-1 hover:bg-blue-100 text-blue-700"
                  >
                    <Droplets className="h-3 w-3" />
                    Fluid
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Fluid deployments offer improved stability and auto-scaling
                    capabilities.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </TableCell>
      <TableCell>
        {deployment.version?.version ? `v${deployment.version.version}` : "-"}
      </TableCell>
      <TableCell>{deployment.gpu}</TableCell>
      <TableCell>{deployment.concurrency_limit}</TableCell>
      <TableCell>
        <div className="flex items-center">
          <ChevronRight className="h-4 w-4" />
        </div>
      </TableCell>
    </>
  );
}
