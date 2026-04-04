import React from "react";
import { motion } from "motion/react";
import { useTheme } from "../contexts/ThemeContext";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  category?: string;
  compact?: boolean;
}

const PageHero: React.FC<PageHeroProps> = ({ title, subtitle, category, compact }) => {
  const { theme } = useTheme();

  return (
    <section className={`relative z-10 flex flex-col items-center justify-center px-4 text-center overflow-hidden border-b transition-colors duration-500 ${theme === 'light' ? 'border-slate-200' : 'border-white/5'} ${compact ? "min-h-[30vh] pt-20 pb-10" : "min-h-[50vh] sm:min-h-[60vh] pt-24 sm:pt-32 pb-16 sm:pb-20"}`}>
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className={`absolute top-0 left-0 w-full h-full mask-radial opacity-20 ${theme === 'light' ? 'bg-grid-slate-900' : 'bg-grid-white'}`} />
      </div>

      {/* Advanced Moon Background Element */}
      <motion.div
        initial={{ opacity: 0, scale: 1 }}
        animate={{ 
          opacity: theme === 'light' ? [0.4, 0.5, 0.4] : [0.8, 1, 0.8],
          scale: [1, 1.03, 1],
        }}
        transition={{ 
          duration: 60, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="absolute inset-0 pointer-events-none z-0"
      >
        <img 
          src="/moon-image.jpeg" 
          alt="Moon Background"
          className={`w-full h-full object-cover object-top filter transition-all duration-700 ${theme === 'light' ? 'brightness-110 contrast-110 saturate-100 opacity-90' : 'brightness-125 contrast-125 saturate-150 opacity-100'}`}
          referrerPolicy="no-referrer"
        />
        <div className={`absolute inset-0 transition-colors duration-700 ${theme === 'light' ? 'bg-gradient-to-b from-slate-50/20 via-transparent to-slate-50/20' : 'bg-gradient-to-b from-[#050505]/20 via-transparent to-[#050505]/20'}`} />
        <div className={`absolute inset-0 transition-colors duration-700 ${theme === 'light' ? 'bg-gradient-to-r from-slate-50/10 via-transparent to-slate-50/10' : 'bg-gradient-to-r from-[#050505]/10 via-transparent to-[#050505]/10'}`} />
        <div className={`absolute inset-0 transition-opacity duration-700 ${theme === 'light' ? 'bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.1)_0%,transparent_80%)] opacity-40' : 'bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.2)_0%,transparent_80%)]'}`} />
      </motion.div>

      {/* Realistic Animated Stars */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {[...Array(60)].map((_, i) => {
          const size = Math.random() * 2 + 1;
          const isLarge = size > 2.5;
          const starColor = theme === 'light' 
            ? ['#818cf8', '#6366f1', '#4f46e5'][Math.floor(Math.random() * 3)]
            : ['#ffffff', '#e0e7ff', '#fff7ed'][Math.floor(Math.random() * 3)];
          
          return (
            <motion.div
              key={i}
              initial={{ 
                opacity: Math.random() * 0.4 + 0.1,
                scale: Math.random() * 0.5 + 0.5
              }}
              animate={{ 
                opacity: [0.1, 0.8, 0.1],
                scale: isLarge ? [1, 1.2, 1] : [1, 1.5, 1],
              }}
              transition={{ 
                duration: Math.random() * 5 + 4, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: Math.random() * 15
              }}
              className="absolute rounded-full"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: starColor,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                boxShadow: isLarge ? `0 0 ${size * 4}px ${starColor}` : `0 0 ${size * 2}px ${starColor}`,
                filter: `blur(${size * 0.2}px)`
              }}
            />
          );
        })}
      </div>

      {category && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative z-10 ${compact ? "mb-4" : "mb-6"}`}
        >
          <span className={`px-4 py-1.5 rounded-full border backdrop-blur-md text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-500 ${theme === 'light' ? 'border-indigo-200 bg-white/50 text-indigo-600' : 'border-white/10 bg-white/5 text-indigo-400'}`}>
            {category}
          </span>
        </motion.div>
      )}

      <div className="relative z-10 w-full max-w-5xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={`font-display uppercase tracking-tighter leading-[0.9] transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'} ${compact ? "text-4xl sm:text-5xl md:text-6xl lg:text-7xl" : "text-5xl sm:text-6xl md:text-8xl lg:text-9xl"}`}
          dangerouslySetInnerHTML={{ __html: title }}
        />
        
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`${compact ? "mt-4" : "mt-8"} max-w-2xl mx-auto font-heading text-base sm:text-lg md:text-xl font-light leading-relaxed transition-colors duration-500 ${theme === 'light' ? 'text-slate-600' : 'text-white/60'}`}
          >
            {subtitle}
          </motion.p>
        )}
      </div>
    </section>
  );
};

export default PageHero;
