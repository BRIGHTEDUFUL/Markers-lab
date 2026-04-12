import React, { memo, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
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
  const reduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const effectiveCount = useMemo(() => {
    if (reduceMotion) return Math.min(12, count);
    if (isMobile) return Math.max(14, Math.floor(count * 0.45));
    return count;
  }, [count, isMobile, reduceMotion]);

  const stars = useMemo(
    () => Array.from({ length: effectiveCount }, (_, i) => starSpec(i, theme, salt)),
    [effectiveCount, theme, salt]
  );

  return (
    <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden" aria-hidden>
      {stars.map((s, i) => {
        const baseStyle = {
          width: s.size,
          height: s.size,
          backgroundColor: s.starColor,
          left: s.leftPct,
          top: s.topPct,
          boxShadow: s.isLarge ? `0 0 ${s.size * 2.5}px ${s.starColor}` : "none",
          willChange: "opacity, transform",
        };

        if (reduceMotion) {
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                ...baseStyle,
                opacity: theme === "light" ? 0.18 : 0.32,
              }}
            />
          );
        }

        return (
          <motion.div
            key={i}
            initial={{ opacity: s.initialOpacity, scale: s.initialScale }}
            animate={{
              opacity: theme === "light" ? [0.06, 0.26, 0.06] : [0.1, 0.42, 0.1],
              scale: s.isLarge ? [1, 1.12, 1] : [1, 1.24, 1],
            }}
            transition={{
              duration: s.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: s.delay,
            }}
            className="absolute rounded-full"
            style={baseStyle}
          />
        );
      })}
    </div>
  );
});

StarField.displayName = "StarField";
export default StarField;
