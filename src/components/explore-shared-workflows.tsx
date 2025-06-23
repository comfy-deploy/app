"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { FileURLRender } from "@/components/workflows/OutputRender";
import { Link } from "@tanstack/react-router";
import { Download, Eye, Grid2X2, LayoutList, Search, User } from "lucide-react";
import * as React from "react";
import { getRelativeTime } from "@/lib/get-relative-time";
import { useSharedWorkflows } from "@/hooks/use-shared-workflows";
import { useDebounce } from "use-debounce";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { UserIcon } from "@/components/run/SharePageComponent";

type SharedWorkflow = {
  id: string;
  user_id: string;
  org_id: string;
  workflow_id: string;
  workflow_version_id: string;
  workflow_export: Record<string, unknown>;
  share_slug: string;
  title: string;
  description: string;
  cover_image: string;
  is_public: boolean;
  view_count: number;
  download_count: number;
  created_at: string;
  updated_at: string;
};

export function ExploreSharedWorkflows() {
  const [view, setView] = useLocalStorage<"list" | "grid">(
    "explore-view-mode",
    "grid",
  );

  const [searchValue, setSearchValue] = React.useState<string | null>(null);
  const [debouncedSearchValue] = useDebounce(searchValue, 250);

  const {
    data: sharedWorkflowsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSharedWorkflows(debouncedSearchValue ?? "");

  const parentRef = React.useRef<HTMLDivElement>(null);
  useInfiniteScroll(parentRef, fetchNextPage, hasNextPage, isFetchingNextPage);

  const flatData = React.useMemo(() => {
    const result = sharedWorkflowsData?.pages.flat() ?? [];
    console.log('ExploreSharedWorkflows - sharedWorkflowsData:', sharedWorkflowsData);
    console.log('ExploreSharedWorkflows - flatData:', result);
    return result;
  }, [sharedWorkflowsData]);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex w-full flex-row items-center gap-2 p-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search shared workflows..."
            value={searchValue ?? ""}
            onChange={(event) => {
              if (event.target.value === "") {
                setSearchValue(null);
              } else {
                setSearchValue(event.target.value);
              }
            }}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 rounded-md border p-1">
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("grid")}
            className="h-7 w-7 p-0"
          >
            <Grid2X2 className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("list")}
            className="h-7 w-7 p-0"
          >
            <LayoutList className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={parentRef}
        className="mx-auto max-w-screen-2xl flex-1 overflow-auto px-4 pb-4"
      >
        {isLoading ? (
          <div
            className={cn(
              view === "grid"
                ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "space-y-2",
            )}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <SharedWorkflowCardSkeleton key={`skeleton-${i}`} view={view} />
            ))}
          </div>
        ) : flatData.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            No shared workflows found
          </div>
        ) : (
          <div
            className={cn(
              view === "grid"
                ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "space-y-2",
            )}
          >
            {flatData.map((workflow: SharedWorkflow) => (
              <SharedWorkflowCard
                key={workflow.id}
                workflow={workflow}
                view={view}
              />
            ))}
          </div>
        )}

        {isFetchingNextPage && (
          <div className="mt-4">
            <div
              className={cn(
                view === "grid"
                  ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "space-y-2",
              )}
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <SharedWorkflowCardSkeleton
                  key={`loading-skeleton-${i}`}
                  view={view}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SharedWorkflowCardSkeleton({ view }: { view: "list" | "grid" }) {
  if (view === "list") {
    return (
      <div className="flex items-center space-x-4 rounded-lg border p-4">
        <Skeleton className="h-12 w-12 rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-3 w-[150px]" />
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-6 w-12" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <Skeleton className="h-32 w-full rounded" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  );
}

function SharedWorkflowCard({
  workflow,
  view,
}: {
  workflow: SharedWorkflow;
  view: "list" | "grid";
}) {
  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CD_API_URL}/api/shared-workflows/${workflow.share_slug}/download`,
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `${workflow.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  if (view === "list") {
    return (
      <Link
        to="/share/workflow/$user/$slug"
        params={{ user: workflow.user_id, slug: workflow.share_slug }}
        className="group flex items-center space-x-4 rounded-lg border p-4 transition-all hover:border-primary/50 hover:bg-muted/50"
      >
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-muted">
          {workflow.cover_image ? (
            <FileURLRender
              url={workflow.cover_image}
              imgClasses="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              showFullResolution={true}
            />
          ) : (
            <User className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <h3 className="font-semibold line-clamp-1 transition-colors group-hover:text-primary">
            {workflow.title}
          </h3>
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {workflow.description || "No description"}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <UserIcon user_id={workflow.user_id} className="h-4 w-4" />
              <span>{getRelativeTime(workflow.created_at)}</span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Eye className="h-3 w-3" />
                <span>{workflow.view_count}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Download className="h-3 w-3" />
                <span>{workflow.download_count}</span>
              </div>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="h-8 w-8 p-0 opacity-60 transition-opacity group-hover:opacity-100"
        >
          <Download className="h-4 w-4" />
        </Button>
      </Link>
    );
  }

  return (
    <Link
      to="/share/workflow/$user/$slug"
      params={{ user: workflow.user_id, slug: workflow.share_slug }}
      className="group relative overflow-hidden rounded-lg border transition-all duration-300 hover:border-primary/50 hover:shadow-lg dark:border-zinc-700/50"
    >
      <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-muted">
        {workflow.cover_image ? (
          <FileURLRender
            url={workflow.cover_image}
            imgClasses="h-full w-full max-w-full object-cover transition-transform duration-300 group-hover:scale-105"
            showFullResolution={true}
          />
        ) : (
          <User className="h-8 w-8 text-muted-foreground" />
        )}

        {/* Use button overlay */}
        <Button
          variant="default"
          size="sm"
          asChild
          className="absolute top-3 right-3 h-8 bg-primary/90 px-3 text-white opacity-0 shadow-md backdrop-blur-sm transition-opacity hover:bg-primary group-hover:opacity-100 dark:text-zinc-900"
        >
          <Link
            to="/workflows"
            search={{
              view: "import",
              shared_workflow_id: workflow.id,
              shared_slug: workflow.share_slug,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            Use
          </Link>
        </Button>

        {/* Bottom gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* User and metrics overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex items-center gap-2">
            <UserIcon user_id={workflow.user_id} className="h-6 w-6" />
          </div>
          <div className="flex items-center space-x-3 text-sm text-white">
            <div className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>{workflow.view_count}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Download className="h-4 w-4" />
              <span>{workflow.download_count}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="space-y-2">
          <h3 className="line-clamp-2 font-semibold leading-tight transition-colors group-hover:text-primary">
            {workflow.title}
          </h3>
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {workflow.description || "No description"}
          </p>
        </div>

        {/* Only show timestamp - clean and minimal */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{getRelativeTime(workflow.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}
