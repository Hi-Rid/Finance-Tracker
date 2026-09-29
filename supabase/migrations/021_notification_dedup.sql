-- =====================================================
-- 021_notification_dedup.sql
-- Add dedup_key to notifications untuk prevent duplikat
-- =====================================================

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS dedup_key text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedup
  ON public.notifications(user_id, dedup_key)
  WHERE dedup_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications(user_id, created_at DESC);

-- Verify
SELECT 'notifications_columns' AS cek, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'notifications'
  AND column_name = 'dedup_key';