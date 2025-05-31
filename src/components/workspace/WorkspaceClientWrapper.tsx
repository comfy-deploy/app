"use client";

import { useCurrentWorkflow } from "@/hooks/use-current-workflow";
import { useMachine } from "@/hooks/use-machine";
import { getRelativeTime } from "@/lib/get-relative-time";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { easeOut } from "framer-motion";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { ChevronLeft } from "lucide-react";
import { useQueryState } from "nuqs";
import { lazy, useEffect, useState } from "react";
import { MyDrawer } from "../drawer";
import { VersionChecker } from "../machine/version-checker";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { LoadingIcon } from "../ui/custom/loading-icon";
import { useWorkflowVersion } from "../workflow-list";
import { SessionCreator } from "./SessionView";
import { WorkspaceLoading, WorkspaceMachineLoading } from "./WorkspaceLoading";
import { SessionCreationDialog } from "./session-creator-dialog";
import { SessionCreatorForm } from "./session-creator-form";
import { ErrorBoundary } from "../error-boundary";
import { AlertTriangle, RefreshCw } from "lucide-react";

const ComfyUIFlow = lazy(() =>
  import("../workflow-preview/comfyui-flow").then((mod) => ({
    default: mod.ComfyUIFlow,
  })),
);

interface WorkspaceClientWrapperProps {
  workflow_id: string;
  className?: string;
  isPublic?: boolean;
}

interface MachineUpdateCheckerProps {
  machineId: string;
}

interface WorkflowVersion {
  version: number;
  id: string;
  created_at: string;
}

function MachineUpdateChecker({ machineId }: MachineUpdateCheckerProps) {
  return (
    <VersionChecker
      machineId={machineId}
      variant="inline"
      onUpdate={() => {
        const url = `/machines/${machineId}?action=update-custom-nodes`;
        window.open(url, "_blank");
      }}
    />
  );
}

