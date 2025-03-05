import { GalleryView } from "@/components/GalleryView";
import { PaddingLayout } from "@/components/PaddingLayout";
import { MyDrawer } from "@/components/drawer";
import { LoadingWrapper } from "@/components/loading-wrapper";
import { MachineWorkspaceItem } from "@/components/machine-workspace-item";
import { NavItem } from "@/components/nav-bar";
import { useIsAdminAndMember } from "@/components/permissions";
import { Playground, UserIcon } from "@/components/run/SharePageComponent";
import {
  useCreateDeploymentDialog,
  useWorkflowVersion,
} from "@/components/run/VersionSelect";
import { SessionItem } from "@/components/sessions/SessionItem";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Portal } from "@/components/ui/custom/portal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  UnsavedChangesWarning,
  useUnsavedChangesWarning,
} from "@/components/unsaved-changes-warning";
import { VersionList } from "@/components/version-select";
import { RealtimeWorkflowProvider } from "@/components/workflows/RealtimeRunUpdate";
import RunComponent from "@/components/workflows/RunComponent";
import WorkflowComponent from "@/components/workflows/WorkflowComponent";
import {
  ContainersTable,
  getEnvColor,
  useWorkflowDeployments,
} from "@/components/workspace/ContainersTable";
import { DeploymentConfirmation } from "@/components/workspace/DeploymentConfirmation";
import {
  APIDocs,
  DeploymentDrawer,
  DeploymentSettings,
} from "@/components/workspace/DeploymentDisplay";
import type { Deployment } from "@/components/workspace/DeploymentDisplay";
import { useLogStore } from "@/components/workspace/LogContext";
import { LogDisplay } from "@/components/workspace/LogDisplay";
import {
  MachineSessionsList,
  SessionCreationDialog,
} from "@/components/workspace/SessionCreationDialog";
import { useSelectedVersion } from "@/components/workspace/Workspace";
import { WorkspaceStatusBar } from "@/components/workspace/WorkspaceStatusBar";
import { useCurrentWorkflow } from "@/hooks/use-current-workflow";
import { useMachine } from "@/hooks/use-machine";
import { useSessionAPI } from "@/hooks/use-session-api";
import { api } from "@/lib/api";
import { callServerPromise } from "@/lib/call-server-promise";
import { getRelativeTime } from "@/lib/get-relative-time";
import {
  getInputsFromWorkflowAPI,
  getInputsFromWorkflowJSON,
} from "@/lib/getInputsFromWorkflow";
import { cn, getOptimizedImage } from "@/lib/utils";
import { useAuth } from "@clerk/clerk-react";
import { DropdownMenuLabel } from "@radix-ui/react-dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import {
  Link,
  createLazyFileRoute,
  notFound,
  useRouter,
} from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  CircleArrowUp,
  Droplets,
  ExternalLink,
  ImageIcon,
  Info,
  Loader2,
  MoreHorizontal,
  MoreVertical,
  Pencil,
  Play,
  Plus,
  Share,
  Terminal,
  Workflow,
  RotateCw,
} from "lucide-react";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { create } from "zustand";

const pages = [
  "workspace",
  "requests",
  "containers",
  "deployment",
  "playground",
  "gallery",
];

export const Route = createLazyFileRoute("/workflows/$workflowId/$view")({
  component: WorkflowPageComponent,
});

interface SelectedDeploymentState {
  selectedDeployment: string | null;
  setSelectedDeployment: (deployment: string | null) => void;
}

export const useSelectedDeploymentStore = create<SelectedDeploymentState>(
  (set) => ({
    selectedDeployment: null,
    setSelectedDeployment: (deployment) =>
      set({ selectedDeployment: deployment }),
  }),
);

