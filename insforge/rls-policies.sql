-- ============================================================
-- ROW LEVEL SECURITY POLICIES (Essential for data security)
-- InsForge Postgres RLS for Maker's Lab
-- Run via: npx @insforge/cli db query "$(cat insforge/rls-policies.sql)"
-- ============================================================

-- ========== HELPER FUNCTION ==========
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

-- ========== PROFILES TABLE RLS ==========
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own profile
CREATE POLICY profiles_user_read
  ON public.profiles FOR SELECT
  USING (id = (SELECT auth.uid()));

-- Policy 2: Admins can view all profiles
CREATE POLICY profiles_admin_read
  ON public.profiles FOR SELECT
  USING (makers_is_admin());

-- Policy 3: Users can update their own profile
CREATE POLICY profiles_user_update
  ON public.profiles FOR UPDATE
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- Policy 4: Users can insert their own profile (signup)
CREATE POLICY profiles_user_insert
  ON public.profiles FOR INSERT
  WITH CHECK (id = (SELECT auth.uid()));

-- Policy 5: Admins can update any profile
CREATE POLICY profiles_admin_update
  ON public.profiles FOR UPDATE
  USING (makers_is_admin())
  WITH CHECK (makers_is_admin());

-- ========== PROJECTS TABLE RLS ==========
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own projects
CREATE POLICY projects_user_read_own
  ON public.projects FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- Policy 2: Anyone can view APPROVED projects (public gallery)
CREATE POLICY projects_public_read
  ON public.projects FOR SELECT
  USING (status = 'APPROVED' OR status = 'IN_PROGRESS' OR status = 'COMPLETED');

-- Policy 3: Admins can view all projects
CREATE POLICY projects_admin_read
  ON public.projects FOR SELECT
  USING (makers_is_admin());

-- Policy 4: Users can create projects
CREATE POLICY projects_user_insert
  ON public.projects FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Policy 5: Users can update their own PENDING projects
CREATE POLICY projects_user_update_own
  ON public.projects FOR UPDATE
  USING (user_id = (SELECT auth.uid()) AND status = 'PENDING')
  WITH CHECK (user_id = (SELECT auth.uid()) AND status = 'PENDING');

-- Policy 6: Users can delete their own PENDING projects
CREATE POLICY projects_user_delete_own
  ON public.projects FOR DELETE
  USING (user_id = (SELECT auth.uid()) AND status = 'PENDING');

-- Policy 7: Admins can update any project
CREATE POLICY projects_admin_update
  ON public.projects FOR UPDATE
  USING (makers_is_admin())
  WITH CHECK (makers_is_admin());

-- Policy 8: Admins can delete any project
CREATE POLICY projects_admin_delete
  ON public.projects FOR DELETE
  USING (makers_is_admin());

-- ========== PROJECT_FILES TABLE RLS ==========
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view files from their own projects
CREATE POLICY project_files_user_read
  ON public.project_files FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = (SELECT auth.uid())
    )
  );

-- Policy 2: Users can view files from approved projects
CREATE POLICY project_files_public_read
  ON public.project_files FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects 
      WHERE status IN ('APPROVED', 'IN_PROGRESS', 'COMPLETED')
    )
  );

-- Policy 3: Admins can view all files
CREATE POLICY project_files_admin_read
  ON public.project_files FOR SELECT
  USING (makers_is_admin());

-- Policy 4: Users can upload files to their own projects
CREATE POLICY project_files_user_insert
  ON public.project_files FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = (SELECT auth.uid())
    )
  );

-- Policy 5: Admins can delete any files
CREATE POLICY project_files_admin_delete
  ON public.project_files FOR DELETE
  USING (makers_is_admin());

-- ========== TESTIMONIALS TABLE RLS ==========
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone can read approved testimonials
CREATE POLICY testimonials_public_read
  ON public.testimonials FOR SELECT
  USING (is_approved = true);

-- Policy 2: Users can view their own testimonials
CREATE POLICY testimonials_user_read_own
  ON public.testimonials FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- Policy 3: Admins can view all testimonials
CREATE POLICY testimonials_admin_read
  ON public.testimonials FOR SELECT
  USING (makers_is_admin());

