-- =====================================================
-- 020_wishlist_envelope.sql
-- Envelope as virtual account for wishlist saving
-- =====================================================

-- 1. Add 'envelope' to accounts.type constraint
ALTER TABLE public.accounts 
  DROP CONSTRAINT IF EXISTS accounts_type_check;

ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_type_check 
  CHECK (type IN (
    'cash', 'bank', 'ewallet', 'credit', 'paylater', 
    'investment', 'other', 'envelope'
  ));

-- 2. Add linked_wishlist_id to accounts
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS linked_wishlist_id uuid 
    REFERENCES public.wishlists(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_accounts_linked_wishlist
  ON public.accounts(linked_wishlist_id)
  WHERE linked_wishlist_id IS NOT NULL;

-- 3. Add envelope_account_id to wishlists
ALTER TABLE public.wishlists
  ADD COLUMN IF NOT EXISTS envelope_account_id uuid 
    REFERENCES public.accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_wishlists_envelope_account
  ON public.wishlists(envelope_account_id)
  WHERE envelope_account_id IS NOT NULL;

-- 4. Mark old envelope_id as deprecated
COMMENT ON COLUMN public.wishlists.envelope_id IS 
  'DEPRECATED: use envelope_account_id (references accounts).';

-- 5. Backfill existing wishlists with saved_amount > 0
DO $$
DECLARE
  w record;
  new_envelope_id uuid;
BEGIN
  FOR w IN 
    SELECT * FROM wishlists 
    WHERE envelope_account_id IS NULL 
      AND saved_amount > 0
      AND status NOT IN ('purchased', 'cancelled')
  LOOP
    INSERT INTO accounts (
      user_id, profile_id, name, type, currency,
      initial_balance, current_balance, 
      linked_wishlist_id, is_archived
    ) VALUES (
      w.user_id, w.profile_id,
      'Envelope: ' || w.name,
      'envelope', w.currency,
      w.saved_amount, w.saved_amount,
      w.id, false
    )
    RETURNING id INTO new_envelope_id;

    UPDATE wishlists 
    SET envelope_account_id = new_envelope_id 
    WHERE id = w.id;
  END LOOP;
END $$;

-- 6. Verify
SELECT 'accounts_envelope' AS cek, COUNT(*)::text AS total
FROM accounts WHERE type = 'envelope';

SELECT 'wishlists_linked' AS cek, COUNT(*)::text AS total
FROM wishlists WHERE envelope_account_id IS NOT NULL;