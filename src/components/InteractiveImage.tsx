import React, { useState, useCallback, useRef, useEffect } from "react";

interface InteractiveImageProps {
  src: string;
  alt: string;
  className?: string;
  /** Whether this image is currently active (colored) — controlled from parent for single-active logic */
  active?: boolean;
  /** Called when the image is activated (tap/click/focus) */
  onActivate?: () => void;
}

/**
 * InteractiveImage
 * ─────────────────
 * • Default state  : grayscale(100%) — black & white
 * • Hover (desktop): smooth transition to full color + scale(1.05)
 * • Tap (mobile)   : toggles color; only one active at a time (controlled by parent)
 * • Keyboard       : focus triggers color (same as hover)
 * • Performance    : will-change: transform, filter on the img element
 * • Accessibility  : role="button", aria-pressed, tabIndex, keyboard handler
 */
const InteractiveImage: React.FC<InteractiveImageProps> = ({
  src,
  alt,
  className = "",
  active = false,
  onActivate,
}) => {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Colored when: hovered (desktop) OR focused (keyboard) OR tapped/active (mobile)
  const isColored = hovered || focused || active;

  const handlePointerEnter = useCallback(() => setHovered(true), []);
  const handlePointerLeave = useCallback(() => setHovered(false), []);
  const handleFocus = useCallback(() => setFocused(true), []);
  const handleBlur = useCallback(() => setFocused(false), []);

  const handleClick = useCallback(() => {
    onActivate?.();
  }, [onActivate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onActivate?.();
      }
    },
    [onActivate]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={active}
      aria-label={`View ${alt} in color`}
      className={`relative overflow-hidden cursor-pointer select-none outline-none ${className}`}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {/* The image — grayscale by default, color on active */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover object-top"
        style={{
          filter: isColored ? "grayscale(0%) brightness(1.02)" : "grayscale(100%) brightness(0.92)",
          transform: isColored ? "scale(1.05)" : "scale(1)",
          transition: "filter 0.45s ease-in-out, transform 0.55s cubic-bezier(0.16,1,0.3,1)",
          willChange: "transform, filter",
        }}
      />

      {/* Soft color-reveal overlay — fades out when active */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.18)",
          opacity: isColored ? 0 : 1,
          transition: "opacity 0.45s ease-in-out",
          pointerEvents: "none",
        }}
      />

      {/* Indigo glow ring on active */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: isColored
            ? "inset 0 0 0 2px rgba(99,102,241,0.55), 0 0 40px rgba(99,102,241,0.25)"
            : "inset 0 0 0 0px transparent",
          borderRadius: "inherit",
          transition: "box-shadow 0.4s ease-in-out",
          pointerEvents: "none",
        }}
      />

      {/* "Tap to reveal" hint — only on mobile, only when not active */}
      <div
        aria-hidden
        className="absolute bottom-3 right-3 pointer-events-none"
        style={{
          opacity: isColored ? 0 : 0.7,
          transition: "opacity 0.3s ease",
        }}
      >
        <span
          className="hidden sm:hidden"
          style={{
            display: "block",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#fff",
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(8px)",
            padding: "3px 8px",
            borderRadius: 999,
          }}
        >
          Tap
        </span>
      </div>
    </div>
  );
};

export default InteractiveImage;
