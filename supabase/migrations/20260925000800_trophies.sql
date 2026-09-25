-- Sky — trophy shelf: kids earn achievement trophies for learning milestones.
-- One row per (child, trophy). Trophies are defined in lib/kid/trophies.ts.
-- Mirrors the sticker_awards convention: RLS on, parents can read their own
-- children's trophies, kid sessions can insert for their own children.

create table public.trophy_awards (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  trophy_id text not null,
  awarded_at timestamptz not null default now(),
  unique (child_id, trophy_id)
);

alter table public.trophy_awards enable row level security;

create policy "parents read their children's trophies"
  on public.trophy_awards for select
  to authenticated
  using (child_id in (select id from public.children where parent_id = auth.uid()));

create policy "kid sessions award trophies for their own children"
  on public.trophy_awards for insert
  to authenticated
  with check (child_id in (select id from public.children where parent_id = auth.uid()));

create index trophy_awards_child_idx
  on public.trophy_awards (child_id, awarded_at desc);
