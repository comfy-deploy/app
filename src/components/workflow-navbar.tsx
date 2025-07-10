import { Link, useRouter, useSearch } from "@tanstack/react-router";
import { WorkflowDropdown } from "./workflow-dropdown";
import { useWorkflowIdInWorkflowPage } from "@/hooks/hook";
import { VersionSelectV2 } from "./version-select";
import {
  Database,
  GitBranch,
  ImageIcon,
  Lock,
  Play,
  Server,
  Share,
  Slash,
  TextSearch,
  WorkflowIcon,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import { useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ImageInputsTooltip } from "./image-inputs-tooltip";
import { cn } from "@/lib/utils";
import type { Session } from "./app-sidebar";
import { useQuery } from "@tanstack/react-query";
import { useSessionTimer } from "./workspace/SessionTimer";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect } from "react";
import { useSessionAPI } from "@/hooks/use-session-api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentWorkflow } from "@/hooks/use-current-workflow";
import { ShareWorkflowDialog } from "./share-workflow-dialog";
import { useIsAdminAndMember } from "./permissions";
import {
  useCurrentPlanQuery,
  useIsDeploymentAllowed,
} from "@/hooks/use-current-plan";
import { useWorkflowDeployments } from "@/components/workspace/ContainersTable";
import {
  DeploymentDialog,
  useSelectedDeploymentStore,
} from "@/components/deployment/deployment-page";
import { getEnvColor } from "@/components/workspace/ContainersTable";

export function WorkflowNavbar() {
  const { sessionId } = useSearch({ from: "/workflows/$workflowId/$view" });

  return (
    <div className={cn(sessionId && "dark")}>
      <div
        className="pointer-events-none fixed top-0 right-0 left-0 z-40 h-14 bg-gradient-to-b from-white/80 to-transparent backdrop-blur-sm dark:from-zinc-900/80 dark:to-transparent"
        style={{
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)",
        }}
      />
      <div
        className={cn(
          "pointer-events-none fixed top-0 right-0 left-0 z-50 flex h-14 items-center",
          sessionId && "dark",
        )}
      >
        <WorkflowNavbarLeft />

        <div className="-translate-x-1/2 pointer-events-auto absolute left-1/2 flex transform items-center">
          <CenterNavigation />
        </div>

        <div className="pointer-events-auto ml-auto flex items-center pr-4">
          <WorkflowNavbarRight />
        </div>
      </div>
    </div>
  );
}

