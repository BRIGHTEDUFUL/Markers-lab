import React, { memo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Image, Rocket, Settings, Home } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useTouchFeedback } from "../hooks/useTouchFeedback";

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

  if (!user) return null;

  const items = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/gallery", icon: Image, label: "Gallery" },
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/submit-project", icon: Rocket, label: "Submit" },
    ...(user.role === "ADMIN" ? [{ path: "/admin", icon: Settings, label: "Admin" }] : []),
  ];

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
      <div className="flex items-stretch justify-around h-14 sm:h-16">
        {items.map(({ path, icon: Icon, label }, idx) => {
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
              index={idx}
            />
          );
        })}
      </div>
    </nav>
  );
});

/**
 * Individual nav item with enhanced mobile UX
 */
const NavLinkItem: React.FC<{
  path: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  isActive: boolean;
  theme: "light" | "dark";
  index: number;
}> = ({ path, icon: Icon, label, isActive, theme, index }) => {
  const { handlers, isPressed } = useTouchFeedback(80);

  return (
    <NavLink
      to={path}
      className="relative flex flex-col items-center justify-center flex-1 min-w-0 gap-0.5 py-2 select-none transition-colors duration-200"
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
                ? "text-slate-400"
                : "text-white/40"
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
          className={`text-[8px] font-bold uppercase tracking-wide transition-colors duration-200 leading-tight ${
            isActive
              ? "text-indigo-500"
              : theme === "light"
              ? "text-slate-500"
              : "text-white/40"
          }`}
        >
          {label}
        </motion.span>
      </motion.div>
    </NavLink>
  );
};

BottomNav.displayName = "BottomNav";
export default BottomNav;
