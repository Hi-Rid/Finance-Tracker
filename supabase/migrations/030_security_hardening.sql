-- =====================================================
-- 030_security_hardening.sql
-- Audit & fix SECURITY DEFINER functions:
--   1. Cek kepemilikan (auth.uid() vs owner)
--   2. Kunci search_path
--   3. Revoke execute dari public/anon
--
-- Konteks: cron pakai service-role (auth.uid() = null) → lolos.
--         User biasa cuma boleh akses profil miliknya.
-- =====================================================

-- =====================================================
-- 1. get_cash_flow_history
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_cash_flow_history(
  p_profile_id uuid,
  p_months integer DEFAULT 12
)
RETURNS TABLE(month text, income numeric, expense numeric, net numeric)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
declare
  v_owner_id uuid;
  v_month text;
  v_month_start timestamptz;
  v_month_end timestamptz;
  v_income numeric;
  v_expense numeric;
  i int;
  v_base timestamp;
begin
  select user_id into v_owner_id from public.profiles where id = p_profile_id;
  if v_owner_id is null then return; end if;

  -- User biasa cuma boleh profilnya; service_role (auth.uid() null) boleh semua
  if auth.uid() is not null and auth.uid() <> v_owner_id then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  v_base := date_trunc('month', (now() at time zone 'Asia/Jakarta'));

  for i in 0..(p_months - 1) loop
    v_month_start := (v_base - make_interval(months => i)) at time zone 'Asia/Jakarta';
    v_month_end := (v_base - make_interval(months => i - 1)) at time zone 'Asia/Jakarta';
    v_month := to_char(v_base - make_interval(months => i), 'YYYY-MM');

    v_income := coalesce((
      select sum(amount_idr) from public.transactions
      where profile_id = p_profile_id
        and is_deleted = false
        and type = 'income'
        and date >= v_month_start
        and date < v_month_end
    ), 0);

    v_expense := coalesce((
      select sum(amount_idr) from public.transactions
      where profile_id = p_profile_id
        and is_deleted = false
        and type = 'expense'
        and date >= v_month_start
        and date < v_month_end
    ), 0);

    month := v_month;
    income := v_income;
    expense := v_expense;
    net := v_income - v_expense;
    return next;
  end loop;
end;
$function$;

revoke execute on function public.get_cash_flow_history(uuid, integer) from public, anon;
grant execute on function public.get_cash_flow_history(uuid, integer) to authenticated, service_role;

-- =====================================================
-- 2. get_net_worth_history
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_net_worth_history(
  p_profile_id uuid,
  p_months integer DEFAULT 12
)
RETURNS TABLE(month text, net_worth numeric)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
declare
  v_owner_id uuid;
  v_running numeric := 0;
  v_month text;
  v_delta numeric;
  i int;
begin
  select user_id into v_owner_id from public.profiles where id = p_profile_id;
  if v_owner_id is null then return; end if;

  if auth.uid() is not null and auth.uid() <> v_owner_id then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  -- Anchor bulan ini: accounts + assets - debts
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

revoke execute on function public.get_net_worth_history(uuid, integer) from public, anon;
grant execute on function public.get_net_worth_history(uuid, integer) to authenticated, service_role;

