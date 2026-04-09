import React, { useState, useEffect, useCallback } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "../contexts/ThemeContext";

const DISMISSED_KEY = "pwa-prompt-dismissed";

const PWAInstallPrompt: React.FC = () => {
  const { theme } = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed this session
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Small delay so it doesn't pop up immediately on load
      setTimeout(() => setIsVisible(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsVisible(false);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setIsVisible(false);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop — tap outside to dismiss */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[190] lg:hidden"
            onClick={handleDismiss}
          />

          {/* Bottom sheet — mobile */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className={`fixed bottom-0 left-0 right-0 z-[195] lg:hidden rounded-t-3xl border-t shadow-2xl ${
              theme === "light"
                ? "bg-white border-slate-200"
                : "bg-[#0a0a0a] border-white/10"
            }`}
            style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className={`h-1 w-10 rounded-full ${theme === "light" ? "bg-slate-200" : "bg-white/20"}`} />
            </div>

            <div className="px-6 pt-4 pb-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl flex-shrink-0 ${theme === "light" ? "bg-indigo-50" : "bg-indigo-500/10"}`}>
                  <Smartphone className="h-6 w-6 text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-bold uppercase tracking-widest ${theme === "light" ? "text-slate-900" : "text-white"}`}>
                    Add to Home Screen
                  </h3>
                  <p className={`text-xs mt-1 leading-relaxed ${theme === "light" ? "text-slate-500" : "text-white/50"}`}>
                    Install Maker's Lab for a faster, native-like experience — works offline too.
                  </p>
                </div>
                <button
                  onClick={handleDismiss}
                  aria-label="Dismiss install prompt"
                  className={`p-2 rounded-full flex-shrink-0 ${theme === "light" ? "text-slate-400 hover:bg-slate-100" : "text-white/40 hover:bg-white/10"}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleInstall}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95 ${
                    theme === "light"
                      ? "bg-slate-900 text-white"
                      : "bg-white text-black"
                  }`}
                >
                  <Download className="h-4 w-4" />
                  Install App
                </button>
                <button
                  onClick={handleDismiss}
                  className={`px-5 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95 ${
                    theme === "light"
                      ? "bg-slate-100 text-slate-600"
                      : "bg-white/10 text-white/60"
                  }`}
                >
                  Not Now
                </button>
              </div>
            </div>
          </motion.div>

          {/* Desktop toast — top-right */}
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`hidden lg:flex fixed top-20 right-6 z-[195] w-80 items-center gap-3 p-4 rounded-2xl shadow-2xl border backdrop-blur-xl ${
              theme === "light"
                ? "bg-white/95 border-slate-200"
                : "bg-[#0a0a0a]/95 border-white/10"
            }`}
          >
            <div className={`p-2.5 rounded-xl flex-shrink-0 ${theme === "light" ? "bg-indigo-50" : "bg-indigo-500/10"}`}>
              <Download className="h-5 w-5 text-indigo-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold uppercase tracking-widest ${theme === "light" ? "text-slate-900" : "text-white"}`}>Install App</p>
              <p className={`text-[10px] mt-0.5 ${theme === "light" ? "text-slate-500" : "text-white/40"}`}>Add to home screen</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleInstall}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 ${
                  theme === "light" ? "bg-slate-900 text-white" : "bg-white text-black"
                }`}
              >
                Install
              </button>
              <button onClick={handleDismiss} className={`p-1.5 rounded-full ${theme === "light" ? "text-slate-400 hover:bg-slate-100" : "text-white/40 hover:bg-white/10"}`}>
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
