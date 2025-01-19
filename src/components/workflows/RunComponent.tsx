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
    <motion.div className="w-full" layout>
      <div className="relative h-full w-full min-w-0">
        <CardContent className="h-full px-0 pt-6">
          <h2 className="mb-4 font-bold text-2xl">Requests</h2>
          <LoadingWrapper tag="runs">
            <>
              <RunsTable
                workflow_id={workflow_id}
                defaultData={props.defaultData}
              />
              <RunWorkflowButton
                className="absolute top-6 right-4"
                workflow_id={workflow_id}
              />
            </>
          </LoadingWrapper>
        </CardContent>
      </div>
    </motion.div>
  );
}
