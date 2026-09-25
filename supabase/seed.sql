-- Sky - Phase 1 starter activity bank
--
-- RUNS ONCE per fresh database, AFTER every migration in
-- supabase/migrations/ (supabase db reset style: migrations run first,
-- then this seed file).
--
-- ~70 real, solvable activities for ages 3-8, levels 1-3 only.
-- Levels 4-5 arrive in Phase 2.
--
-- Answers live ONLY in the server-side `answer` column. The activities
-- table has no client SELECT policy; children reach cards through
-- fetch_activity_card() and get graded by submit_attempt().

-- ------------------------------------------------------------------
-- reading
-- ------------------------------------------------------------------
-- alphabet (8 activities)
insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'tap_target', 'Tap the letter B.', '{"targets": [{"id": "B", "label": "B"}, {"id": "D", "label": "D"}, {"id": "P", "label": "P"}], "narration": "Tap the letter B."}'::jsonb, '{"choice": "B"}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'alphabet';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'tap_target', 'Tap the letter M.', '{"targets": [{"id": "W", "label": "W"}, {"id": "N", "label": "N"}, {"id": "M", "label": "M"}], "narration": "Tap the letter M."}'::jsonb, '{"choice": "M"}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'alphabet';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'tap_target', 'Tap the letter S.', '{"targets": [{"id": "O", "label": "O"}, {"id": "C", "label": "C"}, {"id": "S", "label": "S"}], "narration": "Tap the letter S."}'::jsonb, '{"choice": "S"}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'alphabet';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'tap_target', 'Tap the letter R.', '{"targets": [{"id": "P", "label": "P"}, {"id": "R", "label": "R"}, {"id": "B", "label": "B"}], "narration": "Tap the letter R."}'::jsonb, '{"choice": "R"}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'alphabet';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'tap_target', 'Tap the letter T.', '{"targets": [{"id": "E", "label": "E"}, {"id": "T", "label": "T"}, {"id": "F", "label": "F"}], "narration": "Tap the letter T."}'::jsonb, '{"choice": "T"}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'alphabet';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 2, 'multiple_choice', 'Which letter is missing? A, B, __, D.', '{"options": [{"id": "c", "label": "C"}, {"id": "d", "label": "F"}, {"id": "a", "label": "E"}, {"id": "b", "label": "B"}], "narration": "Say the alphabet and find the missing letter."}'::jsonb, '{"choice": "c"}'::jsonb, 15, '5-6', '7-8'
from public.skills s where s.code = 'alphabet';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 2, 'multiple_choice', 'Which letter comes right after K?', '{"options": [{"id": "b", "label": "L"}, {"id": "c", "label": "M"}, {"id": "d", "label": "K"}, {"id": "a", "label": "J"}], "narration": "Say the alphabet around K."}'::jsonb, '{"choice": "b"}'::jsonb, 15, '5-6', '7-8'
from public.skills s where s.code = 'alphabet';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 2, 'multiple_choice', 'Which letter comes right before G?', '{"options": [{"id": "a", "label": "G"}, {"id": "b", "label": "H"}, {"id": "c", "label": "E"}, {"id": "d", "label": "F"}], "narration": "Say the alphabet around G."}'::jsonb, '{"choice": "d"}'::jsonb, 15, '5-6', '7-8'
from public.skills s where s.code = 'alphabet';

