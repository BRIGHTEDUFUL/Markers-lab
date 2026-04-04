/** Resolve file path for <img src> — supports absolute URLs from storage. */
export function mediaSrc(path: string | undefined | null, fallback: string): string {
  if (path == null || !String(path).trim()) return fallback;
  const p = String(path).trim();
  if (p.startsWith("http://") || p.startsWith("https://") || p.startsWith("data:") || p.startsWith("blob:")) {
    return p;
  }
  return p.startsWith("/") ? p : `/${p}`;
}
