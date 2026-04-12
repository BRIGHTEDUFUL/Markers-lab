-- Remove Two-Factor Authentication artifacts (idempotent)
-- Safe to run multiple times.

BEGIN;

-- Drop old 2FA RLS policies if present.
DROP POLICY IF EXISTS two_factor_attempts_system_insert ON public.two_factor_attempts;
DROP POLICY IF EXISTS two_factor_attempts_user_read ON public.two_factor_attempts;

-- Drop 2FA attempts table and dependent objects.
DROP TABLE IF EXISTS public.two_factor_attempts;

-- Remove 2FA columns from user settings.
ALTER TABLE IF EXISTS public.user_settings
  DROP COLUMN IF EXISTS two_factor_enabled,
  DROP COLUMN IF EXISTS two_factor_method,
  DROP COLUMN IF EXISTS two_factor_verified_at;

COMMIT;
