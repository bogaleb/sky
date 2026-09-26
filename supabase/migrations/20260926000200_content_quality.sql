-- Sky content-quality migration (2026-09-26).
-- Converts 24 worksheet-style multiple_choice activities into genuinely
-- interactive manipulatives (sequence / sort / tap_count / trace /
-- tap_target). Guarded UPDATEs match exactly one row each
-- (skill code + level + kind + the exact Phase 3 prompt). Activity UUIDs
-- are preserved, so learning_events.activity_id references survive.
-- Idempotent: after the first run the old prompts no longer exist, so a
-- second run updates zero rows. Also safe after a re-run of the
-- 20260925000300 content refresh (the old prompts come back, and these
-- UPDATEs re-apply cleanly in migration order).
-- Also redefines submit_attempt so self-reported listen_repeat attempts
-- earn zero points: they stay playable practice, but can no longer farm
-- wallet stars or quest stars. Grading, event logging, the no-mastery
-- rule, return shape, search_path, and SECURITY DEFINER are unchanged.

BEGIN;

-- 1. Quality conversions (24 guarded UPDATEs).
UPDATE public.activities
SET kind = 'sequence',
    prompt_text = 'Pip was shelving books: A, B... then a gust blew two off the shelf! Put them back in ABC order.',
    card = '{"items": [{"id": "s1", "label": "B"}, {"id": "s3", "label": "D"}, {"id": "s2", "label": "C"}, {"id": "s0", "label": "A"}], "narration": "Pip was shelving books: A, B... then a gust blew two off the shelf! Put them back in ABC order."}'::jsonb,
    answer = '{"sequence": ["s0", "s1", "s2", "s3"]}'::jsonb
WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'alphabet')
  AND level = 2
  AND kind = 'multiple_choice'
  AND prompt_text = 'Pip was shelving books: A, B... then a gust took the next one! Which letter goes after B?';

UPDATE public.activities
SET kind = 'sequence',
    prompt_text = 'Pip sounded out ''mmm-aaa-puh'' but the letters bounced away! Put them in order to build the word he read.',
    card = '{"items": [{"id": "s1", "label": "A"}, {"id": "s2", "label": "P"}, {"id": "s0", "label": "M"}], "narration": "Pip sounded out ''mmm-aaa-puh'' but the letters bounced away! Put them in order to build the word he read."}'::jsonb,
    answer = '{"sequence": ["s0", "s1", "s2"]}'::jsonb
WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'blending')
  AND level = 2
  AND kind = 'multiple_choice'
  AND prompt_text = 'Pip sounded out ''mmm-aaa-puh''. Which word did he read?';

UPDATE public.activities
SET kind = 'sequence',
    prompt_text = 'Hoot is stuck on a bedtime word: ''sss-uuu-nnn''. Line up the letters to build the word!',
    card = '{"items": [{"id": "s2", "label": "N"}, {"id": "s0", "label": "S"}, {"id": "s1", "label": "U"}], "narration": "Hoot is stuck on a bedtime word: ''sss-uuu-nnn''. Line up the letters to build the word!"}'::jsonb,
    answer = '{"sequence": ["s0", "s1", "s2"]}'::jsonb
WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'blending')
  AND level = 3
  AND kind = 'multiple_choice'
  AND prompt_text = 'Hoot is stuck on a bedtime word: ''sss-uuu-nnn''. Help him. Which word?';

UPDATE public.activities
SET kind = 'sort',
    prompt_text = 'Hoot''s flying words got mixed up in the wind! Sort them: words with one part, and words with more parts.',
    card = '{"items": [{"id": "g1i0", "label": "pilot", "group": "More parts"}, {"id": "g1i1", "label": "helicopter", "group": "More parts"}, {"id": "g0i0", "label": "wing", "group": "One part"}, {"id": "g0i1", "label": "cloud", "group": "One part"}], "groups": [{"id": "g0", "label": "One part"}, {"id": "g1", "label": "More parts"}], "narration": "Hoot''s flying words got mixed up in the wind! Sort them: words with one part, and words with more parts."}'::jsonb,
    answer = '{"groups": {"g0": ["g0i0", "g0i1"], "g1": ["g1i0", "g1i1"]}}'::jsonb
WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'blending')
  AND level = 5
  AND kind = 'multiple_choice'
  AND prompt_text = 'Hoot found three flying words. Which one has the MOST parts?';

UPDATE public.activities
SET kind = 'trace',
    prompt_text = 'Pip''s cheese sign says CHE_SE now — the sprites ate a letter! Trace the missing letter E to fix his sign.',
    card = '{"trace": "the letter E", "narration": "Pip''s cheese sign says CHE_SE now — the sprites ate a letter! Trace the missing letter E to fix his sign."}'::jsonb,
    answer = '{"min_coverage": 0.6}'::jsonb
WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'trace_letters')
  AND level = 2
  AND kind = 'multiple_choice'
  AND prompt_text = 'Pip''s cheese sign says CHE_SE now — the sprites ate a letter! Which letter is missing?';

UPDATE public.activities
SET kind = 'trace',
    prompt_text = 'The sprites mixed up the letters on Pip''s note! Trace the letter b to show Pip which one is his.',
    card = '{"trace": "the letter b", "narration": "The sprites mixed up the letters on Pip''s note! Trace the letter b to show Pip which one is his."}'::jsonb,
    answer = '{"min_coverage": 0.6}'::jsonb
WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'trace_letters')
  AND level = 3
  AND kind = 'multiple_choice'
  AND prompt_text = 'The sprites mixed up the letters on Pip''s note! Which one is the letter b?';

UPDATE public.activities
SET kind = 'trace',
    prompt_text = 'Pip''s cheese sign says CHE_SE — a sprite took a bite! Trace the missing letter E to fix the sign.',
    card = '{"trace": "the letter E", "narration": "Pip''s cheese sign says CHE_SE — a sprite took a bite! Trace the missing letter E to fix the sign."}'::jsonb,
    answer = '{"min_coverage": 0.6}'::jsonb
WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'build_words')
  AND level = 1
  AND kind = 'multiple_choice'
  AND prompt_text = 'Pip''s cheese sign says CHE_SE — a sprite took a bite! Which letter is missing?';

UPDATE public.activities
SET kind = 'trace',
    prompt_text = 'Pip''s new sign says THU_B — a sprite is sitting on a letter! Trace the missing letter M to finish his sign.',
    card = '{"trace": "the letter M", "narration": "Pip''s new sign says THU_B — a sprite is sitting on a letter! Trace the missing letter M to finish his sign."}'::jsonb,
    answer = '{"min_coverage": 0.6}'::jsonb
WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'build_words')
  AND level = 3
  AND kind = 'multiple_choice'
  AND prompt_text = 'Pip''s new sign says THU_B — a sprite is sitting on a letter! Which letter is missing?';

UPDATE public.activities
SET kind = 'tap_count',
    prompt_text = 'Sprocket dropped his gears — plip, plop! Tap each gear to count them all.',
    card = '{"thing": "gears", "total": 3, "narration": "Sprocket dropped his gears — plip, plop! Tap each gear to count them all."}'::jsonb,
    answer = '{"count": 3}'::jsonb
WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'count')
  AND level = 1
  AND kind = 'multiple_choice'
  AND prompt_text = 'Sprocket dropped his gears — plip, plop! Milo sees 2 gears, then 1 more rolls out. How many gears?';

UPDATE public.activities
SET kind = 'tap_count',
    prompt_text = 'Milo''s counting machine is blinking! Tap once for each blink to count them.',
    card = '{"thing": "machine blinks", "total": 8, "narration": "Milo''s counting machine is blinking! Tap once for each blink to count them."}'::jsonb,
    answer = '{"count": 8}'::jsonb
WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'count')
  AND level = 2
  AND kind = 'multiple_choice'
  AND prompt_text = 'Milo''s counting machine blinked 6 times, then 2 more times. What number did the machine record?';

UPDATE public.activities
SET kind = 'tap_count',
    prompt_text = 'Sprocket packed a box of crystal bolts. Tap each bolt to count them all!',
    card = '{"thing": "crystal bolts", "total": 14, "narration": "Sprocket packed a box of crystal bolts. Tap each bolt to count them all!"}'::jsonb,
    answer = '{"count": 14}'::jsonb
WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'count')
  AND level = 3
  AND kind = 'multiple_choice'
  AND prompt_text = 'Sprocket packed a box of crystal bolts and forgot the total. Milo counted 14. Which number goes on the label?';

UPDATE public.activities
SET kind = 'tap_count',
    prompt_text = 'Sprocket dropped 4 gears into the oil pan — sploosh! Tap each gear to count them.',
    card = '{"thing": "gears in the oil pan", "total": 4, "narration": "Sprocket dropped 4 gears into the oil pan — sploosh! Tap each gear to count them."}'::jsonb,
    answer = '{"count": 4}'::jsonb
WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'cardinality')
  AND level = 1
  AND kind = 'multiple_choice'
  AND prompt_text = 'Sprocket dropped 4 gears into the oil pan — sploosh! How many gears are in the pan?';

UPDATE public.activities
SET kind = 'tap_count',
    prompt_text = 'Bolt flashed into the counting jar! Tap each flash to count them all.',
    card = '{"thing": "flashes in the jar", "total": 9, "narration": "Bolt flashed into the counting jar! Tap each flash to count them all."}'::jsonb,
    answer = '{"count": 9}'::jsonb
WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'cardinality')
  AND level = 2
  AND kind = 'multiple_choice'
  AND prompt_text = 'Bolt flashed 9 times into the counting jar. Milo peeked: 8, 9, or 10? How many flashes are in the jar?';

UPDATE public.activities
SET kind = 'tap_count',
    prompt_text = 'Sprocket needs 12 bolts: some in the tray, some on the floor. Tap each bolt to count them!',
    card = '{"thing": "bolts", "total": 12, "narration": "Sprocket needs 12 bolts: some in the tray, some on the floor. Tap each bolt to count them!"}'::jsonb,
    answer = '{"count": 12}'::jsonb
WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'cardinality')
  AND level = 3
  AND kind = 'multiple_choice'
  AND prompt_text = 'Sprocket needs 12 bolts for his gadget. He counted 10 in the tray and 2 on the floor. How many bolts is that?';

UPDATE public.activities
SET kind = 'sequence',
    prompt_text = 'The master gate code grows: 5, 10, 15... Line up the number stones in growing order to open the gate!',
    card = '{"items": [{"id": "s3", "label": "20"}, {"id": "s1", "label": "10"}, {"id": "s2", "label": "15"}, {"id": "s0", "label": "5"}], "narration": "The master gate code grows: 5, 10, 15... Line up the number stones in growing order to open the gate!"}'::jsonb,
    answer = '{"sequence": ["s0", "s1", "s2", "s3"]}'::jsonb
WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'shapes_patterns')
  AND level = 5
  AND kind = 'multiple_choice'
  AND prompt_text = 'The master gate code: 5, 10, 15... You designed this bridge! What number opens the gate?';

UPDATE public.activities
SET kind = 'sort',
    prompt_text = 'Buzz buzz! Sprout''s parts got all jumbled in the wind! Sort them: parts above the soil, and parts below.',
    card = '{"items": [{"id": "g0i0", "label": "leaves", "group": "Above the soil"}, {"id": "g0i2", "label": "flower", "group": "Above the soil"}, {"id": "g0i1", "label": "stem", "group": "Above the soil"}, {"id": "g1i0", "label": "roots", "group": "Below the soil"}], "groups": [{"id": "g0", "label": "Above the soil"}, {"id": "g1", "label": "Below the soil"}], "narration": "Buzz buzz! Sprout''s parts got all jumbled in the wind! Sort them: parts above the soil, and parts below."}'::jsonb,
    answer = '{"groups": {"g0": ["g0i0", "g0i1", "g0i2"], "g1": ["g1i0"]}}'::jsonb
WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'plants')
  AND level = 1
  AND kind = 'multiple_choice'
  AND prompt_text = 'Buzz buzz! Sprout is getting tall! Which part holds Sprout up straight?';

