-- =====================================================
-- 024_ff_trigger_fix.sql
-- Fix FF milestone trigger:
-- 1. Include INSERT & DELETE (bukan cuma UPDATE)
-- 2. Rename pakai prefix zz_ biar fire SETELAH sync trigger
-- =====================================================

-- 1. Drop trigger lama
DROP TRIGGER IF EXISTS trg_ff_check_transactions ON public.transactions;
DROP TRIGGER IF EXISTS trg_ff_check_accounts ON public.accounts;
DROP TRIGGER IF EXISTS trg_ff_check_assets ON public.assets;
DROP TRIGGER IF EXISTS trg_ff_check_debts ON public.debts;

-- 2. Recreate dengan prefix zz_ (fire last) + semua operasi
CREATE TRIGGER zz_ff_check_transactions
  AFTER INSERT OR UPDATE OR DELETE
  ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_check_ff_milestones();

CREATE TRIGGER zz_ff_check_accounts
  AFTER INSERT OR UPDATE OR DELETE
  ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_check_ff_milestones();

CREATE TRIGGER zz_ff_check_assets
  AFTER INSERT OR UPDATE OR DELETE
  ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_check_ff_milestones();

CREATE TRIGGER zz_ff_check_debts
  AFTER INSERT OR UPDATE OR DELETE
  ON public.debts
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_check_ff_milestones();

-- 3. Verify — harus muncul 4 trigger dengan prefix zz_
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname LIKE 'zz_ff_check_%' AND NOT tgisinternal
ORDER BY tgname;