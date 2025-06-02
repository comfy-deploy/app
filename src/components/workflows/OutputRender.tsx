import { DownloadButton } from "@/components/download-button";
import { ErrorBoundary } from "@/components/error-boundary";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, getOptimizedImage } from "@/lib/utils";
import {
  Download,
  SearchX,
  Check,
  X,
  Minus,
  Loader2,
  CircleX,
  Expand,
  Ellipsis,
  Search,
  FileText,
  FolderOpen,
  Clock,
} from "lucide-react";
import { useEffect, useState, useCallback, lazy, Suspense } from "react";
import { ShineBorder } from "../magicui/shine-border";
import { downloadImage } from "@/utils/download-image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { CodeBlock } from "../ui/code-blocks";
import { useAddAsset } from "@/hooks/hook";
import { toast } from "sonner";
import { MoveAssetDialog } from "../move-asset-dialog";
import { useAuthStore } from "@/lib/auth-store";

// Create a lazy-loaded version of the component
const LazyModelRenderer = lazy(() =>
  import("./3d-renderer").then((module) => ({
    default: module.ModelRendererComponent,
  })),
);

// Fallback loading component for the entire 3D renderer
function LoadingFallback({ mediaClasses }: { mediaClasses?: string }) {
  return (
    <div
      className={cn(
        "flex h-[70vh] w-[70vh] items-center justify-center bg-gray-100/50",
        mediaClasses,
      )}
    >
      <div className="flex flex-col items-center gap-2 text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    </div>
  );
}

// Export the wrapper component with Suspense
export function ModelRenderer(props: {
  url: string;
  mediaClasses?: string;
  isMainView?: boolean;
  isSmallView?: boolean;
}) {
  return (
    <Suspense fallback={<LoadingFallback mediaClasses={props.mediaClasses} />}>
      <LazyModelRenderer {...props} />
    </Suspense>
  );
}

type fileURLRenderProps = {
  url: string;
  imgClasses?: string;
  lazyLoading?: boolean;
  onLoad?: () => void;
  isMainView?: boolean;
  canFullScreen?: boolean;
  isSmallView?: boolean;
  canDownload?: boolean;

  // temp fix
  isAssetBrowser?: boolean;
};

function _FileURLRender({
  url,
  imgClasses: mediaClasses,
  lazyLoading = false,
  onLoad,
  isMainView = false,
  isSmallView = false,
  isAssetBrowser = false,
}: fileURLRenderProps) {
  const { token } = useAuthStore();
  const a = new URL(url);
  const filename = a.pathname.split("/").pop();
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      setImageError(false);
      setIsLoading(true);
    }
  }, [token]);

  useEffect(() => {
    if (!imageError && !isLoading) {
      onLoad?.();
    }
  }, [imageError, isLoading, onLoad]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  if (!filename) {
    return <div className="bg-slate-300">Not possible to render</div>;
  }

  // Convert filename to lowercase once for all checks
  const lowercaseFilename = filename.toLowerCase();

  if (
    lowercaseFilename.endsWith(".mp4") ||
    lowercaseFilename.endsWith(".webm") ||
    lowercaseFilename.endsWith(".mov")
  ) {
    return (
      <div className="relative">
        {isLoading && (
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-gray-100/50",
              mediaClasses,
            )}
          >
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        )}
        <video
          autoPlay={!isSmallView}
          loop
          muted
          playsInline
          className={cn("w-[500px]", mediaClasses)}
          preload={isSmallView ? "metadata" : "auto"}
          onLoadedData={handleLoad}
        >
          <source src={url} type="video/mp4" />
          <source src={url} type="video/webm" />
          <source src={url} type="video/quicktime" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // For 3D models, use the separate component
  if (
    lowercaseFilename.endsWith(".glb") ||
    lowercaseFilename.endsWith(".gltf") ||
    lowercaseFilename.endsWith(".obj")
  ) {
    return (
      <ModelRenderer
        url={url}
        mediaClasses={mediaClasses}
        isMainView={isMainView}
        isSmallView={isSmallView}
      />
    );
  }

  // For text-based files
  const textExtensions = [".txt", ".json", ".md"];
  if (textExtensions.some((ext) => lowercaseFilename.endsWith(ext))) {
    if (isSmallView) {
      return (
        <div className="flex h-full w-full items-center justify-center">
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>
      );
    }

    return (
      <TextFileRenderer
        url={url}
        filename={filename}
        mediaClasses={mediaClasses}
      />
    );
  }

  const imageExtensions = [
    ".png",
    ".gif",
    ".jpg",
    ".jpeg",
    ".webp",
    ".avif",
    ".heic",
    ".heif",
  ];

  if (imageExtensions.some((ext) => lowercaseFilename.endsWith(ext))) {
    if (imageError) {
      return (
        <div
          className={cn(
            "@container flex aspect-square h-full w-full max-w-[200px] flex-col items-center justify-center gap-1 text-gray-600 dark:text-gray-400",
            mediaClasses,
          )}
        >
          <SearchX size={20} strokeWidth={1.5} />
          <span className="@4xs:inline hidden text-sm">Not found</span>
        </div>
      );
    }

    return (
      <div className={cn("relative", !isAssetBrowser && "h-full w-full")}>
        {isLoading && (
          <div
            className={cn(
              "absolute inset-0 flex h-full w-full items-center justify-center bg-gray-100/50",
              mediaClasses,
            )}
          >
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        )}
        <img
          onLoad={handleLoad}
          className={cn(
            "max-w-[200px]",
            mediaClasses,
            isLoading ? "opacity-0" : "opacity-100",
          )}
          src={getOptimizedImage(url, isSmallView, token)}
          alt={filename}
          loading={lazyLoading ? "lazy" : undefined}
          onError={() => {
            setImageError(true);
            setIsLoading(false);
          }}
        />
      </div>
    );
  }

  return <DownloadButton filename={filename} href={url} />;
}

