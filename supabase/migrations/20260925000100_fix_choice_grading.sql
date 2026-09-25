-- Sky — fix null-character crash in submit_attempt() choice grading.
--
-- The multiple_choice / tap_target branch used
--   coalesce(v_act.answer ->> 'choice', chr(0))
-- as a "can never match" fallback. PostgreSQL constant-folds chr(0) at plan
-- time, and constructing a text value containing \0 raises
-- "null character not permitted" (SQLSTATE 22021) — so EVERY multiple_choice
-- and tap_target attempt failed, correct or not.
--
-- Replaced with an explicit null guard: a missing answer key can never be
-- satisfied, and no null character is ever constructed.
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
      -- A missing answer key is never satisfied; compare null-safely.
      v_correct := (v_act.answer ->> 'choice') is not null
        and coalesce(p_answer ->> 'choice', '') = (v_act.answer ->> 'choice');
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
