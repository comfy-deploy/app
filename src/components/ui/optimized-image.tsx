import { cn } from "@/lib/utils";
import { 
  getOptimizedImageUrl, 
  extractS3Key, 
  isOptimizedUrl,
  type ImageTransformOptions 
} from "@/lib/image-optimization";
import { useEffect, useState } from "react";

export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  transformations?: string;
  transformOptions?: ImageTransformOptions;
  fallbackToOriginal?: boolean;
  onError?: (error: Error) => void;
}

/**
 * OptimizedImage component that uses the backend image optimization API
 * 
 * Features:
 * - Handles URLs with temporary access tokens by extracting S3 key
 * - Automatic WebP conversion and quality optimization
 * - Fallback to original image on error
 * - Support for both transformation strings and typed options
 * - Lazy loading by default
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  transformations = "auto",
  transformOptions,
  alt,
  className,
  fallbackToOriginal = true,
  onError,
  loading = "lazy",
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [isOptimized, setIsOptimized] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    if (!src) return;

    // If already optimized, use as is
    if (isOptimizedUrl(src)) {
      setImageSrc(src);
      setIsOptimized(true);
      return;
    }

    // Skip optimization for GIFs (they might not optimize well)
    if (src.toLowerCase().endsWith(".gif")) {
      setImageSrc(src);
      setIsOptimized(false);
      return;
    }

    // Parse the S3 key from the URL (handles temp access tokens)
    const s3Key = extractS3Key(src);
    
    // Use transformOptions if provided, otherwise use transformations string
    let finalTransformations = transformations;
    if (transformOptions) {
      const params: string[] = [];
      if (transformOptions.width) params.push(`w_${transformOptions.width}`);
      if (transformOptions.height) params.push(`h_${transformOptions.height}`);
      if (transformOptions.quality) params.push(`q_${transformOptions.quality}`);
      if (transformOptions.format) params.push(`f_${transformOptions.format}`);
      finalTransformations = params.length > 0 ? params.join(',') : 'auto';
    }

    const optimizedUrl = getOptimizedImageUrl(s3Key, finalTransformations);
    setImageSrc(optimizedUrl);
    setIsOptimized(true);
  }, [src, transformations, transformOptions]);

  const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (fallbackToOriginal && isOptimized && !hasError) {
      // Try fallback to original image URL (with access tokens)
      setImageSrc(src);
      setIsOptimized(false);
      setHasError(true);
    } else {
      // Call original onError handler
      const error = new Error(`Failed to load image: ${imageSrc}`);
      onError?.(error);
      
      // Call the original onError prop if it exists
      props.onError?.(event);
    }
  };

  if (!imageSrc) {
    return null;
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      loading={loading}
      onError={handleError}
      {...props}
    />
  );
};