// New component for text file rendering
function TextFileRenderer({
  url,
  filename,
  mediaClasses,
}: {
  url: string;
  filename: string;
  mediaClasses?: string;
}) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }
        const text = await response.text();
        setContent(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [url]);

  const fileExtension = filename.split(".").pop()?.toLowerCase();

  if (loading) {
    return (
      <div
        className={cn(
          "flex h-[200px] w-full max-w-[500px] items-center justify-center rounded-md bg-gray-50 p-4 dark:bg-zinc-700",
          mediaClasses,
        )}
      >
        <Loader2 className="h-5 w-5 animate-spin text-gray-400 dark:text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "w-full max-w-[500px] rounded-md bg-red-50 p-4 dark:bg-red-900/50",
          mediaClasses,
        )}
      >
        <div className="mb-2 flex items-center gap-2 text-red-500">
          <CircleX size={16} />
          <span className="font-medium">Error loading file</span>
        </div>
        <p className="text-red-700 text-sm dark:text-red-400">{error}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => window.open(url, "_blank")}
        >
          <Download className="mr-2 h-3.5 w-3.5" />
          Download Instead
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "max-h-[400px] w-full max-w-[500px] overflow-auto rounded-md border",
        mediaClasses,
      )}
    >
      <div className="flex items-center justify-between border-b bg-gray-50 px-3 py-2 dark:bg-zinc-700">
        <span className="max-w-[200px] truncate font-medium text-sm">
          {filename}
        </span>
      </div>
      {fileExtension === "json" ? (
        <CodeBlock
          code={JSON.stringify(JSON.parse(content || "{}"), null, 2)}
          lang="json"
          className="max-h-full text-xs"
          scrollAreaClassName="rounded-none"
        />
      ) : (
        <pre className="whitespace-pre-wrap bg-gray-100 p-4 font-mono text-xs dark:bg-zinc-800">
          {content}
        </pre>
      )}
    </div>
  );
}

export function FileURLRender(props: fileURLRenderProps) {
  const [open, setOpen] = useState(false);

  return (
    <ErrorBoundary
      fallback={(e) => (
        <div
          className={cn(
            "flex aspect-square h-full w-full max-w-[200px] flex-col items-center justify-center gap-2 px-4 text-gray-600 text-xs",
            props.imgClasses,
          )}
        >
          <SearchX size={20} strokeWidth={1.5} />
          <span>Error rendering: {e.message}</span>
        </div>
      )}
    >
      {props.canFullScreen ? (
        <>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className="h-full w-full">
              <_FileURLRender {...props} />
            </DialogTrigger>

            <DialogContent
              className="h-screen max-w-full border-none bg-transparent shadow-none"
              onClick={() => {
                setOpen(false);
              }}
            >
              <DialogTitle className="hidden" />
              <div className="flex h-full w-full items-center justify-center">
                <_FileURLRender
                  isAssetBrowser={props.isAssetBrowser}
                  url={props.url}
                  imgClasses="shadow-md max-w-[90vw] max-h-[90vh] object-contain"
                  lazyLoading={props.lazyLoading}
                />
              </div>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <div className={cn("group !shadow-none relative", props.imgClasses)}>
          <_FileURLRender {...props} />
          {props.canDownload && (
            <div className="absolute top-2 right-2">
              <Button
                size="icon"
                className="opacity-0 shadow-md transition-opacity duration-300 group-hover:opacity-100"
                hideLoading
                onClick={async (e) => {
                  e.stopPropagation();
                  await downloadImage({
                    url: props.url,
                    fileName: props.url.split("/").pop(),
                  });
                }}
              >
                <Download className="h-4 w-4 " />
              </Button>
            </div>
          )}
        </div>
      )}
    </ErrorBoundary>
  );
}

