#!/usr/bin/env python3
"""Sky content-quality overlay (2026-09-26).

Centralized, auditable conversions of ambiguous / worksheet-style
multiple-choice activities into genuinely interactive manipulatives
(sequence, sort, tap_count, trace, tap_target).

Runs AFTER all subject modules in bank_phase3.py, BEFORE validation.
Each conversion finds the exact MC by (skill, level, prompt), removes it,
and builds the replacement with the standard core helpers — 1-for-1, so
the bank stays at 880 activities / 4 per skill x level. Fails loudly if a
target prompt is missing, so a prompt edit in a subject module surfaces
here instead of silently skipping.

Ambiguous items are deliberately left as multiple_choice; see the per-item
notes in CONVERSIONS.

Also renders supabase/migrations/20260926000200_content_quality.sql as
guarded UPDATEs (skill code + level + kind + exact old prompt), so existing
activity UUIDs — and learning_events.activity_id references — survive the
upgrade. The same run also redefines submit_attempt so self-reported
listen_repeat attempts earn zero points (they remain playable practice,
but can no longer farm wallet / quest stars).
"""
import json
import pathlib

from core import ACTS, AGES, seq, sort, tc, trace, tt

# skill, level, exact old MC prompt -> replacement spec.
# kind-specific payload keys: sequence -> items; sort -> groups;
# tap_count -> count, thing; trace -> trace_label; tap_target -> correct, distractors.
CONVERSIONS: list[dict] = [
    # ---- reading ------------------------------------------------------
    # alphabet L2 "which letter goes after B?" -> order A-D (the MC's own
    # story, now acted out). The level's other sequence uses L-O.
    dict(skill="alphabet", level=2,
         old_prompt="Pip was shelving books: A, B... then a gust took the next one! "
                    "Which letter goes after B?",
         kind="sequence",
         prompt="Pip was shelving books: A, B... then a gust blew two off the shelf! "
                "Put them back in ABC order.",
         items=["A", "B", "C", "D"]),
    # blending L2/L3: sounding-out items -> build the word from its sounds.
    dict(skill="blending", level=2,
         old_prompt="Pip sounded out 'mmm-aaa-puh'. Which word did he read?",
         kind="sequence",
         prompt="Pip sounded out 'mmm-aaa-puh' but the letters bounced away! Put them "
                "in order to build the word he read.",
         items=["M", "A", "P"]),
    dict(skill="blending", level=3,
         old_prompt="Hoot is stuck on a bedtime word: 'sss-uuu-nnn'. Help him. Which word?",
         kind="sequence",
         prompt="Hoot is stuck on a bedtime word: 'sss-uuu-nnn'. Line up the letters "
                "to build the word!",
         items=["S", "U", "N"]),
    # blending L5 "which word has the MOST parts?" -> sort words by part count.
    dict(skill="blending", level=5,
         old_prompt="Hoot found three flying words. Which one has the MOST parts?",
         kind="sort",
         prompt="Hoot's flying words got mixed up in the wind! Sort them: words with "
                "one part, and words with more parts.",
         groups={"One part": ["wing", "cloud"],
                 "More parts": ["pilot", "helicopter"]}),
    # ---- writing ------------------------------------------------------
    # trace_letters L2: the cheese-sign item -> trace the missing letter.
    dict(skill="trace_letters", level=2,
         old_prompt="Pip's cheese sign says CHE_SE now \u2014 the sprites ate a letter! "
                    "Which letter is missing?",
         kind="trace",
         prompt="Pip's cheese sign says CHE_SE now \u2014 the sprites ate a letter! "
                "Trace the missing letter E to fix his sign.",
         trace_label="the letter E"),
    # trace_letters L3: b/d/p/q confusion -> trace the b (the actual
    # intervention for mirror-letter confusion).
    dict(skill="trace_letters", level=3,
         old_prompt="The sprites mixed up the letters on Pip's note! Which one is the letter b?",
         kind="trace",
         prompt="The sprites mixed up the letters on Pip's note! Trace the letter b "
                "to show Pip which one is his.",
         trace_label="the letter b"),
    # build_words L1/L3: missing-letter signs -> trace the missing letter
    # (no trace activity exists yet at these build_words levels).
    dict(skill="build_words", level=1,
         old_prompt="Pip's cheese sign says CHE_SE \u2014 a sprite took a bite! Which letter "
                    "is missing?",
         kind="trace",
         prompt="Pip's cheese sign says CHE_SE \u2014 a sprite took a bite! Trace the "
                "missing letter E to fix the sign.",
         trace_label="the letter E"),
    dict(skill="build_words", level=3,
         old_prompt="Pip's new sign says THU_B \u2014 a sprite is sitting on a letter! Which "
                    "letter is missing?",
         kind="trace",
         prompt="Pip's new sign says THU_B \u2014 a sprite is sitting on a letter! Trace "
                "the missing letter M to finish his sign.",
         trace_label="the letter M"),
    # ---- math ---------------------------------------------------------
    # count / cardinality "how many" items -> tap to count the things.
    # (Comparison items like "how many MORE" stay multiple_choice.)
    dict(skill="count", level=1,
         old_prompt="Sprocket dropped his gears \u2014 plip, plop! Milo sees 2 gears, then 1 "
                    "more rolls out. How many gears?",
         kind="tap_count",
         prompt="Sprocket dropped his gears \u2014 plip, plop! Tap each gear to count them all.",
         count=3, thing="gears"),
    dict(skill="count", level=2,
         old_prompt="Milo's counting machine blinked 6 times, then 2 more times. What number "
                    "did the machine record?",
         kind="tap_count",
         prompt="Milo's counting machine is blinking! Tap once for each blink to count them.",
         count=8, thing="machine blinks"),
    dict(skill="count", level=3,
         old_prompt="Sprocket packed a box of crystal bolts and forgot the total. Milo counted "
                    "14. Which number goes on the label?",
         kind="tap_count",
         prompt="Sprocket packed a box of crystal bolts. Tap each bolt to count them all!",
         count=14, thing="crystal bolts"),
    dict(skill="cardinality", level=1,
         old_prompt="Sprocket dropped 4 gears into the oil pan \u2014 sploosh! How many gears "
                    "are in the pan?",
         kind="tap_count",
         prompt="Sprocket dropped 4 gears into the oil pan \u2014 sploosh! Tap each gear to "
                "count them.",
         count=4, thing="gears in the oil pan"),
    dict(skill="cardinality", level=2,
         old_prompt="Bolt flashed 9 times into the counting jar. Milo peeked: 8, 9, or 10? How "
                    "many flashes are in the jar?",
         kind="tap_count",
         prompt="Bolt flashed into the counting jar! Tap each flash to count them all.",
         count=9, thing="flashes in the jar"),
    dict(skill="cardinality", level=3,
         old_prompt="Sprocket needs 12 bolts for his gadget. He counted 10 in the tray and 2 "
                    "on the floor. How many bolts is that?",
         kind="tap_count",
         prompt="Sprocket needs 12 bolts: some in the tray, some on the floor. Tap each "
                "bolt to count them!",
         count=12, thing="bolts"),
    # shapes_patterns L5: growing gate code -> lay the growing row.
    dict(skill="shapes_patterns", level=5,
         old_prompt="The master gate code: 5, 10, 15... You designed this bridge! What number "
                    "opens the gate?",
         kind="sequence",
         prompt="The master gate code grows: 5, 10, 15... Line up the number stones in "
                "growing order to open the gate!",
         items=["5", "10", "15", "20"]),
    # ---- science ------------------------------------------------------
    # plants L1: "which part holds Sprout up?" -> sort above/below the soil.
    dict(skill="plants", level=1,
         old_prompt="Buzz buzz! Sprout is getting tall! Which part holds Sprout up straight?",
         kind="sort",
         prompt="Buzz buzz! Sprout's parts got all jumbled in the wind! Sort them: parts "
                "above the soil, and parts below.",
         groups={"Above the soil": ["leaves", "stem", "flower"],
                 "Below the soil": ["roots"]}),
    # plants L3: "which could grow into a new plant?" -> sort growers / never-growers.
    dict(skill="plants", level=3,
         old_prompt="Buzz buzz! Which of these could grow into a brand-new plant?",
         kind="sort",
         prompt="Buzz buzz! Buzzy's treasure box is a jumble! Sort what could grow into a "
                "new plant from what never could.",
         groups={"Could grow into a plant": ["an apple seed", "a sunflower seed"],
                 "Could never grow": ["a pebble", "a marble", "a button"]}),
    # animals_habitats L2: polar-bear home -> sort chilly vs toasty homes.
    dict(skill="animals_habitats", level=2,
         old_prompt="Buzz buzz! A polar bear is visiting and feels too hot! Where does a polar "
                    "bear feel at home?",
         kind="sort",
         prompt="Buzz buzz! A polar bear and a penguin feel too hot! Sort the animals into "
                "chilly homes and toasty homes.",
         groups={"Chilly homes": ["polar bear", "penguin"],
                 "Toasty homes": ["camel", "lizard"]}),
    # weather L2: "what should Bea pack?" -> pack for rain vs leave at home.
    dict(skill="weather", level=2,
         old_prompt="Buzz buzz! Dewdrop's weather station shows rain clouds! What should Bea pack?",
         kind="sort",
         prompt="Buzz buzz! Rain clouds are coming! Help Bea pack: what goes in the bag "
                "for a rainy day?",
         groups={"Pack for the rain": ["a raincoat", "rain boots", "an umbrella"],
                 "Leave at home": ["sunglasses", "a sun hat", "a fan"]}),
    # experiments L1: "which one floats?" -> sort floats vs sinks.
    dict(skill="experiments", level=1,
         old_prompt="Buzz buzz! Bea drops a wooden block and a coin into the pond! Which one floats?",
         kind="sort",
         prompt="Buzz buzz! Bea is testing her experiment corner! Sort what floats in the "
                "pond from what sinks.",
         groups={"Floats": ["a wooden block", "a leaf"],
                 "Sinks": ["a coin", "a rock"]}),
    # ---- coding -------------------------------------------------------
    # patterns_coding L4: find-the-snag -> tap the thread that broke it.
    dict(skill="patterns_coding", level=4,
         old_prompt="WHIRR! The weaving has a SNAG: red, blue, red, GREEN, red, blue... Which "
                    "thread broke the pattern?",
         kind="tap_target",
         prompt="WHIRR! The weaving has a SNAG: red, blue, red, GREEN, red, blue... Tap "
                "the thread that broke the pattern!",
         correct="green", distractors=["yellow", "red", "blue"]),
    # patterns_coding L5: growing blanket -> lay the growing rows (unique labels).
    dict(skill="patterns_coding", level=5,
         old_prompt="BEEP! Master weaver! The royal blanket grows: 2 red, 4 red, 6 red... How "
                    "many red threads in the next row?",
         kind="sequence",
         prompt="BEEP! Master weaver! The royal blanket grows row by row. Lay out the rows "
                "in growing order!",
         items=["2 red threads", "4 red threads", "6 red threads", "8 red threads"]),
    # loops L1: "how many turns?" -> tap to count the turns.
    dict(skill="loops", level=1,
         old_prompt="BEEP! Sprocket winds his toy: turn, turn, turn, turn. How many turns did "
                    "the loop do?",
         kind="tap_count",
         prompt="BEEP! Sprocket winds his toy: turn, turn, turn, turn! Tap once for each "
                "turn to count them.",
         count=4, thing="turns"),
    # ---- music --------------------------------------------------------
    # dance L1 "which move came FIRST?" -> line up the dance in order.
    dict(skill="dance", level=1,
         old_prompt="Riff showed you two moves: first a twirl, then a hop. Which move came FIRST?",
         kind="sequence",
         prompt="Riff showed you his dance: first a twirl, then a hop, then a FREEZE! Line "
                "up the moves in order!",
         items=["twirl", "hop", "FREEZE"]),
]

