import { GalleryView } from "@/components/GalleryView";
import { PaddingLayout } from "@/components/PaddingLayout";
import { LoadingWrapper } from "@/components/loading-wrapper";
import { useIsAdminAndMember } from "@/components/permissions";
import { Playground } from "@/components/run/SharePageComponent";
import { SessionItem } from "@/components/sessions/SessionItem";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { RealtimeWorkflowProvider } from "@/components/workflows/RealtimeRunUpdate";
import RunComponent from "@/components/workflows/RunComponent";
import WorkflowComponent from "@/components/workflows/WorkflowComponent";
import { ContainersTable } from "@/components/workspace/ContainersTable";
import { APIDocs } from "@/components/workspace/DeploymentDisplay";
import { LogDisplay } from "@/components/workspace/LogDisplay";
import { MachineSelect } from "@/components/workspace/MachineSelect";
import { useSelectedVersion } from "@/components/workspace/Workspace";
import { WorkspaceClientWrapper } from "@/components/workspace/WorkspaceClientWrapper";
import { WorkspaceStatusBar } from "@/components/workspace/WorkspaceStatusBar";
import { SessionCreate } from "@/components/workspace/session-create";
import { WorkspaceSubmenuActions } from "@/components/workspace/workspace-submenu-actions";
import { useCurrentWorkflow } from "@/hooks/use-current-workflow";
import { useSessionAPI } from "@/hooks/use-session-api";
import {
  getInputsFromWorkflowAPI,
  getInputsFromWorkflowJSON,
} from "@/lib/getInputsFromWorkflow";
import { cn } from "@/lib/utils";
import {
  Link,
  createLazyFileRoute,
  notFound,
  useRouter,
} from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Terminal } from "lucide-react";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";

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

function WorkflowPageComponent() {
  const { workflowId, view: currentView } = Route.useParams();

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

  const { value: version } = useSelectedVersion(workflowId);

  switch (currentView) {
    case "requests":
      view = (
        <PaddingLayout>
          <RequestPage />
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
    case "deployment":
      view = (
        <PaddingLayout>
          <div className="relative mx-auto my-10 w-full max-w-screen-lg">
            <LoadingWrapper tag="api">
              <APIDocs
                domain={process.env.NEXT_PUBLIC_CD_API_URL!}
                workflow_id={workflowId}
              />
            </LoadingWrapper>
          </div>
        </PaddingLayout>
      );
      break;
    case "playground":
      view = (
        <PaddingLayout>
          <div className={cn("h-full w-full")}>
            {workflow?.selected_machine_id && version?.id && (
              <RealtimeWorkflowProvider workflowId={workflowId}>
                <Playground runOrigin={"manual"} />
              </RealtimeWorkflowProvider>
            )}
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
  const sessionSelected = sessions?.find(
    (session) => session.session_id === sessionId,
  );

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
                    {tab === "workspace" && currentView === "workspace" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <WorkspaceStatusBar
                          endpoint={
                            sessionSelected?.tunnel_url ||
                            process.env.COMFYUI_FRONTEND_URL
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
                                        <Terminal className="mr-2 h-4 " /> Logs
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
      {mountedViews.has("workspace") ? (
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
  const { workflowId, view: currentView } = Route.useParams();

  return (
    <>
      <motion.div
        layout
        className={cn("flex h-full w-full flex-col gap-4 pt-4 lg:flex-row")}
      >
        <RealtimeWorkflowProvider workflowId={workflowId}>
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
