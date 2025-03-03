import { FileURLRender } from "@/components/workflows/OutputRender";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Download,
  Ellipsis,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RunDetails } from "./workflows/WorkflowComponent";
import { MyDrawer } from "./drawer";
import { useQueryState } from "nuqs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { api } from "@/lib/api";
import { callServerPromise } from "@/lib/call-server-promise";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { downloadImage } from "@/utils/download-image";

type GalleryViewProps = {
  workflowID: string;
  className?: string;
  paginationClassName?: string;
};

interface GalleryItem {
  id?: string;
  outputUrl?: string;
  height?: number;
  width?: number;
  aspectRatio?: number;
  data?: {
    images?: Array<{ url: string; filename: string }>;
    gifs?: Array<{ url: string }>;
    model_file?: Array<{ url: string }>;
  };
  run_duration?: number;
  queue_time?: number;
  output_id?: string;
  run_id?: string;
}

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

function GalleryImage({
  outputUrl,
  setRunId,
  setIsDrawerOpen,
  runId,
}: {
  outputUrl: string;
  setRunId: (runId: string) => void;
  setIsDrawerOpen: (isDrawerOpen: boolean) => void;
  runId: string;
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
    <div
      className="group relative cursor-pointer"
      onClick={() => {
        setRunId(runId);
        setIsDrawerOpen(true);
      }}
    >
      <FileURLRender
        url={outputUrl}
        lazyLoading={true}
        imgClasses={cn(
          "w-full h-full object-contain max-w-full rounded-[4px] mb-0.5 pointer-events-none",
          !isLoaded && "aspect-square",
        )}
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
}

function RenderAlert({
  setShow,
  variant,
  title,
  description,
  bgColor,
}: {
  setShow: (show: boolean) => void;
  variant: "warning" | "destructive" | "default";
  title: string;
  description: React.ReactNode;
  bgColor: string;
}) {
  return (
    <Alert variant={variant} className={`rounded-[10px] ${bgColor} relative`}>
      <Button
        onClick={() => setShow(false)}
        className={`absolute top-1 right-1 p-1 hover:bg-${
          variant === "destructive"
            ? "red"
            : variant === "warning"
              ? "yellow"
              : "gray"
        }-100`}
        variant="ghost"
        size="icon"
      >
        <X className="h-4 w-4" />
      </Button>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}

export function GalleryView({ workflowID }: GalleryViewProps) {
  const query = useGalleryData(workflowID);
  const loadMoreButtonRef = useRef<HTMLButtonElement>(null);
  const [runId, setRunId] = useQueryState("run-id");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [loadingCoverId, setLoadingCoverId] = useState<string | null>(null);
  const [coverImageNotified, setSetCoverImageNotified] =
    useQueryState("action");
  const [columnCount, setColumnCount] = useState(2);

  // Update column count based on screen size
  useEffect(() => {
    const updateColumnCount = () => {
      if (window.innerWidth >= 1024) {
        setColumnCount(4); // 4 columns on large screens
      } else if (window.innerWidth >= 640) {
        setColumnCount(3); // 3 columns on medium screens
      } else {
        setColumnCount(2); // 2 columns on small screens
      }
    };

    updateColumnCount();
    window.addEventListener("resize", updateColumnCount);
    return () => window.removeEventListener("resize", updateColumnCount);
  }, []);

  // Infinite scroll observer
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

  useEffect(() => {
    setIsDrawerOpen(!!runId);
  }, [runId]);

  const handleCloseRun = () => {
    setRunId(null);
    setIsDrawerOpen(false);
  };

  const handleSetAsCoverImage = async (imageUrl: string) => {
    setLoadingCoverId(runId);
    try {
      await callServerPromise(
        api({
          url: `workflow/${workflowID}`,
          init: {
            method: "PATCH",
            body: JSON.stringify({ cover_image: imageUrl }),
          },
        }),
      );
      toast.success("Cover image updated!");
    } finally {
      setLoadingCoverId(null);
      setOpenDropdownId(null);
    }
  };

  if (query.isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1200px]">
        <GallerySkeleton />
      </div>
    );
  }

  const items = query.data?.pages.flat() || [];

  // Split items into columns
  const columns = Array.from({ length: columnCount }, () => []);
  items.forEach((item: GalleryItem, index: number) => {
    const columnIndex = index % columnCount;
    columns[columnIndex].push(item);
  });

  // Map columnCount to Tailwind width classes
  const widthClass = {
    2: "w-1/2",
    3: "w-1/3",
    4: "w-1/4",
  }[columnCount];

  return (
    <>
      <div className="mx-auto w-full max-w-[1200px]">
        {coverImageNotified && (
          <div className="m-4">
            <RenderAlert
              setShow={() => setSetCoverImageNotified(null)}
              variant="default"
              title="Set Cover Image"
              description={
                <p>
                  To set a cover image for your workflow, hover over any image
                  and click the <Ellipsis className="inline h-3.5 w-3.5" />{" "}
                  menu, then select "Set as Cover Image".
                </p>
              }
              bgColor="bg-blue-50 text-blue-900 border-blue-200"
            />
          </div>
        )}
        {/* Replace columns with flexbox layout */}
        <div className="m-4 flex gap-0.5">
          {columns.map((col, i) => (
            <div key={i} className={widthClass}>
              {col.map((page: GalleryItem) => {
                const outputUrl =
                  page.data?.images?.[0]?.url ||
                  page.data?.gifs?.[0]?.url ||
                  page.data?.model_file?.[0]?.url ||
                  "";
                const totalTime =
                  Math.round(
                    (page.run_duration ?? 0 + (page.queue_time ?? 0)) * 10,
                  ) / 10;

                return (
                  <div key={page.output_id} className="group relative mb-0.5">
                    <GalleryImage
                      outputUrl={outputUrl}
                      setRunId={setRunId}
                      setIsDrawerOpen={setIsDrawerOpen}
                      runId={page.run_id ?? ""}
                    />
                    <div className="absolute top-0 right-0 w-full rounded-t-[4px] bg-gradient-to-t from-transparent to-black/70 p-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <div className="flex items-center justify-end">
                        <DropdownMenu
                          open={openDropdownId === page.run_id}
                          onOpenChange={(isOpen) =>
                            setOpenDropdownId(
                              isOpen ? (page.run_id ?? null) : null,
                            )
                          }
                        >
                          <DropdownMenuTrigger>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-transparent"
                            >
                              <Ellipsis className="h-3.5 w-3.5 text-white/90" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-52">
                            {page.data?.images?.[0]?.filename && (
                              <>
                                <DropdownMenuLabel>
                                  {page.data?.images?.[0]?.filename}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem
                              onClick={async () => {
                                await downloadImage({
                                  url: outputUrl,
                                  fileName: page.data?.images?.[0]?.filename,
                                });
                              }}
                            >
                              <div className="flex w-full items-center justify-between">
                                Download <Download className="h-3.5 w-3.5" />
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={loadingCoverId === page.run_id}
                              onClick={async (e) => {
                                e.preventDefault();
                                await handleSetAsCoverImage(outputUrl);
                              }}
                            >
                              <div className="flex w-full items-center justify-between">
                                Set as Cover Image
                                {loadingCoverId === page.run_id && (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                )}
                              </div>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full rounded-b-[4px] bg-gradient-to-b from-transparent to-black/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <div className="flex items-center justify-between px-4 py-3 drop-shadow-md">
                        <div className="flex items-center gap-2">
                          <span className="text-white/90 text-xs">
                            {totalTime}s
                          </span>
                          {page.data?.images?.[0]?.filename && (
                            <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] text-white/90">
                              {page.data?.images?.[0]?.filename}
                            </span>
                          )}
                        </div>
                        <Search className="h-3.5 w-3.5 text-white/90" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
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
      {runId && (
        <MyDrawer
          desktopClassName="w-[600px] ring-1 ring-gray-200"
          backgroundInteractive={true}
          open={isDrawerOpen}
          onClose={handleCloseRun}
        >
          <RunDetails run_id={runId} onClose={handleCloseRun} />
        </MyDrawer>
      )}
    </>
  );
}
