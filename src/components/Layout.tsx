import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import NProgress from "nprogress";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { LayoutDashboard, Settings, LogOut, Menu, X, Rocket, User as UserIcon, MessageSquare, Image, Mail, Globe, ChevronRight, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { Toaster } from "sonner";

import PageHero from "./PageHero";
import PWAInstallPrompt from "./PWAInstallPrompt";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  // Route transition progress
  useEffect(() => {
    NProgress.start();
    const timeout = setTimeout(() => {
      NProgress.done();
    }, 200);
    
    // Scroll to top on route change
    window.scrollTo(0, 0);
    
    return () => {
      clearTimeout(timeout);
      NProgress.done();
    };
  }, [location.pathname]);
  
  const navBackground = useTransform(
    scrollY,
    [0, 50],
    [
      "rgba(var(--nav-bg-rgb), 0)", 
      "rgba(var(--nav-bg-rgb), 0.8)"
    ]
  );
  
  const navBorder = useTransform(
    scrollY,
    [0, 50],
    [
      "rgba(var(--nav-border-rgb), 0)", 
      "rgba(var(--nav-border-rgb), 0.1)"
    ]
  );

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'dark';
    root.style.setProperty('--nav-bg-rgb', isDark ? '5, 5, 5' : '255, 255, 255');
    root.style.setProperty('--nav-border-rgb', isDark ? '255, 255, 255' : '0, 0, 0');
  }, [theme]);
  
  const navPadding = useTransform(
    scrollY,
    [0, 50],
    ["2rem", "1rem"]
  );

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

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

  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-indigo-500 selection:text-white transition-colors duration-300">
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
            className={`fixed bottom-8 right-8 z-[100] p-4 rounded-2xl shadow-2xl backdrop-blur-xl border transition-all duration-300 group ${theme === 'light' ? 'bg-white/80 border-slate-200 text-slate-900 hover:bg-slate-900 hover:text-white' : 'bg-white/5 border-white/10 text-white hover:bg-white hover:text-black'}`}
          >
            <ChevronRight className="h-6 w-6 -rotate-90 group-hover:-translate-y-1 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      <motion.nav 
        style={{ 
          backgroundColor: navBackground,
          borderColor: navBorder,
          paddingTop: navPadding,
          paddingBottom: navPadding
        }}
        className={`fixed top-0 left-0 right-0 z-[100] backdrop-blur-xl border-b transition-all duration-500 ${
          theme === 'light' ? 'border-slate-200' : 'border-white/10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12 sm:h-14 lg:h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group">
                <motion.div 
                  whileHover={{ rotate: 15, scale: 1.1 }}
                  className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all duration-500 shadow-lg relative overflow-hidden ${
                    theme === 'light' 
                      ? 'bg-slate-900 shadow-slate-200' 
                      : 'bg-white shadow-white/5'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <Rocket className={`h-4 w-4 sm:h-5 sm:w-5 relative z-10 transition-colors duration-500 ${
                    theme === 'light' ? 'text-white' : 'text-black'
                  } group-hover:text-white`} />
                </motion.div>
                <span className="text-lg sm:text-xl font-display font-bold text-foreground tracking-tighter uppercase hidden xs:block bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 group-hover:from-indigo-500 group-hover:to-purple-500 transition-all duration-500">Maker’s Lab</span>
              </Link>
              
              <div className="hidden lg:ml-8 xl:ml-12 lg:flex lg:space-x-1">
                {filteredNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="relative px-5 py-2 group"
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

            <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                className={`relative p-2.5 rounded-xl border transition-all duration-500 group overflow-hidden ${
                  theme === 'light'
                    ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
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
                  <Link to="/profile" className={`flex items-center space-x-2 sm:space-x-3 px-3 sm:px-5 py-2 sm:py-2.5 border rounded-full transition-all group overflow-hidden relative shadow-sm ${
                    theme === 'light' ? 'bg-slate-100 border-slate-200 shadow-slate-200/50' : 'bg-white/5 border-white/10 shadow-white/5'
                  }`}>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className={`h-5 w-5 sm:h-6 sm:w-6 rounded-full object-cover ring-2 transition-all group-hover:ring-indigo-500/50 ${
                        theme === 'light' ? 'ring-slate-200' : 'ring-white/20'
                      }`} />
                    ) : (
                      <div className={`h-5 w-5 sm:h-6 sm:w-6 rounded-full flex items-center justify-center ring-2 transition-all group-hover:ring-indigo-500/50 ${
                        theme === 'light' ? 'bg-indigo-500/10 ring-indigo-500/20' : 'bg-indigo-500/20 ring-indigo-500/40'
                      }`}>
                        <UserIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-indigo-500" />
                      </div>
                    )}
                    <span className="relative z-10 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-muted-foreground group-hover:text-foreground transition-colors truncate max-w-[80px] sm:max-w-none">{user.name}</span>
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
                  <Link to="/login" className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-muted-foreground hover:text-foreground transition-colors relative group">
                    Login
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-indigo-500 transition-all duration-300 group-hover:w-full" />
                  </Link>
                  <Link to="/register" className="relative group px-6 sm:px-10 py-2.5 sm:py-3.5 overflow-hidden rounded-full shadow-xl shadow-indigo-500/20">
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
                className={`p-2.5 rounded-xl border focus:outline-none transition-all duration-500 relative overflow-hidden ${
                  theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-white/5 border-white/10 text-muted-foreground'
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
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`p-2 sm:p-3 rounded-full border focus:outline-none transition-all ${
                  theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-white/5 border-white/10 text-muted-foreground'
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
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[-1]"
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className={`fixed top-0 right-0 bottom-0 w-[85%] max-w-sm border-l z-[110] p-8 flex flex-col ${
                  theme === 'light' ? 'bg-white border-slate-200' : 'bg-card border-border'
                }`}
              >
                <div className="flex justify-between items-center mb-12">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-xl ${theme === 'light' ? 'bg-slate-900' : 'bg-foreground'}`}>
                      <Rocket className={`h-5 w-5 ${theme === 'light' ? 'text-white' : 'text-background'}`} />
                    </div>
                    <span className="text-xl font-display font-bold text-foreground tracking-tighter uppercase">Maker’s Lab</span>
                  </div>
                  <button onClick={() => setIsMenuOpen(false)} className="p-2 text-muted-foreground hover:text-foreground">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="flex-grow space-y-2">
                  {filteredNavItems.map((item, i) => (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={item.path}
                    >
                      <Link
                        to={item.path}
                        onClick={() => setIsMenuOpen(false)}
                        className={`group flex items-center justify-between p-4 rounded-2xl transition-all ${
                          location.pathname === item.path
                            ? theme === 'light' ? "bg-indigo-50 border border-indigo-100 text-indigo-600" : "bg-indigo-500/10 border border-indigo-500/20 text-foreground"
                            : theme === 'light' ? "text-slate-600 hover:bg-slate-50 hover:text-slate-900" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <item.icon className={`h-5 w-5 ${location.pathname === item.path ? "text-indigo-500" : "text-muted-foreground group-hover:text-indigo-500"}`} />
                          <span className="text-xs font-bold uppercase tracking-[0.2em]">{item.name}</span>
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
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center space-x-4 p-4 rounded-2xl border ${
                          theme === 'light' ? 'bg-slate-50 border-slate-100 text-slate-900' : 'bg-foreground/5 border-border text-foreground'
                        }`}
                      >
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            theme === 'light' ? 'bg-indigo-50' : 'bg-indigo-500/20'
                          }`}>
                            <UserIcon className="h-5 w-5 text-indigo-500" />
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest">{user.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{user.role}</p>
                        </div>
                      </Link>
                      <button
                        onClick={() => { handleLogout(); setIsMenuOpen(false); }}
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
                      <Link to="/login" onClick={() => setIsMenuOpen(false)} className={`flex items-center justify-center p-4 rounded-2xl border text-[10px] font-bold uppercase tracking-[0.2em] ${
                        theme === 'light' ? 'border-slate-200 text-slate-900' : 'border-border text-foreground'
                      }`}>Login</Link>
                      <Link to="/register" onClick={() => setIsMenuOpen(false)} className={`flex items-center justify-center p-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] ${
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

      <main className="flex-grow">
        {children}
      </main>

      <Toaster position="top-right" theme={theme as 'light' | 'dark'} richColors />
      <PWAInstallPrompt />

      <footer className={`border-t py-12 sm:py-24 ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-card border-border'}`}>
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
                A high-end creative platform where ideas merge with execution. We blend technical excellence with avant-garde design.
              </p>
            </div>
            <div className="sm:col-span-1">
              <h4 className="text-foreground text-[10px] font-bold uppercase tracking-[0.3em] mb-6">Platform</h4>
              <ul className="space-y-4">
                {navItems.slice(0, 3).map(item => (
                  <li key={item.path}>
                    <Link to={item.path} className="text-muted-foreground hover:text-foreground text-[10px] font-bold uppercase tracking-widest transition-colors">{item.name}</Link>
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
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground text-center sm:text-left">© 2026 Maker’s Lab. Platform Edition.</p>
            <div className="flex space-x-4 sm:space-x-8">
              <a href="#" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
