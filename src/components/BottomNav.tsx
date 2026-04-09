import React, { memo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Image, Rocket, Settings, Home } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

/**
 * Native-style bottom navigation bar — visible only on mobile (< lg).
 * Sits above the system home indicator with safe-area-inset-bottom.
 * Each tap target is ≥ 44px per Apple HIG / Material guidelines.
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
      className={`lg:hidden fixed bottom-0 left-0 right-0 z-[200] border-t backdrop-blur-2xl transition-colors duration-500 ${
        theme === "light"
          ? "bg-white/90 border-slate-200/80"
          : "bg-[#050505]/90 border-white/10"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Main navigation"
    >
      <div className="flex items-stretch justify-around h-16">
        {items.map(({ path, icon: Icon, label }) => {
          const isActive =
            path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

          return (
            <NavLink
              key={path}
              to={path}
              className="relative flex flex-col items-center justify-center flex-1 min-w-0 gap-1 py-2 select-none"
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Active pill background */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-active"
                    className="absolute inset-x-2 inset-y-1 rounded-2xl bg-indigo-500/10"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </AnimatePresence>

              <motion.div
                whileTap={{ scale: 0.82 }}
                transition={{ type: "spring", stiffness: 600, damping: 20 }}
                className="relative z-10 flex flex-col items-center gap-1"
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
                />
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider transition-colors duration-200 ${
                    isActive
                      ? "text-indigo-500"
                      : theme === "light"
                      ? "text-slate-400"
                      : "text-white/40"
                  }`}
                >
                  {label}
                </span>
              </motion.div>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
});

BottomNav.displayName = "BottomNav";
export default BottomNav;