-- letter_sounds (8 activities)
insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'tap_target', 'Which one starts with the ''buh'' sound, like ball?', '{"targets": [{"id": "moon", "label": "moon"}, {"id": "ball", "label": "ball"}, {"id": "cat", "label": "cat"}], "narration": "Which one starts with the ''buh'' sound?"}'::jsonb, '{"choice": "ball"}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'letter_sounds';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'tap_target', 'Which one starts with the ''mmm'' sound, like moon?', '{"targets": [{"id": "sun", "label": "sun"}, {"id": "moon", "label": "moon"}, {"id": "fish", "label": "fish"}], "narration": "Which one starts with the ''mmm'' sound?"}'::jsonb, '{"choice": "moon"}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'letter_sounds';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'tap_target', 'Which one starts with the ''tuh'' sound, like tiger?', '{"targets": [{"id": "leaf", "label": "leaf"}, {"id": "tiger", "label": "tiger"}, {"id": "bear", "label": "bear"}], "narration": "Which one starts with the ''tuh'' sound?"}'::jsonb, '{"choice": "tiger"}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'letter_sounds';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'tap_target', 'Which one starts with the ''puh'' sound, like pig?', '{"targets": [{"id": "nest", "label": "nest"}, {"id": "pig", "label": "pig"}, {"id": "frog", "label": "frog"}], "narration": "Which one starts with the ''puh'' sound?"}'::jsonb, '{"choice": "pig"}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'letter_sounds';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'tap_target', 'Which one starts with the ''duh'' sound, like dog?', '{"targets": [{"id": "hat", "label": "hat"}, {"id": "dog", "label": "dog"}, {"id": "box", "label": "box"}], "narration": "Which one starts with the ''duh'' sound?"}'::jsonb, '{"choice": "dog"}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'letter_sounds';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 2, 'multiple_choice', 'Which word starts with the same sound as sun?', '{"options": [{"id": "c", "label": "apple"}, {"id": "d", "label": "zebra"}, {"id": "a", "label": "moon"}, {"id": "b", "label": "sandwich"}], "narration": "Say ''sun'' slowly, then check each word."}'::jsonb, '{"choice": "b"}'::jsonb, 15, '5-6', '7-8'
from public.skills s where s.code = 'letter_sounds';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 2, 'multiple_choice', 'Which word starts with the same sound as cat?', '{"options": [{"id": "b", "label": "sun"}, {"id": "c", "label": "cake"}, {"id": "d", "label": "ball"}, {"id": "a", "label": "dog"}], "narration": "Say ''cat'' slowly, then check each word."}'::jsonb, '{"choice": "c"}'::jsonb, 15, '5-6', '7-8'
from public.skills s where s.code = 'letter_sounds';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 2, 'multiple_choice', 'Which letter makes the ''mmm'' sound?', '{"options": [{"id": "a", "label": "S"}, {"id": "b", "label": "M"}, {"id": "c", "label": "T"}, {"id": "d", "label": "B"}], "narration": "Hum the ''mmm'' sound and pick the letter."}'::jsonb, '{"choice": "b"}'::jsonb, 15, '5-6', '7-8'
from public.skills s where s.code = 'letter_sounds';

-- blending (6 activities)
insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'multiple_choice', 'Sound it out: c - a - t. Which word do you hear?', '{"options": [{"id": "d", "label": "cot"}, {"id": "a", "label": "cat"}, {"id": "b", "label": "cut"}, {"id": "c", "label": "cap"}], "narration": "Stretch the sounds together: ccc-aaa-ttt."}'::jsonb, '{"choice": "a"}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'blending';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'multiple_choice', 'Sound it out: d - o - g. Which word do you hear?', '{"options": [{"id": "c", "label": "dog"}, {"id": "d", "label": "dot"}, {"id": "a", "label": "dig"}, {"id": "b", "label": "dock"}], "narration": "Stretch the sounds together: ddd-ooo-ggg."}'::jsonb, '{"choice": "c"}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'blending';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'multiple_choice', 'Sound it out: s - u - n. Which word do you hear?', '{"options": [{"id": "b", "label": "fun"}, {"id": "c", "label": "sun"}, {"id": "d", "label": "sin"}, {"id": "a", "label": "son"}], "narration": "Stretch the sounds together: sss-uuu-nnn."}'::jsonb, '{"choice": "c"}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'blending';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 2, 'sequence', 'Put the word parts in order to build ''sunshine''.', '{"items": [{"id": "sun", "label": "sun"}, {"id": "shine", "label": "shine"}], "narration": "Which part comes first in ''sunshine''?"}'::jsonb, '{"sequence": ["sun", "shine"]}'::jsonb, 15, '5-6', '7-8'
from public.skills s where s.code = 'blending';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 2, 'multiple_choice', 'Sound it out: f - r - o - g. Which word do you hear?', '{"options": [{"id": "d", "label": "from"}, {"id": "a", "label": "fog"}, {"id": "b", "label": "frog"}, {"id": "c", "label": "flag"}], "narration": "Blend it slowly: fff-rrr-ooo-ggg."}'::jsonb, '{"choice": "b"}'::jsonb, 15, '5-6', '7-8'
from public.skills s where s.code = 'blending';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 2, 'multiple_choice', 'Sound it out: p - i - g. Which word do you hear?', '{"options": [{"id": "c", "label": "big"}, {"id": "d", "label": "wig"}, {"id": "a", "label": "pig"}, {"id": "b", "label": "peg"}], "narration": "Blend it slowly: ppp-iii-ggg."}'::jsonb, '{"choice": "a"}'::jsonb, 15, '5-6', '7-8'
from public.skills s where s.code = 'blending';


