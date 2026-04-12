-- ============================================================
-- RLS POLICY CLEANUP MIGRATION (CONTROLLED)
-- Date: 2026-04-11
-- Goal:
--   1) Remove duplicate legacy policies per table
--   2) Recreate one canonical optimized policy set per table
--   3) Use (SELECT auth.uid()) form for initplan-friendly evaluation
--
-- Apply in chunks (recommended):
--   Chunk A: profiles, user_settings
--   Chunk B: projects, project_files
--   Chunk C: testimonials, admin_notes
--   Chunk D: password_resets, email_verifications, login_attempts,
--            audit_logs, oauth_accounts, two_factor_attempts
-- ============================================================

-- ============================================================
-- SHARED FUNCTION
-- ============================================================
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

-- ============================================================
-- CHUNK A: PROFILES + USER_SETTINGS
-- ============================================================
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', r.policyname);
  END LOOP;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_user_read
  ON public.profiles FOR SELECT
  USING (id = (SELECT auth.uid()));

CREATE POLICY profiles_admin_read
  ON public.profiles FOR SELECT
  USING (public.makers_is_admin());

CREATE POLICY profiles_public_featured_read
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.user_id = public.profiles.id
        AND (p.featured = true OR p.status IN ('APPROVED', 'IN_PROGRESS', 'COMPLETED'))
    )
  );

CREATE POLICY profiles_user_insert
  ON public.profiles FOR INSERT
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY profiles_user_update
  ON public.profiles FOR UPDATE
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY profiles_admin_update
  ON public.profiles FOR UPDATE
  USING (public.makers_is_admin())
  WITH CHECK (public.makers_is_admin());

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_settings'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_settings', r.policyname);
  END LOOP;
END $$;

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_settings_user_read
  ON public.user_settings FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY user_settings_user_insert
  ON public.user_settings FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY user_settings_user_update
  ON public.user_settings FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY user_settings_admin_read
  ON public.user_settings FOR SELECT
  USING (public.makers_is_admin());

-- ============================================================
-- CHUNK B: PROJECTS + PROJECT_FILES
-- ============================================================
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'projects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.projects', r.policyname);
  END LOOP;
END $$;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY projects_owner_read
  ON public.projects FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY projects_public_read
  ON public.projects FOR SELECT
  USING (featured = true OR status IN ('APPROVED', 'IN_PROGRESS', 'COMPLETED'));

CREATE POLICY projects_admin_read
  ON public.projects FOR SELECT
  USING (public.makers_is_admin());

CREATE POLICY projects_owner_insert
  ON public.projects FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY projects_owner_update_pending
  ON public.projects FOR UPDATE
  USING (user_id = (SELECT auth.uid()) AND status = 'PENDING')
  WITH CHECK (user_id = (SELECT auth.uid()) AND status = 'PENDING');

CREATE POLICY projects_owner_delete_pending
  ON public.projects FOR DELETE
  USING (user_id = (SELECT auth.uid()) AND status = 'PENDING');

CREATE POLICY projects_admin_update
  ON public.projects FOR UPDATE
  USING (public.makers_is_admin())
  WITH CHECK (public.makers_is_admin());

CREATE POLICY projects_admin_delete
  ON public.projects FOR DELETE
  USING (public.makers_is_admin());

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'project_files'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.project_files', r.policyname);
  END LOOP;
END $$;

ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY project_files_owner_read
  ON public.project_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = project_files.project_id
        AND p.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY project_files_public_read
  ON public.project_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = project_files.project_id
        AND (p.featured = true OR p.status IN ('APPROVED', 'IN_PROGRESS', 'COMPLETED'))
    )
  );

CREATE POLICY project_files_admin_read
  ON public.project_files FOR SELECT
  USING (public.makers_is_admin());

CREATE POLICY project_files_owner_insert
  ON public.project_files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = project_files.project_id
        AND p.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY project_files_owner_update_pending
  ON public.project_files FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = project_files.project_id
        AND p.user_id = (SELECT auth.uid())
        AND p.status = 'PENDING'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = project_files.project_id
        AND p.user_id = (SELECT auth.uid())
        AND p.status = 'PENDING'
    )
  );

