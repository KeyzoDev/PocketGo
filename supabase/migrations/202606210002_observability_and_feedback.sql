begin;

create table public.client_errors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  error_code text not null default 'client_runtime',
  message text not null check (char_length(message) between 1 and 500),
  route text check (route is null or char_length(route) <= 200),
  app_version text check (app_version is null or char_length(app_version) <= 80),
  user_agent text check (user_agent is null or char_length(user_agent) <= 300),
  created_at timestamptz not null default now()
);

create table public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  rating smallint check (rating between 1 and 5),
  category text not null check (
    category in ('bug', 'confusing', 'idea', 'accuracy', 'other')
  ),
  message text not null check (char_length(message) between 5 and 2000),
  route text check (route is null or char_length(route) <= 200),
  status text not null default 'new' check (status in ('new', 'reviewed', 'planned', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index client_errors_user_created_idx
  on public.client_errors(user_id, created_at desc);
create index beta_feedback_user_created_idx
  on public.beta_feedback(user_id, created_at desc);

alter table public.client_errors enable row level security;
alter table public.beta_feedback enable row level security;

create policy client_errors_owner_insert on public.client_errors
  for insert with check (user_id = auth.uid());
create policy client_errors_owner_select on public.client_errors
  for select using (user_id = auth.uid());
create policy client_errors_owner_delete on public.client_errors
  for delete using (user_id = auth.uid());

create policy beta_feedback_owner_insert on public.beta_feedback
  for insert with check (user_id = auth.uid());
create policy beta_feedback_owner_select on public.beta_feedback
  for select using (user_id = auth.uid());
create policy beta_feedback_owner_update on public.beta_feedback
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy beta_feedback_owner_delete on public.beta_feedback
  for delete using (user_id = auth.uid());

create trigger beta_feedback_set_updated_at
  before update on public.beta_feedback
  for each row execute function public.set_updated_at();

commit;