-- ------------------------------------------------------------------
-- math
-- ------------------------------------------------------------------
-- count (6 activities)
insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'tap_count', 'How many apples do you see?', '{"emoji_free": true, "sets": [{"label": "apples", "count": 3}], "narration": "How many apples do you see?"}'::jsonb, '{"count": 3}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'count';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'tap_count', 'How many fish do you see?', '{"emoji_free": true, "sets": [{"label": "fish", "count": 5}], "narration": "How many fish do you see?"}'::jsonb, '{"count": 5}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'count';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'tap_count', 'How many birds do you see?', '{"emoji_free": true, "sets": [{"label": "birds", "count": 2}], "narration": "How many birds do you see?"}'::jsonb, '{"count": 2}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'count';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'tap_count', 'How many stars do you see?', '{"emoji_free": true, "sets": [{"label": "stars", "count": 4}], "narration": "How many stars do you see?"}'::jsonb, '{"count": 4}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'count';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 2, 'tap_count', 'How many frogs do you see?', '{"emoji_free": true, "sets": [{"label": "frogs", "count": 7}], "narration": "How many frogs do you see?"}'::jsonb, '{"count": 7}'::jsonb, 15, '5-6', '7-8'
from public.skills s where s.code = 'count';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 2, 'tap_count', 'How many balloons do you see?', '{"emoji_free": true, "sets": [{"label": "balloons", "count": 9}], "narration": "How many balloons do you see?"}'::jsonb, '{"count": 9}'::jsonb, 15, '5-6', '7-8'
from public.skills s where s.code = 'count';

-- cardinality (4 activities)
insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'tap_count', 'Tap each puppy as you count. How many puppies?', '{"emoji_free": true, "sets": [{"label": "puppies", "count": 6}], "narration": "Tap each puppy as you count. How many puppies?"}'::jsonb, '{"count": 6}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'cardinality';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'multiple_choice', 'Count the ducks: 1, 2, 3, 4. How many ducks is that?', '{"options": [{"id": "c", "label": "5"}, {"id": "d", "label": "2"}, {"id": "a", "label": "3"}, {"id": "b", "label": "4"}], "narration": "The last number you say tells how many."}'::jsonb, '{"choice": "b"}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'cardinality';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 2, 'tap_count', 'Count every turtle. How many turtles in all?', '{"emoji_free": true, "sets": [{"label": "turtles", "count": 8}], "narration": "Count every turtle. How many turtles in all?"}'::jsonb, '{"count": 8}'::jsonb, 15, '5-6', '7-8'
from public.skills s where s.code = 'cardinality';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 2, 'multiple_choice', 'Count the kites in the sky, then pick the matching number.', '{"options": [{"id": "a", "label": "6"}, {"id": "b", "label": "8"}, {"id": "c", "label": "7"}, {"id": "d", "label": "9"}], "narration": "Count the kites on the card, then pick the number."}'::jsonb, '{"choice": "b"}'::jsonb, 15, '5-6', '7-8'
from public.skills s where s.code = 'cardinality';

-- compare_order (4 activities)
insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'tap_target', 'Which group has more?', '{"targets": [{"id": "right", "label": "5 apples"}, {"id": "left", "label": "3 apples"}], "narration": "Look at both groups and tap the one with more."}'::jsonb, '{"choice": "right"}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'compare_order';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'tap_target', 'Which group has fewer?', '{"targets": [{"id": "left", "label": "2 birds"}, {"id": "right", "label": "4 birds"}], "narration": "Look at both groups and tap the one with fewer."}'::jsonb, '{"choice": "left"}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'compare_order';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 2, 'tap_target', 'Which number is bigger?', '{"targets": [{"id": "right", "label": "9"}, {"id": "left", "label": "7"}], "narration": "Which number is bigger?"}'::jsonb, '{"choice": "right"}'::jsonb, 15, '5-6', '7-8'
from public.skills s where s.code = 'compare_order';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 2, 'tap_target', 'Which number is smaller?', '{"targets": [{"id": "left", "label": "6"}, {"id": "right", "label": "3"}], "narration": "Which number is smaller?"}'::jsonb, '{"choice": "right"}'::jsonb, 15, '5-6', '7-8'
from public.skills s where s.code = 'compare_order';

