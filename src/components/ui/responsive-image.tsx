import { getResponsiveImageUrls, extractS3Key } from "@/lib/image-optimization";
import { cn } from "@/lib/utils";
import { useState } from "react";

export interface ResponsiveImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> {
  src: string;
  fallbackToOriginal?: boolean;
  onError?: (error: Error) => void;
}

/**
 * ResponsiveImage component that provides optimal images for different screen sizes
 * 
 * Features:
 * - Automatically serves different image sizes for mobile, tablet, and desktop
 * - Uses WebP format for better compression
 * - Handles S3 URLs with temporary access tokens
 * - Fallback to original image on error
 */
export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  className,
  fallbackToOriginal = true,
  onError,
  loading = "lazy",
  ...props
}) => {
  const [hasError, setHasError] = useState<boolean>(false);

  if (!src) {
    return null;
  }

  // Skip optimization for GIFs
  if (src.toLowerCase().endsWith(".gif")) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        {...props}
      />
    );
  }

  // Extract S3 key and get responsive URLs
  const s3Key = extractS3Key(src);
  const imageUrls = getResponsiveImageUrls(s3Key);

  const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (fallbackToOriginal && !hasError) {
      setHasError(true);
      // The img element will try to load the original src
      const img = event.target as HTMLImageElement;
      img.src = src;
      img.srcset = '';
    } else {
      const error = new Error(`Failed to load responsive image: ${src}`);
      onError?.(error);
      props.onError?.(event);
    }
  };

  if (hasError) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        onError={props.onError}
        {...props}
      />
    );
  }

  return (
    <img
      srcSet={`
        ${imageUrls.small} 600w,
        ${imageUrls.medium} 1200w,
        ${imageUrls.large} 1920w
      `}
      sizes="(max-width: 640px) 600px, (max-width: 1024px) 1200px, 1920px"
      src={imageUrls.medium}
      alt={alt}
      className={className}
      loading={loading}
      onError={handleError}
      {...props}
    />
  );
};