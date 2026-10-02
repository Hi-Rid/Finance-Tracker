-- =====================================================
-- 033_consent_via_metadata.sql
-- Capture consent dari register flow via raw_user_meta_data
-- =====================================================

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_consented_at timestamptz;
  v_consent_version text;
begin
  -- Baca consent dari metadata yang dikirim saat signUp()
  v_consented_at := nullif(NEW.raw_user_meta_data->>'consented_at', '')::timestamptz;
  v_consent_version := NEW.raw_user_meta_data->>'consent_version';

  insert into public.profiles (
    user_id, name, type, currency, is_default,
    consented_at, consent_version
  )
  values (
    NEW.id, 'Personal', 'personal', 'IDR', true,
    v_consented_at, v_consent_version
  )
  on conflict do nothing;

  insert into public.user_settings (user_id)
  values (NEW.id)
  on conflict do nothing;

  begin
    perform public.seed_default_categories(NEW.id);
  exception when others then
    raise warning 'Failed to seed categories for %: %', NEW.id, sqlerrm;
  end;

  return NEW;
end;
$$;

-- Verifikasi
select 'trigger_updated' as cek, proname
from pg_proc
where proname = 'handle_new_user_profile'
  and prosecdef = true;