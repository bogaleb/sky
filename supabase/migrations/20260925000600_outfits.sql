-- Sky — avatar dress-up: kids spend earned stars on outfit accessories.
-- One row per (child, outfit). Outfits are defined in lib/kid/outfits.ts.
-- Kids can equip one outfit per slot (hat / glasses / extra) at a time.

create table if not exists public.child_outfits (
  child_id uuid not null references public.children (id) on delete cascade,
  outfit_id text not null,
  unlocked boolean not null default false,
  equipped boolean not null default false,
  primary key (child_id, outfit_id)
);

alter table public.child_outfits enable row level security;

drop policy if exists "parents read their children's outfits" on public.child_outfits;
create policy "parents read their children's outfits"
  on public.child_outfits for select
  to authenticated
  using (child_id in (select id from public.children where parent_id = auth.uid()));

drop policy if exists "kid sessions unlock outfits for their own children" on public.child_outfits;
create policy "kid sessions unlock outfits for their own children"
  on public.child_outfits for insert
  to authenticated
  with check (child_id in (select id from public.children where parent_id = auth.uid()));

drop policy if exists "kid sessions change outfits for their own children" on public.child_outfits;
create policy "kid sessions change outfits for their own children"
  on public.child_outfits for update
  to authenticated
  using (child_id in (select id from public.children where parent_id = auth.uid()))
  with check (child_id in (select id from public.children where parent_id = auth.uid()));

create index if not exists child_outfits_child_idx
  on public.child_outfits (child_id);
