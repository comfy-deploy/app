/** biome-ignore-all lint/nursery/useSortedClasses: <explanation> */
import { createLazyFileRoute, Link, useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Copy } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DeploymentPage } from "@/components/deployment/deployment-page";
import { GalleryView } from "@/components/GalleryView";
import { GuideDialog } from "@/components/guide/GuideDialog";
import { LoadingIcon } from "@/components/loading-icon";
import {
  MachineAlert,
  MachineVersionWrapper,
} from "@/components/machine/machine-overview";
import { MachineSettingsWrapper } from "@/components/machine/machine-settings";
import { MachineVersionDetail } from "@/components/machine/machine-version-detail";
import { isMachineDeprecated } from "@/components/machines/machine-list-item";
import { PaddingLayout } from "@/components/PaddingLayout";
import { useIsAdminAndMember } from "@/components/permissions";
import { Playground } from "@/components/run/SharePageComponent";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RealtimeWorkflowProvider } from "@/components/workflows/RealtimeRunUpdate";
import RunComponent from "@/components/workflows/RunComponent";
import WorkflowComponent from "@/components/workflows/WorkflowComponent";
import { MachineSelect } from "@/components/workspace/MachineSelect";
import { useSelectedVersion } from "@/components/workspace/Workspace";
import { WorkspaceClientWrapper } from "@/components/workspace/WorkspaceClientWrapper";
import {
  useCurrentPlanQuery,
  useIsDeploymentAllowed,
} from "@/hooks/use-current-plan";
import { useCurrentWorkflow } from "@/hooks/use-current-workflow";
import { useMachine, useMachineVersionsAll } from "@/hooks/use-machine";
import { cn } from "@/lib/utils";
import { StoragePage } from "@/routes/models";
import { PricingPage } from "@/routes/pricing";

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

  const { data: machineVersionsAll, isLoading: isLoadingVersions } =
    useMachineVersionsAll(machine?.id);
  const isDeprecated = isMachineDeprecated(machine);

  const isLatestVersion = useMemo(() => {
    if (isLoadingVersions || !machineVersionsAll) return true;

    return (
      machine?.machine_version_id !== null &&
      machineVersionsAll[0]?.id === machine.machine_version_id
    );
  }, [machine?.machine_version_id, machineVersionsAll, isLoadingVersions]);

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
        <MachineView
          machine={machine}
          workflowId={workflowId}
          isDeprecated={isDeprecated}
          isLatestVersion={isLatestVersion}
          isAdminAndMember={isAdminAndMember}
        />
      );
      break;
    case "model":
      view = <StoragePage isWorkflowPage={true} machine={machine} />;
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
  const [deploymentId] = useQueryState("filter-deployment-id");
  const [status] = useQueryState("filter-status");

  return (
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
  );
}

function MachineView({
  machine,
  workflowId,
  isDeprecated,
  isLatestVersion,
  isAdminAndMember,
}: {
  machine: any;
  workflowId: string;
  isDeprecated: boolean;
  isLatestVersion: boolean;
  isAdminAndMember: boolean;
}) {
  const [machineVersionId, setMachineVersionId] = useQueryState(
    "machineVersionId",
    parseAsString,
  );

  if (machineVersionId) {
    return (
      <div className="mx-auto pt-20 w-full max-w-screen-lg">
        <Button
          variant="link"
          onClick={() => setMachineVersionId(null)}
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Machine
        </Button>
        <MachineVersionDetail
          machineId={machine.id}
          machineVersionId={machineVersionId}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto mt-12 w-full max-w-screen-lg">
      <MachineHeader machine={machine} />
      <MachineSelect
        workflow_id={workflowId}
        className="rounded-md border bg-background mb-4"
        showSettings={false}
      />
      <div className="pb-2">
        <MachineAlert
          machine={machine}
          isDeprecated={isDeprecated}
          isLatestVersion={isLatestVersion}
        />
      </div>
      <MachineVersionWrapper
        machine={machine}
        onVersionClick={(machineVersionId) =>
          setMachineVersionId(machineVersionId)
        }
      />
      <MachineSettingsWrapper
        title="Machine Settings"
        machine={machine}
        readonly={!isAdminAndMember}
        className="top-0"
      />
    </div>
  );
}

function MachineHeader({ machine }: { machine: any }) {
  return (
    <div className="my-4 flex flex-col gap-4">
      <div className="flex flex-row items-center gap-2 ml-1">
        <h1 className="font-semibold text-2xl">Machine</h1>
        {machine?.id && (
          <div className="flex gap-2 items-center text-muted-foreground text-2xs font-mono mt-1">
            <span>·</span>
            <span>{machine.id.slice(0, 8)}</span>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(machine.id);
                toast.success("Machine ID copied to clipboard");
              }}
              size="icon"
              type="button"
              variant="ghost"
              className="h-8 w-8"
            >
              <Copy className="h-3 w-3 shrink-0" />
            </Button>
          </div>
        )}
      </div>
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
