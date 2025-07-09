import { Link, useRouter } from "@tanstack/react-router";
import { WorkflowDropdown } from "./workflow-dropdown";
import { useWorkflowIdInWorkflowPage } from "@/hooks/hook";
import { VersionSelectV2 } from "./version-select";
import {
  Database,
  GitBranch,
  ImageIcon,
  Play,
  Server,
  Slash,
  TextSearch,
  WorkflowIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import { useParams } from "@tanstack/react-router";
import { useMemo } from "react";

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
  const workflowId = useWorkflowIdInWorkflowPage();
  const router = useRouter();
  const { view } = useParams({ from: "/workflows/$workflowId/$view" });

  // Define which buttons should be visible for each view
  const visibleButtons = useMemo(() => {
    const buttonConfig = {
      machine: view === "workspace" || view === "machine",
      model: view === "workspace" || view === "model",
      gallery: view === "playground" || view === "gallery",
      requests: view === "deployment" || view === "requests",
    };
    return buttonConfig;
  }, [view]);

  return (
    <motion.div
      layout
      className="mt-2 flex flex-row gap-2.5"
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Main navbar with layout animation */}
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30,
          opacity: { duration: 0.2 },
        }}
        className="z-10 flex items-center rounded-full border border-gray-200 bg-white/60 px-2 text-sm shadow-md backdrop-blur-sm"
      >
        <button
          type="button"
          className="flex items-center gap-1.5 px-4 py-3"
          onClick={() => {
            router.navigate({
              to: "/workflows/$workflowId/$view",
              params: { workflowId: workflowId || "", view: "workspace" },
            });
          }}
        >
          <WorkflowIcon className="h-4 w-4" />
          Workflow
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 px-4 py-3"
          onClick={() => {
            router.navigate({
              to: "/workflows/$workflowId/$view",
              params: { workflowId: workflowId || "", view: "playground" },
            });
          }}
        >
          <Play className="h-4 w-4" />
          Playground
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 px-4 py-3"
          onClick={() => {
            router.navigate({
              to: "/workflows/$workflowId/$view",
              params: { workflowId: workflowId || "", view: "deployment" },
            });
          }}
        >
          <GitBranch className="h-4 w-4" />
          API
        </button>
      </motion.div>

      <AnimatePresence mode="popLayout">
        {/* Machine button */}
        {visibleButtons.machine && (
          <motion.div
            layout
            key="machine"
            initial={{ opacity: 0, scale: 0.4, x: -100 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.4, x: -100 }}
            whileHover={{ scale: 1.05 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
              opacity: { duration: 0.2 },
            }}
            className="flex items-center rounded-full border border-gray-200 bg-white/60 text-sm shadow-md backdrop-blur-sm"
          >
            <button
              type="button"
              className="flex items-center gap-1.5 px-4 py-3"
              onClick={() => {
                router.navigate({
                  to: "/workflows/$workflowId/$view",
                  params: { workflowId: workflowId || "", view: "machine" },
                });
              }}
            >
              <span className="sr-only">Machine</span>
              <Server className="h-4 w-[18px]" />
            </button>
          </motion.div>
        )}

        {/* Model button */}
        {visibleButtons.model && (
          <motion.div
            layout
            key="model"
            initial={{ opacity: 0, scale: 0.4, x: -100 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.4, x: -100 }}
            whileHover={{ scale: 1.05 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
              opacity: { duration: 0.2 },
            }}
            className="flex items-center rounded-full border border-gray-200 bg-white/60 text-sm shadow-md backdrop-blur-sm"
          >
            <button
              type="button"
              className="flex items-center gap-1.5 px-4 py-3"
            >
              <span className="sr-only">Model</span>
              <Database className="h-4 w-[18px]" />
            </button>
          </motion.div>
        )}

        {/* Gallery button */}
        {visibleButtons.gallery && (
          <motion.div
            layout
            key="gallery"
            initial={{ opacity: 0, scale: 0.4, x: -100 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.4, x: -100 }}
            whileHover={{ scale: 1.05 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
              opacity: { duration: 0.2 },
            }}
            className="flex items-center rounded-full border border-gray-200 bg-white/60 text-sm shadow-md backdrop-blur-sm"
          >
            <button
              type="button"
              className="flex items-center gap-1.5 px-4 py-3"
              onClick={() => {
                router.navigate({
                  to: "/workflows/$workflowId/$view",
                  params: { workflowId: workflowId || "", view: "gallery" },
                });
              }}
            >
              <span className="sr-only">Gallery</span>
              <ImageIcon className="h-4 w-[18px]" />
            </button>
          </motion.div>
        )}

        {/* Request button */}
        {visibleButtons.requests && (
          <motion.div
            layout
            key="requests"
            initial={{ opacity: 0, scale: 0.4, x: -100 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.4, x: -100 }}
            whileHover={{ scale: 1.05 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
              opacity: { duration: 0.2 },
            }}
            className="flex items-center rounded-full border border-gray-200 bg-white/60 text-sm shadow-md backdrop-blur-sm"
          >
            <button
              type="button"
              className="flex items-center gap-1.5 px-4 py-3"
              onClick={() => {
                router.navigate({
                  to: "/workflows/$workflowId/$view",
                  params: { workflowId: workflowId || "", view: "requests" },
                });
              }}
            >
              <span className="sr-only">Request</span>
              <TextSearch className="h-4 w-[18px]" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
