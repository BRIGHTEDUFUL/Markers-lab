/**
 * Authentication and security functions.
 * Login tracking, password reset, email verification, session management.
 */
import { insforge } from "../insforge-client";
import type { User } from "../../types";
import { getUserDisplayName, isEmailLike } from "../user-display";
import { type ProfileRow, profileToUser, profilesByIds } from "./mappers";

/** Map InsForge auth user payload to app User when profile row is missing or still syncing. */
export function userFromAuthUser(raw: unknown): User | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = o.id;
  if (typeof id !== "string") return null;
  const email = typeof o.email === "string" ? o.email : "";
  let name = getUserDisplayName({ name: "", email });
  if (typeof o.name === "string" && o.name.trim()) name = o.name;
  else if (o.user_metadata && typeof o.user_metadata === "object") {
    const m = o.user_metadata as Record<string, unknown>;
    if (typeof m.name === "string" && m.name.trim()) name = m.name;
    else if (typeof m.full_name === "string" && m.full_name.trim()) name = m.full_name;
  }
  return {
    id,
    email,
    name,
    role: "USER",
  };
}

export async function fetchSessionUser(): Promise<User | null> {
  const { data: session, error } = await insforge.auth.getCurrentUser();
  if (error || !session?.user) return null;
  const u = session.user;
  try {
    await ensureProfile(
      u.id,
      (u as { name?: string }).name || u.email || "Member",
      u.email || ""
    );
  } catch (e) {
    console.warn("[auth] ensureProfile failed (login may still work):", e);
  }
  const { data: prof, error: profErr } = await insforge.database
    .from("profiles")
    .select("*")
    .eq("id", u.id)
    .maybeSingle();
  if (profErr) console.warn("[auth] profiles select:", profErr.message);
  const pr = prof as ProfileRow | null;
  const base = userFromAuthUser(u);
  if (!base) return null;
  const resolvedName = getUserDisplayName({ name: pr?.display_name || base.name, email: base.email || pr?.email || "" });
  return {
    ...base,
    email: base.email || pr?.email || "",
    name: resolvedName,
    role: pr?.role === "ADMIN" ? "ADMIN" : "USER",
    avatarUrl: pr?.avatar_url || undefined,
    createdAt: pr?.created_at,
  };
}

/**
 * Validate identity + password for login.
 * Supports either email or username (profiles.display_name).
 */
export async function validateEmailPasswordLogin(identity: string, password: string) {
  const trimmedIdentity = identity.trim();
  if (!trimmedIdentity) {
    return { success: false, error: "Email or username is required" };
  }

  if (!password || password.length < 6) {
    return { success: false, error: "Invalid password" };
  }

  try {
    let resolvedEmail = trimmedIdentity;

    const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedIdentity);
    if (!looksLikeEmail) {
      const { data: resolvedEmailAddress, error: rpcError } = await insforge.database
        .rpc("resolve_username_to_email", { username_input: trimmedIdentity });

      if (rpcError || !resolvedEmailAddress) {
        return { success: false, error: "Invalid email/username or password" };
      }

      resolvedEmail = resolvedEmailAddress as string;
    }

    const { data, error } = await insforge.auth.signInWithPassword({
      email: resolvedEmail,
      password,
    });

    if (error || !data?.user) {
      return { success: false, error: error?.message || "Invalid credentials" };
    }

    return {
      success: true,
      userId: data.user.id,
      email: resolvedEmail,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Authentication failed";
    return { success: false, error: message };
  }
}

async function ensureProfile(userId: string, displayName: string, email: string) {
  const { data: existing, error: selErr } = await insforge.database
    .from("profiles")
    .select("id,display_name,email")
    .eq("id", userId)
    .maybeSingle();
  if (selErr) {
    console.warn("[auth] profiles lookup:", selErr.message);
    return;
  }
  if (existing) {
    const current = existing as { id: string; display_name?: string | null; email?: string | null };
    const row: Record<string, string> = {};

    if (email && current.email !== email) row.email = email;

    const resolved = getUserDisplayName({
      name: current.display_name || displayName,
      email: email || current.email || "",
    });
    if (!current.display_name || isEmailLike(current.display_name) || current.display_name !== resolved) {
      row.display_name = resolved;
    }

    if (!Object.keys(row).length) return;

    const { error: upErr } = await insforge.database.from("profiles").update(row).eq("id", userId);
    if (upErr) console.warn("[auth] profiles update email:", upErr.message);
    return;
  }

  const resolvedDisplayName = getUserDisplayName({ name: displayName, email });
  const { error: insErr } = await insforge.database.from("profiles").insert([
    {
      id: userId,
      display_name: resolvedDisplayName,
      role: "USER",
      email,
    },
  ]);
  if (insErr) console.warn("[auth] profiles insert:", insErr.message);
}

