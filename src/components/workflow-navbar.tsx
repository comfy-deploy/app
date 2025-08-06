import { Link, useRouter, useSearch } from "@tanstack/react-router";
import { WorkflowDropdown } from "./workflow-dropdown";
import {
  useSessionIdInSessionView,
  useWorkflowIdInWorkflowPage,
} from "@/hooks/hook";
import { VersionSelectV2 } from "./version-select";
import {
  ArrowLeft,
  BookText,
  Box,
  Database,
  FileClock,
  Folder,
  GitBranch,
  History,
  ImageIcon,
  Link2,
  Loader2,
  Lock,
  Menu,
  Play,
  Plus,
  Save,
  Server,
  Settings,
  Share,
  Slash,
  TextSearch,
  WorkflowIcon,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import { useParams } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { ImageInputsTooltip } from "./image-inputs-tooltip";
import { cn } from "@/lib/utils";
import type { Session } from "./app-sidebar";
import { useQuery } from "@tanstack/react-query";
import { SessionTimer, useSessionTimer } from "./workspace/SessionTimer";
import { parseAsString, useQueryState } from "nuqs";
import { useSessionAPI } from "@/hooks/use-session-api";
import { toast } from "sonner";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useWorkflowStore } from "./workspace/Workspace";
import { useDrawerStore } from "@/stores/drawer-store";
import { LogDisplay } from "./workspace/LogDisplay";
import { AssetBrowserSidebar } from "./workspace/assets-browser-sidebar";
import { ExternalNodeDocs } from "./workspace/external-node-docs";
import { WorkflowModelCheck } from "./onboarding/workflow-model-check";
import { sendWorkflow } from "./workspace/sendEventToCD";
import { CopyButton } from "./ui/copy-button";
import { ScrollArea } from "./ui/scroll-area";
import { WorkflowCommitSidePanel } from "./workspace/WorkflowCommitSidePanel";
import { callServerPromise } from "@/lib/call-server-promise";
import { api } from "@/lib/api";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { useAuth } from "@clerk/clerk-react";
import { useSelectedVersion } from "./version-select";
import { useGetWorkflowVersionData } from "@/hooks/use-get-workflow-version-data";
import { serverAction } from "@/lib/workflow-version-api";
import { DeploymentDrawer } from "./workspace/DeploymentDisplay";
import { queryClient } from "@/lib/providers";
import { getCurrentEffectiveSessionId } from "./workspace/session-creator-form";

