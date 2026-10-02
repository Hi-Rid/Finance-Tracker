-- =====================================================
-- 032_consent_and_audit_fk.sql
-- Consent tracking + audit FK cascade ke auth.users
-- =====================================================

-- =====================================================
-- 1. Consent columns di profiles
-- =====================================================
alter table public.profiles
  add column if not exists consented_at timestamptz,
  add column if not exists consent_version text;

create index if not exists idx_profiles_consented
  on public.profiles(consented_at)
  where consented_at is not null;

-- =====================================================
-- 2. Consent version constant (buat tracking)
-- =====================================================
-- Versi kebijakan privasi. Bump kalau isi /privacy berubah signifikan.
create or replace function public.current_consent_version()
returns text
language sql
immutable
as $$ select 'v1.0-2026-10'::text $$;

-- =====================================================
-- 3. Verifikasi FK cascade ke auth.users
-- Jalankan manual di SQL Editor, cek semua confdeltype = 'c'
-- =====================================================
-- Query ini cuma buat lihat. Kalau ada yang bukan 'c', kabarin gua.
select
  conrelid::regclass::text as tabel,
  confdeltype::text as cascade_type,
  case confdeltype
    when 'c' then 'CASCADE ✓'
    when 'a' then 'NO ACTION ✗'
    when 'r' then 'RESTRICT ✗'
    when 'n' then 'SET NULL ✗'
    when 'd' then 'SET DEFAULT ✗'
    else 'UNKNOWN ✗'
  end as status
from pg_constraint
where contype = 'f'
  and confrelid = 'auth.users'::regclass
order by tabel;

-- =====================================================
-- 4. Verifikasi consent columns
-- =====================================================
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name in ('consented_at', 'consent_version')
order by column_name;