// ── Password Reset ─────────────────────────────────────────────────────────

/**
 * Track a password reset request (initiated by resetPasswordForEmail)
 * Call this after Insforge sends the reset email
 */
export async function trackPasswordResetRequest(
  userId: string,
  email: string,
  options?: { ipAddress?: string; userAgent?: string }
) {
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  const { error } = await insforge.database.from("password_resets").insert([
    {
      user_id: userId,
      email,
      token_hash: `reset_${userId}_${Date.now()}`, // Placeholder - in production, use actual token from Insforge
      used: false,
      expires_at: expiresAt.toISOString(),
      ip_address: options?.ipAddress,
      user_agent: options?.userAgent,
    },
  ]);
  if (error) {
    console.warn("[auth] password reset tracking failed:", error.message);
    // Don't throw - this is audit-only and shouldn't block user
  }
}

/**
 * Mark a password reset as completed
 * Call this after user successfully resets their password
 */
export async function completePasswordReset(userId: string) {
  const { error } = await insforge.database
    .from("password_resets")
    .update({ used: true, completed_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("used", false)
    .order("created_at", { ascending: false })
    .limit(1);
  
  if (error) {
    console.warn("[auth] password reset completion failed:", error.message);
  }
}

/**
 * Get recent password reset attempts for a user (rate limiting check)
 */
export async function getRecentPasswordResets(userId: string, minutes: number = 60) {
  const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();
  const { data, error } = await insforge.database
    .from("password_resets")
    .select("id")
    .eq("user_id", userId)
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.warn("[auth] password reset history fetch failed:", error.message);
    return [];
  }
  
  return (data || []) as { id: string }[];
}

// ── Login Attempt Tracking ──────────────────────────────────────────────────

/**
 * Track a login attempt (success or failure)
 */
export async function trackLoginAttempt(
  email: string,
  success: boolean,
  options?: {
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    failedReason?: string;
    deviceFingerprint?: string;
  }
) {
  const { error } = await insforge.database.from("login_attempts").insert([
    {
      email,
      user_id: options?.userId,
      success,
      failed_reason: options?.failedReason,
      ip_address: options?.ipAddress || "unknown",
      user_agent: options?.userAgent,
      device_fingerprint: options?.deviceFingerprint,
    },
  ]);
  
  if (error) {
    console.warn("[auth] login attempt tracking failed:", error.message);
  }
}

/**
 * Check for brute force attacks: count failed login attempts from an IP
 */
export async function checkBruteForceAttempts(ipAddress: string, minutes: number = 15) {
  const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();
  const { data, error } = await insforge.database
    .from("login_attempts")
    .select("id")
    .eq("ip_address", ipAddress)
    .eq("success", false)
    .gte("created_at", cutoff);
  
  if (error) {
    console.warn("[auth] brute force check failed:", error.message);
    return 0;
  }
  
  return (data || []).length;
}

/**
 * Log an audit event (admin updates, critical actions)
 */
export async function logAuditEvent(
  action: string,
  tableName: string,
  recordId: string | null = null,
  options?: {
    userId?: string;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    status?: string;
    errorMessage?: string;
  }
) {
  const { error } = await insforge.database.from("audit_logs").insert([
    {
      user_id: options?.userId,
      action,
      table_name: tableName,
      record_id: recordId,
      old_values: options?.oldValues || null,
      new_values: options?.newValues || null,
      ip_address: options?.ipAddress,
      user_agent: options?.userAgent,
      status: options?.status || "success",
      error_message: options?.errorMessage || null,
    },
  ]);
  
  if (error) {
    console.warn("[auth] audit logging failed:", error.message);
  }
}

/**
 * Mark email as verified in profiles table
 */
export async function markEmailAsVerified(userId: string) {
  const { error } = await insforge.database
    .from("profiles")
    .update({ email_verified: true })
    .eq("id", userId);
  
  if (error) throw error;
}
