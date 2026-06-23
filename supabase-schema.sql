create table if not exists public.agenda_data (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.agenda_data enable row level security;

drop policy if exists "agenda_data_select" on public.agenda_data;
drop policy if exists "agenda_data_insert" on public.agenda_data;
drop policy if exists "agenda_data_update" on public.agenda_data;

create policy "agenda_data_select"
on public.agenda_data
for select
to anon
using (true);

create policy "agenda_data_insert"
on public.agenda_data
for insert
to anon
with check (true);

create policy "agenda_data_update"
on public.agenda_data
for update
to anon
using (true)
with check (true);
