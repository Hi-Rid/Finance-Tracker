-- =====================================================
-- 029_debts_cascade_split_bill.sql
-- Fix: debt terkait split bill harus kehapus otomatis
-- ketika event/participant dihapus (sebelumnya SET NULL → orphaned)
-- =====================================================

-- =====================================================
-- 1. FIX FK CASCADE
-- =====================================================
ALTER TABLE public.debts
  DROP CONSTRAINT IF EXISTS debts_event_participant_id_fkey;

ALTER TABLE public.debts
  ADD CONSTRAINT debts_event_participant_id_fkey
  FOREIGN KEY (event_participant_id)
  REFERENCES public.event_participants(id)
  ON DELETE CASCADE;

-- =====================================================
-- 2. PREVIEW ORPHANED DEBT (jalankan dulu, cek hasilnya)
-- =====================================================
-- Debt yang dibuat dari split bill tapi event-nya udah dihapus.
-- Ciri: event_participant_id NULL (karena SET NULL cascade lama)
--       + note pattern dari split bill creation
--       + belum lunas (biar debt yang udah lunas gak kehapus history-nya)

SELECT 
  d.id,
  d.name,
  d.type,
  d.note,
  d.status,
  d.outstanding,
  d.created_at
FROM public.debts d
WHERE d.event_participant_id IS NULL
  AND (d.note LIKE 'Split bill %' OR d.note LIKE '%Split bill %')
  AND d.status IN ('active', 'overdue')
ORDER BY d.created_at DESC;

-- =====================================================
-- 3. CLEANUP (uncomment setelah verifikasi preview)
-- =====================================================
-- DELETE FROM public.debts
-- WHERE event_participant_id IS NULL
--   AND (note LIKE 'Split bill %' OR note LIKE '%Split bill %')
--   AND status IN ('active', 'overdue');

-- =====================================================
-- 4. VERIFY
-- =====================================================
SELECT 'fk_constraint' AS cek, confdeltype AS info
FROM pg_constraint
WHERE conname = 'debts_event_participant_id_fkey';
-- Expected: 'c' (CASCADE)

SELECT 'orphaned_remaining' AS cek, COUNT(*)::text AS info
FROM public.debts
WHERE event_participant_id IS NULL
  AND (note LIKE 'Split bill %' OR note LIKE '%Split bill %')
  AND status IN ('active', 'overdue');
-- Expected: 0 (setelah cleanup)