/**
 * Lightweight in-memory cache for async data fetches.
 *
 * - Deduplicates in-flight requests (same key → same Promise)
 * - Caches results for `ttlMs` milliseconds (default 60 s)
 * - Stale-while-revalidate: returns cached value immediately, then
 *   refreshes in the background when the entry is stale
 *
 * Usage:
 *   const data = await queryCache.fetch("featured-gallery", fetchFeaturedGallery, 60_000);
 */

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

class QueryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private inflight = new Map<string, Promise<unknown>>();

  async fetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs = 60_000
  ): Promise<T> {
    const now = Date.now();
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    // Fresh cache hit — return immediately
    if (entry && entry.expiresAt > now) {
      return entry.value;
    }

    // Stale hit — return stale value and revalidate in background
    if (entry) {
      this.revalidate(key, fetcher, ttlMs).catch(() => {});
      return entry.value;
    }

    // Deduplicate concurrent requests for the same key
    if (this.inflight.has(key)) {
      return this.inflight.get(key) as Promise<T>;
    }

    const promise = fetcher().then((value) => {
      this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
      this.inflight.delete(key);
      return value;
    }).catch((err) => {
      this.inflight.delete(key);
      throw err;
    });

    this.inflight.set(key, promise);
    return promise;
  }

  private async revalidate<T>(key: string, fetcher: () => Promise<T>, ttlMs: number) {
    if (this.inflight.has(key)) return;
    const promise = fetcher().then((value) => {
      this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
      this.inflight.delete(key);
    }).catch(() => {
      this.inflight.delete(key);
    });
    this.inflight.set(key, promise);
    return promise;
  }

  /** Manually invalidate a cache entry (e.g. after a mutation) */
  invalidate(key: string) {
    this.cache.delete(key);
  }

  /** Invalidate all entries whose key starts with a prefix */
  invalidatePrefix(prefix: string) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) this.cache.delete(key);
    }
  }
}

export const queryCache = new QueryCache();
