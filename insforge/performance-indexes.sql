-- ============================================================
-- Performance Indexes for Maker's Lab
-- Run once against your InsForge Postgres database.
-- These cover the most frequent query patterns in makers-data.ts
-- ============================================================

-- projects: most queries filter/order by user_id, status, featured, created_at
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_user_id
  ON public.projects (user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_featured_created
  ON public.projects (featured, created_at DESC)
  WHERE featured = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_status
  ON public.projects (status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_created_at
  ON public.projects (created_at DESC);

-- project_files: always queried by project_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_files_project_id
  ON public.project_files (project_id);

-- admin_notes: always queried by project_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_notes_project_id
  ON public.admin_notes (project_id);

-- testimonials: filtered by is_approved and project_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_testimonials_approved_created
  ON public.testimonials (is_approved, created_at DESC)
  WHERE is_approved = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_testimonials_project_id
  ON public.testimonials (project_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_testimonials_user_id
  ON public.testimonials (user_id);

-- profiles: looked up by id (PK already indexed), but also by email for admin search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_email
  ON public.profiles (email);

-- ============================================================
-- Verify indexes
-- ============================================================
-- SELECT indexname, tablename, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;
