-- =====================================================
-- 005_assets_investments.sql
-- Assets, investment details, valuations, taxes, zakat
-- =====================================================

-- =====================================================
-- ASSETS
-- =====================================================
create table public.assets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('property','vehicle','gold','stock','crypto','mutual_fund','collectible','other')),
  purchase_date date,
  purchase_price numeric(18,2) not null default 0,
  currency text not null default 'IDR',
  quantity numeric(18,4) not null default 1,
  unit text,
  current_value numeric(18,2) not null default 0,
  current_value_updated_at timestamptz,
  depreciation_method text check (depreciation_method in ('none','straight_line','declining','manual')) default 'none',
  depreciation_rate numeric(5,4) default 0,
  account_id uuid references public.accounts(id) on delete set null,
  is_liquid boolean not null default false,
  icon text,
  color text,
  note text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_assets_profile on public.assets(profile_id);
create index idx_assets_type on public.assets(type);

-- =====================================================
-- ASSET VALUATIONS
-- =====================================================
create table public.asset_valuations (
  id uuid primary key default uuid_generate_v4(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  date date not null default current_date,
  value numeric(18,2) not null,
  note text,
  created_at timestamptz not null default now()
);

create index idx_asset_val_asset on public.asset_valuations(asset_id);

-- =====================================================
-- INVESTMENT DETAILS (extends assets untuk saham/crypto/reksadana)
-- =====================================================
create table public.investment_details (
  id uuid primary key default uuid_generate_v4(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  ticker text,
  exchange text,
  lot numeric(18,4),
  avg_price numeric(18,4),
  equity numeric(18,2),
  broker text,
  custodian text,
  wallet_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_investment_asset on public.investment_details(asset_id);
create index idx_investment_ticker on public.investment_details(ticker);

-- =====================================================
-- INVESTMENT TRANSACTIONS (buy/sell/dividend)
-- =====================================================
create table public.investment_transactions (
  id uuid primary key default uuid_generate_v4(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  date timestamptz not null default now(),
  type text not null check (type in ('buy','sell','dividend','split','bonus')),
  quantity numeric(18,4) not null default 0,
  price numeric(18,4) not null default 0,
  amount numeric(18,2) not null default 0,
  fee numeric(18,2) not null default 0,
  note text,
  transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_investment_tx_asset on public.investment_transactions(asset_id);

-- =====================================================
-- TAX RECORDS
-- =====================================================
create table public.tax_records (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  period text not null, -- YYYY-MM
  type text not null check (type in ('ppn','pph','other')),
  amount numeric(18,2) not null,
  paid_at timestamptz,
  account_id uuid references public.accounts(id) on delete set null,
  transaction_id uuid references public.transactions(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index idx_tax_profile_period on public.tax_records(profile_id, period);

-- =====================================================
-- ZAKAT RECORDS
-- =====================================================
create table public.zakat_records (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  period text not null,
  base_amount numeric(18,2) not null,
  rate numeric(5,4) not null default 0.025,
  amount numeric(18,2) not null,
  paid_at timestamptz,
  account_id uuid references public.accounts(id) on delete set null,
  transaction_id uuid references public.transactions(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

-- =====================================================
-- DOCUMENTS (metadata only)
-- =====================================================
create table public.documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('insurance','certificate','contract','warranty','other')) default 'other',
  related_asset_id uuid references public.assets(id) on delete set null,
  issuer text,
  number text,
  start_date date,
  end_date date,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_documents_user on public.documents(user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================
create trigger trg_assets_updated before update on public.assets
  for each row execute function public.set_updated_at();
create trigger trg_documents_updated before update on public.documents
  for each row execute function public.set_updated_at();