-- add (6 activities)
insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'multiple_choice', '2 apples, and 1 more apple. How many apples in all?', '{"options": [{"id": "d", "label": "1"}, {"id": "a", "label": "2"}, {"id": "b", "label": "3"}, {"id": "c", "label": "4"}], "narration": "Add them together and pick the total."}'::jsonb, '{"choice": "b"}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'add';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'tap_count', '3 birds join 2 more birds. How many birds are there now?', '{"emoji_free": true, "sets": [{"label": "birds", "count": 5}], "narration": "3 birds join 2 more birds. How many birds are there now?"}'::jsonb, '{"count": 5}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'add';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'multiple_choice', '1 fish plus 4 fish. How many fish in all?', '{"options": [{"id": "b", "label": "6"}, {"id": "c", "label": "5"}, {"id": "d", "label": "3"}, {"id": "a", "label": "4"}], "narration": "Add them together and pick the total."}'::jsonb, '{"choice": "c"}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'add';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 2, 'multiple_choice', '4 + 3 = ?', '{"options": [{"id": "a", "label": "6"}, {"id": "b", "label": "7"}, {"id": "c", "label": "8"}, {"id": "d", "label": "5"}], "narration": "Add them together and pick the total."}'::jsonb, '{"choice": "b"}'::jsonb, 15, '5-6', '7-8'
from public.skills s where s.code = 'add';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 2, 'multiple_choice', '5 + 5 = ?', '{"options": [{"id": "d", "label": "8"}, {"id": "a", "label": "9"}, {"id": "b", "label": "11"}, {"id": "c", "label": "10"}], "narration": "Add them together and pick the total."}'::jsonb, '{"choice": "c"}'::jsonb, 15, '5-6', '7-8'
from public.skills s where s.code = 'add';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 2, 'tap_count', '6 ducks and 2 more ducks join them. How many ducks now?', '{"emoji_free": true, "sets": [{"label": "ducks", "count": 8}], "narration": "6 ducks and 2 more ducks join them. How many ducks now?"}'::jsonb, '{"count": 8}'::jsonb, 15, '5-6', '7-8'
from public.skills s where s.code = 'add';

-- subtract (4 activities)
insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'multiple_choice', '5 apples. You eat 2. How many apples are left?', '{"options": [{"id": "b", "label": "3"}, {"id": "c", "label": "4"}, {"id": "d", "label": "5"}, {"id": "a", "label": "2"}], "narration": "Take away and pick what is left."}'::jsonb, '{"choice": "b"}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'subtract';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'tap_count', '4 birds are sitting. 1 flies away. How many birds are left?', '{"emoji_free": true, "sets": [{"label": "birds", "count": 3}], "narration": "4 birds are sitting. 1 flies away. How many birds are left?"}'::jsonb, '{"count": 3}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'subtract';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 2, 'multiple_choice', '8 - 3 = ?', '{"options": [{"id": "d", "label": "3"}, {"id": "a", "label": "4"}, {"id": "b", "label": "6"}, {"id": "c", "label": "5"}], "narration": "Take away and pick what is left."}'::jsonb, '{"choice": "c"}'::jsonb, 15, '5-6', '7-8'
from public.skills s where s.code = 'subtract';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 2, 'multiple_choice', '7 - 4 = ?', '{"options": [{"id": "c", "label": "3"}, {"id": "d", "label": "5"}, {"id": "a", "label": "2"}, {"id": "b", "label": "4"}], "narration": "Take away and pick what is left."}'::jsonb, '{"choice": "c"}'::jsonb, 15, '5-6', '7-8'
from public.skills s where s.code = 'subtract';


-- ------------------------------------------------------------------
-- writing
-- ------------------------------------------------------------------
-- trace_letters (3 activities)
insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'trace', 'Trace the big letter A.', '{"path": "M20 90 L55 10 L90 90 M33 62 L77 62", "narration": "Trace the big letter A with your finger."}'::jsonb, '{"min_coverage": 0.6}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'trace_letters';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'trace', 'Trace the big letter B.', '{"path": "M35 10 L35 90 M35 10 L62 10 Q80 10 80 28 Q80 46 62 48 L35 48 M35 48 L64 48 Q84 48 84 70 Q84 90 62 90 L35 90", "narration": "Trace the big letter B with your finger."}'::jsonb, '{"min_coverage": 0.6}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'trace_letters';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'trace', 'Trace the big letter C.', '{"path": "M82 28 Q60 8 36 22 Q14 36 16 60 Q18 84 42 92 Q62 98 80 84", "narration": "Trace the big letter C with your finger."}'::jsonb, '{"min_coverage": 0.6}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'trace_letters';


