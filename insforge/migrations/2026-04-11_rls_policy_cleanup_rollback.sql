-- ============================================================
-- RLS POLICY CLEANUP ROLLBACK MIGRATION
-- Date: 2026-04-11
-- Purpose: rollback companion for 2026-04-11_rls_policy_cleanup.sql
-- Strategy:
--   1) Drop policy sets created by cleanup migration
--   2) Recreate baseline policy names/shape used by project SQL sources
--      (rls-policies.sql + oauth-2fa-schema.sql)
-- ============================================================

-- Helper function baseline (kept optimized-safe)
CREATE OR REPLACE FUNCTION public.makers_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'ADMIN'
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop all policies on managed tables
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'profiles','user_settings',
        'projects','project_files',
        'testimonials','admin_notes',
        'password_resets','email_verifications','login_attempts','audit_logs',
        'oauth_accounts','two_factor_attempts'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ========== PROFILES ==========
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_user_read
  ON public.profiles FOR SELECT
  USING (id = (SELECT auth.uid()));

CREATE POLICY profiles_admin_read
  ON public.profiles FOR SELECT
  USING (public.makers_is_admin());

CREATE POLICY profiles_user_update
  ON public.profiles FOR UPDATE
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY profiles_user_insert
  ON public.profiles FOR INSERT
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY profiles_admin_update
  ON public.profiles FOR UPDATE
  USING (public.makers_is_admin())
  WITH CHECK (public.makers_is_admin());

-- ========== PROJECTS ==========
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY projects_user_read_own
  ON public.projects FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY projects_public_read
  ON public.projects FOR SELECT
  USING (status = 'APPROVED' OR status = 'IN_PROGRESS' OR status = 'COMPLETED');

CREATE POLICY projects_admin_read
  ON public.projects FOR SELECT
  USING (public.makers_is_admin());

CREATE POLICY projects_user_insert
  ON public.projects FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY projects_user_update_own
  ON public.projects FOR UPDATE
  USING (user_id = (SELECT auth.uid()) AND status = 'PENDING')
  WITH CHECK (user_id = (SELECT auth.uid()) AND status = 'PENDING');

CREATE POLICY projects_user_delete_own
  ON public.projects FOR DELETE
  USING (user_id = (SELECT auth.uid()) AND status = 'PENDING');

CREATE POLICY projects_admin_update
  ON public.projects FOR UPDATE
  USING (public.makers_is_admin())
  WITH CHECK (public.makers_is_admin());

CREATE POLICY projects_admin_delete
  ON public.projects FOR DELETE
  USING (public.makers_is_admin());

-- ========== PROJECT_FILES ==========
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY project_files_user_read
  ON public.project_files FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY project_files_public_read
  ON public.project_files FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE status IN ('APPROVED', 'IN_PROGRESS', 'COMPLETED')
    )
  );

CREATE POLICY project_files_admin_read
  ON public.project_files FOR SELECT
  USING (public.makers_is_admin());

CREATE POLICY project_files_user_insert
  ON public.project_files FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY project_files_admin_delete
  ON public.project_files FOR DELETE
  USING (public.makers_is_admin());

-- ========== TESTIMONIALS ==========
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY testimonials_public_read
  ON public.testimonials FOR SELECT
  USING (is_approved = true);

CREATE POLICY testimonials_user_read_own
  ON public.testimonials FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY testimonials_admin_read
  ON public.testimonials FOR SELECT
  USING (public.makers_is_admin());

CREATE POLICY testimonials_user_insert
  ON public.testimonials FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY testimonials_admin_update
  ON public.testimonials FOR UPDATE
  USING (public.makers_is_admin())
  WITH CHECK (public.makers_is_admin());

-- ========== ADMIN_NOTES ==========
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_notes_admin_read
  ON public.admin_notes FOR SELECT
  USING (public.makers_is_admin());

CREATE POLICY admin_notes_admin_insert
  ON public.admin_notes FOR INSERT
  WITH CHECK (public.makers_is_admin());

CREATE POLICY admin_notes_user_read
  ON public.admin_notes FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = (SELECT auth.uid())
    )
  );

-- ========== PASSWORD_RESETS ==========
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

CREATE POLICY password_resets_anonymous_insert
  ON public.password_resets FOR INSERT
  WITH CHECK (true);

CREATE POLICY password_resets_user_read
  ON public.password_resets FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- ========== EMAIL_VERIFICATIONS ==========
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY email_verifications_anonymous_insert
  ON public.email_verifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY email_verifications_user_read
  ON public.email_verifications FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- ========== LOGIN_ATTEMPTS ==========
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY login_attempts_admin_read
  ON public.login_attempts FOR SELECT
  USING (public.makers_is_admin());

CREATE POLICY login_attempts_insert
  ON public.login_attempts FOR INSERT
  WITH CHECK (true);

-- ========== AUDIT_LOGS ==========
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_admin_read
  ON public.audit_logs FOR SELECT
  USING (public.makers_is_admin());

CREATE POLICY audit_logs_system_insert
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- ========== USER_SETTINGS ==========
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_settings_user_read
  ON public.user_settings FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY user_settings_user_update
  ON public.user_settings FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY user_settings_user_insert
  ON public.user_settings FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY user_settings_admin_read
  ON public.user_settings FOR SELECT
  USING (public.makers_is_admin());

-- ========== OAUTH_ACCOUNTS ==========
ALTER TABLE public.oauth_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY oauth_accounts_user_read
  ON public.oauth_accounts FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR public.makers_is_admin());

CREATE POLICY oauth_accounts_user_insert
  ON public.oauth_accounts FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY oauth_accounts_user_update
  ON public.oauth_accounts FOR UPDATE
  USING (user_id = (SELECT auth.uid()) OR public.makers_is_admin())
  WITH CHECK (user_id = (SELECT auth.uid()) OR public.makers_is_admin());

CREATE POLICY oauth_accounts_admin_delete
  ON public.oauth_accounts FOR DELETE
  USING (public.makers_is_admin());

-- ========== TWO_FACTOR_ATTEMPTS ==========
ALTER TABLE public.two_factor_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY two_factor_attempts_system_insert
  ON public.two_factor_attempts FOR INSERT
  WITH CHECK (true);

CREATE POLICY two_factor_attempts_user_read
  ON public.two_factor_attempts FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR public.makers_is_admin());

-- Post-rollback check
-- SELECT tablename, count(*)
-- FROM pg_policies
-- WHERE schemaname='public'
--   AND tablename IN (
--     'profiles','user_settings','projects','project_files',
--     'testimonials','admin_notes','password_resets','email_verifications',
--     'login_attempts','audit_logs','oauth_accounts','two_factor_attempts'
--   )
-- GROUP BY tablename
-- ORDER BY tablename;
