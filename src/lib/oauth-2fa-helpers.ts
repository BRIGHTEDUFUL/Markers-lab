// ============================================================
// PHASE 2: EMAIL 2FA & GOOGLE OAUTH HELPER FUNCTIONS
// ============================================================
// File: src/lib/oauth-2fa-helpers.ts
// These functions handle OTP generation, verification, and Google OAuth

// ============================================================
// EMAIL 2FA FUNCTIONS
// ============================================================

/**
 * Generate a random 6-digit OTP code
 * @returns 6-digit string (e.g., "123456")
 */
export function generateOTPCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash an OTP code for secure storage (uses browser's SubtleCrypto)
 * @param code The 6-digit code
 * @returns Hashed code in hex format
 */
export async function hashOTPCode(code: string): Promise<string> {
  const salt = import.meta.env.VITE_OTP_SALT || 'default-salt';
  const data = new TextEncoder().encode(code + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify an OTP code against its hash (constant-time comparison)
 * @param code The user-entered code
 * @param hash The stored hash
 * @returns true if code matches
 */
export async function verifyOTPCode(code: string, hash: string): Promise<boolean> {
  const codeHash = await hashOTPCode(code);
  // Constant-time comparison using built-in timing-safe comparison
  if (codeHash.length !== hash.length) return false;
  let result = 0;
  for (let i = 0; i < hash.length; i++) {
    result |= codeHash.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Check if OTP has expired (15 minutes)
 * @param expiresAt The expiration timestamp
 * @returns true if expired
 */
export function isOTPExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * Generate OTP expiration time (15 minutes from now)
 * @returns Date object 15 minutes in the future
 */
export function getOTPExpirationTime(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 15);
  return expiry;
}

/**
 * Generate lockout time (15 minutes from now, after failed attempts)
 * @returns Date object 15 minutes in the future
 */
export function getLockoutExpirationTime(): Date {
  const lockout = new Date();
  lockout.setMinutes(lockout.getMinutes() + 15);
  return lockout;
}

// ============================================================
// GOOGLE OAUTH FUNCTIONS
// ============================================================

/**
 * Verify Google ID token (should be done on backend)
 * In production, verify the token signature against Google's public keys
 * @param token The ID token from Google
 * @returns Decoded token data
 */
export async function verifyGoogleToken(token: string) {
  // In production, import and use google-auth-library
  // import { OAuth2Client } from 'google-auth-library';
  // const client = new OAuth2Client(GOOGLE_CLIENT_ID);
  // const ticket = await client.verifyIdToken({ idToken: token, audience: GOOGLE_CLIENT_ID });
  // return ticket.getPayload();

  // For now, decode without verification (frontend only)
  // Production: Always verify on backend
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token format');

  const decoded = JSON.parse(
    Buffer.from(parts[1], 'base64').toString('utf-8')
  );

  return decoded;
}

/**
 * Extract user data from Google token payload
 * @param payload The decoded Google token
 * @returns User data
 */
export function extractGoogleUserData(payload: any) {
  return {
    id: payload.sub, // Google's unique user ID
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    emailVerified: payload.email_verified,
  };
}

/**
 * Generate CSRF state token for OAuth flow
 * Prevents CSRF attacks in OAuth redirect flow
 * @returns Random state string
 */
export function generateOAuthState(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Verify CSRF state token
 * @param state The returned state from OAuth provider
 * @param storedState The state we stored before redirect
 * @returns true if states match
 */
export function verifyOAuthState(state: string, storedState: string): boolean {
  return crypto.timingSafeEqual(Buffer.from(state), Buffer.from(storedState));
}

/**
 * Build Google OAuth authorization URL
 * @param googleClientId Your Google Client ID
 * @param redirectUri Your callback URL
 * @param state CSRF protection state
 * @returns Google auth URL to redirect user to
 */
export function buildGoogleAuthUrl(
  googleClientId: string,
  redirectUri: string,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: googleClientId,
    redirect_uri: redirectUri,
    response_type: 'id_token',
    scope: 'openid email profile',
    state,
    nonce: crypto.randomBytes(16).toString('hex'), // Additional CSRF protection
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// ============================================================
// USER SESSION/AUTHENTICATION FUNCTIONS
// ============================================================

/**
 * Create a session token (JWT-like)
 * In production, use a proper JWT library like jsonwebtoken
 * @param userId The user ID
 * @param expiresIn Expiration time in seconds (default: 30 days)
 * @returns Token object with token string and expiry
 */
export function createSessionToken(userId: string, expiresIn: number = 30 * 24 * 60 * 60): {
  token: string;
  expiresAt: Date;
} {
  const tokenData = {
    userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresIn,
  };

  // In production, sign with JWT
  const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');

  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

  return {
    token,
    expiresAt,
  };
}

// ============================================================
// VALIDATION FUNCTIONS
// ============================================================

/**
 * Validate email format
 * @param email Email address
 * @returns true if valid email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Requirements: At least 8 chars, 1 uppercase, 1 number, 1 special char
 * @param password Password to validate
 * @returns Object with isValid and messages
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check password strength for UX feedback (0-4 scale)
 * @param password Password to check
 * @returns Level 0-4 (very weak to very strong)
 */
export function getPasswordStrengthLevel(password: string): number {
  let strength = 0;

  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[!@#$%^&*]/.test(password)) strength++;

  return Math.min(strength, 4);
}

// ============================================================
// EXPORT ALL
// ============================================================

export default {
  // OTP
  generateOTPCode,
  hashOTPCode,
  verifyOTPCode,
  isOTPExpired,
  getOTPExpirationTime,
  getLockoutExpirationTime,

  // OAuth
  verifyGoogleToken,
  extractGoogleUserData,
  generateOAuthState,
  verifyOAuthState,
  buildGoogleAuthUrl,

  // Session
  createSessionToken,

  // Validation
  isValidEmail,
  validatePasswordStrength,
  getPasswordStrengthLevel,
};
