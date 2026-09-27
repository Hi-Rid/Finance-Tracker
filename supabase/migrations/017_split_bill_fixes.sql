-- =====================================================
-- 017_split_bill_fixes.sql
-- Fix: payer tracking + user paid status + debt linking
-- =====================================================

-- 1. Tambah payer_participant_id ke events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS payer_participant_id uuid 
  REFERENCES public.event_participants(id) ON DELETE SET NULL;

-- 2. Tambah event_participant_id ke debts (buat linking yang reliable)
ALTER TABLE public.debts
  ADD COLUMN IF NOT EXISTS event_participant_id uuid 
  REFERENCES public.event_participants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_debts_event_participant 
  ON public.debts(event_participant_id);

-- 3. Fix existing data: user paid=false kalau bukan payer
UPDATE public.event_participants ep
SET paid = false, paid_at = NULL
FROM public.events e
WHERE e.id = ep.event_id
  AND ep.is_user = true
  AND e.payer_is_user = false;

-- 4. Verify
SELECT COUNT(*) AS still_broken
FROM public.event_participants ep
JOIN public.events e ON e.id = ep.event_id
WHERE ep.is_user = true 
  AND e.payer_is_user = false 
  AND ep.paid = true;
-- Expected: 0