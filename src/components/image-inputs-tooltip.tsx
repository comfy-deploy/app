import type React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface Props {
  children: React.ReactNode;
  tooltipText: string;
  side?: "top" | "bottom" | "left" | "right";
}

export const ImageInputsTooltip = ({ tooltipText, children, side }: Props) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>
        <p className="text-sm">{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
};
