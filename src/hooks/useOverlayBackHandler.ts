import { useCallback, useEffect, useRef } from "react";

type CloseOverlay = () => void;

const OVERLAY_KEY = "__mlOverlay";

type OverlayBackControls = {
  closeWithBack: () => void;
  closeSilently: () => void;
};

export const useOverlayBackHandler = (
  isOpen: boolean,
  onClose: CloseOverlay,
  overlayId: string
): OverlayBackControls => {
  const closeRef = useRef(onClose);
  const ignoreNextPopRef = useRef(false);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;

    const state = (window.history.state || {}) as Record<string, unknown>;
    if (state[OVERLAY_KEY] !== overlayId) {
      window.history.pushState(
        { ...state, [OVERLAY_KEY]: overlayId },
        "",
        window.location.href
      );
    }

    const onPopState = () => {
      if (ignoreNextPopRef.current) {
        ignoreNextPopRef.current = false;
        return;
      }
      closeRef.current();
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [isOpen, overlayId]);

  const closeWithBack = useCallback(() => {
    closeRef.current();

    if (typeof window === "undefined") return;
    const state = (window.history.state || {}) as Record<string, unknown>;
    if (state[OVERLAY_KEY] === overlayId) {
      ignoreNextPopRef.current = true;
      window.history.back();
    }
  }, [overlayId]);

  const closeSilently = useCallback(() => {
    closeRef.current();

    if (typeof window === "undefined") return;
    const state = (window.history.state || {}) as Record<string, unknown>;
    if (state[OVERLAY_KEY] !== overlayId) return;

    const { [OVERLAY_KEY]: _removed, ...nextState } = state;
    window.history.replaceState(nextState, "", window.location.href);
  }, [overlayId]);

  return { closeWithBack, closeSilently };
};
