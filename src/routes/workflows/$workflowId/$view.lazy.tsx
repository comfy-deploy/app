import { GalleryView } from "@/components/GalleryView";
import { PaddingLayout } from "@/components/PaddingLayout";
import type { AssetType } from "@/components/SDInputs/sd-asset-input";
import { GuideDialog } from "@/components/guide/GuideDialog";
import {
  DeploymentDialog,
  DeploymentPage,
  useSelectedDeploymentStore,
} from "@/components/deployment/deployment-page";
import { ShareWorkflowDialog } from "@/components/share-workflow-dialog";
import { MachineVersionWrapper } from "@/components/machine/machine-overview";
import { MachineTopStickyBar } from "@/components/machine/machine-page";
import { MachineSettingsWrapper } from "@/components/machine/machine-settings";
import { useIsAdminAndMember } from "@/components/permissions";
import { Playground } from "@/components/run/SharePageComponent";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Portal } from "@/components/ui/custom/portal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Tooltip,
} from "@/components/ui/tooltip";
import { FileURLRender } from "@/components/workflows/OutputRender";
import { RealtimeWorkflowProvider } from "@/components/workflows/RealtimeRunUpdate";
import RunComponent from "@/components/workflows/RunComponent";
import WorkflowComponent from "@/components/workflows/WorkflowComponent";
import {
  ContainersTable,
  getEnvColor,
} from "@/components/workspace/ContainersTable";
import { useWorkflowDeployments } from "@/components/workspace/ContainersTable";
import { DeploymentDrawer } from "@/components/workspace/DeploymentDisplay";
import {
  useAssetsBrowserStore,
  useSelectedVersion,
} from "@/components/workspace/Workspace";
import { WorkspaceClientWrapper } from "@/components/workspace/WorkspaceClientWrapper";
import { useCurrentWorkflow } from "@/hooks/use-current-workflow";
import { useMachine } from "@/hooks/use-machine";
import { useSessionAPI } from "@/hooks/use-session-api";
import { api } from "@/lib/api";
import { callServerPromise } from "@/lib/call-server-promise";
import { queryClient } from "@/lib/providers";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Link, createLazyFileRoute, useRouter } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ImageIcon, Lock, Share } from "lucide-react";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useIsDeploymentAllowed } from "@/hooks/use-current-plan";
import { PricingPage } from "@/routes/pricing";
import { useCurrentPlanQuery } from "@/hooks/use-current-plan";
import { LoadingIcon } from "@/components/loading-icon";
import { StoragePage } from "@/routes/models";

interface Version {
  id: string;
  comfyui_snapshot: string;
  version: number;
  machine_id: string;
  machine_version_id: string;
  modal_image_id: string;
  comment: string;
  created_at: string;
  user_id: string;
  workflow: string;
  workflow_api: string;
}

interface Deployment {
  id: string;
  environment: string;
  workflow_id: string;
  workflow_version_id: string;
  gpu: string;
  concurrency_limit: number;
  run_timeout: number;
  idle_timeout: number;
  keep_warm: number;
  modal_image_id?: string;
  version?: {
    version: number;
  };
  dub_link?: string;
  machine_id: string;
  created_at: string;
  updated_at: string;
  machine: {
    name: string;
  };
}

// const pages = [
//   "workspace",
//   "requests",
//   // "containers",
//   "deployment",
//   "playground",
//   "gallery",
// ];

const workspace = ["workspace", "playground", "gallery", "machine", "model"];
const deployment = ["deployment", "requests"];

export const Route = createLazyFileRoute("/workflows/$workflowId/$view")({
  component: WorkflowPageComponent,
});