-- ------------------------------------------------------------------
-- science
-- ------------------------------------------------------------------
-- plants (4 activities)
insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'tap_target', 'Tap the living plant.', '{"targets": [{"id": "rock", "label": "rock"}, {"id": "car", "label": "car"}, {"id": "tree", "label": "tree"}], "narration": "Which one is alive and growing?"}'::jsonb, '{"choice": "tree"}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'plants';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'multiple_choice', 'What does a plant need to grow big and strong?', '{"options": [{"id": "b", "label": "candy"}, {"id": "c", "label": "a warm blanket"}, {"id": "d", "label": "loud music"}, {"id": "a", "label": "sunlight and water"}], "narration": "Think about what helps a garden grow."}'::jsonb, '{"choice": "a"}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'plants';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 2, 'tap_target', 'Which part of the plant drinks up water from the soil?', '{"targets": [{"id": "roots", "label": "roots"}, {"id": "flower", "label": "flower"}, {"id": "leaf", "label": "leaf"}], "narration": "Which part hides underground and drinks water?"}'::jsonb, '{"choice": "roots"}'::jsonb, 15, '5-6', '7-8'
from public.skills s where s.code = 'plants';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 2, 'multiple_choice', 'What do we call a tiny baby plant that just sprouted?', '{"options": [{"id": "d", "label": "cloud"}, {"id": "a", "label": "seedling"}, {"id": "b", "label": "pebble"}, {"id": "c", "label": "puppy"}], "narration": "It just popped out of its seed."}'::jsonb, '{"choice": "a"}'::jsonb, 15, '5-6', '7-8'
from public.skills s where s.code = 'plants';

-- weather (4 activities)
insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'tap_target', 'Tap the picture that shows rainy weather.', '{"targets": [{"id": "night", "label": "starry night"}, {"id": "rain", "label": "rainy cloud"}, {"id": "sun", "label": "sunny sky"}], "narration": "Which sky is rainy?"}'::jsonb, '{"choice": "rain"}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'weather';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'multiple_choice', 'What falls from the sky when it is very, very cold?', '{"options": [{"id": "b", "label": "leaves"}, {"id": "c", "label": "feathers"}, {"id": "d", "label": "marbles"}, {"id": "a", "label": "snow"}], "narration": "Think about a freezing winter day."}'::jsonb, '{"choice": "a"}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'weather';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 2, 'tap_target', 'Tap the lightning bolt.', '{"targets": [{"id": "rainbow", "label": "rainbow"}, {"id": "wind", "label": "windy leaves"}, {"id": "lightning", "label": "lightning bolt"}], "narration": "Which one flashes in a storm?"}'::jsonb, '{"choice": "lightning"}'::jsonb, 15, '5-6', '7-8'
from public.skills s where s.code = 'weather';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 2, 'multiple_choice', 'When does a rainbow appear in the sky?', '{"options": [{"id": "d", "label": "when clouds turn gray"}, {"id": "a", "label": "when the sun shines through rain"}, {"id": "b", "label": "when it snows at night"}, {"id": "c", "label": "when the wind blows hard"}], "narration": "Think about sunshine and rain together."}'::jsonb, '{"choice": "a"}'::jsonb, 15, '5-6', '7-8'
from public.skills s where s.code = 'weather';


-- ------------------------------------------------------------------
-- music
-- ------------------------------------------------------------------
-- rhythm (4 activities)
insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'sequence', 'Copy the pattern: clap, stomp, clap.', '{"items": [{"id": "b1", "label": "clap"}, {"id": "b2", "label": "stomp"}, {"id": "b3", "label": "clap"}], "narration": "Tap the beats in the same order you heard."}'::jsonb, '{"sequence": ["b1", "b2", "b3"]}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'rhythm';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'sequence', 'Copy the pattern: tap, tap, clap.', '{"items": [{"id": "b1", "label": "tap"}, {"id": "b2", "label": "tap"}, {"id": "b3", "label": "clap"}], "narration": "Tap the beats in the same order you heard."}'::jsonb, '{"sequence": ["b1", "b2", "b3"]}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'rhythm';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 2, 'sequence', 'Copy the pattern: stomp, clap, clap, stomp.', '{"items": [{"id": "b1", "label": "stomp"}, {"id": "b2", "label": "clap"}, {"id": "b3", "label": "clap"}, {"id": "b4", "label": "stomp"}], "narration": "This one is longer. Tap the beats in order."}'::jsonb, '{"sequence": ["b1", "b2", "b3", "b4"]}'::jsonb, 15, '5-6', '7-8'
from public.skills s where s.code = 'rhythm';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 2, 'sequence', 'Copy the pattern: clap, snap, stomp, snap.', '{"items": [{"id": "b1", "label": "clap"}, {"id": "b2", "label": "snap"}, {"id": "b3", "label": "stomp"}, {"id": "b4", "label": "snap"}], "narration": "This one is longer. Tap the beats in order."}'::jsonb, '{"sequence": ["b1", "b2", "b3", "b4"]}'::jsonb, 15, '5-6', '7-8'
from public.skills s where s.code = 'rhythm';


