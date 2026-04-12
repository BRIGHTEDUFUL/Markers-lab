import React, { useState, useEffect, useCallback, memo } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "../contexts/ThemeContext";
import { useTouchFeedback } from "../hooks/useTouchFeedback";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * PWAInstallPrompt — Native-style bottom sheet & desktop toast for PWA installation
 * 
 * Features:
 * - Mobile: Full-screen bottom sheet (visible <lg)
 * - Desktop: Toast in top-right (visible ≥lg)
 * - 3s delay before showing (non-intrusive)
 * - Session-based dismissal (won't show again this session)
 * - Touch-friendly tap targets (44px+)
 * - Spring animations with haptic-like feedback
 * - Safe-area inset aware
 * - Accessibility: ARIA labels, proper keyboard support
 */
const DISMISSED_KEY = "pwa-prompt-dismissed";

const isIosDevice = () => {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const iOSUA = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ may identify as Macintosh while still being touch-capable.
  const iPadOSDesktopUA = window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1;
  return iOSUA || iPadOSDesktopUA;
};

const isRunningStandalone = () => {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
};

const PWAInstallPrompt: React.FC = memo(() => {
  const { theme } = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed this session
    if (sessionStorage.getItem(DISMISSED_KEY)) return;
    if (isRunningStandalone()) return;

    let timeoutId = 0;

    const ios = isIosDevice();
    setIsIos(ios);

    if (ios) {
      timeoutId = window.setTimeout(() => setIsVisible(true), 3000);
      return () => window.clearTimeout(timeoutId);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // 3s delay for non-intrusive UX
      timeoutId = window.setTimeout(() => setIsVisible(true), 3000);
    };

    const onInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
      sessionStorage.setItem(DISMISSED_KEY, "1");
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`PWA installation outcome: ${outcome}`);
      setDeferredPrompt(null);
      setIsVisible(false);
      sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch (error) {
      console.error("PWA install error:", error);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setIsVisible(false);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Mobile bottom sheet */}
          <MobileBottomSheet
            theme={theme}
            isIos={isIos}
            onInstall={handleInstall}
            onDismiss={handleDismiss}
          />

          {/* Desktop toast */}
          {!isIos && (
            <DesktopToast
              theme={theme}
              onInstall={handleInstall}
              onDismiss={handleDismiss}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
});

/**
 * MobileBottomSheet — Full-screen bottom sheet for mobile
 */
const MobileBottomSheet: React.FC<{
  theme: "light" | "dark";
  isIos: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}> = ({ theme, isIos, onInstall, onDismiss }) => {
  const { handlers: installHandlers, isPressed: isInstallPressed } = useTouchFeedback(60);
  const { handlers: dismissHandlers, isPressed: isDismissPressed } = useTouchFeedback(60);

  return (
    <>
      {/* Backdrop — tap to dismiss */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[190] lg:hidden bg-black/20 backdrop-blur-sm"
        onClick={onDismiss}
        aria-hidden="true"
      />

      {/* Bottom sheet — mobile */}
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 340 }}
        className={`fixed bottom-0 left-0 right-0 z-[195] lg:hidden rounded-t-3xl border-t shadow-2xl ${
          theme === "light"
            ? "bg-white border-slate-200/50"
            : "bg-[#0a0a0a] border-white/5"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        role="dialog"
        aria-label="Install application"
      >
        {/* Drag handle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
        >
          <div
            className={`h-1.5 w-12 rounded-full transition-colors ${
              theme === "light" ? "bg-slate-300" : "bg-white/20"
            }`}
            aria-hidden="true"
          />
        </motion.div>

        <div className="px-6 pt-4 pb-6 space-y-5">
          {/* Header with icon */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-start gap-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.1 }}
              className={`p-3 rounded-2xl flex-shrink-0 ${
                theme === "light" ? "bg-indigo-50" : "bg-indigo-500/10"
              }`}
            >
              <Smartphone
                className="h-6 w-6 text-indigo-500"
                aria-hidden="true"
              />
            </motion.div>

            <div className="flex-1 min-w-0">
              <h3
                className={`text-sm font-black uppercase tracking-widest ${
                  theme === "light" ? "text-slate-900" : "text-white"
                }`}
              >
                {isIos ? "Install on iPhone" : "Add to Home Screen"}
              </h3>
              <p
                className={`text-xs mt-1.5 leading-relaxed ${
                  theme === "light" ? "text-slate-600" : "text-white/60"
                }`}
              >
                {isIos
                  ? "Open Share in Safari, then tap Add to Home Screen to install Maker's Lab."
                  : "Get instant access to Maker's Lab. Works offline and installs on your home screen."}
              </p>
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onDismiss}
              aria-label="Dismiss install prompt"
              className={`p-2 rounded-full flex-shrink-0 transition-colors duration-200 ${
                theme === "light"
                  ? "text-slate-400 hover:bg-slate-100"
                  : "text-white/40 hover:bg-white/10"
              }`}
            >
              <X className="h-4 w-4" />
            </motion.button>
          </motion.div>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex gap-3"
          >
            {/* Install button */}
            <motion.button
              {...installHandlers}
              onClick={isIos ? onDismiss : onInstall}
              whileTap={isInstallPressed ? { scale: 0.95 } : { scale: 1 }}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg ${
                theme === "light"
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/40"
                  : "bg-indigo-500 text-black hover:bg-indigo-400 shadow-indigo-500/40"
              } ${isInstallPressed ? "shadow-md" : ""}`}
              aria-label="Install the application"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {isIos ? "Got It" : "Install App"}
            </motion.button>

            {/* Dismiss button */}
            <motion.button
              {...dismissHandlers}
              onClick={onDismiss}
              whileTap={isDismissPressed ? { scale: 0.95 } : { scale: 1 }}
              className={`px-5 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${
                theme === "light"
                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  : "bg-white/10 text-white/70 hover:bg-white/15"
              }`}
              aria-label="Dismiss, ask later"
            >
              Not Now
            </motion.button>
          </motion.div>

          {/* Footer hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className={`text-[10px] text-center leading-relaxed ${
              theme === "light" ? "text-slate-500" : "text-white/40"
            }`}
          >
            {isIos
              ? "iPhone steps: Share icon -> Add to Home Screen"
              : "You can install this app anytime from the browser install menu"}
          </motion.p>
        </div>
      </motion.div>
    </>
  );
};

/**
 * DesktopToast — Toast notification for desktop (≥lg)
 */
const DesktopToast: React.FC<{
  theme: "light" | "dark";
  onInstall: () => void;
  onDismiss: () => void;
}> = ({ theme, onInstall, onDismiss }) => {
  const { handlers: installHandlers, isPressed: isInstallPressed } = useTouchFeedback(50);
  const { handlers: dismissHandlers, isPressed: isDismissPressed } = useTouchFeedback(50);

  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 340 }}
      className={`hidden lg:flex fixed top-20 right-6 z-[195] w-80 items-center gap-3 p-4 rounded-2xl shadow-2xl border backdrop-blur-xl ${
        theme === "light"
          ? "bg-white/95 border-slate-200"
          : "bg-[#0a0a0a]/95 border-white/10"
      }`}
      role="status"
      aria-label="Install app notification"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1 }}
        className={`p-2.5 rounded-xl flex-shrink-0 ${
          theme === "light" ? "bg-indigo-50" : "bg-indigo-500/10"
        }`}
      >
        <Download
          className="h-5 w-5 text-indigo-500"
          aria-hidden="true"
        />
      </motion.div>

      <div className="flex-1 min-w-0">
        <p
          className={`text-xs font-bold uppercase tracking-widest ${
            theme === "light" ? "text-slate-900" : "text-white"
          }`}
        >
          Install App
        </p>
        <p
          className={`text-[10px] mt-0.5 leading-tight ${
            theme === "light" ? "text-slate-600" : "text-white/60"
          }`}
        >
          Add to home screen for instant access
        </p>
      </div>

      <motion.div className="flex items-center gap-1.5">
        {/* Install button */}
        <motion.button
          {...installHandlers}
          onClick={onInstall}
          whileTap={isInstallPressed ? { scale: 0.92 } : { scale: 1 }}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
            theme === "light"
              ? "bg-indigo-600 text-white hover:bg-indigo-700"
              : "bg-indigo-500 text-black hover:bg-indigo-400"
          }`}
          aria-label="Install"
        >
          Install
        </motion.button>

        {/* Dismiss button */}
        <motion.button
          {...dismissHandlers}
          onClick={onDismiss}
          whileTap={isDismissPressed ? { scale: 0.92 } : { scale: 1 }}
          className={`p-1.5 rounded-lg transition-colors duration-200 ${
            theme === "light"
              ? "text-slate-400 hover:bg-slate-100"
              : "text-white/40 hover:bg-white/10"
          }`}
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

PWAInstallPrompt.displayName = "PWAInstallPrompt";
export default PWAInstallPrompt;
