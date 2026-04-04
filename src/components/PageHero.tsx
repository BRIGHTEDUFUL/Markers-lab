import React, { useMemo } from "react";
import { motion } from "motion/react";
import { useTheme } from "../contexts/ThemeContext";
import { starSpec } from "../lib/star-field";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  category?: string;
  compact?: boolean;
}

const PageHero: React.FC<PageHeroProps> = ({ title, subtitle, category, compact }) => {
  const { theme } = useTheme();
  const stars = useMemo(
    () => Array.from({ length: 60 }, (_, i) => starSpec(i, theme, 0)),
    [theme]
  );

  return (
    <section className={`relative z-10 flex flex-col items-center justify-center px-4 text-center overflow-hidden border-b transition-colors duration-500 ${theme === 'light' ? 'border-slate-200' : 'border-white/5'} ${compact ? "min-h-[30vh] pt-20 pb-10" : "min-h-[50vh] sm:min-h-[60vh] pt-24 sm:pt-32 pb-16 sm:pb-20"}`}>
      <div className="absolute inset-0 z-0">
        <div className={`absolute inset-0 mask-radial opacity-[0.12] sm:opacity-[0.15] ${theme === "light" ? "bg-grid-slate-900" : "bg-grid-white"}`} />
      </div>

      <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
        {stars.map((s, i) => (
          <motion.div
            key={i}
            initial={{
              opacity: s.initialOpacity,
              scale: s.initialScale,
            }}
            animate={{
              opacity: theme === "light" ? [0.06, 0.35, 0.06] : [0.08, 0.55, 0.08],
              scale: s.isLarge ? [1, 1.2, 1] : [1, 1.5, 1],
            }}
            transition={{
              duration: s.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: s.delay,
            }}
            className="absolute rounded-full"
            style={{
              width: `${s.size}px`,
              height: `${s.size}px`,
              backgroundColor: s.starColor,
              left: s.leftPct,
              top: s.topPct,
              boxShadow: s.isLarge ? `0 0 ${s.size * 4}px ${s.starColor}` : `0 0 ${s.size * 2}px ${s.starColor}`,
              filter: `blur(${s.size * 0.2}px)`,
            }}
          />
        ))}
      </div>

      {category && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative z-10 ${compact ? "mb-4" : "mb-6"}`}
        >
          <span className={`px-4 py-1.5 rounded-full border backdrop-blur-md text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-500 ${theme === 'light' ? 'border-indigo-200 bg-white/50 text-indigo-600' : 'border-white/10 bg-white/5 text-indigo-400'}`}>
            {category}
          </span>
        </motion.div>
      )}

      <div className="relative z-10 w-full max-w-5xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={`font-display uppercase tracking-tighter leading-[0.9] transition-colors duration-500 ${theme === "light" ? "text-slate-900 drop-shadow-[0_1px_24px_rgba(255,255,255,0.85)]" : "text-white drop-shadow-[0_2px_32px_rgba(0,0,0,0.75)]"} ${compact ? "text-4xl sm:text-5xl md:text-6xl lg:text-7xl" : "text-5xl sm:text-6xl md:text-8xl lg:text-9xl"}`}
          dangerouslySetInnerHTML={{ __html: title }}
        />
        
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`${compact ? "mt-4" : "mt-8"} max-w-2xl mx-auto font-heading text-base sm:text-lg md:text-xl font-light leading-relaxed transition-colors duration-500 ${theme === 'light' ? 'text-slate-600' : 'text-white/60'}`}
          >
            {subtitle}
          </motion.p>
        )}
      </div>
    </section>
  );
};

export default PageHero;
