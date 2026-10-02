-- Bakey: one row per recipe; the recipe itself is stored as JSON.
create table if not exists public.recipes (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists recipes_user_id_idx on public.recipes (user_id);

alter table public.recipes enable row level security;

drop policy if exists "Users manage their own recipes" on public.recipes;
create policy "Users manage their own recipes" on public.recipes
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
