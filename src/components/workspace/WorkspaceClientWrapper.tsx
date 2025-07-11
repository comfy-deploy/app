"use client";

import { useCurrentWorkflow } from "@/hooks/use-current-workflow";
import { useMachine } from "@/hooks/use-machine";
import { getRelativeTime } from "@/lib/get-relative-time";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { easeOut } from "framer-motion";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, ChevronLeft, ChevronUp, Settings } from "lucide-react";
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
import { useSearch } from "@tanstack/react-router";

const ComfyUIFlow = lazy(() =>
  import("../workflow-preview/comfyui-flow").then((mod) => ({
    default: mod.ComfyUIFlow,
  })),
);

interface WorkspaceClientWrapperProps {
  workflow_id: string;
  className?: string;
  isPublic?: boolean;
  onShareWorkflow?: () => void;
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

  const [cachedSessionId, setCachedSessionId] = useState<string | null>(null);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Add state for the description panel
  const [isDescriptionVisible, setIsDescriptionVisible] = useState(true);
  const [isDescriptionHovered, setIsDescriptionHovered] = useState(false);

  const { sessionId } = useSearch({ from: "/workflows/$workflowId/$view" });
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

  // Auto-hide after 5 seconds unless hovered
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isDescriptionHovered) {
        setIsDescriptionVisible(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isDescriptionHovered]);

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
          <div className="relative h-full w-full">
            {/* Full-screen ComfyUI Flow Background */}
            {versionData && (
              <div
                className="absolute inset-0 h-full w-full bg-gray-50 dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-950"
                style={{ touchAction: "auto" }}
              >
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
              </div>
            )}

            {/* Floating Description - Top Left (Desktop Only) */}
            <motion.div
              className="absolute top-[52px] left-4 z-20 hidden w-full max-w-md md:block"
              initial={{ opacity: 0, x: -200 }}
              animate={{
                opacity: isDescriptionVisible ? 1 : 0.8,
                x: isDescriptionVisible ? 0 : -430,
              }}
              transition={{ duration: 0.3, ease: "circOut" }}
              onMouseEnter={() => {
                setIsDescriptionHovered(true);
                setIsDescriptionVisible(true);
              }}
              onMouseLeave={() => {
                setIsDescriptionHovered(false);
              }}
            >
              <div className="rounded-lg bg-white/80 p-4 shadow-lg backdrop-blur-md dark:bg-zinc-800/40">
                <SessionCreatorForm
                  workflowId={props.workflow_id}
                  version={versions[0]?.version ?? 0}
                  defaultMachineId={workflow?.selected_machine_id}
                  defaultMachineVersionId={
                    workflow?.selected_machine_version_id
                  }
                  onShareWorkflow={props.onShareWorkflow}
                  mode="description-only"
                />
              </div>
            </motion.div>

            {/* Desktop Form - Bottom Center */}
            <div className="pointer-events-none absolute right-0 bottom-2 left-0 z-20 hidden md:block">
              <motion.div
                className="pointer-events-auto mx-auto w-full max-w-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.1, ease: "easeInOut" }}
              >
                <div className="rounded-xl bg-white/80 p-4 shadow-lg backdrop-blur-md dark:bg-zinc-800/40">
                  <SessionCreatorForm
                    workflowId={props.workflow_id}
                    version={versions[0]?.version ?? 0}
                    defaultMachineId={workflow?.selected_machine_id}
                    defaultMachineVersionId={
                      workflow?.selected_machine_version_id
                    }
                    onShareWorkflow={props.onShareWorkflow}
                    mode="compact"
                  />
                  <div className="mt-3">
                    <MachineUpdateChecker machineId={machine.id} />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Mobile Form - Bottom */}
            <div className="absolute right-0 bottom-0 left-0 z-20 md:hidden">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.1, ease: "easeInOut" }}
              >
                {/* Single Expanding Mobile Form */}
                <motion.div
                  className="mx-2 rounded-t-xl border-white/20 border-t bg-white/95 shadow-2xl backdrop-blur-md dark:border-zinc-700/50 dark:bg-zinc-900/95"
                  style={{
                    boxShadow:
                      "0 -10px 25px -5px rgba(0, 0, 0, 0.1), 0 -4px 6px -2px rgba(0, 0, 0, 0.05)",
                  }}
                  animate={{
                    height: isMobileDrawerOpen ? "auto" : "auto",
                  }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <div className="p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="line-clamp-1 font-medium text-sm">
                          {workflow?.name || "ComfyUI"}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          v{versions[0]?.version ?? 0}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setIsMobileDrawerOpen(!isMobileDrawerOpen)
                        }
                      >
                        <motion.div
                          animate={{ rotate: isMobileDrawerOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </motion.div>
                      </Button>
                    </div>

                    {/* Always show the main form */}
                    <SessionCreatorForm
                      workflowId={props.workflow_id}
                      version={versions[0]?.version ?? 0}
                      defaultMachineId={workflow?.selected_machine_id}
                      defaultMachineVersionId={
                        workflow?.selected_machine_version_id
                      }
                      onShareWorkflow={props.onShareWorkflow}
                      mode="mobile"
                    />

                    {/* Expandable content */}
                    <AnimatePresence>
                      {isMobileDrawerOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          style={{ overflow: "hidden" }}
                        >
                          <div className="mt-4 border-white/20 border-t pt-4 dark:border-zinc-700/50">
                            <SessionCreatorForm
                              workflowId={props.workflow_id}
                              version={versions[0]?.version ?? 0}
                              defaultMachineId={workflow?.selected_machine_id}
                              defaultMachineVersionId={
                                workflow?.selected_machine_version_id
                              }
                              onShareWorkflow={props.onShareWorkflow}
                              mode="mobile-expanded"
                            />
                            <div className="mt-3">
                              <MachineUpdateChecker machineId={machine.id} />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </motion.div>
            </div>
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
