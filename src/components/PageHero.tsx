/**
 * PageHero — full-viewport hero used on every inner page.
 * The hero ring backdrop is already rendered globally (fixed, z-0) by Layout.
 * This component sits on top of it with a transparent shell so the ring shows through,
 * then adds a per-page gradient veil, star field, category badge, title and subtitle.
 */

import React, { memo } from "react";
import { motion } from "motion/react";
import { useTheme } from "../contexts/ThemeContext";
import StarField from "./StarField";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  category?: string;
  compact?: boolean;
}

const PageHero: React.FC<PageHeroProps> = memo(({ title, subtitle, category, compact }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section
      className={`
        relative z-10 flex flex-col items-center justify-center
        text-center overflow-hidden border-b
        transition-colors duration-500
        ${isDark ? "border-white/5" : "border-slate-200/60"}
        ${compact
          ? "min-h-[40vh] pt-20 pb-12 px-4"
          : "min-h-screen min-h-[100dvh] pt-24 pb-20 px-4"}
      `}
    >
      {/* Transparent shell — lets the global HeroRingBackdrop show through */}
      <div className="absolute inset-0 z-0">
        {/* Subtle radial veil so text stays readable over the ring */}
        <div
          className={`absolute inset-0 transition-colors duration-700 ${
            isDark
              ? "bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,transparent_30%,rgba(3,3,3,0.55)_100%)]"
              : "bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,transparent_30%,rgba(248,250,252,0.6)_100%)]"
          }`}
        />
        {/* Grid texture */}
        <div
          className={`absolute inset-0 mask-radial opacity-10 ${
            isDark ? "bg-grid-white" : "bg-grid-slate-900"
          }`}
        />
      </div>

      {/* Stars */}
      <StarField count={compact ? 25 : 45} theme={theme} salt={42} />

      {/* Category badge */}
      {category && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`relative z-10 ${compact ? "mb-4" : "mb-6"}`}
        >
          <span
            className={`
              px-4 py-1.5 rounded-full border backdrop-blur-md
              text-[10px] font-bold uppercase tracking-[0.25em]
              transition-colors duration-500
              ${isDark
                ? "border-white/10 bg-white/5 text-indigo-400"
                : "border-indigo-200 bg-white/60 text-indigo-600"}
            `}
          >
            {category}
          </span>
        </motion.div>
      )}

      {/* Title */}
      <div className="relative z-10 w-full max-w-6xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 32, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className={`
            font-display uppercase tracking-tighter leading-[0.88]
            transition-colors duration-500
            ${isDark
              ? "text-white drop-shadow-[0_4px_40px_rgba(0,0,0,0.9)]"
              : "text-slate-900 drop-shadow-[0_2px_30px_rgba(255,255,255,0.95)]"}
            ${compact
              ? "text-5xl sm:text-6xl md:text-7xl lg:text-8xl"
              : "text-[13vw] sm:text-[11vw] md:text-[10vw] lg:text-[9vw] xl:text-[8vw]"}
          `}
          dangerouslySetInnerHTML={{ __html: title }}
        />

        {/* Accent line */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 1.2, ease: "circOut" }}
          className="mt-6 mx-auto h-px w-32 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_12px_rgba(99,102,241,0.6)]"
        />

        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className={`
              mt-8 max-w-2xl mx-auto font-heading font-light leading-relaxed
              transition-colors duration-500
              ${compact ? "text-base sm:text-lg" : "text-lg sm:text-xl md:text-2xl"}
              ${isDark ? "text-white/60" : "text-slate-600"}
            `}
          >
            {subtitle}
          </motion.p>
        )}
      </div>

      {/* Bottom fade into page content */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-32 pointer-events-none ${
          isDark
            ? "bg-gradient-to-t from-[#030303]/80 to-transparent"
            : "bg-gradient-to-t from-slate-50/70 to-transparent"
        }`}
      />
    </section>
  );
});

PageHero.displayName = "PageHero";
export default PageHero;
