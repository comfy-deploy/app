import { GalleryView } from "@/components/GalleryView";
import { PaddingLayout } from "@/components/PaddingLayout";
import { GuideDialog } from "@/components/guide/GuideDialog";
import { DeploymentPage } from "@/components/deployment/deployment-page";
import { MachineVersionWrapper } from "@/components/machine/machine-overview";
import { MachineSettingsWrapper } from "@/components/machine/machine-settings";
import { useIsAdminAndMember } from "@/components/permissions";
import { Playground } from "@/components/run/SharePageComponent";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RealtimeWorkflowProvider } from "@/components/workflows/RealtimeRunUpdate";
import RunComponent from "@/components/workflows/RunComponent";
import WorkflowComponent from "@/components/workflows/WorkflowComponent";
import { useSelectedVersion } from "@/components/workspace/Workspace";
import { WorkspaceClientWrapper } from "@/components/workspace/WorkspaceClientWrapper";
import { useCurrentWorkflow } from "@/hooks/use-current-workflow";
import { useMachine } from "@/hooks/use-machine";
import { cn } from "@/lib/utils";
import { Link, createLazyFileRoute, useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { useIsDeploymentAllowed } from "@/hooks/use-current-plan";
import { PricingPage } from "@/routes/pricing";
import { useCurrentPlanQuery } from "@/hooks/use-current-plan";
import { LoadingIcon } from "@/components/loading-icon";
import { StoragePage } from "@/routes/models";

export const Route = createLazyFileRoute("/workflows/$workflowId/$view")({
  component: WorkflowPageComponent,
});

function WorkflowPageComponent() {
  const { workflowId, view: currentView } = Route.useParams();
  const router = useRouter();

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

  return (
    <div className="relative flex h-full w-full flex-col">
      {/* Workspace view - only render if user has admin permissions */}
      {mountedViews.has("workspace") && isAdminAndMember ? (
        <div
          className="h-full w-full"
          style={{
            display: currentView === "workspace" ? "block" : "none",
          }}
        >
          <WorkspaceClientWrapper workflow_id={workflowId} />
        </div>
      ) : null}
      {view}
    </div>
  );
}

function RequestPage() {
  const { workflowId } = Route.useParams();
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
