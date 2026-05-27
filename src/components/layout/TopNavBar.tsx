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

  return (
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
              <span className="text-base sm:text-xl font-display font-bold text-foreground tracking-tighter uppercase xs:block bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 group-hover:from-indigo-500 group-hover:to-purple-500 transition-all duration-500">Maker's Lab</span>
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
                  onMenuCloseWithBack();
                } else {
                  onMenuOpen();
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
    </motion.nav>
  );
};
