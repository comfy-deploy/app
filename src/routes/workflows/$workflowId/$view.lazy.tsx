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
import { WorkflowNavbar } from "@/components/workflow-navbar";
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

const workspace = ["workspace", "playground", "gallery", "machine"];
const deployment = ["deployment", "requests"];

export const Route = createLazyFileRoute("/workflows/$workflowId/$view")({
  component: WorkflowPageComponent,
});

function WorkflowPageComponent() {
  const { workflowId, view: currentView } = Route.useParams();
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

  let view: React.ReactNode;

  const { workflow } = useCurrentWorkflow(workflowId);
  const { data: machine } = useMachine(workflow?.selected_machine_id);

  const { value: version } = useSelectedVersion(workflowId);
  const isAdminAndMember = useIsAdminAndMember();
  const { isLoading: isPlanLoading } = useCurrentPlanQuery();
  const isDeploymentAllowed = useIsDeploymentAllowed();

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
        <PaddingLayout>
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
          <MachineTopStickyBar machine={machine} />
          <div className="mx-auto mt-4 w-full max-w-screen-lg">
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
  }

  const tabs = isAdminAndMember ? workspace : ["playground", "gallery"];

  const { openMobile: isMobileSidebarOpen, isMobile } = useSidebar();

  const router = useRouter();

  const [sessionId, setSessionId] = useQueryState("sessionId");
  const { setOpen: setAssetsOpen, setOnAssetSelect } = useAssetsBrowserStore();

  // Find public share deployment if it exists
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

  return (
    <div className="relative flex h-full w-full flex-col">
      <WorkflowNavbar
        workflowId={workflowId}
        currentView={currentView}
        workflow={workflow}
        tabs={tabs}
        deployment={deployment}
        isAdminAndMember={isAdminAndMember}
        isDeploymentAllowed={!!isDeploymentAllowed}
        isPlanLoading={isPlanLoading}
        publicShareDeployment={publicShareDeployment}
        communityShareDeployment={communityShareDeployment}
        privateShareDeployment={privateShareDeployment}
        versions={versions}
        setSelectedVersion={setSelectedVersion}
        setIsDrawerOpen={setIsDrawerOpen}
        setSelectedDeployment={setSelectedDeployment}
        setOnAssetSelect={setOnAssetSelect}
        setAssetsOpen={setAssetsOpen}
        handleAsset={handleAsset}
      />
      {mountedViews.has("workspace") ? (
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
