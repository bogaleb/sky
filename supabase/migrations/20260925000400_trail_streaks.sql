-- Sky — Adventure Trail, streaks, and daily quests.
-- The Trail is a guided learning path (220 stops: 44 skills x 5 levels).
-- Stop definitions live in lib/kid/trail.ts; this migration stores per-child
-- progress. Streaks reward daily return; quest_progress tracks deterministic
-- daily quests defined in lib/kid/quests.ts.
--
-- Idempotent: safe to re-run if a previous run partially applied.

-- ---------------------------------------------------------------------------
-- trail_progress: one row per child, pointer into the trail.
-- ---------------------------------------------------------------------------
create table if not exists public.trail_progress (
  child_id uuid primary key references public.children (id) on delete cascade,
  position integer not null default 0 check (position >= 0),
  quests_completed integer not null default 0 check (quests_completed >= 0),
  updated_at timestamptz not null default now()
);

alter table public.trail_progress enable row level security;

drop policy if exists "parents read their children's trail progress" on public.trail_progress;
create policy "parents read their children's trail progress"
  on public.trail_progress for select
  to authenticated
  using (child_id in (select id from public.children where parent_id = auth.uid()));

drop policy if exists "kid sessions advance their own children's trail" on public.trail_progress;
create policy "kid sessions advance their own children's trail"
  on public.trail_progress for all
  to authenticated
  using (child_id in (select id from public.children where parent_id = auth.uid()))
  with check (child_id in (select id from public.children where parent_id = auth.uid()));

drop trigger if exists trail_progress_updated_at on public.trail_progress;
create trigger trail_progress_updated_at
  before update on public.trail_progress
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- streaks: daily return streak per child.
-- ---------------------------------------------------------------------------
create table if not exists public.streaks (
  child_id uuid primary key references public.children (id) on delete cascade,
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_active_date date,
  updated_at timestamptz not null default now()
);

alter table public.streaks enable row level security;

drop policy if exists "parents read their children's streaks" on public.streaks;
create policy "parents read their children's streaks"
  on public.streaks for select
  to authenticated
  using (child_id in (select id from public.children where parent_id = auth.uid()));

drop policy if exists "kid sessions update their own children's streaks" on public.streaks;
create policy "kid sessions update their own children's streaks"
  on public.streaks for all
  to authenticated
  using (child_id in (select id from public.children where parent_id = auth.uid()))
  with check (child_id in (select id from public.children where parent_id = auth.uid()));

drop trigger if exists streaks_updated_at on public.streaks;
create trigger streaks_updated_at
  before update on public.streaks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- quest_progress: deterministic daily quests (quest_id from lib/kid/quests.ts).
-- ---------------------------------------------------------------------------
create table if not exists public.quest_progress (
  child_id uuid not null references public.children (id) on delete cascade,
  quest_date date not null,
  quest_id text not null,
  progress integer not null default 0 check (progress >= 0),
  goal integer not null check (goal > 0),
  completed boolean not null default false,
  completed_at timestamptz,
  primary key (child_id, quest_date, quest_id)
);

alter table public.quest_progress enable row level security;

drop policy if exists "parents read their children's quest progress" on public.quest_progress;
create policy "parents read their children's quest progress"
  on public.quest_progress for select
  to authenticated
  using (child_id in (select id from public.children where parent_id = auth.uid()));

drop policy if exists "kid sessions track their own children's quests" on public.quest_progress;
create policy "kid sessions track their own children's quests"
  on public.quest_progress for all
  to authenticated
  using (child_id in (select id from public.children where parent_id = auth.uid()))
  with check (child_id in (select id from public.children where parent_id = auth.uid()));

create index if not exists quest_progress_child_date_idx
  on public.quest_progress (child_id, quest_date);

-- ---------------------------------------------------------------------------
-- star_balances: persistent spendable star wallet per child (pet treats,
-- outfit shop). Earned from sessions; spent in the Sky Shop.
-- ---------------------------------------------------------------------------
create table if not exists public.star_balances (
  child_id uuid primary key references public.children (id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  lifetime_earned integer not null default 0 check (lifetime_earned >= 0),
  updated_at timestamptz not null default now()
);

alter table public.star_balances enable row level security;

drop policy if exists "parents read their children's star balances" on public.star_balances;
create policy "parents read their children's star balances"
  on public.star_balances for select
  to authenticated
  using (child_id in (select id from public.children where parent_id = auth.uid()));

drop policy if exists "kid sessions manage their own children's star balances" on public.star_balances;
create policy "kid sessions manage their own children's star balances"
  on public.star_balances for all
  to authenticated
  using (child_id in (select id from public.children where parent_id = auth.uid()))
  with check (child_id in (select id from public.children where parent_id = auth.uid()));

drop trigger if exists star_balances_updated_at on public.star_balances;
create trigger star_balances_updated_at
  before update on public.star_balances
  for each row execute function public.set_updated_at();
