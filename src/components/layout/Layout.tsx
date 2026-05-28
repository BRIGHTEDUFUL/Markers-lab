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

  // Mouse tracking parallax for hero-glow
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      const glow = document.getElementById("layoutHeroGlow");
      if (glow) {
        glow.style.transform = `translate(${x * 60}px, ${y * 60}px) translateX(-50%)`;
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
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
      { name: "Archives", path: "/gallery" },
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
      <div className="relative min-h-screen min-h-[100dvh] text-foreground flex flex-col selection:bg-primary/30 selection:text-primary-fixed transition-colors duration-300 film-grain">
      <div className="starfield pointer-events-none" />
      <div id="layoutHeroGlow" className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-[1440px] pointer-events-none hero-glow z-0 transition-transform duration-300 ease-out" />
      <HeroRingBackdrop theme={theme} variant="global" />
      <Helmet>
        <title>Maker's Lab | Where Ideas Merge with Execution</title>
        <meta name="description" content="A high-end creative platform for developers and designers to showcase their best work." />
        <meta property="og:title" content="Maker's Lab" />
        <meta property="og:description" content="Where ideas merge with execution." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="theme-color" content={theme === 'dark' ? '#11131d' : '#f7f9fb'} />
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

      <footer className="w-full py-16 px-4 md:px-12 flex flex-col lg:flex-row justify-between items-center gap-10 bg-surface-container-lowest/90 backdrop-blur-3xl border-t border-outline-variant/10 relative z-10">
        <div className="flex flex-col gap-3 items-center lg:items-start">
          <div className="flex items-center gap-3">
            <img alt="Maker's Lab Logo" className="w-8 h-8 object-contain" src="https://lh3.googleusercontent.com/aida/ADBb0ui-0VxsqXUOE7_HNmreItHOBGqQH2kZmQy6RxVrj1n5P74BJjO8zxN-9yGTXbsYfj40jqzKMUhclpDIPYsfD0uKdrTaek0hLiP0KcV9hBwkRq6SCbHY7JdrEApwlfhFm31CyQrm7_0PNITo53qV4w9hoqXiEUeSc0R12nyw_Yt69vakmrC6hKObv7p9rLRSlXj8gKEQtC9O-Dpk9TzxmlCgO99QKe4Czx9BktNvfUMtOi0a_N6AnuvYKQ8r"/>
            <span className="font-headline-md text-headline-md text-on-surface font-extrabold tracking-tighter uppercase">MAKER'S LAB</span>
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-[0.2em] opacity-60">© 2026 MAKER'S LAB. ALL ARCHIVES RESERVED.</span>
        </div>
        <div className="flex flex-wrap justify-center gap-12">
          {footerPlatformLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              replace
              onClick={(e) => {
                e.preventDefault();
                smartNavigate(item.path, { asSectionSwitch: true });
              }}
              className="text-on-surface-variant hover:text-primary font-label-sm uppercase tracking-[0.25em] text-[11px] transition-colors"
            >
              {item.name}
            </Link>
          ))}
          {["Twitter", "LinkedIn"].map(social => (
            <a key={social} href="#" className="text-on-surface-variant hover:text-primary transition-colors font-label-sm uppercase tracking-[0.25em] text-[11px]">{social}</a>
          ))}
          <Link
            to="/contact"
            replace
            onClick={(e) => {
              e.preventDefault();
              smartNavigate("/contact", { asSectionSwitch: true });
            }}
            className="text-on-surface-variant hover:text-primary transition-colors font-label-sm uppercase tracking-[0.25em] text-[11px]"
          >
            Contact
          </Link>
        </div>
      </footer>
      </div>
    </MotionConfig>
  );
};

export default Layout;
