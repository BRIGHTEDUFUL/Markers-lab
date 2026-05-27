/**
 * Back-to-top floating button.
 * Appears when user scrolls past 500px, animates in/out.
 */
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRight } from "lucide-react";

interface BackToTopProps {
  theme: "light" | "dark";
}

export const BackToTop: React.FC<BackToTopProps> = ({ theme }) => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const showRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let raf = 0;
    const handleScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        const nextShow = y > 500;

        if (showRef.current !== nextShow) {
          showRef.current = nextShow;
          setShowBackToTop(nextShow);
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {showBackToTop && (
        <motion.button
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          onClick={scrollToTop}
          aria-label="Back to top"
          className={`fixed bottom-24 lg:bottom-8 right-4 lg:right-8 z-[100] p-4 rounded-2xl shadow-xl backdrop-blur-xl border transition-all duration-300 group ${theme === 'light' ? 'bg-white/90 border-slate-200 shadow-slate-200/60 text-slate-900 hover:bg-slate-900 hover:text-white hover:border-slate-900' : 'bg-white/5 border-white/10 text-white hover:bg-white hover:text-black'}`}
        >
          <ChevronRight className="h-6 w-6 -rotate-90 group-hover:-translate-y-1 transition-transform" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};
