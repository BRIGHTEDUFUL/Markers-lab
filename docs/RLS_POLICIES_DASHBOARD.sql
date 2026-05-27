-- ============================================================
-- ROW LEVEL SECURITY - COPY & PASTE INTO INSFORGE DASHBOARD
-- ============================================================
-- Go to: Insforge Dashboard → SQL Editor
-- Paste this entire file and execute

-- STEP 1: Create admin check helper function
CREATE OR REPLACE FUNCTION public.makers_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'ADMIN' 
    FROM public.profiles 
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 2: Enable RLS on tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- STEP 3: Profiles table policies
DROP POLICY IF EXISTS profiles_user_read ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_read ON public.profiles;
DROP POLICY IF EXISTS profiles_user_update ON public.profiles;
DROP POLICY IF EXISTS profiles_user_insert ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_update ON public.profiles;

CREATE POLICY profiles_user_read
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY profiles_admin_read
  ON public.profiles FOR SELECT
  USING (public.makers_is_admin());

CREATE POLICY profiles_user_update
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_user_insert
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_admin_update
  ON public.profiles FOR UPDATE
  USING (public.makers_is_admin())
  WITH CHECK (public.makers_is_admin());

-- STEP 4: Projects table policies
DROP POLICY IF EXISTS projects_public_read ON public.projects;
DROP POLICY IF EXISTS projects_owner_manage ON public.projects;
DROP POLICY IF EXISTS projects_admin_manage ON public.projects;
DROP POLICY IF EXISTS projects_owner_insert ON public.projects;

CREATE POLICY projects_public_read
  ON public.projects FOR SELECT
  USING (status = 'APPROVED' OR user_id = auth.uid() OR public.makers_is_admin());

CREATE POLICY projects_owner_manage
  ON public.projects FOR UPDATE
  USING (user_id = auth.uid() AND status != 'APPROVED')
  WITH CHECK (user_id = auth.uid());

CREATE POLICY projects_admin_manage
  ON public.projects FOR UPDATE
  USING (public.makers_is_admin())
  WITH CHECK (public.makers_is_admin());

CREATE POLICY projects_owner_insert
  ON public.projects FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- STEP 5: Project files policies
DROP POLICY IF EXISTS project_files_public_read ON public.project_files;
DROP POLICY IF EXISTS project_files_owner_upload ON public.project_files;
DROP POLICY IF EXISTS project_files_admin_delete ON public.project_files;

CREATE POLICY project_files_public_read
  ON public.project_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_files.project_id 
      AND (projects.status = 'APPROVED' OR projects.user_id = auth.uid() OR public.makers_is_admin())
    )
  );

CREATE POLICY project_files_owner_upload
  ON public.project_files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_files.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY project_files_admin_delete
  ON public.project_files FOR DELETE
  USING (public.makers_is_admin());

-- STEP 6: Testimonials policies
DROP POLICY IF EXISTS testimonials_public_read ON public.testimonials;
DROP POLICY IF EXISTS testimonials_user_read ON public.testimonials;
DROP POLICY IF EXISTS testimonials_admin_read ON public.testimonials;
DROP POLICY IF EXISTS testimonials_user_insert ON public.testimonials;

CREATE POLICY testimonials_public_read
  ON public.testimonials FOR SELECT
  USING (is_approved = true);

CREATE POLICY testimonials_user_read
  ON public.testimonials FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY testimonials_admin_read
  ON public.testimonials FOR SELECT
  USING (public.makers_is_admin());

CREATE POLICY testimonials_user_insert
  ON public.testimonials FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- STEP 7: Admin notes policies
DROP POLICY IF EXISTS admin_notes_admin_read ON public.admin_notes;
DROP POLICY IF EXISTS admin_notes_admin_insert ON public.admin_notes;

CREATE POLICY admin_notes_admin_read
  ON public.admin_notes FOR SELECT
  USING (public.makers_is_admin());

CREATE POLICY admin_notes_admin_insert
  ON public.admin_notes FOR INSERT
  WITH CHECK (public.makers_is_admin());

-- STEP 8: Security tracking tables - allow system writes
DROP POLICY IF EXISTS password_resets_user_insert ON public.password_resets;
DROP POLICY IF EXISTS password_resets_user_read ON public.password_resets;

CREATE POLICY password_resets_user_insert
  ON public.password_resets FOR INSERT
  WITH CHECK (true);

CREATE POLICY password_resets_user_read
  ON public.password_resets FOR SELECT
  USING (user_id = auth.uid() OR public.makers_is_admin());

-- STEP 9: Email verifications policies
DROP POLICY IF EXISTS email_verifications_user_insert ON public.email_verifications;
DROP POLICY IF EXISTS email_verifications_user_read ON public.email_verifications;

CREATE POLICY email_verifications_user_insert
  ON public.email_verifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY email_verifications_user_read
  ON public.email_verifications FOR SELECT
  USING (user_id = auth.uid() OR public.makers_is_admin());

-- STEP 10: Login attempts - admin only
DROP POLICY IF EXISTS login_attempts_system_insert ON public.login_attempts;
DROP POLICY IF EXISTS login_attempts_admin_read ON public.login_attempts;

CREATE POLICY login_attempts_system_insert
  ON public.login_attempts FOR INSERT
  WITH CHECK (true);

CREATE POLICY login_attempts_admin_read
  ON public.login_attempts FOR SELECT
  USING (public.makers_is_admin());

-- STEP 11: Audit logs - admin only
DROP POLICY IF EXISTS audit_logs_system_insert ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_admin_read ON public.audit_logs;

CREATE POLICY audit_logs_system_insert
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY audit_logs_admin_read
  ON public.audit_logs FOR SELECT
  USING (public.makers_is_admin());

-- STEP 12: User settings - users manage own
DROP POLICY IF EXISTS user_settings_user_read ON public.user_settings;
DROP POLICY IF EXISTS user_settings_user_update ON public.user_settings;
DROP POLICY IF EXISTS user_settings_user_insert ON public.user_settings;
DROP POLICY IF EXISTS user_settings_admin_read ON public.user_settings;

CREATE POLICY user_settings_user_read
  ON public.user_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY user_settings_user_update
  ON public.user_settings FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY user_settings_user_insert
  ON public.user_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY user_settings_admin_read
  ON public.user_settings FOR SELECT
  USING (public.makers_is_admin());

-- ============================================================
-- DEPLOYMENT COMPLETE
-- ============================================================
-- All 10 tables now have RLS protection
-- Before: Anyone could access all data
-- After: Role-based access control enforced
-- ============================================================
