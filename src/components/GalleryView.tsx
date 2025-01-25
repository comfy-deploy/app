import { FileURLRender } from "@/components/workflows/OutputRender";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Link } from "@tanstack/react-router";

type GalleryViewProps = {
  workflowID: string;
  className?: string;
  paginationClassName?: string;
};

type setOpenImage = {
  fileURLs: string[];
  runID: string;
  duration: number;
};

const BATCH_SIZE = 20;

export function useGalleryData(workflow_id: string) {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  return useInfiniteQuery<any[]>({
    queryKey: ["workflow", workflow_id, "gallery"],
    meta: {
      limit: BATCH_SIZE,
      offset: 0,
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage?.length === BATCH_SIZE
        ? allPages?.length * BATCH_SIZE
        : undefined;
    },
    initialPageParam: 0,
  });
}

function GallerySkeleton() {
  const heights = [200, 400, 300, 600, 400, 200, 400, 200, 200, 400, 300, 200];

  return (
    <div className="m-4 columns-2 gap-0.5 overflow-clip rounded-xl sm:columns-3 lg:columns-4">
      {heights.map((height, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          key={index}
          className={
            "mb-0.5 w-full animate-pulse break-inside-avoid rounded-[4px] bg-gray-200"
          }
          style={{ height: `${height}px` }}
        />
      ))}
    </div>
  );
}

export function GalleryView({ workflowID }: GalleryViewProps) {
  const query = useGalleryData(workflowID);
  const loadMoreButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && query.hasNextPage && !query.isFetching) {
          query.fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreButtonRef.current) {
      observer.observe(loadMoreButtonRef.current);
    }

    return () => observer.disconnect();
  }, [query.hasNextPage, query.isFetching, query.fetchNextPage]);

  if (query.isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1200px]">
        <GallerySkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <div className="m-4 columns-2 gap-0.5 overflow-clip rounded-xl sm:columns-3 lg:columns-4">
        {query.data?.pages.flat().map((page) => {
          const outputUrl =
            page.data?.images?.[0]?.url ||
            page.data?.gifs?.[0]?.url ||
            page.data?.mesh?.[0]?.url ||
            "";

          const totalTime =
            Math.round((page.run_duration + page.queue_time) * 10) / 10;

          return (
            <Link
              key={page.output_id}
              className="group relative cursor-pointer"
              to="/workflows/$workflowId/$view"
              params={{
                workflowId: workflowID,
                view: "requests",
              }}
              search={{
                "run-id": page.run_id,
              }}
            >
              <FileURLRender
                url={outputUrl}
                lazyLoading={true}
                imgClasses="w-full h-full object-contain max-w-full rounded-[4px] mb-0.5 pointer-events-none"
              />
              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-b from-transparent to-black/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="flex items-center justify-between px-4 py-3 drop-shadow-md">
                  <div className="flex items-center gap-2">
                    <span className="text-white/90 text-xs">{totalTime}s</span>
                    {page.data?.images?.[0]?.filename && (
                      <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] text-white/90">
                        {page.data?.images?.[0]?.filename}
                      </span>
                    )}
                  </div>
                  <Search className="h-3.5 w-3.5 text-white/90" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="fixed top-0 left-0 h-20 w-full bg-gradient-to-b from-white to-transparent" />

      <div className="flex items-center justify-center gap-2 pb-4">
        {query.hasNextPage ? (
          <Button
            ref={loadMoreButtonRef}
            variant="outline"
            onClick={() => query.fetchNextPage()}
            disabled={!query.hasNextPage || query.isFetching}
          >
            {query.isFetching
              ? "Loading..."
              : query.hasNextPage
                ? "Load More"
                : "No More Results"}
          </Button>
        ) : (
          <div className="mt-2 border-gray-200 border-t-2 pt-2">
            <span className="text-muted-foreground text-xs">
              Total: {query.data?.pages.flat().length} results
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