# (old activity, new activity) recorded by apply(); used to render the migration.
RECORDED: list[tuple[dict, dict]] = []


def apply() -> None:
    """Replace each target MC with its manipulative. Call once, after all
    subject modules build and before validate()."""
    for c in CONVERSIONS:
        skill, level, old_prompt = c["skill"], c["level"], c["old_prompt"]
        matches = [a for a in ACTS
                   if a["skill"] == skill and a["level"] == level
                   and a["kind"] == "multiple_choice"
                   and a["prompt_text"] == old_prompt]
        if len(matches) != 1:
            raise RuntimeError(
                f"content_quality: expected 1 multiple_choice for "
                f"{skill} L{level} with prompt {old_prompt!r}, "
                f"found {len(matches)}")
        old = matches[0]
        ACTS.remove(old)
        ages = AGES[skill]
        kind = c["kind"]
        if kind == "sequence":
            seq(skill, level, c["prompt"], c["items"], *ages)
        elif kind == "sort":
            sort(skill, level, c["prompt"], c["groups"], *ages)
        elif kind == "tap_count":
            tc(skill, level, c["prompt"], c["count"], c["thing"], *ages)
        elif kind == "trace":
            trace(skill, level, c["prompt"], c["trace_label"], *ages)
        elif kind == "tap_target":
            tt(skill, level, c["prompt"], c["correct"], c["distractors"], *ages)
        else:
            raise AssertionError(f"unknown conversion kind {kind}")
        new = ACTS[-1]
        assert new["kind"] == kind and new["prompt_text"] == c["prompt"], \
            f"content_quality: builder did not append for {skill} L{level}"
        RECORDED.append((old, new))
    print(f"content_quality: converted {len(RECORDED)} activities")


