-- =====================================================
-- 004_wishlist_recurring.sql
-- Wishlist, recurring, subscriptions, reminders
-- =====================================================

-- =====================================================
-- WISHLISTS
-- =====================================================
create table public.wishlists (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  category text,
  priority text check (priority in ('urgent','needs','wants','impulse')) default 'wants',
  target_price numeric(18,2) not null,
  currency text not null default 'IDR',
  link text,
  target_date date,
  reason text,
  mood text,
  alternatives text,
  decision_score int,
  decision_answers jsonb,
  saved_amount numeric(18,2) not null default 0,
  weekly_saving numeric(18,2),
  status text not null default 'planned' check (status in ('planned','cooling_off','saving','ready','purchased','cancelled')),
  cooling_off_until timestamptz,
  purchased_at timestamptz,
  purchased_transaction_id uuid references public.transactions(id) on delete set null,
  created_asset_id uuid,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_wishlists_profile on public.wishlists(profile_id);
create index idx_wishlists_status on public.wishlists(status);

-- =====================================================
-- WISHLIST SAVING PLANS
-- =====================================================
create table public.wishlist_saving_plans (
  id uuid primary key default uuid_generate_v4(),
  wishlist_id uuid not null references public.wishlists(id) on delete cascade,
  frequency text not null default 'weekly' check (frequency in ('daily','weekly','biweekly','monthly')),
  amount numeric(18,2) not null,
  start_date date not null default current_date,
  next_run_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_wishlist_plan_wishlist on public.wishlist_saving_plans(wishlist_id);

-- =====================================================
-- RECURRING
-- =====================================================
create table public.recurring (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income','expense','transfer')) default 'expense',
  account_id uuid references public.accounts(id) on delete set null,
  to_account_id uuid references public.accounts(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  amount numeric(18,2) not null,
  currency text not null default 'IDR',
  frequency text not null check (frequency in ('daily','weekly','monthly','yearly')),
  interval int not null default 1,
  start_date date not null default current_date,
  end_date date,
  next_run_at timestamptz not null,
  auto_create boolean not null default false,
  splits jsonb, -- [{account_id, percentage}]
  is_active boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_recurring_profile on public.recurring(profile_id);
create index idx_recurring_next_run on public.recurring(next_run_at) where is_active = true;

-- =====================================================
-- SUBSCRIPTIONS
-- =====================================================
create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  amount numeric(18,2) not null,
  currency text not null default 'IDR',
  cycle text not null check (cycle in ('weekly','monthly','quarterly','yearly')) default 'monthly',
  next_billing_date date not null,
  auto_renew boolean not null default true,
  worth_it boolean,
  last_reviewed_at timestamptz,
  account_id uuid references public.accounts(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  is_active boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_subscriptions_profile on public.subscriptions(profile_id);

-- =====================================================
-- REMINDERS
-- =====================================================
create table public.reminders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  entity_type text,
  entity_id uuid,
  title text not null,
  body text,
  remind_at timestamptz not null,
  channel text not null default 'email' check (channel in ('email','in_app')),
  sent_at timestamptz,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_reminders_user on public.reminders(user_id);
create index idx_reminders_remind_at on public.reminders(remind_at) where sent_at is null;

-- =====================================================
-- NOTIFICATIONS (in-app)
-- =====================================================
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  icon text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on public.notifications(user_id);
create index idx_notifications_unread on public.notifications(user_id, is_read) where is_read = false;

-- =====================================================
-- TRIGGERS
-- =====================================================
create trigger trg_wishlists_updated before update on public.wishlists
  for each row execute function public.set_updated_at();
create trigger trg_recurring_updated before update on public.recurring
  for each row execute function public.set_updated_at();
create trigger trg_subscriptions_updated before update on public.subscriptions
  for each row execute function public.set_updated_at();