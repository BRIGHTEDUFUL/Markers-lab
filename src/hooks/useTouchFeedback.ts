import { useCallback, useRef } from "react";

/**
 * Provides native-like touch feedback via a brief CSS class toggle.
 * Works on both touch and mouse devices.
 *
 * Usage:
 *   const { handlers, pressed } = useTouchFeedback();
 *   <button {...handlers} className={pressed ? "scale-95 opacity-80" : ""}>
 */
export function useTouchFeedback(durationMs = 150) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressedRef = useRef(false);

  const setPressed = useCallback((val: boolean) => {
    pressedRef.current = val;
  }, []);

  const onPointerDown = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPressed(true);
  }, [setPressed]);

  const onPointerUp = useCallback(() => {
    timerRef.current = setTimeout(() => setPressed(false), durationMs);
  }, [durationMs, setPressed]);

  const onPointerLeave = useCallback(() => {
    setPressed(false);
  }, [setPressed]);

  return {
    handlers: { onPointerDown, onPointerUp, onPointerLeave },
  };
}
