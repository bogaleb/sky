-- Sky — Wave 11: one learning record for everything the child does.
--
-- Until now only the session player (activity bank -> submit_attempt) fed
-- skill_mastery. The ~20 Sky Park learning games logged a single "milestone"
-- when a round ended, so the parent report and the spaced-repetition planner
-- were blind to most real practice. This migration:
--
--   1. Adds skills the games already teach but the taxonomy lacked
--      (rhyming, vocabulary, telling time, money, measurement).
--   2. Extracts the mastery rules from submit_attempt into one internal
--      function, apply_skill_attempt(), so every source of evidence obeys the
--      same mastery / spaced-repetition rules. submit_attempt behaves exactly
--      as before.
--   3. Adds record_game_attempts(): a batched, per-answer game log that feeds
--      skill_mastery. Game content is generated client-side, so correctness
--      is client-reported; to keep mastery honest, a game answer only counts
--      toward LEVEL progression when the game item was at or above the
--      child's current level for that skill (easy rounds still count as
--      practice and still schedule reviews).
--   4. Fixes reward_error logging: the app has been sending 'reward_error'
--      events since Wave 10, but both log_event and the learning_events CHECK
--      constraint rejected them, so every reward failure was silently lost.
--   5. Adds a device-bound, server-enforced parent-zone unlock. The PIN gate
--      used to be a sessionStorage flag, and the parent server actions only
--      checked that the (shared, kid-held) parent session existed.
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Skills the games teach
-- ---------------------------------------------------------------------------
insert into public.skills (subject_code, code, name, summary, age_min, age_max, levels, sort_order) values
('reading', 'rhyming', 'Rhyming',
 'Hear and match words that sound alike at the end', 3, 7,
 '["Notices that two spoken words sound the same at the end",
    "Picks the rhyming word from two spoken choices",
    "Picks the rhyming word from three or more choices",
    "Says a new word that rhymes with a given word",
    "Finds the word that does not rhyme in a set"]'::jsonb, 7),
('reading', 'vocabulary', 'Word meanings',
 'Learn new words, opposites, and how words relate', 3, 8,
 '["Names everyday objects and actions",
    "Matches simple opposites like big and small",
    "Matches less common opposites like early and late",
    "Uses context to work out a new word",
    "Explains how two words are related"]'::jsonb, 8),
('math', 'telling_time', 'Telling time',
 'Read clocks and understand the order of the day', 5, 8,
 '["Orders morning, afternoon, and night",
    "Reads the hour on an analog clock",
    "Reads half past the hour",
    "Reads quarter past and quarter to",
    "Reads time to five minutes and works out elapsed time"]'::jsonb, 9),
('math', 'money', 'Money',
 'Recognize coins and count small amounts', 5, 8,
 '["Tells coins apart by look",
    "Names each coin and its value",
    "Counts a small set of one kind of coin",
    "Counts a mix of coins",
    "Makes an amount and works out change"]'::jsonb, 10),
('math', 'measurement', 'Measuring',
 'Compare and measure length, weight, and size', 3, 8,
 '["Compares two things: longer or shorter, heavier or lighter",
    "Orders three things by size",
    "Measures with non-standard units like blocks",
    "Measures length with a ruler in whole units",
    "Estimates, measures, and compares measurements"]'::jsonb, 11)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- 4a. learning_events accepts reward_error
-- ---------------------------------------------------------------------------
alter table public.learning_events
  drop constraint if exists learning_events_event_type_check;
alter table public.learning_events
  add constraint learning_events_event_type_check check (event_type in (
    'session_start', 'session_end',
    'attempt', 'hint_used', 'show_me', 'demo_watched',
    'milestone', 'break_taken', 'frustration_flag', 'reward_error'
  ));

