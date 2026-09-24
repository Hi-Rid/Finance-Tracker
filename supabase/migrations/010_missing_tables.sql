-- =====================================================
-- 010_missing_tables.sql
-- Bikin table yang ada di Supabase remote tapi gak ada
-- di migration 001-008. Idempotent (IF NOT EXISTS).
-- Dibuat: 2026-09-24
-- =====================================================

-- =====================================================
-- BUDGET_PERIODS — income per bulan
-- =====================================================
create table if not exists public.budget_periods (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  month text not null,
  income numeric(18,2) not null default 0,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id, month)
);

create index if not exists idx_budget_periods_profile_month
  on public.budget_periods(profile_id, month);

-- RLS
alter table public.budget_periods enable row level security;

drop policy if exists "users_own_budget_periods" on public.budget_periods;
create policy "users_own_budget_periods" on public.budget_periods
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =====================================================
-- RECEIPTS — struk OCR
-- =====================================================
create table if not exists public.receipts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  transaction_id uuid references public.transactions(id) on delete set null,
  request_file_id text,
  signed_url text,
  signed_url_long text,
  raw_ocr_response jsonb,
  parsed_data jsonb,
  confidence numeric(5,4),
  provider text default 'nanonets',
  status text not null default 'success',
  error_message text,
  file_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_receipts_user on public.receipts(user_id);
create index if not exists idx_receipts_transaction on public.receipts(transaction_id);

-- RLS
alter table public.receipts enable row level security;

drop policy if exists "users_own_receipts" on public.receipts;
create policy "users_own_receipts" on public.receipts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =====================================================
-- NOTE: Audit & updated_at trigger untuk 2 table ini
-- udah ke-cover di migration 009.
-- =====================================================