-- Policy 4: Users can create testimonials
CREATE POLICY testimonials_user_insert
  ON public.testimonials FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Policy 5: Admins can update (approve/reject) testimonials
CREATE POLICY testimonials_admin_update
  ON public.testimonials FOR UPDATE
  USING (makers_is_admin())
  WITH CHECK (makers_is_admin());

-- ========== ADMIN_NOTES TABLE RLS ==========
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

-- Policy 1: Only admins can read admin notes
CREATE POLICY admin_notes_admin_read
  ON public.admin_notes FOR SELECT
  USING (makers_is_admin());

-- Policy 2: Only admins can insert admin notes
CREATE POLICY admin_notes_admin_insert
  ON public.admin_notes FOR INSERT
  WITH CHECK (makers_is_admin());

-- Policy 3: Project owner can view notes on their projects
CREATE POLICY admin_notes_user_read
  ON public.admin_notes FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = (SELECT auth.uid())
    )
  );

-- ========== SUBMISSION_NOTIFICATIONS TABLE RLS ==========
ALTER TABLE public.submission_notifications ENABLE ROW LEVEL SECURITY;

-- Policy 1: Submitter can read own notification records
CREATE POLICY submission_notifications_user_read
  ON public.submission_notifications FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- Policy 2: Submitter can create notification records for own submissions
CREATE POLICY submission_notifications_user_insert
  ON public.submission_notifications FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Policy 3: Admins can read all notifications
CREATE POLICY submission_notifications_admin_read
  ON public.submission_notifications FOR SELECT
  USING (makers_is_admin());

-- Policy 4: Admins can update notification status/acknowledgement
CREATE POLICY submission_notifications_admin_update
  ON public.submission_notifications FOR UPDATE
  USING (makers_is_admin())
  WITH CHECK (makers_is_admin());

-- ========== PASSWORD_RESETS TABLE RLS ==========
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

-- Policy 1: Unauthenticated users can insert (password reset request)
CREATE POLICY password_resets_anonymous_insert
  ON public.password_resets FOR INSERT
  WITH CHECK (true);

-- Policy 2: Users can only read their own resets
CREATE POLICY password_resets_user_read
  ON public.password_resets FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- ========== EMAIL_VERIFICATIONS TABLE RLS ==========
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Policy 1: Unauthenticated users can insert (email verification request)
CREATE POLICY email_verifications_anonymous_insert
  ON public.email_verifications FOR INSERT
  WITH CHECK (true);

-- Policy 2: Users can only read their own verifications
CREATE POLICY email_verifications_user_read
  ON public.email_verifications FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- ========== LOGIN_ATTEMPTS TABLE RLS ==========
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Policy 1: Only admins can view login attempts
CREATE POLICY login_attempts_admin_read
  ON public.login_attempts FOR SELECT
  USING (makers_is_admin());

-- Policy 2: Anyone can insert login attempts (for audit trail)
CREATE POLICY login_attempts_insert
  ON public.login_attempts FOR INSERT
  WITH CHECK (true);

-- ========== AUDIT_LOGS TABLE RLS ==========
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy 1: Only admins can view audit logs
CREATE POLICY audit_logs_admin_read
  ON public.audit_logs FOR SELECT
  USING (makers_is_admin());

-- Policy 2: System can insert audit logs (SECURITY DEFINER function)
CREATE POLICY audit_logs_system_insert
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- ========== USER_SETTINGS TABLE RLS ==========
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own settings
CREATE POLICY user_settings_user_read
  ON public.user_settings FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- Policy 2: Users can update their own settings
CREATE POLICY user_settings_user_update
  ON public.user_settings FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Policy 3: Users can insert their own settings
CREATE POLICY user_settings_user_insert
  ON public.user_settings FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Policy 4: Admins can view all settings
CREATE POLICY user_settings_admin_read
  ON public.user_settings FOR SELECT
  USING (makers_is_admin());

-- ============================================================
-- VERIFICATION
-- ============================================================
-- Check all RLS policies:
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' ORDER BY tablename;
-- 
-- SELECT * FROM information_schema.role_based_access_control_policies;
