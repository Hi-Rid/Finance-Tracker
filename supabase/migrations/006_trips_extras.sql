-- =====================================================
-- 006_trips_extras.sql
-- Travel trips, gifts, milestones, currencies, exchange rates
-- =====================================================

-- =====================================================
-- TRIPS
-- =====================================================
create table public.trips (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  destination text,
  start_date date not null,
  end_date date,
  budget_total numeric(18,2) not null default 0,
  currency text not null default 'IDR',
  status text not null default 'planning' check (status in ('planning','ongoing','completed','cancelled')),
  icon text,
  color text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_trips_profile on public.trips(profile_id);
create index idx_trips_status on public.trips(status);

-- =====================================================
-- TRIP MEMBERS
-- =====================================================
create table public.trip_members (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  is_user boolean not null default false,
  display_name text not null,
  created_at timestamptz not null default now()
);

create index idx_trip_members_trip on public.trip_members(trip_id);

-- =====================================================
-- TRIP BUDGET ITEMS (per kategori)
-- =====================================================
create table public.trip_budget_items (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  category text not null,
  budget_amount numeric(18,2) not null default 0,
  actual_amount numeric(18,2) not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_trip_budget_trip on public.trip_budget_items(trip_id);

-- =====================================================
-- TRIP CHECKLIST
-- =====================================================
create table public.trip_checklist_items (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null,
  type text not null default 'task' check (type in ('task','buy','booking')),
  is_done boolean not null default false,
  due_date date,
  wishlist_id uuid references public.wishlists(id) on delete set null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_trip_checklist_trip on public.trip_checklist_items(trip_id);

-- =====================================================
-- GIFTS
-- =====================================================
create table public.gifts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  direction text not null check (direction in ('given','received')) default 'given',
  name text not null,
  value numeric(18,2) not null default 0,
  currency text not null default 'IDR',
  date date not null default current_date,
  occasion text,
  transaction_id uuid references public.transactions(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index idx_gifts_user on public.gifts(user_id);
create index idx_gifts_contact on public.gifts(contact_id);

-- =====================================================
-- MILESTONES
-- =====================================================
create table public.milestones (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'net_worth',
  target_amount numeric(18,2) not null,
  achieved_at timestamptz,
  is_notified boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_milestones_user on public.milestones(user_id);

-- =====================================================
-- CURRENCIES
-- =====================================================
create table public.currencies (
  code text primary key,
  name text not null,
  symbol text not null,
  decimal_places int not null default 2
);

-- =====================================================
-- EXCHANGE RATES
-- =====================================================
create table public.exchange_rates (
  id uuid primary key default uuid_generate_v4(),
  from_currency text not null references public.currencies(code),
  to_currency text not null references public.currencies(code),
  rate numeric(18,6) not null,
  fetched_at timestamptz not null default now(),
  source text default 'manual',
  unique(from_currency, to_currency, fetched_at)
);

create index idx_exchange_rates_pair on public.exchange_rates(from_currency, to_currency, fetched_at desc);

-- =====================================================
-- TRIGGERS
-- =====================================================
create trigger trg_trips_updated before update on public.trips
  for each row execute function public.set_updated_at();