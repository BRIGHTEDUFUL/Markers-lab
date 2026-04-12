-- Submission notifications for official inbox workflow
-- Run with: npx @insforge/cli db query "<contents>"

CREATE TABLE IF NOT EXISTS public.submission_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  official_email TEXT NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'QUEUED',
  delivery_error TEXT,
  dispatched_at TIMESTAMPTZ,
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.submission_notifications
  ADD COLUMN IF NOT EXISTS official_email TEXT;
ALTER TABLE public.submission_notifications
  ADD COLUMN IF NOT EXISTS delivery_status TEXT;
ALTER TABLE public.submission_notifications
  ADD COLUMN IF NOT EXISTS delivery_error TEXT;
ALTER TABLE public.submission_notifications
  ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ;
ALTER TABLE public.submission_notifications
  ADD COLUMN IF NOT EXISTS acknowledged BOOLEAN;
ALTER TABLE public.submission_notifications
  ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;
ALTER TABLE public.submission_notifications
  ADD COLUMN IF NOT EXISTS acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.submission_notifications
  ADD COLUMN IF NOT EXISTS payload JSONB;
ALTER TABLE public.submission_notifications
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

UPDATE public.submission_notifications
SET
  official_email = COALESCE(official_email, 'official@makerslab.app'),
  delivery_status = COALESCE(delivery_status, 'QUEUED'),
  acknowledged = COALESCE(acknowledged, false),
  updated_at = COALESCE(updated_at, NOW())
WHERE official_email IS NULL
   OR delivery_status IS NULL
   OR acknowledged IS NULL
   OR updated_at IS NULL;

ALTER TABLE public.submission_notifications
  ALTER COLUMN official_email SET NOT NULL;
ALTER TABLE public.submission_notifications
  ALTER COLUMN delivery_status SET NOT NULL;
ALTER TABLE public.submission_notifications
  ALTER COLUMN acknowledged SET NOT NULL;
ALTER TABLE public.submission_notifications
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE public.submission_notifications
  ALTER COLUMN delivery_status SET DEFAULT 'QUEUED';
ALTER TABLE public.submission_notifications
  ALTER COLUMN acknowledged SET DEFAULT false;
ALTER TABLE public.submission_notifications
  ALTER COLUMN updated_at SET DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_submission_notifications_created_at
  ON public.submission_notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submission_notifications_delivery_status
  ON public.submission_notifications (delivery_status);
CREATE INDEX IF NOT EXISTS idx_submission_notifications_acknowledged
  ON public.submission_notifications (acknowledged);

ALTER TABLE public.submission_notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'submission_notifications'
      AND policyname = 'submission_notifications_user_read'
  ) THEN
    CREATE POLICY submission_notifications_user_read
      ON public.submission_notifications FOR SELECT
      USING (user_id = (SELECT auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'submission_notifications'
      AND policyname = 'submission_notifications_user_insert'
  ) THEN
    CREATE POLICY submission_notifications_user_insert
      ON public.submission_notifications FOR INSERT
      WITH CHECK (user_id = (SELECT auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'submission_notifications'
      AND policyname = 'submission_notifications_admin_read'
  ) THEN
    CREATE POLICY submission_notifications_admin_read
      ON public.submission_notifications FOR SELECT
      USING (makers_is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'submission_notifications'
      AND policyname = 'submission_notifications_admin_update'
  ) THEN
    CREATE POLICY submission_notifications_admin_update
      ON public.submission_notifications FOR UPDATE
      USING (makers_is_admin())
      WITH CHECK (makers_is_admin());
  END IF;
END $$;
