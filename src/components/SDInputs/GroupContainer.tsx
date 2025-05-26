"use client";

import * as React from "react";
import { useState } from "react";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface GroupContainerProps {
  groupName: string;
  children: React.ReactNode;
  onDelete: (groupName: string) => void;
  isExpanded?: boolean;
  onToggleExpanded?: (expanded: boolean) => void;
  className?: string;
}

export function GroupContainer({
  groupName,
  children,
  onDelete,
  isExpanded = true,
  onToggleExpanded,
  className,
  ...dndProps
}: GroupContainerProps & React.HTMLAttributes<HTMLDivElement>) {
  const [localExpanded, setLocalExpanded] = useState(isExpanded);
  const expanded = onToggleExpanded ? isExpanded : localExpanded;
  const setExpanded = onToggleExpanded || setLocalExpanded;

  return (
    <Card 
      className={cn("mb-2", className)} 
      {...dndProps}
    >
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto">
                {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="font-medium">{groupName}</span>
              </Button>
            </CollapsibleTrigger>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(groupName)}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              >
                <X size={16} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
