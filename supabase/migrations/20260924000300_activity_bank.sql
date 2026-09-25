-- Sky — Phase 1: activity bank
-- The seeded question/activity bank covering every skill. Answers are scored
-- SERVER-SIDE ONLY: the activities table has NO client RLS policies, so no
-- client session can SELECT answer keys. The only client path is
-- fetch_activity_card() (strips the answer) and submit_attempt() (grades it),
-- both defined in the learning migration.
--
-- Starter content lives in supabase/seed.sql (applied after migrations).
-- The full bank (every skill x every level) ships in Phase 2.

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skills (id) on delete restrict,
  level smallint not null check (level between 1 and 5),
  kind text not null check (kind in (
    'multiple_choice', -- pick one of N options        answer: {"choice": "<option id>"}
    'tap_target',      -- tap the right thing on screen answer: {"choice": "<target id>"}
    'tap_count',       -- tap N times / answer "how many" answer: {"count": 7}
    'sequence',        -- put steps in order            answer: {"sequence": ["a","b","c"]}
    'sort',            -- sort items into groups        answer: {"groups": {"g1": ["a"], "g2": ["b"]}}
    'trace',           -- trace a path/letter           answer: {"min_coverage": 0.6}
    'listen_repeat'    -- listen and repeat aloud       answer: {} (self-reported in v1)
  )),
  prompt_text text not null,
  prompt_audio text, -- TTS/media ref, wired in Phase 5+
  card jsonb not null default '{}',   -- client-safe payload: options, layout, art refs
  answer jsonb not null default '{}', -- SERVER ONLY. Never sent to the client.
  points smallint not null default 10 check (points between 1 and 100),
  min_age_band text check (min_age_band in ('3-4', '5-6', '7-8')),
  max_age_band text check (max_age_band in ('3-4', '5-6', '7-8')),
  created_at timestamptz not null default now()
);

alter table public.activities enable row level security;

-- Deliberately NO policies for authenticated: clients must use the RPCs.
-- (Service role bypasses RLS for seeding and admin.)

create index activities_skill_level_idx on public.activities (skill_id, level);
