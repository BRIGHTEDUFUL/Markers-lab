import React, { memo } from "react";
import { useTheme } from "../contexts/ThemeContext";

/**
 * Skeleton loader cards — replace spinners for perceived performance.
 * Uses CSS animation (no JS) so it runs even during heavy JS work.
 */

interface SkeletonCardProps {
  variant?: "project" | "gallery" | "stat" | "list-row";
  count?: number;
}

const shimmer = "animate-pulse";

const ProjectSkeleton: React.FC<{ theme: string }> = ({ theme }) => (
  <div
    className={`rounded-2xl border overflow-hidden ${
      theme === "light" ? "bg-white border-slate-200" : "bg-white/5 border-white/10"
    }`}
  >
    {/* Status bar */}
    <div className={`h-1 w-full ${shimmer} ${theme === "light" ? "bg-slate-200" : "bg-white/10"}`} />
    <div className="p-6 space-y-4">
      {/* Badge */}
      <div className={`h-5 w-24 rounded-full ${shimmer} ${theme === "light" ? "bg-slate-100" : "bg-white/10"}`} />
      {/* Title */}
      <div className={`h-7 w-3/4 rounded-lg ${shimmer} ${theme === "light" ? "bg-slate-100" : "bg-white/10"}`} />
      {/* Tags */}
      <div className="flex gap-2">
        {[40, 56, 32].map((w, i) => (
          <div key={i} className={`h-4 rounded-full ${shimmer} ${theme === "light" ? "bg-slate-100" : "bg-white/10"}`} style={{ width: w }} />
        ))}
      </div>
      {/* Description */}
      <div className="space-y-2">
        <div className={`h-3 w-full rounded ${shimmer} ${theme === "light" ? "bg-slate-100" : "bg-white/10"}`} />
        <div className={`h-3 w-5/6 rounded ${shimmer} ${theme === "light" ? "bg-slate-100" : "bg-white/10"}`} />
      </div>
      {/* Footer */}
      <div className={`h-px w-full ${theme === "light" ? "bg-slate-100" : "bg-white/5"}`} />
      <div className="flex justify-between">
        <div className={`h-5 w-20 rounded-full ${shimmer} ${theme === "light" ? "bg-slate-100" : "bg-white/10"}`} />
        <div className={`h-5 w-16 rounded-full ${shimmer} ${theme === "light" ? "bg-slate-100" : "bg-white/10"}`} />
      </div>
    </div>
  </div>
);

const GallerySkeleton: React.FC<{ theme: string }> = ({ theme }) => (
  <div className={`rounded-3xl border overflow-hidden ${theme === "light" ? "bg-white border-slate-200" : "bg-white/5 border-white/10"}`}>
    <div className={`aspect-[16/10] w-full ${shimmer} ${theme === "light" ? "bg-slate-100" : "bg-white/10"}`} />
    <div className="p-6 space-y-3">
      <div className={`h-8 w-2/3 rounded-lg ${shimmer} ${theme === "light" ? "bg-slate-100" : "bg-white/10"}`} />
      <div className={`h-4 w-full rounded ${shimmer} ${theme === "light" ? "bg-slate-100" : "bg-white/10"}`} />
      <div className={`h-4 w-4/5 rounded ${shimmer} ${theme === "light" ? "bg-slate-100" : "bg-white/10"}`} />
    </div>
  </div>
);

const StatSkeleton: React.FC<{ theme: string }> = ({ theme }) => (
  <div className={`p-6 rounded-3xl border ${theme === "light" ? "bg-white border-slate-200" : "bg-white/5 border-white/10"}`}>
    <div className="flex justify-between items-center mb-4">
      <div className={`h-10 w-10 rounded-2xl ${shimmer} ${theme === "light" ? "bg-slate-100" : "bg-white/10"}`} />
      <div className={`h-8 w-12 rounded ${shimmer} ${theme === "light" ? "bg-slate-100" : "bg-white/10"}`} />
    </div>
    <div className={`h-3 w-24 rounded ${shimmer} ${theme === "light" ? "bg-slate-100" : "bg-white/10"}`} />
  </div>
);

const ListRowSkeleton: React.FC<{ theme: string }> = ({ theme }) => (
  <div className={`flex items-center gap-4 px-6 py-4 border-b ${theme === "light" ? "border-slate-100" : "border-white/5"}`}>
    <div className={`h-10 w-10 rounded-full flex-shrink-0 ${shimmer} ${theme === "light" ? "bg-slate-100" : "bg-white/10"}`} />
    <div className="flex-1 space-y-2">
      <div className={`h-4 w-1/3 rounded ${shimmer} ${theme === "light" ? "bg-slate-100" : "bg-white/10"}`} />
      <div className={`h-3 w-1/2 rounded ${shimmer} ${theme === "light" ? "bg-slate-100" : "bg-white/10"}`} />
    </div>
    <div className={`h-6 w-16 rounded-full ${shimmer} ${theme === "light" ? "bg-slate-100" : "bg-white/10"}`} />
  </div>
);

const SkeletonCard: React.FC<SkeletonCardProps> = memo(({ variant = "project", count = 3 }) => {
  const { theme } = useTheme();

  const Skeleton = {
    project: ProjectSkeleton,
    gallery: GallerySkeleton,
    stat: StatSkeleton,
    "list-row": ListRowSkeleton,
  }[variant];

  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} theme={theme} />
      ))}
    </>
  );
});

SkeletonCard.displayName = "SkeletonCard";
export default SkeletonCard;
