import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import NProgress from "nprogress";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { LayoutDashboard, Settings, LogOut, Menu, X, Rocket, User as UserIcon, MessageSquare, Image, Mail, Globe, ChevronRight, Sun, Moon } from "lucide-react";
import { motion, MotionConfig, AnimatePresence } from "motion/react";
import { Toaster } from "sonner";
import { useAdaptiveMotion } from "../hooks/useAdaptiveMotion";
import { useSmartNavigate } from "../hooks/useSmartNavigate";
import { useOverlayBackHandler } from "../hooks/useOverlayBackHandler";
import { getParentRoute, isRootExitRoute, normalizePathname } from "../navigation/route-hierarchy";
import { getUserDisplayName, getUserInitials } from "../lib/user-display";
import { beginRouteMeasure, endRouteMeasure } from "../lib/route-performance";

import PWAInstallPrompt from "./PWAInstallPrompt";
import HeroRingBackdrop from "./HeroRingBackdrop";
import BottomNav from "./BottomNav";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { shouldReduceMotion } = useAdaptiveMotion();
  const navigate = useNavigate();
  const smartNavigate = useSmartNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNavScrolled, setIsNavScrolled] = useState(false);
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);
  const navScrolledRef = useRef(false);
  const showBackToTopRef = useRef(false);

  // Route transition progress
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
    
    // Scroll to top on route change
    window.scrollTo(0, 0);
    
    return () => {
      if (raf1) window.cancelAnimationFrame(raf1);
      if (raf2) window.cancelAnimationFrame(raf2);
      clearTimeout(timeout);
      NProgress.done();
    };
  }, [location.pathname]);
  
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktopViewport(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const { closeWithBack: closeMenuWithBack, closeSilently: closeMenuSilently } = useOverlayBackHandler(
    isMenuOpen,
    closeMenu,
    "layout-menu-drawer"
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onPopState = (event: PopStateEvent) => {
      const currentPath = normalizePathname(window.location.pathname);

      // At app home, allow standalone/browser to exit naturally when history is exhausted.
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

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: ["USER", "ADMIN"] },
    { name: "Submit Project", path: "/submit-project", icon: Rocket, roles: ["USER", "ADMIN"] },
    { name: "Admin Panel", path: "/admin", icon: Settings, roles: ["ADMIN"] },
    { name: "Public Gallery", path: "/gallery", icon: Image, roles: ["USER", "ADMIN", "GUEST"] },
    { name: "About", path: "/about", icon: Globe, roles: ["USER", "ADMIN", "GUEST"] },
    { name: "Contact", path: "/contact", icon: Mail, roles: ["USER", "ADMIN", "GUEST"] },
  ];

  const filteredNavItems = navItems.filter(item => 
    !item.roles || item.roles.includes(user?.role || "GUEST")
  );
  const navDisplayName = user ? getUserDisplayName({ name: user.name, email: user.email }) : "";
  const navInitials = user ? getUserInitials({ name: user.name, email: user.email }) : "";

  const footerPlatformLinks = useMemo(() => {
    const items: { name: string; path: string }[] = [{ name: "Public Gallery", path: "/gallery" }];
    if (user) {
      items.push({ name: "Dashboard", path: "/dashboard" }, { name: "Submit Project", path: "/submit-project" });
      if (user.role === "ADMIN") items.push({ name: "Admin Panel", path: "/admin" });
    }
    return items;
  }, [user]);

  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let raf = 0;
    const handleScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        const nextShowBackToTop = y > 500;
        const nextNavScrolled = y > 24;

        if (showBackToTopRef.current !== nextShowBackToTop) {
          showBackToTopRef.current = nextShowBackToTop;
          setShowBackToTop(nextShowBackToTop);
        }

        if (navScrolledRef.current !== nextNavScrolled) {
          navScrolledRef.current = nextNavScrolled;
          setIsNavScrolled(nextNavScrolled);
        }
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isHomeRoute = location.pathname === "/";
  const shouldForceReducedMotion = shouldReduceMotion || !isHomeRoute;

  return (
    <MotionConfig reducedMotion={shouldForceReducedMotion ? "always" : "user"}>
      <div className="relative min-h-screen min-h-[100dvh] text-foreground flex flex-col selection:bg-indigo-500 selection:text-white transition-colors duration-300">
      <HeroRingBackdrop theme={theme} variant="global" />
      <Helmet>
        <title>Maker’s Lab | Where Ideas Merge with Execution</title>
        <meta name="description" content="A high-end creative platform for developers and designers to showcase their best work." />
        <meta property="og:title" content="Maker’s Lab" />
        <meta property="og:description" content="Where ideas merge with execution." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="theme-color" content={theme === 'dark' ? '#050505' : '#ffffff'} />
      </Helmet>
      
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            onClick={scrollToTop}
            aria-label="Back to top"
            className={`fixed bottom-24 lg:bottom-8 right-4 lg:right-8 z-[100] p-4 rounded-2xl shadow-xl backdrop-blur-xl border transition-all duration-300 group ${theme === 'light' ? 'bg-white/90 border-slate-200 shadow-slate-200/60 text-slate-900 hover:bg-slate-900 hover:text-white hover:border-slate-900' : 'bg-white/5 border-white/10 text-white hover:bg-white hover:text-black'}`}
          >
            <ChevronRight className="h-6 w-6 -rotate-90 group-hover:-translate-y-1 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      <motion.nav
        className={`fixed top-0 left-0 right-0 z-[100] border-b transition-all duration-300 ${
          isNavScrolled
            ? theme === 'light'
              ? 'bg-white/92 border-slate-200/80 backdrop-blur-lg py-4'
              : 'bg-[#050505]/88 border-white/10 backdrop-blur-lg py-4'
            : theme === 'light'
            ? 'bg-white/20 border-transparent backdrop-blur-sm py-8'
            : 'bg-transparent border-transparent py-8'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12 sm:h-14 lg:h-16">
            <div className="flex-1 flex items-center">
              <Link
                to="/"
                replace
                onClick={(e) => {
                  e.preventDefault();
                  smartNavigate("/", { asSectionSwitch: true });
                }}
                className="flex items-center space-x-2 sm:space-x-3 group"
              >
                <motion.div 
                  whileHover={{ rotate: 15, scale: 1.1 }}
                  className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all duration-500 shadow-lg relative overflow-hidden ${
                    theme === 'light'
                      ? 'bg-slate-900 shadow-slate-300/50'
                      : 'bg-white shadow-white/5'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <Rocket className={`h-4 w-4 sm:h-5 sm:w-5 relative z-10 transition-colors duration-500 ${
                    theme === 'light' ? 'text-white' : 'text-black'
                  } group-hover:text-white`} />
                </motion.div>
                <span className="text-base sm:text-xl font-display font-bold text-foreground tracking-tighter uppercase xs:block bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 group-hover:from-indigo-500 group-hover:to-purple-500 transition-all duration-500">Maker’s Lab</span>
              </Link>
            </div>

            <div className="hidden lg:flex flex-1 justify-center items-center">
              <div className="flex space-x-1">
                {filteredNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    replace
                    onClick={(e) => {
                      e.preventDefault();
                      smartNavigate(item.path, { asSectionSwitch: true });
                    }}
                    className="relative px-4 xl:px-5 py-2 group"
                  >
                    <span className={`relative z-10 text-[10px] font-bold uppercase tracking-[0.25em] transition-all duration-300 ${
                      location.pathname === item.path 
                        ? "text-foreground" 
                        : "text-muted-foreground group-hover:text-foreground"
                    }`}>
                      {item.name}
                    </span>
                    {location.pathname === item.path && (
                      <motion.div 
                        layoutId="nav-active"
                        className={`absolute inset-0 rounded-full border shadow-sm ${
                          theme === 'light' 
                            ? "bg-slate-900/5 border-slate-900/10 shadow-slate-200/50" 
                            : "bg-white/5 border-white/10 shadow-white/5"
                        }`}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      >
                        <div className="absolute inset-x-4 -bottom-px h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
                      </motion.div>
                    )}
                  </Link>
                ))}
              </div>
            </div>

            <div className="hidden lg:flex flex-1 items-center justify-end space-x-4 lg:space-x-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                className={`relative p-2.5 rounded-xl border transition-all duration-500 group overflow-hidden shadow-sm ${
                  theme === 'light'
                    ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                }`}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 flex items-center justify-center w-5 h-5">
                  <AnimatePresence mode="wait" initial={false}>
                    {theme === 'dark' ? (
                      <motion.div
                        key="sun"
                        initial={{ scale: 0, rotate: -90, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        exit={{ scale: 0, rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "backOut" }}
                      >
                        <Sun className="h-4 w-4 text-amber-400" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="moon"
                        initial={{ scale: 0, rotate: -90, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        exit={{ scale: 0, rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "backOut" }}
                      >
                        <Moon className="h-4 w-4 text-indigo-600" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>

              {user ? (
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <Link to="/profile" replace onClick={(e) => {
                    e.preventDefault();
                    smartNavigate("/profile", { asSectionSwitch: true });
                  }} className={`flex items-center space-x-2 sm:space-x-3 px-3 sm:px-5 py-2 sm:py-2.5 border rounded-full transition-all group overflow-hidden relative shadow-sm ${
                    theme === 'light' ? 'bg-slate-100 border-slate-200 shadow-slate-200/50' : 'bg-white/5 border-white/10 shadow-white/5'
                  }`}>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={navDisplayName} className={`h-5 w-5 sm:h-6 sm:w-6 rounded-full object-cover ring-2 transition-all group-hover:ring-indigo-500/50 ${
                        theme === 'light' ? 'ring-slate-200' : 'ring-white/20'
                      }`} />
                    ) : (
                      <div className={`h-5 w-5 sm:h-6 sm:w-6 rounded-full flex items-center justify-center ring-2 transition-all group-hover:ring-indigo-500/50 ${
                        theme === 'light' ? 'bg-indigo-500/10 ring-indigo-500/20' : 'bg-indigo-500/20 ring-indigo-500/40'
                      }`}>
                        <span className="text-[9px] sm:text-[10px] font-bold text-indigo-500 uppercase">{navInitials}</span>
                      </div>
                    )}
                    <span className="relative z-10 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-muted-foreground group-hover:text-foreground transition-colors truncate max-w-[80px] sm:max-w-none">{navDisplayName}</span>
                  </Link>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleLogout}
                    className="p-2 sm:p-2.5 bg-red-500/5 border border-red-500/10 rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5"
                    title="Logout"
                  >
                    <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </motion.button>
                </div>
              ) : (
                <div className="flex items-center space-x-4 lg:space-x-8">
                  <Link to="/login" replace onClick={(e) => {
                    e.preventDefault();
                    smartNavigate("/login", { asSectionSwitch: true });
                  }} className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-muted-foreground hover:text-foreground transition-colors relative group">
                    Login
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-indigo-500 transition-all duration-300 group-hover:w-full" />
                  </Link>
                  <Link to="/register" replace onClick={(e) => {
                    e.preventDefault();
                    smartNavigate("/register", { asSectionSwitch: true });
                  }} className="relative group px-6 sm:px-10 py-2.5 sm:py-3.5 overflow-hidden rounded-full shadow-xl shadow-indigo-500/20">
                    <div className={`absolute inset-0 transition-transform duration-500 group-hover:scale-110 ${
                      theme === 'light' ? 'bg-slate-900' : 'bg-white'
                    }`} />
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    <span className={`relative z-10 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] transition-colors duration-500 ${
                      theme === 'light' ? 'text-white' : 'text-black'
                    } group-hover:text-white`}>Get Started</span>
                  </Link>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4 lg:hidden">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className={`p-2.5 rounded-xl border focus:outline-none transition-all duration-500 relative overflow-hidden shadow-sm ${
                  theme === 'light' ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-white/5 border-white/10 text-white/85'
                }`}
              >
                <div className="relative z-10 flex items-center justify-center w-5 h-5">
                  <AnimatePresence mode="wait" initial={false}>
                    {theme === 'dark' ? (
                      <motion.div
                        key="sun-mobile"
                        initial={{ scale: 0, rotate: -90, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        exit={{ scale: 0, rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "backOut" }}
                      >
                        <Sun className="h-4 w-4 text-amber-400" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="moon-mobile"
                        initial={{ scale: 0, rotate: -90, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        exit={{ scale: 0, rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "backOut" }}
                      >
                        <Moon className="h-4 w-4 text-indigo-600" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (isMenuOpen) {
                    closeMenuWithBack();
                  } else {
                    setIsMenuOpen(true);
                  }
                }}
                className={`p-2 sm:p-3 rounded-full border focus:outline-none transition-all shadow-sm ${
                  theme === 'light' ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-white/5 border-white/10 text-white/85'
                }`}
              >
                {isMenuOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
              </motion.button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeMenuWithBack}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[105]"
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className={`fixed top-0 right-0 bottom-0 w-[85%] max-w-sm border-l z-[110] p-8 flex flex-col shadow-2xl ${
                  theme === 'light' ? 'bg-white border-slate-200 shadow-slate-200/60' : 'bg-card border-border'
                }`}
              >
                <div className="flex justify-between items-center mb-12">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-xl ${theme === 'light' ? 'bg-slate-900' : 'bg-foreground'}`}>
                      <Rocket className={`h-5 w-5 ${theme === 'light' ? 'text-white' : 'text-background'}`} />
                    </div>
                    <span className="text-xl font-display font-bold text-foreground tracking-tighter uppercase">Maker’s Lab</span>
                  </div>
                  <button onClick={closeMenuWithBack} className="p-2 text-muted-foreground hover:text-foreground">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="flex-grow space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                  {filteredNavItems.map((item, i) => (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={item.path}
                    >
                      <Link
                        to={item.path}
                        replace
                        onClick={(e) => {
                          e.preventDefault();
                          closeMenuSilently();
                          smartNavigate(item.path, { asSectionSwitch: true });
                        }}
                        className={`group flex items-center justify-between p-5 rounded-2xl transition-all shadow-sm ${
                          location.pathname === item.path
                            ? theme === 'light' ? "bg-indigo-50 border border-indigo-200 text-indigo-600 shadow-sm shadow-indigo-100/50" : "bg-indigo-500/10 border border-indigo-500/20 text-foreground"
                            : theme === 'light' ? "text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:shadow-sm" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center space-x-5">
                          <item.icon className={`h-6 w-6 ${location.pathname === item.path ? "text-indigo-500" : "text-muted-foreground group-hover:text-indigo-500"}`} />
                          <span className="text-xs font-bold uppercase tracking-[0.25em]">{item.name}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </motion.div>
                  ))}
                </div>

                <div className={`pt-8 border-t space-y-4 ${theme === 'light' ? 'border-slate-100' : 'border-border'}`}>
                  {user ? (
                    <>
                      <Link
                        to="/profile"
                        replace
                        onClick={(e) => {
                          e.preventDefault();
                          closeMenuSilently();
                          smartNavigate("/profile", { asSectionSwitch: true });
                        }}
                        className={`flex items-center space-x-4 p-4 rounded-2xl border shadow-sm ${
                          theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900 shadow-slate-100/50' : 'bg-foreground/5 border-border text-foreground'
                        }`}
                      >
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={navDisplayName} className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            theme === 'light' ? 'bg-indigo-50' : 'bg-indigo-500/20'
                          }`}>
                            <span className="text-xs font-bold uppercase text-indigo-500">{navInitials}</span>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest">{navDisplayName}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{user.role}</p>
                        </div>
                      </Link>
                      <button
                        onClick={() => { closeMenuSilently(); handleLogout(); }}
                        className={`w-full flex items-center space-x-4 p-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] ${
                          theme === 'light' ? 'bg-red-50 text-red-600' : 'bg-red-500/10 text-red-500'
                        }`}
                      >
                        <LogOut className="h-5 w-5" />
                        <span>Terminate Session</span>
                      </button>
                    </>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      <Link to="/login" replace onClick={(e) => {
                        e.preventDefault();
                        closeMenuSilently();
                        smartNavigate("/login", { asSectionSwitch: true });
                      }} className={`flex items-center justify-center p-4 rounded-2xl border text-[10px] font-bold uppercase tracking-[0.2em] ${
                        theme === 'light' ? 'border-slate-200 text-slate-900' : 'border-border text-foreground'
                      }`}>Login</Link>
                      <Link to="/register" replace onClick={(e) => {
                        e.preventDefault();
                        closeMenuSilently();
                        smartNavigate("/register", { asSectionSwitch: true });
                      }} className={`flex items-center justify-center p-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] ${
                        theme === 'light' ? 'bg-slate-900 text-white' : 'bg-foreground text-background'
                      }`}>Get Started</Link>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.nav>

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
                <span className="text-xl sm:text-2xl font-display font-bold text-foreground tracking-tighter uppercase">Maker’s Lab</span>
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
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground text-center sm:text-left">© 2026 Maker’s Lab. Tesano, Accra, Ghana.</p>
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
