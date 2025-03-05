"use client";

import { LoadingWrapper } from "@/components/loading-wrapper";
import { CardContent } from "@/components/ui/card";
import { useWorkflowIdInWorkflowPage } from "@/hooks/hook";
import { RunsTable } from "./RunsTable";

import { motion } from "framer-motion";
import { RunWorkflowButton } from "../run/VersionSelect";

// import { RunWorkflowButton } from "@/components/VersionSelect";

export default function RunComponent(props: {
  defaultData?: any;
}) {
  const workflow_id = useWorkflowIdInWorkflowPage();
  // const domain = typeof window !== "undefined" ? window.location.origin : "";

  if (!workflow_id) {
    return null;
  }

  return (
    <div className="relative h-full w-full min-w-0">
      <RunsTable
        workflow_id={workflow_id}
        defaultData={props.defaultData}
        className="h-[300px]"
      />
    </div>
  );
}
