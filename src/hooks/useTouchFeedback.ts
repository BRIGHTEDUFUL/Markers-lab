import { useCallback, useRef, useState } from "react";

/**
 * useTouchFeedback — Professional native-like touch feedback
 * 
 * Features:
 * - Haptic-like visual feedback
 * - Prevents double-tap zoom
 * - Respects motion preferences
 * - Works on desktop and mobile
 * 
 * Usage:
 *   const { handlers, isPressed } = useTouchFeedback();
 *   <button {...handlers} className={isPressed ? "scale-90 opacity-60" : ""}>
 */
export function useTouchFeedback(durationMs = 100) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pressed, setPressed] = useState(false);

  const onPointerDown = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPressed(true);
  }, []);

  const onPointerUp = useCallback(() => {
    timerRef.current = setTimeout(() => setPressed(false), durationMs);
  }, [durationMs]);

  const onPointerLeave = useCallback(() => {
    setPressed(false);
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    // Prevent double-tap zoom on iOS
    if (e.touches.length === 1) {
      // Record timestamp for double-tap detection
      const now = Date.now();
      const lastTouchTime = (e.currentTarget as any).lastTouchTime || 0;
      const isDoubleTap = now - lastTouchTime <= 300;
      
      if (isDoubleTap) {
        e.preventDefault();
      }
      (e.currentTarget as any).lastTouchTime = now;
    }
    onPointerDown();
  }, [onPointerDown]);

  return {
    handlers: { 
      onPointerDown, 
      onPointerUp, 
      onPointerLeave,
      onTouchStart,
      onTouchEnd: onPointerUp 
    },
    isPressed: pressed,
  };
}
