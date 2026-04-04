import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import { motion } from "motion/react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 font-sans">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full bg-white/5 border border-white/10 rounded-3xl p-8 text-center backdrop-blur-xl"
          >
            <div className="inline-flex items-center justify-center p-4 bg-red-500/10 rounded-2xl mb-6">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-display font-bold text-white uppercase tracking-tighter mb-4">
              System Malfunction
            </h1>
            
            <p className="text-white/60 text-sm mb-8 leading-relaxed">
              An unexpected error has occurred in the matrix. Our engineers have been notified.
            </p>

            <div className="bg-black/40 rounded-xl p-4 mb-8 text-left overflow-hidden">
              <p className="text-[10px] font-mono text-red-400/80 break-all uppercase tracking-widest">
                {this.state.error?.message || "Unknown error"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-white text-black rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all"
              >
                <RefreshCcw className="h-3 w-3" />
                <span>Reboot</span>
              </button>
              
              <a
                href="/"
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                <Home className="h-3 w-3" />
                <span>Home</span>
              </a>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
