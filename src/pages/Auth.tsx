import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { insforge, insforgeConfigured } from "../lib/insforge-client";
import { fetchSessionUser, userFromAuthUser, trackPasswordResetRequest, completePasswordReset, trackLoginAttempt, logAuditEvent, markEmailAsVerified, validateEmailPasswordLogin } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { Mail, Lock, User as UserIcon, ArrowRight, Loader2, ArrowLeft, Eye, EyeOff, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "../contexts/ThemeContext";
import StarField from "../components/StarField";
import HeroRingBackdrop from "../components/HeroRingBackdrop";
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
        if (q.get("code")) {
          await insforge.auth.exchangeOAuthCode(q.get("code")!);
        }

        let sessionUser = await fetchSessionUser();

        if (!sessionUser) {
          const { data } = await insforge.auth.getCurrentUser();
          if (data?.user) {
            sessionUser = userFromAuthUser(data.user);
          }
        }

        if (!cancelled && sessionUser) {
          login(sessionUser);
          navigate("/dashboard", { replace: true });
        } else if (!cancelled) {
          setError("Google sign-in did not create a valid session. Please try again.");
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Google authentication error";
          setError(formatAuthError(msg));
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google authentication error";
      setError(formatAuthError(msg));
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
    <div className="min-h-screen min-h-[100dvh] flex flex-col lg:flex-row relative overflow-hidden bg-[#0c0e17]">
      {/* Global starfield background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <StarField count={shouldReduceMotion ? 14 : 48} theme="dark" salt={2000} />
      </div>

      {/* Ambient aura glow */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-30 z-0 pointer-events-none"
        style={{ filter: "blur(120px)", background: "radial-gradient(circle, rgba(73,75,214,0.18) 0%, rgba(111,0,190,0.12) 100%)" }}
      />

      {/* Back to Home — mobile only */}
      <Link
        to="/"
        replace
        onClick={(e) => {
          e.preventDefault();
          smartNavigate("/", { asSectionSwitch: true });
        }}
        className="lg:hidden fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full border backdrop-blur-md text-[10px] font-bold uppercase tracking-widest transition-colors bg-black/40 border-white/10 text-white/80 hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Home</span>
      </Link>

      {/* LEFT PANEL — Hero Branding (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center overflow-hidden border-r border-white/[0.05]">
        {/* Full-bleed cinematic ring backdrop */}
        <HeroRingBackdrop theme="dark" variant="authPanel" className="absolute inset-0 z-0" />

        {/* Floating star layer */}
        <div className="absolute inset-0 z-[1] pointer-events-none">
          <StarField count={shouldReduceMotion ? 10 : 24} theme="dark" salt={3500} />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-lg px-16 space-y-10">
          {/* Brand mark */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <div className="px-3 py-1 border border-primary/30 rounded-full">
              <span className="font-label-sm text-[10px] tracking-[0.4em] text-primary/80 uppercase">Maker's Lab</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          </motion.div>

          {/* Cinematic headline */}
          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="font-headline-xl text-[clamp(48px,6vw,84px)] uppercase tracking-tighter leading-[0.88] text-on-surface"
            >
              <span className="block">The</span>
              <span className="block text-outline">Future</span>
              <span className="block">Is Built</span>
              <span
                className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
              >Here.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-base font-light max-w-sm leading-relaxed text-on-surface-variant/60"
            >
              Join the elite circle of creators, engineers, and visionaries shaping the next generation of digital excellence.
            </motion.p>
          </div>

          {/* Status strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-6 pt-8 border-t border-white/[0.06]"
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="font-label-sm text-[9px] tracking-[0.3em] uppercase text-on-surface-variant/50">System Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#f9bd22]" />
              <span className="font-label-sm text-[9px] tracking-[0.3em] uppercase text-on-surface-variant/50">Secure Channel</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
              <span className="font-label-sm text-[9px] tracking-[0.3em] uppercase text-on-surface-variant/50">v4.2.0</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* RIGHT PANEL — Auth Form */}
      <div className="w-full lg:w-1/2 relative flex items-start lg:items-center justify-center">
        {/* Ambient blobs */}
        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-secondary/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
        </div>

        {/* Scrollable form area */}
        <div className="relative z-10 w-full min-h-screen lg:min-h-0 flex items-center justify-center px-5 py-20 sm:px-6 lg:px-12">
          <div className="w-full max-w-[420px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-3xl p-8 sm:p-10 space-y-7 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.7)] border border-white/[0.06]"
              style={{ backdropFilter: "blur(40px)", background: "rgba(17,19,29,0.55)" }}
            >
              {/* Header */}
              <div className="space-y-2 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-primary/80">
                    {mode === "login" ? "Laboratory Access" : "Network Registration"}
                  </span>
                </div>
                <h2 className="font-headline-lg text-[clamp(28px,4vw,42px)] tracking-tight leading-none" style={{ background: "linear-gradient(135deg,#fff 0%,#c0c1ff 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {mode === "login" ? "Access Studio" : "Join the Network"}
                </h2>
                <p className="font-body-md text-[13px] text-on-surface-variant/50">
                  {mode === "login" ? "Step beyond the interface. Access your studio." : "Register your node in the global maker network."}
                </p>
              </div>

              {step === "verify" ? (
                <form className="space-y-6" onSubmit={handleVerify}>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-error-container text-on-error-container p-4 text-[10px] font-bold uppercase tracking-widest border border-error/20 rounded-xl"
                    >
                      {error}
                    </motion.div>
                  )}
                  <p className="text-xs text-on-surface-variant/70">
                    Enter the 6-digit code sent to <strong>{pendingEmail}</strong>
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="block w-full px-4 py-4 border border-white/10 text-sm text-center tracking-[0.5em] font-mono outline-none rounded-2xl bg-white/5 text-on-surface placeholder:text-on-surface-variant/25 focus:border-primary/50 focus:bg-white/8 focus:ring-1 focus:ring-primary/30 transition-all"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading || otp.length < 6}
                    className="group relative w-full flex justify-center items-center gap-3 py-4 px-4 text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 disabled:opacity-50 rounded-2xl overflow-hidden shadow-xl active:scale-[0.97] text-white bg-gradient-to-r from-[#8083ff] to-[#6f00be] hover:brightness-110 shadow-primary/10 hover:shadow-primary/20 border border-white/10"
                  >
                    {loading ? <Loader2 className="animate-spin h-4 w-4 mx-auto" /> : "Verify email"}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await insforge.auth.resendVerificationEmail({ email: pendingEmail, redirectTo });
                    }}
                    className="w-full text-[10px] font-bold uppercase tracking-widest text-primary"
                  >
                    Resend code
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("auth")}
                    className="w-full text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60"
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
                      className="bg-error-container text-on-error-container p-4 text-[10px] font-bold uppercase tracking-widest border border-error/20 rounded-xl"
                    >
                      {error}
                    </motion.div>
                  )}
                  {successMessage && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-secondary-container text-on-secondary-container p-4 text-[10px] font-bold uppercase tracking-widest border border-outline-variant rounded-xl"
                    >
                      {successMessage}
                    </motion.div>
                  )}
                  <p className="text-sm text-on-surface-variant/70">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>

                  <motion.div
                    className="group"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <label className="block text-[10px] font-bold mb-2 uppercase tracking-[0.2em] text-on-surface-variant/60">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/40 group-focus-within:text-primary transition-colors" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => setTouched({ ...touched, forgotEmail: true })}
                        autoComplete="email"
                        inputMode="email"
                        className="block w-full pl-12 pr-4 py-4 border border-white/10 text-sm transition-all outline-none rounded-2xl bg-white/5 text-on-surface placeholder:text-on-surface-variant/25 focus:border-primary/50 focus:bg-white/8 focus:ring-1 focus:ring-primary/30"
                        placeholder="name@domain.com"
                        aria-label="Email address for password reset"
                      />
                    </div>
                  </motion.div>

                  <motion.button
                    {...submitHandlers}
                    type="submit"
                    disabled={loading || !email || !!successMessage}
                    whileTap={isSubmitPressed && !successMessage ? { scale: 0.97 } : { scale: 1 }}
                    className="group relative w-full flex justify-center items-center gap-3 py-4 px-4 text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 disabled:opacity-50 rounded-2xl overflow-hidden shadow-xl active:scale-[0.97] text-white bg-gradient-to-r from-[#8083ff] to-[#6f00be] hover:brightness-110 shadow-primary/10 hover:shadow-primary/20 border border-white/10"
                  >
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
                      className="bg-error-container/20 text-error p-4 text-[10px] font-bold uppercase tracking-widest border border-error/30 rounded-xl"
                    >
                      {error}
                    </motion.div>
                  )}
                  {successMessage && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-primary/10 text-primary p-4 text-[10px] font-bold uppercase tracking-widest border border-primary/30 rounded-xl"
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
                      <label className="block text-[10px] font-bold mb-2 uppercase tracking-[0.2em] text-on-surface-variant/60">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors text-on-surface-variant/60 group-focus-within:text-primary" />
                        <input
                          type={showNewPassword ? "text" : "password"}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          onBlur={() => setTouched({ ...touched, newPassword: true })}
                          autoComplete="new-password"
                          className="block w-full pl-12 pr-12 py-4 border border-white/10 text-sm transition-all outline-none rounded-2xl bg-white/5 text-on-surface placeholder:text-on-surface-variant/25 focus:border-primary/50 focus:bg-white/8 focus:ring-1 focus:ring-primary/30"
                          placeholder="New password"
                          aria-label="New password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors text-on-surface-variant/60 hover:text-on-surface"
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
                          <div className="h-1.5 w-full rounded-full overflow-hidden bg-surface-container-high">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: newPasswordStrength === "weak" ? "25%" : newPasswordStrength === "fair" ? "50%" : newPasswordStrength === "good" ? "75%" : "100%",
                              }}
                              className={`h-full rounded-full transition-all ${
                                newPasswordStrength === "weak" ? "bg-error" :
                                newPasswordStrength === "fair" ? "bg-tertiary" :
                                newPasswordStrength === "good" ? "bg-primary" :
                                "bg-primary"
                              }`}
                            />
                          </div>
                          <span className={`text-[9px] font-bold uppercase tracking-widest ${
                            newPasswordStrength === "weak" ? "text-error" :
                            newPasswordStrength === "fair" ? "text-tertiary" :
                            newPasswordStrength === "good" ? "text-primary" :
                            "text-primary"
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
                      <label className="block text-[10px] font-bold mb-2 uppercase tracking-[0.2em] text-on-surface-variant/60">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors text-on-surface-variant/60 group-focus-within:text-primary" />
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          onBlur={() => setTouched({ ...touched, confirmPassword: true })}
                          autoComplete="new-password"
                          className="block w-full pl-12 pr-4 py-4 border border-white/10 text-sm transition-all outline-none rounded-2xl bg-white/5 text-on-surface placeholder:text-on-surface-variant/25 focus:border-primary/50 focus:bg-white/8 focus:ring-1 focus:ring-primary/30"
                          placeholder="Confirm password"
                          aria-label="Confirm password"
                        />
                      </div>
                      {touched.confirmPassword && confirmPassword && newPassword && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`text-[10px] font-bold uppercase tracking-widest mt-2 flex items-center gap-1 ${
                            newPassword === confirmPassword ? 'text-primary' : 'text-error'
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
                    whileTap={isSubmitPressed ? { scale: 0.97 } : { scale: 1 }}
                    className="group relative w-full flex justify-center items-center gap-3 py-4 px-4 text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 disabled:opacity-50 rounded-2xl overflow-hidden shadow-xl active:scale-[0.97] text-white bg-gradient-to-r from-[#8083ff] to-[#6f00be] hover:brightness-110 shadow-primary/10 hover:shadow-primary/20 border border-white/10"
                  >
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
                    className="w-full text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 py-2 text-on-surface-variant/60 hover:text-on-surface"
                  >
                    ← Back to Login
                  </button>
                </form>
              ) : (
                <form className="space-y-5" onSubmit={handleSubmit}>

                {/* Google OAuth — PROMINENT at top */}
                <GoogleSignInButton
                  onClick={handleGoogleAuth}
                  isLoading={googleLoading}
                />

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-on-surface-variant/30">Or Identity</span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-error-container/20 text-error p-4 text-[10px] font-bold uppercase tracking-widest border border-error/30 rounded-xl"
                  >
                    <div>{error}</div>
                    <button
                      type="button"
                      onClick={recoverSession}
                      className="mt-3 text-[9px] underline tracking-widest text-on-surface-variant hover:text-on-surface"
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
                      <label className="block text-[10px] font-bold mb-2 uppercase tracking-[0.2em] text-on-surface-variant/60">Full Name</label>
                      <div className="relative">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors text-on-surface-variant/60 group-focus-within:text-primary" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          onBlur={() => setTouched({ ...touched, name: true })}
                          autoComplete="name"
                          autoCapitalize="words"
                          enterKeyHint="next"
                          className="block w-full pl-12 pr-4 py-4 border border-white/10 text-sm transition-all outline-none rounded-2xl bg-white/5 text-on-surface placeholder:text-on-surface-variant/25 focus:border-primary/50 focus:bg-white/8 focus:ring-1 focus:ring-primary/30"
                          placeholder="Full name"
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
                    <label className="block text-[10px] font-bold mb-2 uppercase tracking-[0.2em] text-on-surface-variant/60">
                      {mode === "login" ? "Identity (Email or Username)" : "Identity (Email)"}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors text-on-surface-variant/40 group-focus-within:text-primary" />
                      <input
                        type={mode === "login" ? "text" : "email"}
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => setTouched({ ...touched, email: true })}
                        autoComplete={mode === "login" ? "username" : "email"}
                        inputMode={mode === "login" ? "text" : "email"}
                        enterKeyHint="next"
                        className="block w-full pl-12 pr-4 py-4 border border-white/10 text-sm transition-all outline-none rounded-2xl bg-white/5 text-on-surface placeholder:text-on-surface-variant/25 focus:border-primary/50 focus:bg-white/8 focus:ring-1 focus:ring-primary/30"
                        placeholder={mode === "login" ? "Email or username" : "name@domain.com"}
                        aria-label={mode === "login" ? "Email or username" : "Email address"}
                      />
                    </div>
                    {mode === "register" && touched.email && email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-[10px] font-bold uppercase tracking-widest mt-2 flex items-center gap-1 text-primary"
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
                    <label className="block text-[10px] font-bold mb-2 uppercase tracking-[0.2em] text-on-surface-variant/60">Access Key (Password)</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors text-on-surface-variant/60 group-focus-within:text-primary" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() => setTouched({ ...touched, password: true })}
                        autoComplete={mode === "login" ? "current-password" : "new-password"}
                        enterKeyHint="done"
                        className="block w-full pl-12 pr-12 py-4 border border-white/10 text-sm transition-all outline-none rounded-2xl bg-white/5 text-on-surface placeholder:text-on-surface-variant/25 focus:border-primary/50 focus:bg-white/8 focus:ring-1 focus:ring-primary/30"
                        placeholder="••••••••"
                        aria-label="Password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors text-on-surface-variant/60 hover:text-on-surface"
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
                        <div className="h-1.5 w-full rounded-full overflow-hidden bg-surface-container-high">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: passwordStrength === "weak" ? "25%" : passwordStrength === "fair" ? "50%" : passwordStrength === "good" ? "75%" : "100%",
                            }}
                            className={`h-full rounded-full transition-all ${
                              passwordStrength === "weak" ? "bg-error" :
                              passwordStrength === "fair" ? "bg-tertiary" :
                              passwordStrength === "good" ? "bg-primary" :
                              "bg-primary"
                            }`}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-bold uppercase tracking-widest ${
                            passwordStrength === "weak" ? "text-error" :
                            passwordStrength === "fair" ? "text-tertiary" :
                            passwordStrength === "good" ? "text-primary" :
                            "text-primary"
                          }`}>
                            Strength: {passwordStrength?.toUpperCase()}
                          </span>
                          <div className="flex gap-1">
                            {[0, 1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className={`h-1 w-1 rounded-full transition-all ${
                                  i < (passwordStrength === "weak" ? 1 : passwordStrength === "fair" ? 2 : passwordStrength === "good" ? 3 : 4)
                                    ? "bg-primary"
                                    : "bg-surface-container-high"
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
                          className="text-[10px] font-bold uppercase tracking-widest transition-colors text-on-surface-variant/60 hover:text-primary"
                        >
                          Forgot Password?
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                </div>

                <div className="space-y-4 pt-1">
                  <motion.button
                    {...submitHandlers}
                    type="submit"
                    disabled={loading}
                    whileTap={isSubmitPressed ? { scale: 0.97 } : { scale: 1 }}
                    className="group relative w-full flex justify-center items-center gap-3 py-4 px-4 text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 disabled:opacity-50 rounded-2xl overflow-hidden shadow-xl active:scale-[0.97] text-white bg-gradient-to-r from-[#8083ff] to-[#6f00be] hover:brightness-110 shadow-primary/10 hover:shadow-primary/20 border border-white/10"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin h-4 w-4" />
                    ) : (
                      <span className="flex items-center gap-3">
                        {mode === "login" ? "Access Studio" : "Create Identity"}
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </motion.button>
                </div>
              </form>
              )}

              <div className="text-center pt-4 border-t border-white/[0.06]">
                <p className="text-[11px] text-on-surface-variant/50">
                  {mode === "login" ? "New to the Lab?" : "Already Registered?"}{" "}
                  <button 
                    onClick={() => {
                      setMode(mode === "login" ? "register" : "login");
                      navigate(mode === "login" ? "/register" : "/login", { replace: true });
                    }} 
                    className="text-primary font-semibold hover:text-white transition-colors ml-1"
                  >
                    {mode === "login" ? "Create Identity" : "Access Studio"}
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

