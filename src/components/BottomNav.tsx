import React, { memo, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { LayoutDashboard, Image, Rocket, Settings, Home, Info, Mail, LogIn, User as UserIcon, MoreHorizontal, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useTouchFeedback } from "../hooks/useTouchFeedback";
import { useSmartNavigate } from "../hooks/useSmartNavigate";

/**
 * BottomNav — Native-style bottom navigation bar
 * 
 * Mobile-optimized features:
 * - Fixed at bottom with safe-area inset
 * - Touch-friendly: 44px+ tap targets (iOS/Material HIG compliant)
 * - Haptic-like visual feedback
 * - Smooth active state transitions
 * - Blur backdrop effect
 * - Prevents double-tap zoom
 * 
 * Only visible on mobile (< lg breakpoint)
 */
const BottomNav: React.FC = memo(() => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const smartNavigate = useSmartNavigate();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const guestItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/gallery", icon: Image, label: "Gallery" },
    { path: "/about", icon: Info, label: "About" },
    { path: "/contact", icon: Mail, label: "Contact" },
    { path: "/login", icon: LogIn, label: "Login" },
  ];

  const userPrimaryItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/submit-project", icon: Rocket, label: "Submit" },
    { path: "/profile", icon: UserIcon, label: "Profile" },
  ];

  const userOverflowItems = [
    { path: "/gallery", icon: Image, label: "Gallery" },
    { path: "/about", icon: Info, label: "About" },
    { path: "/contact", icon: Mail, label: "Contact" },
    ...(user?.role === "ADMIN" ? [{ path: "/admin", icon: Settings, label: "Admin" }] : []),
  ];

  const { primaryItems, overflowItems } = useMemo(() => {
    if (user) {
      return {
        primaryItems: userPrimaryItems,
        overflowItems: userOverflowItems,
      };
    }

    const maxPrimary = 5;
    const hasOverflow = guestItems.length > maxPrimary;
    const visibleCount = hasOverflow ? 4 : maxPrimary;
    return {
      primaryItems: guestItems.slice(0, visibleCount),
      overflowItems: guestItems.slice(visibleCount),
    };
  }, [guestItems, user, userOverflowItems, userPrimaryItems]);

  const isOverflowRouteActive = overflowItems.some(({ path }) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path)
  );

  useEffect(() => {
    setIsMoreOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMoreOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMoreOpen(false);
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMoreOpen]);

  return (
    <nav
      className={`lg:hidden fixed bottom-0 left-0 right-0 z-[200] border-t backdrop-blur-2xl transition-colors duration-500 shadow-xl ${
        theme === "light"
          ? "bg-white/95 border-slate-200/50 shadow-slate-200/40"
          : "bg-[#050505]/95 border-white/5 shadow-black/50"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Main navigation"
      role="navigation"
    >
      <div className="grid grid-cols-5 h-14 sm:h-16 px-1">
        {primaryItems.map(({ path, icon: Icon, label }) => {
          const isActive =
            path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

          return (
            <NavLinkItem
              key={path}
              path={path}
              icon={Icon}
              label={label}
              isActive={isActive}
              theme={theme}
              onNavigate={() => smartNavigate(path, { asSectionSwitch: true })}
            />
          );
        })}

        {overflowItems.length > 0 ? (
          <NavLinkItem
            icon={MoreHorizontal}
            label="More"
            isActive={isOverflowRouteActive || isMoreOpen}
            theme={theme}
            onNavigate={() => setIsMoreOpen((prev) => !prev)}
          />
        ) : null}
      </div>

      <AnimatePresence>
        {isMoreOpen && overflowItems.length > 0 && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreOpen(false)}
              className="fixed inset-0 z-[198] bg-black/55 backdrop-blur-sm"
              aria-label="Close more navigation"
            />
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className={`fixed left-2 right-2 bottom-[calc(env(safe-area-inset-bottom,0px)+4.25rem)] z-[199] rounded-3xl border p-2 shadow-2xl ${
                theme === "light"
                  ? "bg-white border-slate-200 shadow-slate-300/40"
                  : "bg-[#0a0a0a] border-white/10 shadow-black/80"
              }`}
            >
              {overflowItems.map(({ path, icon: Icon, label }) => {
                const isActive =
                  path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
                return (
                  <button
                    key={path}
                    type="button"
                    onClick={() => {
                      setIsMoreOpen(false);
                      smartNavigate(path, { asSectionSwitch: true });
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-colors ${
                      isActive
                        ? theme === "light"
                          ? "bg-indigo-50 text-indigo-600"
                          : "bg-indigo-500/15 text-indigo-300"
                        : theme === "light"
                        ? "text-slate-700 hover:bg-slate-100"
                        : "text-white/80 hover:bg-white/10"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4.5 w-4.5" />
                      <span className="text-[11px] font-bold uppercase tracking-widest">{label}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 opacity-70" />
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
});

/**
 * Individual nav item with enhanced mobile UX
 */
const NavLinkItem: React.FC<{
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  isActive: boolean;
  theme: "light" | "dark";
  onNavigate: () => void;
}> = ({ icon: Icon, label, isActive, theme, onNavigate }) => {
  const { handlers, isPressed } = useTouchFeedback(80);

  return (
    <button
      type="button"
      onClick={onNavigate}
      className="relative flex flex-col items-center justify-center w-full gap-0.5 py-2 select-none transition-colors duration-200"
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
    >
      {/* Active pill background */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            layoutId="bottom-nav-active"
            className={`absolute inset-x-1.5 inset-y-0.5 rounded-xl ${
              theme === "light"
                ? "bg-indigo-500/12 shadow-indigo-500/10"
                : "bg-indigo-500/15 shadow-indigo-500/20"
            }`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Interactive button area */}
      <motion.div
        {...handlers}
        whileTap={isPressed ? { scale: 0.85 } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 600, damping: 25 }}
        className="relative z-10 flex flex-col items-center gap-0.5 w-full"
      >
        {/* Icon */}
        <motion.div
          initial={false}
          animate={isActive ? { scale: 1.1 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <Icon
            className={`h-5 w-5 transition-colors duration-200 ${
              isActive
                ? "text-indigo-500"
                : theme === "light"
                ? "text-slate-600"
                : "text-white/65"
            }`}
            strokeWidth={isActive ? 2.5 : 1.8}
            aria-hidden="true"
          />
        </motion.div>

        {/* Label */}
        <motion.span
          initial={false}
          animate={isActive ? { scale: 1.05 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
          className={`text-[10px] font-bold uppercase tracking-wide transition-colors duration-200 leading-tight ${
            isActive
              ? "text-indigo-500"
              : theme === "light"
              ? "text-slate-700"
              : "text-white/70"
          }`}
        >
          {label}
        </motion.span>
      </motion.div>
    </button>
  );
};

BottomNav.displayName = "BottomNav";
export default BottomNav;
