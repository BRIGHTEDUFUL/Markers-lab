/**
 * Route transition progress indicator.
 * Handles NProgress bar, route performance measurement, and scroll-to-top on navigation.
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import NProgress from "nprogress";
import { beginRouteMeasure, endRouteMeasure } from "../../lib/route-performance";

export const RouteTransition: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const routeMeasureToken = `${location.pathname}-${Date.now()}`;
    beginRouteMeasure(routeMeasureToken);

    let raf1 = 0;
    let raf2 = 0;

    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        endRouteMeasure(routeMeasureToken, location.pathname);
      });
    });

    NProgress.start();
    const timeout = setTimeout(() => {
      NProgress.done();
    }, 200);
    
    // Scroll to top on route change without animation to avoid startup jump artifacts.
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    
    return () => {
      if (raf1) window.cancelAnimationFrame(raf1);
      if (raf2) window.cancelAnimationFrame(raf2);
      clearTimeout(timeout);
      NProgress.done();
    };
  }, [location.pathname]);

  return null;
};
