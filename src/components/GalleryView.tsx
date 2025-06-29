import { Button } from "@/components/ui/button";
import {
  FileURLRender,
  FileURLRenderDropdown,
} from "@/components/workflows/OutputRender";
import { useAddAsset } from "@/hooks/hook";
import { api } from "@/lib/api";
import { callServerPromise } from "@/lib/call-server-promise";
import { queryClient } from "@/lib/providers";
import { cn } from "@/lib/utils";
import { downloadImage } from "@/utils/download-image";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Download,
  Ellipsis,
  Film,
  FolderOpen,
  Image,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { useQueryState } from "nuqs";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MyDrawer } from "./drawer";
import { MoveAssetDialog } from "./move-asset-dialog";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { RunDetails } from "./workflows/WorkflowComponent";
import { UserFilterSelect } from "./user-filter-select";
import { UserIcon } from "./run/SharePageComponent";

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
    files?: Array<{ url: string }>;
  };
  run_duration?: number;
  queue_time?: number;
  output_id?: string;
  run_id?: string;
  origin?: string;
  user_id?: string;
}

const BATCH_SIZE = 20;

export function useGalleryData(
  workflow_id: string,
  originFilter?: string,
  userFilter?: string,
  fileTypeFilter?: string,
) {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  return useInfiniteQuery<any[]>({
    queryKey: ["workflow", workflow_id, "gallery"],
    queryKeyHashFn: (queryKey) => {
      return [...queryKey, originFilter, userFilter, fileTypeFilter].join(",");
    },
    meta: {
      limit: BATCH_SIZE,
      offset: 0,
      params: {
        ...(originFilter ? { origin: originFilter } : {}),
        ...(userFilter ? { user_id: userFilter } : {}),
        ...(fileTypeFilter ? { file_type: fileTypeFilter } : {}),
      },
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
            "mb-0.5 w-full animate-pulse break-inside-avoid rounded-[4px] bg-gray-200 dark:bg-zinc-700/50"
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
  const [originFilter, setOriginFilter] = useQueryState("origin");
  const [userFilter, setUserFilter] = useQueryState("user");
  const [fileTypeFilter, setFileTypeFilter] = useQueryState("fileType");

  const query = useGalleryData(
    workflowID,
    originFilter || "not-api",
    userFilter || undefined,
    fileTypeFilter || undefined,
  );

  const loadMoreButtonRef = useRef<HTMLButtonElement>(null);
  const [runId, setRunId] = useQueryState("run-id");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [loadingCoverId, setLoadingCoverId] = useState<string | null>(null);
  const [coverImageNotified, setSetCoverImageNotified] =
    useQueryState("action");
  const [columnCount, setColumnCount] = useState(2);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [selectedOutputUrl, setSelectedOutputUrl] = useState<string | null>(
    null,
  );
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null);
  const { mutate: addAsset } = useAddAsset();

  // Handle user filter changes from UserFilterSelect
  const handleUserFilterChange = (userIds: string) => {
    // In single select mode, userIds will be a single user ID or empty string
    setUserFilter(userIds || null);
  };

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
      queryClient.invalidateQueries({
        queryKey: ["workflow", workflowID],
      });
    } finally {
      setLoadingCoverId(null);
      setOpenDropdownId(null);
    }
  };

  const handleAddAsset = async ({
    url,
    path,
  }: { url: string; path: string }) => {
    try {
      await addAsset({ url, path });
      toast.success(`${selectedFilename || "Asset"} added to assets`);
      setMoveDialogOpen(false);
    } catch (error) {
      toast.error(`Failed to add asset: ${error}`);
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

  // Debug: Log the first few items to see what data we're getting
  if (items.length > 0) {
    console.log("Gallery items sample:", items.slice(0, 3));
  }

  // Split items into columns
  const columns: GalleryItem[][] = Array.from(
    { length: columnCount },
    () => [],
  );
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

        {/* Filter UI */}
        <div className="relative z-10 m-4 flex flex-wrap justify-between gap-2">
          <div className="flex items-center gap-2">
            <Select
              value={originFilter || "not-api"}
              onValueChange={(value) =>
                setOriginFilter(value === "not-api" ? null : value)
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Workspace" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not-api">
                  <div className="flex items-center gap-2">
                    <span>Workspace</span>
                  </div>
                </SelectItem>
                <SelectItem value="api">
                  <div className="flex items-center gap-2">
                    <span>API</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={fileTypeFilter || "all-files"}
              onValueChange={(value) =>
                setFileTypeFilter(value === "all-files" ? null : value)
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Files" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-files">
                  <div className="flex items-center gap-2">
                    <span>All Files</span>
                  </div>
                </SelectItem>
                <SelectItem value="image">
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    <span>Images</span>
                  </div>
                </SelectItem>
                <SelectItem value="video">
                  <div className="flex items-center gap-2">
                    <Film className="h-4 w-4" />
                    <span>Videos</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <UserFilterSelect
            onFilterChange={handleUserFilterChange}
            singleSelect={true}
          />
        </div>

        {/* Gallery layout */}
        <div className="m-4 flex gap-0.5 overflow-clip rounded-xl">
          {columns.map((col, colIndex) => (
            <div
              key={`column-${colIndex}-${columnCount}`}
              className={widthClass}
            >
              {col.map((page: GalleryItem) => {
                const outputUrl =
                  page.data?.images?.[0]?.url ||
                  page.data?.gifs?.[0]?.url ||
                  page.data?.files?.[0]?.url ||
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
                        <FileURLRenderDropdown
                          open={openDropdownId === page.output_id}
                          onOpenChange={(isOpen) =>
                            setOpenDropdownId(
                              isOpen ? (page.output_id ?? null) : null,
                            )
                          }
                          itemUrl={outputUrl}
                          itemFilename={
                            page.data?.images?.[0]?.filename ||
                            page.data?.gifs?.[0]?.filename ||
                            page.data?.files?.[0]?.filename ||
                            undefined
                          }
                          runId={page.run_id}
                          outputId={page.output_id}
                        >
                          <DropdownMenuItem
                            disabled={loadingCoverId === page.output_id}
                            onClick={async (e) => {
                              e.preventDefault();
                              await handleSetAsCoverImage(outputUrl);
                            }}
                          >
                            <div className="flex w-full items-center justify-between">
                              Set as Cover Image
                              {loadingCoverId === page.output_id && (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              )}
                            </div>
                          </DropdownMenuItem>
                        </FileURLRenderDropdown>
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
                          {/* Debug info */}
                          {/* {page.origin && (
                            <span className="rounded bg-blue-500/60 px-1.5 py-0.5 text-[10px] text-white/90">
                              {page.origin}
                            </span>
                          )} */}
                          {page.user_id && (
                            <UserIcon
                              user_id={page.user_id}
                              className="h-3.5 w-3.5"
                            />
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

        <div className="pointer-events-none fixed top-0 left-0 h-20 w-full bg-gradient-to-b from-white to-transparent dark:from-zinc-900" />

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
          desktopClassName="w-[600px] ring-1 ring-gray-200 dark:ring-gray-600/40"
          backgroundInteractive={true}
          open={isDrawerOpen}
          onClose={handleCloseRun}
        >
          <RunDetails run_id={runId} onClose={handleCloseRun} />
        </MyDrawer>
      )}
      <MoveAssetDialog
        asset={{
          id: "temp",
          name: selectedFilename || "New Asset",
          path: "/",
          is_folder: false,
          file_size: 0,
          mime_type: "",
          created_at: new Date().toISOString(),
          user_id: "",
        }}
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        onConfirm={(path) => {
          if (selectedOutputUrl) {
            handleAddAsset({ url: selectedOutputUrl, path });
          }
        }}
        dialogTitle="Add to Assets"
        dialogDescription="Select a destination folder for the asset"
        confirmText="Add Here"
        isAddAsset={true}
      />
    </>
  );
}