-- =====================================================
-- 3. upsert_net_worth_snapshot
-- =====================================================
CREATE OR REPLACE FUNCTION public.upsert_net_worth_snapshot(p_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
declare
  v_user_id uuid;
  v_month text;
  v_accounts numeric;
  v_assets numeric;
  v_debts numeric;
begin
  select user_id into v_user_id
    from public.profiles where id = p_profile_id;

  if v_user_id is null then return; end if;

  if auth.uid() is not null and auth.uid() <> v_user_id then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  v_month := to_char(now() at time zone 'Asia/Jakarta', 'YYYY-MM');

  select coalesce(sum(current_balance), 0) into v_accounts
    from public.accounts
   where profile_id = p_profile_id and is_archived = false;

  select coalesce(sum(current_value), 0) into v_assets
    from public.assets
   where profile_id = p_profile_id and is_archived = false;

  select coalesce(sum(outstanding), 0) into v_debts
    from public.debts
   where profile_id = p_profile_id and status = 'active';

  insert into public.net_worth_snapshots (
    user_id, profile_id, snapshot_month,
    net_worth, accounts_total, assets_total, debts_total
  ) values (
    v_user_id, p_profile_id, v_month,
    v_accounts + v_assets - v_debts,
    v_accounts, v_assets, v_debts
  )
  on conflict (profile_id, snapshot_month) do update
    set net_worth = excluded.net_worth,
        accounts_total = excluded.accounts_total,
        assets_total = excluded.assets_total,
        debts_total = excluded.debts_total;
end $$;

revoke execute on function public.upsert_net_worth_snapshot(uuid) from public, anon;
grant execute on function public.upsert_net_worth_snapshot(uuid) to authenticated, service_role;

-- =====================================================
-- 4. seed_default_categories
-- =====================================================
CREATE OR REPLACE FUNCTION public.seed_default_categories(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
begin
  -- Cegah user lain seed ke akun orang
  if auth.uid() is not null and auth.uid() <> p_user_id then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  insert into public.categories (user_id, name, type, group_name, icon, color, sort_order)
  values
    (p_user_id, 'Meals', 'expense', 'needs', 'UtensilsCrossed', '#334DAF', 1),
    (p_user_id, 'Coffee', 'expense', 'needs', 'Coffee', '#334DAF', 2),
    (p_user_id, 'Beverages', 'expense', 'needs', 'CupSoda', '#334DAF', 3),
    (p_user_id, 'Groceries', 'expense', 'needs', 'ShoppingBasket', '#334DAF', 4),
    (p_user_id, 'Vegetables', 'expense', 'needs', 'Salad', '#334DAF', 5),
    (p_user_id, 'Fruit', 'expense', 'needs', 'Apple', '#334DAF', 6),
    (p_user_id, 'Meat', 'expense', 'needs', 'Drumstick', '#334DAF', 7),
    (p_user_id, 'Snacks', 'expense', 'needs', 'Cookie', '#334DAF', 8),
    (p_user_id, 'Transport', 'expense', 'needs', 'Car', '#334DAF', 9),
    (p_user_id, 'Rent', 'expense', 'needs', 'Home', '#334DAF', 10),
    (p_user_id, 'Utilities', 'expense', 'needs', 'Zap', '#334DAF', 11),
    (p_user_id, 'Internet', 'expense', 'needs', 'Wifi', '#334DAF', 12),
    (p_user_id, 'Phone', 'expense', 'needs', 'Smartphone', '#334DAF', 13),
    (p_user_id, 'Hygiene', 'expense', 'needs', 'Sparkles', '#334DAF', 14),
    (p_user_id, 'Laundry', 'expense', 'needs', 'Shirt', '#334DAF', 15),
    (p_user_id, 'Medical', 'expense', 'needs', 'Pill', '#334DAF', 16),
    (p_user_id, 'Clothing', 'expense', 'wants', 'Shirt', '#f59e0b', 20),
    (p_user_id, 'Hobbies', 'expense', 'wants', 'Gamepad2', '#f59e0b', 21),
    (p_user_id, 'Entertainment', 'expense', 'wants', 'Music', '#f59e0b', 22),
    (p_user_id, 'Family', 'expense', 'wants', 'Users', '#f59e0b', 23),
    (p_user_id, 'Thrifting', 'expense', 'wants', 'ShoppingBag', '#f59e0b', 24),
    (p_user_id, 'Fitness', 'expense', 'wants', 'Dumbbell', '#f59e0b', 25),
    (p_user_id, 'Sports', 'expense', 'wants', 'Trophy', '#f59e0b', 26),
    (p_user_id, 'Gaming', 'expense', 'wants', 'Gamepad', '#f59e0b', 27),
    (p_user_id, 'Travel', 'expense', 'wants', 'Plane', '#f59e0b', 28),
    (p_user_id, 'Beauty', 'expense', 'wants', 'Palette', '#f59e0b', 29),
    (p_user_id, 'Shoes', 'expense', 'wants', 'Footprints', '#f59e0b', 30),
    (p_user_id, 'Hotel', 'expense', 'wants', 'Bed', '#f59e0b', 31),
    (p_user_id, 'Pets', 'expense', 'wants', 'PawPrint', '#f59e0b', 32),
    (p_user_id, 'Membership', 'expense', 'wants', 'BadgeCheck', '#f59e0b', 33),
    (p_user_id, 'Digital', 'expense', 'wants', 'Camera', '#f59e0b', 34),
    (p_user_id, 'Stocks', 'expense', 'invest', 'TrendingUp', '#10b981', 40),
    (p_user_id, 'Crypto', 'expense', 'invest', 'Bitcoin', '#10b981', 41),
    (p_user_id, 'Mutual Fund', 'expense', 'invest', 'LineChart', '#10b981', 42),
    (p_user_id, 'Gold', 'expense', 'invest', 'Coins', '#10b981', 43),
    (p_user_id, 'Bond', 'expense', 'invest', 'FileText', '#8b5cf6', 44),
    (p_user_id, 'Loan', 'expense', 'debt', 'HandCoins', '#ef4444', 50),
    (p_user_id, 'Paylater', 'expense', 'debt', 'CreditCard', '#ef4444', 51),
    (p_user_id, 'Biaya Transfer', 'expense', 'other', 'ArrowRightLeft', '#64748b', 90),
    (p_user_id, 'Split Bill', 'expense', 'other', 'Users', '#8b5cf6', 91),
    (p_user_id, 'Donation', 'expense', 'donation', 'Gift', '#ef4444', 60),
    (p_user_id, 'Tax', 'expense', 'tax', 'FileText', '#ef4444', 61),
    (p_user_id, 'Zakat', 'expense', 'zakat', 'Heart', '#ef4444', 62),
    (p_user_id, 'Other', 'expense', 'other', 'Circle', '#64748b', 99),
    (p_user_id, 'Salary', 'income', 'income', 'Wallet', '#10b981', 100),
    (p_user_id, 'Side Job', 'income', 'income', 'Briefcase', '#10b981', 101),
    (p_user_id, 'Bonus', 'income', 'income', 'Award', '#10b981', 102),
    (p_user_id, 'Dividend', 'income', 'income', 'LineChart', '#10b981', 103),
    (p_user_id, 'Gift', 'income', 'income', 'Gift', '#10b981', 104),
    (p_user_id, 'Transfer In', 'income', 'income', 'ArrowDownRight', '#10b981', 105),
    (p_user_id, 'Penyesuaian Saldo', 'income', 'other', 'Calculator', '#64748b', 106),
    (p_user_id, 'Settle Bill', 'income', 'income', 'HandCoins', '#8b5cf6', 107),
    (p_user_id, 'Other Income', 'income', 'income', 'Circle', '#10b981', 199);
end;
$function$;

revoke execute on function public.seed_default_categories(uuid) from public, anon;
grant execute on function public.seed_default_categories(uuid) to authenticated, service_role;

-- =====================================================
-- 5. Lock search_path untuk trigger helper & internal functions
-- (mereka gak nerima id dari klien, tapi tetap lock search_path)
-- =====================================================
alter function public.set_updated_at() set search_path = public, pg_temp;
alter function public.handle_new_user() set search_path = public, pg_temp;
alter function public.handle_new_user_profile() set search_path = public, pg_temp;
alter function public.change_account_balance(uuid, numeric, integer) set search_path = public, pg_temp;
alter function public.apply_transaction_effect(public.transactions) set search_path = public, pg_temp;
alter function public.revert_transaction_effect(public.transactions) set search_path = public, pg_temp;
alter function public.sync_transaction_balance() set search_path = public, pg_temp;
alter function public.log_audit() set search_path = public, pg_temp;
alter function public.cleanup_old_audit_logs() set search_path = public, pg_temp;
alter function public.get_shared_event(text) set search_path = public, pg_temp;
alter function public.cleanup_expired_share_links() set search_path = public, pg_temp;
alter function public.compute_ff_net_worth(uuid) set search_path = public, pg_temp;
alter function public.compute_ff_avg_expense(uuid) set search_path = public, pg_temp;
alter function public.check_ff_milestones(uuid) set search_path = public, pg_temp;
alter function public.trg_check_ff_milestones() set search_path = public, pg_temp;

-- Bersih-bersih: cleanup_old_audit_logs jangan bisa dipanggil user biasa
revoke execute on function public.cleanup_old_audit_logs() from public, anon, authenticated;
grant execute on function public.cleanup_old_audit_logs() to service_role;

-- cleanup_expired_share_links: internal cleanup, jangan dari klien
revoke execute on function public.cleanup_expired_share_links() from public, anon, authenticated;
grant execute on function public.cleanup_expired_share_links() to service_role;

-- =====================================================
-- 6. Verifikasi
-- =====================================================
select 'functions_with_search_path' as cek, count(*)::text as total
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef
  and array_to_string(p.proconfig, ',') like '%search_path=public%';