-- ---------------------------------------------------------------------------
-- 2. The one set of mastery rules
-- ---------------------------------------------------------------------------
-- Internal: NOT callable by clients (see revokes below). Callers must have
-- already verified that p_child_id belongs to auth.uid().
--
-- p_evidence_level: difficulty (1–5) of the item that produced this answer.
-- NULL means "authoritative, always counts toward the current level" (the
-- server-graded activity bank). A non-null level below the child's current
-- level still counts as practice but not toward level-up.
create or replace function public.apply_skill_attempt(
  p_child_id uuid,
  p_skill_id uuid,
  p_correct boolean,
  p_evidence_level smallint default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_m public.skill_mastery%rowtype;
  v_level_up boolean := false;
  v_accuracy numeric;
  v_counts_for_level boolean;
begin
  insert into public.skill_mastery (child_id, skill_id)
  values (p_child_id, p_skill_id)
  on conflict (child_id, skill_id) do nothing;

  select * into v_m
  from public.skill_mastery
  where child_id = p_child_id and skill_id = p_skill_id
  for update;

  v_counts_for_level := p_evidence_level is null or p_evidence_level >= v_m.current_level;

  v_m.attempts := v_m.attempts + 1;
  if v_counts_for_level then
    v_m.level_attempts := v_m.level_attempts + 1;
  end if;
  if p_correct then
    v_m.correct := v_m.correct + 1;
    if v_counts_for_level then
      v_m.level_correct := v_m.level_correct + 1;
    end if;
    v_m.streak := v_m.streak + 1;
    v_m.best_streak := greatest(v_m.best_streak, v_m.streak);
  else
    v_m.streak := 0;
  end if;
  v_m.last_practiced_at := now();

  -- Spaced repetition: wrong answers resurface in minutes, right answers in
  -- days (growing with the streak, capped at 30 days).
  if p_correct then
    v_m.next_review_at := now()
      + make_interval(days => least((2 ^ least(v_m.streak, 5))::integer, 30));
  else
    v_m.next_review_at := now() + interval '10 minutes';
  end if;

  -- Level-up: 8+ correct at this level with >= 80% accuracy.
  if v_m.level_attempts > 0 then
    v_accuracy := v_m.level_correct::numeric / v_m.level_attempts;
  else
    v_accuracy := 0;
  end if;

  if v_m.status <> 'mastered'
     and v_m.level_correct >= 8
     and v_accuracy >= 0.8 then
    if v_m.current_level < 5 then
      v_m.current_level := v_m.current_level + 1;
      v_m.level_attempts := 0;
      v_m.level_correct := 0;
      v_m.next_review_at := now() + interval '1 day';
      v_level_up := true;
    else
      v_m.status := 'mastered';
      v_m.mastered_at := now();
      v_m.next_review_at := null;
      v_level_up := true;
    end if;
  elsif v_m.status <> 'mastered' then
    v_m.status := case
      when v_m.attempts >= 5 and v_accuracy >= 0.6 then 'proficient'
      when v_m.attempts >= 3 then 'developing'
      else 'emerging'
    end;
  end if;

  update public.skill_mastery
  set current_level = v_m.current_level,
      status = v_m.status,
      attempts = v_m.attempts,
      correct = v_m.correct,
      level_attempts = v_m.level_attempts,
      level_correct = v_m.level_correct,
      streak = v_m.streak,
      best_streak = v_m.best_streak,
      last_practiced_at = v_m.last_practiced_at,
      next_review_at = v_m.next_review_at,
      mastered_at = v_m.mastered_at
  where child_id = p_child_id and skill_id = p_skill_id;

  return jsonb_build_object(
    'streak', v_m.streak,
    'status', v_m.status,
    'current_level', v_m.current_level,
    'leveled_up', v_level_up
  );
end;
$$;

revoke all on function public.apply_skill_attempt(uuid, uuid, boolean, smallint) from anon, authenticated, public;

-- submit_attempt: identical grading and return shape as
-- 20260925000100_fix_choice_grading.sql; the mastery block now delegates.
create or replace function public.submit_attempt(
  p_child_id uuid,
  p_activity_id uuid,
  p_answer jsonb,
  p_latency_ms integer default null,
  p_session_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_act public.activities%rowtype;
  v_correct boolean := false;
  v_points integer := 0;
  v_m jsonb;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not exists (
    select 1 from public.children where id = p_child_id and parent_id = auth.uid()
  ) then
    raise exception 'child not found';
  end if;
  if p_session_id is not null and not exists (
    select 1 from public.sessions s
    join public.children c on c.id = s.child_id
    where s.id = p_session_id and c.parent_id = auth.uid()
  ) then
    raise exception 'session not found';
  end if;

  select * into v_act from public.activities where id = p_activity_id;
  if not found then
    raise exception 'activity not found';
  end if;

  -- ---- grading, per kind (answer keys never leave this function) ----
  case v_act.kind
    when 'multiple_choice', 'tap_target' then
      v_correct := (v_act.answer ->> 'choice') is not null
        and coalesce(p_answer ->> 'choice', '') = (v_act.answer ->> 'choice');
    when 'tap_count' then
      v_correct := (p_answer ->> 'count')::integer = (v_act.answer ->> 'count')::integer;
    when 'sequence' then
      v_correct := p_answer -> 'sequence' = v_act.answer -> 'sequence';
    when 'sort' then
      v_correct := p_answer -> 'groups' = v_act.answer -> 'groups';
    when 'trace' then
      v_correct :=
        coalesce((p_answer ->> 'coverage')::numeric, 0) >= coalesce((v_act.answer ->> 'min_coverage')::numeric, 0.6)
        and coalesce((p_answer ->> 'seconds')::numeric, 0) between 2 and 180;
    when 'listen_repeat' then
      v_correct := coalesce((p_answer ->> 'said_it')::boolean, false);
    else
      raise exception 'unknown activity kind';
  end case;

  if v_correct then
    v_points := v_act.points;
  end if;

  insert into public.learning_events
    (child_id, session_id, skill_id, activity_id, event_type, is_correct,
     latency_ms, difficulty_level, metadata)
  values
    (p_child_id, p_session_id, v_act.skill_id, v_act.id, 'attempt', v_correct,
     p_latency_ms, v_act.level,
     jsonb_build_object('kind', v_act.kind, 'points_earned', v_points));

  -- listen_repeat is self-reported ("I said it") until audio verification
  -- exists: it is logged as practice but must not move mastery, or a child
  -- could level up by tapping a button.
  if v_act.kind = 'listen_repeat' then
    select jsonb_build_object(
             'streak', coalesce(m.streak, 0),
             'status', coalesce(m.status, 'emerging'),
             'current_level', coalesce(m.current_level, 1),
             'leveled_up', false)
      into v_m
    from (select 1) one
    left join public.skill_mastery m
      on m.child_id = p_child_id and m.skill_id = v_act.skill_id;
  else
    v_m := public.apply_skill_attempt(p_child_id, v_act.skill_id, v_correct, null);
  end if;

  return jsonb_build_object(
    'correct', v_correct,
    'points_earned', v_points,
    'streak', (v_m ->> 'streak')::integer,
    'status', v_m ->> 'status',
    'current_level', (v_m ->> 'current_level')::integer,
    'leveled_up', (v_m ->> 'leveled_up')::boolean
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Per-answer game evidence
-- ---------------------------------------------------------------------------
-- p_attempts: [{ "skill": "count", "correct": true, "level": 2, "latency_ms": 1800 }, ...]
-- 1–50 items per call (the client batches). Returns the final mastery state
-- per skill touched: { "skills": { "count": { "current_level": 2, ... } }, "recorded": n }.
create or replace function public.record_game_attempts(
  p_child_id uuid,
  p_game_id text,
  p_attempts jsonb,
  p_session_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_item jsonb;
  v_skill_id uuid;
  v_skill_code text;
  v_correct boolean;
  v_level smallint;
  v_latency integer;
  v_result jsonb := '{}'::jsonb;
  v_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not exists (
    select 1 from public.children where id = p_child_id and parent_id = auth.uid()
  ) then
    raise exception 'child not found';
  end if;
  if p_session_id is not null and not exists (
    select 1 from public.sessions s
    join public.children c on c.id = s.child_id
    where s.id = p_session_id and c.parent_id = auth.uid()
  ) then
    raise exception 'session not found';
  end if;
  if p_game_id is null or p_game_id !~ '^[a-z0-9_-]{1,40}$' then
    raise exception 'invalid game id';
  end if;
  if jsonb_typeof(p_attempts) is distinct from 'array'
     or jsonb_array_length(p_attempts) not between 1 and 50 then
    raise exception 'attempts must be an array of 1 to 50 items';
  end if;

  for v_item in select * from jsonb_array_elements(p_attempts) loop
    v_skill_code := v_item ->> 'skill';
    if jsonb_typeof(v_item -> 'correct') is distinct from 'boolean' then
      raise exception 'attempt.correct must be a boolean';
    end if;
    v_correct := (v_item ->> 'correct')::boolean;

    -- Unknown / missing level is treated as level 1: conservative, so easy
    -- or unlabeled rounds can never push a child past level 1 on their own.
    v_level := case
      when jsonb_typeof(v_item -> 'level') = 'number'
        then greatest(1, least(5, (v_item ->> 'level')::numeric::integer))::smallint
      else 1::smallint
    end;
    v_latency := case
      when jsonb_typeof(v_item -> 'latency_ms') = 'number'
        then greatest(0, least(600000, (v_item ->> 'latency_ms')::numeric::integer))
      else null
    end;

    select id into v_skill_id from public.skills where code = v_skill_code;
    if v_skill_id is null then
      raise exception 'unknown skill %', coalesce(v_skill_code, '(null)');
    end if;

    insert into public.learning_events
      (child_id, session_id, skill_id, event_type, is_correct,
       latency_ms, difficulty_level, metadata)
    values
      (p_child_id, p_session_id, v_skill_id, 'attempt', v_correct,
       v_latency, v_level,
       jsonb_build_object('source', 'game', 'game_id', p_game_id));

    v_result := v_result || jsonb_build_object(
      v_skill_code, public.apply_skill_attempt(p_child_id, v_skill_id, v_correct, v_level)
    );
    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('recorded', v_count, 'skills', v_result);
end;
$$;

revoke all on function public.record_game_attempts(uuid, text, jsonb, uuid) from anon, public;
grant execute on function public.record_game_attempts(uuid, text, jsonb, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 4b. log_event accepts reward_error
-- ---------------------------------------------------------------------------
create or replace function public.log_event(
  p_child_id uuid,
  p_event_type text,
  p_skill_id uuid default null,
  p_activity_id uuid default null,
  p_session_id uuid default null,
  p_metadata jsonb default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_event_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not exists (
    select 1 from public.children where id = p_child_id and parent_id = auth.uid()
  ) then
    raise exception 'child not found';
  end if;
  if p_event_type not in ('hint_used', 'show_me', 'demo_watched', 'milestone',
                          'break_taken', 'frustration_flag', 'reward_error',
                          'session_start', 'session_end') then
    raise exception 'invalid event type';
  end if;

  insert into public.learning_events
    (child_id, session_id, skill_id, activity_id, event_type, metadata)
  values
    (p_child_id, p_session_id, p_skill_id, p_activity_id, p_event_type,
     coalesce(p_metadata, '{}'))
  returning id into v_event_id;

  return v_event_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Server-enforced parent zone
-- ---------------------------------------------------------------------------
-- A grant is bound to one device: the server keeps a random token in an
-- httpOnly cookie and stores only its SHA-256 here. Grants can only be
-- created by unlock_parent_zone(), which requires the correct PIN, so a child
-- calling server actions directly cannot mint one. No client policies: all
-- access goes through the RPCs below.
create table if not exists public.parent_zone_grants (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  parent_id uuid not null references public.parents (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.parent_zone_grants enable row level security;
revoke all on table public.parent_zone_grants from anon, authenticated;

create index if not exists parent_zone_grants_parent_idx
  on public.parent_zone_grants (parent_id, expires_at);

-- Verify the PIN (same lockout rules as verify_parent_pin) and, on success,
-- open a 20-minute grant for this device's token.
create or replace function public.unlock_parent_zone(pin text, p_token_hash text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    return false;
  end if;
  if not public.verify_parent_pin(pin) then
    return false;
  end if;

  delete from public.parent_zone_grants
  where parent_id = auth.uid() and expires_at < now();

  insert into public.parent_zone_grants (token_hash, parent_id, expires_at)
  values (p_token_hash, auth.uid(), now() + interval '20 minutes')
  on conflict (token_hash) do update
    set expires_at = excluded.expires_at
    where public.parent_zone_grants.parent_id = excluded.parent_id;

  return true;
end;
$$;

create or replace function public.parent_zone_is_unlocked(p_token_hash text)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select auth.uid() is not null and exists (
    select 1 from public.parent_zone_grants
    where token_hash = p_token_hash
      and parent_id = auth.uid()
      and expires_at > now()
  );
$$;

create or replace function public.lock_parent_zone(p_token_hash text)
returns void
language sql
security definer
set search_path = public, extensions
as $$
  delete from public.parent_zone_grants
  where token_hash = p_token_hash and parent_id = auth.uid();
$$;

revoke all on function public.unlock_parent_zone(text, text) from anon, public;
revoke all on function public.parent_zone_is_unlocked(text) from anon, public;
revoke all on function public.lock_parent_zone(text) from anon, public;
grant execute on function public.unlock_parent_zone(text, text) to authenticated;
grant execute on function public.parent_zone_is_unlocked(text) to authenticated;
grant execute on function public.lock_parent_zone(text) to authenticated;
