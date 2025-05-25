import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(fileSize: number) {
  let sizeString: string;
  if (fileSize >= 1073741824) {
    sizeString = `${(fileSize / 1073741824).toFixed(2)} GB`;
  } else if (fileSize >= 1048576) {
    sizeString = `${(fileSize / 1048576).toFixed(2)} MB`;
  } else if (fileSize >= 1024) {
    sizeString = `${(fileSize / 1024).toFixed(2)} KB`;
  } else {
    sizeString = `${fileSize} bytes`;
  }
  return sizeString;
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (
    Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
  );
}

export function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  } else {
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  }
}

export function isCustomBucket(url: string) {
  return url.includes("X-Amz-Algorithm");
}

export function isGif(url: string) {
  return url.toLowerCase().endsWith(".gif");
}

export const getOptimizedImage = (url: string, isSmallView = false) => {
  // Skip if the url is from custom bucket or is a GIF file
  if (isCustomBucket(url) || isGif(url)) return url;

  return `https://comfydeploy.com/cdn-cgi/image/quality=${
    isSmallView ? 30 : 75
  }/${url}`;
};
