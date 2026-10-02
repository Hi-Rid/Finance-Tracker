-- =====================================================
-- 028_goals_envelope.sql
-- Goals pakai envelope system
-- =====================================================

-- 1. Add envelope_account_id ke goals
ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS envelope_account_id uuid
    REFERENCES public.accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_goals_envelope
  ON public.goals(envelope_account_id)
  WHERE envelope_account_id IS NOT NULL;

-- 2. Add linked_goal_id ke accounts
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS linked_goal_id uuid
    REFERENCES public.goals(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_accounts_linked_goal
  ON public.accounts(linked_goal_id)
  WHERE linked_goal_id IS NOT NULL;

-- 3. Extend internal_ref_type constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'transactions_internal_ref_type_check'
  ) THEN
    ALTER TABLE public.transactions
      DROP CONSTRAINT transactions_internal_ref_type_check;
  END IF;
END $$;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_internal_ref_type_check
  CHECK (
    internal_ref_type IS NULL
    OR internal_ref_type IN (
      'envelope_deposit',
      'envelope_withdraw',
      'envelope_cancel',
      'wishlist_purchase',
      'goal_deposit',
      'goal_withdraw',
      'goal_cancel'
    )
  );

-- 4. Backfill: create envelope accounts untuk goal existing
DO $$
DECLARE
  g record;
  new_envelope_id uuid;
BEGIN
  FOR g IN
    SELECT * FROM public.goals
    WHERE envelope_account_id IS NULL
      AND status = 'active'
  LOOP
    INSERT INTO public.accounts (
      user_id, profile_id, name, type, currency,
      initial_balance, current_balance,
      linked_goal_id, is_archived
    ) VALUES (
      g.user_id, g.profile_id,
      'Envelope: ' || g.name,
      'envelope', g.currency,
      g.current_amount, g.current_amount,
      g.id, false
    )
    RETURNING id INTO new_envelope_id;

    UPDATE public.goals
    SET envelope_account_id = new_envelope_id
    WHERE id = g.id;
  END LOOP;
END $$;

-- Verify
SELECT 'goals_col' AS cek, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'goals'
  AND column_name = 'envelope_account_id'
UNION ALL
SELECT 'accounts_col', column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'accounts'
  AND column_name = 'linked_goal_id'
UNION ALL
SELECT 'envelope_count', COUNT(*)::text
FROM public.accounts WHERE type = 'envelope' AND linked_goal_id IS NOT NULL;