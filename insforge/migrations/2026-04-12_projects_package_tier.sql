-- Add package tier to projects for pricing-aligned submissions.
-- Safe to run multiple times.

BEGIN;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS package_tier TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'projects_package_tier_check'
      AND conrelid = 'public.projects'::regclass
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_package_tier_check
      CHECK (package_tier IS NULL OR package_tier IN ('Standard', 'Premium', 'Executive'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_projects_package_tier
  ON public.projects (package_tier)
  WHERE package_tier IS NOT NULL;

COMMIT;
