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
