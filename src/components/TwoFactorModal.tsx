import { useState } from 'react';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface TwoFactorModalProps {
  email: string;
  onVerify: (code: string) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
  onResend?: () => Promise<{ success: boolean; error?: string }>;
}

/**
 * Two-Factor Authentication Modal
 * Shows OTP entry screen after email/password login
 * User has 3 attempts to enter correct 6-digit code
 * Code expires after 15 minutes
 */
export function TwoFactorModal({
  email,
  onVerify,
  onCancel,
  onResend,
}: TwoFactorModalProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [isLocked, setIsLocked] = useState(false);
  const [showResend, setShowResend] = useState(false);

  // Handle OTP code input (6 digits only)
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    setError(null);
  };

  // Submit OTP code
  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await onVerify(code);

      if (result.success) {
        setSuccess(true);
        // Auto-redirect after success
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        setError(result.error || 'Invalid code');
        if (result.remainingAttempts !== undefined) {
          setRemainingAttempts(result.remainingAttempts);
          if (result.remainingAttempts === 0) {
            setIsLocked(true);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle resend OTP
  const handleResend = async () => {
    if (!onResend) return;

    setLoading(true);
    try {
      const result = await onResend();
      if (result.success) {
        setShowResend(false);
        setCode('');
        setError(null);
        setRemainingAttempts(3);
        // Show confirmation briefly
        setTimeout(() => setShowResend(false), 2000);
      } else {
        setError(result.error || 'Failed to resend code');
      }
    } catch (err: any) {
      setError(err.message || 'Resend failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && code.length === 6) {
      handleVerify();
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-slate-900 rounded-lg p-8 max-w-md w-full mx-4 border border-green-500/30">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-center text-white mb-2">
            Verified!
          </h2>
          <p className="text-center text-slate-300 mb-4">
            Redirecting to dashboard...
          </p>
          <div className="flex justify-center">
            <Loader className="w-5 h-5 text-green-500 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg p-8 max-w-md w-full mx-4 border border-slate-700">
        {/* Header */}
        <h2 className="text-2xl font-bold text-white mb-2">
          Two-Factor Authentication
        </h2>
        <p className="text-slate-300 mb-6">
          We sent a 6-digit code to <span className="font-medium">{email}</span>
        </p>

        {/* OTP Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-200 mb-2">
            Enter code
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={handleCodeChange}
            onKeyPress={handleKeyPress}
            placeholder="000000"
            disabled={isLocked || loading}
            className="w-full px-4 py-3 text-center text-2xl tracking-widest font-mono bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-200 text-sm font-medium">{error}</p>
              {remainingAttempts > 0 && !isLocked && (
                <p className="text-red-300 text-xs mt-1">
                  {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
                </p>
              )}
            </div>
          </div>
        )}

        {/* Locked Message */}
        {isLocked && (
          <div className="mb-4 p-3 bg-orange-900/30 border border-orange-700 rounded-lg">
            <p className="text-orange-200 text-sm">
              Too many attempts. Please try again in 15 minutes or request a new code.
            </p>
          </div>
        )}

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={code.length !== 6 || loading || isLocked}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:bg-blue-600/50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <Loader className="w-4 h-4 animate-spin" />}
          {isLocked ? 'Account Locked' : loading ? 'Verifying...' : 'Verify Code'}
        </button>

        {/* Resend Code Link */}
        <div className="mt-4 text-center">
          <p className="text-slate-400 text-sm mb-2">Didn't receive a code?</p>
          {onResend ? (
            <button
              onClick={handleResend}
              disabled={loading || showResend}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {showResend ? 'Code sent!' : 'Resend code'}
            </button>
          ) : (
            <p className="text-slate-500 text-sm">
              Contact support if you need help
            </p>
          )}
        </div>

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          disabled={loading}
          className="w-full mt-3 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>

        {/* Help Text */}
        <p className="text-center text-slate-500 text-xs mt-4">
          Code expires in 15 minutes
        </p>
      </div>
    </div>
  );
}

export default TwoFactorModal;
