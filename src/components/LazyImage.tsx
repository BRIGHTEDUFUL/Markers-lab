import React, { useState, useRef, useEffect } from "react";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  /** Show a shimmer placeholder while loading */
  shimmer?: boolean;
  /** Extra classes for the wrapper div (only used when shimmer=true) */
  wrapperClassName?: string;
}

/**
 * Drop-in <img> replacement with:
 * - Native lazy loading (loading="lazy")
 * - Async decoding (decoding="async")
 * - Optional shimmer placeholder that fades out once loaded
 * - fetchpriority="high" passthrough for LCP images
 */
const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  shimmer = false,
  wrapperClassName = "",
  className = "",
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Handle already-cached images (complete before mount)
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  if (!shimmer) {
    return (
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={className}
        {...props}
      />
    );
  }

  return (
    <div className={`relative overflow-hidden ${wrapperClassName}`}>
      {/* Shimmer placeholder */}
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-white/5" aria-hidden />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"} ${className}`}
        {...props}
      />
    </div>
  );
};

export default LazyImage;
