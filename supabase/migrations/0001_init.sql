-- Formic platform schema
-- Forms are configuration-driven: questions, logic rules and theme are
-- stored as JSONB on the form row (mirrors lib/types.ts) so the app can
-- treat a form as a single serializable schema, while responses/answers get
-- normalized tables for analytics.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- forms
-- ---------------------------------------------------------------------------
create table if not exists public.forms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  title text not null default 'Untitled form',
  description text,
  status text not null default 'draft' check (status in ('draft', 'published', 'closed')),
  questions jsonb not null default '[]'::jsonb,
  logic_rules jsonb not null default '[]'::jsonb,
  theme jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists forms_owner_id_idx on public.forms(owner_id);
create index if not exists forms_status_idx on public.forms(status);

-- ---------------------------------------------------------------------------
-- responses
-- ---------------------------------------------------------------------------
create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade,
  session_id text not null,
  completion_status text not null default 'in_progress'
    check (completion_status in ('in_progress', 'completed', 'abandoned')),
  last_question_id text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists responses_form_id_idx on public.responses(form_id);
create unique index if not exists responses_form_session_idx on public.responses(form_id, session_id);

-- ---------------------------------------------------------------------------
-- answers
-- ---------------------------------------------------------------------------
create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.responses(id) on delete cascade,
  form_id uuid not null references public.forms(id) on delete cascade,
  question_id text not null,
  value jsonb,
  created_at timestamptz not null default now(),
  unique (response_id, question_id)
);

create index if not exists answers_response_id_idx on public.answers(response_id);
create index if not exists answers_form_id_question_id_idx on public.answers(form_id, question_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger for forms
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists forms_set_updated_at on public.forms;
create trigger forms_set_updated_at
  before update on public.forms
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.forms enable row level security;
alter table public.responses enable row level security;
alter table public.answers enable row level security;

-- Forms: owners have full CRUD on their own forms.
drop policy if exists "forms_owner_select" on public.forms;
create policy "forms_owner_select" on public.forms
  for select using (auth.uid() = owner_id);

drop policy if exists "forms_owner_insert" on public.forms;
create policy "forms_owner_insert" on public.forms
  for insert with check (auth.uid() = owner_id);

drop policy if exists "forms_owner_update" on public.forms;
create policy "forms_owner_update" on public.forms
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "forms_owner_delete" on public.forms;
create policy "forms_owner_delete" on public.forms
  for delete using (auth.uid() = owner_id);

-- Forms: anonymous/public users can only read published forms (to render /f/[slug]).
drop policy if exists "forms_public_select_published" on public.forms;
create policy "forms_public_select_published" on public.forms
  for select using (status = 'published');

-- Responses: owners can read/manage responses that belong to their forms.
drop policy if exists "responses_owner_select" on public.responses;
create policy "responses_owner_select" on public.responses
  for select using (
    exists (select 1 from public.forms f where f.id = form_id and f.owner_id = auth.uid())
  );

drop policy if exists "responses_owner_delete" on public.responses;
create policy "responses_owner_delete" on public.responses
  for delete using (
    exists (select 1 from public.forms f where f.id = form_id and f.owner_id = auth.uid())
  );

-- Responses: anonymous/public users can only insert/update responses against published forms.
drop policy if exists "responses_public_insert" on public.responses;
create policy "responses_public_insert" on public.responses
  for insert with check (
    exists (select 1 from public.forms f where f.id = form_id and f.status = 'published')
  );

drop policy if exists "responses_public_update" on public.responses;
create policy "responses_public_update" on public.responses
  for update using (
    exists (select 1 from public.forms f where f.id = form_id and f.status = 'published')
  ) with check (
    exists (select 1 from public.forms f where f.id = form_id and f.status = 'published')
  );

-- Answers: owners can read answers that belong to their forms.
drop policy if exists "answers_owner_select" on public.answers;
create policy "answers_owner_select" on public.answers
  for select using (
    exists (select 1 from public.forms f where f.id = form_id and f.owner_id = auth.uid())
  );

drop policy if exists "answers_owner_delete" on public.answers;
create policy "answers_owner_delete" on public.answers
  for delete using (
    exists (select 1 from public.forms f where f.id = form_id and f.owner_id = auth.uid())
  );

-- Answers: anonymous/public users can only insert/update answers against published forms.
drop policy if exists "answers_public_insert" on public.answers;
create policy "answers_public_insert" on public.answers
  for insert with check (
    exists (select 1 from public.forms f where f.id = form_id and f.status = 'published')
  );

drop policy if exists "answers_public_update" on public.answers;
create policy "answers_public_update" on public.answers
  for update using (
    exists (select 1 from public.forms f where f.id = form_id and f.status = 'published')
  ) with check (
    exists (select 1 from public.forms f where f.id = form_id and f.status = 'published')
  );

-- ---------------------------------------------------------------------------
-- Storage bucket for logos (public read, owner write)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('form-assets', 'form-assets', true)
on conflict (id) do nothing;

drop policy if exists "form_assets_public_read" on storage.objects;
create policy "form_assets_public_read" on storage.objects
  for select using (bucket_id = 'form-assets');

drop policy if exists "form_assets_owner_write" on storage.objects;
create policy "form_assets_owner_write" on storage.objects
  for insert with check (bucket_id = 'form-assets' and auth.uid() is not null);

drop policy if exists "form_assets_owner_update" on storage.objects;
create policy "form_assets_owner_update" on storage.objects
  for update using (bucket_id = 'form-assets' and owner = auth.uid());

drop policy if exists "form_assets_owner_delete" on storage.objects;
create policy "form_assets_owner_delete" on storage.objects
  for delete using (bucket_id = 'form-assets' and owner = auth.uid());
