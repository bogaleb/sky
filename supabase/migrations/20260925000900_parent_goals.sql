-- Sky — parent power-ups: weekly learning goals set by parents.
-- One row per child; the row rolls to the current week on read/write
-- (week_start = Monday). Parents manage rows for their own children only.

create table public.parent_goals (
  child_id uuid primary key references public.children (id) on delete cascade,
  week_start date not null,
  target int not null default 5 check (target between 1 and 20),
  celebrated boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.parent_goals enable row level security;

create policy "parents manage their children's goals"
  on public.parent_goals for all
  to authenticated
  using (child_id in (select id from public.children where parent_id = auth.uid()))
  with check (child_id in (select id from public.children where parent_id = auth.uid()));

create index parent_goals_week_idx
  on public.parent_goals (week_start desc);
