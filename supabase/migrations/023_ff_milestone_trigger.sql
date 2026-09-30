-- =====================================================
-- 023_ff_milestone_trigger.sql
-- Realtime milestone check via DB trigger
-- =====================================================

-- 1. Kolom baru untuk track dismissal modal FI achieved
ALTER TABLE public.financial_freedom_settings
  ADD COLUMN IF NOT EXISTS fi_achieved_dismissed_at timestamptz;

-- 2. Function: compute investable net worth
CREATE OR REPLACE FUNCTION public.compute_ff_net_worth(p_profile_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    COALESCE((
      SELECT SUM(current_balance)
      FROM public.accounts
      WHERE profile_id = p_profile_id AND is_archived = false
    ), 0)
    + COALESCE((
      SELECT SUM(current_value)
      FROM public.assets
      WHERE profile_id = p_profile_id
        AND is_archived = false
        AND type IN ('stock', 'crypto', 'mutual_fund', 'gold', 'bond')
    ), 0)
    - COALESCE((
      SELECT SUM(outstanding)
      FROM public.debts
      WHERE profile_id = p_profile_id AND status = 'active'
    ), 0);
$$;

-- 3. Function: compute avg expense 3 bulan
CREATE OR REPLACE FUNCTION public.compute_ff_avg_expense(p_profile_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_total numeric;
  v_start timestamptz;
  v_end timestamptz;
BEGIN
  v_start := (date_trunc('month', (now() at time zone 'Asia/Jakarta')) - interval '3 months') at time zone 'Asia/Jakarta';
  v_end := (date_trunc('month', (now() at time zone 'Asia/Jakarta')) + interval '1 month') at time zone 'Asia/Jakarta';

  SELECT COALESCE(SUM(amount_idr), 0)
    INTO v_total
    FROM public.transactions
   WHERE profile_id = p_profile_id
     AND is_deleted = false
     AND type = 'expense'
     AND exclude_from_reports = false
     AND date >= v_start
     AND date < v_end;

  RETURN v_total / 3.0;
END;
$$;

-- 4. Main function: cek & notif milestone
CREATE OR REPLACE FUNCTION public.check_ff_milestones(p_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_settings record;
  v_user_id uuid;
  v_net_worth numeric;
  v_expense numeric;
  v_fi_number numeric;
  v_coast_fi_number numeric;
  v_real_return numeric;
  v_years_to_retire int;
  v_milestone_types text[] := ARRAY['fi_10', 'fi_25', 'fi_50', 'fi_75', 'coast_fi', 'fi_100'];
  v_milestone_labels text[] := ARRAY['10% FI', '25% FI', '50% FI', '75% FI', 'Coast FI', 'Financial Independence'];
  v_milestone_emojis text[] := ARRAY['🌱', '🌿', '🌳', '🏔️', '⛵', '👑'];
  v_milestone_descs text[] := ARRAY[
    'Langkah pertama. 10% dari target FI.',
    'Seperempat jalan. Mulai kelihatan.',
    'Setengah jalan! Momentum udah kuat.',
    'Tinggal 25% lagi. Hampir sampai.',
    'Udah cukup. Compounding yang kerja, bukan lu.',
    'Selamat! Lu udah financially independent.'
  ];
  v_target numeric;
  v_type text;
  v_label text;
  v_emoji text;
  v_desc text;
  v_idx int;
  v_existing record;
  v_formatted_target text;
BEGIN
  -- Settings
  SELECT * INTO v_settings
    FROM public.financial_freedom_settings
   WHERE profile_id = p_profile_id
     AND onboarding_completed = true
   LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_user_id := v_settings.user_id;

  -- Net worth
  v_net_worth := public.compute_ff_net_worth(p_profile_id);

  -- Expense
  IF v_settings.monthly_expense_override IS NOT NULL AND v_settings.monthly_expense_override > 0 THEN
    v_expense := v_settings.monthly_expense_override;
  ELSE
    v_expense := public.compute_ff_avg_expense(p_profile_id);
  END IF;

  IF v_expense <= 0 THEN
    RETURN;
  END IF;

  -- FI Number
  v_fi_number := v_expense * 12 * v_settings.fi_multiplier;

  -- Coast FI
  v_coast_fi_number := NULL;
  IF v_settings.current_age IS NOT NULL
     AND v_settings.target_retire_age IS NOT NULL
     AND v_settings.target_retire_age > v_settings.current_age THEN
    v_real_return := v_settings.expected_return_rate - v_settings.inflation_rate;
    IF v_real_return > 0 THEN
      v_years_to_retire := v_settings.target_retire_age - v_settings.current_age;
      v_coast_fi_number := v_fi_number / POWER(1 + v_real_return, v_years_to_retire);
    END IF;
  END IF;

  -- Loop milestones
  FOR v_idx IN 1..6 LOOP
    v_type := v_milestone_types[v_idx];
    v_label := v_milestone_labels[v_idx];
    v_emoji := v_milestone_emojis[v_idx];
    v_desc := v_milestone_descs[v_idx];

    -- Target amount
    IF v_type = 'fi_10' THEN v_target := v_fi_number * 0.10;
    ELSIF v_type = 'fi_25' THEN v_target := v_fi_number * 0.25;
    ELSIF v_type = 'fi_50' THEN v_target := v_fi_number * 0.50;
    ELSIF v_type = 'fi_75' THEN v_target := v_fi_number * 0.75;
    ELSIF v_type = 'coast_fi' THEN
      IF v_coast_fi_number IS NULL THEN CONTINUE; END IF;
      v_target := v_coast_fi_number;
    ELSIF v_type = 'fi_100' THEN v_target := v_fi_number;
    END IF;

    v_target := ROUND(v_target);

    -- Upsert milestone
    INSERT INTO public.financial_freedom_milestones (
      user_id, profile_id, milestone_type, milestone_label, target_amount, achieved_at, is_notified
    )
    VALUES (
      v_user_id, p_profile_id, v_type, v_label, v_target,
      CASE WHEN v_net_worth >= v_target THEN now() ELSE NULL END,
      false
    )
    ON CONFLICT (profile_id, milestone_type) DO UPDATE
      SET target_amount = EXCLUDED.target_amount,
          achieved_at = COALESCE(
            public.financial_freedom_milestones.achieved_at,
            CASE WHEN v_net_worth >= EXCLUDED.target_amount THEN now() ELSE NULL END
          );

    -- Ambil state terkini
    SELECT * INTO v_existing
      FROM public.financial_freedom_milestones
     WHERE profile_id = p_profile_id
       AND milestone_type = v_type;

    -- Baru achieved & belum notified
    IF v_existing.achieved_at IS NOT NULL
       AND v_existing.is_notified = false THEN

      v_formatted_target := 'Rp ' || to_char(v_target, 'FM999,999,999,999');

      INSERT INTO public.notifications (
        user_id, type, title, body, link, icon, dedup_key
      )
      VALUES (
        v_user_id,
        'milestone_achieved',
        v_emoji || ' ' || v_label || ' tercapai!',
        'Net worth lu udah lewat ' || v_formatted_target || '. ' || v_desc,
        '/financial-freedom',
        'crown',
        'ff_milestone:' || p_profile_id::text || ':' || v_type
      )
      ON CONFLICT (user_id, dedup_key) DO NOTHING;

      UPDATE public.financial_freedom_milestones
         SET is_notified = true
       WHERE id = v_existing.id;
    END IF;
  END LOOP;
END;
$$;

-- 5. Master trigger function
CREATE OR REPLACE FUNCTION public.trg_check_ff_milestones()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_profile_id := OLD.profile_id;
  ELSE
    v_profile_id := NEW.profile_id;
  END IF;

  IF v_profile_id IS NOT NULL THEN
    PERFORM public.check_ff_milestones(v_profile_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 6. Drop existing triggers (idempotent)
DROP TRIGGER IF EXISTS trg_ff_check_transactions ON public.transactions;
DROP TRIGGER IF EXISTS trg_ff_check_accounts ON public.accounts;
DROP TRIGGER IF EXISTS trg_ff_check_assets ON public.assets;
DROP TRIGGER IF EXISTS trg_ff_check_debts ON public.debts;

-- 7. Create triggers
CREATE TRIGGER trg_ff_check_transactions
  AFTER INSERT OR UPDATE OR DELETE
  ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_check_ff_milestones();

CREATE TRIGGER trg_ff_check_accounts
  AFTER UPDATE OF current_balance
  ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_check_ff_milestones();

CREATE TRIGGER trg_ff_check_assets
  AFTER INSERT OR UPDATE OR DELETE
  ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_check_ff_milestones();

CREATE TRIGGER trg_ff_check_debts
  AFTER INSERT OR UPDATE OR DELETE
  ON public.debts
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_check_ff_milestones();

-- 8. Verify
SELECT 'ff_triggers' AS cek, count(*)::text AS total
FROM pg_trigger
WHERE tgname LIKE 'trg_ff_check_%' AND NOT tgisinternal;
-- Expected: 4