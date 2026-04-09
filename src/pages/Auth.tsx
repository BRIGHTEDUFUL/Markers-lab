import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { insforge, insforgeConfigured } from "../lib/insforge-client";
import { fetchSessionUser, userFromAuthUser } from "../lib/makers-data";
import { useAuth } from "../contexts/AuthContext";
import { Rocket, Mail, Lock, User as UserIcon, ArrowRight, Loader2, Globe, Zap, Cpu, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "../contexts/ThemeContext";
import StarField from "../components/StarField";

export const AuthPage: React.FC<{ initialMode?: "login" | "register" }> = ({ initialMode = "login" }) => {
  const { theme } = useTheme();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"auth" | "verify">("auth");
  const [otp, setOtp] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingName, setPendingName] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/register") setMode("register");
    else setMode("login");
  }, [location.pathname]);

  const redirectTo = `${window.location.origin}/login`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (!insforgeConfigured) {
        setError("Configure VITE_INSFORGE_OSS_HOST and VITE_INSFORGE_ANON_KEY in .env");
        return;
      }
      if (mode === "login") {
        const { data, error: signErr } = await insforge.auth.signInWithPassword({ email, password });
        if (signErr) {
          setError(signErr.message || "Login failed");
          return;
        }
        if (data?.user) {
          let u = await fetchSessionUser();
          if (!u) u = userFromAuthUser(data.user);
          if (u) login(u);
          else {
            setError("Signed in but profile could not be loaded. Check VITE_INSFORGE_* env and database policies.");
            return;
          }
          navigate("/dashboard");
        } else {
          setError("No user returned from server. Check InsForge configuration.");
        }
        return;
      }
      const { data, error: regErr } = await insforge.auth.signUp({
        email,
        password,
        name,
        redirectTo,
      });
      if (regErr) {
        setError(regErr.message || "Registration failed");
        return;
      }
      if (data?.requireEmailVerification) {
        setPendingEmail(email);
        setPendingName(name);
        setStep("verify");
        return;
      }
      if (data?.accessToken && data.user) {
        let u = await fetchSessionUser();
        if (!u) u = userFromAuthUser(data.user);
        if (u) login(u);
        navigate("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (!insforgeConfigured) return;
      const { data, error: vErr } = await insforge.auth.verifyEmail({
        email: pendingEmail,
        otp,
      });
      if (vErr) {
        setError(vErr.message || "Invalid or expired code");
        return;
      }
      if (data?.user) {
        let u = await fetchSessionUser();
        if (!u) u = userFromAuthUser(data.user);
        if (u) login(u);
        navigate("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col lg:flex-row relative overflow-hidden">
      {/* Background stars — behind everything */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <StarField count={50} theme={theme} salt={2000} />
      </div>

      {/* Back to Home — only visible on mobile (desktop has the left panel) */}
      <Link
        to="/"
        className={`lg:hidden fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full border backdrop-blur-md text-[10px] font-bold uppercase tracking-widest transition-colors ${
          theme === "light"
            ? "bg-white/80 border-slate-200 text-slate-600 hover:text-slate-900"
            : "bg-black/40 border-white/10 text-white/50 hover:text-white"
        }`}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Home</span>
      </Link>

      {/* Left Side: Branding & Hero — desktop only */}
      <div className={`hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 overflow-hidden border-r transition-colors duration-700 ${theme === 'light' ? 'border-slate-200' : 'border-white/5'}`}>
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-r transition-colors duration-700 ${theme === "light" ? "from-white/90 via-white/40 to-transparent" : "from-black/70 via-black/35 to-transparent"}`} />
          <div className={`absolute top-0 left-0 h-full w-full bg-grid-white mask-radial transition-opacity duration-700 ${theme === "light" ? "opacity-[0.06]" : "opacity-[0.08]"}`} />
        </div>

        <div className="relative z-10 w-full max-w-lg space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-4"
          >
            <div className={`p-4 rounded-none transition-colors duration-500 ${theme === 'light' ? 'bg-slate-900' : 'bg-white'}`}>
              <Rocket className={`h-8 w-8 transition-colors duration-500 ${theme === 'light' ? 'text-white' : 'text-black'}`} />
            </div>
            <div>
              <h1 className={`font-display text-3xl uppercase tracking-tighter leading-none transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Maker’s<br />Lab</h1>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.4em] mt-1">Innovation Hub</p>
            </div>
          </motion.div>

          <div className="space-y-6">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`font-display text-6xl md:text-7xl uppercase tracking-tighter leading-[0.85] transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}
            >
              The Future <br />
              <span className="text-transparent italic" style={{ WebkitTextStroke: `1px ${theme === 'light' ? 'rgba(15,23,42,0.3)' : 'rgba(255,255,255,0.3)'}` }}>
                Is Built
              </span> <br />
              Here.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`text-lg font-light max-w-md leading-relaxed transition-colors duration-500 ${theme === 'light' ? 'text-slate-500' : 'text-white/40'}`}
            >
              Join the elite circle of creators, engineers, and visionaries shaping the next generation of digital excellence.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={`grid grid-cols-3 gap-8 pt-12 border-t transition-colors duration-500 ${theme === 'light' ? 'border-slate-200' : 'border-white/5'}`}
          >
            {[
              { icon: Globe, label: "Global" },
              { icon: Zap, label: "Fast" },
              { icon: Cpu, label: "Smart" }
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <item.icon className={`h-5 w-5 transition-colors duration-500 ${theme === 'light' ? 'text-slate-300' : 'text-white/20'}`} />
                <p className={`text-[9px] font-bold uppercase tracking-widest transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-white/40'}`}>{item.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Side: Forms — full width on mobile, half on desktop */}
      <div
        className={`w-full lg:w-1/2 relative flex items-start lg:items-center justify-center transition-colors duration-700 ${
          theme === "light" ? "bg-white" : "bg-[#080808]"
        }`}
      >
        {/* Ambient blobs */}
        <div className="absolute inset-0 z-0 opacity-30 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
        </div>

        {/* Scrollable form area — critical for small phones */}
        <div className="relative z-10 w-full min-h-screen lg:min-h-0 flex items-center justify-center px-4 py-20 sm:px-6 lg:px-12">
          <div className="w-full max-w-sm">{/* inner */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -20, filter: "blur(10px)" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={`backdrop-blur-3xl p-6 sm:p-10 border rounded-2xl space-y-8 shadow-2xl transition-all duration-500 ${
                theme === "light"
                  ? "bg-white border-slate-100 shadow-slate-200/50"
                  : "bg-white/[0.03] border-white/8 shadow-black/30"
              }`}
            >
              <div className="space-y-3">
                <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border transition-colors duration-500 ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span className={`text-[9px] font-bold uppercase tracking-widest transition-colors duration-500 ${theme === 'light' ? 'text-slate-500' : 'text-white/40'}`}>
                    {mode === "login" ? "Authentication Required" : "New Partnership"}
                  </span>
                </div>
                <h2 className={`font-display text-4xl sm:text-5xl uppercase tracking-tighter leading-none transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  {mode === "login" ? (
                    <>Access<br />Terminal</>
                  ) : (
                    <>Join<br />Lab</>
                  )}
                </h2>
              </div>

              {step === "verify" ? (
                <form className="space-y-6" onSubmit={handleVerify}>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-red-500/10 text-red-500 p-4 text-[10px] font-bold uppercase tracking-widest border border-red-500/20"
                    >
                      {error}
                    </motion.div>
                  )}
                  <p className={`text-xs ${theme === "light" ? "text-slate-600" : "text-white/60"}`}>
                    Enter the 6-digit code sent to <strong>{pendingEmail}</strong>
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className={`block w-full px-4 py-4 border text-sm text-center tracking-[0.5em] font-mono outline-none rounded-none ${theme === "light" ? "bg-slate-50 border-slate-200" : "bg-white/5 border-white/10 text-white"}`}
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading || otp.length < 6}
                    className={`w-full py-5 text-[10px] font-bold uppercase tracking-[0.3em] rounded-none ${theme === "light" ? "bg-slate-900 text-white" : "bg-white text-black"}`}
                  >
                    {loading ? <Loader2 className="animate-spin h-4 w-4 mx-auto" /> : "Verify email"}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await insforge.auth.resendVerificationEmail({ email: pendingEmail, redirectTo });
                    }}
                    className="w-full text-[10px] font-bold uppercase tracking-widest text-indigo-500"
                  >
                    Resend code
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("auth")}
                    className="w-full text-[10px] font-bold uppercase tracking-widest opacity-60"
                  >
                    Back
                  </button>
                </form>
              ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-red-500/10 text-red-500 p-4 text-[10px] font-bold uppercase tracking-widest border border-red-500/20"
                  >
                    {error}
                  </motion.div>
                )}
                
                <div className="space-y-5">
                  {mode === "register" && (
                    <div className="group">
                      <label className={`block text-[10px] font-bold mb-2 uppercase tracking-[0.2em] transition-colors duration-500 ${theme === 'light' ? 'text-slate-500' : 'text-gray-500'}`}>Full Name</label>
                      <div className="relative">
                        <UserIcon className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${theme === 'light' ? 'text-slate-300 group-focus-within:text-slate-900' : 'text-gray-600 group-focus-within:text-white'}`} />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          autoComplete="name"
                          autoCapitalize="words"
                          enterKeyHint="next"
                          className={`block w-full pl-12 pr-4 py-4 border text-sm transition-all outline-none rounded-none ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500 focus:bg-white' : 'bg-white/5 border-white/10 text-white focus:border-indigo-500 focus:bg-white/10'}`}
                          placeholder="CREATIVE NAME"
                        />
                      </div>
                    </div>
                  )}
                  <div className="group">
                    <label className={`block text-[10px] font-bold mb-2 uppercase tracking-[0.2em] transition-colors duration-500 ${theme === 'light' ? 'text-slate-500' : 'text-gray-500'}`}>Identity (Email)</label>
                    <div className="relative">
                      <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${theme === 'light' ? 'text-slate-300 group-focus-within:text-slate-900' : 'text-gray-600 group-focus-within:text-white'}`} />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        inputMode="email"
                        enterKeyHint="next"
                        className={`block w-full pl-12 pr-4 py-4 border text-sm transition-all outline-none rounded-none ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500 focus:bg-white' : 'bg-white/5 border-white/10 text-white focus:border-indigo-500 focus:bg-white/10'}`}
                        placeholder="USER@MAKERSLAB.COM"
                      />
                    </div>
                  </div>
                  <div className="group">
                    <label className={`block text-[10px] font-bold mb-2 uppercase tracking-[0.2em] transition-colors duration-500 ${theme === 'light' ? 'text-slate-500' : 'text-gray-500'}`}>Access Key (Password)</label>
                    <div className="relative">
                      <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${theme === 'light' ? 'text-slate-300 group-focus-within:text-slate-900' : 'text-gray-600 group-focus-within:text-white'}`} />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={mode === "login" ? "current-password" : "new-password"}
                        enterKeyHint="done"
                        className={`block w-full pl-12 pr-4 py-4 border text-sm transition-all outline-none rounded-none ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500 focus:bg-white' : 'bg-white/5 border-white/10 text-white focus:border-indigo-500 focus:bg-white/10'}`}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`group relative w-full flex justify-center py-5 px-4 text-[10px] font-bold uppercase tracking-[0.3em] transition-all duration-500 disabled:opacity-50 rounded-none overflow-hidden ${theme === 'light' ? 'bg-slate-900 text-white hover:bg-indigo-600' : 'bg-white text-black hover:bg-indigo-500 hover:text-white'}`}
                  >
                    <div className="absolute inset-0 w-0 bg-indigo-600 transition-all duration-500 group-hover:w-full" />
                    {loading ? (
                      <Loader2 className="animate-spin h-4 w-4 relative z-10" />
                    ) : (
                      <span className="flex items-center relative z-10">
                        {mode === "login" ? "Initiate Session" : "Create Account"} <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </button>

                </div>
              </form>
              )}

              <div className={`text-center pt-4 border-t transition-colors duration-500 ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-gray-600'}`}>
                  {mode === "login" ? "No Credentials?" : "Already Registered?"}{" "}
                  <button 
                    onClick={() => {
                      setMode(mode === "login" ? "register" : "login");
                      navigate(mode === "login" ? "/register" : "/login");
                    }} 
                    className="text-indigo-500 hover:text-indigo-600 transition-colors"
                  >
                    {mode === "login" ? "Request Access" : "Access Terminal"}
                  </button>
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
          </div>{/* max-w-sm */}
        </div>{/* scrollable area */}
      </div>{/* right panel */}
    </div>
  );
};

export const Login: React.FC = () => <AuthPage initialMode="login" />;
export const Register: React.FC = () => <AuthPage initialMode="register" />;

