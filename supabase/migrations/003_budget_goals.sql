-- =====================================================
-- 003_budget_goals.sql
-- Budget, envelope, goals, daily budget
-- =====================================================

-- =====================================================
-- BUDGETS (bulanan, per kategori)
-- =====================================================
create table public.budgets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  month text not null, -- format: YYYY-MM
  amount numeric(18,2) not null,
  currency text not null default 'IDR',
  rollover boolean not null default false,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id, category_id, month)
);

create index idx_budgets_profile_month on public.budgets(profile_id, month);

-- =====================================================
-- ENVELOPES (kantong real — ala Jago)
-- =====================================================
create table public.envelopes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  icon text,
  color text,
  target_amount numeric(18,2),
  current_balance numeric(18,2) not null default 0,
  carry_over boolean not null default false,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_envelopes_profile on public.envelopes(profile_id);

-- =====================================================
-- ENVELOPE TRANSACTIONS (in/out dari envelope)
-- =====================================================
create table public.envelope_transactions (
  id uuid primary key default uuid_generate_v4(),
  envelope_id uuid not null references public.envelopes(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete set null,
  type text not null check (type in ('in','out','adjustment')),
  amount numeric(18,2) not null,
  note text,
  created_at timestamptz not null default now()
);

create index idx_envelope_tx_envelope on public.envelope_transactions(envelope_id);

-- =====================================================
-- DAILY BUDGET ITEMS (config per-item harian)
-- =====================================================
create table public.daily_budget_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  category_id uuid references public.categories(id) on delete set null,
  amount numeric(18,2) not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_daily_budget_profile on public.daily_budget_items(profile_id);
create index idx_daily_budget_active on public.daily_budget_items(is_active) where is_active = true;

-- =====================================================
-- GOALS
-- =====================================================
create table public.goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('emergency','vacation','house','education','retirement','custom')) default 'custom',
  target_amount numeric(18,2) not null,
  current_amount numeric(18,2) not null default 0,
  currency text not null default 'IDR',
  target_date date,
  account_id uuid references public.accounts(id) on delete set null,
  icon text,
  color text,
  status text not null default 'active' check (status in ('active','achieved','cancelled')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_goals_profile on public.goals(profile_id);
create index idx_goals_status on public.goals(status);

-- =====================================================
-- GOAL CONTRIBUTIONS
-- =====================================================
create table public.goal_contributions (
  id uuid primary key default uuid_generate_v4(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  date timestamptz not null default now(),
  amount numeric(18,2) not null,
  account_id uuid references public.accounts(id) on delete set null,
  transaction_id uuid references public.transactions(id) on delete set null,
  type text not null default 'deposit' check (type in ('deposit','withdrawal')),
  note text,
  created_at timestamptz not null default now()
);

create index idx_goal_contrib_goal on public.goal_contributions(goal_id);

-- =====================================================
-- TRIGGERS
-- =====================================================
create trigger trg_budgets_updated before update on public.budgets
  for each row execute function public.set_updated_at();
create trigger trg_envelopes_updated before update on public.envelopes
  for each row execute function public.set_updated_at();
create trigger trg_daily_budget_updated before update on public.daily_budget_items
  for each row execute function public.set_updated_at();
create trigger trg_goals_updated before update on public.goals
  for each row execute function public.set_updated_at();