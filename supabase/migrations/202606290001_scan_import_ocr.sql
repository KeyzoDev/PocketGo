begin;

create extension if not exists pgcrypto;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'transaction-imports',
  'transaction-imports',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

create table if not exists public.scanned_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  file_name text not null,
  file_path text not null,
  file_type text not null,
  file_size bigint not null check (file_size > 0 and file_size <= 10485760),
  source_type text not null check (source_type in ('receipt', 'bank_statement')),
  upload_status text not null default 'uploaded' check (upload_status in ('local', 'uploaded', 'failed')),
  parse_status text not null default 'pending' check (parse_status in ('pending', 'processing', 'parsed', 'failed', 'unsupported')),
  raw_text text,
  ocr_provider text,
  ocr_confidence numeric,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.imported_transaction_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  scanned_document_id uuid references public.scanned_documents(id) on delete cascade,
  type text not null default 'expense' check (type in ('income', 'expense', 'transfer', 'adjustment', 'unknown')),
  amount numeric(18,2),
  currency text not null default 'IDR',
  date date,
  merchant text,
  description text,
  note text,
  category_id text,
  category_name text,
  account_id text,
  confidence numeric not null default 0,
  duplicate_candidate boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'approved', 'rejected', 'saved')),
  raw_text text,
  warnings jsonb not null default '[]'::jsonb,
  parsed_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.category_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  language text not null default 'id-ID',
  match_type text not null check (match_type in ('merchant_exact', 'merchant_contains', 'keyword_contains', 'regex')),
  pattern text not null,
  category_id text not null,
  category_name text not null,
  priority int not null default 100,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  constraint category_rules_default_shape check (
    (is_default and user_id is null) or ((not is_default) and user_id is not null)
  )
);

create index if not exists scanned_documents_user_created_idx
  on public.scanned_documents(user_id, created_at desc);
create index if not exists imported_transaction_drafts_user_document_idx
  on public.imported_transaction_drafts(user_id, scanned_document_id);
create index if not exists imported_transaction_drafts_user_status_idx
  on public.imported_transaction_drafts(user_id, status);
create index if not exists category_rules_user_language_idx
  on public.category_rules(user_id, language, priority desc);
create unique index if not exists category_rules_unique_pattern_idx
  on public.category_rules(coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid), language, match_type, lower(pattern), category_id);

alter table public.scanned_documents enable row level security;
alter table public.imported_transaction_drafts enable row level security;
alter table public.category_rules enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'scanned_documents' and policyname = 'scanned_documents_owner_select') then
    create policy scanned_documents_owner_select on public.scanned_documents for select using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'scanned_documents' and policyname = 'scanned_documents_owner_insert') then
    create policy scanned_documents_owner_insert on public.scanned_documents for insert with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'scanned_documents' and policyname = 'scanned_documents_owner_update') then
    create policy scanned_documents_owner_update on public.scanned_documents for update using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'scanned_documents' and policyname = 'scanned_documents_owner_delete') then
    create policy scanned_documents_owner_delete on public.scanned_documents for delete using (user_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'imported_transaction_drafts' and policyname = 'imported_transaction_drafts_owner_select') then
    create policy imported_transaction_drafts_owner_select on public.imported_transaction_drafts for select using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'imported_transaction_drafts' and policyname = 'imported_transaction_drafts_owner_insert') then
    create policy imported_transaction_drafts_owner_insert on public.imported_transaction_drafts for insert with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'imported_transaction_drafts' and policyname = 'imported_transaction_drafts_owner_update') then
    create policy imported_transaction_drafts_owner_update on public.imported_transaction_drafts for update using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'imported_transaction_drafts' and policyname = 'imported_transaction_drafts_owner_delete') then
    create policy imported_transaction_drafts_owner_delete on public.imported_transaction_drafts for delete using (user_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'category_rules' and policyname = 'category_rules_select') then
    create policy category_rules_select on public.category_rules for select using (user_id = auth.uid() or user_id is null);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'category_rules' and policyname = 'category_rules_user_insert') then
    create policy category_rules_user_insert on public.category_rules for insert with check (user_id = auth.uid() and not is_default);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'category_rules' and policyname = 'category_rules_user_update') then
    create policy category_rules_user_update on public.category_rules for update using (user_id = auth.uid() and not is_default) with check (user_id = auth.uid() and not is_default);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'category_rules' and policyname = 'category_rules_user_delete') then
    create policy category_rules_user_delete on public.category_rules for delete using (user_id = auth.uid() and not is_default);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'transaction_imports_owner_select') then
    create policy transaction_imports_owner_select on storage.objects for select using (
      bucket_id = 'transaction-imports' and split_part(name, '/', 1) = auth.uid()::text
    );
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'transaction_imports_owner_insert') then
    create policy transaction_imports_owner_insert on storage.objects for insert with check (
      bucket_id = 'transaction-imports' and split_part(name, '/', 1) = auth.uid()::text
    );
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'transaction_imports_owner_update') then
    create policy transaction_imports_owner_update on storage.objects for update using (
      bucket_id = 'transaction-imports' and split_part(name, '/', 1) = auth.uid()::text
    ) with check (
      bucket_id = 'transaction-imports' and split_part(name, '/', 1) = auth.uid()::text
    );
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'transaction_imports_owner_delete') then
    create policy transaction_imports_owner_delete on storage.objects for delete using (
      bucket_id = 'transaction-imports' and split_part(name, '/', 1) = auth.uid()::text
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'scanned_documents_set_updated_at') then
    create trigger scanned_documents_set_updated_at
      before update on public.scanned_documents
      for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'imported_transaction_drafts_set_updated_at') then
    create trigger imported_transaction_drafts_set_updated_at
      before update on public.imported_transaction_drafts
      for each row execute function public.set_updated_at();
  end if;
end $$;

commit;
