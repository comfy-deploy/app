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

export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD") // Normalize Unicode: decompose combined letters into base and accent
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritic marks
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric chars with dashes
    .replace(/^-+|-+$/g, ""); // Remove leading and trailing dashes
}
