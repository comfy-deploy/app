/**
 * Image optimization utilities for the frontend
 * Based on the backend image optimization API
 */

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "jpeg" | "png";
}

/**
 * Utility to generate optimized image URLs
 */
export const getOptimizedImageUrl = (
  imagePath: string,
  transformations = "auto",
): string => {
  // const baseUrl = process.env.NEXT_PUBLIC_CD_API_URL || "";
  return `/api/optimize/${transformations}/${imagePath}`;
};

/**
 * Generate transformation string from options object
 */
export const buildTransformations = (
  options: ImageTransformOptions,
): string => {
  const params: string[] = [];

  if (options.width) params.push(`w_${options.width}`);
  if (options.height) params.push(`h_${options.height}`);
  if (options.quality) params.push(`q_${options.quality}`);
  if (options.format) params.push(`f_${options.format}`);

  return params.length > 0 ? params.join(",") : "auto";
};

/**
 * Get optimized URL with typed options
 */
export const getOptimizedImageUrlWithOptions = (
  imagePath: string,
  options: ImageTransformOptions = {},
): string => {
  const transformations = buildTransformations(options);
  return getOptimizedImageUrl(imagePath, transformations);
};

/**
 * Responsive image helper - returns URLs for different screen sizes
 */
export const getResponsiveImageUrls = (imagePath: string) => ({
  thumbnail: getOptimizedImageUrl(imagePath, "w_300,h_300,q_85,f_webp"),
  small: getOptimizedImageUrl(imagePath, "w_600,q_80,f_webp"),
  medium: getOptimizedImageUrl(imagePath, "w_1200,q_80,f_webp"),
  large: getOptimizedImageUrl(imagePath, "w_1920,q_75,f_webp"),
  original: getOptimizedImageUrl(imagePath, "auto"),
});

/**
 * Extract S3 key from full URL, handling temporary access tokens
 */
export const extractS3Key = (url: string): string => {
  // If it's already a path/key, return as is
  if (!url.startsWith("http")) {
    return url;
  }

  try {
    const urlObj = new URL(url);

    // Remove query parameters (which include access tokens like X-Amz-Algorithm, etc.)
    const pathWithoutQuery = urlObj.pathname;

    // Extract from S3 URL patterns
    const s3Patterns = [
      // bucket.s3.region.amazonaws.com/key
      /^\/(.+)$/, // Simple case - everything after first slash
    ];

    // Handle different S3 URL formats
    if (
      urlObj.hostname.includes(".s3") &&
      urlObj.hostname.includes("amazonaws.com")
    ) {
      // Format: bucket.s3.region.amazonaws.com/key
      const key = pathWithoutQuery.substring(1); // Remove leading slash
      return decodeURIComponent(key);
    }

    if (
      urlObj.hostname.includes("s3") &&
      urlObj.hostname.includes("amazonaws.com")
    ) {
      // Format: s3.region.amazonaws.com/bucket/key
      const pathParts = pathWithoutQuery.substring(1).split("/"); // Remove leading slash and split
      if (pathParts.length > 1) {
        const key = pathParts.slice(1).join("/"); // Skip bucket name, join the rest
        return decodeURIComponent(key);
      }
    }

    // Fallback: use the path without leading slash
    const key = pathWithoutQuery.substring(1);
    return decodeURIComponent(key);
  } catch (error) {
    // If URL parsing fails, try regex patterns as fallback
    const s3Patterns = [
      /https?:\/\/[^\/]+\.s3[^\/]*\.amazonaws\.com\/(.+?)(?:\?.*)?$/,
      /https?:\/\/s3[^\/]*\.amazonaws\.com\/[^\/]+\/(.+?)(?:\?.*)?$/,
      /https?:\/\/[^\/]+\.amazonaws\.com\/(.+?)(?:\?.*)?$/,
    ];

    for (const pattern of s3Patterns) {
      const match = url.match(pattern);
      if (match) {
        return decodeURIComponent(match[1]);
      }
    }

    // If no pattern matches, return the original URL
    return url;
  }
};

/**
 * Check if URL is already optimized by our service
 */
export const isOptimizedUrl = (url: string): boolean => {
  const baseUrl = process.env.NEXT_PUBLIC_CD_API_URL || "";
  return url.includes(`${baseUrl}/api/optimize/`);
};

/**
 * Legacy compatibility - migrate from existing getOptimizedImage function
 */
export const migrateFromLegacyOptimization = (
  url: string,
  isSmallView = false,
): string => {
  // If it's already using our new optimization, return as is
  if (isOptimizedUrl(url)) {
    return url;
  }

  // Skip custom bucket URLs or GIFs as before
  if (url.includes("X-Amz-Algorithm") || url.toLowerCase().endsWith(".gif")) {
    return url;
  }

  // Extract S3 key and apply new optimization
  const s3Key = extractS3Key(url);
  const quality = isSmallView ? 30 : 75;
  const transformations = `q_${quality},f_webp`;

  return getOptimizedImageUrl(s3Key, transformations);
};
