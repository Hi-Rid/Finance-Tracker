-- =====================================================
-- 021_budget_name.sql
-- Tambah kolom `name` di budgets + ubah unique constraint
-- =====================================================

-- 1. Tambah kolom name
ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS name text;

-- 2. Backfill dari category existing
UPDATE public.budgets b
SET name = COALESCE(c.name, 'Budget')
FROM public.categories c
WHERE b.category_id = c.id AND b.name IS NULL;

-- 3. Fallback kalau category null
UPDATE public.budgets
SET name = 'Budget'
WHERE name IS NULL;

-- 4. Set NOT NULL
ALTER TABLE public.budgets
  ALTER COLUMN name SET NOT NULL;

-- 5. Drop old unique constraint
ALTER TABLE public.budgets
  DROP CONSTRAINT IF EXISTS budgets_profile_id_category_id_month_key;

-- 6. Bikin unique baru: (profile_id, name, month)
-- Bikin idempotent - cek dulu kalau udah ada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'budgets_profile_name_month_unique'
  ) THEN
    ALTER TABLE public.budgets
      ADD CONSTRAINT budgets_profile_name_month_unique
      UNIQUE (profile_id, name, month);
  END IF;
END $$;

-- Verify
SELECT 'budgets_columns' AS cek, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'budgets'
  AND column_name IN ('name', 'category_id');