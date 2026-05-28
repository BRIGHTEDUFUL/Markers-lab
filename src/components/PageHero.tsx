/**
 * PageHero — Professional hero section component for inner pages
 * 
 * Provides:
 * - Positioned hero ring backdrop at top of section
 * - Responsive typography with professional animations
 * - Glass morphism category badge
 * - Subtitle + optional details text
 * - Professional drop shadows and depth effects
 * - Smooth staggered animations
 * 
 * Integration:
 * - Used on all page routes (Gallery, About, Contact, etc.)
 * - Works with global HeroRingBackdrop in Layout
 * - Theme-aware for light/dark modes
 */

import React, { memo } from "react";
import { motion } from "motion/react";
import { useTheme } from "../contexts/ThemeContext";
import StarField from "./StarField";
import HeroRingBackdrop from "./HeroRingBackdrop";

/**
 * Props for PageHero component
 */
interface PageHeroProps {
  /** Main heading - supports HTML markup */
  title: string;
  /** Secondary copy text below title */
  subtitle?: string;
  /** Category badge label */
  category?: string;
  /** Reduced height variant for compact heroes */
  compact?: boolean;
  /** Additional descriptive details text */
  details?: string;
}

const PageHero: React.FC<PageHeroProps> = memo(({ title, subtitle, category, compact, details }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section
      className={`
        relative z-10 flex flex-col items-center justify-center
        text-center overflow-hidden border-b
        transition-all duration-500
        ${isDark 
          ? "border-outline-variant/10 bg-gradient-to-br from-background via-surface-container-low to-surface-container-lowest" 
          : "border-outline-variant/10 bg-gradient-to-br from-background via-surface-container-low to-surface-container-lowest"}
        ${compact
          ? "min-h-[40vh] pt-20 pb-12 px-4"
          : "min-h-screen min-h-[100dvh] pt-24 pb-20 px-4"}
      `}
    >
      {/* Professional backdrop layer system */}
      <div className="absolute inset-0 z-0">
        {/* Hero Ring positioned at top of section */}
        <HeroRingBackdrop theme={theme} variant="page" className="absolute inset-0 z-[1]" />
        
        {/* Base gradient with sophisticated color science */}
        <div
          className={`absolute inset-0 transition-colors duration-700 ${
            isDark
              ? "bg-[radial-gradient(ellipse_120%_80%_at_50%_35%,rgba(79,70,229,0.08)_0%,rgba(30,27,75,0.3)_40%,rgba(3,3,3,0.8)_100%)]"
              : "bg-[radial-gradient(ellipse_120%_80%_at_50%_35%,rgba(224,242,254,0.4)_0%,rgba(226,232,240,0.2)_40%,rgba(248,250,252,0.95)_100%)]"
          }`}
        />
        
        {/* Ambient lighting layer */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${
            isDark
              ? "bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(99,102,241,0.05)_0%,transparent_70%)]"
              : "bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(99,102,241,0.03)_0%,transparent_70%)]"
          }`}
        />
        
        {/* Subtle grid texture for sophistication */}
        <div
          className={`absolute inset-0 mask-radial opacity-[0.03] transition-opacity duration-700 ${
            isDark ? "bg-grid-white/20" : "bg-grid-slate-900/30"
          }`}
        />
        
        {/* Top-to-bottom fade for depth */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${
            isDark
              ? "bg-gradient-to-b from-indigo-950/20 via-transparent to-black/40"
              : "bg-gradient-to-b from-white/40 via-transparent to-slate-100/30"
          }`}
        />
      </div>

      {/* Stars */}
      <StarField count={compact ? 25 : 45} theme={theme} salt={42} />

      {/* Category badge — professional glass morphism */}
      {category && (
        <motion.div
          initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={`relative z-10 ${compact ? "mb-4" : "mb-8"}`}
        >
          <span
            className={`
              px-5 py-2 rounded-full border backdrop-blur-xl
              text-[11px] font-bold uppercase tracking-[0.35em]
              transition-all duration-500 inline-block
              ${isDark
                ? "border-indigo-500/30 bg-indigo-950/30 text-indigo-300 hover:bg-indigo-900/40 hover:border-indigo-500/50 shadow-[0_8px_32px_rgba(99,102,241,0.1)]"
                : "border-indigo-300/60 bg-white/50 text-indigo-700 hover:bg-white/70 hover:border-indigo-400/80 shadow-[0_8px_32px_rgba(99,102,241,0.08)]"}
            `}
          >
            {category}
          </span>
        </motion.div>
      )}

      {/* Title */}
      <div className="relative z-10 w-full max-w-6xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 40, filter: "blur(16px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className={`
            font-display uppercase tracking-tighter leading-[0.88] font-black
            transition-colors duration-500
            ${isDark
              ? "text-white drop-shadow-[0_20px_80px_rgba(0,0,0,0.8)] drop-shadow-[0_0_40px_rgba(99,102,241,0.15)]"
              : "text-slate-950 drop-shadow-[0_20px_60px_rgba(15,23,42,0.15)] drop-shadow-[0_0_30px_rgba(99,102,241,0.1)]"}
            ${compact
              ? "text-5xl sm:text-6xl md:text-7xl lg:text-8xl"
              : "text-[12vw] sm:text-[10.5vw] md:text-[9.5vw] lg:text-[8.5vw] xl:text-[7.5vw]"}
          `}
          dangerouslySetInnerHTML={{ __html: title }}
        />

        {/* Accent line */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 0.6, duration: 1.3, ease: "circOut" }}
          className={`
            mt-8 mx-auto h-1 w-40 rounded-full transition-all duration-500
            ${isDark
              ? "bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_24px_rgba(129,140,248,0.6)] shadow-[0_0_48px_rgba(139,92,246,0.3)]"
              : "bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_20px_rgba(99,102,241,0.5)] shadow-[0_0_40px_rgba(79,70,229,0.25)]"}
          `}
        />

        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            className={`
              mt-10 max-w-2xl mx-auto font-heading font-light leading-relaxed
              transition-colors duration-500 drop-shadow-[0_4px_16px_rgba(0,0,0,0.15)]
              ${compact ? "text-base sm:text-lg" : "text-xl sm:text-2xl md:text-3xl"}
              ${isDark ? "text-indigo-50 font-medium" : "text-slate-800"}
            `}
          >
            {subtitle}
          </motion.p>
        )}

        {/* Additional descriptive details */}
        {details && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.52 }}
            className={`
              mt-8 max-w-3xl mx-auto font-heading font-light leading-relaxed
              transition-colors duration-500 drop-shadow-[0_2px_12px_rgba(0,0,0,0.1)]
              ${compact ? "text-sm sm:text-base" : "text-lg sm:text-xl"}
              ${isDark ? "text-slate-300" : "text-slate-700"}
            `}
            dangerouslySetInnerHTML={{ __html: details }}
          />
        )}
      </div>

      {/* Professional bottom fade transition */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-40 pointer-events-none transition-all duration-700 ${
          isDark
            ? "bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent"
            : "bg-gradient-to-t from-slate-50 via-slate-50/50 to-transparent"
        }`}
      />
    </section>
  );
});

PageHero.displayName = "PageHero";
export default PageHero;
