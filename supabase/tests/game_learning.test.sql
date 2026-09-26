-- Behavior tests for 20260926000100_game_learning.sql. Run by
-- scripts/verify-db.mjs inside a throwaway database. Everything happens in
-- one transaction that is rolled back, and any failed assertion raises.

begin;

-- ---- fixtures (as the migration owner, bypassing RLS) ---------------------
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@example.com'),
  ('00000000-0000-0000-0000-00000000000b', 'b@example.com');
insert into public.parents (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@example.com'),
  ('00000000-0000-0000-0000-00000000000b', 'b@example.com');
insert into public.children (id, parent_id, nickname, avatar_id, age_band) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-00000000000a', 'Ada',
   (select id from public.avatars order by sort_order limit 1), '5-6');
insert into public.activities (id, skill_id, level, kind, prompt_text, card, answer) values
  ('00000000-0000-0000-0000-0000000000f1', (select id from public.skills where code = 'count'),
   1, 'multiple_choice', 'How many?', '{"options":[{"id":"a"},{"id":"b"}]}', '{"choice":"a"}'),
  ('00000000-0000-0000-0000-0000000000f2', (select id from public.skills where code = 'alphabet'),
   1, 'listen_repeat', 'Say A', '{}', '{}');

-- ---- act as parent A ------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';

do $$
declare
  r jsonb;
  m record;
  n integer;
