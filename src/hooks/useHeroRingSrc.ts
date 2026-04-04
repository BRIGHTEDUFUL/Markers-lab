import { useState, useCallback } from "react";
import { HERO_RING_IMAGE, HERO_IMAGE_FALLBACK } from "../config/hero";

export function useHeroRingSrc() {
  const [src, setSrc] = useState(HERO_RING_IMAGE);
  const onImgError = useCallback(() => {
    setSrc((s) => (s === HERO_IMAGE_FALLBACK ? s : HERO_IMAGE_FALLBACK));
  }, []);
  return { src, onImgError };
}

/** @deprecated use useHeroRingSrc */
export function useHeroMoonSrc() {
  return useHeroRingSrc();
}