function CenterNavigation() {
  const workflowId = useWorkflowIdInWorkflowPage();
  const isAdminAndMember = useIsAdminAndMember();
  const { isLoading: isPlanLoading } = useCurrentPlanQuery();
  const isDeploymentAllowed = useIsDeploymentAllowed();
  const router = useRouter();
  const { view } = useParams({ from: "/workflows/$workflowId/$view" });
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const { sessionId, restoreCachedSession, cacheSessionId } =
    useSessionWithCache();

  const shouldHideDeploymentFeatures = !isPlanLoading && !isDeploymentAllowed;

  const visibleButtons = useMemo(() => {
    if (!isAdminAndMember) {
      // When user is not admin and member, only show gallery
      return {
        machine: false,
        model: false,
        gallery: view === "playground" || view === "gallery",
        requests: false,
      };
    }

    // Original logic for admin and members
    const buttonConfig = {
      machine: view === "workspace" || view === "machine" || view === "model",
      model: view === "workspace" || view === "model" || view === "machine",
      gallery: view === "playground" || view === "gallery",
      requests: view === "deployment" || view === "requests",
    };
    return buttonConfig;
  }, [view, isAdminAndMember]);

  // Calculate hover background position
  const getHoverPosition = (buttonId: string) => {
    if (!isAdminAndMember) {
      // When only playground is shown, center it
      const positions = {
        playground: { left: "6px", width: "calc(100% - 12px)" },
      } as const;
      return (
        positions[buttonId as keyof typeof positions] || positions.playground
      );
    }

    const positions = {
      workspace: { left: "8px", width: "35%" },
      playground: { left: "37%", width: "38%" },
      deployment: { left: "75%", width: "23%" },
    } as const;
    return positions[buttonId as keyof typeof positions] || positions.workspace;
  };

  const hoverPosition = useMemo(
    () =>
      getHoverPosition(
        hoveredButton || (isAdminAndMember ? "workspace" : "playground"),
      ),
    [hoveredButton, isAdminAndMember],
  );

  return (
    <div className="mt-2 flex flex-row gap-2.5">
      <SessionTimerButton
        workflowId={workflowId}
        sessionId={sessionId}
        restoreCachedSession={restoreCachedSession}
      />

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
        className="relative z-10 flex items-center rounded-full border border-gray-200 bg-white/60 px-1.5 text-sm shadow-md backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-700/60"
        onMouseLeave={() => setHoveredButton(null)}
      >
        {/* Floating hover background */}
        <AnimatePresence>
          {hoveredButton && (
            <motion.div
              layoutId="hover-background"
              className="absolute inset-y-1 rounded-full bg-gray-100/60 backdrop-blur-sm dark:bg-zinc-600/5"
              initial={{ opacity: 0, scaleX: 0.8, scaleY: 0.4 }}
              animate={{
                opacity: 1,
                scaleX: 1.05,
                scaleY: 1.05,
                ...hoverPosition,
              }}
              exit={{ opacity: 0, scaleX: 0.8, scaleY: 0.4 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
                mass: 0.3,
              }}
            />
          )}
        </AnimatePresence>

        {/* Conditionally render workspace button */}
        {isAdminAndMember && (
          <button
            type="button"
            className={`relative z-10 flex items-center gap-1.5 px-4 py-3 transition-colors ${
              view === "workspace"
                ? "font-medium text-gray-900 dark:text-zinc-100"
                : "text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100"
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
        )}

        <button
          type="button"
          className={`relative z-10 flex items-center gap-1.5 px-4 py-3 transition-colors ${
            view === "playground"
              ? "font-medium text-gray-900 dark:text-zinc-100"
              : "text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100"
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

        {/* Conditionally render deployment button */}
        {isAdminAndMember && (
          <button
            type="button"
            className={`relative z-10 flex items-center gap-1.5 px-4 py-3 transition-colors ${
              shouldHideDeploymentFeatures
                ? "text-purple-600 opacity-50 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-100"
                : view === "deployment"
                  ? "font-medium text-gray-900 dark:text-zinc-100"
                  : "text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
            onClick={() => {
              router.navigate({
                to: "/workflows/$workflowId/$view",
                params: { workflowId: workflowId || "", view: "deployment" },
              });
            }}
            onMouseEnter={() => setHoveredButton("deployment")}
          >
            {shouldHideDeploymentFeatures ? (
              <Lock className="h-4 w-4" />
            ) : (
              <GitBranch className="h-4 w-4" />
            )}
            API
          </button>
        )}

        {/* Active state background */}
        <motion.div
          className="absolute inset-y-1 rounded-full bg-gradient-to-br from-gray-100/60 via-gray-200/60 to-gray-300/60 backdrop-blur-sm dark:from-zinc-500/40 dark:via-zinc-600/40 dark:to-zinc-700/40"
          initial={false}
          animate={{
            opacity:
              (isAdminAndMember &&
                (view === "workspace" || view === "deployment")) ||
              view === "playground"
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
                ? "border-gray-300 bg-gray-200/60 shadow-gray-200 dark:border-zinc-800/50 dark:bg-zinc-400/60 dark:shadow-zinc-600/40"
                : "border-gray-200 bg-white/60 dark:border-zinc-800/50 dark:bg-zinc-700/60"
            }`}
          >
            <ImageInputsTooltip tooltipText="Machine" delayDuration={300}>
              <button
                type="button"
                className={`flex items-center gap-1.5 px-4 py-3 transition-colors ${
                  view === "machine"
                    ? "text-gray-900 dark:text-zinc-100"
                    : "text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100"
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
                ? "border-gray-300 bg-gray-200/60 shadow-gray-200 dark:border-zinc-800/50 dark:bg-zinc-400/60 dark:shadow-zinc-600/40"
                : "border-gray-200 bg-white/60 dark:border-zinc-800/50 dark:bg-zinc-700/60"
            }`}
          >
            <ImageInputsTooltip tooltipText="Model" delayDuration={300}>
              <button
                type="button"
                className={`flex items-center gap-1.5 px-4 py-3 transition-colors ${
                  view === "model"
                    ? "text-gray-900 dark:text-zinc-100"
                    : "text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100"
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
                ? "border-gray-300 bg-gray-200/60 shadow-gray-200 dark:border-zinc-800/50 dark:bg-zinc-400/60 dark:shadow-zinc-600/40"
                : "border-gray-200 bg-white/60 dark:border-zinc-800/50 dark:bg-zinc-700/60"
            }`}
          >
            <ImageInputsTooltip tooltipText="Gallery" delayDuration={300}>
              <button
                type="button"
                className={`flex items-center gap-1.5 px-4 py-3 transition-colors ${
                  view === "gallery"
                    ? "text-gray-900 dark:text-zinc-100"
                    : "text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100"
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
                ? "border-gray-300 bg-gray-200/60 shadow-gray-200 dark:border-zinc-800/50 dark:bg-zinc-400/60 dark:shadow-zinc-600/40"
                : "border-gray-200 bg-white/60 dark:border-zinc-800/50 dark:bg-zinc-700/60"
            }`}
          >
            <ImageInputsTooltip tooltipText="Request" delayDuration={300}>
              <button
                type="button"
                className={`flex items-center gap-1.5 px-4 py-3 transition-colors ${
                  view === "requests"
                    ? "text-gray-900 dark:text-zinc-100"
                    : "text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100"
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
    </div>
  );
}

function WorkflowNavbarLeft() {
  const workflowId = useWorkflowIdInWorkflowPage();
  const search = useSearch({ from: "/workflows/$workflowId/$view" });
  const sessionId = (search as any)?.sessionId;

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-center gap-2",
        sessionId
          ? "ml-1 rounded-full bg-zinc-700/30 px-4 backdrop-blur-md"
          : "ml-4",
      )}
    >
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

function WorkflowNavbarRight() {
  const { sessionId } = useSearch({ from: "/workflows/$workflowId/$view" });
  const { workflowId, view } = useParams({
    from: "/workflows/$workflowId/$view",
  });
  const { workflow } = useCurrentWorkflow(workflowId || "");
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const { setSelectedDeployment } = useSelectedDeploymentStore();

  // Get deployments and versions for sharing
  const { data: deployments } = useWorkflowDeployments(workflowId || "");
  const { data: versions } = useQuery<any[]>({
    queryKey: ["workflow", workflowId, "versions"],
    enabled: !!workflowId,
    meta: {
      params: {
        limit: 1,
        offset: 0,
      },
    },
  });

  const publicShareDeployment = deployments?.find(
    (d: any) => d.environment === "public-share",
  );
  const communityShareDeployment = deployments?.find(
    (d: any) => d.environment === "community-share",
  );
  const privateShareDeployment = deployments?.find(
    (d: any) => d.environment === "private-share",
  );

  return (
    <>
      <AnimatePresence mode="popLayout">
        {view === "workspace" && !sessionId && (
          <motion.div
            layout
            key="workspace-share"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 180,
              damping: 15,
              mass: 0.8,
              opacity: { duration: 0.4 },
            }}
            className="mt-2 flex items-center rounded-full border border-gray-200 bg-white/60 text-sm shadow-md backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-700/60"
          >
            <ImageInputsTooltip tooltipText="Share" delayDuration={300}>
              <button
                type="button"
                className="flex h-12 items-center gap-1.5 p-4 text-gray-600 transition-colors hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                onClick={() => setIsShareDialogOpen(true)}
              >
                <Share className="h-4 w-[18px]" />
                Share
              </button>
            </ImageInputsTooltip>
          </motion.div>
        )}
        {(view === "playground" || view === "gallery") && (
          <motion.div
            layout
            key="playground-share"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 180,
              damping: 15,
              mass: 0.8,
              opacity: { duration: 0.4 },
            }}
            className={cn(
              "mt-2 flex items-center rounded-full border text-sm shadow-md backdrop-blur-sm",
              // Apply environment color or default styling
              publicShareDeployment
                ? `${getEnvColor(publicShareDeployment.environment)} border-green-200 bg-green-100/40`
                : communityShareDeployment
                  ? `${getEnvColor(communityShareDeployment.environment)} border-cyan-200 bg-cyan-100/40`
                  : privateShareDeployment
                    ? `${getEnvColor(privateShareDeployment.environment)} border-purple-200 bg-purple-100/40`
                    : "border-gray-200 bg-white/40 dark:border-zinc-800/50 dark:bg-zinc-700/60",
            )}
          >
            <button
              type="button"
              className={cn(
                "flex h-12 items-center gap-1.5 px-4 transition-colors",
                publicShareDeployment
                  ? "text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-100"
                  : communityShareDeployment
                    ? "text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-100"
                    : privateShareDeployment
                      ? "text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-100"
                      : "text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100",
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (publicShareDeployment) {
                  setSelectedDeployment(publicShareDeployment.id);
                } else if (communityShareDeployment) {
                  setSelectedDeployment(communityShareDeployment.id);
                } else if (privateShareDeployment) {
                  setSelectedDeployment(privateShareDeployment.id);
                } else if (versions?.[0]) {
                  setSelectedVersion(versions[0]);
                  setIsDrawerOpen(true);
                }
              }}
            >
              <Share className="h-4 w-[18px]" />
              <span>
                {publicShareDeployment
                  ? "Shared"
                  : communityShareDeployment
                    ? "Community"
                    : privateShareDeployment
                      ? "Internal"
                      : "Link"}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ShareWorkflowDialog
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        workflowId={workflowId}
        workflowName={workflow?.name || "Untitled Workflow"}
        workflowDescription={workflow?.description}
        workflowCoverImage={workflow?.cover_image}
      />

      <DeploymentDialog
        open={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedVersion(null);
        }}
        selectedVersion={selectedVersion}
        workflowId={workflowId || ""}
        onSuccess={setSelectedDeployment}
        publicLinkOnly={true}
        existingDeployments={deployments || []}
      />
    </>
  );
}

// ============== utils ==============

function SessionTimerButton({
  workflowId,
  sessionId,
  restoreCachedSession,
}: {
  workflowId: string | null;
  sessionId: string | null;
  restoreCachedSession: () => void;
}) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const queryClient = useQueryClient();

  // Get cached session ID if URL sessionId is null
  const getCachedSessionId = () => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("lastSessionId");
    }
    return null;
  };

  // Use sessionId from URL or fallback to cached sessionId
  const effectiveSessionId = sessionId || getCachedSessionId();

  const { data: session } = useQuery<Session>({
    enabled: !!effectiveSessionId,
    queryKey: ["session", effectiveSessionId],
    refetchInterval: (data) => {
      if (!data) return false;
      if (data.timeout_end !== null) return false;
      return 1000;
    },
  });

  // Only show session if we have both session data AND a valid session ID
  const activeSession = effectiveSessionId ? session : null;

  const { countdown, progressPercentage } = useSessionTimer(session);
  const { deleteSession } = useSessionAPI();

  // Calculate if less than 30 seconds remaining
  const isLowTime = countdown
    ? (() => {
        const [hours, minutes, seconds] = countdown.split(":").map(Number);
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        return totalSeconds < 30;
      })()
    : false;

  const handleDeleteSession = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const sessionIdToDelete = effectiveSessionId;
    if (!sessionIdToDelete) return;

    try {
      router.navigate({
        to: "/workflows/$workflowId/$view",
        params: { workflowId: workflowId || "", view: "workspace" },
      });
      await deleteSession.mutateAsync({
        sessionId: sessionIdToDelete,
        waitForShutdown: true,
      });

      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({
        queryKey: ["session", sessionIdToDelete],
      });

      toast.success("Session ended successfully");
    } catch (error) {
      toast.error("Failed to end session");
    }
  };

  return (
    <AnimatePresence mode="popLayout">
      {activeSession && effectiveSessionId && (
        <motion.div
          layout
          key="session-timer"
          initial={{ opacity: 0, scale: 0.3, x: 120, rotateZ: -5 }}
          animate={{ opacity: 1, scale: 1, x: 0, rotateZ: 0 }}
          exit={{ opacity: 0, scale: 0.3, x: 120, rotateZ: 5 }}
          transition={{
            type: "spring",
            stiffness: 180,
            damping: 15,
            mass: 0.8,
            opacity: { duration: 0.4 },
          }}
          className="flex items-center"
        >
          <div
            className={`relative flex h-10 items-center justify-between overflow-hidden rounded-full shadow-lg transition-all duration-400 ${
              isLowTime
                ? "bg-gradient-to-br from-orange-400 to-orange-600 shadow-orange-500/25 hover:shadow-orange-500/40 dark:from-orange-500 dark:to-orange-700 dark:shadow-orange-600/25 dark:hover:shadow-orange-600/40"
                : "border border-gray-200 bg-gradient-to-br from-white to-white shadow-md dark:border-zinc-800/50 dark:from-gray-700 dark:to-gray-800 dark:shadow-gray-700/25 dark:hover:shadow-gray-700/40"
            }`}
            style={{
              width: isHovered ? "164px" : "42px",
              paddingLeft: isHovered ? "12px" : "0px",
              paddingRight: isHovered ? "12px" : "0px",
              transitionTimingFunction: isHovered
                ? "cubic-bezier(0.68, -0.55, 0.265, 1.55)"
                : "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              transitionDuration: isHovered ? "400ms" : "200ms",
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Timer Icon */}
            <button
              type="button"
              className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-transform duration-150 hover:scale-105 active:scale-95"
              onClick={restoreCachedSession}
            >
              {/* Progress ring */}
              <div className="absolute inset-0.5">
                <svg
                  viewBox="0 0 32 32"
                  className="-rotate-90 h-full w-full"
                  role="img"
                  aria-label="Session timer progress"
                >
                  {/* Background ring */}
                  <circle
                    cx="16"
                    cy="16"
                    r="10"
                    fill="none"
                    stroke={
                      isLowTime
                        ? "rgba(255, 255, 255, 0.2)"
                        : "rgba(251, 146, 60, 0.2)"
                    }
                    strokeWidth="2"
                  />
                  {/* Progress ring */}
                  <circle
                    cx="16"
                    cy="16"
                    r="10"
                    fill="none"
                    stroke={
                      isLowTime
                        ? "rgba(255, 255, 255, 0.9)"
                        : "rgba(251, 146, 60, 0.9)"
                    }
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 10}`}
                    strokeDashoffset={`${2 * Math.PI * 10 * (1 - progressPercentage / 100)}`}
                    className="transition-all duration-1000 ease-out"
                  />

                  {/* Clock hand */}
                  <line
                    x1="16"
                    y1="16"
                    x2="16"
                    y2="9"
                    stroke={
                      isLowTime
                        ? "rgba(255, 255, 255, 0.95)"
                        : "rgba(251, 146, 60, 0.95)"
                    }
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    transform={`rotate(${-270 + progressPercentage * 3.6} 16 16)`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
              </div>
            </button>

            {/* Countdown Text and End Button */}
            <div
              className={`flex items-center gap-2 transition-all ${
                isHovered
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-4"
              }`}
              style={{
                transitionDelay: isHovered ? "100ms" : "0ms",
                transitionDuration: isHovered ? "300ms" : "150ms",
                transitionTimingFunction: isHovered
                  ? "cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                  : "ease-out",
              }}
            >
              <span
                className={`text-sm font-medium whitespace-nowrap ${
                  isLowTime ? "text-white" : "text-gray-900 dark:text-white"
                }`}
              >
                {countdown || "00:00:00"}
              </span>

              <button
                type="button"
                onClick={handleDeleteSession}
                disabled={deleteSession.isPending}
                className={`p-1 rounded-full transition-colors duration-200 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isLowTime
                    ? "text-white hover:text-white"
                    : "text-gray-600 hover:text-red-500 dark:text-gray-300 dark:hover:text-red-400"
                }`}
                title="End session"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Create a custom hook for session management with caching
function useSessionWithCache() {
  const [sessionId, setSessionId] = useQueryState("sessionId", parseAsString);
  const workflowId = useWorkflowIdInWorkflowPage();
  const router = useRouter();

  // Get cached session ID from session storage
  const getCachedSessionId = () => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("lastSessionId");
    }
    return null;
  };

  // Cache session ID to session storage (separate from clearing)
  const cacheSessionId = (id: string | null) => {
    if (typeof window !== "undefined") {
      if (id) {
        sessionStorage.setItem("lastSessionId", id);
      } else {
        // Only remove from session storage when explicitly requested
        sessionStorage.removeItem("lastSessionId");
      }
    }
  };

  // Clear session ID from both URL and session storage
  const clearSessionId = () => {
    setSessionId(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("lastSessionId");
    }
  };

  // Update cache ONLY when sessionId is present (not null)
  useEffect(() => {
    if (sessionId) {
      cacheSessionId(sessionId);
    }
    // Don't automatically clear when sessionId becomes null
  }, [sessionId]);

  // Function to restore cached session
  const restoreCachedSession = () => {
    const cachedId = getCachedSessionId();
    if (cachedId) {
      router.navigate({
        to: "/workflows/$workflowId/$view",
        params: { workflowId: workflowId || "", view: "workspace" },
        search: { sessionId: cachedId },
      });
    }
  };

  return {
    sessionId,
    setSessionId,
    getCachedSessionId,
    restoreCachedSession,
    cacheSessionId: clearSessionId, // Use the new clear function
  };
}