export function WorkspaceClientWrapper({
  ...props
}: WorkspaceClientWrapperProps) {
  const [sessionCreation, setSessionCreation] = useState({
    isOpen: false,
    version: 0,
    machineId: "",
    modalImageId: "",
    machineVersionId: "",
  });

  const [showPreview, setShowPreview] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  const [cachedSessionId, setCachedSessionId] = useState<string | null>(null);
  const [hasActiveSession, setHasActiveSession] = useState(false);

  const [sessionId, setSessionId] = useQueryState("sessionId");
  const { data: selectedSession } = useQuery({
    enabled: !!sessionId,
    queryKey: ["session", sessionId],
  });

  const {
    workflow,
    mutateWorkflow,
    isLoading: isLoadingWorkflow,
  } = useCurrentWorkflow(props.workflow_id);

  const { data: versions, isLoading: isLoadingVersions } = useQuery<
    WorkflowVersion[]
  >({
    enabled: !!props.workflow_id,
    queryKey: ["workflow", props.workflow_id, "versions"],
    queryKeyHashFn: (queryKey) => [...queryKey, "latest"].toString(),
    meta: {
      limit: 1,
    },
  });

  const [version] = useQueryState("version", {
    defaultValue: String(workflow?.versions[0].version ?? 1),
  });

  const { data: versionData, status } = useQuery<any>({
    queryKey: ["workflow", props.workflow_id, "version", version.toString()],
  });

  const { data: machine, isLoading } = useQuery<any>({
    queryKey: ["machine", workflow?.selected_machine_id],
    enabled: !!workflow?.selected_machine_id,
    refetchInterval: (data) => {
      return data?.state.data?.type === "comfy-deploy-serverless" &&
        !["ready", "error"].includes(data?.state.data?.status)
        ? 2000
        : false;
    },
  });

  useEffect(() => {
    if (sessionId && selectedSession) {
      setHasActiveSession(true);
      setCachedSessionId(sessionId);
    }
  }, [sessionId, selectedSession]);

  useEffect(() => {
    setHasActiveSession(false);
    setCachedSessionId(null);
  }, []);

  if (isLoadingWorkflow || isLoading || isLoadingVersions || !versions) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <LoadingIcon />
      </div>
    );
  }

  if (!machine && !isLoading && !isLoadingWorkflow)
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center",
          props.className,
        )}
      >
        No machine selected, please select a machine at the bottom left.
      </div>
    );

  if (
    machine?.type === "comfy-deploy-serverless" &&
    machine?.status === "building"
  )
    return (
      <WorkspaceMachineLoading
        machine={machine}
        endpoint={`${process.env.NEXT_PUBLIC_CD_API_URL}/api/machine`}
      />
    );

  const machineBuilderVersion = machine?.machine_builder_version;

  if (Number.parseInt(machineBuilderVersion) >= 4) {
    return (
      <>
        {/* <div className="absolute inset-x-0 bottom-0 z-0 mx-auto max-w-xl">
        </div> */}
        <MyDrawer
          desktopClassName="w-[600px]"
          open={sessionCreation.isOpen}
          onClose={() =>
            setSessionCreation((prev) => ({ ...prev, isOpen: false }))
          }
        >
          <div className="flex h-full flex-col">
            <div className="mb-4 flex-none">
              <SessionCreationDialog
                workflowId={props.workflow_id}
                version={sessionCreation.version}
                machineId={sessionCreation.machineId}
                modalImageId={sessionCreation.modalImageId ?? undefined}
                machineVersionId={sessionCreation.machineVersionId ?? undefined}
                onClose={() =>
                  setSessionCreation((prev) => ({ ...prev, isOpen: false }))
                }
              />
            </div>
          </div>
        </MyDrawer>

        <motion.div
          className={cn(
            "absolute inset-0 z-[10] h-full w-full bg-[#141414]",
            sessionId ? "pointer-events-auto" : "pointer-events-none",
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: sessionId ? 1 : 0 }}
          transition={{ duration: 0.2, ease: easeOut }}
        >
          <motion.div
            className="pointer-events-none absolute inset-0 backdrop-blur-sm"
            style={{
              backgroundImage: `linear-gradient(#2c2c2c 1px, transparent 1px),
                        linear-gradient(90deg, #2c2c2c 1px, transparent 1px)`,
              backgroundSize: "20px 20px",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: hasActiveSession ? 0.2 : 0 }}
            transition={{ duration: 0.5, ease: easeOut }}
          />
          {hasActiveSession && cachedSessionId ? (
            <SessionCreator
              workflowId={props.workflow_id}
              sessionIdOverride={cachedSessionId}
            />
          ) : (
            <></>
          )}
        </motion.div>

        {!sessionId ? (
          <div className="flex h-full w-full items-center justify-center">
            <motion.div
              className="pt-20 mx-auto flex h-full w-full max-w-xl px-4 flex-col gap-4 z-30"
              // layout
            >
              <div className="flex items-center justify-between">
                <SessionCreatorForm
                  workflowId={props.workflow_id}
                  version={versions[0]?.version ?? 0}
                  defaultMachineId={workflow?.selected_machine_id}
                  defaultMachineVersionId={
                    workflow?.selected_machine_version_id
                  }
                />
              </div>
              <MachineUpdateChecker machineId={machine.id} />
            </motion.div>
            <Button
              variant="ghost"
              onClick={() => setShowPreview(!showPreview)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hidden md:block"
            >
              {showPreview ? (
                <ChevronRight size={20} />
              ) : (
                <ChevronLeft size={20} />
              )}
            </Button>
            {versionData && (
              <motion.div
                className="relative my-2 hidden h-full w-full items-center justify-center overflow-hidden rounded-l-lg border border-1 bg-gray-50 shadow-lg md:flex dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-950"
                // layout={showPreview}
                animate={{
                  opacity: showPreview ? 1 : 0,
                  x: showPreview ? 0 : +20,
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                onAnimationStart={() => setIsAnimating(true)}
                onAnimationComplete={() => setIsAnimating(false)}
                style={{
                  pointerEvents: showPreview ? "auto" : "none",
                  position: isAnimating
                    ? "relative"
                    : showPreview
                      ? "relative"
                      : "absolute",
                }}
              >
                {showPreview && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPreview(false)}
                    className="absolute top-2 left-2 z-10 bg-white/80 shadow-sm hover:bg-white dark:bg-zinc-800/80 dark:hover:bg-zinc-800"
                  >
                    <ChevronRight size={20} />
                  </Button>
                )}
                <ErrorBoundary
                  fallback={(error) => (
                    <div className="flex h-full w-full flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50/50 p-4 text-center">
                      <div className="mb-4 text-primary">
                        <RefreshCw className="mx-auto h-10 w-10" />
                      </div>
                      <h3 className="mb-2 font-medium text-lg">
                        New update available
                      </h3>
                      <p className="mb-4 text-muted-foreground text-sm">
                        Please refresh the page to get the latest update
                      </p>
                      <Button
                        onClick={() => window.location.reload()}
                        variant="default"
                        className="gap-2"
                      >
                        <RefreshCw size={16} />
                        Refresh page
                      </Button>
                    </div>
                  )}
                >
                  <ComfyUIFlow
                    workflow={versionData.workflow}
                    apiFormat={versionData.workflow_api}
                  />
                </ErrorBoundary>
              </motion.div>
            )}
          </div>
        ) : (
          <></>
        )}
      </>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center",
        props.className,
      )}
    >
      Machine builder version{" "}
      <Badge className="mx-2">{machineBuilderVersion}</Badge> and{" "}
      <Badge className="mx-2">{machine?.type}</Badge> is not supported for
      workflow preview.
    </div>
  );
}
