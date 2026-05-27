/**
 * User profile and settings management.
 */
import { insforge } from "../insforge-client";

/**
 * Get user settings (theme, preferences, 2FA status)
 */
export async function fetchUserSettings(userId: string) {
  const { data, error } = await insforge.database
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  
  if (error) throw error;
  
  // Return default settings if not found
  if (!data) {
    return {
      userId,
      theme: "dark",
      emailNotifications: true,
      marketingEmails: true,
      privacyLevel: "private",
      bio: null,
    };
  }
  
  const row = data as Record<string, unknown>;
  return {
    userId: row.user_id,
    theme: row.theme || "dark",
    emailNotifications: row.email_notifications ?? true,
    marketingEmails: row.marketing_emails ?? true,
    privacyLevel: row.privacy_level || "private",
    bio: row.bio,
  };
}

/**
 * Update user settings
 */
export async function updateUserSettings(userId: string, patch: Record<string, unknown>) {
  const updates: Record<string, unknown> = {};
  
  if (patch.theme !== undefined) updates.theme = patch.theme;
  if (patch.emailNotifications !== undefined) updates.email_notifications = patch.emailNotifications;
  if (patch.marketingEmails !== undefined) updates.marketing_emails = patch.marketingEmails;
  if (patch.privacyLevel !== undefined) updates.privacy_level = patch.privacyLevel;
  if (patch.bio !== undefined) updates.bio = patch.bio;
  
  if (!Object.keys(updates).length) return; // Nothing to update
  
  updates.updated_at = new Date().toISOString();
  
  const { data, error } = await insforge.database
    .from("user_settings")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .maybeSingle();
  
  // If no existing settings, create them
  if (!data && !error) {
    const { error: insErr } = await insforge.database
      .from("user_settings")
      .insert([{ user_id: userId, ...updates }]);
    if (insErr) throw insErr;
  } else if (error) {
    throw error;
  }
}
