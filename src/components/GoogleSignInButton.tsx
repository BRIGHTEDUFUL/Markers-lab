import { useState } from 'react';

interface GoogleSignInButtonProps {
  /** Called when the user clicks the button. The parent handles the actual OAuth flow. */
  onClick: () => void;
  isLoading?: boolean;
}

/**
 * Google Sign-In Button Component
 *
 * Triggers the InsForge PKCE OAuth flow via `insforge.auth.signInWithOAuth()`.
 * The parent component owns the actual OAuth logic — this button just renders
 * the UI and calls `onClick` when tapped.
 */
export function GoogleSignInButton({
  onClick,
  isLoading = false,
}: GoogleSignInButtonProps) {
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    try {
      setError(null);
      onClick();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start Google sign-in';
      setError(errorMessage);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 py-3.5 px-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-on-surface hover:text-white font-label-sm text-[12px] tracking-wide transition-all duration-300 disabled:opacity-50 active:scale-[0.97] group"
      >
        {/* Official multi-color Google logo */}
        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span>{isLoading ? 'Signing in…' : 'Sign in with Google'}</span>
      </button>

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-3 bg-error-container/30 border border-error/30 rounded-xl text-error text-[11px] tracking-wide">
          {error}
        </div>
      )}
    </div>
  );
}

export default GoogleSignInButton;
