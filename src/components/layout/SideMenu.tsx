/**
 * Mobile side menu drawer.
 * Slides in from the right with overlay backdrop.
 */
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Rocket, LogOut, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useSmartNavigate } from "../../hooks/useSmartNavigate";
import { getUserDisplayName, getUserInitials } from "../../lib/user-display";
import { LayoutDashboard, Settings, Image, MessageSquare, Globe, Mail } from "lucide-react";

interface SideMenuProps {
  isOpen: boolean;
  onCloseWithBack: () => void;
  onCloseSilently: () => void;
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

export const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onCloseWithBack, onCloseSilently }) => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const smartNavigate = useSmartNavigate();
  const location = useLocation();
  const navigate = useNavigate();

  const filteredNavItems = NAV_ITEMS.filter(item =>
    !item.roles || item.roles.includes(user?.role || "GUEST")
  );
  const navDisplayName = user ? getUserDisplayName({ name: user.name, email: user.email }) : "";
  const navInitials = user ? getUserInitials({ name: user.name, email: user.email }) : "";

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseWithBack}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[105]"
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed top-0 left-0 bottom-0 w-full max-w-[400px] border-r z-[110] flex flex-col shadow-2xl bg-surface/98 backdrop-blur-3xl border-outline-variant/10 text-on-surface`}
          >
            <div className="p-8 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <img alt="Maker's Lab Logo" className="w-8 h-8 object-contain" src="https://lh3.googleusercontent.com/aida/ADBb0ui-0VxsqXUOE7_HNmreItHOBGqQH2kZmQy6RxVrj1n5P74BJjO8zxN-9yGTXbsYfj40jqzKMUhclpDIPYsfD0uKdrTaek0hLiP0KcV9hBwkRq6SCbHY7JdrEApwlfhFm31CyQrm7_0PNITo53qV4w9hoqXiEUeSc0R12nyw_Yt69vakmrC6hKObv7p9rLRSlXj8gKEQtC9O-Dpk9TzxmlCgO99QKe4Czx9BktNvfUMtOi0a_N6AnuvYKQ8r"/>
                <span className="font-headline-md text-headline-md font-black tracking-tighter text-on-surface uppercase">MAKER'S LAB</span>
              </div>
              <button
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-foreground/5 text-on-surface-variant hover:text-primary transition-all"
                onClick={onCloseWithBack}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <nav className="flex flex-col mt-12 overflow-y-auto flex-grow custom-scrollbar">
              {filteredNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                let symbol = "grid_view";
                if (item.path === "/dashboard") symbol = "layers";
                else if (item.path === "/submit-project") symbol = "bolt";
                else if (item.path === "/admin") symbol = "settings";
                else if (item.path === "/pricing") symbol = "payments";
                else if (item.path === "/about") symbol = "info";
                else if (item.path === "/contact") symbol = "mail";

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    replace
                    onClick={(e) => {
                      e.preventDefault();
                      onCloseSilently();
                      smartNavigate(item.path, { asSectionSwitch: true });
                    }}
                    className={`group px-8 py-5 font-headline-md text-headline-md flex items-center gap-4 transition-all duration-300 ${
                      isActive
                        ? "bg-foreground/5 text-primary border-l-4 border-primary"
                        : "text-on-surface-variant hover:text-on-surface hover:bg-foreground/5 border-l-4 border-transparent"
                    }`}
                  >
                    <span className="material-symbols-outlined transition-transform group-hover:scale-110">{symbol}</span>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto p-8 border-t border-outline-variant/10 space-y-6">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    replace
                    onClick={(e) => {
                      e.preventDefault();
                      onCloseSilently();
                      smartNavigate("/profile", { asSectionSwitch: true });
                    }}
                    className={`flex items-center space-x-4 p-4 rounded-2xl border border-outline-variant/10 bg-foreground/5 text-on-surface`}
                  >
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={navDisplayName} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full flex items-center justify-center bg-primary/10">
                        <span className="text-xs font-bold uppercase text-primary">{navInitials}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest">{navDisplayName}</p>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">{user.role}</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => { onCloseSilently(); handleLogout(); }}
                    className="w-full flex items-center space-x-4 p-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] bg-error/5 text-error hover:bg-error hover:text-on-error transition-all"
                  >
                    <span className="material-symbols-outlined">logout</span>
                    <span>Terminate Session</span>
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  <Link
                    to="/login"
                    replace
                    onClick={(e) => {
                      e.preventDefault();
                      onCloseSilently();
                      smartNavigate("/login", { asSectionSwitch: true });
                    }}
                    className="flex items-center justify-center p-4 rounded-full border border-outline-variant/10 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface hover:bg-foreground/5"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    replace
                    onClick={(e) => {
                      e.preventDefault();
                      onCloseSilently();
                      smartNavigate("/register", { asSectionSwitch: true });
                    }}
                    className="flex items-center justify-center p-4 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] bg-primary text-on-primary hover:brightness-110"
                  >
                    Get Started
                  </Link>
                </div>
              )}
              <p className="text-[10px] text-on-surface-variant uppercase tracking-[0.2em] opacity-60 text-center">Based in Accra / Tokyo</p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
