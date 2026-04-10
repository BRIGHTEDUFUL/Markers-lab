import React, { useState, useEffect } from "react";
import { Shield, Loader2, Check, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "../contexts/ThemeContext";
import { enableTwoFactorAuth, disableTwoFactorAuth, getUserSettings, generateAndSendOTP } from "../lib/oauth-2fa-api";
import TwoFactorModal from "./TwoFactorModal";
import { verifyOTPCode } from "../lib/oauth-2fa-api";
import { logAuditEvent } from "../lib/makers-data";

interface TwoFactorSettingsProps {
  userId: string;
  email: string;
}

/**
 * Two-Factor Authentication Settings Component
 * Allows users to enable/disable 2FA with OTP verification
 */
const TwoFactorSettings: React.FC<TwoFactorSettingsProps> = ({ userId, email }) => {
  const { theme } = useTheme();
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<"enable" | "disable" | null>(null);

  // Load current 2FA status on mount
  useEffect(() => {
    const load2FAStatus = async () => {
      setLoading(true);
      setError("");
      try {
        const result = await getUserSettings(userId);
        if (result.success && result.data) {
          setIs2FAEnabled(result.data.two_factor_enabled || false);
        } else {
          setError(result.error || "Failed to load 2FA settings");
        }
      } catch (err: any) {
        setError(err?.message || "Error loading settings");
      } finally {
        setLoading(false);
      }
    };
    load2FAStatus();
  }, [userId]);

  // Handle enabling 2FA with OTP verification
  const handleEnable2FA = async () => {
    setToggling(true);
    setError("");
    try {
      // Generate and send OTP first
      const otpResult = await generateAndSendOTP(userId, email);
      if (!otpResult.success) {
        setError(otpResult.error || "Failed to generate OTP");
        setToggling(false);
        return;
      }

      // Show OTP modal for verification
      setPendingAction("enable");
      setShowConfirmationModal(true);
    } catch (err: any) {
      setError(err?.message || "Error enabling 2FA");
      setToggling(false);
    }
  };

  // Handle OTP verification for enabling 2FA
  const handleConfirmEnable2FA = async (otpCode: string) => {
    setToggling(true);
    setError("");
    try {
      // Verify OTP
      const otpResult = await verifyOTPCode(userId, otpCode);
      if (!otpResult.success) {
        setError(otpResult.error || "Invalid OTP");
        return;
      }

      // OTP verified, now enable 2FA in database
      const enableResult = await enableTwoFactorAuth(userId);
      if (!enableResult.success) {
        setError(enableResult.error || "Failed to enable 2FA");
        return;
      }

      // Log audit event
      await logAuditEvent("2fa_enabled", "settings", userId, {
        userId,
      });

      setIs2FAEnabled(true);
      setSuccessMessage("Two-factor authentication enabled successfully!");
      setShowConfirmationModal(false);
      setPendingAction(null);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      setError(err?.message || "Error verifying OTP");
    } finally {
      setToggling(false);
    }
  };

  // Handle disabling 2FA
  const handleDisable2FA = async () => {
    setToggling(true);
    setError("");
    setSuccessMessage("");
    try {
      const result = await disableTwoFactorAuth(userId);
      if (!result.success) {
        setError(result.error || "Failed to disable 2FA");
        setToggling(false);
        return;
      }

      // Log audit event
      await logAuditEvent("2fa_disabled", "settings", userId, {
        userId,
      });

      setIs2FAEnabled(false);
      setSuccessMessage("Two-factor authentication disabled.");
      setPendingAction(null);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      setError(err?.message || "Error disabling 2FA");
    } finally {
      setToggling(false);
    }
  };

  // Handle modal cancel
  const handleModalCancel = () => {
    setShowConfirmationModal(false);
    setPendingAction(null);
    setError("");
  };

  // Handle modal resend
  const handleModalResend = async () => {
    setToggling(true);
    try {
      const result = await generateAndSendOTP(userId, email);
      if (!result.success) {
        setError(result.error || "Failed to resend OTP");
      }
    } catch (err: any) {
      setError(err?.message || "Error resending OTP");
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-6 rounded-lg border ${
        theme === "light"
          ? "bg-slate-50 border-slate-200"
          : "bg-white/5 border-white/10"
      }`}>
        <Loader2 className="animate-spin h-5 w-5 mr-2" />
        <span className={theme === "light" ? "text-slate-600" : "text-white/60"}>
          Loading 2FA settings...
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-lg border transition-all duration-300 ${
        theme === "light"
          ? is2FAEnabled
            ? "bg-green-50 border-green-200"
            : "bg-slate-50 border-slate-200"
          : is2FAEnabled
            ? "bg-green-500/5 border-green-500/20"
            : "bg-white/5 border-white/10"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${
            is2FAEnabled
              ? theme === "light"
                ? "bg-green-100"
                : "bg-green-500/10"
              : theme === "light"
                ? "bg-slate-100"
                : "bg-white/10"
          }`}>
            <Shield className={`h-5 w-5 ${
              is2FAEnabled
                ? "text-green-600"
                : theme === "light"
                  ? "text-slate-600"
                  : "text-white/40"
            }`} />
          </div>
          <div>
            <h3 className={`font-bold text-sm uppercase tracking-widest ${
              theme === "light" ? "text-slate-900" : "text-white"
            }`}>
              Two-Factor Authentication
            </h3>
            <p className={`text-xs mt-1 ${
              theme === "light" ? "text-slate-500" : "text-white/50"
            }`}>
              Add an extra layer of security to your account
            </p>
          </div>
        </div>
        
        {/* Status Badge */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1 ${
            is2FAEnabled
              ? theme === "light"
                ? "bg-green-100 text-green-700"
                : "bg-green-500/20 text-green-400"
              : theme === "light"
                ? "bg-slate-100 text-slate-600"
                : "bg-white/10 text-white/50"
          }`}
        >
          {is2FAEnabled ? (
            <>
              <Check className="h-3 w-3" />
              Enabled
            </>
          ) : (
            <>
              <AlertCircle className="h-3 w-3" />
              Disabled
            </>
          )}
        </motion.div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className={`mb-4 p-3 rounded text-xs font-bold uppercase tracking-widest border ${
              theme === "light"
                ? "bg-red-50 text-red-600 border-red-200"
                : "bg-red-500/10 text-red-400 border-red-500/20"
            }`}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className={`mb-4 p-3 rounded text-xs font-bold uppercase tracking-widest border flex items-center gap-2 ${
              theme === "light"
                ? "bg-green-50 text-green-600 border-green-200"
                : "bg-green-500/10 text-green-400 border-green-500/20"
            }`}
          >
            <Check className="h-4 w-4" />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Description */}
      <p className={`text-xs mb-6 leading-relaxed ${
        theme === "light" ? "text-slate-600" : "text-white/60"
      }`}>
        {is2FAEnabled
          ? "Your account is protected with two-factor authentication. You'll need to enter a code sent to your email when logging in."
          : "Enable two-factor authentication to protect your account with an additional security code sent to your email."}
      </p>

      {/* Toggle Button */}
      <motion.button
        onClick={is2FAEnabled ? handleDisable2FA : handleEnable2FA}
        disabled={toggling}
        whileTap={{ scale: 0.98 }}
        className={`w-full py-4 px-4 text-[10px] font-bold uppercase tracking-[0.3em] rounded-lg transition-all duration-300 disabled:opacity-50 ${
          is2FAEnabled
            ? theme === "light"
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-red-600 text-white hover:bg-red-700"
            : theme === "light"
              ? "bg-indigo-600 text-white hover:bg-indigo-700"
              : "bg-indigo-500 text-white hover:bg-indigo-600"
        }`}
      >
        {toggling ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </span>
        ) : is2FAEnabled ? (
          "Disable 2FA"
        ) : (
          "Enable 2FA"
        )}
      </motion.button>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={`mt-6 p-4 rounded border text-xs ${
          theme === "light"
            ? "bg-blue-50 border-blue-100 text-blue-700"
            : "bg-blue-500/5 border-blue-500/20 text-blue-400"
        }`}
      >
        <p className="font-bold mb-2">💡 How it works:</p>
        <ul className="space-y-1 ml-4 list-disc">
          <li>When enabled, you'll receive a 6-digit code when logging in</li>
          <li>Enter the code within 15 minutes to complete login</li>
          <li>You can resend the code if you don't receive it</li>
          <li>Codes are unique each time and expire after one use</li>
        </ul>
      </motion.div>

      {/* 2FA Modal for OTP verification when enabling */}
      <AnimatePresence>
        {showConfirmationModal && pendingAction === "enable" && (
          <TwoFactorModal
            email={email}
            onVerify={handleConfirmEnable2FA}
            onCancel={handleModalCancel}
            onResend={handleModalResend}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TwoFactorSettings;
