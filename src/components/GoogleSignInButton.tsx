import { useState } from 'react';
import { LogIn } from 'lucide-react';

interface GoogleSignInButtonProps {
  onSuccess: (googleData: any) => void;
  onError?: (error: string) => void;
  isLoading?: boolean;
}

/**
 * Google Sign-In Button Component
 * Integrates with Google OAuth 2.0
 * 
 * Prerequisites:
 * - Install: npm install @react-oauth/google
 * - Add GoogleOAuthProvider wrapper to App.tsx around Auth component
 * - Set VITE_GOOGLE_CLIENT_ID in environment
 */
export function GoogleSignInButton({
  onSuccess,
  onError,
  isLoading = false,
}: GoogleSignInButtonProps) {
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSuccess = (response: any) => {
    try {
      if (!response.credential) {
        throw new Error('No credential returned from Google');
      }

      // Decode JWT token from Google
      const token = response.credential;
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const decoded = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf-8')
      );

      const googleData = {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        emailVerified: decoded.email_verified,
      };

      setError(null);
      onSuccess(googleData);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to process Google sign-in';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const handleGoogleError = () => {
    const errorMessage = 'Failed to sign in with Google';
    setError(errorMessage);
    onError?.(errorMessage);
  };

  return (
    <div className="w-full">
      {/* Google Sign-In Script */}
      <script
        src="https://accounts.google.com/gsi/client"
        async
        defer
      ></script>

      {/* Google Sign-In Button Container */}
      <div
        id="g_id_onload"
        data-client_id={import.meta.env.VITE_GOOGLE_CLIENT_ID}
        data-callback="handleGoogleSuccess"
        data-nonce=""
        data-auto_prompt="false"
      ></div>

      <div
        id="g_id_signin"
        data-type="standard"
        data-size="large"
        data-theme="dark"
        data-text="signin_with"
        data-shape="rectangular"
        data-logo_alignment="left"
        className="w-full flex justify-center"
      ></div>

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-2 bg-red-900/30 border border-red-700 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Alternative: Custom Button */}
      <button
        onClick={() => {
          // This would integrate with your auth API
          console.log('Custom Google button clicked');
        }}
        disabled={isLoading}
        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        {isLoading ? 'Signing in...' : 'Sign in with Google'}
      </button>
    </div>
  );
}

export default GoogleSignInButton;
