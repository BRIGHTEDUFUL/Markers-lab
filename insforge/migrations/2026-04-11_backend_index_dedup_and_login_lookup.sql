-- Backend optimization: remove redundant indexes and add login lookup index
-- Safe to run multiple times.

BEGIN;

-- Redundant duplicates (keep canonical idx_* or unique constraint-backed indexes).
DROP INDEX IF EXISTS public.admin_notes_admin_id_idx;
DROP INDEX IF EXISTS public.admin_notes_project_id_idx;
DROP INDEX IF EXISTS public.project_files_project_id_idx;
DROP INDEX IF EXISTS public.projects_status_idx;
DROP INDEX IF EXISTS public.idx_oauth_accounts_provider_id;
DROP INDEX IF EXISTS public.idx_testimonials_project_id;
DROP INDEX IF EXISTS public.testimonials_user_id_idx;
DROP INDEX IF EXISTS public.idx_user_settings_user_id;

-- Accelerate case-insensitive username login lookup.
CREATE INDEX IF NOT EXISTS idx_profiles_display_name_lower
  ON public.profiles ((lower(display_name)));

COMMIT;
