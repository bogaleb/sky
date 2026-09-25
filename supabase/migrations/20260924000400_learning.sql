-- Sky — Phase 1: learning events, mastery, and server-side scoring
--
-- Every learning interaction is logged to learning_events (append-only). The
-- session planner (Phase 2) reads recent events to decide what comes next.
-- skill_mastery tracks per-child, per-skill progress including spaced
-- repetition (next_review_at): skills answered wrong resurface soon, skills
-- answered right resurface later.
--
-- Scoring is computed server-side in submit_attempt(). The client never sees
-- answer keys (see the activity bank migration).

-- ---------------------------------------------------------------------------
-- learning_events: append-only log of everything the child does.
-- ---------------------------------------------------------------------------
create table public.learning_events (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  session_id uuid references public.sessions (id) on delete set null,
  skill_id uuid references public.skills (id) on delete set null,
  activity_id uuid references public.activities (id) on delete set null,
  event_type text not null check (event_type in (
    'session_start', 'session_end',
    'attempt', 'hint_used', 'show_me', 'demo_watched',
    'milestone', 'break_taken', 'frustration_flag'
  )),
  is_correct boolean,
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  difficulty_level smallint check (difficulty_level is null or difficulty_level between 1 and 5),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.learning_events enable row level security;

create policy "parents read their children's learning events"
  on public.learning_events for select
  to authenticated
  using (child_id in (select id from public.children where parent_id = auth.uid()));

create policy "kid sessions log events for their own children"
  on public.learning_events for insert
  to authenticated
  with check (child_id in (select id from public.children where parent_id = auth.uid()));

create index learning_events_child_created_idx
  on public.learning_events (child_id, created_at desc);
create index learning_events_session_idx
  on public.learning_events (session_id, created_at);

-- ---------------------------------------------------------------------------
-- skill_mastery: one row per child per skill. Written ONLY by submit_attempt().
-- ---------------------------------------------------------------------------
create table public.skill_mastery (
  child_id uuid not null references public.children (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  current_level smallint not null default 1 check (current_level between 1 and 5),
  status text not null default 'emerging'
    check (status in ('emerging', 'developing', 'proficient', 'mastered')),
  attempts integer not null default 0,
  correct integer not null default 0,
  level_attempts integer not null default 0,
  level_correct integer not null default 0,
  streak smallint not null default 0,
  best_streak smallint not null default 0,
  last_practiced_at timestamptz,
  next_review_at timestamptz,
  mastered_at timestamptz,
  primary key (child_id, skill_id)
);

alter table public.skill_mastery enable row level security;

create policy "parents read their children's mastery"
  on public.skill_mastery for select
  to authenticated
  using (child_id in (select id from public.children where parent_id = auth.uid()));

-- No insert/update/delete policies: only submit_attempt() (SECURITY DEFINER)
-- writes mastery. This keeps scoring authoritative.

create index skill_mastery_review_idx
  on public.skill_mastery (child_id, next_review_at)
  where status <> 'mastered';

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

-- Return the client-safe card for an activity (answer stripped). The planner
-- (Phase 2) chooses which activity to serve; this RPC just renders it.
create or replace function public.fetch_activity_card(
  p_child_id uuid,
  p_activity_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_row public.activities%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not exists (
    select 1 from public.children where id = p_child_id and parent_id = auth.uid()
  ) then
    raise exception 'child not found';
  end if;

  select * into v_row from public.activities where id = p_activity_id;
  if not found then
    raise exception 'activity not found';
  end if;

  return jsonb_build_object(
    'id', v_row.id,
    'skill_id', v_row.skill_id,
    'level', v_row.level,
    'kind', v_row.kind,
    'prompt_text', v_row.prompt_text,
    'prompt_audio', v_row.prompt_audio,
    'card', v_row.card,
    'points', v_row.points
  );
end;
$$;

-- Grade an attempt server-side, log the event, and update mastery.
-- Returns {correct, points_earned, streak, status, current_level, leveled_up}.
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
  v_m public.skill_mastery%rowtype;
  v_level_up boolean := false;
  v_accuracy numeric;
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
      v_correct := coalesce(p_answer ->> 'choice', '') = coalesce(v_act.answer ->> 'choice', chr(0));
    when 'tap_count' then
      v_correct := (p_answer ->> 'count')::integer = (v_act.answer ->> 'count')::integer;
    when 'sequence' then
      v_correct := p_answer -> 'sequence' = v_act.answer -> 'sequence';
    when 'sort' then
      v_correct := p_answer -> 'groups' = v_act.answer -> 'groups';
    when 'trace' then
      -- Heuristic: the client reports stroke coverage and duration; the server
      -- enforces plausibility bounds. Full stroke analysis arrives in Phase 6.
      v_correct :=
        coalesce((p_answer ->> 'coverage')::numeric, 0) >= coalesce((v_act.answer ->> 'min_coverage')::numeric, 0.6)
        and coalesce((p_answer ->> 'seconds')::numeric, 0) between 2 and 180;
    when 'listen_repeat' then
      -- v1 trusts the child's "I said it" tap; audio verification is Phase 6.
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

  -- ---- mastery update ----
  insert into public.skill_mastery (child_id, skill_id)
  values (p_child_id, v_act.skill_id)
  on conflict (child_id, skill_id) do nothing;

  select * into v_m
  from public.skill_mastery
  where child_id = p_child_id and skill_id = v_act.skill_id
  for update;

  v_m.attempts := v_m.attempts + 1;
  v_m.level_attempts := v_m.level_attempts + 1;
  if v_correct then
    v_m.correct := v_m.correct + 1;
    v_m.level_correct := v_m.level_correct + 1;
    v_m.streak := v_m.streak + 1;
    v_m.best_streak := greatest(v_m.best_streak, v_m.streak);
  else
    v_m.streak := 0;
  end if;
  v_m.last_practiced_at := now();

  -- Spaced repetition: wrong answers resurface in minutes, right answers in
  -- days (growing with the streak, capped at 30 days).
  if v_correct then
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
  where child_id = p_child_id and skill_id = v_act.skill_id;

  return jsonb_build_object(
    'correct', v_correct,
    'points_earned', v_points,
    'streak', v_m.streak,
    'status', v_m.status,
    'current_level', v_m.current_level,
    'leveled_up', v_level_up
  );
end;
$$;

-- Log a non-attempt event (hint_used, show_me, demo_watched, milestone,
-- break_taken, frustration_flag). The planner reads these in Phase 2.
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
                          'break_taken', 'frustration_flag',
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

revoke all on function public.fetch_activity_card(uuid, uuid) from anon, public;
revoke all on function public.submit_attempt(uuid, uuid, jsonb, integer, uuid) from anon, public;
revoke all on function public.log_event(uuid, text, uuid, uuid, uuid, jsonb) from anon, public;
grant execute on function public.fetch_activity_card(uuid, uuid) to authenticated;
grant execute on function public.submit_attempt(uuid, uuid, jsonb, integer, uuid) to authenticated;
grant execute on function public.log_event(uuid, text, uuid, uuid, uuid, jsonb) to authenticated;
