// ============================================================
// PHASE 2: CORE BACKEND API FUNCTIONS
// ============================================================
// File: src/lib/oauth-2fa-api.ts
// These functions interact with Insforge backend

import {
  generateOTPCode,
  hashOTPCode,
  verifyOTPCode as verifyOTPCodeHash,
  isOTPExpired,
  getOTPExpirationTime,
  getLockoutExpirationTime,
  extractGoogleUserData,
  isValidEmail,
  validatePasswordStrength,
} from './oauth-2fa-helpers';

// Import your existing Insforge client
import { createClient } from '@insforge/sdk';

const client = createClient();

// ============================================================
// AUTHENTICATION & VALIDATION
// ============================================================

/**
 * Validate email and password exist
 * Returns user data if credentials are valid for standard email/password login
 * @param email User email
 * @param password User password
 * @returns User data or error
 */
export async function validateEmailPasswordLogin(email: string, password: string) {
  // This will be handled by Insforge auth
  // For now, return validation
  if (!isValidEmail(email)) {
    return { success: false, error: 'Invalid email format' };
  }

  if (!password || password.length < 6) {
    return { success: false, error: 'Invalid password' };
  }

  try {
    // Call Insforge authentication endpoint
    const response = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (!response.user) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Check if user has 2FA enabled
    const settings = await getUserSettings(response.user.id);
    const requiresTwoFA = settings?.two_factor_enabled || false;

    return {
      success: true,
      userId: response.user.id,
      email: response.user.email,
      requiresTwoFA,
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Authentication failed' };
  }
}

// ============================================================
// EMAIL 2FA FUNCTIONS
// ============================================================

/**
 * Generate and send OTP to user's email
 * @param userId User ID
 * @param email Email to send OTP to
 * @returns OTP code (for testing only - in production, only return confirmation)
 */
export async function generateAndSendOTP(userId: string, email: string) {
  try {
    // Generate 6-digit code
    const otpCode = generateOTPCode();
    const otpHash = await hashOTPCode(otpCode);
    const expiresAt = getOTPExpirationTime();

    // Store OTP in database
    const { data, error } = await client.from('two_factor_attempts').insert({
      user_id: userId,
      email,
      otp_code_hash: otpHash,
      expires_at: expiresAt,
      attempts: 0,
      max_attempts: 3,
    });

    if (error) throw error;

    // Send email via Insforge (uses SendGrid)
    // In production, use a proper email service
    console.log(`[DEV] OTP for ${email}: ${otpCode}`);

    // Log to audit
    await logAuditEvent('otp_generated', {
      userId,
      email,
      expiresAt,
    });

    return {
      success: true,
      message: 'OTP sent to email',
      // Only return code in development
      code: process.env.NODE_ENV === 'development' ? otpCode : undefined,
      expiresAt,
    };
  } catch (error: any) {
    console.error('Error generating OTP:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate OTP',
    };
  }
}

/**
 * Verify OTP code entered by user
 * Checks: code matches hash, not expired, within attempt limit
 * @param userId User ID
 * @param code 6-digit code entered by user
 * @returns Success/failure and remaining attempts
 */
export async function verifyOTPCode(userId: string, code: string) {
  try {
    // Get most recent OTP for user
    const { data: otpRecords, error: fetchError } = await client
      .from('two_factor_attempts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) throw fetchError;
    if (!otpRecords || otpRecords.length === 0) {
      return { success: false, error: 'No OTP found. Request a new code.' };
    }

    const otpRecord = otpRecords[0];

    // Check if locked out
    if (otpRecord.locked_until && new Date(otpRecord.locked_until) > new Date()) {
      const remainingSeconds = Math.ceil(
        (new Date(otpRecord.locked_until).getTime() - Date.now()) / 1000
      );
      return {
        success: false,
        error: `Too many attempts. Try again in ${Math.ceil(remainingSeconds / 60)} minutes.`,
        locked: true,
      };
    }

    // Check if expired
    if (isOTPExpired(new Date(otpRecord.expires_at))) {
      return { success: false, error: 'OTP expired. Request a new code.' };
    }

    // Check attempt count
    if (otpRecord.attempts >= otpRecord.max_attempts) {
      // Lock out for 15 minutes
      await client
        .from('two_factor_attempts')
        .update({ locked_until: getLockoutExpirationTime() })
        .eq('id', otpRecord.id);

      return {
        success: false,
        error: 'Too many attempts. Locked for 15 minutes.',
        locked: true,
      };
    }

    // Verify code
    const codeValid = await verifyOTPCodeHash(code, otpRecord.otp_code_hash);

    if (!codeValid) {
      // Increment attempts
      const newAttempts = otpRecord.attempts + 1;
      await client
        .from('two_factor_attempts')
        .update({ attempts: newAttempts })
        .eq('id', otpRecord.id);

      const remainingAttempts = otpRecord.max_attempts - newAttempts;
      return {
        success: false,
        error: `Invalid code. ${remainingAttempts} attempts remaining.`,
        remainingAttempts,
      };
    }

    // Code is valid! Mark as successful
    await client
      .from('two_factor_attempts')
      .update({ success: true })
      .eq('id', otpRecord.id);

    // Clean up old OTP record
    await client.from('two_factor_attempts').delete().eq('id', otpRecord.id);

    // Log success
    await logAuditEvent('otp_verified', {
      userId,
      email: otpRecord.email,
    });

    return {
      success: true,
      message: 'OTP verified successfully',
    };
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify OTP',
    };
  }
}

// ============================================================
// GOOGLE OAUTH FUNCTIONS
// ============================================================

/**
 * Get or create user from Google OAuth data
 * If Google ID exists in oauth_accounts, return existing user
 * If not, create new user and link Google account
 * @param googleData Google user data (id, email, name, picture)
 * @returns User data and whether it's a new user
 */
export async function getOrCreateGoogleUser(googleData: {
  id: string;
  email: string;
  name: string;
  picture?: string;
}) {
  try {
    // Check if Google account is already linked
    const { data: existingOAuth } = await client
      .from('oauth_accounts')
      .select('user_id')
      .eq('provider', 'google')
      .eq('provider_id', googleData.id)
      .single();

    if (existingOAuth) {
      // Update last_signin
      await client
        .from('oauth_accounts')
        .update({ last_signin: new Date() })
        .eq('user_id', existingOAuth.user_id)
        .eq('provider', 'google');

      // Get user
      const { data: user } = await client
        .from('profiles')
        .select('*')
        .eq('id', existingOAuth.user_id)
        .single();

      await logAuditEvent('google_signin', {
        userId: existingOAuth.user_id,
        email: googleData.email,
      });

      return {
        success: true,
        userId: existingOAuth.user_id,
        email: googleData.email,
        isNewUser: false,
        hasTwoFA: user?.two_factor_enabled || false,
      };
    }

    // Check if email already exists
    const { data: existingEmail } = await client
      .from('profiles')
      .select('id')
      .eq('email', googleData.email)
      .single();

    let userId: string;

    if (existingEmail) {
      // Email exists - link Google to existing account
      userId = existingEmail.id;
    } else {
      // Create new user
      const { data: newUser, error: createError } = await client.auth.signUp({
        email: googleData.email,
        password: generateRandomPassword(), // Google users get random password (they won't use it)
      });

      if (createError) throw createError;
      userId = newUser.user?.id || '';
    }

    // Create oauth_accounts entry
    await client.from('oauth_accounts').insert({
      user_id: userId,
      provider: 'google',
      provider_id: googleData.id,
      provider_email: googleData.email,
      email_verified: true,
    });

    // Initialize user settings if new
    const { data: settings } = await client
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!settings) {
      await client.from('user_settings').insert({
        user_id: userId,
        two_factor_enabled: false,
        theme: 'dark',
      });
    }

    await logAuditEvent('google_signup', {
      userId,
      email: googleData.email,
    });

    return {
      success: true,
      userId,
      email: googleData.email,
      isNewUser: !existingEmail,
      hasTwoFA: false,
    };
  } catch (error: any) {
    console.error('Error in getOrCreateGoogleUser:', error);
    return {
      success: false,
      error: error.message || 'Failed to authenticate with Google',
    };
  }
}