def sql_escape(s: str) -> str:
    return s.replace("'", "''")


# submit_attempt redefined: identical to 20260926000100_game_learning.sql
# except self-reported listen_repeat attempts earn zero points. Grading,
# attempt-event logging, the no-mastery rule, return shape, search_path,
# and SECURITY DEFINER are unchanged.
SUBMIT_ATTEMPT_SQL = """-- submit_attempt: identical grading and return shape as
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
"""


def write_migration(path: pathlib.Path) -> None:
    """Render 20260926000200_content_quality.sql from the recorded conversions.
    Must be called after apply(), in the same process, so the shuffled
    card/answer payloads byte-match the regenerated bank."""
    if not RECORDED:
        raise RuntimeError("content_quality: write_migration called before apply()")
    lines = [
        "-- Sky content-quality migration (2026-09-26).",
        "-- Converts 24 worksheet-style multiple_choice activities into genuinely",
        "-- interactive manipulatives (sequence / sort / tap_count / trace /",
        "-- tap_target). Guarded UPDATEs match exactly one row each",
        "-- (skill code + level + kind + the exact Phase 3 prompt). Activity UUIDs",
        "-- are preserved, so learning_events.activity_id references survive.",
        "-- Idempotent: after the first run the old prompts no longer exist, so a",
        "-- second run updates zero rows. Also safe after a re-run of the",
        "-- 20260925000300 content refresh (the old prompts come back, and these",
        "-- UPDATEs re-apply cleanly in migration order).",
        "-- Also redefines submit_attempt so self-reported listen_repeat attempts",
        "-- earn zero points: they stay playable practice, but can no longer farm",
        "-- wallet stars or quest stars. Grading, event logging, the no-mastery",
        "-- rule, return shape, search_path, and SECURITY DEFINER are unchanged.",
        "",
        "BEGIN;",
        "",
        "-- 1. Quality conversions (24 guarded UPDATEs).",
    ]
    for old, new in RECORDED:
        card = sql_escape(json.dumps(new["card"], ensure_ascii=False))
        answer = sql_escape(json.dumps(new["answer"], ensure_ascii=False))
        prompt = sql_escape(new["prompt_text"])
        old_prompt = sql_escape(old["prompt_text"])
        lines.append(
            f"UPDATE public.activities\n"
            f"SET kind = '{new['kind']}',\n"
            f"    prompt_text = '{prompt}',\n"
            f"    card = '{card}'::jsonb,\n"
            f"    answer = '{answer}'::jsonb\n"
            f"WHERE skill_id = (SELECT id FROM public.skills WHERE code = '{old['skill']}')\n"
            f"  AND level = {old['level']}\n"
            f"  AND kind = 'multiple_choice'\n"
            f"  AND prompt_text = '{old_prompt}';\n"
        )
    lines += [
        "-- 2. listen_repeat earns no points (self-reported practice).",
        SUBMIT_ATTEMPT_SQL,
        "COMMIT;",
        "",
    ]
    path.write_text("\n".join(lines))
    print(f"wrote {path} ({len(RECORDED)} conversions)")


if __name__ == "__main__":
    raise SystemExit("import me from bank_phase3.py; do not run directly")
