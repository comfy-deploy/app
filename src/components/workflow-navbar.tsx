import { ImageIcon, Lock, Share } from "lucide-react";
import { useRouter } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FileURLRender } from "@/components/workflows/OutputRender";
import { cn } from "@/lib/utils";
import { getEnvColor } from "@/components/workspace/ContainersTable";

interface WorkflowNavbarProps {
  workflowId: string;
  currentView: string;
  workflow?: {
    name?: string;
    description?: string;
    cover_image?: string;
  };
  tabs: string[];
  deployment: string[];
  isAdminAndMember: boolean;
  isDeploymentAllowed: boolean;
  isPlanLoading: boolean;
  publicShareDeployment?: { id: string; environment: string };
  communityShareDeployment?: { id: string; environment: string };
  privateShareDeployment?: { id: string; environment: string };
  versions?: any[];
  setSelectedVersion: (version: any) => void;
  setIsDrawerOpen: (open: boolean) => void;
  setSelectedDeployment: (id: string | null) => void;
  setOnAssetSelect: (handler: (asset: any) => void) => void;
  setAssetsOpen: (open: boolean) => void;
  handleAsset: (asset: any) => void;
}

export function WorkflowNavbar({
  workflowId,
  currentView,
  workflow,
  tabs,
  deployment,
  isAdminAndMember,
  isDeploymentAllowed,
  isPlanLoading,
  publicShareDeployment,
  communityShareDeployment,
  privateShareDeployment,
  versions,
  setSelectedVersion,
  setIsDrawerOpen,
  setSelectedDeployment,
  setOnAssetSelect,
  setAssetsOpen,
  handleAsset,
}: WorkflowNavbarProps) {
  const router = useRouter();

  return (
    <div className="flex h-16 w-full items-center justify-between border-gray-200 border-b bg-white px-4 dark:border-zinc-700 dark:bg-zinc-900">
      {/* Left side - Navigation tabs */}
      <div className="flex items-center gap-1">
        {tabs.map((tab) => (
          <Button
            key={tab}
            variant="ghost"
            size="sm"
            onClick={() => {
              router.navigate({
                to: "/workflows/$workflowId/$view",
                params: { workflowId, view: tab },
              });
            }}
            className={cn(
              "group/my-nav-item relative",
              currentView === tab
                ? "bg-gray-200 text-gray-900 dark:bg-zinc-800 dark:text-gray-100"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100",
              "capitalize transition-colors",
            )}
          >
            {tab === "workspace"
              ? "Workflow"
              : tab === "machine"
                ? "Environment"
                : tab}

            {tab === "playground" && (
              <div className="ml-2 flex items-center gap-1">
                {publicShareDeployment && (
                  <Badge
                    className={cn(
                      "!text-2xs w-fit cursor-pointer whitespace-nowrap rounded-md hover:shadow-sm",
                      getEnvColor(publicShareDeployment.environment),
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedDeployment(publicShareDeployment.id);
                    }}
                  >
                    Shared
                  </Badge>
                )}
                {communityShareDeployment && (
                  <Badge
                    className={cn(
                      "!text-2xs w-fit cursor-pointer whitespace-nowrap rounded-md hover:shadow-sm",
                      getEnvColor(communityShareDeployment.environment),
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedDeployment(communityShareDeployment.id);
                    }}
                  >
                    Community
                  </Badge>
                )}
                {privateShareDeployment && (
                  <Badge
                    className={cn(
                      "!text-2xs w-fit cursor-pointer whitespace-nowrap rounded-md hover:shadow-sm",
                      getEnvColor(privateShareDeployment.environment),
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedDeployment(privateShareDeployment.id);
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
                      className="h-6 w-6 opacity-0 transition-all hover:bg-gray-200 group-hover/my-nav-item:opacity-100 dark:hover:bg-zinc-600/40"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (versions?.[0]) {
                          setSelectedVersion(versions[0]);
                          setIsDrawerOpen(true);
                        }
                      }}
                    >
                      <Share className="h-3 w-3" />
                    </Button>
                  )}
              </div>
            )}
          </Button>
        ))}

        {/* API deployment tabs */}
        {isAdminAndMember && (
          <>
            <div className="mx-2 h-6 w-px bg-gray-200 dark:bg-zinc-700" />
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                API
                {!isDeploymentAllowed && !isPlanLoading && (
                  <Badge variant="purple" className="ml-1 !text-2xs">
                    <Lock className="h-3 w-3" />
                    Deployment
                  </Badge>
                )}
              </span>
              {deployment.map((tab) => (
                <Button
                  key={tab}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    router.navigate({
                      to: "/workflows/$workflowId/$view",
                      params: { workflowId, view: tab },
                    });
                  }}
                  className={cn(
                    currentView === tab
                      ? "bg-gray-200 text-gray-900 dark:bg-zinc-800 dark:text-gray-100"
                      : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100",
                    "capitalize transition-colors",
                    !isDeploymentAllowed && !isPlanLoading && "opacity-60",
                  )}
                  disabled={!isDeploymentAllowed && !isPlanLoading}
                >
                  {tab}
                  {!isDeploymentAllowed && !isPlanLoading && (
                    <Lock className="ml-1 h-3 w-3" />
                  )}
                </Button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Right side - Cover image */}
      {workflow && (
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center justify-center">
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    {workflow.cover_image ? (
                      <div className="h-10 w-10 overflow-hidden rounded-md">
                        <FileURLRender
                          url={workflow.cover_image}
                          imgClasses="w-full h-full object-cover aspect-square"
                        />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-md border-2 border-gray-300 border-dashed hover:border-gray-400">
                        <ImageIcon className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add Cover Image</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" className="w-40">
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
            <div className="ml-3 max-w-xs">
              <p className="line-clamp-1 text-xs text-gray-600 dark:text-gray-400">
                {workflow.description}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
