-- Sky — collections: kids unlock collectible items (e.g. animals for the
-- encyclopedia) as they play. One row per (child, collection, item).
-- Collection definitions live in lib/kid/collections.ts.
-- Mirrors the trophy_awards convention: RLS on, parents can read their own
-- children's collections, kid sessions can insert for their own children.

create table public.collection_items (
  child_id uuid not null references public.children (id) on delete cascade,
  collection_id text not null,
  item_id text not null,
  found_at timestamptz not null default now(),
  primary key (child_id, collection_id, item_id)
);

alter table public.collection_items enable row level security;

create policy "parents read their children's collections"
  on public.collection_items for select
  to authenticated
  using (child_id in (select id from public.children where parent_id = auth.uid()));

create policy "kid sessions unlock items for their own children"
  on public.collection_items for insert
  to authenticated
  with check (child_id in (select id from public.children where parent_id = auth.uid()));

create index collection_items_child_idx
  on public.collection_items (child_id, collection_id, found_at desc);
