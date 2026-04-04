export type StarSpec = {
  size: number;
  isLarge: boolean;
  starColor: string;
  leftPct: string;
  topPct: string;
  initialOpacity: number;
  initialScale: number;
  duration: number;
  delay: number;
};

/** Deterministic “random” star layout so React re-renders stay stable (no hydration jitter). */
export function starSpec(index: number, theme: "light" | "dark", salt = 0): StarSpec {
  const rnd = (k: number) => {
    const x = Math.sin((index + salt) * 127.1 + k * 311.7) * 43758.5453123;
    return x - Math.floor(x);
  };
  const lightPalette = ["#818cf8", "#6366f1", "#4f46e5"];
  const darkPalette = ["#ffffff", "#e0e7ff", "#fff7ed"];
  const palette = theme === "light" ? lightPalette : darkPalette;
  const size = rnd(1) * 2 + 1;
  const isLarge = size > 2.5;
  return {
    size,
    isLarge,
    starColor: palette[Math.floor(rnd(2) * palette.length)],
    leftPct: `${rnd(3) * 100}%`,
    topPct: `${rnd(4) * 100}%`,
    initialOpacity: rnd(5) * 0.4 + 0.1,
    initialScale: rnd(6) * 0.5 + 0.5,
    duration: rnd(7) * 5 + 4,
    delay: rnd(8) * 15,
  };
}
