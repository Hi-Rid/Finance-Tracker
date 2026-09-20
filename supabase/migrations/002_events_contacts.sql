-- =====================================================
-- 002_events_contacts.sql
-- Split bill events, items, shares, contact ledger
-- =====================================================

-- =====================================================
-- EVENTS (split bill event)
-- =====================================================
create table public.events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  date timestamptz not null default now(),
  payer_id uuid references public.contacts(id) on delete set null,
  payer_is_user boolean not null default true,
  ppn_rate numeric(5,4) not null default 0,
  service_rate numeric(5,4) not null default 0,
  discount_amount numeric(18,2) not null default 0,
  subtotal numeric(18,2) not null default 0,
  ppn_amount numeric(18,2) not null default 0,
  service_amount numeric(18,2) not null default 0,
  grand_total numeric(18,2) not null default 0,
  user_share numeric(18,2) not null default 0,
  account_id uuid references public.accounts(id) on delete set null,
  transaction_id uuid references public.transactions(id) on delete set null,
  currency text not null default 'IDR',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_events_user on public.events(user_id);
create index idx_events_profile on public.events(profile_id);
create index idx_events_date on public.events(date desc);

-- =====================================================
-- EVENT PARTICIPANTS
-- =====================================================
create table public.event_participants (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references public.events(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  is_user boolean not null default false,
  display_name text not null,
  subtotal numeric(18,2) not null default 0,
  ppn_share numeric(18,2) not null default 0,
  service_share numeric(18,2) not null default 0,
  discount_share numeric(18,2) not null default 0,
  total_share numeric(18,2) not null default 0,
  paid boolean not null default false,
  paid_at timestamptz,
  settled_transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_event_participants_event on public.event_participants(event_id);
create index idx_event_participants_contact on public.event_participants(contact_id);

-- =====================================================
-- EVENT ITEMS (item-level detail)
-- =====================================================
create table public.event_items (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(18,2) not null,
  subtotal numeric(18,2) not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_event_items_event on public.event_items(event_id);

-- =====================================================
-- EVENT ITEM SHARES (siapa makan item apa)
-- =====================================================
create table public.event_item_shares (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid not null references public.event_items(id) on delete cascade,
  participant_id uuid not null references public.event_participants(id) on delete cascade,
  share_amount numeric(18,2) not null,
  created_at timestamptz not null default now()
);

create index idx_event_item_shares_item on public.event_item_shares(item_id);
create index idx_event_item_shares_participant on public.event_item_shares(participant_id);

-- =====================================================
-- DEBTS (utang / piutang)
-- =====================================================
create table public.debts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  type text not null check (type in ('debt','receivable')) default 'debt',
  name text not null,
  principal numeric(18,2) not null,
  outstanding numeric(18,2) not null,
  interest_rate numeric(5,4) not null default 0,
  currency text not null default 'IDR',
  start_date date not null default current_date,
  due_date date,
  tenor_months int,
  monthly_payment numeric(18,2),
  status text not null default 'active' check (status in ('active','paid','overdue','cancelled')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_debts_user on public.debts(user_id);
create index idx_debts_profile on public.debts(profile_id);

-- =====================================================
-- DEBT PAYMENTS
-- =====================================================
create table public.debt_payments (
  id uuid primary key default uuid_generate_v4(),
  debt_id uuid not null references public.debts(id) on delete cascade,
  date timestamptz not null default now(),
  amount numeric(18,2) not null,
  account_id uuid references public.accounts(id) on delete set null,
  transaction_id uuid references public.transactions(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index idx_debt_payments_debt on public.debt_payments(debt_id);

-- =====================================================
-- TRIGGERS
-- =====================================================
create trigger trg_events_updated before update on public.events
  for each row execute function public.set_updated_at();
create trigger trg_debts_updated before update on public.debts
  for each row execute function public.set_updated_at();