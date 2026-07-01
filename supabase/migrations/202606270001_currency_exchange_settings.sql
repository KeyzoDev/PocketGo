begin;

alter table public.profiles
  add column if not exists usd_to_idr_rate numeric(14, 4) not null default 17000,
  add column if not exists exchange_rate_source text not null default 'fallback',
  add column if not exists exchange_rate_updated_at timestamptz;

alter table public.profiles drop constraint if exists profiles_exchange_rate_source_check;
alter table public.profiles add constraint profiles_exchange_rate_source_check
  check (exchange_rate_source in ('realtime', 'manual', 'fallback'));

alter table public.transactions
  add column if not exists currency text,
  add column if not exists exchange_rate numeric(14, 6),
  add column if not exists amount_in_base_currency numeric(14, 2);

alter table public.transactions drop constraint if exists transactions_currency_check;
alter table public.transactions add constraint transactions_currency_check
  check (currency is null or currency in ('IDR', 'USD', 'EUR', 'SGD', 'MYR', 'JPY', 'AUD'));

commit;
