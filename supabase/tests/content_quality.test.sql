-- Content-quality track (2026-09-26): verifies the state left behind by
-- 20260926000200_content_quality.sql on top of the historical content refresh.
-- Run by scripts/verify-db.mjs inside a throwaway database. Everything happens
-- in one transaction that is rolled back, and any failed assertion raises.

begin;

do $$
declare
  n int;
begin
  -- 880 activities survive, 1-for-1 replacement preserved.
  select count(*) into n from public.activities;
  assert n = 880, format('expected 880 activities, got %s', n);

  -- MC fell from 322 (36.59%) to 298 (33.86%); the 24 conversions landed
  -- in the right kinds.
  select count(*) into n from public.activities where kind = 'multiple_choice';
  assert n = 298, format('expected 298 multiple_choice, got %s', n);
  select count(*) into n from public.activities where kind = 'sequence';
  assert n = 121, format('expected 121 sequence, got %s', n);
  select count(*) into n from public.activities where kind = 'sort';
  assert n = 72, format('expected 72 sort, got %s', n);
  select count(*) into n from public.activities where kind = 'tap_count';
  assert n = 86, format('expected 86 tap_count, got %s', n);
  select count(*) into n from public.activities where kind = 'trace';
  assert n = 68, format('expected 68 trace, got %s', n);
  select count(*) into n from public.activities where kind = 'tap_target';
  assert n = 131, format('expected 131 tap_target, got %s', n);

  -- Spot-check converted rows: new kind + new prompt present, old prompts gone.
  select count(*) into n from public.activities
  where skill_id = (select id from public.skills where code = 'blending')
    and level = 5 and kind = 'sort'
    and prompt_text like 'Hoot''s flying words got mixed up%';
  assert n = 1, 'blending L5 sort conversion missing';
  select count(*) into n from public.activities
  where skill_id = (select id from public.skills where code = 'patterns_coding')
    and level = 4 and kind = 'tap_target'
    and prompt_text like 'WHIRR! The weaving has a SNAG%';
  assert n = 1, 'patterns_coding L4 tap_target conversion missing';
  select count(*) into n from public.activities
  where kind = 'multiple_choice'
    and prompt_text like '%Which word did he read?%';
  assert n = 0, 'old blending L2 MC prompt should be gone';

  -- Converted answers resolve inside their cards (server-side grading shape).
  select count(*) into n from public.activities a
  where a.kind = 'sequence'
    and exists (
      select 1
      from jsonb_array_elements_text(a.answer -> 'sequence') sid
      where not exists (
        select 1 from jsonb_array_elements(a.card -> 'items') it
        where it ->> 'id' = sid));
  assert n = 0, format('%s sequence activities have dangling answer ids', n);

  -- Guarded UPDATEs are idempotent: re-running one matches zero rows now.
  update public.activities
  set kind = 'sequence'
  where skill_id = (select id from public.skills where code = 'alphabet')
    and level = 2
    and kind = 'multiple_choice'
    and prompt_text = 'Pip was shelving books: A, B... then a gust took the next one! Which letter goes after B?';
  get diagnostics n = row_count;
  assert n = 0, format('guarded UPDATE matched %s rows on second run', n);
end;
$$;

rollback;
