type RoutePerfEntry = {
  path: string;
  durationMs: number;
  timestamp: number;
};

type PerfWindow = Window & {
  __MAKERSLAB_ROUTE_PERF__?: RoutePerfEntry[];
};

const MAX_ENTRIES = 120;

const tokenToStartMark = (token: string) => `ml-route-${token}-start`;
const tokenToEndMark = (token: string) => `ml-route-${token}-end`;
const tokenToMeasure = (token: string) => `ml-route-${token}-measure`;

export const beginRouteMeasure = (token: string) => {
  if (typeof window === "undefined" || typeof performance === "undefined") return;
  performance.mark(tokenToStartMark(token));
};

export const endRouteMeasure = (token: string, path: string) => {
  if (typeof window === "undefined" || typeof performance === "undefined") return;

  const startMark = tokenToStartMark(token);
  const endMark = tokenToEndMark(token);
  const measureName = tokenToMeasure(token);

  performance.mark(endMark);
  performance.measure(measureName, startMark, endMark);

  const latestMeasure = performance.getEntriesByName(measureName, "measure").at(-1);
  const durationMs = latestMeasure?.duration ?? 0;

  const perfWindow = window as PerfWindow;
  const existing = perfWindow.__MAKERSLAB_ROUTE_PERF__ ?? [];
  const next = [...existing, { path, durationMs, timestamp: Date.now() }].slice(-MAX_ENTRIES);
  perfWindow.__MAKERSLAB_ROUTE_PERF__ = next;

  if (import.meta.env.DEV) {
    console.info(`[perf] route=${path} first-content=${durationMs.toFixed(1)}ms`);
  }

  performance.clearMarks(startMark);
  performance.clearMarks(endMark);
  performance.clearMeasures(measureName);
};

export const getRecentRoutePerf = () => {
  if (typeof window === "undefined") return [] as RoutePerfEntry[];
  const perfWindow = window as PerfWindow;
  return perfWindow.__MAKERSLAB_ROUTE_PERF__ ?? [];
};
