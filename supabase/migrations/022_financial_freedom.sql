-- =====================================================
-- 022_financial_freedom.sql
-- Financial Freedom / FIRE feature
-- 5 tabel: settings, snapshots, insights, milestones, action_steps
-- Idempotent: aman dijalankan berulang.
-- =====================================================

-- =====================================================
-- 1. FINANCIAL_FREEDOM_SETTINGS (1 row per profile)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.financial_freedom_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- FI config
  fi_type text NOT NULL DEFAULT 'regular'
    CHECK (fi_type IN ('lean', 'regular', 'fat', 'custom')),
  fi_multiplier numeric(5,2) NOT NULL DEFAULT 25,

  -- Override expense/income (null = auto compute dari data)
  monthly_expense_override numeric(18,2),
  monthly_income_override numeric(18,2),

  -- Assumptions
  expected_return_rate numeric(5,4) NOT NULL DEFAULT 0.10,
  inflation_rate numeric(5,4) NOT NULL DEFAULT 0.03,

  -- Age
  current_age int CHECK (current_age IS NULL OR (current_age >= 0 AND current_age <= 120)),
  target_retire_age int CHECK (target_retire_age IS NULL OR (target_retire_age >= 0 AND target_retire_age <= 120)),

  -- Onboarding
  onboarding_completed boolean NOT NULL DEFAULT false,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(profile_id)
);

CREATE INDEX IF NOT EXISTS idx_ff_settings_user
  ON public.financial_freedom_settings(user_id);

-- =====================================================
-- 2. FINANCIAL_FREEDOM_SNAPSHOTS (bulanan)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.financial_freedom_snapshots (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  snapshot_month text NOT NULL,  -- YYYY-MM

  net_worth numeric(18,2) NOT NULL,
  fi_number numeric(18,2) NOT NULL,
  fi_progress numeric(5,2) NOT NULL,
  savings_rate numeric(5,4) NOT NULL,

  -- Progress per tipe FI (untuk chart multi-line)
  lean_fi_progress numeric(5,2),
  regular_fi_progress numeric(5,2),
  fat_fi_progress numeric(5,2),
  coast_fi_progress numeric(5,2),

  estimated_fi_date date,
  monthly_expense numeric(18,2) NOT NULL,
  monthly_income numeric(18,2) NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(profile_id, snapshot_month)
);

CREATE INDEX IF NOT EXISTS idx_ff_snapshots_profile_month
  ON public.financial_freedom_snapshots(profile_id, snapshot_month DESC);

-- =====================================================
-- 3. FINANCIAL_FREEDOM_INSIGHTS (AI Advisor output)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.financial_freedom_insights (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  generated_at timestamptz NOT NULL DEFAULT now(),

  -- Structured insight
  overall_status text,
  savings_rate_analysis text,
  improvements jsonb,  -- array of { title, description, impact_estimate }
  next_milestone text,
  next_milestone_amount numeric(18,2),
  next_milestone_gap numeric(18,2),
  raw_ai_response jsonb,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ff_insights_profile_generated
  ON public.financial_freedom_insights(profile_id, generated_at DESC);

-- =====================================================
-- 4. FINANCIAL_FREEDOM_MILESTONES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.financial_freedom_milestones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  milestone_type text NOT NULL
    CHECK (milestone_type IN ('fi_10', 'fi_25', 'fi_50', 'fi_75', 'coast_fi', 'fi_100')),
  milestone_label text NOT NULL,
  target_amount numeric(18,2) NOT NULL,
  achieved_at timestamptz,
  is_notified boolean NOT NULL DEFAULT false,

  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(profile_id, milestone_type)
);

CREATE INDEX IF NOT EXISTS idx_ff_milestones_profile
  ON public.financial_freedom_milestones(profile_id);

-- =====================================================
-- 5. FINANCIAL_FREEDOM_ACTION_STEPS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.financial_freedom_action_steps (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  title text NOT NULL,
  description text,
  impact_estimate text,  -- "FI cepet 8 bulan"
  is_done boolean NOT NULL DEFAULT false,
  done_at timestamptz,
  sort_order int NOT NULL DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ff_action_profile_sort
  ON public.financial_freedom_action_steps(profile_id, sort_order);

-- =====================================================
-- 6. RLS POLICIES
-- =====================================================
ALTER TABLE public.financial_freedom_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_freedom_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_freedom_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_freedom_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_freedom_action_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_ff_settings" ON public.financial_freedom_settings;
CREATE POLICY "users_own_ff_settings" ON public.financial_freedom_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_own_ff_snapshots" ON public.financial_freedom_snapshots;
CREATE POLICY "users_own_ff_snapshots" ON public.financial_freedom_snapshots
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_own_ff_insights" ON public.financial_freedom_insights;
CREATE POLICY "users_own_ff_insights" ON public.financial_freedom_insights
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_own_ff_milestones" ON public.financial_freedom_milestones;
CREATE POLICY "users_own_ff_milestones" ON public.financial_freedom_milestones
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_own_ff_action_steps" ON public.financial_freedom_action_steps;
CREATE POLICY "users_own_ff_action_steps" ON public.financial_freedom_action_steps
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 7. TRIGGERS: updated_at + audit
-- =====================================================

-- Updated_at untuk settings
DROP TRIGGER IF EXISTS trg_ff_settings_updated ON public.financial_freedom_settings;
CREATE TRIGGER trg_ff_settings_updated
  BEFORE UPDATE ON public.financial_freedom_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Audit trigger untuk 5 tabel baru
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'financial_freedom_settings',
    'financial_freedom_snapshots',
    'financial_freedom_insights',
    'financial_freedom_milestones',
    'financial_freedom_action_steps'
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

-- =====================================================
-- 8. VERIFY
-- =====================================================
SELECT 'tables' AS cek, table_name AS info
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'financial_freedom%'
ORDER BY table_name;

SELECT 'policies' AS cek, count(*)::text AS info
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename LIKE 'financial_freedom%';

SELECT 'triggers' AS cek, count(*)::text AS info
FROM pg_trigger
WHERE tgrelid::regclass::text LIKE 'financial_freedom%'
  AND tgname NOT LIKE 'RI_%';