function WorkflowPageComponent() {
  const { workflowId, view: currentView } = Route.useParams();
  const [isEditing, setIsEditing] = useState(false);

  const [mountedViews, setMountedViews] = useState<Set<string>>(
    new Set([currentView]),
  );

  useEffect(() => {
    setMountedViews((prev) => {
      const newSet = new Set(prev);
      newSet.add(currentView);
      return newSet;
    });
  }, [currentView]);

  let view: React.ReactNode;

  const { workflow, isLoading: isWorkflowLoading } =
    useCurrentWorkflow(workflowId);

  const { data: selectedMachine } = useMachine(workflow?.selected_machine_id);

  switch (currentView) {
    case "requests":
      view = (
        <PaddingLayout>
          <RequestPage
            setIsEditing={setIsEditing}
            selectedMachine={selectedMachine}
          />
        </PaddingLayout>
      );
      break;
    case "containers":
      view = (
        <PaddingLayout className="mt-10">
          <ContainersTable workflow_id={workflowId} />
        </PaddingLayout>
      );
      break;
    case "playground":
      view = (
        <PaddingLayout>
          <div className={cn("h-full w-full")}>
            <RealtimeWorkflowProvider workflowId={workflowId}>
              <Playground runOrigin={"manual"} />
            </RealtimeWorkflowProvider>
          </div>
        </PaddingLayout>
      );
      break;
    case "gallery":
      view = <GalleryView workflowID={workflowId} />;
      break;
  }

  const isAdminAndMember = useIsAdminAndMember();

  const tabs = isAdminAndMember ? pages : ["playground", "gallery"];

  const { createSession, listSession, deleteSession } = useSessionAPI(
    workflow?.selected_machine_id,
  );

  const { data: sessions } = listSession;

  const { openMobile: isMobileSidebarOpen, isMobile } = useSidebar();

  const router = useRouter();

  const [sessionId, setSessionId] = useQueryState("sessionId");

  interface Session {
    url?: string;
    // Add other session properties as needed
  }

  const { data: sessionSelected } = useQuery<Session>({
    queryKey: ["session", sessionId],
    enabled: !!sessionId,
  });

  // const { data: deployments, isLoading: isDeploymentsLoading } =
  //   useWorkflowDeployments(workflowId);

  // const [isHovering, setIsHovering] = useState(false);

  return (
    <div className="relative flex h-full w-full flex-col">
      <Portal
        targetId="sidebar-panel"
        trigger={isMobile ? isMobileSidebarOpen : true}
      >
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <SidebarMenu className="px-2">
              {tabs.map((tab) => (
                <SidebarMenuItem key={tab}>
                  <SidebarMenuButton
                    onClick={() => {
                      router.navigate({
                        to: "/workflows/$workflowId/$view",
                        params: { workflowId, view: tab },
                      });
                    }}
                    className={cn(
                      currentView === tab && "bg-gray-200 text-gray-900",
                      "transition-colors",
                    )}
                    asChild
                    // role="button"
                  >
                    <button className="w-full capitalize" type="button">
                      {tab}
                    </button>
                  </SidebarMenuButton>

                  {/* Only render if the current view is workspace */}
                  <AnimatePresence>
                    {typeof currentView === "string" &&
                      currentView === "workspace" &&
                      tab === "workspace" &&
                      sessionSelected && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <WorkspaceStatusBar
                            endpoint={
                              sessionSelected?.url ||
                              process.env.COMFYUI_FRONTEND_URL ||
                              ""
                            }
                            className=""
                            btnsClassName="gap-1"
                          />
                          <SidebarMenu className="">
                            <SidebarMenuItem>
                              <div className="flex items-center gap-0.5">
                                {/* <SidebarMenuButton>
                                  <SessionCreate
                                    workflowId={workflowId}
                                    setSessionId={setSessionId}
                                    asChild={true}
                                  >
                                    <div className="flex items-center gap-0.5">
                                      <Plus size={16} /> Create Session
                                    </div>
                                  </SessionCreate>
                                </SidebarMenuButton> */}
                                {currentView === "workspace" &&
                                  tab === "workspace" &&
                                  sessionSelected && (
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 "
                                        >
                                          <Terminal className="mr-2 h-4 " />{" "}
                                          Logs
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-fit p-2">
                                        <LogDisplay />
                                      </PopoverContent>
                                    </Popover>
                                  )}
                              </div>
                            </SidebarMenuItem>
                          </SidebarMenu>
                        </motion.div>
                      )}
                  </AnimatePresence>

                  {tab === "workspace" && sessions && sessions.length > 0 && (
                    <SidebarMenuSub className="mt-2 mr-0 pr-0">
                      {sessions?.map((session, index) => (
                        <SidebarMenuSubItem key={session.id}>
                          <SidebarMenuSubButton>
                            <SessionItem
                              key={session.id}
                              session={session}
                              index={index}
                              isActive={sessionId === session.session_id}
                              onSelect={(selectedSessionId) => {
                                setSessionId(selectedSessionId);
                                // setView("workspace"); // Switch to workspace view
                                // setActiveTabIndex(tabs.indexOf("workspace")); // Update active tab
                                router.navigate({
                                  to: "/workflows/$workflowId/$view",
                                  params: { workflowId, view: "workspace" },
                                });
                              }}
                              onDelete={async (sessionIdToDelete) => {
                                setSessionId(null);
                                await deleteSession.mutateAsync({
                                  sessionId: sessionIdToDelete,
                                });
                              }}
                            />
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}

                  {/* TODO: Add share options */}
                  {/* {tab === "playground" && isAdminAndMember && (
                <DropdownMenu>
                  {dialog}
                  {privateDialog}
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction className="mr-4">
                      <MoreHorizontal />
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>˝
                  <DropdownMenuContent className="w-56" forceMount>
                    {menuItem}
                    <span className="pointer-events-none opacity-30">
                      {privateMenuItem}
                    </span>
                  </DropdownMenuContent>
                </DropdownMenu>
              )} */}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </motion.div>
        </AnimatePresence>
      </Portal>

      <Portal targetId="nav-bar-items">
        <div className="flex w-full flex-row items-center justify-between gap-2">
          <div className="flex flex-row items-center gap-2">
            <UserIcon user_id={workflow?.user_id} className="h-6 w-6" />
            {workflow?.name && (
              <div className="max-w-[120px] truncate font-bold text-sm">
                {workflow.name}
              </div>
            )}
          </div>
          <div className="flex flex-row gap-2">
            <NavItem
              to="/workflows/$workflowId/requests"
              label="Overview"
              // icon={Workflow}
              params={{ workflowId }}
            />
            {/* <NavItem
              to="/workflows/$workflowId/deployment"
              label="API"
              // icon={Workflow}
              params={{ workflowId }}
            /> */}
            <NavItem
              to="/workflows/$workflowId/playground"
              label="Playground"
              // icon={Workflow}
              params={{ workflowId }}
            />
            <NavItem
              to="/workflows/$workflowId/gallery"
              label="Gallery"
              icon={ImageIcon}
              params={{ workflowId }}
            />
          </div>
        </div>
      </Portal>
      {isWorkflowLoading ? (
        <div className="flex h-full flex-col items-center justify-center">
          <div className="animate-pulse text-muted-foreground">
            Loading workflow...
          </div>
        </div>
      ) : workflow ? (
        <div className="h-full">
          {/* {(!isEditing &&
            currentView !== "gallery" &&
            currentView !== "playground") ||
          (currentView === "playground" &&
            !isDeploymentsLoading &&
            !deployments?.length) ? (
            <MachineWorkspaceItem
              machine={selectedMachine}
              index={0}
              isInWorkspace={true}
            />
          ) : null} */}

          {view}
        </div>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <div className="text-muted-foreground">Workflow not found</div>
          <Link to="/">
            <Button variant="outline">
              <ChevronLeft className="mr-2 h-4 w-4" /> Return
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

// export function VersionDrawer({ workflowId }: { workflowId: string }) {
//   const { selectedDeployment, setSelectedDeployment } =
//     useSelectedDeploymentStore();
//   const { data: deployments } = useWorkflowDeployments(workflowId);
//   const deployment = deployments?.find(
//     (d: Deployment) => d.id === selectedDeployment,
//   );

//   return (
//     <MyDrawer
//       desktopClassName="w-[600px]"
//       open={!!selectedDeployment}
//       onClose={() => {
//         setSelectedDeployment(null);
//       }}
//     >
//       <ScrollArea className="h-full">
//         {deployment && (
//           <DeploymentSettings
//             deployment={deployment}
//             onClose={() => setSelectedDeployment(null)}
//           />
//         )}
//       </ScrollArea>
//     </MyDrawer>
//   );
// }

interface WorkflowDescriptionForm {
  description: string;
}

interface DeploymentConfirmationState {
  isOpen: boolean;
  environment: "production" | "staging" | "public-share" | null;
  workflowVersionId: string | null;
  machineVersionId: string | null;
  machineId: string | null;
}

interface SessionCreationState {
  isOpen: boolean;
  version: string | null;
  machineId: string | null;
  machineVersionId: string | null;
  modalImageId: string | null;
}

function RequestPage({
  setIsEditing,
  selectedMachine,
}: {
  setIsEditing: (isEditing: boolean) => void;
  selectedMachine: any;
}) {
  const { workflowId } = Route.useParams();
  const {
    workflow: currentWorkflow,
    isLoading: isLoadingWorkflow,
    mutateWorkflow,
  } = useCurrentWorkflow(workflowId);
  const { data: deployments, refetch: refetchDeployments } =
    useWorkflowDeployments(workflowId);
  const { data: versions } = useQuery<any>({
    queryKey: ["workflow", workflowId, "versions"],
    meta: {
      params: {
        limit: 1,
        offset: 0,
      },
    },
  });
  const { setSelectedDeployment } = useSelectedDeploymentStore();
  const formRef = useRef<HTMLFormElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [deploymentConfirmation, setDeploymentConfirmation] =
    useState<DeploymentConfirmationState>({
      isOpen: false,
      environment: null,
      workflowVersionId: null,
      machineVersionId: null,
      machineId: null,
    });
  const [sessionCreation, setSessionCreation] = useState<SessionCreationState>({
    isOpen: false,
    version: null,
    machineId: null,
    machineVersionId: null,
    modalImageId: null,
  });
  const router = useRouter();

  const { isSignedIn } = useAuth();

  const defaultValues = useMemo(
    () => ({
      description: currentWorkflow?.description ?? "",
    }),
    [currentWorkflow?.description],
  );

  const form = useForm<WorkflowDescriptionForm>({
    defaultValues,
  });

  const latestVersion = versions && versions.length > 0 ? versions?.[0] : null;

  const { listSession } = useSessionAPI(latestVersion?.machine_id);
  const { data: sessions } = listSession;

  const [isHovering, setIsHovering] = useState(false);

  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (latestVersion) {
      setSelectedVersionId(latestVersion.id);
    }
  }, [latestVersion]);

  // Update form when workflow data is loaded
  useEffect(() => {
    if (!isLoadingWorkflow && currentWorkflow) {
      form.reset({ description: currentWorkflow.description ?? "" });
      setIsDirty(false);
      setIsEditing(false);
    }
  }, [isLoadingWorkflow, currentWorkflow, form, setIsEditing]);

  const { controls } = useUnsavedChangesWarning({
    isDirty,
    isNew: false,
  });

  // Watch for form changes and compare with initial values
  useEffect(() => {
    const timeout = setTimeout(() => {
      const subscription = form.watch((value) => {
        const formValues = form.getValues();
        const isDirty = Object.keys(formValues).some((key) => {
          const formKey = key as keyof WorkflowDescriptionForm;
          const currentValue = String(formValues[formKey]);
          const defaultValue = String(defaultValues[formKey]);
          return currentValue !== defaultValue;
        });
        setIsDirty(isDirty);
        setIsEditing(isDirty);
      });
      return () => subscription.unsubscribe();
    }, 0);

    return () => clearTimeout(timeout);
  }, [form, defaultValues, setIsEditing]);

  const onSubmit = async (data: WorkflowDescriptionForm) => {
    try {
      setIsLoading(true);
      await callServerPromise(
        api({
          url: `workflow/${workflowId}`,
          init: {
            method: "PATCH",
            body: JSON.stringify({
              description: data.description,
            }),
          },
        }),
      );
      setIsDirty(false);
      setIsEditing(false);
      mutateWorkflow();
    } catch (error) {
      toast.error("Failed to update description");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex flex-row">
      <DeploymentDrawer />
      {deploymentConfirmation.isOpen &&
        deploymentConfirmation.environment &&
        deploymentConfirmation.workflowVersionId && (
          <MyDrawer
            desktopClassName="w-[600px]"
            open={deploymentConfirmation.isOpen}
            onClose={() =>
              setDeploymentConfirmation((prev) => ({ ...prev, isOpen: false }))
            }
          >
            <DeploymentConfirmation
              workflowId={workflowId}
              workflowVersionId={deploymentConfirmation.workflowVersionId}
              environment={deploymentConfirmation.environment}
              machineId={
                deploymentConfirmation.machineId ||
                currentWorkflow?.selected_machine_id
              }
              machineVersionId={deploymentConfirmation.machineVersionId}
              description={currentWorkflow?.description}
              onClose={() =>
                setDeploymentConfirmation((prev) => ({
                  ...prev,
                  isOpen: false,
                }))
              }
              onSuccess={(deploymentId) => {
                setDeploymentConfirmation((prev) => ({
                  ...prev,
                  isOpen: false,
                }));
                refetchDeployments();
                setSelectedDeployment(deploymentId);
              }}
            />
          </MyDrawer>
        )}
      {sessionCreation.isOpen && sessionCreation.version && (
        <MyDrawer
          desktopClassName="w-[600px]"
          open={sessionCreation.isOpen}
          onClose={() =>
            setSessionCreation((prev) => ({ ...prev, isOpen: false }))
          }
        >
          <SessionCreationDialog
            workflowId={workflowId}
            version={sessionCreation.version}
            machineId={
              sessionCreation.machineId || currentWorkflow?.selected_machine_id
            }
            modalImageId={sessionCreation.modalImageId}
            machineVersionId={sessionCreation.machineVersionId}
            onClose={() =>
              setSessionCreation((prev) => ({ ...prev, isOpen: false }))
            }
          />
        </MyDrawer>
      )}
      <div className="mx-auto flex h-full w-full max-w-screen-lg flex-col gap-2">
        <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)}>
          <div className="font-medium text-sm">Description</div>
          <div className="flex flex-row gap-4">
            <textarea
              {...form.register("description")}
              className="-ml-2 min-h-[100px] w-full rounded-md p-2 text-muted-foreground outline-none focus:bg-muted/50"
              placeholder="Type a description for your workflow..."
            />

            <div className="group relative aspect-square w-[150px] shrink-0 overflow-hidden rounded-sm bg-gray-100">
              {currentWorkflow?.cover_image ? (
                <>
                  <img
                    src={getOptimizedImage(currentWorkflow.cover_image)}
                    alt="Workflow cover"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <Link
                      to={`/workflows/${workflowId}/gallery`}
                      // @ts-expect-error
                      search={{ action: "set-cover-image" }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-black/20 group-hover:text-white"
                      >
                        Change
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <Link
                  to={`/workflows/${workflowId}/gallery`}
                  // @ts-expect-error
                  search={{ action: "set-cover-image" }}
                  className="flex h-full w-full flex-col items-center justify-center rounded-sm border-2 border-gray-200 border-dashed p-2"
                >
                  <ImageIcon className="h-6 w-6 text-gray-400" />
                  <span className="text-center text-gray-400 text-xs">
                    Upload cover
                  </span>
                </Link>
              )}
            </div>
          </div>
        </form>

        <UnsavedChangesWarning
          isDirty={isDirty}
          isLoading={isLoading}
          onReset={() => {
            form.reset();
            setIsDirty(false);
            setIsEditing(false);
          }}
          onSave={() => formRef.current?.requestSubmit()}
          controls={controls}
        />

        <div className="mt-4 font-medium text-sm">Versions</div>

        <div
          className={cn(
            "relative rounded-t-3xl border-gray-100 border-x border-t border-b-0 bg-gray-50 px-4 pt-2.5 pb-10",
            sessions?.length ? "-mb-6" : "-mb-4",
          )}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <motion.div
            animate={{
              marginBottom: isHovering && sessions?.length ? "-28px" : "-24px",
            }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <div className="flex flex-row items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="text-muted-foreground text-sm">
                  Edit your workflow by starting a session
                </div>
              </div>

              <div className="flex flex-row items-center gap-4">
                {latestVersion?.machine_id && (
                  <div className="flex items-center gap-2">
                    <SessionCount machineId={latestVersion.machine_id} />
                  </div>
                )}
                <Button
                  variant="shine"
                  size="sm"
                  className="rounded-[9px]"
                  disabled={!latestVersion}
                  onClick={() => {
                    if (!isSignedIn) {
                      // Use the clerk hook instead of direct import
                      router.navigate({
                        to: "/sign-in",
                        search: {
                          redirectTo: window.location.href,
                        },
                      });
                      return;
                    }

                    setSessionCreation((prev) => ({
                      ...prev,
                      isOpen: true,
                      version: latestVersion?.version || null,
                      machineId:
                        latestVersion?.machine_id ||
                        currentWorkflow?.selected_machine_id,
                      machineVersionId:
                        latestVersion?.machine_version_id || null,
                      modalImageId: latestVersion?.modal_image_id || null,
                    }));
                  }}
                >
                  Edit
                  {latestVersion?.version && (
                    <Badge className="ml-2 bg-gray-300 py-0.5">
                      v{latestVersion?.version}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>

            {latestVersion?.machine_id && sessions && sessions?.length > 0 && (
              <motion.div
                className="mt-2 overflow-hidden"
                initial={{ height: 0, opacity: 0 }}
                animate={{
                  height: isHovering ? "auto" : 0,
                  opacity: isHovering ? 1 : 0,
                }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <div className="rounded-t-lg border border-gray-200 bg-zinc-100 p-1 shadow-inner">
                  <MachineSessionsList machineId={latestVersion?.machine_id} />
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        <VersionList
          hideSearch
          workflow_id={workflowId || ""}
          className="relative z-[1] w-full rounded-md bg-background p-1 ring-1 ring-gray-200"
          containerClassName="max-h-[234px]"
          height={30}
          renderItem={(item) => {
            const myDeployments = deployments?.filter(
              (deployment: Deployment) =>
                deployment.workflow_version_id === item.id,
            );
            const isProductionDeployed =
              myDeployments?.some(
                (deployment: Deployment) =>
                  deployment.environment === "production",
              ) ?? false;
            const isPublicShareDeployed =
              myDeployments?.some(
                (deployment: Deployment) =>
                  deployment.environment === "public-share",
              ) ?? false;

            // Check if this item is selected
            const isSelected = selectedVersionId === item.id;

            // Extract the edit function
            const handleEditVersion = () => {
              if (selectedMachine?.type === "comfy-classic") {
                return; // Disabled condition
              }

              setSessionCreation({
                isOpen: true,
                version: item.version,
                machineId: item.machine_id,
                machineVersionId: item.machine_version_id,
                modalImageId: item.modal_image_id,
              });
            };

            return (
              // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
              <div
                className={cn(
                  "flex flex-row items-center justify-between gap-2 rounded-[6px] px-4 transition-colors hover:bg-gray-100",
                  isSelected && "bg-gray-200 hover:bg-gray-200",
                  item.version === 1 && "rounded-b-sm",
                  item.version === versions?.[versions.length - 1]?.version &&
                    "rounded-t-sm",
                )}
                onClick={() => {
                  setSelectedVersionId(item.id);
                }}
                onDoubleClick={() => {
                  handleEditVersion();
                }}
              >
                <div className="grid grid-cols-[14px_38px_auto_1fr] items-center gap-4">
                  <div className="flex h-full items-center justify-center">
                    {versions && (
                      <>
                        <div
                          className={cn(
                            "absolute w-[2px] bg-gray-300",
                            item.version === 1
                              ? "top-0 h-[50%]"
                              : item.version === versions?.[0]?.version
                                ? "bottom-0 h-[50%]"
                                : "h-full",
                          )}
                        />
                        <div className="relative z-10 flex h-[6px] w-[6px] items-center justify-center rounded-full bg-gray-300" />
                      </>
                    )}
                  </div>

                  <Badge className="!py-0 !text-2xs w-fit whitespace-nowrap rounded-sm">
                    v{item.version}
                  </Badge>

                  <div className="truncate text-muted-foreground text-xs">
                    {item.comment}
                  </div>
                </div>
                <div className="grid grid-cols-[auto_auto_110px_30px] items-center gap-4">
                  {myDeployments?.length > 0 ? (
                    <div className="flex flex-row gap-2">
                      {myDeployments.map((deployment: Deployment) => (
                        <Badge
                          key={deployment.id}
                          className={cn(
                            "w-fit cursor-pointer whitespace-nowrap rounded-md border border-gray-200 bg-gray-100 text-xs hover:shadow-sm",
                            getEnvColor(deployment.environment),
                          )}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.nativeEvent.preventDefault();
                            e.nativeEvent.stopPropagation();

                            setSelectedDeployment(deployment.id);
                          }}
                        >
                          {!!deployment.modal_image_id ? (
                            <div className="flex items-center gap-1">
                              <div className="rounded-full bg-blue-100 p-0.5">
                                <Droplets
                                  strokeWidth={2}
                                  className="h-[12px] w-[12px] text-blue-600"
                                />
                              </div>
                              {deployment.environment}
                            </div>
                          ) : (
                            deployment.environment
                          )}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div />
                  )}
                  <UserIcon user_id={item.user_id} className="h-5 w-5" />
                  <div className="whitespace-nowrap text-2xs text-muted-foreground">
                    {getRelativeTime(item.created_at)}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      className="h-full w-full rounded-sm p-2 hover:bg-gray-50"
                      onClick={(e) => e.stopPropagation()} // Prevent triggering the row click
                    >
                      <MoreVertical size={16} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-52 overflow-visible">
                      {item.machine_version_id ? (
                        <DropdownMenuItem className="p-0">
                          <TooltipProvider>
                            <Tooltip delayDuration={0}>
                              <TooltipTrigger asChild>
                                {/* biome-ignore lint/a11y/noNoninteractiveTabindex: <explanation> */}
                                <span tabIndex={0} className="w-full">
                                  <Button
                                    variant={"ghost"}
                                    className="w-full justify-between px-2 font-normal"
                                    hideLoading={true}
                                    disabled={isProductionDeployed}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      e.nativeEvent.preventDefault();
                                      e.nativeEvent.stopPropagation();
                                      setDeploymentConfirmation({
                                        isOpen: true,
                                        environment: "production",
                                        workflowVersionId: item.id,
                                        machineVersionId:
                                          item.machine_version_id,
                                        machineId:
                                          myDeployments?.find(
                                            (deployment: Deployment) =>
                                              deployment.environment ===
                                              "production",
                                          )?.machine_id ?? null,
                                      });
                                    }}
                                  >
                                    Promote to Production
                                    <CircleArrowUp className="h-4 w-4" />
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              {isProductionDeployed && (
                                <TooltipContent side="left">
                                  <p>
                                    This workflow is already promoted to
                                    production. <br />
                                    Click the{" "}
                                    <Badge variant="blue">production</Badge> to
                                    view details.
                                  </p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </DropdownMenuItem>
                      ) : (
                        <>
                          <DropdownMenuItem
                            className="p-0"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              e.nativeEvent.preventDefault();
                              e.nativeEvent.stopPropagation();
                              setDeploymentConfirmation({
                                isOpen: true,
                                environment: "production",
                                workflowVersionId: item.id,
                                machineVersionId: null,
                                machineId:
                                  myDeployments?.find(
                                    (deployment: Deployment) =>
                                      deployment.environment === "production",
                                  )?.machine_id ?? null,
                              });
                            }}
                          >
                            <Button
                              variant={"ghost"}
                              className="w-full justify-between gap-2 px-2 font-normal"
                            >
                              <div className="flex flex-row gap-2">
                                Promote to
                                <Badge variant="blue">production</Badge>
                              </div>
                            </Button>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="p-0"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              e.nativeEvent.preventDefault();
                              e.nativeEvent.stopPropagation();
                              setDeploymentConfirmation({
                                isOpen: true,
                                environment: "staging",
                                workflowVersionId: item.id,
                                machineVersionId: null,
                                machineId:
                                  myDeployments?.find(
                                    (deployment: Deployment) =>
                                      deployment.environment === "staging",
                                  )?.machine_id ?? null,
                              });
                            }}
                          >
                            <Button
                              variant={"ghost"}
                              className="w-full justify-between gap-2 px-2 font-normal"
                            >
                              <div className="flex flex-row gap-2">
                                Promote to
                                <Badge variant="yellow">staging</Badge>
                              </div>
                            </Button>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem className="p-0">
                        <TooltipProvider>
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              {/* biome-ignore lint/a11y/noNoninteractiveTabindex: <explanation> */}
                              <span tabIndex={0} className="w-full">
                                <Button
                                  variant={"ghost"}
                                  className="w-full justify-between px-2 font-normal"
                                  hideLoading={true}
                                  disabled={
                                    isPublicShareDeployed ||
                                    !item.machine_version_id
                                  }
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.nativeEvent.preventDefault();
                                    e.nativeEvent.stopPropagation();
                                    setDeploymentConfirmation({
                                      isOpen: true,
                                      environment: "public-share",
                                      workflowVersionId: item.id,
                                      machineVersionId: item.machine_version_id,
                                      machineId:
                                        myDeployments?.find(
                                          (deployment: Deployment) =>
                                            deployment.environment ===
                                            "public-share",
                                        )?.machine_id ?? null,
                                    });
                                  }}
                                >
                                  Share
                                  <Share className="h-4 w-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            {isPublicShareDeployed && (
                              <TooltipContent side="left">
                                <p>
                                  This workflow is already shared. <br />
                                  Click the{" "}
                                  <Badge variant="secondary">
                                    public-share
                                  </Badge>{" "}
                                  to view details.
                                </p>
                              </TooltipContent>
                            )}
                            {!item.machine_version_id && (
                              <TooltipContent side="left">
                                <p>
                                  Try to save a new workspace and version
                                  <br />
                                  to share your workflow!
                                </p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <TooltipProvider>
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger asChild>
                            <DropdownMenuItem className="p-0">
                              <Button
                                variant={"ghost"}
                                className="w-full justify-between px-2 font-normal"
                                disabled={
                                  selectedMachine?.type === "comfy-classic"
                                }
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  e.nativeEvent.preventDefault();
                                  e.nativeEvent.stopPropagation();
                                  handleEditVersion();
                                }}
                              >
                                <div className="flex flex-row gap-2">
                                  Edit
                                  <Badge variant="secondary">
                                    v{item.version}
                                  </Badge>
                                </div>
                              </Button>
                            </DropdownMenuItem>
                          </TooltipTrigger>
                          {selectedMachine?.type === "comfy-classic" && (
                            <TooltipContent side="left">
                              <p>
                                Workflow editing is not supported on classic
                                machines.
                                <br />
                                Please select a different machine type.
                              </p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                      {item.workflow && (
                        <DropdownMenuItem className="p-0">
                          <Button
                            variant={"ghost"}
                            className="w-full justify-between px-2 font-normal"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              e.nativeEvent.preventDefault();
                              e.nativeEvent.stopPropagation();
                              navigator.clipboard.writeText(
                                JSON.stringify(item.workflow),
                              );
                              toast.success(
                                "Workflow JSON copied to clipboard",
                              );
                            }}
                          >
                            <div className="flex flex-row gap-2">
                              Copy Workflow (JSON)
                            </div>
                          </Button>
                        </DropdownMenuItem>
                      )}
                      {item.workflow_api && (
                        <DropdownMenuItem className="p-0">
                          <Button
                            variant={"ghost"}
                            className="w-full justify-between px-2 font-normal"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              e.nativeEvent.preventDefault();
                              e.nativeEvent.stopPropagation();
                              navigator.clipboard.writeText(
                                JSON.stringify(item.workflow_api),
                              );
                              toast.success("Workflow API copied to clipboard");
                            }}
                          >
                            <div className="flex flex-row gap-2">
                              Copy Workflow (API)
                            </div>
                          </Button>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          }}
        />
        <div className="mt-4 font-medium text-sm">Queues</div>
        <motion.div
          layout
          className={cn(
            "flex h-full w-full flex-row gap-4 overflow-hidden rounded-md ring-1 ring-gray-200 lg:flex-row",
          )}
        >
          <RealtimeWorkflowProvider workflowId={workflowId}>
            <RunComponent />
          </RealtimeWorkflowProvider>
        </motion.div>
      </div>
      <WorkflowComponent />
    </div>
  );
}

export function WorkflowsBreadcrumb() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <Link href="/">Home</Link>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1">
              <span>Workflows</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>
                <Link href="/machines">Machines</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/storage">Storage</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function SessionCount({ machineId }: { machineId: string }) {
  const { listSession } = useSessionAPI(machineId);
  const { data: sessions } = listSession;

  if (!sessions?.length) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex h-4 w-4 items-center justify-center">
        <div className="h-2 w-2 rounded-full bg-green-500" />
        <RotateCw className="absolute h-4 w-4 animate-spin text-green-500 opacity-50" />
      </div>
      <span className="text-xs text-muted-foreground">
        {sessions.length} active
      </span>
    </div>
  );
}
