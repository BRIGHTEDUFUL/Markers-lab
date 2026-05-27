/**
 * Premium hero image source.
 * Prefer backend/deployment env value so admins can swap image without code changes.
 */
const HERO_RING_IMAGE_BASE =
  (import.meta.env.VITE_HERO_RING_IMAGE_URL as string | undefined)?.trim() ||
  "/hero-moon.png";

/**
 * Version token to bust stale browser/service-worker caches.
 * Set from backend deployment env when replacing the hero image.
 */
const HERO_RING_IMAGE_VERSION =
  (import.meta.env.VITE_HERO_RING_IMAGE_VERSION as string | undefined)?.trim() ||
  "2026-04-12";

function withVersion(url: string, version: string): string {
  if (!version) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${encodeURIComponent(version)}`;
}

export const HERO_RING_IMAGE = withVersion(HERO_RING_IMAGE_BASE, HERO_RING_IMAGE_VERSION);

/** If the main asset is missing or blocked in deploy. */
export const HERO_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?auto=format&fit=crop&w=2400&q=85";
