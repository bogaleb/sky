-- ============================================================
-- supabase/migrations/20260924000100_core.sql
-- ============================================================
-- Sky — Phase 1: family core
-- parents, children, avatars, parent_settings, entitlements, sessions,
-- gallery_art, digest_log. Row Level Security on every table.
--
-- Auth model: parents sign in with Supabase Auth (email). Children have no
-- login — nickname + avatar only (COPPA: minimal data). Kid-mode requests run
-- under the parent's JWT; every child-scoped row is fenced by
-- parent_id = auth.uid(). Answer keys and PIN hashes never reach the client:
-- the parents table has NO client policies; all access goes through the
-- SECURITY DEFINER RPCs below.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- avatars: public catalog of the original Sky cast.
-- Phase 4 adds the writing/drawing/coding hosts here; children.avatar_id is a
-- FK so the whitelist grows without schema changes.
-- ---------------------------------------------------------------------------
create table public.avatars (
  id text primary key,
  name text not null,
  species text not null,
  role text not null check (role in ('captain', 'peer', 'host')),
  subject_code text, -- set for hosts in the taxonomy migration
  sort_order integer not null
);

alter table public.avatars enable row level security;

create policy "avatars are visible to signed-in users"
  on public.avatars for select
  to authenticated
  using (true);

insert into public.avatars (id, name, species, role, sort_order) values
  ('curio', 'Curio', 'fox',      'captain', 1),
  ('nova',  'Nova',  'kid',      'peer',    2),
  ('luna',  'Luna',  'owl',      'host',    3),
  ('milo',  'Milo',  'robot',    'host',    4),
  ('bea',   'Bea',   'bee',      'host',    5),
  ('tuno',  'Tuno',  'turtle',   'host',    6),
  ('riff',  'Riff',  'rabbit',   'host',    7),
  ('atlas', 'Atlas', 'elephant', 'host',    8);

