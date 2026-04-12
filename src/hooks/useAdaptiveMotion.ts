import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "motion/react";

type NetworkInformation = {
  saveData?: boolean;
};

type NavigatorWithHints = Navigator & {
  connection?: NetworkInformation;
  deviceMemory?: number;
  hardwareConcurrency?: number;
};

export function useAdaptiveMotion() {
  const prefersReducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);

    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const hints = useMemo(() => {
    const nav = navigator as NavigatorWithHints;
    const saveData = Boolean(nav.connection?.saveData);
    const lowCpu = (nav.hardwareConcurrency ?? 8) <= 4;
    const lowMemory = (nav.deviceMemory ?? 8) <= 4;
    return { saveData, lowCpu, lowMemory };
  }, []);

  const shouldReduceMotion =
    Boolean(prefersReducedMotion) || isMobile || hints.saveData || hints.lowCpu || hints.lowMemory;

  return {
    shouldReduceMotion,
    isMobile,
    hints,
  };
}
