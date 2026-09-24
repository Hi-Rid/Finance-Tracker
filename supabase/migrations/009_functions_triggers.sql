-- =====================================================
-- 009_functions_triggers.sql
-- Backup functions & triggers dari Supabase remote.
-- Semua idempotent (CREATE OR REPLACE / DROP IF EXISTS).
-- Dibuat: 2026-09-24
-- =====================================================

-- =====================================================
-- SECTION 1: HELPER FUNCTIONS
-- =====================================================

-- Update `updated_at` otomatis
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

-- =====================================================
-- SECTION 2: AUTH TRIGGERS (user baru signup)
-- =====================================================

-- Insert user_settings saat user baru
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
begin
  insert into public.user_settings (user_id) values (new.id);
  return new;
end;
$function$;

-- Insert profile + user_settings + seed categories
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
begin
  insert into public.profiles (user_id, name, type, currency, is_default)
  values (new.id, 'Personal', 'personal', 'IDR', true)
  on conflict do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict do nothing;

  begin
    perform public.seed_default_categories(new.id);
  exception when others then
    raise warning 'Failed to seed categories for %: %', new.id, sqlerrm;
  end;

  return new;
end;
$function$;

-- Seed 50+ default categories
CREATE OR REPLACE FUNCTION public.seed_default_categories(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
begin
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
    (p_user_id, 'Loan', 'expense', 'debt', 'HandCoins', '#ef4444', 50),
    (p_user_id, 'Paylater', 'expense', 'debt', 'CreditCard', '#ef4444', 51),
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
    (p_user_id, 'Other Income', 'income', 'income', 'Circle', '#10b981', 199);
end;
$function$;

-- =====================================================
-- SECTION 3: BALANCE SYNC (core logic saldo akun)
-- =====================================================

CREATE OR REPLACE FUNCTION public.change_account_balance(
  p_account_id uuid,
  p_amount numeric,
  p_multiplier integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
begin
  if p_account_id is not null then
    update accounts
    set current_balance = current_balance + (p_amount * p_multiplier)
    where id = p_account_id;
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.apply_transaction_effect(t transactions)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
begin
  if t.type = 'expense' then
    perform public.change_account_balance(t.account_id, t.amount_idr, -1);
  elsif t.type = 'income' then
    perform public.change_account_balance(t.account_id, t.amount_idr, 1);
  elsif t.type = 'refund' then
    perform public.change_account_balance(t.account_id, t.amount_idr, 1);
  elsif t.type = 'adjustment' then
    perform public.change_account_balance(t.account_id, t.amount_idr, 1);
  elsif t.type = 'transfer' then
    perform public.change_account_balance(t.account_id, t.amount_idr, -1);
    perform public.change_account_balance(t.to_account_id, t.amount_idr, 1);
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.revert_transaction_effect(t transactions)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
begin
  if t.type = 'expense' then
    perform public.change_account_balance(t.account_id, t.amount_idr, 1);
  elsif t.type = 'income' then
    perform public.change_account_balance(t.account_id, t.amount_idr, -1);
  elsif t.type = 'refund' then
    perform public.change_account_balance(t.account_id, t.amount_idr, -1);
  elsif t.type = 'adjustment' then
    perform public.change_account_balance(t.account_id, t.amount_idr, -1);
  elsif t.type = 'transfer' then
    perform public.change_account_balance(t.account_id, t.amount_idr, 1);
    perform public.change_account_balance(t.to_account_id, t.amount_idr, -1);
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.sync_transaction_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
begin
  if TG_OP = 'INSERT' then
    if NEW.is_deleted = false then
      perform public.apply_transaction_effect(NEW);
    end if;
  elsif TG_OP = 'UPDATE' then
    if OLD.is_deleted = false then
      perform public.revert_transaction_effect(OLD);
    end if;
    if NEW.is_deleted = false then
      perform public.apply_transaction_effect(NEW);
    end if;
  elsif TG_OP = 'DELETE' then
    if OLD.is_deleted = false then
      perform public.revert_transaction_effect(OLD);
    end if;
  end if;
  return coalesce(NEW, OLD);
end;
$function$;

-- =====================================================
-- SECTION 4: AUDIT LOG
-- =====================================================

CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
declare
  v_new_json jsonb;
  v_old_json jsonb;
  v_user_id uuid;
  v_profile_id uuid;
  v_entity_id uuid;
  v_action text;
  v_old_del boolean;
  v_new_del boolean;
  v_old_arch boolean;
  v_new_arch boolean;
begin
  if TG_OP != 'DELETE' then
    v_new_json := to_jsonb(NEW);
  end if;
  if TG_OP != 'INSERT' then
    v_old_json := to_jsonb(OLD);
  end if;

  if TG_OP = 'INSERT' then
    v_action := 'create';
  elsif TG_OP = 'UPDATE' then
    if (v_new_json ? 'is_deleted') and (v_old_json ? 'is_deleted') then
      v_old_del := coalesce((v_old_json ->> 'is_deleted')::boolean, false);
      v_new_del := coalesce((v_new_json ->> 'is_deleted')::boolean, false);

      if v_old_del = false and v_new_del = true then
        v_action := 'delete';
      elsif v_old_del = true and v_new_del = false then
        v_action := 'restore';
      end if;
    end if;

    if v_action is null
       and (v_new_json ? 'is_archived')
       and (v_old_json ? 'is_archived') then
      v_old_arch := coalesce((v_old_json ->> 'is_archived')::boolean, false);
      v_new_arch := coalesce((v_new_json ->> 'is_archived')::boolean, false);

      if v_old_arch = false and v_new_arch = true then
        v_action := 'archive';
      elsif v_old_arch = true and v_new_arch = false then
        v_action := 'unarchive';
      end if;
    end if;

    if v_action is null then
      v_action := 'update';
    end if;
  elsif TG_OP = 'DELETE' then
    v_action := 'delete';
  end if;

  if v_new_json ? 'user_id' then
    v_user_id := nullif(v_new_json ->> 'user_id', 'null')::uuid;
  elsif v_old_json ? 'user_id' then
    v_user_id := nullif(v_old_json ->> 'user_id', 'null')::uuid;
  end if;

  if v_new_json ? 'profile_id' then
    v_profile_id := nullif(v_new_json ->> 'profile_id', 'null')::uuid;
  elsif v_old_json ? 'profile_id' then
    v_profile_id := nullif(v_old_json ->> 'profile_id', 'null')::uuid;
  end if;

  if v_new_json ? 'id' then
    v_entity_id := nullif(v_new_json ->> 'id', 'null')::uuid;
  elsif v_old_json ? 'id' then
    v_entity_id := nullif(v_old_json ->> 'id', 'null')::uuid;
  end if;

  if v_user_id is not null then
    insert into public.audit_logs (
      user_id, profile_id, entity_type, entity_id,
      action, old_data, new_data
    ) values (
      v_user_id, v_profile_id, TG_TABLE_NAME, v_entity_id,
      v_action, v_old_json, v_new_json
    );
  end if;

  return coalesce(NEW, OLD);
end;
$function$;

-- Cleanup audit > 90 hari (butuh pg_cron untuk jalan otomatis)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
declare
  v_deleted integer;
begin
  delete from public.audit_logs
  where created_at < now() - interval '90 days';

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$function$;

-- =====================================================
-- SECTION 5: RPC UNTUK DASHBOARD
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_cash_flow_history(
  p_profile_id uuid,
  p_months integer DEFAULT 12
)
RETURNS TABLE(month text, income numeric, expense numeric, net numeric)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
declare
  v_month text;
  v_month_start timestamptz;
  v_month_end timestamptz;
  v_income numeric;
  v_expense numeric;
  i int;
  v_base timestamp;
begin
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
  select coalesce(sum(current_balance), 0)
    into v_running
    from public.accounts
   where profile_id = p_profile_id;

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

-- =====================================================
-- SECTION 6: TRIGGERS
-- =====================================================

-- -------- 6a. AUTH TRIGGERS --------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- -------- 6b. BALANCE SYNC --------
DROP TRIGGER IF EXISTS trg_sync_transaction_balance ON public.transactions;
CREATE TRIGGER trg_sync_transaction_balance
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.sync_transaction_balance();

-- -------- 6c. AUDIT TRIGGERS (23 tabel) --------
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'accounts','assets','budget_periods','budgets','categories','contacts',
    'daily_budget_items','debts','documents','envelopes','events','gifts',
    'goals','profiles','receipts','recurring','subscriptions','tags',
    'tax_records','transactions','trips','wishlists','zakat_records'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_%I ON public.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_audit()',
      t, t
    );
  END LOOP;
END $$;

-- -------- 6d. UPDATED_AT TRIGGERS (19 tabel) --------
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'accounts','assets','budget_periods','budgets','categories','contacts',
    'daily_budget_items','debts','documents','envelopes','events',
    'goals','profiles','recurring','subscriptions','transactions','trips',
    'user_settings','wishlists'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated ON public.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      t, t
    );
  END LOOP;
END $$;

-- =====================================================
-- SELESAI. Semua functions & triggers dari remote
-- udah ke-backup ke migrations.
-- =====================================================