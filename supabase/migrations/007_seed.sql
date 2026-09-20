-- =====================================================
-- 007_seed.sql
-- Seed data: currencies, milestones template
-- =====================================================

-- Currencies
insert into public.currencies (code, name, symbol, decimal_places) values
  ('IDR', 'Indonesian Rupiah', 'Rp', 0),
  ('USD', 'US Dollar', '$', 2),
  ('SGD', 'Singapore Dollar', 'S$', 2),
  ('EUR', 'Euro', '€', 2),
  ('JPY', 'Japanese Yen', '¥', 0),
  ('MYR', 'Malaysian Ringgit', 'RM', 2),
  ('GBP', 'British Pound', '£', 2)
on conflict (code) do nothing;

-- Exchange rate default (IDR base)
insert into public.exchange_rates (from_currency, to_currency, rate, source) values
  ('USD', 'IDR', 15800, 'seed'),
  ('SGD', 'IDR', 11800, 'seed'),
  ('EUR', 'IDR', 17200, 'seed'),
  ('JPY', 'IDR', 105, 'seed'),
  ('MYR', 'IDR', 3500, 'seed'),
  ('GBP', 'IDR', 20000, 'seed')
on conflict do nothing;