-- Sky — pet companions: kids adopt, hatch, name, feed, and play with a pet.
-- One row per child. Names come from a preset COPPA-safe list (see lib/kid/pets.ts);
-- no free-text names are ever stored.

create table public.pets (
  child_id uuid primary key references public.children (id) on delete cascade,
  species text not null check (species in ('bumble-pup', 'cloud-kitten', 'sprout-turtle', 'star-fox', 'bubble-frog')),
  name text,
  stage text not null default 'egg' check (stage in ('egg', 'hatchling', 'junior', 'grown')),
  happiness int not null default 50 check (happiness >= 0 and happiness <= 100),
  feed_count int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.pets enable row level security;

create policy "parents read their children's pets"
  on public.pets for select
  to authenticated
  using (child_id in (select id from public.children where parent_id = auth.uid()));

create policy "kid sessions manage their own children's pets"
  on public.pets for insert
  to authenticated
  with check (child_id in (select id from public.children where parent_id = auth.uid()));

create policy "kid sessions update their own children's pets"
  on public.pets for update
  to authenticated
  using (child_id in (select id from public.children where parent_id = auth.uid()))
  with check (child_id in (select id from public.children where parent_id = auth.uid()));

create trigger pets_updated_at
  before update on public.pets
  for each row execute function public.set_updated_at();

create index pets_species_idx on public.pets (species);
