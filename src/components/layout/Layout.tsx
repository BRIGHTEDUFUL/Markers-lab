/**
 * Main layout shell — composes TopNavBar, SideMenu, RouteTransition, BackToTop,
 * and the footer into the application layout.
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Rocket } from "lucide-react";
import { MotionConfig } from "motion/react";
import { Toaster } from "sonner";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useAdaptiveMotion } from "../../hooks/useAdaptiveMotion";
import { useSmartNavigate } from "../../hooks/useSmartNavigate";
import { useOverlayBackHandler } from "../../hooks/useOverlayBackHandler";
import { getParentRoute, isRootExitRoute, normalizePathname } from "../../navigation/route-hierarchy";

import PWAInstallPrompt from "../PWAInstallPrompt";
import HeroRingBackdrop from "../HeroRingBackdrop";
import BottomNav from "../BottomNav";
import { RouteTransition } from "./RouteTransition";
import { TopNavBar } from "./TopNavBar";
import { SideMenu } from "./SideMenu";
import { BackToTop } from "./BackToTop";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { shouldReduceMotion } = useAdaptiveMotion();
  const navigate = useNavigate();
  const smartNavigate = useSmartNavigate();
  const location = window.location;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);

  // Desktop viewport detection
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktopViewport(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const { closeWithBack: closeMenuWithBack, closeSilently: closeMenuSilently } = useOverlayBackHandler(
    isMenuOpen,
    closeMenu,
    "layout-menu-drawer"
  );

  // PopState handler for PWA back navigation
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onPopState = (event: PopStateEvent) => {
      const currentPath = normalizePathname(window.location.pathname);

      if (isRootExitRoute(currentPath)) return;

      const idx = typeof (event.state as { idx?: unknown } | null)?.idx === "number"
        ? ((event.state as { idx?: number }).idx as number)
        : -1;
      const parent = getParentRoute(currentPath);

      if (parent && idx < 0) {
        navigate(parent, { replace: true });
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [navigate]);

  const footerPlatformLinks = useMemo(() => {
    const items: { name: string; path: string }[] = [
      { name: "Public Gallery", path: "/gallery" },
      { name: "Pricing", path: "/pricing" },
    ];
    if (user) {
      items.push({ name: "Dashboard", path: "/dashboard" }, { name: "Submit Project", path: "/submit-project" });
      if (user.role === "ADMIN") items.push({ name: "Admin Panel", path: "/admin" });
    }
    return items;
  }, [user]);

  const isHomeRoute = window.location.pathname === "/";
  const shouldForceReducedMotion = shouldReduceMotion || !isHomeRoute;

  return (
    <MotionConfig reducedMotion={shouldForceReducedMotion ? "always" : "user"}>
      <div className="relative min-h-screen min-h-[100dvh] text-foreground flex flex-col selection:bg-indigo-500 selection:text-white transition-colors duration-300">
      <HeroRingBackdrop theme={theme} variant="global" />
      <Helmet>
        <title>Maker's Lab | Where Ideas Merge with Execution</title>
        <meta name="description" content="A high-end creative platform for developers and designers to showcase their best work." />
        <meta property="og:title" content="Maker's Lab" />
        <meta property="og:description" content="Where ideas merge with execution." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="theme-color" content={theme === 'dark' ? '#050505' : '#ffffff'} />
      </Helmet>

      <RouteTransition />
      <BackToTop theme={theme} />
      <TopNavBar
        isMenuOpen={isMenuOpen}
        onMenuOpen={() => setIsMenuOpen(true)}
        onMenuCloseWithBack={closeMenuWithBack}
      />
      <SideMenu
        isOpen={isMenuOpen}
        onCloseWithBack={closeMenuWithBack}
        onCloseSilently={closeMenuSilently}
      />

      <main className="relative z-[1] flex flex-grow flex-col pb-[calc(env(safe-area-inset-bottom,0px)+5rem)] lg:pb-0">
        {children}
      </main>

      <Toaster position="top-right" theme={theme as 'light' | 'dark'} richColors />
      <PWAInstallPrompt />
      {!isDesktopViewport && <BottomNav />}

      <footer className={`relative z-[1] border-t py-12 sm:py-24 backdrop-blur-md ${theme === 'light' ? 'border-slate-200 bg-white/80' : 'border-border/80 bg-card/45'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 sm:col-span-2 space-y-6">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-xl ${theme === 'light' ? 'bg-slate-900' : 'bg-foreground'}`}>
                  <Rocket className={`h-5 w-5 ${theme === 'light' ? 'text-white' : 'text-background'}`} />
                </div>
                <span className="text-xl sm:text-2xl font-display font-bold text-foreground tracking-tighter uppercase">Maker's Lab</span>
              </div>
              <p className="text-muted-foreground text-sm font-light leading-relaxed max-w-sm">
                A high-end creative platform where ideas merge with execution. We blend technical excellence with avant-garde design. Based in Tesano, Accra, Ghana.
              </p>
            </div>
            <div className="sm:col-span-1">
              <h4 className="text-foreground text-[10px] font-bold uppercase tracking-[0.3em] mb-6">Platform</h4>
              <ul className="space-y-4">
                {footerPlatformLinks.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      replace
                      onClick={(e) => {
                        e.preventDefault();
                        smartNavigate(item.path, { asSectionSwitch: true });
                      }}
                      className="text-muted-foreground hover:text-foreground text-[10px] font-bold uppercase tracking-widest transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="sm:col-span-1">
              <h4 className="text-foreground text-[10px] font-bold uppercase tracking-[0.3em] mb-6">Connect</h4>
              <div className="flex flex-wrap gap-4">
                {["Twitter", "Instagram", "LinkedIn", "GitHub"].map(social => (
                  <a key={social} href="#" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors">{social}</a>
                ))}
              </div>
            </div>
          </div>
          <div className={`pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4 ${theme === 'light' ? 'border-slate-200' : 'border-border'}`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground text-center sm:text-left">© 2026 Maker's Lab. Tesano, Accra, Ghana.</p>
            <div className="flex space-x-4 sm:space-x-8">
              <a href="#" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </MotionConfig>
  );
};

export default Layout;
