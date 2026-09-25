-- =====================================================
-- 011_asset_prices.sql
-- Cache harga aset (saham, crypto, dll) + update net worth
-- Idempotent: aman dijalankan berulang.
-- Dibuat: 2026-09-25
-- =====================================================

-- =====================================================
-- SECTION 1: ASSET_PRICES (cache harga, TTL 15 menit)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.asset_prices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  price numeric(18,4) NOT NULL,
  currency text NOT NULL DEFAULT 'IDR',
  source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('yahoo', 'coingecko', 'manual')),
  fetched_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asset_prices_asset_fetched
  ON public.asset_prices(asset_id, fetched_at DESC);

-- RLS: child table via assets
ALTER TABLE public.asset_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_asset_prices" ON public.asset_prices;
CREATE POLICY "users_own_asset_prices" ON public.asset_prices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.assets a
      WHERE a.id = asset_prices.asset_id AND a.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assets a
      WHERE a.id = asset_prices.asset_id AND a.user_id = auth.uid()
    )
  );

-- =====================================================
-- SECTION 2: UPDATE get_net_worth_history
-- Opsi A: bulan ini include assets + debts, bulan lalu tetap formula lama.
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_net_worth_history(
  p_profile_id uuid,
  p_months integer DEFAULT 12
)
RETURNS TABLE(month text, net_worth numeric)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
declare
  v_running numeric := 0;
  v_month text;
  v_delta numeric;
  i int;
begin
  -- ============ Anchor bulan ini: accounts + assets - debts ============
  select coalesce(sum(current_balance), 0)
    into v_running
    from public.accounts
   where profile_id = p_profile_id;

  v_running := v_running + coalesce((
    select sum(current_value) from public.assets
    where profile_id = p_profile_id and is_archived = false
  ), 0);

  v_running := v_running - coalesce((
    select sum(outstanding) from public.debts
    where profile_id = p_profile_id and status = 'active'
  ), 0);

  v_month := to_char(now() at time zone 'Asia/Jakarta', 'YYYY-MM');

  for i in 0..(p_months - 1) loop
    month := v_month;
    net_worth := v_running;
    return next;

    -- ============ Reverse pakai delta accounts (formula lama) ============
    v_delta := 0;

    v_delta := v_delta + coalesce((
      select sum(
        case
          when type = 'income' then amount_idr
          when type = 'expense' then -amount_idr
          when type = 'refund' then amount_idr
          when type = 'adjustment' then amount_idr
          else 0
        end
      )
      from public.transactions
      where profile_id = p_profile_id
        and is_deleted = false
        and to_char(date at time zone 'Asia/Jakarta', 'YYYY-MM') = v_month
    ), 0);

    v_delta := v_delta + coalesce((
      select sum(initial_balance)
      from public.accounts
      where profile_id = p_profile_id
        and to_char(created_at at time zone 'Asia/Jakarta', 'YYYY-MM') = v_month
    ), 0);

    v_running := v_running - v_delta;
    v_month := to_char((to_date(v_month || '-01', 'YYYY-MM-DD') - interval '1 month'), 'YYYY-MM');
  end loop;
end;
$function$;

-- =====================================================
-- DONE
-- =====================================================