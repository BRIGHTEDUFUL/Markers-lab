import React, { memo } from "react";
import { motion } from "motion/react";
import { useTheme } from "../contexts/ThemeContext";

/**
 * Full-screen loading state — used during auth check and route suspense.
 * Uses a skeleton shell instead of a spinner for better perceived performance.
 */
const LoadingScreen: React.FC = memo(() => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={`fixed inset-0 z-[90] flex flex-col backdrop-blur-md transition-colors duration-700 ${
        isDark ? "bg-[#030303]/80" : "bg-white/90"
      }`}
      role="status"
      aria-label="Loading"
    >
      {/* Fake nav bar skeleton */}
      <div
        className={`h-14 border-b flex items-center px-4 gap-3 ${
          isDark ? "border-white/5" : "border-slate-200"
        }`}
      >
        <div className={`h-8 w-8 rounded-lg animate-pulse ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
        <div className={`h-4 w-28 rounded animate-pulse ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
      </div>

      {/* Fake hero skeleton */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md space-y-4"
        >
          <div className={`h-3 w-20 mx-auto rounded-full animate-pulse ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
          <div className={`h-12 w-3/4 mx-auto rounded-xl animate-pulse ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
          <div className={`h-12 w-1/2 mx-auto rounded-xl animate-pulse ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
          <div className={`h-4 w-full rounded animate-pulse ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
          <div className={`h-4 w-5/6 mx-auto rounded animate-pulse ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
          <div className="flex justify-center gap-4 pt-4">
            <div className={`h-12 w-36 rounded-full animate-pulse ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
            <div className={`h-12 w-28 rounded-full animate-pulse ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
          </div>
        </motion.div>

        {/* Subtle brand label */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className={`text-[9px] font-bold uppercase tracking-[0.4em] ${
            isDark ? "text-white/20" : "text-slate-300"
          }`}
        >
          Maker's Lab
        </motion.p>
      </div>
    </div>
  );
});

LoadingScreen.displayName = "LoadingScreen";
export default LoadingScreen;
