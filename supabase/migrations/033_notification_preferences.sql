-- =====================================================
-- 033_notification_preferences.sql
-- Preferensi notifikasi per tipe + AI toggle + quiet hours
-- =====================================================

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,

  -- In-app notifications per type
  cooling_off_done boolean not null default true,
  saving_ready boolean not null default true,
  budget_alert boolean not null default true,
  bill_reminder boolean not null default true,
  piutang_due boolean not null default true,
  milestone_achieved boolean not null default true,
  weekly_review boolean not null default true,

  -- AI features toggle (kirim data ke Groq)
  ai_enabled boolean not null default true,

  -- Quiet hours (jam tenang — gak ada notif)
  quiet_hours_enabled boolean not null default false,
  quiet_hours_start time not null default '22:00',
  quiet_hours_end time not null default '07:00',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.notification_preferences enable row level security;

drop policy if exists "users_own_notification_prefs" on public.notification_preferences;
create policy "users_own_notification_prefs" on public.notification_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Trigger updated_at
drop trigger if exists trg_notification_prefs_updated on public.notification_preferences;
create trigger trg_notification_prefs_updated
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

-- Auto-create row saat user baru signup
create or replace function public.handle_new_user_notification_prefs()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_notif_prefs on auth.users;
create trigger on_auth_user_created_notif_prefs
  after insert on auth.users
  for each row execute function public.handle_new_user_notification_prefs();

-- Backfill untuk user existing
insert into public.notification_preferences (user_id)
select id from auth.users
on conflict (user_id) do nothing;

-- Audit trigger
drop trigger if exists audit_notification_preferences on public.notification_preferences;
create trigger audit_notification_preferences
  after insert or update or delete on public.notification_preferences
  for each row execute function public.log_audit();

-- Verify
select 'notif_prefs_table' as cek, count(*)::text as total
from public.notification_preferences;