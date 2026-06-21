begin;

alter table public.profiles
  add column if not exists preferred_language text not null default 'id-ID',
  add column if not exists locale text not null default 'id-ID',
  add column if not exists country_code text not null default 'ID';

alter table public.categories
  add column if not exists localization_key text;

alter table public.profiles drop constraint if exists profiles_preferred_language_check;
alter table public.profiles add constraint profiles_preferred_language_check
  check (preferred_language in ('id-ID', 'en-US'));

alter table public.profiles drop constraint if exists profiles_locale_check;
alter table public.profiles add constraint profiles_locale_check
  check (locale in ('id-ID', 'en-US'));

alter table public.profiles drop constraint if exists profiles_country_code_check;
alter table public.profiles add constraint profiles_country_code_check
  check (country_code in ('ID', 'US', 'GLOBAL'));

update public.categories set localization_key = case lower(name)
  when 'makanan & minuman' then 'food_drinks'
  when 'makan & minum' then 'food_drinks'
  when 'belanja harian' then 'groceries'
  when 'belanja dapur' then 'groceries'
  when 'transportasi' then 'transport'
  when 'transport' then 'transport'
  when 'tagihan' then 'bills'
  when 'tempat tinggal' then 'housing'
  when 'kesehatan' then 'health'
  when 'dukungan keluarga' then 'family'
  when 'pembayaran utang' then 'debt_payment'
  when 'paylater' then 'bnpl'
  when 'belanja' then 'shopping'
  when 'hiburan' then 'entertainment'
  when 'pendidikan' then 'education'
  when 'langganan' then 'subscription'
  when 'darurat' then 'emergency'
  when 'biaya admin' then 'fees'
  when 'gaji' then 'salary'
  when 'penghasilan usaha' then 'business_income'
  when 'freelance' then 'freelance'
  when 'bonus' then 'bonus'
  when 'hadiah' then 'gift'
  when 'cashback' then 'cashback'
  when 'uang saku' then 'allowance'
  when 'penyesuaian saldo' then 'balance_adjustment'
  else localization_key
end
where localization_key is null and is_default = true;

commit;
