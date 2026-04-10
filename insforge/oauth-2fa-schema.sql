-- ============================================================
-- PHASE 2: GOOGLE OAUTH & EMAIL 2FA DATABASE SCHEMA
-- ============================================================
-- Deployed with: npx @insforge/cli db import oauth-2fa-schema.sql

-- STEP 1: Create oauth_accounts table (Google OAuth)
CREATE TABLE IF NOT EXISTS public.oauth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'google', -- "google", "github", etc
  provider_id TEXT NOT NULL, -- Google subject ID
  provider_email TEXT, -- Email from provider
  email_verified BOOLEAN DEFAULT true,
  access_token TEXT, -- For API calls if needed
  refresh_token TEXT, -- For token refresh
  token_expires_at TIMESTAMPTZ,
  last_signin TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, provider_id),
  UNIQUE(user_id, provider)
);

CREATE INDEX idx_oauth_accounts_user_id ON public.oauth_accounts(user_id);
CREATE INDEX idx_oauth_accounts_provider_id ON public.oauth_accounts(provider, provider_id);

-- STEP 2: Create two_factor_attempts table (OTP tracking)
CREATE TABLE IF NOT EXISTS public.two_factor_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL, -- Email OTP was sent to
  method TEXT NOT NULL DEFAULT 'email', -- "email", "sms", "totp"
  otp_code_hash TEXT NOT NULL, -- Hashed 6-digit code (never store plaintext)
  success BOOLEAN DEFAULT false,
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  locked_until TIMESTAMPTZ, -- Time when lockout expires (15 min after 3 attempts)
  expires_at TIMESTAMPTZ NOT NULL, -- When OTP expires (15 min)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_two_factor_attempts_user_id ON public.two_factor_attempts(user_id);
CREATE INDEX idx_two_factor_attempts_expires ON public.two_factor_attempts(expires_at);

-- STEP 3: Extend user_settings table (if not already extended)
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS two_factor_method TEXT DEFAULT 'email';
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS two_factor_verified_at TIMESTAMPTZ;

-- STEP 4: Enable RLS on new tables
ALTER TABLE public.oauth_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.two_factor_attempts ENABLE ROW LEVEL SECURITY;

-- STEP 5: Create RLS Policies for oauth_accounts
DROP POLICY IF EXISTS oauth_accounts_user_read ON public.oauth_accounts;
CREATE POLICY oauth_accounts_user_read
  ON public.oauth_accounts FOR SELECT
  USING (user_id = auth.uid() OR public.makers_is_admin());

DROP POLICY IF EXISTS oauth_accounts_user_insert ON public.oauth_accounts;
CREATE POLICY oauth_accounts_user_insert
  ON public.oauth_accounts FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS oauth_accounts_user_update ON public.oauth_accounts;
CREATE POLICY oauth_accounts_user_update
  ON public.oauth_accounts FOR UPDATE
  USING (user_id = auth.uid() OR public.makers_is_admin())
  WITH CHECK (user_id = auth.uid() OR public.makers_is_admin());

DROP POLICY IF EXISTS oauth_accounts_admin_delete ON public.oauth_accounts;
CREATE POLICY oauth_accounts_admin_delete
  ON public.oauth_accounts FOR DELETE
  USING (public.makers_is_admin());

-- STEP 6: Create RLS Policies for two_factor_attempts
DROP POLICY IF EXISTS two_factor_attempts_system_insert ON public.two_factor_attempts;
CREATE POLICY two_factor_attempts_system_insert
  ON public.two_factor_attempts FOR INSERT
  WITH CHECK (true); -- System inserts OTP records

DROP POLICY IF EXISTS two_factor_attempts_user_read ON public.two_factor_attempts;
CREATE POLICY two_factor_attempts_user_read
  ON public.two_factor_attempts FOR SELECT
  USING (user_id = auth.uid() OR public.makers_is_admin());

-- STEP 7: Create function to check if user has Google OAuth account
DROP FUNCTION IF EXISTS public.has_oauth_account(uuid, text);
CREATE OR REPLACE FUNCTION public.has_oauth_account(p_user_id uuid, p_provider text DEFAULT 'google')
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM oauth_accounts 
    WHERE user_id = p_user_id AND provider = p_provider
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 8: Create function to get user's OAuth accounts
DROP FUNCTION IF EXISTS public.get_user_oauth_accounts(uuid);
CREATE OR REPLACE FUNCTION public.get_user_oauth_accounts(p_user_id uuid)
RETURNS TABLE(provider text, provider_email text, last_signin timestamptz) AS $$
BEGIN
  RETURN QUERY
  SELECT oauth_accounts.provider, oauth_accounts.provider_email, oauth_accounts.last_signin
  FROM oauth_accounts
  WHERE oauth_accounts.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 9: Audit log new OAuth/2FA events
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS metadata JSONB; -- For storing extra data

-- ============================================================
-- DEPLOYMENT COMPLETE
-- ============================================================
-- Tables created: oauth_accounts, two_factor_attempts
-- Modified tables: user_settings
-- RLS policies: 6 (4 on oauth_accounts, 2 on two_factor_attempts)
-- Functions: 2 (has_oauth_account, get_user_oauth_accounts)
-- ============================================================
