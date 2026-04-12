import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { insforge, insforgeConfigured } from "../lib/insforge-client";
import { fetchSessionUser, userFromAuthUser, trackPasswordResetRequest, completePasswordReset, trackLoginAttempt, logAuditEvent, markEmailAsVerified, validateEmailPasswordLogin } from "../lib/makers-data";
import { useAuth } from "../contexts/AuthContext";
import { Rocket, Mail, Lock, User as UserIcon, ArrowRight, Loader2, Globe, Zap, Cpu, ArrowLeft, Eye, EyeOff, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "../contexts/ThemeContext";
import StarField from "../components/StarField";
import { useTouchFeedback } from "../hooks/useTouchFeedback";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { useAdaptiveMotion } from "../hooks/useAdaptiveMotion";
import { useSmartNavigate } from "../hooks/useSmartNavigate";

/**
 * Enhanced Auth Page with:
 * - Google OAuth integration via Insforge
 * - Advanced styling with animations
 * - Password strength indicator
 * - Real-time form validation
 * - Enhanced accessibility
 * - Mobile-optimized UX
 */
export const AuthPage: React.FC<{ initialMode?: "login" | "register" }> = ({ initialMode = "login" }) => {
  const { theme } = useTheme();
  const { shouldReduceMotion } = useAdaptiveMotion();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [step, setStep] = useState<"auth" | "verify" | "forgot" | "reset">("auth");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingName, setPendingName] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "fair" | "good" | "strong" | null>(null);
  const [newPasswordStrength, setNewPasswordStrength] = useState<"weak" | "fair" | "good" | "strong" | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { login, authError, recoverSession } = useAuth();
  const { handlers: submitHandlers, isPressed: isSubmitPressed } = useTouchFeedback(80);
  const navigate = useNavigate();
  const smartNavigate = useSmartNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/register") setMode("register");
    else setMode("login");
  }, [location.pathname]);

  // Detect if user is returning from password reset email link
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get("reset") === "true") {
      setStep("reset");
    }
  }, [location.search]);

  useEffect(() => {
    if (authError) setError(authError);
  }, [authError]);

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const oauthError = q.get("error") || q.get("authError");
    const oauthDesc = q.get("error_description") || q.get("message");
    if (oauthError || oauthDesc) {
      setError(formatAuthError(oauthDesc || oauthError));
    }
  }, [location.search]);

  useEffect(() => {
    if (!insforgeConfigured) return;

    const q = new URLSearchParams(location.search);
    const hasOAuthCallback = q.has("code") || q.has("state") || q.has("auth_code");
    if (!hasOAuthCallback) return;

    let cancelled = false;

    const finalizeOAuthLogin = async () => {
      setLoading(true);
      setError("");
      try {
        const authApi = insforge.auth as any;
        if (q.get("code") && typeof authApi.exchangeCodeForSession === "function") {
          await authApi.exchangeCodeForSession(q.get("code"));
        }

        let sessionUser = await fetchSessionUser();

        if (!sessionUser) {
          const { data } = await insforge.auth.getCurrentUser();
          if (data?.user) {
            sessionUser = userFromAuthUser(data.user as any);
          }
        }

        if (!cancelled && sessionUser) {
          login(sessionUser);
          navigate("/dashboard", { replace: true });
        } else if (!cancelled) {
          setError("Google sign-in did not create a valid session. Please try again.");
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(formatAuthError(err?.message || "Google authentication error"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    finalizeOAuthLogin();

    return () => {
      cancelled = true;
    };
  }, [insforgeConfigured, location.search, login, navigate]);

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength(null);
      return;
    }
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    
    if (strength <= 1) setPasswordStrength("weak");
    else if (strength <= 2) setPasswordStrength("fair");
    else if (strength <= 3) setPasswordStrength("good");
    else setPasswordStrength("strong");
  }, [password]);

  // Calculate new password strength
  useEffect(() => {
    if (!newPassword) {
      setNewPasswordStrength(null);
      return;
    }
    
    let strength = 0;
    if (newPassword.length >= 8) strength++;
    if (newPassword.length >= 12) strength++;
    if (/[A-Z]/.test(newPassword)) strength++;
    if (/[0-9]/.test(newPassword)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) strength++;
    
    if (strength <= 1) setNewPasswordStrength("weak");
    else if (strength <= 2) setNewPasswordStrength("fair");
    else if (strength <= 3) setNewPasswordStrength("good");
    else setNewPasswordStrength("strong");
  }, [newPassword]);

  const redirectTo = `${window.location.origin}/login`;

  const formatAuthError = (raw?: string | null) => {
    const msg = (raw || "").toLowerCase();
    if (!msg) return "Authentication failed. Please try again.";
    if (msg.includes("invalid") && msg.includes("credential")) {
      return "Invalid email or password.";
    }
    if (msg.includes("email") && msg.includes("verify")) {
      return "Verify your email first, then sign in.";
    }
    if (msg.includes("token") || msg.includes("refresh") || msg.includes("expired") || msg.includes("401")) {
      return "Session expired. Please sign in again.";
    }
    if (msg.includes("network") || msg.includes("fetch") || msg.includes("timeout")) {
      return "Network issue. Check your connection and retry.";
    }
    return raw || "Authentication failed. Please try again.";
  };

  const ensureAuthProfile = async (userId: string, displayName: string, userEmail: string) => {
    try {
      const { data: existing } = await insforge.database
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (existing) {
        await insforge.database
          .from("profiles")
          .update({
            display_name: displayName || userEmail || "Member",
            email: userEmail,
          })
          .eq("id", userId);
        return;
      }

      await insforge.database.from("profiles").insert([
        {
          id: userId,
          display_name: displayName || userEmail || "Member",
          role: "USER",
          email: userEmail,
        },
      ]);
    } catch (profileErr) {
      console.warn("Failed to persist profile details:", profileErr);
    }
  };

  // Forgot Password Handler
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      if (!insforgeConfigured) {
        setError("Password reset not configured. Check environment variables.");
        return;
      }

      // Use the correct Insforge method for password reset
      try {
        await (insforge.auth as any).resetPasswordForEmail?.(email, {
          redirectTo: `${window.location.origin}/login?reset=true`,
        });
      } catch (resetErr: any) {
        setError((resetErr as any).message || "Failed to send reset email");
        let userId = "";
        try {
          const { data: userSession } = await insforge.auth.getCurrentUser();
          userId = userSession?.user?.id || "";
        } catch {}
        // Log failed reset attempt (for security audit)
        await logAuditEvent("forgot_password_failed", "auth", null, {
          userId,
          status: "failed",
          errorMessage: resetErr.message,
        });
        return;
      }

      // Success - reset link sent
      setSuccessMessage(`Reset link sent to ${email}. Check your email for the recovery link.`);
      setPendingEmail(email);
      
      // Track password reset request (for rate limiting & audit trail)
      try {
        const { data: userSession } = await insforge.auth.getCurrentUser();
        if (userSession?.user?.id) {
          await trackPasswordResetRequest(userSession.user.id, email, {
            userAgent: navigator.userAgent,
          });
        }
      } catch (e) {
        console.warn("Could not track password reset:", e);
      }
      
      setOtp("");
    } catch (err: any) {
      setError(err?.message || "Error sending reset email");
    } finally {
      setLoading(false);
    }
  };

  // Reset Password Verification Handler
  const handleResetPasswordVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (!newPassword || !confirmPassword) {
        setError("Please fill in all fields");
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      if (newPasswordStrength === "weak") {
        setError("Password is too weak. Use at least 8 characters with uppercase, numbers, and symbols");
        return;
      }

      if (!insforgeConfigured) return;

      // Update password via Insforge auth
      try {
        await (insforge.auth as any).updateUser?.({
          password: newPassword,
        });
      } catch (updateErr: any) {
        setError((updateErr as any).message || "Failed to reset password");
        await logAuditEvent("password_reset_failed", "auth", null, {
          status: "failed",
          errorMessage: (updateErr as any).message,
        });
        return;
      }

      // Get current user to log the event
      let currentUser = null;
      try {
        const { data: userSession } = await insforge.auth.getCurrentUser();
        currentUser = userSession?.user;
      } catch {}

      // Mark email as verified (user proved access to email)
      if (currentUser?.id) {
        await markEmailAsVerified(currentUser.id);
      }

      // Complete password reset tracking
      if (currentUser?.id) {
        await completePasswordReset(currentUser.id);
        // Log successful reset
        await logAuditEvent("password_reset_success", "auth", currentUser.id, {
          userId: currentUser.id,
          status: "success",
        });
      }

      setSuccessMessage("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        setStep("auth");
        setEmail("");
        setNewPassword("");
        setConfirmPassword("");
        setOtp("");
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err: any) {
      setError(err?.message || "Error resetting password");
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth handler
  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      if (!insforgeConfigured) {
        setError("OAuth not configured. Check environment variables.");
        return;
      }

      // Use Insforge OAuth
      const { data, error: oauthErr } = await insforge.auth.signInWithOAuth({
        provider: "google",
        redirectTo,
        skipBrowserRedirect: true,
      });

      if (oauthErr) {
        setError(formatAuthError(oauthErr.message || "Google authentication failed"));
        return;
      }

      if (!data?.url) {
        setError("Could not start Google sign-in. Please try again.");
        return;
      }

      // Explicit redirect keeps flow deterministic across browsers/webviews.
      window.location.assign(data.url);
    } catch (err: any) {
      setError(formatAuthError(err?.message || "Google authentication error"));
    } finally {
      setGoogleLoading(false);
    }
  };

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
        const result = await validateEmailPasswordLogin(email, password);
        const loginIdentity = result.email || email;
        if (!result.success) {
          // Track failed login attempt
          await trackLoginAttempt(loginIdentity, false, {
            ipAddress: "browser",
            userAgent: navigator.userAgent,
            failedReason: result.error,
          });
          setError(formatAuthError(result.error || "Login failed"));
          return;
        }

        // Direct login flow (2FA removed)
        let u = await fetchSessionUser();
        if (!u) u = userFromAuthUser({ id: result.userId, email: loginIdentity } as any);
        if (u) {
          login(u);
          await trackLoginAttempt(loginIdentity, true, {
            userId: result.userId,
            userAgent: navigator.userAgent,
          });
          navigate("/dashboard", { replace: true });
        } else {
          setError("Profile could not be loaded. Check database policies.");
          return;
        }
        return;
      }
      const { data, error: regErr } = await (insforge.auth as any).signUp({
        email,
        password,
        name,
        userMetadata: {
          name,
          full_name: name,
        },
        redirectTo,
      });
      if (regErr) {
        // Track failed registration
        await logAuditEvent("registration_failed", "auth", null, {
          status: "failed",
          errorMessage: regErr.message,
        });
        setError(formatAuthError(regErr.message || "Registration failed"));
        return;
      }

      if (data?.user?.id) {
        await ensureAuthProfile(data.user.id, name, email);
      }

      if (data?.requireEmailVerification) {
        setPendingEmail(email);
        setPendingName(name);
        setStep("verify");
        return;
      }
      if (data?.accessToken && data.user) {
        // Track successful registration
        await logAuditEvent("registration_success", "auth", data.user.id, {
          userId: data.user.id,
          status: "success",
        });
        
        let u = await fetchSessionUser();
        if (!u) u = userFromAuthUser(data.user);
        if (u) login(u);
        navigate("/dashboard", { replace: true });
      }
    } catch (err: any) {
      setError(formatAuthError(err?.message || "Authentication failed"));
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
        if (data.user.id) {
          await ensureAuthProfile(
            data.user.id,
            pendingName || data.user.email || "Member",
            data.user.email || pendingEmail
          );
        }

        // Mark email as verified in profiles table
        if (data.user.id) {
          await markEmailAsVerified(data.user.id);
        }
        
        let u = await fetchSessionUser();
        if (!u) u = userFromAuthUser(data.user);
        if (u) login(u);
        navigate("/dashboard", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col lg:flex-row relative overflow-hidden">
      {/* Background stars — behind everything */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <StarField count={shouldReduceMotion ? 14 : 32} theme={theme} salt={2000} />
      </div>

      {/* Back to Home — only visible on mobile (desktop has the left panel) */}
      <Link
        to="/"
        replace
        onClick={(e) => {
          e.preventDefault();
          smartNavigate("/", { asSectionSwitch: true });
        }}
        className={`lg:hidden fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full border backdrop-blur-md text-[10px] font-bold uppercase tracking-widest transition-colors ${
          theme === "light"
            ? "bg-white/80 border-slate-200 text-slate-600 hover:text-slate-900"
            : "bg-black/40 border-white/10 text-white/80 hover:text-white"
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
              className={`text-lg font-light max-w-md leading-relaxed transition-colors duration-500 ${theme === 'light' ? 'text-slate-500' : 'text-white/70'}`}
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
                <item.icon className={`h-5 w-5 transition-colors duration-500 ${theme === 'light' ? 'text-slate-300' : 'text-white/55'}`} />
                <p className={`text-[9px] font-bold uppercase tracking-widest transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-white/75'}`}>{item.label}</p>
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
                  ? "bg-white border-slate-200 shadow-xl shadow-slate-200/50"
                  : "bg-white/[0.03] border-white/8 shadow-black/30"
              }`}
            >
              <div className="space-y-3">
                <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border transition-colors duration-500 ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span className={`text-[9px] font-bold uppercase tracking-widest transition-colors duration-500 ${theme === 'light' ? 'text-slate-500' : 'text-white/75'}`}>
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
              ) : step === "forgot" ? (
                <form className="space-y-6" onSubmit={handleForgotPassword}>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-red-500/10 text-red-500 p-4 text-[10px] font-bold uppercase tracking-widest border border-red-500/20"
                    >
                      {error}
                    </motion.div>
                  )}
                  {successMessage && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-green-500/10 text-green-500 p-4 text-[10px] font-bold uppercase tracking-widest border border-green-500/20"
                    >
                      {successMessage}
                    </motion.div>
                  )}
                  <p className={`text-sm ${theme === "light" ? "text-slate-600" : "text-white/60"}`}>
                    Enter your email address and we'll send you a link to reset your password.
                  </p>

                  <motion.div
                    className="group"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <label className={`block text-[10px] font-bold mb-2 uppercase tracking-[0.2em] transition-colors duration-500 ${theme === 'light' ? 'text-slate-500' : 'text-gray-500'}`}>Email Address</label>
                    <div className="relative">
                      <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${theme === 'light' ? 'text-slate-300 group-focus-within:text-slate-900' : 'text-gray-600 group-focus-within:text-white'}`} />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => setTouched({ ...touched, forgotEmail: true })}
                        autoComplete="email"
                        inputMode="email"
                        className={`block w-full pl-12 pr-4 py-4 border text-sm transition-all outline-none rounded-lg sm:rounded-none ${theme === 'light' ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20' : 'bg-white/5 border-white/10 text-white focus:border-indigo-500 focus:bg-white/10'}`}
                        placeholder="USER@MAKERSLAB.COM"
                        aria-label="Email address for password reset"
                      />
                    </div>
                  </motion.div>

                  <motion.button
                    {...submitHandlers}
                    type="submit"
                    disabled={loading || !email || !!successMessage}
                    whileTap={isSubmitPressed && !successMessage ? { scale: 0.95 } : { scale: 1 }}
                    className={`group relative w-full flex justify-center py-5 px-4 text-[10px] font-bold uppercase tracking-[0.3em] transition-all duration-500 disabled:opacity-50 rounded-lg sm:rounded-none overflow-hidden shadow-lg ${theme === 'light' ? 'bg-slate-900 text-white hover:shadow-xl shadow-slate-900/20 hover:shadow-indigo-600/30' : 'bg-white text-black hover:shadow-xl shadow-white/10 hover:shadow-indigo-500/30'}`}
                  >
                    <div className="absolute inset-0 w-0 bg-indigo-600 transition-all duration-500 group-hover:w-full" />
                    {loading ? (
                      <Loader2 className="animate-spin h-4 w-4 relative z-10" />
                    ) : (
                      <span className="flex items-center relative z-10">
                        {successMessage ? "Link Sent ✓" : "Send Reset Link"} <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </motion.button>

                  {successMessage && (
                    <motion.button
                      type="button"
                      onClick={() => setStep("reset")}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`group relative w-full flex justify-center py-4 px-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 rounded-lg sm:rounded-none border ${theme === 'light' ? 'border-indigo-500 text-indigo-600 hover:bg-indigo-50' : 'border-indigo-400 text-indigo-400 hover:bg-indigo-500/10'}`}
                    >
                      Continue to Reset Password
                    </motion.button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setStep("auth");
                      setEmail("");
                      setError("");
                      setSuccessMessage("");
                    }}
                    className={`w-full text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 py-2 ${theme === 'light' ? 'text-slate-500 hover:text-slate-900' : 'text-white/40 hover:text-white'}`}
                  >
                    ← Back to Login
                  </button>
                </form>
              ) : step === "reset" ? (
                <form className="space-y-6" onSubmit={handleResetPasswordVerify}>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-red-500/10 text-red-500 p-4 text-[10px] font-bold uppercase tracking-widest border border-red-500/20"
                    >
                      {error}
                    </motion.div>
                  )}
                  {successMessage && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-green-500/10 text-green-500 p-4 text-[10px] font-bold uppercase tracking-widest border border-green-500/20"
                    >
                      {successMessage}
                    </motion.div>
                  )}

                  <div className="space-y-4">
                    <motion.div
                      className="group"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <label className={`block text-[10px] font-bold mb-2 uppercase tracking-[0.2em] transition-colors duration-500 ${theme === 'light' ? 'text-slate-500' : 'text-gray-500'}`}>New Password</label>
                      <div className="relative">
                        <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${theme === 'light' ? 'text-slate-300 group-focus-within:text-slate-900' : 'text-gray-600 group-focus-within:text-white'}`} />
                        <input
                          type={showNewPassword ? "text" : "password"}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          onBlur={() => setTouched({ ...touched, newPassword: true })}
                          autoComplete="new-password"
                          className={`block w-full pl-12 pr-12 py-4 border text-sm transition-all outline-none rounded-lg sm:rounded-none ${theme === 'light' ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20' : 'bg-white/5 border-white/10 text-white focus:border-indigo-500 focus:bg-white/10'}`}
                          placeholder="New Password"
                          aria-label="New password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className={`absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${theme === 'light' ? 'text-slate-400 hover:text-slate-600' : 'text-gray-500 hover:text-white'}`}
                          aria-label={showNewPassword ? "Hide password" : "Show password"}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>

                      {newPassword && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3 space-y-2"
                        >
                          <div className={`h-1.5 w-full rounded-full overflow-hidden ${theme === 'light' ? 'bg-slate-200' : 'bg-white/10'}`}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: newPasswordStrength === "weak" ? "25%" : newPasswordStrength === "fair" ? "50%" : newPasswordStrength === "good" ? "75%" : "100%",
                              }}
                              className={`h-full rounded-full transition-all ${
                                newPasswordStrength === "weak" ? "bg-red-500" :
                                newPasswordStrength === "fair" ? "bg-yellow-500" :
                                newPasswordStrength === "good" ? "bg-blue-500" :
                                "bg-green-500"
                              }`}
                            />
                          </div>
                          <span className={`text-[9px] font-bold uppercase tracking-widest ${
                            newPasswordStrength === "weak" ? "text-red-500" :
                            newPasswordStrength === "fair" ? "text-yellow-500" :
                            newPasswordStrength === "good" ? "text-blue-500" :
                            "text-green-500"
                          }`}>
                            {newPasswordStrength?.toUpperCase()}
                          </span>
                        </motion.div>
                      )}
                    </motion.div>

                    <motion.div
                      className="group"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <label className={`block text-[10px] font-bold mb-2 uppercase tracking-[0.2em] transition-colors duration-500 ${theme === 'light' ? 'text-slate-500' : 'text-gray-500'}`}>Confirm Password</label>
                      <div className="relative">
                        <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${theme === 'light' ? 'text-slate-300 group-focus-within:text-slate-900' : 'text-gray-600 group-focus-within:text-white'}`} />
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          onBlur={() => setTouched({ ...touched, confirmPassword: true })}
                          autoComplete="new-password"
                          className={`block w-full pl-12 pr-4 py-4 border text-sm transition-all outline-none rounded-lg sm:rounded-none ${theme === 'light' ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20' : 'bg-white/5 border-white/10 text-white focus:border-indigo-500 focus:bg-white/10'}`}
                          placeholder="Confirm Password"
                          aria-label="Confirm password"
                        />
                      </div>
                      {touched.confirmPassword && confirmPassword && newPassword && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`text-[10px] font-bold uppercase tracking-widest mt-2 flex items-center gap-1 ${
                            newPassword === confirmPassword ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {newPassword === confirmPassword ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Passwords match
                            </>
                          ) : (
                            <>
                              <X className="h-3.5 w-3.5" />
                              Passwords don't match
                            </>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  </div>

                  <motion.button
                    {...submitHandlers}
                    type="submit"
                    disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPasswordStrength === "weak"}
                    whileTap={isSubmitPressed ? { scale: 0.95 } : { scale: 1 }}
                    className={`group relative w-full flex justify-center py-5 px-4 text-[10px] font-bold uppercase tracking-[0.3em] transition-all duration-500 disabled:opacity-50 rounded-lg sm:rounded-none overflow-hidden shadow-lg ${theme === 'light' ? 'bg-slate-900 text-white hover:shadow-xl shadow-slate-900/20 hover:shadow-indigo-600/30' : 'bg-white text-black hover:shadow-xl shadow-white/10 hover:shadow-indigo-500/30'}`}
                  >
                    <div className="absolute inset-0 w-0 bg-indigo-600 transition-all duration-500 group-hover:w-full" />
                    {loading ? (
                      <Loader2 className="animate-spin h-4 w-4 relative z-10" />
                    ) : (
                      <span className="flex items-center relative z-10">
                        Reset Password <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </motion.button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep("auth");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className={`w-full text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 py-2 ${theme === 'light' ? 'text-slate-500 hover:text-slate-900' : 'text-white/40 hover:text-white'}`}
                  >
                    ← Back to Login
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
                    <div>{error}</div>
                    <button
                      type="button"
                      onClick={recoverSession}
                      className="mt-3 text-[9px] underline tracking-widest"
                    >
                      Reset Session
                    </button>
                  </motion.div>
                )}
                
                <div className="space-y-5">
                  {mode === "register" && (
                    <motion.div 
                      className="group"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <label className={`block text-[10px] font-bold mb-2 uppercase tracking-[0.2em] transition-colors duration-500 ${theme === 'light' ? 'text-slate-500' : 'text-gray-500'}`}>Full Name</label>
                      <div className="relative">
                        <UserIcon className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${theme === 'light' ? 'text-slate-300 group-focus-within:text-slate-900' : 'text-gray-600 group-focus-within:text-white'}`} />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          onBlur={() => setTouched({ ...touched, name: true })}
                          autoComplete="name"
                          autoCapitalize="words"
                          enterKeyHint="next"
                          className={`block w-full pl-12 pr-4 py-4 border text-sm transition-all outline-none rounded-lg sm:rounded-none ${theme === 'light' ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20' : 'bg-white/5 border-white/10 text-white focus:border-indigo-500 focus:bg-white/10'}`}
                          placeholder="CREATIVE NAME"
                          aria-label="Full name"
                        />
                      </div>
                    </motion.div>
                  )}

                  <motion.div 
                    className="group"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <label className={`block text-[10px] font-bold mb-2 uppercase tracking-[0.2em] transition-colors duration-500 ${theme === 'light' ? 'text-slate-500' : 'text-gray-500'}`}>
                      {mode === "login" ? "Identity (Email or Username)" : "Identity (Email)"}
                    </label>
                    <div className="relative">
                      <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${theme === 'light' ? 'text-slate-300 group-focus-within:text-slate-900' : 'text-gray-600 group-focus-within:text-white'}`} />
                      <input
                        type={mode === "login" ? "text" : "email"}
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => setTouched({ ...touched, email: true })}
                        autoComplete={mode === "login" ? "username" : "email"}
                        inputMode={mode === "login" ? "text" : "email"}
                        enterKeyHint="next"
                        className={`block w-full pl-12 pr-4 py-4 border text-sm transition-all outline-none rounded-lg sm:rounded-none ${theme === 'light' ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20' : 'bg-white/5 border-white/10 text-white focus:border-indigo-500 focus:bg-white/10'}`}
                        placeholder={mode === "login" ? "EMAIL OR USERNAME" : "USER@MAKERSLAB.COM"}
                        aria-label={mode === "login" ? "Email or username" : "Email address"}
                      />
                    </div>
                    {mode === "register" && touched.email && email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`text-[10px] font-bold uppercase tracking-widest mt-2 flex items-center gap-1 ${theme === 'light' ? 'text-green-600' : 'text-green-400'}`}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Valid email
                      </motion.div>
                    )}
                  </motion.div>

                  <motion.div 
                    className="group"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className={`block text-[10px] font-bold mb-2 uppercase tracking-[0.2em] transition-colors duration-500 ${theme === 'light' ? 'text-slate-500' : 'text-gray-500'}`}>Access Key (Password)</label>
                    <div className="relative">
                      <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${theme === 'light' ? 'text-slate-300 group-focus-within:text-slate-900' : 'text-gray-600 group-focus-within:text-white'}`} />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() => setTouched({ ...touched, password: true })}
                        autoComplete={mode === "login" ? "current-password" : "new-password"}
                        enterKeyHint="done"
                        className={`block w-full pl-12 pr-12 py-4 border text-sm transition-all outline-none rounded-lg sm:rounded-none ${theme === 'light' ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20' : 'bg-white/5 border-white/10 text-white focus:border-indigo-500 focus:bg-white/10'}`}
                        placeholder="••••••••"
                        aria-label="Password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${theme === 'light' ? 'text-slate-400 hover:text-slate-600' : 'text-gray-500 hover:text-white'}`}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Password strength indicator */}
                    {mode === "register" && password && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 space-y-2"
                      >
                        <div className={`h-1.5 w-full rounded-full overflow-hidden ${theme === 'light' ? 'bg-slate-200' : 'bg-white/10'}`}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: passwordStrength === "weak" ? "25%" : passwordStrength === "fair" ? "50%" : passwordStrength === "good" ? "75%" : "100%",
                            }}
                            className={`h-full rounded-full transition-all ${
                              passwordStrength === "weak" ? "bg-red-500" :
                              passwordStrength === "fair" ? "bg-yellow-500" :
                              passwordStrength === "good" ? "bg-blue-500" :
                              "bg-green-500"
                            }`}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-bold uppercase tracking-widest ${
                            passwordStrength === "weak" ? "text-red-500" :
                            passwordStrength === "fair" ? "text-yellow-500" :
                            passwordStrength === "good" ? "text-blue-500" :
                            "text-green-500"
                          }`}>
                            Strength: {passwordStrength?.toUpperCase()}
                          </span>
                          <div className="flex gap-1">
                            {[0, 1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className={`h-1 w-1 rounded-full transition-all ${
                                  i < (passwordStrength === "weak" ? 1 : passwordStrength === "fair" ? 2 : passwordStrength === "good" ? 3 : 4)
                                    ? "bg-indigo-500"
                                    : theme === "light" ? "bg-slate-200" : "bg-white/10"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Forgot Password Link — login mode only */}
                    {mode === "login" && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-2"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setStep("forgot");
                            setEmail("");
                            setError("");
                            setSuccessMessage("");
                          }}
                          className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${theme === 'light' ? 'text-slate-500 hover:text-indigo-600' : 'text-white/40 hover:text-indigo-400'}`}
                        >
                          Forgot Password?
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                </div>

                {/* Main action buttons */}
                <div className="space-y-4">
                  <motion.button
                    {...submitHandlers}
                    type="submit"
                    disabled={loading}
                    whileTap={isSubmitPressed ? { scale: 0.95 } : { scale: 1 }}
                    className={`group relative w-full flex justify-center py-5 px-4 text-[10px] font-bold uppercase tracking-[0.3em] transition-all duration-500 disabled:opacity-50 rounded-lg sm:rounded-none overflow-hidden shadow-lg ${theme === 'light' ? 'bg-slate-900 text-white hover:shadow-xl shadow-slate-900/20 hover:shadow-indigo-600/30' : 'bg-white text-black hover:shadow-xl shadow-white/10 hover:shadow-indigo-500/30'}`}
                  >
                    <div className="absolute inset-0 w-0 bg-indigo-600 transition-all duration-500 group-hover:w-full" />
                    {loading ? (
                      <Loader2 className="animate-spin h-4 w-4 relative z-10" />
                    ) : (
                      <span className="flex items-center relative z-10">
                        {mode === "login" ? "Initiate Session" : "Create Account"} <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </motion.button>

                  {/* Divider */}
                  <div className={`flex items-center gap-3 ${theme === 'light' ? 'text-slate-300' : 'text-white/20'}`}>
                    <div className="flex-1 h-px bg-current" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">Or continue with</span>
                    <div className="flex-1 h-px bg-current" />
                  </div>

                  {/* Google OAuth Button */}
                  <GoogleSignInButton
                    onSuccess={(googleData) => {
                      // Google OAuth successful, handle user creation/linking
                      handleGoogleAuth();
                    }}
                    onError={(error) => {
                      setError(error || "Google sign-in failed");
                    }}
                    isLoading={googleLoading}
                  />
                </div>
              </form>
              )}

              <div className={`text-center pt-4 border-t transition-colors duration-500 ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-gray-600'}`}>
                  {mode === "login" ? "No Credentials?" : "Already Registered?"}{" "}
                  <button 
                    onClick={() => {
                      setMode(mode === "login" ? "register" : "login");
                      navigate(mode === "login" ? "/register" : "/login", { replace: true });
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