export function WorkflowNavbar() {
  const sessionId = useSessionIdInSessionView();

  return (
    <div>
      <div
        className={cn(
          "pointer-events-none fixed top-0 right-0 left-0 z-40 h-14 backdrop-blur-sm dark:from-zinc-900/80 dark:to-transparent",
          sessionId
            ? "from-zinc-900/80 to-transparent"
            : "bg-gradient-to-b from-white/80 to-transparent ",
        )}
        style={{
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)",
        }}
      />
      <div className="pointer-events-none fixed top-0 right-0 left-0 z-50 flex h-14 items-center">
        <WorkflowNavbarLeft />

        <div
          className={cn(
            "-translate-x-1/2 pointer-events-auto absolute left-1/2 hidden transform items-center md:flex",
            sessionId && "dark",
          )}
        >
          <CenterNavigation />
        </div>

        <div className="pointer-events-auto ml-auto flex items-center pr-2 md:pr-4">
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
  const effectiveSessionId = getCurrentEffectiveSessionId(workflowId || "");

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
    <div className="mt-2 flex flex-row gap-2">
      <SessionTimerButton
        workflowId={workflowId}
        restoreCachedSession={() => {
          router.navigate({
            to: "/workflows/$workflowId/$view",
            params: { workflowId: workflowId || "", view: "workspace" },
            search: {
              sessionId: effectiveSessionId ? effectiveSessionId : undefined,
            },
          });
        }}
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
                search: {
                  sessionId: effectiveSessionId
                    ? effectiveSessionId
                    : undefined,
                },
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
                <span className="sr-only">Requests</span>
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
        "pointer-events-auto ml-2 flex items-center gap-2 rounded-full pr-2 pl-4 backdrop-blur-md",
        sessionId
          ? "dark bg-zinc-700/30 shadow-md"
          : "bg-white/50 dark:bg-zinc-800/30",
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
            className={cn(
              "drop-shadow-md sm:max-w-32",
              sessionId ? "max-w-12" : "max-w-28",
            )}
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
  const { selectedDeployment, setSelectedDeployment } =
    useSelectedDeploymentStore();

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
            className="mt-2 hidden items-center rounded-full border border-gray-200 bg-white/60 text-sm shadow-md backdrop-blur-sm md:flex dark:border-zinc-800/50 dark:bg-zinc-700/60"
          >
            <button
              type="button"
              className="flex h-12 items-center gap-1.5 p-4 text-gray-600 transition-colors hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              onClick={() => setIsShareDialogOpen(true)}
            >
              <Share className="h-4 w-[18px]" />
              Share
            </button>
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
              "mt-2 hidden items-center rounded-full border text-sm shadow-md backdrop-blur-sm md:flex",
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
        {view === "workspace" && sessionId && <SessionBar />}
        {!sessionId && (
          <div className="mt-2 md:hidden">
            <WorkflowNavbarRightMobile />
          </div>
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
      <DeploymentDrawer hideHeader={true}>
        {(selectedDeployment === publicShareDeployment?.id ||
          selectedDeployment === privateShareDeployment?.id ||
          selectedDeployment === communityShareDeployment?.id) && (
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              className="transition-all hover:bg-gradient-to-b hover:from-red-400 hover:to-red-600 hover:text-white"
              confirm
              onClick={async () => {
                await callServerPromise(
                  api({
                    init: {
                      method: "DELETE",
                    },
                    url: `deployment/${selectedDeployment}`,
                  }),
                );
                setSelectedDeployment(null);
                setSelectedVersion(null);
                setIsDrawerOpen(false);
                await queryClient.invalidateQueries({
                  queryKey: ["workflow", workflowId, "deployments"],
                });
              }}
            >
              Delete
            </Button>
            <Button
              onClick={() => {
                if (versions?.[0]) {
                  // setSelectedDeployment(null);
                  setSelectedVersion(versions[0]);
                  setIsDrawerOpen(true);
                }
              }}
            >
              Update
            </Button>
          </div>
        )}
      </DeploymentDrawer>
    </>
  );
}

function WorkflowNavbarRightMobile() {
  const router = useRouter();
  const { workflowId } = useParams({
    from: "/workflows/$workflowId/$view",
  });

  // Add permission hooks
  const isAdminAndMember = useIsAdminAndMember();
  const { isLoading: isPlanLoading } = useCurrentPlanQuery();
  const isDeploymentAllowed = useIsDeploymentAllowed();

  const shouldHideDeploymentFeatures = !isPlanLoading && !isDeploymentAllowed;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <motion.div
          layout
          key="workflow-navbar-right-mobile"
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.3 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: 180,
            damping: 15,
            mass: 0.8,
            opacity: { duration: 0.4 },
          }}
          className="flex items-center rounded-full border border-zinc-300/50 bg-white/80 text-sm shadow-md backdrop-blur-sm dark:border-zinc-700/50 dark:bg-zinc-700/60"
        >
          <button
            type="button"
            className="flex items-center gap-1.5 p-4 transition-colors dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <span className="sr-only">More</span>
            <Menu className="h-4 w-[16px] shrink-0" />
          </button>
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-44 rounded-2xl bg-white/80 text-gray-600 backdrop-blur-sm md:hidden dark:border-zinc-700/50 dark:bg-zinc-800/70 dark:text-gray-300"
      >
        {/* Only show admin-only items for admins and members */}
        {isAdminAndMember && (
          <>
            <DropdownMenuItem
              className="px-3 py-2 md:hidden dark:focus:bg-zinc-700/40"
              onClick={() => {
                router.navigate({
                  to: "/workflows/$workflowId/$view",
                  params: {
                    workflowId,
                    view: "workspace",
                  },
                });
              }}
            >
              <WorkflowIcon size={16} className="mr-2" />
              Workflow
            </DropdownMenuItem>
            <DropdownMenuItem
              className="px-3 py-2 md:hidden dark:focus:bg-zinc-700/40"
              onClick={() => {
                router.navigate({
                  to: "/workflows/$workflowId/$view",
                  params: {
                    workflowId,
                    view: "machine",
                  },
                });
              }}
            >
              <Server size={16} className="mr-2" />
              Machine
            </DropdownMenuItem>
            <DropdownMenuItem
              className="px-3 py-2 md:hidden dark:focus:bg-zinc-700/40"
              onClick={() => {
                router.navigate({
                  to: "/workflows/$workflowId/$view",
                  params: {
                    workflowId,
                    view: "model",
                  },
                });
              }}
            >
              <Database size={16} className="mr-2" />
              Model
            </DropdownMenuItem>
            <DropdownMenuSeparator className="mx-4 my-2 bg-zinc-200/60 md:hidden dark:bg-zinc-600/60" />
          </>
        )}

        {/* Playground and Gallery are always available */}
        <DropdownMenuItem
          className="px-3 py-2 md:hidden dark:focus:bg-zinc-700/40"
          onClick={() => {
            router.navigate({
              to: "/workflows/$workflowId/$view",
              params: {
                workflowId,
                view: "playground",
              },
            });
          }}
        >
          <Play size={16} className="mr-2" />
          Playground
        </DropdownMenuItem>
        <DropdownMenuItem
          className="px-3 py-2 md:hidden dark:focus:bg-zinc-700/40"
          onClick={() => {
            router.navigate({
              to: "/workflows/$workflowId/$view",
              params: {
                workflowId,
                view: "gallery",
              },
            });
          }}
        >
          <ImageIcon size={16} className="mr-2" />
          Gallery
        </DropdownMenuItem>

        {/* Only show deployment features for admins and members */}
        {isAdminAndMember && (
          <>
            <DropdownMenuSeparator className="mx-4 my-2 bg-zinc-200/60 md:hidden dark:bg-zinc-600/60" />
            <DropdownMenuItem
              className={`px-3 py-2 md:hidden dark:focus:bg-zinc-700/40 ${
                shouldHideDeploymentFeatures
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              onClick={() => {
                if (!shouldHideDeploymentFeatures) {
                  router.navigate({
                    to: "/workflows/$workflowId/$view",
                    params: {
                      workflowId,
                      view: "deployment",
                    },
                  });
                }
              }}
            >
              {shouldHideDeploymentFeatures ? (
                <Lock size={16} className="mr-2" />
              ) : (
                <GitBranch size={16} className="mr-2" />
              )}
              API
            </DropdownMenuItem>
            <DropdownMenuItem
              className={`px-3 py-2 md:hidden dark:focus:bg-zinc-700/40 ${
                shouldHideDeploymentFeatures
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              onClick={() => {
                if (!shouldHideDeploymentFeatures) {
                  router.navigate({
                    to: "/workflows/$workflowId/$view",
                    params: {
                      workflowId,
                      view: "requests",
                    },
                  });
                }
              }}
            >
              <TextSearch size={16} className="mr-2" />
              Requests
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============== utils ==============

function SessionBar() {
  const { hasChanged, workflow } = useWorkflowStore();
  const { activeDrawer, toggleDrawer, closeDrawer } = useDrawerStore();
  const [workflowUpdateTrigger, setWorkflowUpdateTrigger] = useState(0);
  const [sessionId] = useQueryState("sessionId", parseAsString);
  const { workflowId } = useParams({
    from: "/workflows/$workflowId/$view",
  });
  const router = useRouter();

  const { data: session } = useQuery<Session>({
    enabled: !!sessionId,
    queryKey: ["session", sessionId],
    refetchInterval: (data) => (data ? 1000 : false),
  });

  const url = session?.url || session?.tunnel_url;

  useEffect(() => {
    if (workflow) {
      setWorkflowUpdateTrigger((prev) => prev + 1);
    }
  }, [workflow]);

  return (
    <>
      <div className="mt-2 flex items-center gap-2">
        <motion.div
          layout
          key="session-bar-commit"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: hasChanged ? 1.03 : 1 }}
          whileTap={{ scale: hasChanged ? 0.95 : 1 }}
          transition={{
            type: "spring",
            stiffness: 180,
            damping: 15,
            mass: 0.8,
            opacity: { duration: 0.4 },
          }}
          className={cn(
            "flex items-center rounded-full border text-sm shadow-md backdrop-blur-sm transition-colors duration-300",
            hasChanged
              ? "border-orange-400/20 bg-gradient-to-br from-orange-400/40 to-orange-600/40 shadow-orange-500/25 hover:from-orange-500/50 hover:to-orange-600/50 hover:shadow-orange-400/40"
              : " border-zinc-800/30 bg-zinc-700/30 opacity-50 shadow-zinc-700/20",
          )}
        >
          <ImageInputsTooltip
            tooltipText={hasChanged ? "Commit" : "No changes to commit"}
            delayDuration={300}
          >
            <button
              type="button"
              disabled={!hasChanged}
              className={cn(
                "flex h-12 items-center gap-1.5 p-4 transition-colors duration-200",
                hasChanged
                  ? "text-orange-200 hover:text-white"
                  : " text-zinc-600",
              )}
              onClick={() => {
                if (hasChanged) {
                  toggleDrawer("commit");
                }
              }}
            >
              <Save className="h-4 w-[18px]" />
              <span className="hidden sm:block">Commit</span>
            </button>
          </ImageInputsTooltip>
        </motion.div>

        <BackgroundAutoUpdate />

        <DropdownMenu>
          <DropdownMenuTrigger>
            <motion.div
              layout
              key="session-bar-more"
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.3 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              transition={{
                type: "spring",
                stiffness: 180,
                damping: 15,
                mass: 0.8,
                opacity: { duration: 0.4 },
              }}
              className="flex items-center rounded-full border border-zinc-800/50 bg-zinc-700/60 text-sm shadow-md backdrop-blur-sm"
            >
              <ImageInputsTooltip tooltipText="Menu" delayDuration={300}>
                <button
                  type="button"
                  className="flex items-center gap-1.5 p-4 text-zinc-400 transition-colors hover:text-zinc-100"
                >
                  <span className="sr-only">More</span>
                  <Menu className="h-4 w-[16px] shrink-0" />
                </button>
              </ImageInputsTooltip>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="dark w-44 rounded-2xl border-zinc-700/50 bg-zinc-800/70 text-gray-300 backdrop-blur-sm"
          >
            <DropdownMenuItem
              className="px-3 py-2 focus:bg-zinc-700/40 md:hidden"
              onClick={() => {
                router.navigate({
                  to: "/workflows/$workflowId/$view",
                  params: {
                    workflowId,
                    view: "workspace",
                  },
                });
              }}
            >
              <ArrowLeft size={16} className="mr-2" />
              Back
            </DropdownMenuItem>
            <DropdownMenuSeparator className="mx-4 my-2 bg-zinc-600/60 md:hidden" />
            <DropdownMenuItem
              className="px-3 py-2 focus:bg-zinc-700/40"
              onClick={() => toggleDrawer("log")}
            >
              <FileClock size={16} className="mr-2" />
              Log
            </DropdownMenuItem>
            <DropdownMenuItem
              className="px-3 py-2 focus:bg-zinc-700/40"
              onClick={() => toggleDrawer("assets")}
            >
              <Folder size={16} className="mr-2" />
              Assets
            </DropdownMenuItem>
            <DropdownMenuSeparator className="mx-4 my-2 bg-zinc-600/60" />
            <DropdownMenuItem
              className="px-3 py-2 focus:bg-zinc-700/40"
              onClick={() => toggleDrawer("external-node")}
            >
              <BookText size={16} className="mr-2" />
              API Nodes
            </DropdownMenuItem>
            <DropdownMenuItem
              className="px-3 py-2 focus:bg-zinc-700/40"
              onClick={() => toggleDrawer("model")}
            >
              <Box size={16} className="mr-2" />
              Model Check
            </DropdownMenuItem>
            <DropdownMenuItem
              className="px-3 py-2 focus:bg-zinc-700/40"
              onClick={() => toggleDrawer("integration")}
            >
              <Link2 size={16} className="mr-2" />
              Integration
            </DropdownMenuItem>
            <DropdownMenuItem
              className="px-3 py-2 focus:bg-zinc-700/40"
              onClick={() => toggleDrawer("configuration")}
            >
              <Settings size={16} className="mr-2" />
              Configuration
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Drawer Panel - Slides out from navbar */}
      <AnimatePresence>
        {activeDrawer && (
          <motion.div
            className="fixed top-16 right-0 z-40 h-[calc(100vh-66px)] w-full rounded-xl bg-background shadow-2xl md:right-4 md:h-[calc(100vh-80px)] md:w-[450px]"
            initial={{ opacity: 0, x: 50 }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              x: 50,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 40,
            }}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={closeDrawer}
              className="absolute top-2 right-2 z-10 rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-700/50 hover:text-zinc-100"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex h-full flex-col overflow-hidden">
              <AnimatePresence mode="wait">
                {activeDrawer === "log" && (
                  <motion.div
                    key="log"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex h-full flex-col p-4"
                  >
                    <div className="mb-4 flex items-center gap-2">
                      <FileClock className="h-4 w-4" />
                      <span className="font-medium">Log</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <LogDisplay
                        className="!w-full h-full"
                        containerClassName="min-h-full"
                      />
                    </div>
                  </motion.div>
                )}

                {activeDrawer === "assets" && (
                  <motion.div
                    key="assets"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex h-full flex-col p-4"
                  >
                    <div className="mb-4 flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      <span className="font-medium">Assets</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <AssetBrowserSidebar
                        onItemClick={(asset) => {
                          closeDrawer();
                        }}
                      />
                    </div>
                  </motion.div>
                )}

                {activeDrawer === "external-node" && (
                  <motion.div
                    key="external-node"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex h-full flex-col gap-2 p-4"
                  >
                    <div className="mb-4 flex items-center gap-2">
                      <BookText className="h-4 w-4" />
                      <span className="font-medium">External API Nodes</span>
                    </div>
                    <span className="mb-4 text-xs leading-snug">
                      External API Nodes are a way to connect to external APIs
                      from within the workflow. Hover to see more details.
                    </span>
                    <ScrollArea className="flex-1">
                      <ExternalNodeDocs />
                    </ScrollArea>
                  </motion.div>
                )}

                {activeDrawer === "model" && (
                  <motion.div
                    key="model"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex h-full flex-col p-4"
                  >
                    <div className="mb-4 flex items-center gap-2">
                      <Box className="h-4 w-4" />
                      <span className="font-medium">Model Check</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <WorkflowModelCheck
                        workflow={JSON.stringify(workflow)}
                        key={workflowUpdateTrigger}
                        onWorkflowUpdate={sendWorkflow}
                      />
                    </div>
                  </motion.div>
                )}

                {activeDrawer === "integration" && (
                  <motion.div
                    key="integration"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex h-full flex-col p-4"
                  >
                    <div className="mb-4 flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      <span className="font-medium">Integration</span>
                    </div>
                    <div className="flex-1">
                      <IntegrationUrl />
                    </div>
                  </motion.div>
                )}

                {activeDrawer === "commit" && url && (
                  <motion.div
                    key="commit"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full"
                  >
                    <WorkflowCommitSidePanel
                      endpoint={url}
                      machine_id={session?.machine_id}
                      machine_version_id={session?.machine_version_id}
                      onClose={() => closeDrawer()}
                    />
                  </motion.div>
                )}

                {activeDrawer === "configuration" && (
                  <motion.div
                    key="configuration"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex h-full flex-col p-4"
                  >
                    <div className="mb-4 flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      <span className="font-medium">
                        Workspace Configuration
                      </span>
                    </div>
                    <div className="flex-1">
                      <WorkspaceConfigurationPanel />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function IntegrationUrl() {
  const sessionId = useSessionIdInSessionView();
  const { data: session } = useQuery<Session>({
    queryKey: ["session", sessionId],
    enabled: !!sessionId,
  });

  const url = useMemo(() => session?.url || session?.tunnel_url, [session]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/50 p-3">
        <div className="truncate text-muted-foreground text-sm">
          {url || "No session URL available"}
        </div>
        {url && (
          <CopyButton text={url} variant="outline" className="shrink-0" />
        )}
      </div>
    </div>
  );
}

function SessionTimerButton({
  workflowId,
  restoreCachedSession,
}: {
  workflowId: string | null;
  restoreCachedSession: () => void;
}) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [_, setUrlSessionId] = useQueryState("sessionId", parseAsString);
  const urlSessionId = useSessionIdInSessionView();

  const effectiveSessionId = getCurrentEffectiveSessionId(workflowId || "");

  const { data: session, refetch } = useQuery<Session>({
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
    e.preventDefault();
    e.stopPropagation();

    const sessionIdToDelete = effectiveSessionId;
    if (!sessionIdToDelete) return;
    setIsPopoverOpen(false);

    try {
      router.navigate({
        to: "/workflows/$workflowId/$view",
        params: { workflowId: workflowId || "", view: "workspace" },
      });
      await deleteSession.mutateAsync({
        sessionId: sessionIdToDelete,
        // waitForShutdown: true,
      });
      setUrlSessionId(null);

      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({
        queryKey: ["session", sessionIdToDelete],
      });

      toast.success("Session ended successfully");
    } catch (error) {
      toast.error("Failed to end session");
    }
  };

  const handleTimerClick = (e: React.MouseEvent) => {
    if (urlSessionId) {
      setIsPopoverOpen(true);
    } else {
      e.preventDefault();
      e.stopPropagation();
      restoreCachedSession();
    }
  };

  const handleRefetch = async () => {
    await refetch();
    return Promise.resolve();
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
          <TimerPopover
            session={activeSession}
            isDeleteSessionPending={deleteSession.isPending}
            onRefetch={handleRefetch}
            open={isPopoverOpen}
            onOpenChange={setIsPopoverOpen}
          >
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
            <div
              className={`relative flex h-10 cursor-pointer items-center justify-between overflow-hidden rounded-full shadow-lg transition-all duration-400 ${
                isLowTime
                  ? "bg-gradient-to-br from-orange-400 to-orange-600 shadow-orange-500/25 hover:shadow-orange-500/40 dark:from-orange-500 dark:to-orange-700 dark:shadow-orange-600/25 dark:hover:shadow-orange-600/40"
                  : "border border-gray-200 bg-gradient-to-br from-white to-white shadow-md dark:border-zinc-800/50 dark:from-gray-700 dark:to-gray-800 dark:shadow-gray-700/25 dark:hover:shadow-gray-700/40"
              }`}
              style={{
                width: isHovered || urlSessionId ? "134px" : "42px",
                paddingLeft: isHovered || urlSessionId ? "6px" : "0px",
                paddingRight: isHovered || urlSessionId ? "12px" : "0px",
                transitionTimingFunction:
                  isHovered || urlSessionId
                    ? "cubic-bezier(0.68, -0.55, 0.265, 1.55)"
                    : "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                transitionDuration:
                  isHovered || urlSessionId ? "400ms" : "200ms",
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={handleTimerClick}
            >
              {/* Timer Icon */}
              {deleteSession.isPending ? (
                <div className="relative flex h-10 w-10 flex-shrink-0 animate-pulse items-center justify-center rounded-full">
                  <Loader2
                    className={cn(
                      "h-5 w-5 animate-spin",
                      isLowTime ? "text-white" : "text-orange-500",
                    )}
                  />
                </div>
              ) : (
                <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-transform duration-150 hover:scale-105 active:scale-95">
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
                </div>
              )}

              {/* Countdown Text and End Button */}
              <div
                className={`flex items-center gap-2 transition-all ${
                  isHovered || urlSessionId
                    ? "translate-x-0 opacity-100"
                    : "translate-x-4 opacity-0"
                }`}
                style={{
                  transitionDelay: isHovered || urlSessionId ? "100ms" : "0ms",
                  transitionDuration:
                    isHovered || urlSessionId ? "300ms" : "150ms",
                  transitionTimingFunction:
                    isHovered || urlSessionId
                      ? "cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                      : "ease-out",
                }}
              >
                <span
                  className={`whitespace-nowrap font-medium text-sm ${
                    isLowTime ? "text-white" : "text-gray-900 dark:text-white"
                  }`}
                >
                  {countdown
                    ? countdown.split(":").slice(1).join(":")
                    : "00:00"}
                </span>

                <ImageInputsTooltip tooltipText="End session">
                  <button
                    type="button"
                    onClick={handleDeleteSession}
                    disabled={deleteSession.isPending}
                    className={`rounded-full p-1 transition-colors duration-200 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50 ${
                      isLowTime
                        ? "text-white hover:text-white"
                        : "text-gray-600 hover:text-red-500 dark:text-gray-300 dark:hover:text-red-400"
                    }`}
                    title="End session"
                  >
                    {deleteSession.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </button>
                </ImageInputsTooltip>
              </div>
            </div>
          </TimerPopover>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TimerPopover({
  session,
  isDeleteSessionPending,
  onRefetch,
  open,
  onOpenChange,
  children,
}: {
  session: Session | undefined;
  isDeleteSessionPending: boolean;
  onRefetch: () => Promise<unknown>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const [selectedIncrement, setSelectedIncrement] = useState("5");
  const sessionId = useSessionIdInSessionView();
  const { countdown } = useSessionTimer(session);

  const [hours, minutes, seconds] = countdown.split(":").map(Number);
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  // Auto-open popover when less than 30 seconds remaining
  useEffect(() => {
    if (totalSeconds > 0 && totalSeconds < 30 && !isDeleteSessionPending) {
      onOpenChange(true);
    }
  }, [totalSeconds, onOpenChange, isDeleteSessionPending]);

  const timeIncrements = [
    { value: "1", label: "1 minute" },
    { value: "5", label: "5 minutes" },
    { value: "10", label: "10 minutes" },
    { value: "15", label: "15 minutes" },
  ];

  const incrementTime = async () => {
    if (!session || !sessionId) {
      toast.error("Session details not found");
      return;
    }

    try {
      await increaseSessionTimeout(sessionId, Number(selectedIncrement));
      onRefetch();
      // Only close the popover when time is increased
      if (totalSeconds >= 30) {
        onOpenChange(false);
      }
    } catch (error) {
      // Error handling is already done in the utility function
      console.error("Failed to increase session timeout:", error);
    }
  };

  // Function to determine text color based on the time remaining
  const getTimeWarningClass = () => {
    if (totalSeconds < 30) {
      return "text-yellow-600";
    }
    return "text-muted-foreground";
  };

  return (
    <Popover
      open={open}
      onOpenChange={(openState) => {
        // Only allow closing the popover if time is >= 30 seconds
        if (totalSeconds < 30 && !openState) {
          return; // Prevent closing when time is < 30 seconds
        }
        onOpenChange(openState);
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-[340px]">
        <span className="font-medium text-sm">Increase Session Time</span>
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center text-muted-foreground text-sm">
              <span className="flex items-center space-x-2">
                Instance:{" "}
                <span className="ml-1 font-medium">{session?.gpu}</span>
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center justify-between rounded-none bg-muted/50 px-2 py-3">
                <div className="flex items-center gap-2">
                  <History className={`h-4 w-4 ${getTimeWarningClass()}`} />
                  <span
                    className={`font-medium text-sm ${getTimeWarningClass()}`}
                  >
                    Time Remaining
                  </span>
                </div>
                {session && (
                  <SessionTimer
                    session={session}
                    size="sm"
                    className={getTimeWarningClass()}
                  />
                )}
              </div>
              {session?.timeout_end && session?.created_at && (
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full transition-all ${
                      totalSeconds < 30 ? "bg-yellow-500" : "bg-primary"
                    }`}
                    style={{
                      width: `${
                        ((new Date(session.timeout_end).getTime() -
                          new Date().getTime()) /
                          (new Date(session.timeout_end).getTime() -
                            new Date(session.created_at).getTime())) *
                        100
                      }%`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Select
              value={selectedIncrement}
              onValueChange={setSelectedIncrement}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Minutes" />
              </SelectTrigger>
              <SelectContent>
                {timeIncrements.map((increment) => (
                  <SelectItem key={increment.value} value={increment.value}>
                    {increment.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={incrementTime} className="flex-1">
              <Plus className="mr-2 h-4 w-4" /> Add Time
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Utility function to increase session timeout
function increaseSessionTimeout(
  sessionId: string | null,
  minutes: number,
): Promise<any> {
  if (!sessionId) {
    return Promise.reject("No session ID provided");
  }

  return callServerPromise(
    api({
      url: `session/${sessionId}/increase-timeout`,
      init: {
        method: "POST",
        body: JSON.stringify({
          minutes: minutes,
        }),
      },
    }),
    {
      loadingText: "Increasing session time...",
      successMessage: "Session time extended",
    },
  );
}

function BackgroundAutoUpdate() {
  const { userId } = useAuth();
  const { hasChanged } = useWorkflowStore();
  const workflowId = useWorkflowIdInWorkflowPage();
  const sessionId = useSessionIdInSessionView();

  // Get all the values we need
  const settings = JSON.parse(
    localStorage.getItem("workspaceConfig") || "{}",
  ) || {
    autoSave: false,
    autoSaveInterval: "60",
    autoExpandSession: false,
  };

  const { data: session, refetch } = useQuery<Session>({
    queryKey: ["session", sessionId],
    enabled: !!sessionId && settings.autoExpandSession,
  });

  const { countdown } = useSessionTimer(session);
  const autoExtendInProgressRef = useRef(false);
  const isLegacyMode = !session?.timeout_end;

  // Auto-save related data
  const machine_id = session?.machine_id;
  const machine_version_id = session?.machine_version_id;
  const session_url = session?.url;
  const endpoint = session?.url || session?.tunnel_url;
  const { value: selectedVersion } = useSelectedVersion(workflowId || "");

  const {
    query,
    setVersion,
    is_fluid_machine,
    comfyui_snapshot,
    comfyui_snapshot_loading,
  } = useGetWorkflowVersionData({
    machine_id,
    machine_version_id,
    session_url,
    workflowId,
  });

  // Store the save function in a ref so it doesn't change
  const saveFunction = useRef<() => Promise<void>>(undefined);

  // Store the extend function in a ref so it doesn't change
  const extendFunction = useRef<() => Promise<void>>(undefined);

  // Update the save function whenever dependencies change
  useEffect(() => {
    saveFunction.current = async () => {
      try {
        await serverAction({
          comment: "Auto Save",
          endpoint,
          machine_id,
          machine_version_id,
          userId,
          workflowId,
          is_fluid_machine,
          query,
          setVersion,
          setOpen: () => {},
          snapshotAction: "COMMIT_ONLY",
          comfyui_snapshot,
          comfyui_snapshot_loading,
          sessionId,
          workflow_api: selectedVersion?.workflow_api,
        });
      } catch (error) {}
    };
  }, [
    endpoint,
    machine_id,
    machine_version_id,
    userId,
    workflowId,
    is_fluid_machine,
    query,
    setVersion,
    comfyui_snapshot,
    comfyui_snapshot_loading,
    sessionId,
    selectedVersion?.workflow_api,
  ]);

  // Update the extend function whenever dependencies change
  useEffect(() => {
    extendFunction.current = async () => {
      if (!sessionId) return;

      try {
        autoExtendInProgressRef.current = true;

        await increaseSessionTimeout(sessionId, 5);
        await refetch();
      } catch (error) {
        toast.error(`Failed to auto-extend session: ${error}`);
      } finally {
        // Add a small delay before allowing another auto-extension
        setTimeout(() => {
          autoExtendInProgressRef.current = false;
        }, 10000);
      }
    };
  }, [sessionId, refetch]);

  // Separate effect for managing the auto-save interval - only depends on stable values
  useEffect(() => {
    let saveIntervalId: NodeJS.Timeout | undefined;

    const { autoSave, autoSaveInterval } = settings;

    if (hasChanged && autoSave && saveFunction.current) {
      saveIntervalId = setInterval(() => {
        if (saveFunction.current) {
          saveFunction.current();
        }
      }, +autoSaveInterval * 1000);
    }

    return () => {
      if (saveIntervalId) {
        clearInterval(saveIntervalId);
        saveIntervalId = undefined;
      }
    };
  }, [settings.autoSave, settings.autoSaveInterval, hasChanged]); // Only stable dependencies

  // Separate effect for monitoring countdown - runs every second but only checks conditions
  useEffect(() => {
    if (
      !settings.autoExpandSession ||
      !sessionId ||
      !countdown ||
      autoExtendInProgressRef.current ||
      isLegacyMode ||
      !extendFunction.current
    ) {
      return;
    }

    const [hours, minutes, seconds] = countdown.split(":").map(Number);
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    if (totalSeconds > 0 && totalSeconds < 60) {
      extendFunction.current();
    }
  }, [countdown, settings.autoExpandSession, sessionId, isLegacyMode]);

  return <></>;
}

// Workspace Configuration Panel Component
function WorkspaceConfigurationPanel() {
  const sessionId = useSessionIdInSessionView();
  // Load settings from localStorage with defaults
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem("workspaceConfig");
    return savedSettings
      ? JSON.parse(savedSettings)
      : {
          autoSave: false,
          autoSaveInterval: "60",
          autoExpandSession: false,
        };
  });
  const { data: session } = useQuery<Session>({
    queryKey: ["session", sessionId],
    enabled: !!sessionId && settings.autoExpandSession,
  });
  const isLegacyMode = !session?.timeout_end;

  // Update settings and save to localStorage
  const updateSettings = useCallback((key: string, value: any) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [key]: value };
      localStorage.setItem("workspaceConfig", JSON.stringify(newSettings));
      return newSettings;
    });
  }, []);
  // Format interval text
  const getIntervalText = () => {
    if (!settings.autoSave) return "";
    return settings.autoSaveInterval === "30"
      ? "30s"
      : settings.autoSaveInterval === "300"
        ? "5m"
        : "1m";
  };

  return (
    <div className="space-y-3">
      {/* Auto Save Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">Auto Save</span>
              {settings.autoSave && (
                <Badge variant="outline" className="h-5 px-2 text-xs">
                  {getIntervalText()}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              Automatically commit workflow changes
            </p>
          </div>
          <Switch
            checked={settings.autoSave}
            onCheckedChange={(checked) => updateSettings("autoSave", checked)}
          />
        </div>

        {settings.autoSave && (
          <div className="ml-4 border-muted border-l-2 pl-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">Interval:</span>
              <Select
                value={settings.autoSaveInterval}
                onValueChange={(value) =>
                  updateSettings("autoSaveInterval", value)
                }
              >
                <SelectTrigger className="h-8 w-24 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30s</SelectItem>
                  <SelectItem value="60">1m</SelectItem>
                  <SelectItem value="300">5m</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Session Management Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-medium text-sm">Auto Expand Session</span>
            <p className="text-muted-foreground text-xs">
              Automatically extend session time when about to expire
            </p>
          </div>
          <Switch
            checked={settings.autoExpandSession}
            onCheckedChange={(checked) =>
              updateSettings("autoExpandSession", checked)
            }
          />
        </div>

        {settings.autoExpandSession && session && (
          <div className="ml-4 border-muted border-l-2 pl-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <span>Status:</span>
              <span className="text-green-600">
                {isLegacyMode ? "Not supported (legacy session)" : "Active"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
