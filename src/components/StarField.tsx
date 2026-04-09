import React, { memo, useMemo } from "react";
import { motion } from "motion/react";
import { starSpec } from "../lib/star-field";

interface StarFieldProps {
  count?: number;
  theme: "light" | "dark";
  salt?: number;
}

/**
 * Memoized star field — only re-renders when theme or count changes.
 * Each star is a stable motion.div; keys are index-stable so React
 * never unmounts/remounts them on re-render.
 */
const StarField: React.FC<StarFieldProps> = memo(({ count = 60, theme, salt = 0 }) => {
  const stars = useMemo(
    () => Array.from({ length: count }, (_, i) => starSpec(i, theme, salt)),
    [count, theme, salt]
  );

  return (
    <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden" aria-hidden>
      {stars.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: s.initialOpacity, scale: s.initialScale }}
          animate={{
            opacity: theme === "light" ? [0.05, 0.32, 0.05] : [0.08, 0.5, 0.08],
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
            width: s.size,
            height: s.size,
            backgroundColor: s.starColor,
            left: s.leftPct,
            top: s.topPct,
            boxShadow: s.isLarge
              ? `0 0 ${s.size * 4}px ${s.starColor}`
              : `0 0 ${s.size * 2}px ${s.starColor}`,
            filter: `blur(${s.size * 0.2}px)`,
            willChange: "opacity, transform",
          }}
        />
      ))}
    </div>
  );
});

StarField.displayName = "StarField";
export default StarField;
