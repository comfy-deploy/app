"use client";

import { DownloadButton } from "@/components/download-button";

import { ErrorBoundary } from "@/components/error-boundary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Download, SearchX } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
// import dynamic from "next/dynamic";

// const ModelViewer = dynamic(
// 	() => import("./ModelViewer").then((mod) => mod.ModelViewer),
// 	{ ssr: false },
// );

type fileURLRenderProps = {
  url: string;
  imgClasses?: string;
  lazyLoading?: boolean;
  onLoad?: () => void;
};

function _FileURLRender({
  url,
  imgClasses: mediaClasses,
  lazyLoading = false,
  onLoad,
}: fileURLRenderProps) {
  const a = new URL(url);
  const filename = a.pathname.split("/").pop();
  if (!filename) {
    return <div className="bg-slate-300">Not possible to render</div>;
  }
  if (filename.endsWith(".mp4") || filename.endsWith(".webm")) {
    console.log("video", url);
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

  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (imageError) {
      onLoad?.();
    }
  }, [imageError]);

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
          {/* <ImageIcon size={20} strokeWidth={1.5} /> */}
          <SearchX size={20} strokeWidth={1.5} />
          <span>Not found</span>
        </div>
      );
    }

    return (
      <img
        onLoad={onLoad}
        className={cn("max-w-[200px]", mediaClasses)}
        src={url}
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
            "flex aspect-square h-full w-full max-w-[200px] flex-col items-center justify-center gap-2 text-gray-600",
            props.imgClasses,
          )}
        >
          {/* <ImageIcon size={20} strokeWidth={1.5} /> */}
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
}: {
  urls: {
    url: string;
    upload_duration?: number;
    file_name?: string;
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
}) {
  const [openOnIndex, setOpenOnIndex] = useState<number | null>(null);

  if (!canExpandToView) {
    if (columns > 1) {
      return (
        <div className={cn("grid grid-cols-1 gap-2", `grid-cols-${columns}`)}>
          {urls.map((url, i) => (
            <FileURLRender key={i} url={url.url} imgClasses={imgClasses} />
          ))}
        </div>
      );
    }

    return (
      <>
        {urls.map((url, i) => (
          <FileURLRender key={i} url={url.url} imgClasses={imgClasses} />
        ))}
      </>
    );
  }

  const ImageList = () => {
    return (
      <>
        {urls.map((_, i) => {
          const urlImage = urls[i];

          return (
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

              {canDownload && (
                <Button
                  onClick={async (e) => {
                    e.stopPropagation();
                    const url = urlImage;
                    const a = document.createElement("a");
                    a.href = url.url;
                    a.download = `ComfyImage_${i}`;
                    a.target = "_blank";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-black bg-opacity-50 text-white opacity-0 transition-all duration-300 hover:bg-black hover:bg-opacity-70 hover:text-white group-hover/item:opacity-100"
                >
                  <Download size={16} />
                </Button>
              )}
            </button>
          );
        })}
      </>
    );
  };

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
          <ImageList />
        </div>
      ) : (
        <ImageList />
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
        ...(output.data.mesh?.map((mesh: any) => ({
          ...mesh,
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
}: {
  run: any;
  imgClasses: string;
  lazyLoading?: boolean;
  canExpandToView?: boolean;
  canDownload?: boolean;
  displayCount?: number;
  columns?: number;
}) {
  const { total: totalUrlCount, urls: urlList } = getTotalUrlCountAndUrls(
    run.outputs || [],
  );

  const urlsToDisplay =
    displayCount && urlList.length > 0
      ? urlList.slice(0, displayCount)
      : urlList;

  return (
    <FileURLRenderMulti
      urls={urlsToDisplay}
      imgClasses={imgClasses}
      canExpandToView={canExpandToView}
      lazyLoading={lazyLoading}
      canDownload={canDownload}
      columns={columns}
    />
  );
}

export function OutputRender(props: { run_id: string; fileUrl: string }) {
  if (!props.fileUrl) return <></>;

  return <FileURLRender url={props.fileUrl} />;
}
