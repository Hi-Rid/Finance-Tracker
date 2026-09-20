-- =====================================================
-- 001_core.sql
-- Core tables: profiles, settings, accounts, categories, tags, transactions
-- =====================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =====================================================
-- USER SETTINGS (extends auth.users)
-- =====================================================
create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pin_hash text,
  default_currency text not null default 'IDR',
  timezone text not null default 'Asia/Jakarta',
  theme text not null default 'system' check (theme in ('light','dark','system')),
  zakat_rate numeric(5,4) not null default 0.025,
  ppn_rate numeric(5,4) not null default 0.11,
  email_reminder_enabled boolean not null default true,
  email_reminder_frequency text not null default 'weekly',
  weekly_review_day int not null default 0, -- 0=Sunday
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================
-- PROFILES (multi-profile: personal, business)
-- =====================================================
create table public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('personal','business')) default 'personal',
  currency text not null default 'IDR',
  is_default boolean not null default false,
  icon text,
  color text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_user on public.profiles(user_id);

-- =====================================================
-- ACCOUNTS (dompet: cash, bank, ewallet, credit, paylater, investment)
-- =====================================================
create table public.accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('cash','bank','ewallet','credit','paylater','investment','other')),
  currency text not null default 'IDR',
  initial_balance numeric(18,2) not null default 0,
  current_balance numeric(18,2) not null default 0,
  color text,
  icon text,
  note text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_accounts_profile on public.accounts(profile_id);
create index idx_accounts_user on public.accounts(user_id);

-- =====================================================
-- CATEGORIES
-- =====================================================
create table public.categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income','expense')),
  group_name text not null check (group_name in ('needs','wants','invest','savings','debt','donation','tax','zakat','income','other')),
  icon text,
  color text,
  parent_id uuid references public.categories(id) on delete set null,
  sort_order int not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_categories_user on public.categories(user_id);
create index idx_categories_parent on public.categories(parent_id);

-- =====================================================
-- TAGS
-- =====================================================
create table public.tags (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  unique(user_id, name)
);

-- =====================================================
-- CONTACTS (orang: temen, keluarga, pacar, kolega)
-- =====================================================
create table public.contacts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  nickname text,
  phone text,
  email text,
  category text check (category in ('friend','family','partner','colleague','other')) default 'friend',
  avatar_url text,
  note text,
  is_partner boolean not null default false,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_contacts_user on public.contacts(user_id);

-- =====================================================
-- TRANSACTIONS
-- =====================================================
create table public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  date timestamptz not null default now(),
  name text not null,
  type text not null check (type in ('income','expense','transfer','refund','adjustment')),
  account_id uuid references public.accounts(id) on delete set null,
  to_account_id uuid references public.accounts(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  amount numeric(18,2) not null,
  currency text not null default 'IDR',
  amount_idr numeric(18,2) not null,
  exchange_rate numeric(18,6) default 1,
  merchant text,
  note text,
  ppn_amount numeric(18,2) default 0,
  pph_amount numeric(18,2) default 0,
  status text not null default 'cleared' check (status in ('cleared','pending')),
  is_recurring boolean not null default false,
  recurring_id uuid,
  exclude_from_budget boolean not null default false,
  exclude_from_daily_budget boolean not null default false,
  exclude_from_reports boolean not null default false,
  related_transaction_id uuid references public.transactions(id) on delete set null,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_transactions_user on public.transactions(user_id);
create index idx_transactions_profile on public.transactions(profile_id);
create index idx_transactions_date on public.transactions(date desc);
create index idx_transactions_account on public.transactions(account_id);
create index idx_transactions_category on public.transactions(category_id);
create index idx_transactions_type on public.transactions(type);
create index idx_transactions_deleted on public.transactions(is_deleted) where is_deleted = false;

-- =====================================================
-- TRANSACTION TAGS (many-to-many)
-- =====================================================
create table public.transaction_tags (
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (transaction_id, tag_id)
);

-- =====================================================
-- AUDIT LOGS
-- =====================================================
create table public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null check (action in ('create','update','delete','restore')),
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_user on public.audit_logs(user_id);
create index idx_audit_entity on public.audit_logs(entity_type, entity_id);
create index idx_audit_created on public.audit_logs(created_at desc);

-- =====================================================
-- TRIGGER: auto-update updated_at
-- =====================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_user_settings_updated before update on public.user_settings
  for each row execute function public.set_updated_at();
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_accounts_updated before update on public.accounts
  for each row execute function public.set_updated_at();
create trigger trg_categories_updated before update on public.categories
  for each row execute function public.set_updated_at();
create trigger trg_contacts_updated before update on public.contacts
  for each row execute function public.set_updated_at();
create trigger trg_transactions_updated before update on public.transactions
  for each row execute function public.set_updated_at();

-- =====================================================
-- TRIGGER: auto-create user_settings saat user baru signup
-- =====================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_settings (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();