UPDATE public.activities
SET kind = 'sort',
    prompt_text = 'Buzz buzz! Buzzy''s treasure box is a jumble! Sort what could grow into a new plant from what never could.',
    card = '{"items": [{"id": "g0i1", "label": "a sunflower seed", "group": "Could grow into a plant"}, {"id": "g1i1", "label": "a marble", "group": "Could never grow"}, {"id": "g0i0", "label": "an apple seed", "group": "Could grow into a plant"}, {"id": "g1i0", "label": "a pebble", "group": "Could never grow"}, {"id": "g1i2", "label": "a button", "group": "Could never grow"}], "groups": [{"id": "g0", "label": "Could grow into a plant"}, {"id": "g1", "label": "Could never grow"}], "narration": "Buzz buzz! Buzzy''s treasure box is a jumble! Sort what could grow into a new plant from what never could."}'::jsonb,
    answer = '{"groups": {"g0": ["g0i0", "g0i1"], "g1": ["g1i0", "g1i1", "g1i2"]}}'::jsonb
WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'plants')
  AND level = 3
  AND kind = 'multiple_choice'
  AND prompt_text = 'Buzz buzz! Which of these could grow into a brand-new plant?';

UPDATE public.activities
SET kind = 'sort',
    prompt_text = 'Buzz buzz! A polar bear and a penguin feel too hot! Sort the animals into chilly homes and toasty homes.',
    card = '{"items": [{"id": "g0i1", "label": "penguin", "group": "Chilly homes"}, {"id": "g0i0", "label": "polar bear", "group": "Chilly homes"}, {"id": "g1i0", "label": "camel", "group": "Toasty homes"}, {"id": "g1i1", "label": "lizard", "group": "Toasty homes"}], "groups": [{"id": "g0", "label": "Chilly homes"}, {"id": "g1", "label": "Toasty homes"}], "narration": "Buzz buzz! A polar bear and a penguin feel too hot! Sort the animals into chilly homes and toasty homes."}'::jsonb,
    answer = '{"groups": {"g0": ["g0i0", "g0i1"], "g1": ["g1i0", "g1i1"]}}'::jsonb
WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'animals_habitats')
  AND level = 2
  AND kind = 'multiple_choice'
  AND prompt_text = 'Buzz buzz! A polar bear is visiting and feels too hot! Where does a polar bear feel at home?';

UPDATE public.activities
SET kind = 'sort',
    prompt_text = 'Buzz buzz! Rain clouds are coming! Help Bea pack: what goes in the bag for a rainy day?',
    card = '{"items": [{"id": "g0i1", "label": "rain boots", "group": "Pack for the rain"}, {"id": "g1i0", "label": "sunglasses", "group": "Leave at home"}, {"id": "g0i0", "label": "a raincoat", "group": "Pack for the rain"}, {"id": "g0i2", "label": "an umbrella", "group": "Pack for the rain"}, {"id": "g1i2", "label": "a fan", "group": "Leave at home"}, {"id": "g1i1", "label": "a sun hat", "group": "Leave at home"}], "groups": [{"id": "g0", "label": "Pack for the rain"}, {"id": "g1", "label": "Leave at home"}], "narration": "Buzz buzz! Rain clouds are coming! Help Bea pack: what goes in the bag for a rainy day?"}'::jsonb,
    answer = '{"groups": {"g0": ["g0i0", "g0i1", "g0i2"], "g1": ["g1i0", "g1i1", "g1i2"]}}'::jsonb
WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'weather')
  AND level = 2
  AND kind = 'multiple_choice'
  AND prompt_text = 'Buzz buzz! Dewdrop''s weather station shows rain clouds! What should Bea pack?';

UPDATE public.activities
SET kind = 'sort',
    prompt_text = 'Buzz buzz! Bea is testing her experiment corner! Sort what floats in the pond from what sinks.',
    card = '{"items": [{"id": "g1i0", "label": "a coin", "group": "Sinks"}, {"id": "g0i0", "label": "a wooden block", "group": "Floats"}, {"id": "g0i1", "label": "a leaf", "group": "Floats"}, {"id": "g1i1", "label": "a rock", "group": "Sinks"}], "groups": [{"id": "g0", "label": "Floats"}, {"id": "g1", "label": "Sinks"}], "narration": "Buzz buzz! Bea is testing her experiment corner! Sort what floats in the pond from what sinks."}'::jsonb,
    answer = '{"groups": {"g0": ["g0i0", "g0i1"], "g1": ["g1i0", "g1i1"]}}'::jsonb
WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'experiments')
  AND level = 1
  AND kind = 'multiple_choice'
  AND prompt_text = 'Buzz buzz! Bea drops a wooden block and a coin into the pond! Which one floats?';

UPDATE public.activities
SET kind = 'tap_target',
    prompt_text = 'WHIRR! The weaving has a SNAG: red, blue, red, GREEN, red, blue... Tap the thread that broke the pattern!',
    card = '{"targets": [{"id": "o1", "label": "yellow"}, {"id": "o2", "label": "red"}, {"id": "o3", "label": "blue"}, {"id": "o0", "label": "green"}], "narration": "WHIRR! The weaving has a SNAG: red, blue, red, GREEN, red, blue... Tap the thread that broke the pattern!"}'::jsonb,
    answer = '{"choice": "o0"}'::jsonb
WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'patterns_coding')
  AND level = 4
  AND kind = 'multiple_choice'
  AND prompt_text = 'WHIRR! The weaving has a SNAG: red, blue, red, GREEN, red, blue... Which thread broke the pattern?';

UPDATE public.activities
SET kind = 'sequence',
    prompt_text = 'BEEP! Master weaver! The royal blanket grows row by row. Lay out the rows in growing order!',
    card = '{"items": [{"id": "s0", "label": "2 red threads"}, {"id": "s3", "label": "8 red threads"}, {"id": "s1", "label": "4 red threads"}, {"id": "s2", "label": "6 red threads"}], "narration": "BEEP! Master weaver! The royal blanket grows row by row. Lay out the rows in growing order!"}'::jsonb,
    answer = '{"sequence": ["s0", "s1", "s2", "s3"]}'::jsonb
WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'patterns_coding')
  AND level = 5
  AND kind = 'multiple_choice'
  AND prompt_text = 'BEEP! Master weaver! The royal blanket grows: 2 red, 4 red, 6 red... How many red threads in the next row?';

UPDATE public.activities
SET kind = 'tap_count',
    prompt_text = 'BEEP! Sprocket winds his toy: turn, turn, turn, turn! Tap once for each turn to count them.',
    card = '{"thing": "turns", "total": 4, "narration": "BEEP! Sprocket winds his toy: turn, turn, turn, turn! Tap once for each turn to count them."}'::jsonb,
    answer = '{"count": 4}'::jsonb
WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'loops')
  AND level = 1
  AND kind = 'multiple_choice'
  AND prompt_text = 'BEEP! Sprocket winds his toy: turn, turn, turn, turn. How many turns did the loop do?';

UPDATE public.activities
SET kind = 'sequence',
    prompt_text = 'Riff showed you his dance: first a twirl, then a hop, then a FREEZE! Line up the moves in order!',
    card = '{"items": [{"id": "s2", "label": "FREEZE"}, {"id": "s0", "label": "twirl"}, {"id": "s1", "label": "hop"}], "narration": "Riff showed you his dance: first a twirl, then a hop, then a FREEZE! Line up the moves in order!"}'::jsonb,
    answer = '{"sequence": ["s0", "s1", "s2"]}'::jsonb
WHERE skill_id = (SELECT id FROM public.skills WHERE code = 'dance')
  AND level = 1
  AND kind = 'multiple_choice'
  AND prompt_text = 'Riff showed you two moves: first a twirl, then a hop. Which move came FIRST?';

-- 2. listen_repeat earns no points (self-reported practice).
-- submit_attempt: identical grading and return shape as
-- 20260926000100_game_learning.sql, except self-reported listen_repeat
-- attempts earn zero points (they are practice, not farmable rewards).
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

  -- listen_repeat is self-reported ("I said it"): it never earns points,
  -- so a child cannot farm wallet stars or quest stars by tapping the button.
  -- The attempt is still logged as practice with points_earned = 0.
  if v_correct and v_act.kind <> 'listen_repeat' then
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

COMMIT;
