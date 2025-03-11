import { DownloadButton } from "@/components/download-button";
import { ErrorBoundary } from "@/components/error-boundary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
} from "lucide-react";
import { useEffect, useState, useCallback, lazy, Suspense } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
import { ShineBorder } from "../magicui/shine-border";
import { downloadImage } from "@/utils/download-image";
import { ImageInputsTooltip } from "../image-inputs-tooltip";
// import { ModelRenderer } from "./3d-renderer";

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
};

function _FileURLRender({
  url,
  imgClasses: mediaClasses,
  lazyLoading = false,
  onLoad,
  isMainView = false,
}: fileURLRenderProps) {
  const a = new URL(url);
  const filename = a.pathname.split("/").pop();
  if (!filename) {
    return <div className="bg-slate-300">Not possible to render</div>;
  }

  if (filename.endsWith(".mp4") || filename.endsWith(".webm")) {
    return (
      <video
        autoPlay
        loop
        muted
        playsInline
        className={cn("w-[500px]", mediaClasses)}
      >
        <source src={url} type="video/mp4" />
        <source src={url} type="video/webm" />
        Your browser does not support the video tag.
      </video>
    );
  }

  // For 3D models, use the separate component
  if (filename.endsWith(".glb") || filename.endsWith(".gltf")) {
    return (
      <ModelRenderer
        url={url}
        mediaClasses={mediaClasses}
        isMainView={isMainView}
      />
    );
  }

  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (imageError) {
      onLoad?.();
    }
  }, [imageError, onLoad]);

  if (
    filename.endsWith(".png") ||
    filename.endsWith(".gif") ||
    filename.endsWith(".jpg") ||
    filename.endsWith(".webp") ||
    filename.endsWith(".jpeg")
  ) {
    if (imageError) {
      return (
        <div
          className={cn(
            "flex aspect-square h-full w-full max-w-[200px] flex-col items-center justify-center gap-2 text-gray-600",
            mediaClasses,
          )}
        >
          <SearchX size={20} strokeWidth={1.5} />
          <span>Not found</span>
        </div>
      );
    }

    return (
      <img
        onLoad={onLoad}
        className={cn("max-w-[200px]", mediaClasses)}
        src={getOptimizedImage(url)}
        alt={filename}
        loading={lazyLoading ? "lazy" : undefined}
        onError={() => setImageError(true)}
      />
    );
  }

  return <DownloadButton filename={filename} href={url} />;
}

export function FileURLRender(props: fileURLRenderProps) {
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
      <_FileURLRender {...props} />
    </ErrorBoundary>
  );
}