function FileURLRenderMulti({
  runId,
  urls,
  imgClasses,
  canExpandToView,
  lazyLoading,
  canDownload,
  columns = 1,
  isMainView = false,
}: {
  runId?: string;
  urls: {
    url: string;
    upload_duration?: number;
    filename?: string;
    node_meta?: {
      node_class?: string;
      node_id?: string;
    };
  }[];
  imgClasses: string;
  canExpandToView: boolean;
  lazyLoading: boolean;
  canDownload: boolean;
  columns?: number;
  isMainView?: boolean;
}) {
  if (!canExpandToView) {
    if (columns > 1 && urls.length > 1) {
      return (
        <div className={cn("grid grid-cols-1 gap-2", `grid-cols-${columns}`)}>
          {urls.map((url, i) => (
            <FileURLRender
              key={`${runId || ""}-${url.url}-${i}`}
              url={url.url}
              imgClasses={imgClasses}
              isMainView={isMainView}
              canDownload={canDownload}
            />
          ))}
        </div>
      );
    }

    return (
      <>
        {urls.map((url, i) => (
          <FileURLRender
            key={`${runId || ""}-${url.url}-${i}`}
            url={url.url}
            imgClasses={imgClasses}
            isMainView={isMainView}
            canDownload={canDownload}
          />
        ))}
      </>
    );
  }

  // Render the image list directly instead of using a nested component
  return (
    <>
      {columns > 1 ? (
        <div className={cn("grid grid-cols-1 gap-2", `grid-cols-${columns}`)}>
          {urls.map((urlImage, i) => {
            return (
              <MediaDisplay
                key={`${runId || ""}-${urlImage.url}-${i}`}
                urlImage={urlImage}
                imgClasses={imgClasses}
                lazyLoading={lazyLoading}
                canDownload={canDownload}
              />
            );
          })}
        </div>
      ) : (
        <>
          {urls.map((urlImage, i) => (
            <MediaDisplay
              key={`${runId || ""}-${urlImage.url}-${i}`}
              urlImage={urlImage}
              imgClasses={imgClasses}
              lazyLoading={lazyLoading}
              canDownload={canDownload}
            />
          ))}
        </>
      )}
    </>
  );
}