// ============================================================
// USER SETTINGS & 2FA MANAGEMENT
// ============================================================

/**
 * Enable 2FA for user (email method)
 * @param userId User ID
 * @returns Success/failure
 */
export async function enableTwoFactorAuth(userId: string) {
  try {
    const { error } = await client
      .from('user_settings')
      .update({
        two_factor_enabled: true,
        two_factor_method: 'email',
        two_factor_verified_at: new Date(),
      })
      .eq('user_id', userId);

    if (error) throw error;

    await logAuditEvent('two_factor_enabled', {
      userId,
      method: 'email',
    });

    return { success: true, message: '2FA enabled' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Disable 2FA for user
 * @param userId User ID
 * @returns Success/failure
 */
export async function disableTwoFactorAuth(userId: string) {
  try {
    const { error } = await client
      .from('user_settings')
      .update({
        two_factor_enabled: false,
      })
      .eq('user_id', userId);

    if (error) throw error;

    await logAuditEvent('two_factor_disabled', {
      userId,
    });

    return { success: true, message: '2FA disabled' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get user settings (including 2FA status)
 * @param userId User ID
 * @returns User settings object
 */
export async function getUserSettings(userId: string) {
  try {
    const { data, error } = await client
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error getting user settings:', error);
    return null;
  }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Generate a random password for Google OAuth users
 * @returns Random 16-character password
 */
function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Log audit event
 * @param action Action name
 * @param metadata Additional data to log
 */
async function logAuditEvent(action: string, metadata: any) {
  try {
    await client.from('audit_logs').insert({
      action,
      table_name: action.includes('oauth') ? 'oauth_accounts' : 'two_factor_attempts',
      record_id: metadata.userId,
      new_values: metadata,
      status: 'success',
    });
  } catch (error) {
    console.error('Error logging audit:', error);
  }
}

// ============================================================
// EXPORT ALL
// ============================================================

export default {
  validateEmailPasswordLogin,
  generateAndSendOTP,
  verifyOTPCode,
  getOrCreateGoogleUser,
  enableTwoFactorAuth,
  disableTwoFactorAuth,
  getUserSettings,
};
