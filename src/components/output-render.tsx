"use client";

import { DownloadButton } from "@/components/download-button";
// @ts-ignore
// @ts-ignore
import { cn } from "@/lib/utils";

type fileURLRenderProps = {
  url: string;
  imgClasses?: string;
  mediaStyles?: Record<string, unknown>;
};
export function FileURLRender({
  url,
  imgClasses: mediaClasses,
  mediaStyles,
}: fileURLRenderProps) {
  const filename = url.split("/").pop();
  if (!filename) {
    return <div className="bg-slate-300">Not possible to render</div>;
  }
  if (filename.endsWith(".mp4") || filename.endsWith(".webm")) {
    return (
      <video
        muted
        autoPlay
        controls
        className={cn("w-[400px]", mediaClasses)}
        style={mediaStyles}
      >
        <source src={url} type="video/mp4" />
        <source src={url} type="video/webm" />
        Your browser does not support the video tag.
      </video>
    );
  }

  // for 3d models
  if (filename.endsWith(".glb") || filename.endsWith(".obj")) {
    return (
      <>
        Currently not supported, please reach out to us on Discord, if you need
        this feature.
      </>
      // <ModelViewer url={url} filename={filename} mediaClasses={mediaClasses} mediaStyles={mediaStyles}/>
    );
  }

  if (
    filename.endsWith(".png") ||
    filename.endsWith(".gif") ||
    filename.endsWith(".jpg") ||
    filename.endsWith(".webp") ||
    filename.endsWith(".jpeg")
  ) {
    return (
      <img
        style={mediaStyles}
        className={cn("max-w-[200px]", mediaClasses)}
        alt={filename}
        src={url}
      />
    );
  }
  return <DownloadButton filename={filename} href={url} />;
}

export function OutputRender(props: {
  url: string;
}) {
  const url = props.url;

  if (!url) return <></>;

  return <FileURLRender url={url} />;
}
