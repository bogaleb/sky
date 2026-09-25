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
