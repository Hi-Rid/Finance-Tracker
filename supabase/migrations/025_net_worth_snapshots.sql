-- =====================================================
-- 025_net_worth_snapshots.sql
-- Snapshot bulanan net worth - biar chart akurat
-- =====================================================

CREATE TABLE IF NOT EXISTS public.net_worth_snapshots (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  snapshot_month text NOT NULL,
  net_worth numeric(18,2) NOT NULL,

  accounts_total numeric(18,2) NOT NULL DEFAULT 0,
  assets_total numeric(18,2) NOT NULL DEFAULT 0,
  debts_total numeric(18,2) NOT NULL DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(profile_id, snapshot_month)
);

CREATE INDEX IF NOT EXISTS idx_nw_snapshots_profile_month
  ON public.net_worth_snapshots(profile_id, snapshot_month DESC);

ALTER TABLE public.net_worth_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_nw_snapshots" ON public.net_worth_snapshots;
CREATE POLICY "users_own_nw_snapshots" ON public.net_worth_snapshots
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RPC: compute & upsert snapshot bulan ini untuk 1 profile
CREATE OR REPLACE FUNCTION public.upsert_net_worth_snapshot(p_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_month text;
  v_accounts numeric;
  v_assets numeric;
  v_debts numeric;
BEGIN
  SELECT user_id INTO v_user_id
    FROM public.profiles WHERE id = p_profile_id;

  IF v_user_id IS NULL THEN RETURN; END IF;

  v_month := to_char(now() at time zone 'Asia/Jakarta', 'YYYY-MM');

  SELECT COALESCE(SUM(current_balance), 0) INTO v_accounts
    FROM public.accounts
   WHERE profile_id = p_profile_id AND is_archived = false;

  SELECT COALESCE(SUM(current_value), 0) INTO v_assets
    FROM public.assets
   WHERE profile_id = p_profile_id AND is_archived = false;

  SELECT COALESCE(SUM(outstanding), 0) INTO v_debts
    FROM public.debts
   WHERE profile_id = p_profile_id AND status = 'active';

  INSERT INTO public.net_worth_snapshots (
    user_id, profile_id, snapshot_month,
    net_worth, accounts_total, assets_total, debts_total
  ) VALUES (
    v_user_id, p_profile_id, v_month,
    v_accounts + v_assets - v_debts,
    v_accounts, v_assets, v_debts
  )
  ON CONFLICT (profile_id, snapshot_month) DO UPDATE
    SET net_worth = EXCLUDED.net_worth,
        accounts_total = EXCLUDED.accounts_total,
        assets_total = EXCLUDED.assets_total,
        debts_total = EXCLUDED.debts_total;
END;
$$;

-- Verify
SELECT 'table' AS cek, COUNT(*)::text AS info
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'net_worth_snapshots'
UNION ALL
SELECT 'function', COUNT(*)::text
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'upsert_net_worth_snapshot';