function FileURLRenderMulti({
  urls,
  imgClasses,
  canExpandToView,
  lazyLoading,
  canDownload,
  columns = 1,
  isMainView = false,
}: {
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
  const [openOnIndex, setOpenOnIndex] = useState<number | null>(null);

  // Move expandImage outside of the ImageList component to prevent recreation on each render
  const expandImage = useCallback(({ url }: { url: string }) => {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  if (!canExpandToView) {
    if (columns > 1 && urls.length > 1) {
      return (
        <div className={cn("grid grid-cols-1 gap-2", `grid-cols-${columns}`)}>
          {urls.map((url, i) => (
            <FileURLRender
              key={i}
              url={url.url}
              imgClasses={imgClasses}
              isMainView={isMainView}
            />
          ))}
        </div>
      );
    }

    return (
      <>
        {urls.map((url, i) => (
          <FileURLRender
            key={i}
            url={url.url}
            imgClasses={imgClasses}
            isMainView={isMainView}
          />
        ))}
      </>
    );
  }

  // Render the image list directly instead of using a nested component
  return (
    <>
      <Dialog
        open={openOnIndex !== null}
        onOpenChange={() => setOpenOnIndex(null)}
      >
        <DialogContent className="max-h-fit max-w-fit">
          <DialogHeader>
            <DialogTitle />
          </DialogHeader>
          {urls.length === 1 && (
            <FileURLRender
              url={urls[0].url}
              imgClasses="max-w-full rounded-[8px] max-h-[80vh]"
              lazyLoading={lazyLoading}
              isMainView={isMainView}
            />
          )}
          {urls.length > 1 && (
            <Carousel className=" mx-9" opts={{ startIndex: openOnIndex || 0 }}>
              <CarouselContent>
                {urls.map((image, index) => (
                  <CarouselItem
                    key={index}
                    className="flex aspect-square max-h-[80vh] max-w-full items-center justify-center"
                  >
                    <FileURLRender
                      url={image.url}
                      imgClasses="max-w-full rounded-[8px] max-h-[80vh]"
                      lazyLoading={lazyLoading}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <>
                <CarouselPrevious />
                <CarouselNext />
              </>
            </Carousel>
          )}
        </DialogContent>
      </Dialog>

      {columns > 1 ? (
        <div className={cn("grid grid-cols-1 gap-2", `grid-cols-${columns}`)}>
          {urls.map((urlImage, i) => (
            <button
              key={i}
              type="button"
              className="group/item relative flex overflow-clip rounded-[8px] "
              onClick={() => {
                setOpenOnIndex(i);
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

              {urlImage.upload_duration && (
                <Badge className="absolute top-2 left-2 text-white opacity-0 transition-all duration-300 group-hover/item:bg-black group-hover/item:opacity-100">
                  Upload time:{" "}
                  {Math.round(urlImage.upload_duration * 100) / 100}s
                </Badge>
              )}

              {urlImage.node_meta && (
                <Badge className="absolute bottom-2 left-2 text-white opacity-0 transition-all duration-300 group-hover/item:bg-black/25 group-hover/item:opacity-100">
                  {urlImage.node_meta.node_class}
                </Badge>
              )}

              {urlImage.url && (
                <ImageInputsTooltip tooltipText="View full resolution">
                  <Button
                    onClick={(event) => {
                      event.stopPropagation();
                      expandImage({ url: urlImage.url });
                    }}
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-black bg-opacity-50 text-white opacity-0 transition-all duration-300 hover:bg-black hover:bg-opacity-70 hover:text-white group-hover/item:opacity-100"
                  >
                    <Expand size={16} />
                  </Button>
                </ImageInputsTooltip>
              )}

              {canDownload && (
                <Button
                  onClick={async (e) => {
                    e.stopPropagation();
                    await downloadImage({
                      url: urlImage.url,
                      fileName: urlImage.filename,
                    });
                  }}
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 bottom-2 bg-black bg-opacity-50 text-white opacity-0 transition-all duration-300 hover:bg-black hover:bg-opacity-70 hover:text-white group-hover/item:opacity-100"
                >
                  <Download size={16} />
                </Button>
              )}
            </button>
          ))}
        </div>
      ) : (
        <>
          {urls.map((urlImage, i) => (
            <button
              key={i}
              type="button"
              className="group/item relative flex overflow-clip rounded-[8px] "
              onClick={() => {
                setOpenOnIndex(i);
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

              {urlImage.upload_duration && (
                <Badge className="absolute top-2 left-2 text-white opacity-0 transition-all duration-300 group-hover/item:bg-black group-hover/item:opacity-100">
                  Upload time:{" "}
                  {Math.round(urlImage.upload_duration * 100) / 100}s
                </Badge>
              )}

              {urlImage.node_meta && (
                <Badge className="absolute bottom-2 left-2 text-white opacity-0 transition-all duration-300 group-hover/item:bg-black/25 group-hover/item:opacity-100">
                  {urlImage.node_meta.node_class}
                </Badge>
              )}

              {urlImage.url && (
                <ImageInputsTooltip tooltipText="View full resolution">
                  <Button
                    onClick={(event) => {
                      event.stopPropagation();
                      expandImage({ url: urlImage.url });
                    }}
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-black bg-opacity-50 text-white opacity-0 transition-all duration-300 hover:bg-black hover:bg-opacity-70 hover:text-white group-hover/item:opacity-100"
                  >
                    <Expand size={16} />
                  </Button>
                </ImageInputsTooltip>
              )}

              {canDownload && (
                <Button
                  onClick={async (e) => {
                    e.stopPropagation();
                    await downloadImage({
                      url: urlImage.url,
                      fileName: urlImage.filename,
                    });
                  }}
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 bottom-2 bg-black bg-opacity-50 text-white opacity-0 transition-all duration-300 hover:bg-black hover:bg-opacity-70 hover:text-white group-hover/item:opacity-100"
                >
                  <Download size={16} />
                </Button>
              )}
            </button>
          ))}
        </>
      )}
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

export function OutputRender(props: { run_id: string; fileUrl: string }) {
  if (!props.fileUrl) return <></>;

  return <FileURLRender url={props.fileUrl} />;
}
