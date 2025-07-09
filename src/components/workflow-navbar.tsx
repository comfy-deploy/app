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
import { useMemo, useState } from "react";
import { ImageInputsTooltip } from "./image-inputs-tooltip";

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
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  // Define which buttons should be visible for each view
  const visibleButtons = useMemo(() => {
    const buttonConfig = {
      machine: view === "workspace" || view === "machine" || view === "model",
      model: view === "workspace" || view === "model" || view === "machine",
      gallery: view === "playground" || view === "gallery",
      requests: view === "deployment" || view === "requests",
    };
    return buttonConfig;
  }, [view]);

  // Calculate hover background position
  const getHoverPosition = (buttonId: string) => {
    const positions = {
      workspace: { left: "8px", width: "35%" },
      playground: { left: "37%", width: "38%" },
      deployment: { left: "75%", width: "23%" },
    } as const;
    return positions[buttonId as keyof typeof positions] || positions.workspace;
  };

  return (
    <motion.div
      layout
      className="mt-2 flex flex-row gap-2.5"
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 25,
        mass: 0.8,
      }}
    >
      {/* Main navbar with layout animation */}
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 250,
          damping: 20,
          mass: 0.6,
          opacity: { duration: 0.3 },
        }}
        className="relative z-10 flex items-center rounded-full border border-gray-200 bg-white/60 px-1.5 text-sm shadow-md backdrop-blur-sm"
        onMouseLeave={() => setHoveredButton(null)}
      >
        {/* Floating hover background */}
        <AnimatePresence>
          {hoveredButton && (
            <motion.div
              layoutId="hover-background"
              className="absolute inset-y-1 rounded-full bg-gray-100/60 backdrop-blur-sm"
              initial={{ opacity: 0, scaleX: 0.8, scaleY: 0.8 }}
              animate={{
                opacity: 1,
                scaleX: 1.05,
                scaleY: 1.05,
                ...getHoverPosition(hoveredButton),
              }}
              exit={{ opacity: 0, scaleX: 0.8, scaleY: 0.8 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
                mass: 0.3,
              }}
            />
          )}
        </AnimatePresence>

        <button
          type="button"
          className={`relative z-10 flex items-center gap-1.5 px-4 py-3 transition-colors ${
            view === "workspace"
              ? "font-medium text-gray-900"
              : "text-gray-600 hover:text-gray-900"
          }`}
          onClick={() => {
            router.navigate({
              to: "/workflows/$workflowId/$view",
              params: { workflowId: workflowId || "", view: "workspace" },
            });
          }}
          onMouseEnter={() => setHoveredButton("workspace")}
        >
          <WorkflowIcon className="h-4 w-4" />
          Workflow
        </button>

        <button
          type="button"
          className={`relative z-10 flex items-center gap-1.5 px-4 py-3 transition-colors ${
            view === "playground"
              ? "font-medium text-gray-900"
              : "text-gray-600 hover:text-gray-900"
          }`}
          onClick={() => {
            router.navigate({
              to: "/workflows/$workflowId/$view",
              params: { workflowId: workflowId || "", view: "playground" },
            });
          }}
          onMouseEnter={() => setHoveredButton("playground")}
        >
          <Play className="h-4 w-4" />
          Playground
        </button>

        <button
          type="button"
          className={`relative z-10 flex items-center gap-1.5 px-4 py-3 transition-colors ${
            view === "deployment"
              ? "font-medium text-gray-900"
              : "text-gray-600 hover:text-gray-900"
          }`}
          onClick={() => {
            router.navigate({
              to: "/workflows/$workflowId/$view",
              params: { workflowId: workflowId || "", view: "deployment" },
            });
          }}
          onMouseEnter={() => setHoveredButton("deployment")}
        >
          <GitBranch className="h-4 w-4" />
          API
        </button>

        {/* Active state background */}
        <motion.div
          className="absolute inset-y-1 rounded-full bg-gray-200/60 backdrop-blur-sm"
          initial={false}
          animate={{
            opacity:
              view === "workspace" ||
              view === "playground" ||
              view === "deployment"
                ? 1
                : 0,
            ...getHoverPosition(
              view === "workspace"
                ? "workspace"
                : view === "playground"
                  ? "playground"
                  : "deployment",
            ),
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            mass: 0.5,
          }}
        />
      </motion.div>

      <AnimatePresence mode="popLayout">
        {/* Machine button */}
        {visibleButtons.machine && (
          <motion.div
            layout
            key="machine"
            initial={{ opacity: 0, scale: 0.3, x: -120, rotateZ: -5 }}
            animate={{ opacity: 1, scale: 1, x: 0, rotateZ: 0 }}
            exit={{ opacity: 0, scale: 0.3, x: -120, rotateZ: 5 }}
            whileHover={{ scale: 1.08, rotateZ: 1 }}
            whileTap={{ scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 180,
              damping: 15,
              mass: 0.8,
              opacity: { duration: 0.4 },
            }}
            className={`flex items-center rounded-full border text-sm shadow-md backdrop-blur-sm ${
              view === "machine"
                ? "border-gray-300 bg-gray-200/60 shadow-gray-200"
                : "border-gray-200 bg-white/60"
            }`}
          >
            <ImageInputsTooltip tooltipText="Machine" delayDuration={300}>
              <button
                type="button"
                className={`flex items-center gap-1.5 px-4 py-3 transition-colors ${
                  view === "machine"
                    ? "text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
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
            </ImageInputsTooltip>
          </motion.div>
        )}

        {/* Model button */}
        {visibleButtons.model && (
          <motion.div
            layout
            key="model"
            initial={{ opacity: 0, scale: 0.3, x: -120, rotateZ: -5 }}
            animate={{ opacity: 1, scale: 1, x: 0, rotateZ: 0 }}
            exit={{ opacity: 0, scale: 0.3, x: -120, rotateZ: 5 }}
            whileHover={{ scale: 1.08, rotateZ: -1 }}
            whileTap={{ scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 180,
              damping: 15,
              mass: 0.8,
              opacity: { duration: 0.4 },
              delay: 0.1,
            }}
            className={`flex items-center rounded-full border text-sm shadow-md backdrop-blur-sm ${
              view === "model"
                ? "border-gray-300 bg-gray-200/60 shadow-gray-200"
                : "border-gray-200 bg-white/60"
            }`}
          >
            <ImageInputsTooltip tooltipText="Model" delayDuration={300}>
              <button
                type="button"
                className={`flex items-center gap-1.5 px-4 py-3 transition-colors ${
                  view === "model"
                    ? "text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => {
                  router.navigate({
                    to: "/workflows/$workflowId/$view",
                    params: { workflowId: workflowId || "", view: "model" },
                  });
                }}
              >
                <span className="sr-only">Model</span>
                <Database className="h-4 w-[18px]" />
              </button>
            </ImageInputsTooltip>
          </motion.div>
        )}

        {/* Gallery button */}
        {visibleButtons.gallery && (
          <motion.div
            layout
            key="gallery"
            initial={{ opacity: 0, scale: 0.3, x: -120, rotateZ: -5 }}
            animate={{ opacity: 1, scale: 1, x: 0, rotateZ: 0 }}
            exit={{ opacity: 0, scale: 0.3, x: -120, rotateZ: 5 }}
            whileHover={{ scale: 1.08, rotateZ: 1 }}
            whileTap={{ scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 180,
              damping: 15,
              mass: 0.8,
              opacity: { duration: 0.4 },
            }}
            className={`flex items-center rounded-full border text-sm shadow-md backdrop-blur-sm ${
              view === "gallery"
                ? "border-gray-300 bg-gray-200/60 shadow-gray-200"
                : "border-gray-200 bg-white/60"
            }`}
          >
            <ImageInputsTooltip tooltipText="Gallery" delayDuration={300}>
              <button
                type="button"
                className={`flex items-center gap-1.5 px-4 py-3 transition-colors ${
                  view === "gallery"
                    ? "text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
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
            </ImageInputsTooltip>
          </motion.div>
        )}

        {/* Request button */}
        {visibleButtons.requests && (
          <motion.div
            layout
            key="requests"
            initial={{ opacity: 0, scale: 0.3, x: -120, rotateZ: -5 }}
            animate={{ opacity: 1, scale: 1, x: 0, rotateZ: 0 }}
            exit={{ opacity: 0, scale: 0.3, x: -120, rotateZ: 5 }}
            whileHover={{ scale: 1.08, rotateZ: -1 }}
            whileTap={{ scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 180,
              damping: 15,
              mass: 0.8,
              opacity: { duration: 0.4 },
            }}
            className={`flex items-center rounded-full border text-sm shadow-md backdrop-blur-sm ${
              view === "requests"
                ? "border-gray-300 bg-gray-200/60 shadow-gray-200"
                : "border-gray-200 bg-white/60"
            }`}
          >
            <ImageInputsTooltip tooltipText="Request" delayDuration={300}>
              <button
                type="button"
                className={`flex items-center gap-1.5 px-4 py-3 transition-colors ${
                  view === "requests"
                    ? "text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
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
            </ImageInputsTooltip>
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