function WorkflowPageComponent() {
  const { workflowId, view: currentView } = Route.useParams();
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const { setSelectedDeployment, selectedDeployment } =
    useSelectedDeploymentStore();
  const { data: versions } = useQuery<Version[]>({
    queryKey: ["workflow", workflowId, "versions"],
    meta: {
      params: {
        limit: 1,
        offset: 0,
      },
    },
  });
  const { data: deployments } = useWorkflowDeployments(workflowId);

  const [mountedViews, setMountedViews] = useState<Set<string>>(
    new Set([currentView]),
  );

  // Call all hooks first before any conditional logic
  const { workflow } = useCurrentWorkflow(workflowId);
  const { data: machine } = useMachine(workflow?.selected_machine_id);
  const { value: version } = useSelectedVersion(workflowId);
  const isAdminAndMember = useIsAdminAndMember();
  const { isLoading: isPlanLoading } = useCurrentPlanQuery();
  const isDeploymentAllowed = useIsDeploymentAllowed();
  const { openMobile: isMobileSidebarOpen, isMobile } = useSidebar();
  const [sessionId, setSessionId] = useQueryState("sessionId");
  const { setOpen: setAssetsOpen, setOnAssetSelect } = useAssetsBrowserStore();

  // All other hooks and state...
  const publicShareDeployment = deployments?.find(
    (d: Deployment) => d.environment === "public-share",
  );
  const communityShareDeployment = deployments?.find(
    (d: Deployment) => d.environment === "community-share",
  );
  const privateShareDeployment = deployments?.find(
    (d: Deployment) => d.environment === "private-share",
  );

  const handleAsset = async (asset: AssetType) => {
    try {
      await callServerPromise(
        api({
          url: `workflow/${workflowId}`,
          init: {
            method: "PATCH",
            body: JSON.stringify({ cover_image: asset.url }),
          },
        }),
      );
      toast.success("Cover image updated!");
      queryClient.invalidateQueries({
        queryKey: ["workflow", workflowId],
      });
    } catch (error) {
      toast.error("Failed to update cover image");
    } finally {
      setOnAssetSelect(null);
      setAssetsOpen(false);
    }
  };

  // Define allowed views based on permissions
  const allowedViews = isAdminAndMember
    ? [
        "workspace",
        "playground",
        "gallery",
        "machine",
        "model",
        "requests",
        "deployment",
      ]
    : ["playground", "gallery"];

  // Permission check and redirect - do this after all hooks are called
  useEffect(() => {
    if (!allowedViews.includes(currentView)) {
      // Redirect to playground as the default allowed view
      router.navigate({
        to: "/workflows/$workflowId/$view",
        params: { workflowId, view: "playground" },
        replace: true,
      });
    }
  }, [isAdminAndMember, currentView, router, workflowId, allowedViews]);

  useEffect(() => {
    if (currentView === "gallery") {
      return;
    }
    setMountedViews((prev) => {
      const newSet = new Set(prev);
      newSet.add(currentView);
      return newSet;
    });
  }, [currentView]);

  // If user doesn't have permission for current view, show loading while redirecting
  if (!allowedViews.includes(currentView)) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <LoadingIcon />
      </div>
    );
  }

  let view: React.ReactNode;

  switch (currentView) {
    case "requests":
      view = (
        <PaddingLayout>
          {isPlanLoading ? (
            <div className="flex h-full w-full items-center justify-center">
              <LoadingIcon />
            </div>
          ) : !isDeploymentAllowed ? (
            <PricingPage />
          ) : (
            <RequestPage />
          )}
        </PaddingLayout>
      );
      break;
    case "deployment":
      view = (
        <PaddingLayout className="pt-4">
          {isPlanLoading ? (
            <div className="flex h-full w-full items-center justify-center">
              <LoadingIcon />
            </div>
          ) : !isDeploymentAllowed ? (
            <PricingPage />
          ) : (
            <>
              <GuideDialog guideType="deployment" />
              <DeploymentPage />
            </>
          )}
        </PaddingLayout>
      );
      break;
    case "playground":
      view = (
        <PaddingLayout>
          <div className={cn("h-full w-full")}>
            {workflow?.selected_machine_id && version?.id && (
              <RealtimeWorkflowProvider workflowId={workflowId}>
                <Playground runOrigin={"manual"} workflow={workflow} />
              </RealtimeWorkflowProvider>
            )}
          </div>
        </PaddingLayout>
      );
      break;
    case "gallery":
      view = <GalleryView workflowID={workflowId} />;
      break;
    case "machine":
      view = machine && (
        <>
          {/* <MachineTopStickyBar machine={machine} /> */}
          <div className="mx-auto mt-14 w-full max-w-screen-lg">
            <MachineVersionWrapper machine={machine} />
            <MachineSettingsWrapper
              title="Machine Settings"
              machine={machine}
              readonly={!isAdminAndMember}
              className="top-0"
            />
          </div>
        </>
      );
      break;
    case "model":
      view = <StoragePage isWorkflowPage={true} />;
      break;
  }

  const tabs = isAdminAndMember ? workspace : ["playground", "gallery"];

  return (
    <div className="relative flex h-full w-full flex-col">
      <Portal
        targetId="sidebar-panel"
        trigger={isMobile || !!sessionId ? isMobileSidebarOpen : true}
      >
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <SidebarGroup>
              {/* <SidebarGroupLabel>Workspace</SidebarGroupLabel> */}
              <SidebarGroupContent>
                <SidebarMenu className="px-1">
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
                          "group/my-nav-item",
                          currentView === tab
                            ? "bg-gray-200 text-gray-900 dark:bg-zinc-800 dark:text-gray-100"
                            : "text-gray-500 dark:text-gray-400",
                          "capitalize transition-colors",
                        )}
                      >
                        {tab === "workspace"
                          ? "Workflow"
                          : tab === "machine"
                            ? "Environment"
                            : tab}

                        {tab === "playground" && (
                          <div className="ml-auto flex items-center gap-2">
                            {publicShareDeployment && (
                              <Badge
                                className={cn(
                                  "!text-2xs w-fit cursor-pointer whitespace-nowrap rounded-md hover:shadow-sm",
                                  getEnvColor(
                                    publicShareDeployment.environment,
                                  ),
                                )}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSelectedDeployment(
                                    publicShareDeployment.id,
                                  );
                                }}
                              >
                                Shared
                              </Badge>
                            )}
                            {communityShareDeployment && (
                              <Badge
                                className={cn(
                                  "!text-2xs w-fit cursor-pointer whitespace-nowrap rounded-md hover:shadow-sm",
                                  getEnvColor(
                                    communityShareDeployment.environment,
                                  ),
                                )}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSelectedDeployment(
                                    communityShareDeployment.id,
                                  );
                                }}
                              >
                                Community
                              </Badge>
                            )}
                            {privateShareDeployment && (
                              <Badge
                                className={cn(
                                  "!text-2xs w-fit cursor-pointer whitespace-nowrap rounded-md hover:shadow-sm",
                                  getEnvColor(
                                    privateShareDeployment.environment,
                                  ),
                                )}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSelectedDeployment(
                                    privateShareDeployment.id,
                                  );
                                }}
                              >
                                Internal
                              </Badge>
                            )}
                            {!publicShareDeployment &&
                              !privateShareDeployment &&
                              !communityShareDeployment && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="opacity-0 transition-all hover:bg-gray-200 group-hover/my-nav-item:opacity-100 dark:hover:bg-zinc-600/40"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (versions?.[0]) {
                                      setSelectedVersion(versions[0]);
                                      setIsDrawerOpen(true);
                                    }
                                  }}
                                >
                                  <Share className="h-4 w-4" />
                                </Button>
                              )}
                          </div>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {isAdminAndMember && (
              <SidebarGroup
                className={cn(
                  !isDeploymentAllowed &&
                    !isPlanLoading &&
                    "bg-zinc-200/50 shadow-inner dark:bg-zinc-800/50 dark:shadow-gray-950",
                )}
              >
                <SidebarGroupLabel className="flex justify-between">
                  API
                  {!isDeploymentAllowed && !isPlanLoading && (
                    <Badge variant="purple" className="!text-2xs">
                      <Lock className="h-3 w-3" />
                      Deployment
                    </Badge>
                  )}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="px-1">
                    {deployment.map((tab) => (
                      <SidebarMenuItem key={tab}>
                        <SidebarMenuButton
                          onClick={() => {
                            router.navigate({
                              to: "/workflows/$workflowId/$view",
                              params: { workflowId, view: tab },
                            });
                          }}
                          className={cn(
                            currentView === tab
                              ? "bg-gray-200 text-gray-900 dark:bg-zinc-800 dark:text-gray-100"
                              : "text-gray-500 dark:text-gray-400",
                            "transition-colors",
                            !isDeploymentAllowed &&
                              !isPlanLoading &&
                              "opacity-60",
                          )}
                          asChild
                        >
                          <button
                            className="flex w-full justify-between capitalize"
                            type="button"
                          >
                            {tab}
                            {!isDeploymentAllowed && !isPlanLoading && (
                              <Lock className="!h-3.5 !w-3.5" />
                            )}
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </motion.div>
        </AnimatePresence>
      </Portal>
      <Portal targetId="sidebar-panel-footer">
        {workflow && (
          <div className="w-full p-3">
            <DropdownMenu>
              <DropdownMenuTrigger className="mx-auto flex items-center justify-center">
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      {workflow.cover_image ? (
                        <div className="mb-2 h-36 w-36 overflow-hidden rounded-md">
                          <FileURLRender
                            url={workflow.cover_image}
                            imgClasses="w-full h-full object-cover aspect-square"
                          />
                        </div>
                      ) : (
                        <div className="mb-2 flex h-36 w-36 items-center justify-center rounded-md border-2 border-gray-300 border-dashed hover:border-gray-400">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add Cover Image</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" className="w-40">
                <DropdownMenuItem
                  onSelect={() => {
                    router.navigate({
                      to: "/workflows/$workflowId/$view",
                      params: {
                        workflowId,
                        view: "gallery",
                      },
                      search: {
                        action: true,
                      },
                    });
                  }}
                >
                  From Gallery
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setOnAssetSelect(handleAsset);
                    setAssetsOpen(true);
                  }}
                >
                  From Assets
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {workflow.description && (
              <p className="line-clamp-3 text-2xs text-gray-600 leading-snug dark:text-gray-400">
                {workflow.description}
              </p>
            )}
          </div>
        )}
      </Portal>
      {/* Workspace view - only render if user has admin permissions */}
      {mountedViews.has("workspace") && isAdminAndMember ? (
        <div
          className="h-full w-full"
          style={{
            display: currentView === "workspace" ? "block" : "none",
          }}
        >
          {currentView === "workspace" && (
            <GuideDialog guideType={sessionId ? "session" : "workspace"} />
          )}
          <WorkspaceClientWrapper
            workflow_id={workflowId}
            onShareWorkflow={() => setIsShareDialogOpen(true)}
          />
        </div>
      ) : null}
      {view}
      <DeploymentDialog
        open={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedVersion(null);
        }}
        selectedVersion={selectedVersion}
        workflowId={workflowId}
        onSuccess={setSelectedDeployment}
        publicLinkOnly={true}
        existingDeployments={deployments}
      />
      <ShareWorkflowDialog
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        workflowId={workflowId}
        workflowName={workflow?.name || "Untitled Workflow"}
        workflowDescription={workflow?.description}
        workflowCoverImage={workflow?.cover_image}
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
    </div>
  );
}

function RequestPage() {
  const { workflowId, view: currentView } = Route.useParams();
  const [deploymentId, setDeploymentId] = useQueryState("filter-deployment-id");
  const [status, setStatus] = useQueryState("filter-status");

  return (
    <>
      <motion.div
        layout
        className={cn("flex h-full w-full flex-col gap-4 pt-4 lg:flex-row")}
      >
        <RealtimeWorkflowProvider
          workflowId={workflowId}
          status={status ?? undefined}
          deploymentId={deploymentId ?? undefined}
        >
          <RunComponent />
          <WorkflowComponent />
        </RealtimeWorkflowProvider>
      </motion.div>
    </>
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
