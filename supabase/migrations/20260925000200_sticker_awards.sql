-- Sky — sticker rewards: kids earn collectible stickers for learning.
-- One row per (child, sticker). Stickers are defined in lib/kid/stickers.ts.

create table if not exists public.sticker_awards (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  sticker_id text not null,
  awarded_at timestamptz not null default now(),
  metadata jsonb not null default '{}',
  unique (child_id, sticker_id)
);

alter table public.sticker_awards enable row level security;

drop policy if exists "parents read their children's stickers" on public.sticker_awards;
create policy "parents read their children's stickers"
  on public.sticker_awards for select
  to authenticated
  using (child_id in (select id from public.children where parent_id = auth.uid()));

drop policy if exists "kid sessions award stickers for their own children" on public.sticker_awards;
create policy "kid sessions award stickers for their own children"
  on public.sticker_awards for insert
  to authenticated
  with check (child_id in (select id from public.children where parent_id = auth.uid()));

create index if not exists sticker_awards_child_idx
  on public.sticker_awards (child_id, awarded_at desc);