-- ------------------------------------------------------------------
-- feelings
-- ------------------------------------------------------------------
-- emotions (4 activities)
insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'tap_target', 'Tap the happy face.', '{"targets": [{"id": "sad", "label": "sad face"}, {"id": "angry", "label": "angry face"}, {"id": "happy", "label": "happy face"}], "narration": "Which face looks happy?"}'::jsonb, '{"choice": "happy"}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'emotions';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'tap_target', 'Tap the sad face.', '{"targets": [{"id": "scared", "label": "scared face"}, {"id": "happy", "label": "happy face"}, {"id": "sad", "label": "sad face"}], "narration": "Which face looks sad?"}'::jsonb, '{"choice": "sad"}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'emotions';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 2, 'tap_target', 'Tap the face that looks surprised.', '{"targets": [{"id": "calm", "label": "calm face"}, {"id": "sad", "label": "sad face"}, {"id": "surprised", "label": "surprised face"}], "narration": "Which face looks surprised?"}'::jsonb, '{"choice": "surprised"}'::jsonb, 15, '5-6', '7-8'
from public.skills s where s.code = 'emotions';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 2, 'tap_target', 'Tap the face that looks calm.', '{"targets": [{"id": "angry", "label": "angry face"}, {"id": "worried", "label": "worried face"}, {"id": "calm", "label": "calm face"}], "narration": "Which face looks calm and peaceful?"}'::jsonb, '{"choice": "calm"}'::jsonb, 15, '5-6', '7-8'
from public.skills s where s.code = 'emotions';

-- breathing (2 activities)
insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'listen_repeat', 'Let''s take a slow balloon breath.', '{"text": "Pretend your belly is a balloon. Breathe in through your nose to fill it up... now breathe out through your mouth and let the air out.", "narration": "Breathe along with me, then tap the button."}'::jsonb, '{}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'breathing';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'listen_repeat', 'Let''s do a counting breath.', '{"text": "Breathe in... 2... 3... Now breathe out... 2... 3... Feel your belly rise and fall like gentle waves.", "narration": "Breathe with me, then tap when you are done."}'::jsonb, '{}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'breathing';


-- ------------------------------------------------------------------
-- coding
-- ------------------------------------------------------------------
-- sequencing (3 activities)
insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'sequence', 'Put the morning steps in order.', '{"items": [{"id": "wake", "label": "wake up"}, {"id": "brush", "label": "brush teeth"}, {"id": "dress", "label": "get dressed"}], "narration": "What do you do first in the morning?"}'::jsonb, '{"sequence": ["wake", "brush", "dress"]}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'sequencing';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'sequence', 'Put the plant-growing steps in order.', '{"items": [{"id": "seed", "label": "plant the seed"}, {"id": "water", "label": "water it"}, {"id": "sprout", "label": "watch it sprout"}], "narration": "What happens first when you grow a plant?"}'::jsonb, '{"sequence": ["seed", "water", "sprout"]}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'sequencing';

insert into public.activities (skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)
select s.id, 1, 'sequence', 'Put the hand-washing steps in order.', '{"items": [{"id": "soap", "label": "rub with soap"}, {"id": "rinse", "label": "rinse with water"}, {"id": "dry", "label": "dry your hands"}], "narration": "What do you do first when you wash your hands?"}'::jsonb, '{"sequence": ["soap", "rinse", "dry"]}'::jsonb, 10, '3-4', '5-6'
from public.skills s where s.code = 'sequencing';


-- verification: one row per skill, levels covered
select s.code, count(*) as activities, min(a.level) as min_level, max(a.level) as max_level
from public.activities a join public.skills s on s.id = a.skill_id
group by s.code order by s.code;