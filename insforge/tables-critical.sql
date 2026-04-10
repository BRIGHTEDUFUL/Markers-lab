-- ============================================================
-- CRITICAL TABLES FOR PASSWORD RESET & EMAIL VERIFICATION
-- InsForge Postgres schema additions for Maker's Lab
-- Run via: npx @insforge/cli db query "$(cat insforge/tables-critical.sql)"
-- ============================================================

-- 1. PASSWORD RESET TRACKING TABLE (Rate limiting + Security)
CREATE TABLE IF NOT EXISTS public.password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  used BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_password_resets_user_id
  ON public.password_resets (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_password_resets_expires
  ON public.password_resets (expires_at)
  WHERE used = false;

-- 2. EMAIL VERIFICATION TABLE (Track OTP/Links)
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  otp_hash TEXT NOT NULL UNIQUE,
  verified BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  verified_at TIMESTAMPTZ,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_verifications_user_id
  ON public.email_verifications (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_verifications_expires
  ON public.email_verifications (expires_at)
  WHERE verified = false;

-- 3. LOGIN ATTEMPT TRACKING (Brute force detection)
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  failed_reason TEXT,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  device_fingerprint TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_login_attempts_email_created
  ON public.login_attempts (email, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_login_attempts_ip_created
  ON public.login_attempts (ip_address, created_at DESC);

-- 4. AUDIT LOG TABLE (Compliance + Investigation)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_id_created
  ON public.audit_logs (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_table_record
  ON public.audit_logs (table_name, record_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action
  ON public.audit_logs (action, created_at DESC);

-- 5. USER SETTINGS/PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'dark',
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  marketing_emails BOOLEAN NOT NULL DEFAULT true,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  two_factor_method TEXT,
  privacy_level TEXT NOT NULL DEFAULT 'private',
  bio TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_settings_user_id
  ON public.user_settings (user_id);

-- 6. ADD EMAIL UNIQUENESS & VERIFICATION TO PROFILES
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Add unique constraint for email (if not already exists)
-- NOTE: This may need manual cleanup of duplicates first
ALTER TABLE public.profiles 
  ADD CONSTRAINT unique_email_profiles UNIQUE (email) 
  WHERE email IS NOT NULL;

-- ============================================================
-- DATA CLEANUP (Optional - only if you have duplicate emails)
-- ============================================================
-- Remove duplicate emails (keeps oldest, deletes newer duplicates):
-- DELETE FROM public.profiles 
-- WHERE id NOT IN (
--   SELECT DISTINCT ON (email) id 
--   FROM public.profiles 
--   WHERE email IS NOT NULL 
--   ORDER BY email, created_at ASC
-- );
