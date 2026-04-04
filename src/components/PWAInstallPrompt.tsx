import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../contexts/ThemeContext';

const PWAInstallPrompt: React.FC = () => {
  const { theme } = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    // Optionally, send analytics event with outcome of user choice
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md"
      >
        <div className={`p-4 rounded-2xl shadow-2xl border flex items-center justify-between gap-4 backdrop-blur-xl ${
          theme === 'light' ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${theme === 'light' ? 'bg-slate-100' : 'bg-white/10'}`}>
              <Download className={`h-5 w-5 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`} />
            </div>
            <div>
              <h4 className={`text-xs font-bold uppercase tracking-widest ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Install App</h4>
              <p className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-white/40'}`}>Add Maker's Lab to your home screen</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                theme === 'light' ? 'bg-slate-900 text-white hover:bg-indigo-600' : 'bg-white text-black hover:bg-indigo-500 hover:text-white'
              }`}
            >
              Install
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className={`p-2 rounded-full transition-all ${
                theme === 'light' ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-white/10 text-white/40'
              }`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