function MediaDisplay({
  urlImage,
  imgClasses,
  lazyLoading,
  canDownload = false,
}: {
  urlImage: any;
  imgClasses: string;
  lazyLoading: boolean;
  canDownload: boolean;
}) {
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);

  const expandImage = useCallback(({ url }: { url: string }) => {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  const { mutate: addAsset } = useAddAsset();

  const handleAddAsset = async ({
    url,
    path,
  }: {
    url: string;
    path: string;
  }) => {
    try {
      await addAsset({ url, path });
      toast.success(`${urlImage.filename} added to assets`);
      setMoveDialogOpen(false);
    } catch (error) {
      toast.error(`Failed to add asset: ${error}`);
    }
  };

  const [open, setOpen] = useState(false);

  return (
    <>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
      <div
        key={`${urlImage.url}-${urlImage.node_meta?.node_id || ""}`}
        className="group relative flex cursor-pointer overflow-clip rounded-[8px]"
        onClick={() => {
          setOpen(true);
        }}
      >
        <Skeleton className={cn("aspect-square min-w-[230px]")} />
        <FileURLRender
          url={urlImage.url}
          imgClasses={cn(
            imgClasses,
            "absolute top-0 left-0 pointer-events-none",
          )}
          lazyLoading={lazyLoading}
        />

        <div className="absolute top-0 right-0 w-full rounded-t-[4px] bg-gradient-to-t from-transparent to-black/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-transparent"
                >
                  <Ellipsis className="h-3.5 w-3.5 text-white/90" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52" blocking={true}>
                {urlImage.filename && (
                  <>
                    <DropdownMenuLabel className="line-clamp-1">
                      {urlImage.filename}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={(event) => {
                    event.stopPropagation();
                    expandImage({ url: urlImage.url });
                  }}
                >
                  <div className="flex w-full items-center justify-between">
                    View Full Resolution <Expand className="h-3.5 w-3.5" />
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(event) => {
                    event.stopPropagation();
                    setMoveDialogOpen(true);
                  }}
                >
                  <div className="flex w-full items-center justify-between">
                    Add to assets <FolderOpen className="h-3.5 w-3.5" />
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async (e) => {
                    e.stopPropagation();
                    await downloadImage({
                      url: urlImage.url,
                      fileName: urlImage.filename,
                    });
                  }}
                >
                  <div className="flex w-full items-center justify-between">
                    Download <Download className="h-3.5 w-3.5" />
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full rounded-b-[4px] bg-gradient-to-b from-transparent to-black/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex items-center justify-between px-3 py-2 drop-shadow-md">
            <div className="flex items-center gap-2">
              <span className="text-white/90 text-xs">
                {Math.round(urlImage.upload_duration * 100) / 100}s
              </span>
              {urlImage.filename && (
                <span className="w-28 truncate rounded bg-white/20 px-1.5 py-0.5 text-[10px] text-white/90">
                  {urlImage.filename}
                </span>
              )}
            </div>
            <Search className="h-3.5 w-3.5 text-white/90" />
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="h-screen max-w-full border-none bg-transparent shadow-none"
          onClick={() => {
            setOpen(false);
          }}
        >
          <div className="flex h-full w-full items-center justify-center">
            <FileURLRender
              url={urlImage.url}
              imgClasses="shadow-md max-w-[90vw] max-h-[90vh] object-contain"
              lazyLoading={lazyLoading}
            />
          </div>
        </DialogContent>
      </Dialog>

      <MoveAssetDialog
        asset={{
          id: "temp",
          name: urlImage.filename || "New Asset",
          path: "/",
          is_folder: false,
          file_size: 0,
          mime_type: "",
          created_at: new Date().toISOString(),
          user_id: "",
        }}
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        onConfirm={(path) => handleAddAsset({ url: urlImage.url, path })}
        dialogTitle="Add to Assets"
        dialogDescription="Select a destination folder for the asset"
        confirmText="Add Here"
        isAddAsset={true}
      />
    </>
  );
}

export function getTotalUrlCountAndUrls(outputs: any[]) {
  const urls: any[] = [];
  const total: number =
    outputs?.reduce((total, output) => {
      const files = [
        ...(output.data.images?.map((image: any) => ({
          ...image,
          node_meta: output.node_meta,
        })) || []),
        ...(output.data.files?.map((file: any) => ({
          ...file,
          node_meta: output.node_meta,
        })) || []),
        ...(output.data.gifs?.map((gif: any) => ({
          ...gif,
          node_meta: output.node_meta,
        })) || []),
        ...(output.data.model_files?.map((model_file: any) => ({
          ...model_file,
          node_meta: output.node_meta,
        })) || []),
      ];
      urls.push(...files);
      return total + files.length;
    }, 0) || 0;
  return { total, urls };
}

/**
 * Renders multiple file URLs, optionally allowing for expandable views and downloads.
 * @param {any} run - insert the run here.
 * @param {string} imgClasses - tailwind class for each image style.
 * @param {boolean} canExpandToView - If true, allows images to be expanded in a dialog.
 * @param {boolean} lazyLoading - If true, images will be lazy loaded.
 * @param {boolean} canDownload - If true, displays a download button for each image.
 * @param {number} displayCount - Number of images to display, if not set, all images will be displayed.
 * @returns {JSX.Element} imageRender - Component display all images.
 */
export function OutputRenderRun({
  run,
  imgClasses,
  lazyLoading = false,
  canExpandToView = false,
  canDownload = false,
  columns = 1,
  displayCount,
  showNullSkeleton = false,
  isMainView = false,
}: {
  run: any;
  imgClasses: string;
  lazyLoading?: boolean;
  canExpandToView?: boolean;
  canDownload?: boolean;
  displayCount?: number;
  columns?: number;
  showNullSkeleton?: boolean;
  isMainView?: boolean;
}) {
  const { total: totalUrlCount, urls: urlList } = getTotalUrlCountAndUrls(
    run.outputs || [],
  );

  const urlsToDisplay =
    displayCount && urlList.length > 0
      ? urlList.slice(0, displayCount)
      : urlList;

  if (showNullSkeleton && urlList.length === 0) {
    return (
      <div className="relative">
        <Skeleton className={imgClasses} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[8px] text-muted-foreground">No outputs</span>
        </div>
      </div>
    );
  }

  return (
    <FileURLRenderMulti
      runId={run.id}
      urls={urlsToDisplay}
      imgClasses={imgClasses}
      canExpandToView={canExpandToView}
      lazyLoading={lazyLoading}
      canDownload={canDownload}
      columns={columns}
      isMainView={isMainView}
    />
  );
}

// Add this new component for status indicators
function RunStatusIndicator({ status }: { status: string }) {
  if (!status) return null;

  let StatusIcon: any;
  let iconClassName: string;
  let extraClassName: string;

  switch (status) {
    case "success":
      StatusIcon = Check;
      iconClassName = "text-green-500";
      extraClassName = "shadow-md";
      break;
    case "failed":
      StatusIcon = X;
      iconClassName = "text-red-500";
      extraClassName = "";
      break;
    case "cancelled":
      StatusIcon = Minus;
      iconClassName = "text-gray-200";
      extraClassName = "";
      break;
    case "timeout":
      StatusIcon = Clock;
      iconClassName = "text-amber-500";
      extraClassName = "";
      break;
    case "running":
    case "uploading":
    case "not-started":
    case "queued":
      StatusIcon = Loader2;
      iconClassName = "text-gray-200 animate-spin";
      extraClassName = "";
      break;
    default:
      return null;
  }

  return (
    <div
      className={cn(
        "absolute right-1.5 bottom-1.5 z-10 rounded-[6px] bg-black/50 p-1 backdrop-blur-md",
        extraClassName,
      )}
    >
      <StatusIcon size={12} className={iconClassName} />
    </div>
  );
}

export function PlaygroundOutputRenderRun({
  run,
  imgClasses,
  isSelected = false,
}: {
  run: any;
  imgClasses: string;
  isSelected?: boolean;
}) {
  const { total: totalUrlCount, urls: urlList } = getTotalUrlCountAndUrls(
    run.outputs || [],
  );
  const urlsToDisplay = urlList.length > 0 ? urlList.slice(0, 1) : [];

  return (
    <div
      className={cn(
        "relative h-full transition-transform",
        isSelected
          ? "-translate-x-1 hover:-translate-x-1.5"
          : "hover:-translate-x-1",
      )}
    >
      <RunStatusIndicator status={run.status} />
      {/* Add image count indicator when there are multiple images */}
      {urlList.length > 1 && (
        <div className="absolute top-1.5 right-1.5 z-10 rounded-[8px] bg-black/70 px-1.5 font-medium text-2xs text-white">
          +{urlList.length}
        </div>
      )}

      {isSelected && (
        <div
          className="group absolute top-0 left-0 z-20 flex h-full w-full items-center justify-center rounded-[8px] hover:bg-black/20 hover:backdrop-blur-sm"
          title="deselect"
        >
          <CircleX className="text-gray-200 opacity-0 transition-opacity group-hover:opacity-100" />
          <ShineBorder
            color={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
            className="!min-w-[108px] h-full bg-transparent"
            borderWidth={4}
          />
        </div>
      )}

      {urlsToDisplay.length > 0 ? (
        <>
          <FileURLRenderMulti
            runId={run.id}
            urls={urlsToDisplay}
            imgClasses={imgClasses}
            canExpandToView={false}
            lazyLoading={true}
            canDownload={false}
            columns={1}
            isMainView={false}
          />
          <div className="absolute right-0 bottom-0 left-0 h-8 w-[105px] shrink-0 rounded-b-[6px] bg-gradient-to-t from-black/50 to-transparent" />
        </>
      ) : (
        <>
          <Skeleton
            className={cn(
              imgClasses,
              run.status === "failed" && "bg-red-500/20",
            )}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={cn(
                "text-[10px] text-muted-foreground",
                run.status === "cancelled" && "line-through",
                run.status === "failed" && "text-red-500",
              )}
            >
              {run.status === "cancelled"
                ? "Cancelled"
                : run.status === "failed"
                  ? "Failed"
                  : run.status === "running" ||
                      run.status === "uploading" ||
                      run.status === "not-started" ||
                      run.status === "queued"
                    ? "Generating"
                    : "No outputs"}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export function OutputRender({ fileUrl }: { fileUrl: string }) {
  if (!fileUrl) return <></>;

  return <FileURLRender url={fileUrl} />;
}
