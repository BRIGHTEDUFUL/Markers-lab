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
                <span className="text-xl font-display font-bold text-foreground tracking-tighter uppercase">Maker's Lab</span>
              </div>
              <button onClick={onCloseWithBack} className="p-2 text-muted-foreground hover:text-foreground">
                <ChevronRight className="h-6 w-6" />
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
                      onCloseSilently();
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
                      onCloseSilently();
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
                    onClick={() => { onCloseSilently(); handleLogout(); }}
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
                    onCloseSilently();
                    smartNavigate("/login", { asSectionSwitch: true });
                  }} className={`flex items-center justify-center p-4 rounded-2xl border text-[10px] font-bold uppercase tracking-[0.2em] ${
                    theme === 'light' ? 'border-slate-200 text-slate-900' : 'border-border text-foreground'
                  }`}>Login</Link>
                  <Link to="/register" replace onClick={(e) => {
                    e.preventDefault();
                    onCloseSilently();
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
  );
};
