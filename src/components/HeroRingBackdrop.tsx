import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { useHeroRingSrc } from "../hooks/useHeroRingSrc";

type Theme = "light" | "dark";

type Props = {
  theme: Theme;
  className?: string;
  /** `global` = fixed full-viewport layer (Layout). Others = in-page heroes. */
  variant?: "hero" | "page" | "authPanel" | "authAmbient" | "global";
};

/**
 * Golden ring hero art: dark mode = cinematic full-bleed; light mode = screen-blend on cool paper.
 */
const HeroRingBackdrop: React.FC<Props> = ({ theme, className = "", variant = "hero" }) => {
  const { src, onImgError } = useHeroRingSrc();
  const reduceMotion = useReducedMotion();
  const isLight = theme === "light";
  const isAmbient = variant === "authAmbient";
  const isPanel = variant === "authPanel";
  const isPage = variant === "page";
  const isGlobal = variant === "global";
  const isCover = isPanel;

  const pulse =
    !reduceMotion &&
    !isLight &&
    (variant === "hero" || variant === "page" || variant === "authPanel" || isGlobal);

  const imgMotion = pulse
    ? { scale: [1, 1.035, 1] as const }
    : isLight && !reduceMotion && !isAmbient
      ? { scale: [1, 1.012, 1] as const }
      : false;

  const transition = pulse
    ? { duration: 14, repeat: Infinity, ease: "easeInOut" as const }
    : { duration: 18, repeat: Infinity, ease: "easeInOut" as const };

  const imgClass = `h-full w-full object-cover object-center select-none transition-opacity duration-700 ${
    isLight
      ? isGlobal
        ? "opacity-[0.5] mix-blend-screen sm:opacity-[0.58] md:opacity-[0.52]"
        : "opacity-[0.42] mix-blend-screen sm:opacity-50 md:opacity-[0.48]"
      : `${isAmbient ? "opacity-40 sm:opacity-50" : isPanel ? "opacity-75 sm:opacity-88" : isGlobal ? "opacity-[0.95] sm:opacity-100" : "opacity-80 sm:opacity-90"}`
  } ${!isLight && (isPage || isGlobal) && !isPanel && !isAmbient ? "md:opacity-[0.99]" : isLight && isPage ? "md:opacity-95" : ""}`;

  const imgStyle = isLight
    ? { filter: "saturate(1.05) contrast(1.02)" as const }
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
          isLight ? "bg-slate-50" : "bg-[#030303]"
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
              ? "absolute left-1/2 top-1/2 h-[min(280vw,300vh)] w-[min(280vw,300vh)] -translate-x-1/2 -translate-y-1/2 sm:h-[min(240vw,260vh)] sm:w-[min(240vw,260vh)] lg:h-[min(200vw,220vh)] lg:w-[min(200vw,220vh)]"
              : "absolute left-1/2 top-1/2 h-[min(220vw,240vh)] w-[min(220vw,240vh)] -translate-x-1/2 -translate-y-1/2 sm:h-[min(180vw,200vh)] sm:w-[min(180vw,200vh)] lg:h-[min(160vw,180vh)] lg:w-[min(160vw,180vh)]"
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
            ? "bg-[radial-gradient(ellipse_75%_60%_at_50%_42%,rgba(99,102,241,0.07),transparent_58%)]"
            : "bg-[radial-gradient(ellipse_75%_58%_at_50%_44%,rgba(251,191,36,0.11),transparent_55%)]"
        }`}
      />

      {/* Premium vignette + readability (global = lighter so the ring reads through page shells) */}
      <div
        className={`absolute inset-0 transition-all duration-700 ${
          isLight
            ? isGlobal
              ? "bg-gradient-to-b from-white/50 via-slate-50/18 to-slate-100/60"
              : "bg-gradient-to-b from-white/95 via-slate-50/50 to-slate-100/[0.97]"
            : isAmbient
              ? "bg-gradient-to-b from-black/70 via-black/25 to-black/80"
              : isGlobal
                ? "bg-gradient-to-b from-black/28 via-transparent to-black/72"
                : "bg-gradient-to-b from-black/55 via-black/15 to-black/[0.92]"
        }`}
      />
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          isLight
            ? isGlobal
              ? "opacity-90 bg-[radial-gradient(ellipse_92%_72%_at_50%_48%,transparent_0%,transparent_50%,rgba(248,250,252,0.28)_82%,rgba(248,250,252,0.5)_100%)]"
              : "opacity-100 bg-[radial-gradient(ellipse_90%_70%_at_50%_50%,transparent_0%,transparent_42%,rgba(248,250,252,0.65)_78%,rgb(248,250,252)_100%)]"
            : isGlobal
              ? "opacity-75 bg-[radial-gradient(ellipse_96%_78%_at_50%_50%,transparent_22%,rgba(0,0,0,0.35)_100%)]"
              : "opacity-90 bg-[radial-gradient(ellipse_95%_75%_at_50%_50%,transparent_30%,rgba(0,0,0,0.5)_100%)]"
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
