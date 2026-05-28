/**
 * Top navigation bar — desktop nav links, theme toggle, user menu, mobile hamburger.
 * Handles scroll-based styling and active route highlighting.
 */
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Settings, Rocket, User as UserIcon, MessageSquare, Image, Mail, Globe, Sun, Moon, LogOut, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useSmartNavigate } from "../../hooks/useSmartNavigate";
import { getUserDisplayName, getUserInitials } from "../../lib/user-display";
import type { User } from "../../types";

interface TopNavBarProps {
  isMenuOpen: boolean;
  onMenuOpen: () => void;
  onMenuCloseWithBack: () => void;
}

const NAV_ITEMS = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: ["USER", "ADMIN"] },
  { name: "Submit Project", path: "/submit-project", icon: Rocket, roles: ["USER", "ADMIN"] },
  { name: "Admin Panel", path: "/admin", icon: Settings, roles: ["ADMIN"] },
  { name: "Public Gallery", path: "/gallery", icon: Image, roles: ["USER", "ADMIN", "GUEST"] },
  { name: "Pricing", path: "/pricing", icon: MessageSquare, roles: ["USER", "ADMIN", "GUEST"] },
  { name: "About", path: "/about", icon: Globe, roles: ["USER", "ADMIN", "GUEST"] },
  { name: "Contact", path: "/contact", icon: Mail, roles: ["USER", "ADMIN", "GUEST"] },
];

export const TopNavBar: React.FC<TopNavBarProps> = ({ isMenuOpen, onMenuOpen, onMenuCloseWithBack }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const smartNavigate = useSmartNavigate();
  const location = useLocation();
  const navigate = useNavigate();
  const [isNavScrolled, setIsNavScrolled] = useState(false);
  const navScrolledRef = useRef(false);

  const filteredNavItems = useMemo(() =>
    NAV_ITEMS.filter(item => !item.roles || item.roles.includes(user?.role || "GUEST")),
    [user?.role]
  );
  const navDisplayName = user ? getUserDisplayName({ name: user.name, email: user.email }) : "";
  const navInitials = user ? getUserInitials({ name: user.name, email: user.email }) : "";

  // Scroll detection for nav background
  useEffect(() => {
    if (typeof window === "undefined") return;

    let raf = 0;
    const handleScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        const nextNavScrolled = y > 24;

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

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (    <motion.header
      className={`hidden lg:flex fixed top-6 left-4 right-4 lg:left-8 lg:right-8 z-50 justify-between items-center px-8 py-4 max-w-[1440px] mx-auto bg-surface-container-low/60 backdrop-blur-2xl rounded-full border border-outline-variant/10 shadow-2xl transition-all duration-500 hover:bg-surface-container-low/80`}
    >
      <div className="flex items-center gap-4">
        <Link
          to="/"
          replace
          onClick={(e) => {
            e.preventDefault();
            smartNavigate("/", { asSectionSwitch: true });
          }}
          className="flex items-center gap-3 group"
        >
          <img alt="Maker's Lab Logo" className="w-7 h-7 object-contain" src="https://lh3.googleusercontent.com/aida/ADBb0ui-0VxsqXUOE7_HNmreItHOBGqQH2kZmQy6RxVrj1n5P74BJjO8zxN-9yGTXbsYfj40jqzKMUhclpDIPYsfD0uKdrTaek0hLiP0KcV9hBwkRq6SCbHY7JdrEApwlfhFm31CyQrm7_0PNITo53qV4w9hoqXiEUeSc0R12nyw_Yt69vakmrC6hKObv7p9rLRSlXj8gKEQtC9O-Dpk9TzxmlCgO99QKe4Czx9BktNvfUMtOi0a_N6AnuvYKQ8r"/>
          <span className="font-headline-md text-headline-md font-extrabold tracking-tighter text-on-surface uppercase">MAKER'S LAB</span>
        </Link>
      </div>

      <nav className="hidden lg:flex gap-10 items-center">
        {filteredNavItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            replace
            onClick={(e) => {
              e.preventDefault();
              smartNavigate(item.path, { asSectionSwitch: true });
            }}
            className={`font-label-sm text-label-sm tracking-wide uppercase transition-all duration-300 relative py-1 ${
              location.pathname === item.path
                ? "text-primary font-bold after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[1px] after:bg-primary"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className={`relative p-2 rounded-full border border-outline-variant/10 text-on-surface hover:bg-foreground/5 transition-all`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <div className="flex items-center justify-center w-5 h-5">
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
                  <Moon className="h-4 w-4 text-primary" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.button>

        {user ? (
          <div className="flex items-center gap-3">
            <Link
              to="/profile"
              replace
              onClick={(e) => {
                e.preventDefault();
                smartNavigate("/profile", { asSectionSwitch: true });
              }}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 border border-outline-variant/10 rounded-full hover:bg-foreground/5 transition-colors"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={navDisplayName} className="h-5 w-5 rounded-full object-cover" />
              ) : (
                <div className="h-5 w-5 rounded-full flex items-center justify-center bg-primary/10">
                  <span className="text-[9px] font-bold text-primary uppercase">{navInitials}</span>
                </div>
              )}
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant truncate max-w-[80px]">{navDisplayName}</span>
            </Link>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="hidden lg:flex p-2.5 bg-error/5 border border-error/10 rounded-full text-error hover:bg-error hover:text-on-error transition-all"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </motion.button>
            <button
              onClick={() => smartNavigate("/submit-project")}
              className="hidden lg:inline-flex items-center bg-primary text-on-primary px-8 py-2.5 rounded-full font-label-sm uppercase tracking-[0.15em] hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/10"
            >
              START BUILD
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              replace
              onClick={(e) => {
                e.preventDefault();
                smartNavigate("/login", { asSectionSwitch: true });
              }}
              className="hidden lg:inline-flex text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface-variant hover:text-primary transition-colors"
            >
              Login
            </Link>
            <button
              onClick={() => smartNavigate("/register")}
              className="hidden lg:inline-flex items-center bg-primary text-on-primary px-8 py-2.5 rounded-full font-label-sm uppercase tracking-[0.15em] hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/10"
            >
              START BUILD
            </button>
          </div>
        )}
      </div>
    </motion.header>
  );
};