-- ---------------------------------------------------------------------------
-- parents: one row per Supabase Auth user. NO client RLS policies on purpose —
-- pin_hash must never be readable from a client session (a 4–6 digit PIN falls
-- to offline brute force). All access is via the RPCs below.
-- ---------------------------------------------------------------------------
create table public.parents (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  pin_hash text,
  pin_attempts integer not null default 0,
  pin_locked_until timestamptz,
  narration_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.parents enable row level security;

create trigger parents_updated_at
  before update on public.parents
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- children: nickname + avatar + age band. No email, no birthdate (COPPA).
-- ---------------------------------------------------------------------------
create table public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parents (id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 24),
  avatar_id text not null references public.avatars (id),
  age_band text not null check (age_band in ('3-4', '5-6', '7-8')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (parent_id, nickname)
);

alter table public.children enable row level security;

create policy "parents manage only their own children"
  on public.children for all
  to authenticated
  using (parent_id = auth.uid())
  with check (parent_id = auth.uid());

create index children_parent_id_idx on public.children (parent_id);

create trigger children_updated_at
  before update on public.children
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- parent_settings: per-child controls (daily limits, focus, age override).
-- ---------------------------------------------------------------------------
create table public.parent_settings (
  child_id uuid primary key references public.children (id) on delete cascade,
  daily_minutes integer not null default 30 check (daily_minutes between 5 and 180),
  subject_focus text[] not null default '{}',
  age_band_override text check (age_band_override in ('3-4', '5-6', '7-8')),
  narration_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.parent_settings enable row level security;

create policy "parents manage settings for their own children"
  on public.parent_settings for all
  to authenticated
  using (child_id in (select id from public.children where parent_id = auth.uid()))
  with check (child_id in (select id from public.children where parent_id = auth.uid()));

create trigger parent_settings_updated_at
  before update on public.parent_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- entitlements: subscription-ready billing state. Phase 8 stubs the paywall UI
-- against this table; plans are enforced server-side in Phase 8+.
-- ---------------------------------------------------------------------------
create table public.entitlements (
  parent_id uuid primary key references public.parents (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'plus', 'family')),
  status text not null default 'active'
    check (status in ('active', 'trialing', 'past_due', 'canceled')),
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.entitlements enable row level security;

create policy "parents read their own entitlement"
  on public.entitlements for select
  to authenticated
  using (parent_id = auth.uid());

create trigger entitlements_updated_at
  before update on public.entitlements
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- sessions: one row per kid play session (the goodbye ritual closes these).
-- ---------------------------------------------------------------------------
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  ended_reason text
    check (ended_reason in ('child_done', 'time_limit', 'parent_ended', 'timeout')),
  event_count integer not null default 0,
  islands_visited text[] not null default '{}'
);

alter table public.sessions enable row level security;

create policy "parents read their children's sessions"
  on public.sessions for select
  to authenticated
  using (child_id in (select id from public.children where parent_id = auth.uid()));

create index sessions_child_started_idx on public.sessions (child_id, started_at desc);

-- ---------------------------------------------------------------------------
-- gallery_art: the art atelier's portfolio (Phase 7). Files live in the
-- private `gallery` storage bucket; this table is the metadata index.
-- ---------------------------------------------------------------------------
create table public.gallery_art (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  storage_path text not null,
  title text not null default '' check (char_length(title) <= 60),
  created_at timestamptz not null default now()
);

alter table public.gallery_art enable row level security;

create policy "parents manage their children's gallery"
  on public.gallery_art for all
  to authenticated
  using (child_id in (select id from public.children where parent_id = auth.uid()))
  with check (child_id in (select id from public.children where parent_id = auth.uid()));

create index gallery_art_child_created_idx on public.gallery_art (child_id, created_at desc);

-- ---------------------------------------------------------------------------
-- digest_log: the weekly proof-of-learning digest (Phase 8). One row per child
-- per week; emailed_at is set when the email goes out.
-- ---------------------------------------------------------------------------
create table public.digest_log (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  week_start date not null,
  summary jsonb not null default '{}',
  emailed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (child_id, week_start)
);

alter table public.digest_log enable row level security;

create policy "parents read their children's digests"
  on public.digest_log for select
  to authenticated
  using (child_id in (select id from public.children where parent_id = auth.uid()));

create index digest_log_child_week_idx on public.digest_log (child_id, week_start desc);

-- ---------------------------------------------------------------------------
-- RPCs: the only client path to the parents table.
-- SECURITY DEFINER + fixed search_path. Called with the parent's own JWT.
-- ---------------------------------------------------------------------------

-- Ensure a parents + entitlements row exists for the signed-in user.
-- Called once right after sign-up / sign-in. Idempotent.
create or replace function public.ensure_parent_profile()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_row public.parents%rowtype;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  select email into v_email from auth.users where id = v_user_id;

  insert into public.parents (id, email)
  values (v_user_id, coalesce(v_email, ''))
  on conflict (id) do update set email = excluded.email
  returning * into v_row;

  insert into public.entitlements (parent_id)
  values (v_user_id)
  on conflict (parent_id) do nothing;

  return jsonb_build_object(
    'id', v_row.id,
    'email', v_row.email,
    'display_name', v_row.display_name,
    'has_pin', v_row.pin_hash is not null,
    'narration_enabled', v_row.narration_enabled
  );
end;
$$;

-- Read the signed-in parent's profile (pin_hash is never exposed).
create or replace function public.get_parent_profile()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.parents%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into v_row from public.parents where id = auth.uid();
  if not found then
    raise exception 'parent profile not found';
  end if;

  return jsonb_build_object(
    'id', v_row.id,
    'email', v_row.email,
    'display_name', v_row.display_name,
    'has_pin', v_row.pin_hash is not null,
    'narration_enabled', v_row.narration_enabled
  );
end;
$$;

-- Set (or change) the parent-zone PIN. 4–6 digits, bcrypt-hashed with pgcrypto.
create or replace function public.set_parent_pin(pin text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if pin is null or pin !~ '^\d{4,6}$' then
    raise exception 'PIN must be 4 to 6 digits';
  end if;

  update public.parents
  set pin_hash = crypt(pin, gen_salt('bf', 10)),
      pin_attempts = 0,
      pin_locked_until = null
  where id = auth.uid();

  return jsonb_build_object('has_pin', true);
end;
$$;

-- Verify the parent-zone PIN. 5 wrong attempts lock verification for 5 minutes.
-- Returns false (never raises) on a wrong PIN so the UI can't distinguish
-- "no PIN set" from "wrong PIN".
create or replace function public.verify_parent_pin(pin text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.parents%rowtype;
  v_ok boolean := false;
begin
  if auth.uid() is null then
    return false;
  end if;

  select * into v_row from public.parents where id = auth.uid();
  if not found or v_row.pin_hash is null then
    return false;
  end if;

  if v_row.pin_locked_until is not null and v_row.pin_locked_until > now() then
    return false;
  end if;

  v_ok := (crypt(pin, v_row.pin_hash) = v_row.pin_hash);

  if v_ok then
    update public.parents
    set pin_attempts = 0, pin_locked_until = null
    where id = v_row.id;
  else
    update public.parents
    set pin_attempts = v_row.pin_attempts + 1,
        pin_locked_until = case
          when v_row.pin_attempts + 1 >= 5 then now() + interval '5 minutes'
          else v_row.pin_locked_until
        end
    where id = v_row.id;
  end if;

  return v_ok;
end;
$$;

-- Update the parent's display name + narration preference.
create or replace function public.update_parent_profile(
  p_display_name text,
  p_narration_enabled boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.parents%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_display_name is not null and char_length(p_display_name) > 40 then
    raise exception 'display name too long';
  end if;

  update public.parents
  set display_name = nullif(trim(p_display_name), ''),
      narration_enabled = coalesce(p_narration_enabled, narration_enabled)
  where id = auth.uid()
  returning * into v_row;

  return public.get_parent_profile();
end;
$$;

-- ---------------------------------------------------------------------------
-- Session RPCs (kid flow runs under the parent's JWT; ownership is checked).
-- ---------------------------------------------------------------------------

-- Open a play session for one of the caller's children. Returns the session id.
create or replace function public.start_session(p_child_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not exists (
    select 1 from public.children where id = p_child_id and parent_id = auth.uid()
  ) then
    raise exception 'child not found';
  end if;

  insert into public.sessions (child_id) values (p_child_id)
  returning id into v_session_id;
  return v_session_id;
end;
$$;

-- Close a play session (the goodbye ritual calls this).
create or replace function public.end_session(
  p_session_id uuid,
  p_reason text default 'child_done'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_child_id uuid;
  v_started timestamptz;
  v_events integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_reason not in ('child_done', 'time_limit', 'parent_ended', 'timeout') then
    raise exception 'invalid end reason';
  end if;

  select child_id, started_at into v_child_id, v_started
  from public.sessions
  where id = p_session_id
    and child_id in (select id from public.children where parent_id = auth.uid());
  if not found then
    raise exception 'session not found';
  end if;

  select count(*) into v_events
  from public.learning_events
  where session_id = p_session_id;

  update public.sessions
  set ended_at = now(),
      ended_reason = p_reason,
      event_count = v_events
  where id = p_session_id;

  return jsonb_build_object(
    'session_id', p_session_id,
    'minutes_played', greatest(0, round(extract(epoch from (now() - v_started)) / 60)),
    'event_count', v_events
  );
end;
$$;

-- Revoke execute from anon explicitly; only signed-in parents may call these.
revoke all on function public.ensure_parent_profile() from anon, public;
revoke all on function public.get_parent_profile() from anon, public;
revoke all on function public.set_parent_pin(text) from anon, public;
revoke all on function public.verify_parent_pin(text) from anon, public;
revoke all on function public.update_parent_profile(text, boolean) from anon, public;
revoke all on function public.start_session(uuid) from anon, public;
revoke all on function public.end_session(uuid, text) from anon, public;
grant execute on function public.ensure_parent_profile() to authenticated;
grant execute on function public.get_parent_profile() to authenticated;
grant execute on function public.set_parent_pin(text) to authenticated;
grant execute on function public.verify_parent_pin(text) to authenticated;
grant execute on function public.update_parent_profile(text, boolean) to authenticated;
grant execute on function public.start_session(uuid) to authenticated;
grant execute on function public.end_session(uuid, text) to authenticated;

-- ============================================================
-- supabase/migrations/20260924000200_taxonomy.sql
-- ============================================================
-- Sky — Phase 1: skill taxonomy
-- Every subject gets a real progression: named skills, 5 levels each,
-- prerequisites, and age guidance. `levels` is a JSONB array of 5 plain-
-- language descriptors (what the child can do at each level). The adaptive
-- planner (Phase 2) reads this table; the parent dashboard (Phase 8) shows it.
--
-- Skill codes are stable identifiers — the activity bank and learning events
-- reference them. Never rename a code; add new skills instead.

create table public.subjects (
  code text primary key,
  name text not null,
  tagline text not null,
  island_name text not null,
  host_character text not null references public.avatars (id),
  sort_order integer not null
);

alter table public.subjects enable row level security;

create policy "subjects are visible to signed-in users"
  on public.subjects for select
  to authenticated
  using (true);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  subject_code text not null references public.subjects (code) on delete cascade,
  code text not null unique,
  name text not null,
  summary text not null,
  age_min smallint not null check (age_min between 3 and 8),
  age_max smallint not null check (age_max between 3 and 8),
  levels jsonb not null check (jsonb_array_length(levels) = 5),
  sort_order integer not null
);

alter table public.skills enable row level security;

create policy "skills are visible to signed-in users"
  on public.skills for select
  to authenticated
  using (true);

create table public.skill_prerequisites (
  skill_id uuid not null references public.skills (id) on delete cascade,
  requires_skill_id uuid not null references public.skills (id) on delete cascade,
  requires_level smallint not null check (requires_level between 1 and 4),
  primary key (skill_id, requires_skill_id),
  check (skill_id <> requires_skill_id)
);

alter table public.skill_prerequisites enable row level security;

create policy "prerequisites are visible to signed-in users"
  on public.skill_prerequisites for select
  to authenticated
  using (true);

create index skills_subject_idx on public.skills (subject_code, sort_order);

-- ---------------------------------------------------------------------------
-- Subjects: one floating island per subject, each with its host.
-- ---------------------------------------------------------------------------
insert into public.subjects (code, name, tagline, island_name, host_character, sort_order) values
  ('reading',   'Reading',          'Letters become words, words become stories', 'The Floating Library', 'luna',  1),
  ('writing',   'Writing',          'From first traces to first sentences',       'Inkwell Isle',         'curio', 2),
  ('math',      'Math',             'Count it, build it, solve it',               'The Number Volcano',   'milo',  3),
  ('drawing',   'Drawing',          'Every artist starts with one line',          'The Painted Atelier',  'curio', 4),
  ('geography', 'Geography',        'Travel the whole wide world',                'The Observatory',      'atlas', 5),
  ('coding',    'Coding',           'Tell computers what to do, step by step',    'The Loom Cloud',       'milo',  6),
  ('science',   'Science',          'Ask, try, and find out why',                 'The Greenhouse',       'bea',   7),
  ('music',     'Music',            'Clap it, sing it, play it',                  'The Rhythm Stage',     'riff',  8),
  ('feelings',  'Feelings & Focus', 'Name it, breathe through it',                'The Quiet Cloud',      'tuno',  9);

-- Writing and drawing hosts (Quill the porcupine, Marlow the chameleon) and the
-- coding host (Ada the spider) arrive with the full cast in Phase 4; until
-- then Curio and Milo keep their islands warm. The avatar rows will be added
-- first, then these two columns updated — no code changes needed.

-- ---------------------------------------------------------------------------
-- Skills. levels = [L1..L5] plain-language "can do" descriptors.
-- ---------------------------------------------------------------------------

-- READING (host: Luna the Owl) ----------------------------------------------
insert into public.skills (subject_code, code, name, summary, age_min, age_max, levels, sort_order) values
('reading', 'alphabet', 'Alphabet knowledge',
 'Recognize and name the letters of the alphabet', 3, 6,
 '["Points to a few uppercase letters, often from their own name",
    "Names most uppercase letters when shown",
    "Names most lowercase letters when shown",
    "Matches uppercase and lowercase pairs",
    "Says the alphabet A to Z in order, fluently"]'::jsonb, 1),
('reading', 'letter_sounds', 'Letter sounds',
 'Connect each letter with the sound it makes', 4, 7,
 '["Hears the first sound in a word during sound games",
    "Says the sounds for M, S, T, A, P",
    "Says consonant sounds A to Z",
    "Says short vowel sounds (a, e, i, o, u)",
    "Says common digraphs: sh, ch, th, wh"]'::jsonb, 2),
('reading', 'blending', 'Blending sounds',
 'Push sounds together to read words', 4, 7,
 '["Blends compound words: cow + boy = cowboy",
    "Blends syllables: ta + ble = table",
    "Blends three-letter words: c-a-t = cat",
    "Blends words with digraphs and blends: ship, frog",
    "Blends longer words syllable by syllable"]'::jsonb, 3),
('reading', 'sight_words', 'Sight words',
 'Read common words instantly, without sounding out', 5, 8,
 '["Reads: I, the, and",
    "Reads 25 common sight words",
    "Reads 50 common sight words",
    "Reads 100 common sight words",
    "Reads 200 sight words fluently inside sentences"]'::jsonb, 4),
('reading', 'sentences', 'Reading sentences',
 'Read full sentences with understanding', 5, 8,
 '["Follows a sentence left to right while it is read aloud",
    "Reads three-word patterned sentences",
    "Reads simple five-word sentences",
    "Reads sentences mixing sight words and decodable words",
    "Reads varied sentences with expression"]'::jsonb, 5),
('reading', 'stories', 'Stories and comprehension',
 'Understand and talk about stories', 5, 8,
 '["Points to what happened in a story they heard",
    "Answers who and what questions about a story",
    "Retells a story in order",
    "Answers why and how questions, predicts endings",
    "Reads short chapters and tells them back in their own words"]'::jsonb, 6);

-- WRITING (host: Quill the Porcupine — Phase 4; Curio keeps the island) -------
insert into public.skills (subject_code, code, name, summary, age_min, age_max, levels, sort_order) values
('writing', 'trace_letters', 'Tracing letters',
 'Guide a finger or stylus along letter shapes', 3, 6,
 '["Traces straight lines and big curves",
    "Traces large uppercase letters",
    "Traces lowercase letters",
    "Traces letters while staying on the line",
    "Traces whole words in one smooth motion"]'::jsonb, 1),
('writing', 'build_words', 'Building words',
 'Assemble words from letters and sounds', 4, 7,
 '["Taps letters to finish spelling their name",
    "Builds three-letter words from letter tiles",
    "Builds words with digraphs (sh, ch)",
    "Builds a word from its spoken sounds",
    "Builds longer words syllable by syllable"]'::jsonb, 2),
('writing', 'write_sentences', 'Writing sentences',
 'Put words together into real sentences', 5, 8,
 '["Dictates a sentence and watches it appear",
    "Completes a sentence frame with one word",
    "Writes a patterned sentence using a word bank",
    "Writes an original sentence with finger spaces",
    "Writes two or three sentences with capitals and periods"]'::jsonb, 3);

-- MATH (host: Milo the Robot) -------------------------------------------------
insert into public.skills (subject_code, code, name, summary, age_min, age_max, levels, sort_order) values
('math', 'count', 'Counting',
 'Count objects and say numbers in order', 3, 6,
 '["Counts up to 5 objects, touching each one",
    "Counts up to 10 objects",
    "Counts up to 20 objects",
    "Counts to 50; counts by 2s and 5s",
    "Counts to 100; counts by 10s"]'::jsonb, 1),
('math', 'cardinality', 'How many?',
 'Understand that the last number counted tells how many', 3, 6,
 '["Answers how many for sets up to 3",
    "Answers how many for sets up to 5",
    "Answers how many for sets up to 10",
    "Compares two sets without recounting from one",
    "Sees small sets (up to 5) and knows how many instantly"]'::jsonb, 2),
('math', 'compare_order', 'Compare and order',
 'Decide which is more, less, or equal — and put numbers in order', 4, 7,
 '["Says which of two very different sets has more",
    "Says which set has more, up to 5 objects",
    "Puts numbers 1 to 10 in order",
    "Uses more than, less than and equal with numbers to 20",
    "Orders numbers to 100; spots odd and even"]'::jsonb, 3),
('math', 'add', 'Addition',
 'Join sets and add numbers', 4, 7,
 '["Joins two tiny sets: 1+1, 2+1",
    "Adds within 5 using objects",
    "Adds within 10",
    "Adds within 20 using the make-ten strategy",
    "Adds two-digit numbers"]'::jsonb, 4),
('math', 'subtract', 'Subtraction',
 'Take away and find the difference', 4, 8,
 '["Takes 1 away from a tiny set",
    "Subtracts within 5 using objects",
    "Subtracts within 10",
    "Subtracts within 20",
    "Explains subtraction with addition (fact families)"]'::jsonb, 5),
('math', 'place_value', 'Place value',
 'Understand tens and ones (then hundreds)', 6, 8,
 '["Builds numbers with bundles of ten and loose ones",
    "Reads and writes two-digit numbers",
    "Compares two-digit numbers",
    "Adds using tens and ones",
    "Reads, writes and compares numbers to 999"]'::jsonb, 6),
('math', 'shapes_patterns', 'Shapes and patterns',
 'Name shapes, sort them, and continue patterns', 3, 7,
 '["Spots circles, squares and triangles",
    "Names six shapes and sorts by shape",
    "Finishes AB and ABB repeating patterns",
    "Tells 2D from 3D shapes; continues growing patterns",
    "Describes shapes by sides and corners; finds symmetry"]'::jsonb, 7),
('math', 'fractions', 'First fractions',
 'Fair shares: halves, thirds and fourths', 5, 8,
 '["Shares fairly: whole versus half",
    "Finds halves of shapes",
    "Finds thirds and fourths of shapes",
    "Finds halves and fourths of small sets",
    "Sees that 1/2 and 2/4 are the same amount"]'::jsonb, 8);

-- DRAWING (host: Marlow the Chameleon — Phase 4; Curio keeps the island) ------
insert into public.skills (subject_code, code, name, summary, age_min, age_max, levels, sort_order) values
('drawing', 'brush_control', 'Brush control',
 'Guide the brush where you want it to go', 3, 6,
 '["Scribbles happily with a wide brush",
    "Follows a wavy path with the brush",
    "Stays inside a thick outline",
    "Controls a thin brush: dots and dashes",
    "Draws steady lines, curls and zigzags"]'::jsonb, 1),
('drawing', 'coloring', 'Coloring',
 'Fill pictures with color, inside the lines', 3, 7,
 '["Fills one big shape with one color",
    "Colors inside simple shapes",
    "Colors three-part pictures neatly",
    "Chooses fitting colors for detailed pages",
    "Shades with light and dark versions of a color"]'::jsonb, 2),
('drawing', 'shape_drawing', 'Drawing with shapes',
 'Build pictures out of circles, lines and squares', 4, 7,
 '["Draws circles and straight lines",
    "Draws basic shapes from a model",
    "Combines shapes into a face or a house",
    "Draws simple animals from shapes",
    "Draws an imagined scene built from shapes"]'::jsonb, 3),
('drawing', 'scene_composition', 'Picture stories',
 'Compose scenes and tell stories about them', 4, 8,
 '["Places three stickers to finish a scene",
    "Builds a scene with a background and characters",
    "Tells a story about their scene",
    "Composes scenes with foreground and background",
    "Creates a three-panel picture story"]'::jsonb, 4);

-- GEOGRAPHY (host: Atlas the Elephant) ----------------------------------------
insert into public.skills (subject_code, code, name, summary, age_min, age_max, levels, sort_order) values
('geography', 'continents_oceans', 'Continents and oceans',
 'Find land and water on the globe', 4, 8,
 '["Tells land from water on a globe",
    "Names three continents",
    "Names all seven continents",
    "Names the major oceans",
    "Matches each continent to its shape"]'::jsonb, 1),
('geography', 'landmarks', 'Landmarks',
 'Famous places, natural and human-made', 4, 8,
 '["Recognizes famous towers and statues in photos",
    "Matches four landmarks to their photos",
    "Finds landmarks on a world map",
    "Names natural wonders: canyons, reefs, waterfalls",
    "Explains why landmarks matter to people"]'::jsonb, 2),
('geography', 'world_animals', 'Animals of the world',
 'Where animals live and how they survive', 4, 8,
 '["Knows animals live in different places",
    "Matches six animals to their habitats",
    "Names an animal from each continent",
    "Explains how animals suit polar and desert homes",
    "Describes simple migrations and food chains"]'::jsonb, 3),
('geography', 'map_skills', 'Map skills',
 'Read and follow maps', 5, 8,
 '["Follows a simple picture map",
    "Uses near, far, over and under on maps",
    "Reads a map key",
    "Uses the four directions on a compass rose",
    "Reads a simple grid map"]'::jsonb, 4),
('geography', 'cultures', 'Cultures',
 'How children live around the world', 4, 8,
 '["Notices people dress and eat differently",
    "Says hello in a few languages",
    "Compares homes around the world",
    "Names festivals and celebrations",
    "Explains one tradition from another country"]'::jsonb, 5);

-- CODING (host: Ada the Spider — Phase 4; Milo keeps the island) ---------------
insert into public.skills (subject_code, code, name, summary, age_min, age_max, levels, sort_order) values
('coding', 'sequencing', 'Sequencing',
 'Put steps in the right order', 4, 7,
 '["Puts two picture steps in order",
    "Orders three steps of a familiar routine",
    "Builds a three-step program for a character",
    "Builds four-to-five-step programs with a goal",
    "Finds the missing step in a sequence"]'::jsonb, 1),
('coding', 'patterns_coding', 'Patterns in code',
 'Spot and build repeating patterns', 4, 7,
 '["Copies an AB color pattern",
    "Extends ABB and AAB patterns",
    "Invents a repeating pattern",
    "Finds the pattern inside a program",
    "Continues growing patterns: 1, 2, 3..."]'::jsonb, 2),
('coding', 'loops', 'Loops',
 'Repeat actions without repeating yourself', 5, 8,
 '["Repeats an action twice when asked: again!",
    "Uses a loop block to repeat three times",
    "Chooses how many times a loop repeats",
    "Puts a pattern inside a loop",
    "Uses two loops inside one program"]'::jsonb, 3),
('coding', 'conditions', 'Conditions',
 'Make programs choose: if this, then that', 6, 8,
 '["Plays if-then games: if it rains, take an umbrella",
    "Chooses a path with an if-block",
    "Uses if-else for two outcomes",
    "Uses a sensor: if a wall is ahead, turn",
    "Combines a condition with a loop"]'::jsonb, 4),
('coding', 'debugging', 'Debugging',
 'Find the bug and fix the program', 5, 8,
 '["Spots the silly step in two steps",
    "Fixes a three-step program with one wrong step",
    "Runs a program, watches, then fixes it",
    "Fixes programs with two bugs",
    "Explains the bug out loud, then fixes it"]'::jsonb, 5);

-- SCIENCE (host: Bea the Bee) --------------------------------------------------
insert into public.skills (subject_code, code, name, summary, age_min, age_max, levels, sort_order) values
('science', 'plants', 'Plants and growth',
 'What plants need and how they grow', 3, 7,
 '["Knows seeds need water",
    "Names root, stem, leaf and flower",
    "Lists what plants need: sun, water, soil",
    "Orders the life cycle: seed, sprout, plant, flower",
    "Predicts what happens to a plant with no light"]'::jsonb, 1),
('science', 'animals_habitats', 'Animals and habitats',
 'Where animals live and what they need', 3, 7,
 '["Matches baby animals to their parents",
    "Names three habitats and who lives there",
    "Sorts animals by what they eat",
    "Explains camouflage and protection",
    "Describes a simple food chain"]'::jsonb, 2),
('science', 'weather', 'Weather and seasons',
 'Sun, rain, snow — and the year around them', 3, 7,
 '["Names sunny, cloudy, rainy and snowy from pictures",
    "Chooses clothes for the weather",
    "Names the four seasons and their signs",
    "Orders the water cycle in simple steps",
    "Tracks weather for a week and finds patterns"]'::jsonb, 3),
('science', 'human_body', 'The human body',
 'Senses, bones, heart and how food becomes energy', 4, 8,
 '["Points to eyes, nose, mouth and hands",
    "Matches the five senses to their organs",
    "Explains bones and muscles help us move",
    "Tells what the heart and lungs do",
    "Explains simply how food gives the body energy"]'::jsonb, 4),
('science', 'experiments', 'Little experiments',
 'Predict, try, and see what happens', 4, 8,
 '["Predicts sink or float, then tests",
    "Predicts color mixes, then mixes",
    "Tests what melts ice fastest",
    "Tests how far a car rolls down ramps",
    "Plans a fair test changing one thing"]'::jsonb, 5);

-- MUSIC (host: Riff the Rabbit) ------------------------------------------------
insert into public.skills (subject_code, code, name, summary, age_min, age_max, levels, sort_order) values
('music', 'rhythm', 'Rhythm copy',
 'Hear a rhythm and play it back', 3, 7,
 '["Claps along to a steady beat",
    "Copies a two-beat pattern",
    "Copies four-beat patterns",
    "Plays loud, soft, fast and slow patterns",
    "Copies eight-beat patterns and keeps the beat"]'::jsonb, 1),
('music', 'pitch', 'Pitch matching',
 'Hear a note and sing it back', 3, 7,
 '["Tells high sounds from low sounds",
    "Sings back one note",
    "Matches two-note up and down patterns",
    "Matches three-note melodies",
    "Echoes short four-note songs"]'::jsonb, 2),
('music', 'instruments', 'Instrument explorer',
 'Discover what instruments sound like', 3, 7,
 '["Taps instruments and hears their sounds",
    "Names four instruments by sound",
    "Sorts strings, drums and winds",
    "Explains how sound is made: shake, scrape, blow",
    "Builds a three-instrument band for a mood"]'::jsonb, 3),
('music', 'dance', 'Dance-along',
 'Move with the music', 3, 6,
 '["Moves when the music plays, freezes when it stops",
    "Copies two dance moves in order",
    "Moves fast and slow with the music",
    "Copies a four-move dance",
    "Invents a four-move dance"]'::jsonb, 4);

-- FEELINGS & FOCUS (host: Tuno the Turtle) --------------------------------------
insert into public.skills (subject_code, code, name, summary, age_min, age_max, levels, sort_order) values
('feelings', 'emotions', 'Naming emotions',
 'See a feeling and give it a name', 3, 7,
 '["Names happy and sad faces",
    "Names mad, scared and surprised",
    "Matches faces to situations",
    "Notices body clues; tells big from small feelings",
    "Names mixed feelings, like nervous-excited"]'::jsonb, 1),
('feelings', 'breathing', 'Belly breathing',
 'Calm the body with slow breaths', 3, 8,
 '["Watches the bubble grow and breathe",
    "Breathes with Tuno for three breaths",
    "Does four-count breathing alone",
    "Uses breathing when upset, with a reminder",
    "Chooses breathing on their own when needed"]'::jsonb, 2),
('feelings', 'calm_down', 'Calm-down corner',
 'Pick a tool and feel better', 3, 8,
 '["Visits the calm cloud when invited",
    "Picks a calm tool: breathe, squeeze, count",
    "Names the feeling, then picks a tool",
    "Calms down with less help",
    "Helps a friend calm down"]'::jsonb, 3),
('feelings', 'attention', 'Attention games',
 'Practice focusing, even with distractions', 4, 8,
 '["Watches the firefly for ten seconds",
    "Finds the hidden star",
    "Listens for the bell among other sounds",
    "Sorts by a rule, then switches rules",
    "Plays a two-minute focus game with distractions"]'::jsonb, 4);

-- ---------------------------------------------------------------------------
-- Prerequisites: the natural chains. A skill unlocks its next level (and the
-- next skill) as mastery grows; the planner reads these in Phase 2.
-- ---------------------------------------------------------------------------
insert into public.skill_prerequisites (skill_id, requires_skill_id, requires_level)
select s.id, r.id, 3
from public.skills s
join public.skills r on r.code = (
  case s.code
    when 'letter_sounds' then 'alphabet'
    when 'blending'      then 'letter_sounds'
    when 'sight_words'   then 'blending'
    when 'sentences'     then 'sight_words'
    when 'stories'       then 'sentences'
    when 'build_words'   then 'trace_letters'
    when 'write_sentences' then 'build_words'
    when 'cardinality'   then 'count'
    when 'compare_order' then 'cardinality'
    when 'add'           then 'compare_order'
    when 'subtract'      then 'add'
    when 'place_value'   then 'subtract'
    when 'fractions'     then 'place_value'
    when 'patterns_coding' then 'sequencing'
    when 'loops'         then 'patterns_coding'
    when 'conditions'    then 'loops'
    when 'debugging'     then 'conditions'
    when 'breathing'     then 'emotions'
    when 'calm_down'     then 'breathing'
    when 'pitch'         then 'rhythm'
    else null
  end
)
where r.code is not null;

-- ============================================================
-- supabase/migrations/20260924000300_activity_bank.sql
-- ============================================================
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

-- ============================================================
-- supabase/migrations/20260924000400_learning.sql
-- ============================================================
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
set search_path = public
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
set search_path = public
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
set search_path = public
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

-- ============================================================
-- supabase/migrations/20260924000500_storage.sql
-- ============================================================
-- Sky — Phase 1: storage + media catalog
--
-- Buckets:
--   kid-media : PUBLIC read. Holds the generated video clips, posters and
--               captions (Phase 5). Only the service role may write.
--   gallery   : PRIVATE. Holds children's art-atelier uploads (Phase 7).
--               Path convention: gallery/<child_id>/<filename>.
--
-- media_clips is the single source of truth for every clip (spec §5): one row
-- per clip with caption + poster. Phase 5 fills it.

insert into storage.buckets (id, name, public)
values
  ('kid-media', 'kid-media', true),
  ('gallery', 'gallery', false)
on conflict (id) do nothing;

-- kid-media: anyone (even logged-out, for CDN caching) may read.
create policy "kid-media is publicly readable"
  on storage.objects for select
  using (bucket_id = 'kid-media');

-- kid-media: no client writes. Service role uploads in Phase 5.

-- gallery: parents read/write only their own children's folders.
create policy "parents read their children's art"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'gallery'
    and (storage.foldername(name))[1] in (
      select id::text from public.children where parent_id = auth.uid()
    )
  );

create policy "parents upload their children's art"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'gallery'
    and (storage.foldername(name))[1] in (
      select id::text from public.children where parent_id = auth.uid()
    )
  );

create policy "parents delete their children's art"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'gallery'
    and (storage.foldername(name))[1] in (
      select id::text from public.children where parent_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- media_clips: the catalog. Every clip ships with a caption and a poster.
-- ---------------------------------------------------------------------------
create table public.media_clips (
  id text primary key, -- e.g. 'curio-welcome', 'luna-intro', 'bea-teaching-seed'
  character_id text not null references public.avatars (id),
  kind text not null check (kind in (
    'welcome', 'intro', 'teaching', 'celebrate', 'encourage', 'travel', 'goodbye'
  )),
  title text not null,
  caption text not null,
  file_path text not null,  -- path inside the kid-media bucket
  poster_path text not null,
  duration_s smallint not null check (duration_s between 1 and 120),
  created_at timestamptz not null default now()
);

alter table public.media_clips enable row level security;

create policy "clip catalog is visible to signed-in users"
  on public.media_clips for select
  to authenticated
  using (true);

-- No client writes: the Phase 5 generation pipeline uses the service role.

-- ============================================================
-- supabase/seed.sql (starter activity bank)
-- ============================================================
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