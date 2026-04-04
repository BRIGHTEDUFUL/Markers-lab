import React from "react";
import { motion } from "motion/react";
import { Rocket } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

const LoadingScreen: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <div
      className={`fixed inset-0 z-[90] flex flex-col items-center justify-center backdrop-blur-md transition-colors duration-700 ${theme === "light" ? "bg-slate-50/40" : "bg-[#030303]/45"}`}
    >
      <div className="relative">
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
          }}
          className="h-24 w-24 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ 
              y: [-5, 5, -5],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Rocket className="h-8 w-8 text-indigo-500" />
          </motion.div>
        </div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <h2 className={`text-[10px] font-bold uppercase tracking-[0.5em] ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
          Maker’s Lab
        </h2>
        <p className={`mt-2 text-[8px] font-medium uppercase tracking-[0.3em] ${theme === 'light' ? 'text-slate-400' : 'text-white/40'}`}>
          Initializing Digital Excellence
        </p>
      </motion.div>
      
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 ${theme === 'light' ? 'bg-indigo-400' : 'bg-indigo-600'}`} />
      </div>
    </div>
  );
};

export default LoadingScreen;