begin
  -- New skills exist and are readable.
  select count(*) into n from public.skills
  where code in ('rhyming', 'vocabulary', 'telling_time', 'money', 'measurement');
  assert n = 5, format('expected 5 new skills, got %s', n);

  -- A batch of game answers is logged per answer and feeds mastery.
  r := public.record_game_attempts(
    '00000000-0000-0000-0000-0000000000c1', 'number-run',
    '[{"skill":"add","correct":true,"level":1,"latency_ms":1500},
      {"skill":"add","correct":false,"level":1},
      {"skill":"money","correct":true,"level":2}]'::jsonb);
  assert (r ->> 'recorded')::int = 3, 'recorded count';
  assert r -> 'skills' ? 'add' and r -> 'skills' ? 'money', 'per-skill results returned';

  select count(*) into n from public.learning_events
  where child_id = '00000000-0000-0000-0000-0000000000c1'
    and event_type = 'attempt' and metadata ->> 'game_id' = 'number-run';
  assert n = 3, format('expected 3 attempt events, got %s', n);

  select * into m from public.skill_mastery
  where child_id = '00000000-0000-0000-0000-0000000000c1'
    and skill_id = (select id from public.skills where code = 'add');
  assert m.attempts = 2 and m.correct = 1 and m.streak = 0, 'add mastery counts';
  assert m.next_review_at < now() + interval '1 hour', 'a wrong answer schedules a quick review';

  -- Level-appropriate evidence levels a skill up: 8 correct at level 1.
  r := public.record_game_attempts('00000000-0000-0000-0000-0000000000c1', 'pattern-parade',
    (select jsonb_agg(jsonb_build_object('skill', 'shapes_patterns', 'correct', true, 'level', 1))
     from generate_series(1, 8)));
  assert (r -> 'skills' -> 'shapes_patterns' ->> 'current_level')::int = 2, 'levels up to 2';

  -- Easy (below-level) evidence counts as practice but cannot level up.
  r := public.record_game_attempts('00000000-0000-0000-0000-0000000000c1', 'pattern-parade',
    (select jsonb_agg(jsonb_build_object('skill', 'shapes_patterns', 'correct', true, 'level', 1))
     from generate_series(1, 20)));
  assert (r -> 'skills' -> 'shapes_patterns' ->> 'current_level')::int = 2, 'easy rounds do not level up';
  select * into m from public.skill_mastery
  where child_id = '00000000-0000-0000-0000-0000000000c1'
    and skill_id = (select id from public.skills where code = 'shapes_patterns');
  assert m.attempts = 28 and m.level_attempts = 0, 'practice counted, level progress untouched';

  -- Unlabeled levels are treated as level 1 (so they cannot level up past 2 either).
  r := public.record_game_attempts('00000000-0000-0000-0000-0000000000c1', 'pattern-parade',
    (select jsonb_agg(jsonb_build_object('skill', 'shapes_patterns', 'correct', true))
     from generate_series(1, 10)));
  assert (r -> 'skills' -> 'shapes_patterns' ->> 'current_level')::int = 2, 'unlabeled rounds are level 1';

  -- On-level evidence does level up again.
  r := public.record_game_attempts('00000000-0000-0000-0000-0000000000c1', 'pattern-parade',
    (select jsonb_agg(jsonb_build_object('skill', 'shapes_patterns', 'correct', true, 'level', 2))
     from generate_series(1, 8)));
  assert (r -> 'skills' -> 'shapes_patterns' ->> 'current_level')::int = 3, 'on-level rounds level up';

  -- Validation.
  begin
    perform public.record_game_attempts('00000000-0000-0000-0000-0000000000c1', 'x',
      '[{"skill":"not_a_skill","correct":true}]');
    assert false, 'unknown skill must raise';
  exception when raise_exception then null;
  end;
  begin
    perform public.record_game_attempts('00000000-0000-0000-0000-0000000000c1', 'x',
      '[{"skill":"add","correct":"yes"}]');
    assert false, 'non-boolean correct must raise';
  exception when raise_exception then null;
  end;
  begin
    perform public.record_game_attempts('00000000-0000-0000-0000-0000000000c1', 'Bad Id!',
      '[{"skill":"add","correct":true}]');
    assert false, 'bad game id must raise';
  exception when raise_exception then null;
  end;
  begin
    perform public.record_game_attempts('00000000-0000-0000-0000-0000000000c1', 'x',
      (select jsonb_agg(jsonb_build_object('skill', 'add', 'correct', true)) from generate_series(1, 51)));
    assert false, 'oversized batch must raise';
  exception when raise_exception then null;
  end;

  -- submit_attempt still grades server-side and feeds mastery.
  r := public.submit_attempt('00000000-0000-0000-0000-0000000000c1',
    '00000000-0000-0000-0000-0000000000f1', '{"choice":"a"}');
  assert (r ->> 'correct')::boolean and (r ->> 'points_earned')::int = 10, 'submit_attempt grades correct';
  r := public.submit_attempt('00000000-0000-0000-0000-0000000000c1',
    '00000000-0000-0000-0000-0000000000f1', '{"choice":"b"}');
  assert not (r ->> 'correct')::boolean and (r ->> 'streak')::int = 0, 'submit_attempt grades wrong';

  -- Self-reported listen_repeat is logged but never moves mastery.
  for n in 1..12 loop
    r := public.submit_attempt('00000000-0000-0000-0000-0000000000c1',
      '00000000-0000-0000-0000-0000000000f2', '{"said_it":true}');
  end loop;
  assert (r ->> 'current_level')::int = 1 and not (r ->> 'leveled_up')::boolean, 'listen_repeat cannot level up';
  assert (r ->> 'correct')::boolean and (r ->> 'points_earned')::int = 0, 'listen_repeat earns no points';
  select count(*) into n from public.learning_events
  where child_id = '00000000-0000-0000-0000-0000000000c1'
    and activity_id = '00000000-0000-0000-0000-0000000000f2'
    and event_type = 'attempt'
    and (metadata ->> 'points_earned')::int = 0;
  assert n = 12, format('expected 12 zero-point listen attempts logged, got %s', n);
  assert not exists (
    select 1 from public.skill_mastery
    where child_id = '00000000-0000-0000-0000-0000000000c1'
      and skill_id = (select id from public.skills where code = 'alphabet')), 'listen_repeat writes no mastery';

  -- reward_error events are accepted now.
  perform public.log_event('00000000-0000-0000-0000-0000000000c1', 'reward_error',
    null, null, null, '{"step":"awardStars"}');

  -- The mastery helper is internal.
  begin
    perform public.apply_skill_attempt('00000000-0000-0000-0000-0000000000c1',
      (select id from public.skills where code = 'add'), true, null::smallint);
    assert false, 'apply_skill_attempt must not be callable by clients';
  exception when insufficient_privilege then null;
  end;

  -- Parent zone: wrong PIN never grants; right PIN grants this token only.
  perform public.set_parent_pin('2468');
  assert not public.unlock_parent_zone('1111', repeat('a', 64)), 'wrong PIN rejected';
  assert not public.parent_zone_is_unlocked(repeat('a', 64)), 'no grant after wrong PIN';
  assert not public.unlock_parent_zone('2468', 'not-a-hash'), 'malformed token rejected';
  assert public.unlock_parent_zone('2468', repeat('a', 64)), 'right PIN accepted';
  assert public.parent_zone_is_unlocked(repeat('a', 64)), 'grant is live';
  assert not public.parent_zone_is_unlocked(repeat('b', 64)), 'other devices stay locked';

  begin
    perform count(*) from public.parent_zone_grants;
    assert false, 'grants table must not be readable by clients';
  exception when insufficient_privilege then null;
  end;
end $$;

-- ---- parent B cannot touch parent A's child or grant -----------------------
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';

do $$
begin
  begin
    perform public.record_game_attempts('00000000-0000-0000-0000-0000000000c1', 'number-run',
      '[{"skill":"add","correct":true}]');
    assert false, 'another parent must not record for this child';
  exception when raise_exception then null;
  end;
  assert not public.parent_zone_is_unlocked(repeat('a', 64)), 'grant is bound to its parent';
  perform public.lock_parent_zone(repeat('a', 64)); -- no-op for the wrong parent
end $$;

set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
do $$
begin
  assert public.parent_zone_is_unlocked(repeat('a', 64)), 'other parent could not revoke the grant';
  perform public.lock_parent_zone(repeat('a', 64));
  assert not public.parent_zone_is_unlocked(repeat('a', 64)), 'lock revokes the grant';
end $$;

-- ---- anonymous callers get nothing -----------------------------------------
reset role;
set local role anon;
do $$
begin
  begin
    perform public.record_game_attempts('00000000-0000-0000-0000-0000000000c1', 'x',
      '[{"skill":"add","correct":true}]');
    assert false, 'anon must not call record_game_attempts';
  exception when insufficient_privilege then null;
  end;
end $$;

rollback;
