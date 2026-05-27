import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useHeroRingSrc } from "../hooks/useHeroRingSrc";

type Theme = "light" | "dark";

/**
 * HeroRingBackdrop Component Props
 * 
 * Variants:
 * - "global": Fixed full-viewport backdrop (z-0), used once in Layout
 *   Position: center (top-1/2)
 * - "page": Positioned hero section backdrop for inner pages
 *   Position: top quarter (top-1/4) of section
 * - "hero": General hero variant
 * - "authPanel": Full-cover auth panel variant
 * - "authAmbient": Subtle auth ambient variant
 */
type Props = {
  /** Light or dark theme */
  theme: Theme;
  /** Additional CSS classes */
  className?: string;
  /** Positioning variant - affects how the ring image is positioned */
  variant?: "hero" | "page" | "authPanel" | "authAmbient" | "global";
};

/**
 * HeroRingBackdrop — Cinematic golden ring backdrop
 * 
 * Provides:
 * - Theme-aware rendering (dark mode = cinematic, light mode = screen-blend)
 * - Responsive sizing and positioning
 * - Performance-optimized animations (respects prefers-reduced-motion)
 * - Multiple variants for different use cases
 * 
 * Usage:
 * - Global: <HeroRingBackdrop theme={theme} variant="global" />
 * - Page: <HeroRingBackdrop theme={theme} variant="page" />
 */
const HeroRingBackdrop: React.FC<Props> = ({ theme, className = "", variant = "hero" }) => {
  const { src, onImgError } = useHeroRingSrc();
  const reduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const isLight = theme === "light";
  const isAmbient = variant === "authAmbient";
  const isPanel = variant === "authPanel";
  const isPage = variant === "page";
  const isGlobal = variant === "global";
  const isCover = isPanel;
  const allowMotion = !isGlobal;

  const pulse =
    allowMotion &&
    !reduceMotion &&
    !isMobile &&
    !isLight &&
    (variant === "hero" || variant === "page" || variant === "authPanel");

  const imgMotion = pulse
    ? { scale: isGlobal ? [1, 1.018, 1] : [1, 1.035, 1] }
    : allowMotion && isLight && !reduceMotion && !isAmbient && !isMobile
      ? { scale: isGlobal ? [1, 1.008, 1] : [1, 1.012, 1] }
      : false;

  const transition = pulse
    ? { duration: isGlobal ? 16 : 14, repeat: Infinity, ease: "easeInOut" as const }
    : { duration: 18, repeat: Infinity, ease: "easeInOut" as const };

  const objectFit = isGlobal ? "object-contain" : "object-cover";

  const imgClass = `h-full w-full ${objectFit} object-center select-none transition-opacity duration-700 ${
    isLight
      ? isGlobal
        ? "opacity-[0.06] mix-blend-multiply sm:opacity-[0.08]"
        : "opacity-[0.05] mix-blend-multiply sm:opacity-[0.07] md:opacity-[0.08]"
      : `${isAmbient ? "opacity-35 sm:opacity-45" : isPanel ? "opacity-72 sm:opacity-82" : isGlobal ? "opacity-[0.88]" : "opacity-75 sm:opacity-88"}`
  } ${!isLight && (isPage || isGlobal) && !isPanel && !isAmbient ? "md:opacity-100" : ""}`;

  const imgStyle = isLight
    ? { filter: "invert(1) saturate(1.2) contrast(0.95)" as const }
    : { filter: "saturate(1.08) contrast(1.05)" as const };

  const ringImage = (
    <img
      src={src}
      onError={onImgError}
      alt=""
      aria-hidden
      draggable={false}
      className={imgClass}
      style={imgStyle}
    />
  );

  return (
    <div
      className={`${isGlobal ? "fixed inset-0 z-0 min-h-[100dvh] min-w-full" : "absolute inset-0"} overflow-hidden pointer-events-none ${className}`}
    >
      {/* Base: matches page chrome */}
      <div
        className={`absolute inset-0 transition-colors duration-700 ${
          isLight ? "bg-slate-50" : "bg-[#02030a]"
        }`}
      />

      {/* Ring layer — centered overscan on heroes; full cover on auth panel */}
      {isCover ? (
        <motion.div
          className="absolute inset-0"
          animate={imgMotion || undefined}
          transition={imgMotion ? transition : undefined}
        >
          {ringImage}
        </motion.div>
      ) : (
        <motion.div
          className={
            isGlobal
              ? "absolute left-1/2 top-1/2 aspect-square w-[min(81vmin,100vw,97dvh)] -translate-x-1/2 -translate-y-1/2 sm:w-[min(74vmin,100vw,94dvh)] lg:w-[min(67vmin,736px,90dvh)]"
              : "absolute left-1/2 top-1/4 h-[min(220vw,240vh)] w-[min(220vw,240vh)] -translate-x-1/2 -translate-y-1/2 sm:h-[min(180vw,200vh)] sm:w-[min(180vw,200vh)] lg:h-[min(160vw,180vh)] lg:w-[min(160vw,180vh)]"
          }
          animate={imgMotion || undefined}
          transition={imgMotion ? transition : undefined}
        >
          {ringImage}
        </motion.div>
      )}

      {/* Warm accent on ring (dark) / cool accent (light) */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          isLight
            ? "bg-[radial-gradient(ellipse_80%_65%_at_50%_42%,rgba(99,102,241,0.10),transparent_60%)]"
            : "bg-[radial-gradient(ellipse_80%_62%_at_50%_44%,rgba(251,191,36,0.08),transparent_58%)]"
        }`}
      />

      {/* Premium vignette + readability */}
      <div
        className={`absolute inset-0 transition-all duration-700 ${
          isLight
            ? isGlobal
              ? "bg-gradient-to-b from-white/30 via-transparent to-slate-100/50"
              : "bg-gradient-to-b from-white/90 via-slate-50/40 to-slate-100/[0.95]"
            : isAmbient
              ? "bg-gradient-to-b from-black/70 via-black/25 to-black/80"
              : isGlobal
                ? "bg-gradient-to-b from-black/35 via-black/10 to-black/82"
                : "bg-gradient-to-b from-black/50 via-black/10 to-black/[0.88]"
        }`}
      />
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          isLight
            ? isGlobal
              ? "opacity-85 bg-[radial-gradient(ellipse_95%_75%_at_50%_48%,transparent_0%,transparent_45%,rgba(248,250,252,0.22)_78%,rgba(248,250,252,0.42)_100%)]"
              : "opacity-100 bg-[radial-gradient(ellipse_90%_70%_at_50%_50%,transparent_0%,transparent_42%,rgba(248,250,252,0.60)_78%,rgb(248,250,252)_100%)]"
            : isGlobal
              ? "opacity-95 bg-[radial-gradient(ellipse_96%_78%_at_50%_50%,transparent_18%,rgba(0,0,0,0.58)_100%)]"
              : "opacity-88 bg-[radial-gradient(ellipse_95%_75%_at_50%_50%,transparent_30%,rgba(0,0,0,0.48)_100%)]"
        }`}
      />

      {/* Subtle film grain (dark only) */}
      {!isLight && (
        <div
          className="absolute inset-0 opacity-[0.035] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
      )}
    </div>
  );
};

export default HeroRingBackdrop;