CREATE POLICY project_files_owner_delete_pending
  ON public.project_files FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = project_files.project_id
        AND p.user_id = (SELECT auth.uid())
        AND p.status = 'PENDING'
    )
  );

CREATE POLICY project_files_admin_delete
  ON public.project_files FOR DELETE
  USING (public.makers_is_admin());

-- ============================================================
-- CHUNK C: TESTIMONIALS + ADMIN_NOTES
-- ============================================================
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'testimonials'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.testimonials', r.policyname);
  END LOOP;
END $$;

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY testimonials_public_read
  ON public.testimonials FOR SELECT
  USING (is_approved = true);

CREATE POLICY testimonials_owner_read
  ON public.testimonials FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY testimonials_admin_read
  ON public.testimonials FOR SELECT
  USING (public.makers_is_admin());

CREATE POLICY testimonials_owner_insert
  ON public.testimonials FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY testimonials_admin_update
  ON public.testimonials FOR UPDATE
  USING (public.makers_is_admin())
  WITH CHECK (public.makers_is_admin());

CREATE POLICY testimonials_owner_delete
  ON public.testimonials FOR DELETE
  USING (user_id = (SELECT auth.uid()));

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_notes'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.admin_notes', r.policyname);
  END LOOP;
END $$;

ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_notes_admin_read
  ON public.admin_notes FOR SELECT
  USING (public.makers_is_admin());

CREATE POLICY admin_notes_admin_insert
  ON public.admin_notes FOR INSERT
  WITH CHECK (public.makers_is_admin());

CREATE POLICY admin_notes_owner_read
  ON public.admin_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = admin_notes.project_id
        AND p.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- CHUNK D: AUTH/SECURITY TABLES
-- ============================================================
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'password_resets'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.password_resets', r.policyname);
  END LOOP;
END $$;

ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

CREATE POLICY password_resets_anonymous_insert
  ON public.password_resets FOR INSERT
  WITH CHECK (true);

CREATE POLICY password_resets_user_read
  ON public.password_resets FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR public.makers_is_admin());

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'email_verifications'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.email_verifications', r.policyname);
  END LOOP;
END $$;

ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY email_verifications_anonymous_insert
  ON public.email_verifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY email_verifications_user_read
  ON public.email_verifications FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR public.makers_is_admin());

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'login_attempts'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.login_attempts', r.policyname);
  END LOOP;
END $$;

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY login_attempts_admin_read
  ON public.login_attempts FOR SELECT
  USING (public.makers_is_admin());

CREATE POLICY login_attempts_insert
  ON public.login_attempts FOR INSERT
  WITH CHECK (true);

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audit_logs'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.audit_logs', r.policyname);
  END LOOP;
END $$;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_admin_read
  ON public.audit_logs FOR SELECT
  USING (public.makers_is_admin());

CREATE POLICY audit_logs_system_insert
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'oauth_accounts'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.oauth_accounts', r.policyname);
  END LOOP;
END $$;

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

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'two_factor_attempts'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.two_factor_attempts', r.policyname);
  END LOOP;
END $$;

ALTER TABLE public.two_factor_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY two_factor_attempts_system_insert
  ON public.two_factor_attempts FOR INSERT
  WITH CHECK (true);

CREATE POLICY two_factor_attempts_user_read
  ON public.two_factor_attempts FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR public.makers_is_admin());

-- ============================================================
-- POST-MIGRATION QUICK CHECKS
-- ============================================================
-- 1) Count policies per managed table
-- SELECT tablename, count(*)
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN (
--     'profiles','user_settings',
--     'projects','project_files',
--     'testimonials','admin_notes',
--     'password_resets','email_verifications','login_attempts','audit_logs',
--     'oauth_accounts','two_factor_attempts'
--   )
-- GROUP BY tablename
-- ORDER BY tablename;

-- 2) Remaining direct auth.uid() usage in policies should be zero
-- SELECT count(*)
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND (
--     COALESCE(qual::text,'') ILIKE '%auth.uid()%'
--     OR COALESCE(with_check::text,'') ILIKE '%auth.uid()%'
--   );
