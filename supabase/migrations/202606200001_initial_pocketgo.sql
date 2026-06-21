begin;

create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'wallet_type'
  ) then
    create type public.wallet_type as enum (
      'cash', 'bank', 'ewallet', 'credit_card', 'paylater',
      'savings', 'investment', 'business', 'loan', 'other'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'transaction_type'
  ) then
    create type public.transaction_type as enum (
      'income', 'expense', 'transfer_out', 'transfer_in', 'adjustment'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'category_type'
  ) then
    create type public.category_type as enum ('income', 'expense', 'transfer', 'system');
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'recurring_type'
  ) then
    create type public.recurring_type as enum (
      'income', 'expense', 'transfer', 'debt_payment', 'subscription'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'frequency_type'
  ) then
    create type public.frequency_type as enum ('daily', 'weekly', 'monthly', 'yearly', 'custom');
  end if;
end
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  currency text not null default 'IDR',
  budget_start_day smallint not null default 1 check (budget_start_day between 1 and 28),
  default_income_day smallint check (default_income_day between 1 and 28),
  income_pattern text not null default 'monthly',
  theme text not null default 'system',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  currency text not null default 'IDR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member', 'viewer')),
  status text not null default 'invited' check (status in ('invited', 'active', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create or replace function public.is_active_household_member(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members
    where household_id = target_household_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  household_id uuid references public.households(id) on delete set null,
  name text not null check (char_length(name) between 1 and 80),
  type public.wallet_type not null,
  balance numeric(18,2) not null default 0,
  starting_balance numeric(18,2) not null default 0,
  currency text not null default 'IDR',
  icon text,
  color text,
  include_in_total boolean not null default true,
  is_archived boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null check (char_length(name) between 1 and 80),
  type public.category_type not null,
  parent_id uuid references public.categories(id) on delete set null,
  icon text,
  color text,
  is_default boolean not null default false,
  is_archived boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recurring_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  household_id uuid references public.households(id) on delete set null,
  name text not null,
  type public.recurring_type not null,
  amount numeric(18,2) not null check (amount > 0),
  wallet_id uuid references public.wallets(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  frequency public.frequency_type not null,
  interval_count integer not null default 1 check (interval_count > 0),
  start_date date not null default current_date,
  end_date date,
  next_due_date date not null,
  auto_post boolean not null default false,
  reminder_days_before integer not null default 3 check (reminder_days_before >= 0),
  status text not null default 'active' check (status in ('active', 'paused', 'ended')),
  merchant text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  household_id uuid references public.households(id) on delete set null,
  wallet_id uuid not null references public.wallets(id) on delete restrict,
  category_id uuid references public.categories(id) on delete set null,
  type public.transaction_type not null,
  amount numeric(18,2) not null check (amount > 0),
  adjustment_direction text check (
    adjustment_direction is null or adjustment_direction in ('increase', 'decrease')
  ),
  transaction_date date not null default current_date,
  merchant text,
  note text,
  tags text[] not null default '{}',
  attachment_url text,
  transfer_group_id uuid,
  related_wallet_id uuid references public.wallets(id) on delete restrict,
  recurring_rule_id uuid references public.recurring_rules(id) on delete set null,
  is_recurring_generated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transfer_shape check (
    (
      type in ('transfer_out', 'transfer_in')
      and transfer_group_id is not null
      and related_wallet_id is not null
      and related_wallet_id <> wallet_id
    )
    or
    (
      type not in ('transfer_out', 'transfer_in')
      and transfer_group_id is null
    )
  ),
  constraint adjustment_shape check (
    (type = 'adjustment' and adjustment_direction is not null)
    or (type <> 'adjustment' and adjustment_direction is null)
  )
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  household_id uuid references public.households(id) on delete set null,
  name text not null,
  period_start date not null,
  period_end date not null check (period_end >= period_start),
  total_limit numeric(18,2) not null check (total_limit > 0),
  mode text not null default 'simple',
  rollover boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.budget_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  budget_id uuid not null references public.budgets(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  planned_amount numeric(18,2) not null check (planned_amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  household_id uuid references public.households(id) on delete set null,
  name text not null,
  type text not null default 'custom',
  target_amount numeric(18,2) not null check (target_amount > 0),
  current_amount numeric(18,2) not null default 0 check (current_amount >= 0),
  target_date date,
  monthly_contribution numeric(18,2) not null default 0 check (monthly_contribution >= 0),
  linked_wallet_id uuid references public.wallets(id) on delete set null,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete set null,
  amount numeric(18,2) not null check (amount > 0),
  contribution_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  household_id uuid references public.households(id) on delete set null,
  name text not null,
  type text not null,
  lender text,
  original_amount numeric(18,2) not null check (original_amount > 0),
  remaining_balance numeric(18,2) not null check (remaining_balance >= 0),
  interest_rate numeric(8,4),
  installment_amount numeric(18,2) not null default 0 check (installment_amount >= 0),
  minimum_payment numeric(18,2) not null default 0 check (minimum_payment >= 0),
  due_day smallint check (due_day between 1 and 28),
  start_date date,
  end_date date,
  linked_wallet_id uuid references public.wallets(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'paid', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.debt_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  debt_id uuid not null references public.debts(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete set null,
  amount numeric(18,2) not null check (amount > 0),
  principal_amount numeric(18,2) check (principal_amount >= 0),
  interest_amount numeric(18,2) check (interest_amount >= 0),
  payment_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  household_id uuid references public.households(id) on delete set null,
  name text not null,
  amount numeric(18,2) not null check (amount > 0),
  wallet_id uuid references public.wallets(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  billing_cycle text not null default 'monthly',
  next_billing_date date not null,
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled')),
  merchant text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  household_id uuid references public.households(id) on delete set null,
  name text not null,
  type text not null,
  value numeric(18,2) not null check (value >= 0),
  acquisition_value numeric(18,2) check (acquisition_value >= 0),
  linked_wallet_id uuid references public.wallets(id) on delete set null,
  include_in_net_worth boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.advisor_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  title text not null,
  body text not null,
  action_text text,
  severity text not null check (severity in ('info', 'success', 'warning', 'danger')),
  source text not null,
  is_dismissed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.monthly_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  month date not null,
  total_balance numeric(18,2) not null,
  income numeric(18,2) not null default 0,
  expense numeric(18,2) not null default 0,
  debt_balance numeric(18,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month)
);

create index transactions_user_date_idx on public.transactions(user_id, transaction_date desc);
create index transactions_wallet_idx on public.transactions(wallet_id);
create index transactions_transfer_group_idx on public.transactions(transfer_group_id)
  where transfer_group_id is not null;
create unique index transfer_pair_direction_idx
  on public.transactions(transfer_group_id, type)
  where transfer_group_id is not null;
create index recurring_user_due_idx on public.recurring_rules(user_id, next_due_date);
create index debts_user_status_idx on public.debts(user_id, status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger pocketgo_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.transaction_signed_effect(
  target_type public.transaction_type,
  target_amount numeric,
  target_adjustment_direction text
)
returns numeric
language sql
immutable
set search_path = public
as $$
  select case
    when target_type in ('income', 'transfer_in') then target_amount
    when target_type in ('expense', 'transfer_out') then -target_amount
    when target_type = 'adjustment' and target_adjustment_direction = 'decrease' then -target_amount
    when target_type = 'adjustment' then target_amount
    else 0
  end;
$$;

create or replace function public.sync_wallet_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    update public.wallets
    set balance = balance - public.transaction_signed_effect(
      old.type, old.amount, old.adjustment_direction
    )
    where id = old.wallet_id and user_id = old.user_id;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    update public.wallets
    set balance = balance + public.transaction_signed_effect(
      new.type, new.amount, new.adjustment_direction
    )
    where id = new.wallet_id and user_id = new.user_id;
  end if;

  return coalesce(new, old);
end;
$$;

create trigger transactions_sync_wallet_balance
  after insert or update or delete on public.transactions
  for each row execute function public.sync_wallet_balance();

create or replace function public.initialize_wallet_balance()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.balance = new.starting_balance;
  return new;
end;
$$;

create trigger wallets_initialize_balance
  before insert on public.wallets
  for each row execute function public.initialize_wallet_balance();

create or replace function public.create_transfer(
  source_wallet_id uuid,
  destination_wallet_id uuid,
  transfer_amount numeric,
  transfer_date date default current_date,
  transfer_note text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  transfer_id uuid := gen_random_uuid();
begin
  if transfer_amount <= 0 then
    raise exception 'Amount must be positive';
  end if;
  if source_wallet_id = destination_wallet_id then
    raise exception 'Source and destination wallets must differ';
  end if;
  if not exists (
    select 1 from public.wallets
    where id = source_wallet_id and user_id = auth.uid() and not is_archived
  ) or not exists (
    select 1 from public.wallets
    where id = destination_wallet_id and user_id = auth.uid() and not is_archived
  ) then
    raise exception 'Wallet not available';
  end if;

  insert into public.transactions (
    user_id, wallet_id, type, amount, transaction_date,
    note, transfer_group_id, related_wallet_id
  ) values
    (auth.uid(), source_wallet_id, 'transfer_out', transfer_amount, transfer_date,
     transfer_note, transfer_id, destination_wallet_id),
    (auth.uid(), destination_wallet_id, 'transfer_in', transfer_amount, transfer_date,
     transfer_note, transfer_id, source_wallet_id);

  return transfer_id;
end;
$$;

create or replace function public.update_transfer(
  target_transfer_group_id uuid,
  source_wallet_id uuid,
  destination_wallet_id uuid,
  transfer_amount numeric,
  transfer_date date,
  transfer_note text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.transactions
    where transfer_group_id = target_transfer_group_id and user_id = auth.uid()
  ) then
    raise exception 'Transfer not found';
  end if;
  delete from public.transactions
  where transfer_group_id = target_transfer_group_id and user_id = auth.uid();
  return public.create_transfer(
    source_wallet_id, destination_wallet_id, transfer_amount, transfer_date, transfer_note
  );
end;
$$;

create or replace function public.delete_transaction(target_transaction_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  target_group uuid;
begin
  select transfer_group_id into target_group
  from public.transactions
  where id = target_transaction_id and user_id = auth.uid();

  if target_group is not null then
    delete from public.transactions
    where transfer_group_id = target_group and user_id = auth.uid();
  else
    delete from public.transactions
    where id = target_transaction_id and user_id = auth.uid();
  end if;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'households', 'household_members', 'wallets', 'categories',
    'transactions', 'budgets', 'budget_items', 'recurring_rules', 'goals',
    'goal_contributions', 'debts', 'debt_payments', 'subscriptions', 'assets',
    'advisor_cards', 'monthly_snapshots'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end $$;

create policy profiles_owner_all on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy households_owner_all on public.households
  for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

create policy household_members_select on public.household_members
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.households
      where households.id = household_members.household_id
        and households.owner_user_id = auth.uid()
    )
  );
create policy household_members_owner_write on public.household_members
  for all using (
    exists (
      select 1 from public.households
      where households.id = household_members.household_id
        and households.owner_user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.households
      where households.id = household_members.household_id
        and households.owner_user_id = auth.uid()
    )
  );

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'wallets', 'categories', 'transactions', 'budgets', 'budget_items',
    'recurring_rules', 'goals', 'goal_contributions', 'debts', 'debt_payments',
    'subscriptions', 'assets', 'advisor_cards', 'monthly_snapshots'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select using (user_id = auth.uid())',
      table_name || '_owner_select', table_name
    );
    execute format(
      'create policy %I on public.%I for insert with check (user_id = auth.uid())',
      table_name || '_owner_insert', table_name
    );
    execute format(
      'create policy %I on public.%I for update using (user_id = auth.uid()) with check (user_id = auth.uid())',
      table_name || '_owner_update', table_name
    );
    execute format(
      'create policy %I on public.%I for delete using (user_id = auth.uid())',
      table_name || '_owner_delete', table_name
    );
  end loop;
end $$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'households', 'household_members', 'wallets', 'categories',
    'transactions', 'budgets', 'budget_items', 'recurring_rules', 'goals',
    'goal_contributions', 'debts', 'debt_payments', 'subscriptions', 'assets',
    'advisor_cards', 'monthly_snapshots'
  ]
  loop
    if table_name <> 'profiles' then
      execute format(
        'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
        table_name || '_set_updated_at', table_name
      );
    end if;
  end loop;
end $$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

grant execute on function public.create_transfer(uuid, uuid, numeric, date, text) to authenticated;
grant execute on function public.update_transfer(uuid, uuid, uuid, numeric, date, text) to authenticated;
grant execute on function public.delete_transaction(uuid) to authenticated;

commit;
