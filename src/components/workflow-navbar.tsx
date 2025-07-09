import { Link } from "@tanstack/react-router";
import { WorkflowDropdown } from "./workflow-dropdown";
import { useWorkflowIdInWorkflowPage } from "@/hooks/hook";
import { VersionSelectV2 } from "./version-select";
import { Slash } from "lucide-react";
import { motion } from "framer-motion";

export function WorkflowNavbar() {
  return (
    <>
      <div
        className="pointer-events-none fixed top-0 right-0 left-0 z-40 h-14 bg-gradient-to-b from-white/80 to-transparent backdrop-blur-sm dark:from-zinc-900/80 dark:to-transparent"
        style={{
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)",
        }}
      />
      <div className="pointer-events-none fixed top-0 right-0 left-0 z-50 flex h-14 items-center px-4">
        <WorkflowNavbarLeft />

        <div className="-translate-x-1/2 pointer-events-auto absolute left-1/2 flex transform items-center">
          <CenterNavigation />
        </div>

        <div className="pointer-events-auto ml-auto flex items-center">
          {/* Right content */}
        </div>
      </div>
    </>
  );
}

function CenterNavigation() {
  return (
    <div>
      <motion.button type="button">Workflow</motion.button>
      <motion.button type="button">Playground</motion.button>
      <motion.button type="button">API</motion.button>
    </div>
  );
}

function WorkflowNavbarLeft() {
  const workflowId = useWorkflowIdInWorkflowPage();

  return (
    <div className="pointer-events-auto flex items-center gap-2">
      <Link
        href="/"
        className="mr-2 shrink-0 drop-shadow-md transition-transform hover:scale-105"
      >
        <img
          src="/icon-light.svg"
          alt="comfydeploy"
          className="h-7 w-7 dark:hidden"
        />
        <img
          src="/icon.svg"
          alt="comfydeploy"
          className="hidden h-7 w-7 dark:block"
        />
      </Link>
      {workflowId && (
        <>
          <Slash className="h-3 w-3 shrink-0 text-muted-foreground/50 drop-shadow-md" />
          <WorkflowDropdown
            workflow_id={workflowId}
            className="max-w-36 drop-shadow-md"
          />
          <Slash className="h-3 w-3 shrink-0 text-muted-foreground/50 drop-shadow-md" />
          <VersionSelectV2
            workflow_id={workflowId}
            className="drop-shadow-md"
          />
        </>
      )}
    </div>
  );
}
