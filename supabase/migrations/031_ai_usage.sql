-- =====================================================
-- 031_ai_usage.sql
-- Rate limit AI/OCR per user per hari
-- =====================================================

create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null,
  day date not null default ((now() at time zone 'Asia/Jakarta')::date),
  used int not null default 0,
  primary key (user_id, feature, day)
);

create index if not exists idx_ai_usage_user_day on public.ai_usage(user_id, day);

alter table public.ai_usage enable row level security;

drop policy if exists "own_ai_usage_read" on public.ai_usage;
create policy "own_ai_usage_read" on public.ai_usage
  for select using (auth.uid() = user_id);

create or replace function public.consume_ai_quota(p_feature text, p_limit int)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_used int;
begin
  if auth.uid() is null then
    return false;
  end if;

  insert into public.ai_usage (user_id, feature, day, used)
  values (auth.uid(), p_feature, (now() at time zone 'Asia/Jakarta')::date, 1)
  on conflict (user_id, feature, day)
  do update set used = public.ai_usage.used + 1
  returning used into v_used;

  return v_used <= p_limit;
end $$;

revoke execute on function public.consume_ai_quota(text, int) from public, anon;
grant execute on function public.consume_ai_quota(text, int) to authenticated;

select 'ai_usage_ready' as cek, count(*)::text as total from public.ai_usage;