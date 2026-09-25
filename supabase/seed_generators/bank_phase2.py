#!/usr/bin/env python3
"""Sky Phase 2 activity bank generator.

Fills the gaps left by supabase/seed.sql so that EVERY skill has real,
solvable activities at EVERY level (1-5). Target: 4 activities per
(skill, level); pairs already covered by seed.sql are topped up, not
duplicated.

Deterministic: the RNG seed is fixed, so the output is reproducible.

Outputs (written next to this generator's parent dir):
  supabase/seed_phase2.sql   - canonical run-once seed, portable across DBs
                               (resolves skill ids from skill codes)
  supabase/seed_phase2.json  - manifest of the same activities, used by
                               scripts/seed-live.mjs to load a live project

Validation (fails loudly, no silent bad content):
  - every (skill, level) in 44 x 1..5 ends with >= 3 activities total
  - multiple_choice/tap_target: answer.choice is one of the card option ids
  - tap_count: answer.count is a positive int matching the described total
  - sequence: answer.sequence ids are all present in card items
  - sort: answer.groups partition the card items exactly
  - trace: 0 < min_coverage <= 1
  - listen_repeat: answer is {} (self-reported in v1)
  - no duplicate prompt_text for the same skill
  - levels within 1..5, points within 1..100, bands valid
"""
import json
import pathlib
import random
import re
import sys

rng = random.Random(20260925)

HERE = pathlib.Path(__file__).resolve().parent
SUPABASE = HERE.parent
SEED1 = SUPABASE / "seed.sql"
OUT_SQL = SUPABASE / "seed_phase2.sql"
OUT_JSON = SUPABASE / "seed_phase2.json"

TARGET_PER_PAIR = 4
KINDS = {"multiple_choice", "tap_target", "tap_count", "sequence", "sort", "trace", "listen_repeat"}
BANDS = ("3-4", "5-6", "7-8")
POINTS = {1: 10, 2: 15, 3: 15, 4: 20, 5: 25}

ACTS: list[dict] = []


# --------------------------------------------------------------------------
# helpers
# --------------------------------------------------------------------------
def band_of(age: float) -> str:
    a = int(age // 1)
    return "3-4" if a <= 4 else "5-6" if a <= 6 else "7-8"


def bands(age_min: int, age_max: int, level: int) -> tuple[str, str]:
    lo = age_min + (level - 1) * (age_max - age_min) / 4
    return band_of(lo), band_of(age_max)


def add(skill: str, level: int, kind: str, prompt: str, card: dict, answer: dict,
        age_min: int, age_max: int, narration: str | None = None) -> None:
    assert kind in KINDS, kind
    c = dict(card)
    c["narration"] = narration or prompt
    mn, mx = bands(age_min, age_max, level)
    ACTS.append({
        "skill": skill, "level": level, "kind": kind,
        "prompt_text": prompt, "card": c, "answer": answer,
        "points": POINTS[level], "min_age_band": mn, "max_age_band": mx,
    })


def mc_options(correct_label: str, distractors: list[str]) -> tuple[list[dict], str]:
    """Build a shuffled multiple-choice option list. Returns (options, correct_id)."""
    labels = [correct_label] + distractors
    ids = [f"o{i}" for i in range(len(labels))]
    order = list(range(len(labels)))
    rng.shuffle(order)
    options = [{"id": ids[i], "label": labels[i]} for i in order]
    correct_id = ids[0]
    return options, correct_id


def mc(skill, level, prompt, correct, distractors, age_min, age_max, narration=None):
    options, cid = mc_options(correct, distractors)
    add(skill, level, "multiple_choice", prompt,
        {"options": options}, {"choice": cid}, age_min, age_max, narration)


def tt(skill, level, prompt, correct, distractors, age_min, age_max, narration=None, art=None):
    """tap_target with word labels (no emoji anywhere children see)."""
    options, cid = mc_options(correct, distractors)
    targets = []
    for o in options:
        t = {"id": o["id"], "label": o["label"]}
        if art and o["id"] == cid:
            t["art"] = art
        targets.append(t)
    add(skill, level, "tap_target", prompt,
        {"targets": targets}, {"choice": cid}, age_min, age_max, narration)


def shuffled(items: list) -> list:
    items = list(items)
    rng.shuffle(items)
    return items


def take(pool: list, n: int) -> list:
    """n distinct items from pool, deterministic via the seeded rng."""
    return shuffled(pool)[:n]


# --------------------------------------------------------------------------
# skill age ranges (must match 20260924000200_taxonomy.sql)
# --------------------------------------------------------------------------
AGES = {
    "alphabet": (3, 6), "letter_sounds": (4, 7), "blending": (4, 7),
    "sight_words": (5, 8), "sentences": (5, 8), "stories": (5, 8),
    "trace_letters": (3, 6), "build_words": (4, 7), "write_sentences": (5, 8),
    "count": (3, 6), "cardinality": (3, 6), "compare_order": (4, 7),
    "add": (4, 7), "subtract": (4, 8), "place_value": (6, 8),
    "shapes_patterns": (3, 7), "fractions": (5, 8),
    "brush_control": (3, 6), "coloring": (3, 7), "shape_drawing": (4, 7),
    "scene_composition": (4, 8),
    "continents_oceans": (4, 8), "landmarks": (4, 8), "world_animals": (4, 8),
    "map_skills": (5, 8), "cultures": (4, 8),
    "sequencing": (4, 7), "patterns_coding": (4, 7), "loops": (5, 8),
    "conditions": (6, 8), "debugging": (5, 8),
    "plants": (3, 7), "animals_habitats": (3, 7), "weather": (3, 7),
    "human_body": (4, 8), "experiments": (4, 8),
    "rhythm": (3, 7), "pitch": (3, 7), "instruments": (3, 7), "dance": (3, 6),
    "emotions": (3, 7), "breathing": (3, 8), "calm_down": (3, 8), "attention": (4, 8),
}


# --------------------------------------------------------------------------
# shared word / fact banks (hand-curated)
# --------------------------------------------------------------------------
UPPER = list("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
LOWER = list("abcdefghijklmnopqrstuvwxyz")

SIGHT = {
    1: ["I", "the", "and", "a", "to"],
    2: ["is", "you", "that", "it", "he", "was", "for", "on", "are", "as",
        "with", "his", "they", "at", "be", "this", "have", "from", "or", "one"],
    3: ["had", "by", "but", "not", "what", "all", "were", "we", "when", "your",
        "can", "said", "there", "use", "each", "which", "she", "do", "how", "their",
        "if", "will", "up", "other", "about"],
    4: ["out", "many", "then", "them", "these", "so", "some", "her", "would", "make",
        "like", "him", "into", "time", "has", "look", "two", "more", "write", "go",
        "see", "number", "no", "way", "could", "people", "my", "than", "first", "water",
        "been", "call", "who", "now", "find", "long", "down", "day", "did", "get"],
}
SIGHT[5] = SIGHT[4]  # L5 reuses the pool inside sentences

CVC_WORDS = ["cat", "dog", "sun", "pig", "bus", "hen", "fox", "cup", "map", "bed", "hat", "box"]
DIGRAPH_WORDS = ["ship", "fish", "chat", "thin", "shop", "chips", "whale", "thumb", "sheep", "chick"]
SYLLABLE_WORDS = [("sun", "shine"), ("but", "ter", "fly"), ("ta", "ble"),
                  ("ap", "ple"), ("ti", "ger"), ("win", "dow")]
NAMES = ["SAM", "ANA", "LEO", "MIA", "MAX", "EVA"]

SOUND_LETTERS = {  # letter -> (cue word, sound hint)
    "M": ("moon", "mmm"), "S": ("sun", "sss"), "T": ("tiger", "tuh"),
    "B": ("ball", "buh"), "C": ("cat", "kuh"), "D": ("dog", "duh"),
    "F": ("fish", "fff"), "L": ("leaf", "lll"), "N": ("nest", "nnn"),
    "P": ("pig", "puh"), "R": ("rain", "rrr"), "H": ("hat", "huh"),
}
SHORT_VOWELS = [("a", "cat"), ("e", "bed"), ("i", "pig"), ("o", "hot"), ("u", "cup")]
DIGRAPHS = [("sh", "ship"), ("ch", "cheese"), ("th", "thumb"), ("wh", "whale")]

SHAPES = ["circle", "square", "triangle", "rectangle", "oval", "diamond",
          "star", "heart", "hexagon", "pentagon"]
COLORS = ["red", "blue", "green", "yellow", "purple", "orange"]

ANIMAL_HABITAT = {
    "kangaroo": "Australia", "penguin": "Antarctica", "camel": "the desert",
    "polar bear": "the Arctic", "monkey": "the rainforest", "panda": "China",
    "lion": "the savanna", "whale": "the ocean",
}
LANDMARKS = [
    ("Eiffel Tower", "Paris", "France", "a tall iron tower"),
    ("Statue of Liberty", "New York", "the USA", "a giant statue holding a torch"),
    ("Great Wall", "Beijing", "China", "a very long wall"),
    ("Pyramids", "Giza", "Egypt", "huge triangle tombs"),
    ("Big Ben", "London", "England", "a famous clock tower"),
    ("Taj Mahal", "Agra", "India", "a white marble palace"),
]
NATURE_WONDERS = [
    ("Grand Canyon", "a huge crack in the ground", "the USA"),
    ("Great Barrier Reef", "a giant coral home for fish", "Australia"),
    ("Niagara Falls", "a giant waterfall", "Canada and the USA"),
]
HELLOS = [("Spanish", "hola"), ("French", "bonjour"), ("Japanese", "konnichiwa"),
          ("Chinese", "ni hao"), ("Hawaiian", "aloha"), ("Italian", "ciao")]
FESTIVALS = [("Diwali", "India", "the festival of lights"),
             ("Lunar New Year", "China", "dragon dances and red lanterns"),
             ("Carnival", "Brazil", "a giant street parade"),
             ("Day of the Dead", "Mexico", "families remember loved ones")]
HOMES = [("igloo", "blocks of ice and snow", "the Arctic"),
         ("yurt", "a round tent", "Mongolia"),
         ("houseboat", "a floating home", "the Netherlands")]

EMOTION_FACES = ["happy", "sad", "mad", "scared", "surprised", "calm"]
EMOTION_SCENES = [
    ("Mia dropped her ice cream.", "sad"),
    ("Sam got a new puppy!", "happy"),
    ("Leo's tower of blocks fell down.", "mad"),
    ("A loud thunder woke Ana.", "scared"),
    ("Dad jumped out and yelled surprise!", "surprised"),
    ("Eva breathes slowly on the calm cloud.", "calm"),
]
CALM_TOOLS = ["belly breaths", "a tight squeeze", "counting to ten"]

# ==========================================================================
# READING
# ==========================================================================
def b_alphabet(need):
    A = AGES["alphabet"]
    if need[2]:
        # L2 top-up: letter order questions
        mc("alphabet", 2, "Which letter comes right after M?",
           "N", ["L", "O", "P"], *A)
    if need[3]:
        # L3: lowercase naming
        for up, lo in [("B", "b"), ("D", "d"), ("P", "p"), ("M", "m")]:
            others = rng.sample([c for c in LOWER if c != lo], 2)
            tt("alphabet", 3, f"Tap the lowercase {lo}.", lo, others, *A)
    if need[4]:
        # L4: upper/lower pairs
        for up, lo in [("A", "a"), ("T", "t"), ("S", "s"), ("R", "r")]:
            others = rng.sample([c for c in LOWER if c != lo], 3)
            mc("alphabet", 4, f"Which lowercase letter matches big {up}?",
               lo, others, *A)
    if need[5]:
        # L5: fluent order
        seqs = [["A", "B", "C", "D"], ["M", "N", "O", "P"], ["S", "T", "U", "V"]]
        for s in seqs[:need[5]]:
            items = [{"id": ch, "label": ch} for ch in shuffled(s)]
            add("alphabet", 5, "sequence", "Put the letters in ABC order.",
                {"items": items}, {"sequence": s}, *A)
        if need[5] > 3:
            mc("alphabet", 5, "What letter is missing? L, M, __, O.",
               "N", ["P", "K", "Q"], *A)


def b_letter_sounds(need):
    A = AGES["letter_sounds"]
    if need[2]:
        letter, (word, sound) = rng.choice(list(SOUND_LETTERS.items()))
        others = rng.sample([w for w, _ in SOUND_LETTERS.values() if w != word], 2)
        tt("letter_sounds", 2,
           f"Which one starts with the '{sound}' sound, like {word}?",
           word, others, *A,
           narration=f"Which one starts with the '{sound}' sound?")
    if need[3]:
        # L3: consonant sounds A-Z
        for letter, (word, sound) in take(list(SOUND_LETTERS.items()), need[3]):
            others = rng.sample([L for L in UPPER if L != letter], 3)
            mc("letter_sounds", 3, f"Which letter says '{sound}', like in {word}?",
               letter, others, *A)
    if need[4]:
        # L4: short vowels
        for v, word in take(SHORT_VOWELS, need[4]):
            others = [w for _, w in SHORT_VOWELS if w != word]
            pick = rng.sample(others, 3)
            mc("letter_sounds", 4,
               f"Which word has the short '{v}' sound, like in {word}?",
               word, pick, *A)
    if need[5]:
        # L5: digraphs
        for dg, word in take(DIGRAPHS, need[5]):
            others = [w for _, w in DIGRAPHS if w != word]
            pick = rng.sample(others + ["sun", "dog"], 3)
            mc("letter_sounds", 5, f"Which word starts with '{dg}'?",
               word, pick, *A)


def b_blending(need):
    A = AGES["blending"]
    if need[1]:
        add("blending", 1, "listen_repeat",
            "Blend it: sun + shine. Say the word!",
            {"script": "Say: sunshine"}, {}, *A,
            narration="Blend it: sun plus shine. Say the word!")
    if need[2]:
        add("blending", 2, "listen_repeat",
            "Blend it: rain + bow. Say the word!",
            {"script": "Say: rainbow"}, {}, *A,
            narration="Blend it: rain plus bow. Say the word!")
    if need[3]:
        # L3: three-letter words
        for word in take(CVC_WORDS, need[3]):
            sounds = " / ".join(word)
            others = rng.sample([w for w in CVC_WORDS if w != word], 3)
            mc("blending", 3, f"Which word do these sounds make: {sounds}?",
               word, others, *A,
               narration=f"Which word do these sounds make: {sounds}?")
    if need[4]:
        # L4: digraphs and blends
        for word in take(DIGRAPH_WORDS, need[4]):
            sounds = " / ".join(word)
            others = rng.sample([w for w in DIGRAPH_WORDS + CVC_WORDS if w != word], 3)
            mc("blending", 4, f"Blend: {sounds}. Which word?",
               word, others, *A)
    if need[5]:
        # L5: multisyllable
        for syls in take(SYLLABLE_WORDS, need[5]):
            syls = list(syls)
            word = "".join(syls)
            parts = " - ".join(syls)
            add("blending", 5, "listen_repeat",
                f"Blend it syllable by syllable: {parts}. Say the word!",
                {"script": f"Say: {word}"}, {}, *A,
                narration=f"Blend it: {parts}. Say the word!")


def b_sight_words(need):
    A = AGES["sight_words"]
    for level in range(1, 6):
        n = need[level]
        if not n:
            continue
        pool = SIGHT[level]
        for word in take(pool, n):
            others = rng.sample([w for w in pool if w != word], 3)
            if level <= 2:
                tt("sight_words", level, f"Tap the word '{word}'.",
                   word, others, *A)
            elif level <= 4:
                mc("sight_words", level, f"Which word says '{word}'?",
                   word, others, *A)
            else:
                # L5: inside sentences
                frame = rng.choice(["I {w} the cat.", "We {w} to the park.",
                                    "She {w} a red ball.", "He {w} the big dog."])
                correct = frame.format(w=word)
                distractors = [frame.format(w=o)
                               for o in rng.sample([w for w in pool if w != word], 2)]
                mc("sight_words", 5, f"Tap the sentence that says: {correct}",
                   correct, distractors, *A,
                   narration=f"Tap the sentence that says: {correct}")


def b_sentences(need):
    A = AGES["sentences"]
    if need[1]:
        for s in ["The sun is hot.", "A dog can run.", "I see a red bus.",
                  "The cat can nap."][:need[1]]:
            add("sentences", 1, "listen_repeat",
                f"Follow the words while you hear: {s} Tap when done.",
                {"script": f"Listen: {s}"}, {}, *A,
                narration=f"Follow the words while you hear: {s}")
    if need[2]:
        pairs = [("I see a dog.", ["I see a pig.", "I see a log."]),
                 ("The cat is big.", ["The bat is big.", "The car is big."]),
                 ("We like cake.", ["We like rain.", "We like pie."]),
                 ("Sam can hop.", ["Sam can mop.", "Sam can top."])]
        for s, others in pairs[:need[2]]:
            tt("sentences", 2, f"Tap the sentence that says: {s}",
               s, others, *A, narration=f"Tap the sentence that says: {s}")
    QA = [
        ("The big red bus is fast.", "What is fast?", "The bus",
         ["The car", "The dog"]),
        ("Pam sat with Sam and had jam.", "Who sat with Sam?", "Pam",
         ["Tom", "Jan"]),
        ("The dog dug a deep hole.", "What did the dog dig?", "a deep hole",
         ["a tall tree", "a small bone"]),
        ("A frog jumps in the pond.", "Where does the frog jump?", "in the pond",
         ["on the log", "over the hill"]),
        ("The little ant carried a big leaf.", "What did the ant carry?", "a big leaf",
         ["a small rock", "a drop of rain"]),
        ("Dad made hot soup for lunch.", "What did Dad make?", "hot soup",
         ["cold milk", "warm bread"]),
        ("The bird sings in the tall tree.", "Where does the bird sing?", "in the tall tree",
         ["under the bush", "on the fence"]),
        ("I see the moon at night.", "When do you see the moon?", "at night",
         ["in the morning", "at lunch"]),
        ("The fish swims fast and deep.", "How does the fish swim?", "fast and deep",
         ["slow and high", "round and round"]),
        ("Kim grabbed her umbrella and ran.", "What will the weather be?", "rainy",
         ["sunny", "snowy"]),
    ]
    if need[3]:
        for s, q, ans, dis in QA[:need[3]]:
            mc("sentences", 3, f"Read: '{s}' {q}", ans, dis, *A,
               narration=f"{s} {q}")
    if need[4]:
        for s, q, ans, dis in QA[3:3 + need[4]]:
            mc("sentences", 4, f"Read: '{s}' {q}", ans, dis, *A,
               narration=f"{s} {q}")
    if need[5]:
        for s, q, ans, dis in take(QA[6:], need[5] - 1):
            mc("sentences", 5, f"Read: '{s}' {q}", ans, dis, *A,
               narration=f"{s} {q}")
        add("sentences", 5, "listen_repeat",
            "Read with a happy voice: 'We won the game!' Tap when you read it.",
            {"script": "Read: We won the game!"}, {}, *A,
            narration="Read with a happy voice: We won the game!")


STORIES = [
    # (title, sentences, L1 q(tt), L2 q(mc), L3 seq events, L4 q(mc), L5 q(mc))
    ("Sam the Cat",
     ["Sam is a small orange cat.", "Sam naps in the warm sun.",
      "A red ball rolls by.", "Sam wakes up and chases the ball!"],
     ("Tap who chased the ball.", "Sam", ["The ball", "The sun"]),
     ("What color is Sam?", "orange", ["red", "blue"]),
     None, None, None),
    ("The Lost Kite",
     ["Ana flies her blue kite in the park.", "The wind blows hard.",
      "The kite flies into a tall tree!", "Ana's dad helps her get it down."],
     ("Tap what got stuck in the tree.", "the kite", ["her dad", "the wind"]),
     ("Who helped Ana?", "her dad", ["the wind", "a bird"]),
     None, None, None),
    ("Pip's Breakfast",
     ["Pip is a hungry puppy.", "He eats his breakfast fast.",
      "Then he drinks cold water.", "Pip wags his tail. Breakfast is done!"],
     ("Tap who ate breakfast.", "Pip", ["His tail", "The water"]),
     ("What did Pip drink?", "cold water", ["warm milk", "apple juice"]),
     None, None, None),
    ("Breakfast Birds",
     ["Two little birds sit on a fence.", "They see red berries on a bush.",
      "Hop, hop! They eat the berries.", "Now their tummies are full."],
     ("Tap who ate the berries.", "the birds", ["the fence", "the bush"]),
     ("What color are the berries?", "red", ["blue", "yellow"]),
     None, None, None),
    ("Rain Day",
     ["Dark clouds cover the sky.", "Drip, drop! Rain falls on the roof.",
      "Mia puts on her yellow boots.", "She splashes in every puddle!"],
     None,
     ("What does Mia wear?", "yellow boots", ["a red hat", "a blue coat"]),
     (["Dark clouds cover the sky.", "Rain falls on the roof.", "Mia splashes in puddles!"]),
     ("Why did Mia put on her yellow boots?",
      "to splash in puddles without getting wet",
      ["to fly her kite", "to take a nap"]),
     None),
    ("The Sleepy Bear",
     ["Bear eats lots of berries in fall.", "He finds a warm, dark cave.",
      "Bear sleeps all winter long.", "In spring, Bear wakes up hungry!"],
     None, None,
     (["Bear eats berries in fall.", "Bear sleeps in the cave.", "Bear wakes up in spring."]),
     ("Why does Bear sleep all winter?",
      "it is cold and food is hard to find",
      ["he is bored", "he likes the dark"]),
     None),
    ("The Garden Seed",
     ["Leo plants a tiny seed.", "He gives it water every day.",
      "A green sprout pops up!", "Soon a red flower opens to the sun."],
     None, None,
     (["Leo plants the seed.", "A sprout pops up.", "A flower opens."]),
     ("What will the flower do next?",
      "make seeds to grow new flowers",
      ["turn back into a seed", "stop needing water"]),
     None),
    ("The Shy Turtle",
     ["Tuno hides in his shell when the pond gets loud.",
      "His friend Bea buzzes softly nearby.", "Tuno takes three slow breaths.",
      "He peeks out. The pond is calm again."],
     None, None,
     (["Tuno hides in his shell.", "Tuno takes three slow breaths.", "Tuno peeks out."]),
     ("Why did Tuno hide in his shell?",
      "the pond was too loud",
      ["he was sleepy", "he lost a game"]),
     None),
    ("The Lighthouse Cat",
     ["Every night, Marlow the cat climbs the lighthouse stairs.",
      "He watches the ships blink back at the light.",
      "One stormy night, a small boat loses its way.",
      "Marlow meows and meows until the keeper makes the light brighter.",
      "The boat finds the shore.", "Marlow purrs all the way home."],
     None, None, None, None,
     [("Why did Marlow meow in the storm?",
       "to help the lost boat", ["he was hungry", "he saw a mouse"]),
      ("How does Marlow feel at the end?",
       "proud and happy", ["tired and grumpy", "lost and scared"])]),
    ("Nia's Rocket",
     ["Nia builds a rocket from cardboard boxes.", "She paints it red and silver.",
      "Nia counts down: three, two, one!", "The rocket does not fly.",
      "Nia tries again with bigger wings.", "Up, up it soars across the yard!"],
     None, None, None, None,
     [("What did Nia learn?",
       "trying again can work", ["rockets never fly", "paint makes things fly"]),
      ("Why did the rocket fly the second time?",
       "it had bigger wings", ["it was more red", "Nia counted faster"])]),
]


def b_stories(need):
    A = AGES["stories"]
    story_text = lambda s: " ".join(s[1])
    if need[1]:
        n = 0
        for title, sents, q1, *_ in STORIES:
            if n >= need[1] or not q1:
                continue
            q, ans, dis = q1
            tt("stories", 1, f"{title}: {story_text((title, sents))} {q}",
               ans, dis, *A, narration=f"{story_text((title, sents))} {q}")
            n += 1
    if need[2]:
        n = 0
        for title, sents, _, q2, *_ in STORIES:
            if n >= need[2] or not q2:
                continue
            q, ans, dis = q2
            mc("stories", 2, f"{title}: {story_text((title, sents))} {q}",
               ans, dis, *A, narration=f"{story_text((title, sents))} {q}")
            n += 1
    if need[3]:
        n = 0
        for title, sents, _, _, seq, *_ in STORIES:
            if n >= need[3] or not seq:
                continue
            evts = list(seq)
            idx = shuffled(list(range(len(evts))))
            while [evts[i] for i in idx] == evts:
                idx = shuffled(list(range(len(evts))))
            items = [{"id": f"e{i}", "label": evts[i]} for i in idx]
            add("stories", 3, "sequence",
                f"{title}: Put the story in order.",
                {"items": items, "story": story_text((title, sents))},
                {"sequence": [f"e{i}" for i in range(len(evts))]}, *A,
                narration=f"Put the events of {title} in order.")
            n += 1
    if need[4]:
        n = 0
        for title, sents, _, _, _, q4, *_ in STORIES:
            if n >= need[4] or not q4:
                continue
            q, ans, dis = q4
            mc("stories", 4, f"{title}: {story_text((title, sents))} {q}",
               ans, dis, *A, narration=f"{story_text((title, sents))} {q}")
            n += 1
    if need[5]:
        n = 0
        for title, sents, _, _, _, _, q5 in STORIES:
            if not q5:
                continue
            for q, ans, dis in q5:
                if n >= need[5]:
                    break
                mc("stories", 5, f"{title}: {story_text((title, sents))} {q}",
                   ans, dis, *A, narration=f"{story_text((title, sents))} {q}")
                n += 1


# ==========================================================================
# WRITING
# ==========================================================================
def b_trace_letters(need):
    A = AGES["trace_letters"]
    if need[1]:
        prompts = ["Trace the big tall line.", "Trace the big round circle.",
                   "Trace the big bumpy line.", "Trace the big zigzag line."]
        for prompt in prompts[:need[1]]:
            add("trace_letters", 1, "trace", prompt,
                {"target": prompt.split("the ")[1].rstrip("."), "style": "dotted"},
                {"min_coverage": 0.5}, *A)
    if need[2]:
        for ch in ["A", "B", "C", "O"][:need[2]]:
            add("trace_letters", 2, "trace", f"Trace the big letter {ch}.",
                {"target": ch, "style": "dotted"}, {"min_coverage": 0.6}, *A,
                narration=f"Trace the big letter {ch}.")
    if need[3]:
        for ch in ["a", "c", "e", "o"][:need[3]]:
            add("trace_letters", 3, "trace", f"Trace the little letter {ch}.",
                {"target": ch, "style": "dotted"}, {"min_coverage": 0.6}, *A,
                narration=f"Trace the little letter {ch}.")
    if need[4]:
        for ch in ["m", "s", "t", "h"][:need[4]]:
            add("trace_letters", 4, "trace", f"Trace {ch}. Stay on the line!",
                {"target": ch, "style": "ruled"}, {"min_coverage": 0.65}, *A,
                narration=f"Trace {ch}. Stay on the line!")
    if need[5]:
        for w in ["cat", "sun", "dog", "bee"][:need[5]]:
            add("trace_letters", 5, "trace",
                f"Trace the whole word '{w}' in one smooth motion.",
                {"target": w, "style": "ruled"}, {"min_coverage": 0.5}, *A,
                narration=f"Trace the word {w} in one smooth motion.")


def word_tiles(parts: list[str]) -> tuple[list[dict], list[str]]:
    """Letter/syllable tiles shown shuffled; answer is the original order.

    Tile ids are positional (t0..tn), so repeated letters stay distinct.
    """
    idx = shuffled(list(range(len(parts))))
    while [parts[i] for i in idx] == list(parts):
        idx = shuffled(list(range(len(parts))))
    items = [{"id": f"t{i}", "label": parts[i]} for i in idx]
    return items, [f"t{j}" for j in range(len(parts))]


def seq_items(logical: list[str], prefix: str = "s") -> tuple[list[dict], dict]:
    """Build items + answer for a sequence activity.

    `logical` holds the labels in the CORRECT order. Display order is
    shuffled (and never left in the correct order, so the task is never
    trivially solved). Item ids are glued to their logical position, so the
    stored answer is always the logical order of ids -- the shuffle only
    affects display.

    Contract (matches submit_attempt grading): the client submits
    {"sequence": [ids in the child's arranged order]}; the server compares
    it to the stored id list.
    """
    order = shuffled(list(range(len(logical))))
    while [logical[i] for i in order] == list(logical):
        order = shuffled(list(range(len(logical))))
    items = [{"id": f"{prefix}{i}", "label": logical[i]} for i in order]
    return items, {"sequence": [f"{prefix}{j}" for j in range(len(logical))]}


def b_build_words(need):
    A = AGES["build_words"]
    if need[1]:
        for name in NAMES[:need[1]]:
            missing = name[-1]
            others = rng.sample([c for c in UPPER if c not in name], 3)
            mc("build_words", 1, f"Tap the letter that finishes {name[:-1]}__.",
               missing, others, *A,
               narration=f"Which letter finishes the name {name[:-1]}?")
    if need[2]:
        for word in CVC_WORDS[:need[2]]:
            items, seq = word_tiles(list(word))
            add("build_words", 2, "sequence", f"Build the word '{word}'.",
                {"items": items, "word_hint": word}, {"sequence": seq}, *A,
                narration=f"Put the letters in order to build {word}.")
    if need[3]:
        for word in DIGRAPH_WORDS[:need[3]]:
            items, seq = word_tiles(list(word))
            add("build_words", 3, "sequence", f"Build the word '{word}'.",
                {"items": items, "word_hint": word}, {"sequence": seq}, *A,
                narration=f"Put the letters in order to build {word}.")
    if need[4]:
        for word in ["bed", "cup", "map", "fox"][:need[4]]:
            sounds = " / ".join(word)
            items, seq = word_tiles(list(word))
            add("build_words", 4, "sequence",
                f"Listen to the sounds: {sounds}. Build the word.",
                {"items": items, "word_hint": word}, {"sequence": seq}, *A,
                narration=f"Build the word from its sounds: {sounds}.")
    if need[5]:
        for syls in SYLLABLE_WORDS[:need[5]]:
            word = "".join(syls)
            items, seq = word_tiles(list(syls))
            add("build_words", 5, "sequence",
                f"Build '{word}' syllable by syllable.",
                {"items": items, "word_hint": word}, {"sequence": seq}, *A,
                narration=f"Put the word parts in order to build {word}.")


def b_write_sentences(need):
    A = AGES["write_sentences"]
    if need[1]:
        qs = [("Say a sentence about your day. Watch it appear! Tap when done.",
               "Say one sentence about your day."),
              ("Say a sentence about your favorite food. Watch it appear! Tap when done.",
               "Say one sentence about your favorite food."),
              ("Say a sentence about an animal. Watch it appear! Tap when done.",
               "Say one sentence about an animal."),
              ("Say a sentence about the weather. Watch it appear! Tap when done.",
               "Say one sentence about the weather.")]
        for prompt, script in qs[:need[1]]:
            add("write_sentences", 1, "listen_repeat", prompt,
                {"script": script}, {}, *A, narration=prompt)
    if need[2]:
        frames = [
            ("___ is red.", "The apple", ["Quickly", "And then"]),
            ("The ___ is big.", "dog", ["run", "very"]),
            ("I like to ___.", "play", ["and", "the"]),
            ("___ can fly.", "A bird", ["Quickly", "Under"]),
        ]
        for frame, ans, dis in frames[:need[2]]:
            mc("write_sentences", 2, f"Finish the sentence: {frame}",
               ans, dis, *A, narration=f"Which word finishes: {frame}")
    if need[3]:
        sents = [
            (["I", "like", "red", "apples"], "I like red apples."),
            (["The", "sun", "is", "hot"], "The sun is hot."),
            (["We", "see", "a", "big", "dog"], "We see a big dog."),
            (["Sam", "can", "run", "fast"], "Sam can run fast."),
        ]
        for words, full in sents[:need[3]]:
            t, ans = seq_items(words, "w")
            add("write_sentences", 3, "sequence",
                "Use the word bank to write the sentence.",
                {"items": t}, ans,
                *A, narration=f"Put the words in order: {full}")
    if need[4]:
        sents = [
            (["The", "cat", "sat"], "The cat sat."),
            (["A", "frog", "jumps"], "A frog jumps."),
            (["My", "mom", "sings"], "My mom sings."),
            (["The", "bees", "buzz"], "The bees buzz."),
        ]
        for words, full in sents[:need[4]]:
            t, ans = seq_items(words, "w")
            add("write_sentences", 4, "sequence",
                "Write the sentence. Leave finger spaces!",
                {"items": t, "finger_spaces": True}, ans,
                *A, narration=f"Write with finger spaces: {full}")
    if need[5]:
        good = ["The dog ran.", "I see the sun.", "We won!"]
        bad = ["the dog ran.", "The dog ran", "i see the sun."]
        for g, b_ in list(zip(good, bad))[:need[5]]:
            other_bad = rng.choice([x for x in bad if x != b_])
            mc("write_sentences", 5, "Which sentence is written correctly?",
               g, [b_, other_bad], *A,
               narration="Which sentence starts with a capital and ends with a stop?")
        for _ in range(need[5] - 3):
            words = ["I", "see", "the", "sun", "It", "is", "hot"]
            t, ans = seq_items(words, "w")
            add("write_sentences", 5, "sequence",
                "Write two sentences with capitals and stops.",
                {"items": t}, ans,
                *A, narration="Write: I see the sun. It is hot.")

# ==========================================================================
# MATH
# ==========================================================================
def count_objects(n: int, thing: str) -> list[dict]:
    return [{"id": f"{thing}{i}", "shape": thing} for i in range(n)]


def b_count(need):
    A = AGES["count"]
    if need[2]:
        for n, thing in list(zip([7, 9], ["apples", "stars"]))[:need[2]]:
            add("count", 2, "tap_count",
                f"How many {thing}? Tap each one as you count.",
                {"objects": count_objects(n, thing.rstrip("s"))}, {"count": n}, *A)
    if need[3]:
        for n, thing in list(zip([12, 15, 18, 20], ["apples", "stars", "fish", "birds"]))[:need[3]]:
            add("count", 3, "tap_count",
                f"How many {thing}? Tap each one as you count.",
                {"objects": count_objects(n, thing.rstrip("s"))}, {"count": n}, *A)
    if need[4]:
        if need[4] >= 1:
            mc("count", 4, "Count by 2s: 2, 4, 6, __.", "8", ["7", "10"], *A)
        if need[4] >= 2:
            mc("count", 4, "Count by 5s: 5, 10, 15, __.", "20", ["18", "25"], *A)
        for n in [25, 30][:max(0, need[4] - 2)]:
            add("count", 4, "tap_count", f"Count the stars all the way to {n}!",
                {"objects": count_objects(n, "star")}, {"count": n}, *A)
    if need[5]:
        if need[5] >= 1:
            mc("count", 5, "Count by 10s: 10, 20, 30, __.", "40", ["35", "50"], *A)
        if need[5] >= 2:
            mc("count", 5, "What comes after 99?", "100", ["98", "101"], *A)
        for n in [40, 60][:max(0, need[5] - 2)]:
            add("count", 5, "tap_count", f"Count the fish all the way to {n}!",
                {"objects": count_objects(n, "fish")}, {"count": n}, *A)


def b_cardinality(need):
    A = AGES["cardinality"]
    def how_many(n, level):
        nums = [str(n)] + rng.sample([str(x) for x in range(1, 11) if x != n], 3)
        rng.shuffle(nums)
        cid = nums.index(str(n))
        opts = [{"id": f"n{i}", "label": v} for i, v in enumerate(nums)]
        add("cardinality", level, "tap_target", "How many? Tap the number.",
            {"targets": opts}, {"choice": f"n{cid}"}, *A)
    if need[1]:
        for n in [2, 3][:need[1]]:
            how_many(n, 1)
    if need[2]:
        for n in [4, 5][:need[2]]:
            how_many(n, 2)
    if need[3]:
        for n in [6, 8, 10, 7][:need[3]]:
            how_many(n, 3)
    if need[4]:
        pairs = [(7, 9), (6, 10), (8, 5), (9, 4)]
        for a, b in pairs[:need[4]]:
            opts = [{"id": "ga", "label": f"{a} dots"}, {"id": "gb", "label": f"{b} dots"}]
            cid = "ga" if a > b else "gb"
            add("cardinality", 4, "tap_target",
                "Which group has more? Do not count one by one, just look.",
                {"targets": opts}, {"choice": cid}, *A)
    if need[5]:
        looks = ["Look fast, then tap!", "One quick peek, then tap!",
                 "Fast eyes! How many?", "Glance quickly, then tap!"]
        for n, look in zip([3, 4, 5, 2][:need[5]], looks):
            nums = [str(n)] + rng.sample([str(x) for x in range(1, 11) if x != n], 3)
            rng.shuffle(nums)
            cid = nums.index(str(n))
            opts = [{"id": f"n{i}", "label": v} for i, v in enumerate(nums)]
            add("cardinality", 5, "tap_target",
                f"How many dots? {look}",
                {"targets": opts}, {"choice": f"n{cid}"}, *A,
                narration=f"How many dots? {look}")


def b_compare_order(need):
    A = AGES["compare_order"]
    if need[1]:
        for a, b in [(3, 1), (4, 2)][:need[1]]:
            opts = [{"id": "ga", "label": f"{a} cookies"}, {"id": "gb", "label": f"{b} cookies"}]
            add("compare_order", 1, "tap_target", "Which plate has more cookies?",
                {"targets": opts}, {"choice": "ga" if a > b else "gb"}, *A)
    if need[2]:
        for a, b in [(5, 3), (2, 4)][:need[2]]:
            opts = [{"id": "ga", "label": f"{a} stars"}, {"id": "gb", "label": f"{b} stars"}]
            add("compare_order", 2, "tap_target", "Which group has more?",
                {"targets": opts}, {"choice": "ga" if a > b else "gb"}, *A)
    if need[3]:
        for nums in [[3, 1, 2], [5, 2, 4], [7, 9, 6], [10, 4, 8]][:need[3]]:
            order = shuffled(nums)
            while order == sorted(nums):
                order = shuffled(nums)
            items = [{"id": f"n{v}", "label": str(v)} for v in order]
            add("compare_order", 3, "sequence", "Put the numbers in order, smallest first.",
                {"items": items},
                {"sequence": [f"n{v}" for v in sorted(nums)]}, *A)
    if need[4]:
        for a, b in [(14, 9), (7, 12), (16, 16), (11, 19)][:need[4]]:
            rel = "more than" if a > b else "less than" if a < b else "equal to"
            others = [x for x in ["more than", "less than", "equal to"] if x != rel]
            mc("compare_order", 4, f"Which is true? {a} ___ {b}.",
               rel, others, *A, narration=f"Is {a} more than, less than, or equal to {b}?")
    if need[5]:
        if need[5] >= 1:
            nums = [12, 45, 7, 89]
            order = shuffled(nums)
            while order == sorted(nums):
                order = shuffled(nums)
            items = [{"id": f"n{v}", "label": str(v)} for v in order]
            add("compare_order", 5, "sequence", "Order the numbers, smallest first.",
                {"items": items}, {"sequence": [f"n{v}" for v in sorted(nums)]}, *A)
        for n_ in [4, 7, 9][:max(0, need[5] - 1)]:
            ans = "even" if n_ % 2 == 0 else "odd"
            other = "odd" if ans == "even" else "even"
            mc("compare_order", 5, f"Is {n_} odd or even?", ans, [other], *A)


def b_add(need):
    A = AGES["add"]
    if need[1]:
        for a, b in [(1, 2), (2, 1)][:need[1]]:
            n = a + b
            add("add", 1, "tap_count",
                f"{a} apples and {b} more join. How many apples now?",
                {"objects": count_objects(n, "apple")}, {"count": n}, *A)
    if need[2]:
        for a, b in [(2, 3), (4, 1), (3, 2)][:need[2]]:
            n = a + b
            add("add", 2, "tap_count", f"{a} fish plus {b} fish. How many fish?",
                {"objects": count_objects(n, "fish")}, {"count": n}, *A)
    if need[3]:
        for a, b in [(3, 4), (5, 2), (6, 3), (2, 7)][:need[3]]:
            s = a + b
            mc("add", 3, f"What is {a} + {b}?", str(s),
               [str(s - 1), str(s + 1), str(s + 2)], *A)
    if need[4]:
        for a, b in [(8, 5), (7, 6), (9, 4), (9, 7)][:need[4]]:
            s = a + b
            mc("add", 4, f"What is {a} + {b}? (Make a ten first!)",
               str(s), [str(s - 1), str(s + 2), str(s - 2)], *A,
               narration=f"What is {a} plus {b}? Make a ten first!")
    if need[5]:
        for a, b in [(23, 14), (35, 22), (41, 18), (27, 33)][:need[5]]:
            s = a + b
            mc("add", 5, f"What is {a} + {b}?", str(s),
               [str(s - 10), str(s + 10), str(s - 1)], *A)


def b_subtract(need):
    A = AGES["subtract"]
    if need[1]:
        for n, d in [(2, 1), (4, 1)][:need[1]]:
            left = n - d
            add("subtract", 1, "tap_count",
                f"{n} birds sit on a branch. {d} flies away. How many are left?",
                {"objects": count_objects(left, "bird")}, {"count": left}, *A)
    if need[2]:
        for n, d in [(5, 2), (4, 3), (3, 1)][:need[2]]:
            left = n - d
            add("subtract", 2, "tap_count",
                f"{n} cookies. You eat {d}. How many are left?",
                {"objects": count_objects(left, "cookie")}, {"count": left}, *A)
    if need[3]:
        for n, d in [(7, 3), (9, 5), (6, 2), (8, 4)][:need[3]]:
            r = n - d
            mc("subtract", 3, f"What is {n} - {d}?", str(r),
               [str(r + 1), str(r - 1), str(r + 2)], *A)
    if need[4]:
        for n, d in [(15, 7), (12, 5), (18, 9), (14, 6)][:need[4]]:
            r = n - d
            mc("subtract", 4, f"What is {n} - {d}?", str(r),
               [str(r + 1), str(r + 2), str(r - 1)], *A)
    if need[5]:
        for a, b in [(7, 5), (9, 6), (8, 4), (10, 3)][:need[5]]:
            s = a + b
            mc("subtract", 5,
               f"You know {a} + {b} = {s}. So what is {s} - {b}?",
               str(a), [str(b), str(a + 2), str(s)], *A,
               narration=f"If {a} plus {b} is {s}, what is {s} minus {b}?")


def b_place_value(need):
    A = AGES["place_value"]
    if need[1]:
        for tens, ones in [(3, 2), (4, 5), (2, 7), (6, 4)][:need[1]]:
            val = tens * 10 + ones
            mc("place_value", 1,
               f"{tens} bundles of ten and {ones} loose ones make...?",
               str(val), [str(tens + ones), str(val + 10), str(ones * 10 + tens)], *A,
               narration=f"{tens} bundles of ten and {ones} loose ones make what number?")
    if need[2]:
        words = [(34, "thirty-four"), (52, "fifty-two"), (71, "seventy-one"), (28, "twenty-eight")]
        for val, w in words[:need[2]]:
            mc("place_value", 2, f"How do you write {w}?",
               str(val), [str(val + 10), str(int(str(val)[::-1])), str(val * 10)], *A)
    if need[3]:
        for a, b in [(47, 74), (36, 63), (81, 18), (55, 59)][:need[3]]:
            big = max(a, b)
            mc("place_value", 3, f"Which number is bigger: {a} or {b}?",
               str(big), [str(min(a, b))], *A)
    if need[4]:
        for tens, ones in [(3, 5), (4, 7), (2, 9), (6, 3)][:need[4]]:
            val = tens * 10 + ones
            mc("place_value", 4, f"What is {tens} tens + {ones} ones?",
               str(val), [str(tens + ones), str(val + 1), str(val - 10)], *A)
    if need[5]:
        if need[5] >= 1:
            mc("place_value", 5, "Which is biggest: 609, 690, or 906?",
               "906", ["690", "609"], *A)
        if need[5] >= 2:
            mc("place_value", 5, "How do you write nine hundred five?",
               "905", ["950", "95"], *A)
        for val in [347, 582][:max(0, need[5] - 2)]:
            mc("place_value", 5, f"Which number has {val // 100} hundreds?",
               str(val), [str(val + 100), str(val - 100)], *A)


def b_shapes_patterns(need):
    A = AGES["shapes_patterns"]
    if need[1]:
        for shape in ["circle", "square", "triangle", "oval"][:need[1]]:
            others = rng.sample([s for s in SHAPES if s != shape], 2)
            tt("shapes_patterns", 1, f"Tap the {shape}.", shape, others, *A)
    if need[2]:
        if need[2] >= 1:
            tt("shapes_patterns", 2, "Tap the hexagon.",
               "hexagon", ["octagon", "pentagon"], *A)
        groups = {"round": ["circle", "oval"], "pointy": ["triangle", "star", "diamond"]}
        items = [{"id": s, "label": s} for ss in groups.values() for s in ss]
        rng.shuffle(items)
        if need[2] >= 2:
            add("shapes_patterns", 2, "sort", "Sort the shapes: round or pointy?",
                {"items": items,
                 "groups": [{"id": "round", "label": "round"}, {"id": "pointy", "label": "pointy"}]},
                {"groups": {g: sorted(v) for g, v in groups.items()}}, *A)
        for shape in ["rectangle", "star"][:max(0, need[2] - 2)]:
            others = rng.sample([s for s in SHAPES if s != shape], 2)
            tt("shapes_patterns", 2, f"Tap the {shape}.", shape, others, *A)
    if need[3]:
        pats = [
            (["red", "blue", "red", "blue"], "red"),
            (["circle", "square", "circle", "square"], "circle"),
            (["big", "small", "small", "big", "small", "small"], "big"),
            (["star", "star", "moon", "star", "star"], "moon"),
        ]
        for seq_, nxt in pats[:need[3]]:
            shown = ", ".join(seq_)
            mc("shapes_patterns", 3, f"What comes next? {shown}, __.",
               nxt, [x for x in rng.sample(["red", "blue", "circle", "square", "big", "small", "star", "moon"], 2) if x != nxt], *A,
               narration=f"What comes next in the pattern: {shown}?")
    if need[4]:
        if need[4] >= 1:
            mc("shapes_patterns", 4, "Which one is a 3D shape, like a real ball?",
               "sphere", ["circle", "square"], *A)
        if need[4] >= 2:
            labels = [f"{i + 1} star" + ("s" if i else "") for i in range(4)]
            items, ans = seq_items(labels, "s")
            add("shapes_patterns", 4, "sequence",
                "Growing pattern: put the star groups in order, fewest first.",
                {"items": items}, ans, *A)
        rolls = [("Which shape can roll?", "circle", ["square", "triangle"]),
                   ("Which shape can roll down a hill?", "oval", ["square", "rectangle"]),
                   ("Which 3D shape rolls like a ball?", "sphere", ["cube", "pyramid"])]
        for prompt, ans, dis in rolls[:max(0, need[4] - 2)]:
            mc("shapes_patterns", 4, prompt, ans, dis, *A)
    if need[5]:
        if need[5] >= 1:
            mc("shapes_patterns", 5, "How many sides does a hexagon have?",
               "6", ["5", "8"], *A)
        if need[5] >= 2:
            mc("shapes_patterns", 5, "How many corners does a triangle have?",
               "3", ["4", "2"], *A)
        if need[5] >= 3:
            mc("shapes_patterns", 5,
               "A shape is the same on both sides of a line down its middle. It is...",
               "symmetric", ["wobbly", "broken"], *A)
        if need[5] >= 4:
            mc("shapes_patterns", 5, "How many sides does a pentagon have?",
               "5", ["6", "4"], *A)


def b_fractions(need):
    A = AGES["fractions"]
    if need[1]:
        halves = [("cookie", "Tap the cookie cut in half."),
                  ("pizza", "Tap the pizza cut in half."),
                  ("apple", "Tap the apple cut in half."),
                  ("cake", "Tap the cake cut in half.")]
        for food, prompt in halves[:need[1]]:
            tt("fractions", 1, prompt,
               f"half {food}", [f"whole {food}"], *A)
    if need[2]:
        foods = ["pizza", "cookie", "cake", "pie"]
        for food in foods[:need[2]]:
            mc("fractions", 2, f"Which {food} shows one half eaten?",
               f"half the {food} is gone",
               [f"a whole {food}", f"one tiny bite missing"], *A,
               narration=f"Which picture shows one half of the {food}?")
    if need[3]:
        for i in range(need[3]):
            if i % 2 == 0:
                mc("fractions", 3, "A cake is cut into 3 equal parts. One part is...",
                   "one third", ["one half", "one fourth"], *A)
            else:
                mc("fractions", 3, "A pie is cut into 4 equal parts. One part is...",
                   "one fourth", ["one third", "one half"], *A)
    if need[4]:
        for total, half in [(6, 3), (8, 4), (10, 5), (4, 2)][:need[4]]:
            mc("fractions", 4, f"Half of {total} cookies is...?",
               str(half), [str(half + 1), str(half - 1)], *A)
    if need[5]:
        prompts = ["Which is the same amount as one half?",
                   "One half is the same as...?",
                   "Which picture shows the same as one half?",
                   "Two quarters of a pizza equal...?"]
        for prompt in prompts[:need[5]]:
            mc("fractions", 5, prompt,
               "two fourths", ["one third", "two thirds"], *A)

# ==========================================================================
# DRAWING (creative prompts; participation-graded via trace)
# ==========================================================================
def b_brush_control(need):
    A = AGES["brush_control"]
    prompts = {
        1: [("Scribble all over the sky with the wide brush!", "free", 0.05),
            ("Paint big swirls, round and round!", "free", 0.05),
            ("Make giant loops across the page!", "free", 0.05),
            ("Scribble a wild storm cloud!", "free", 0.05)],
        2: [("Follow the wavy river with your brush.", "dotted", 0.4),
            ("Follow the bumpy road with your brush.", "dotted", 0.4),
            ("Follow the curvy snake path.", "dotted", 0.4),
            ("Follow the rolling hills line.", "dotted", 0.4)],
        3: [("Stay inside the thick circle.", "outline", 0.5),
            ("Color inside the big star shape.", "outline", 0.5),
            ("Stay inside the thick square.", "outline", 0.5),
            ("Color inside the giant heart.", "outline", 0.5)],
        4: [("Make tiny dots with the thin brush: tap, tap, tap!", "free", 0.1),
            ("Draw little dashes like rain: dash, dash, dash!", "free", 0.1),
            ("Dot a line of ants marching: dot, dot, dot!", "free", 0.1),
            ("Draw tiny stars in the night sky.", "free", 0.1)],
        5: [("Draw a zigzag lightning bolt, steady and smooth.", "dotted", 0.5),
            ("Draw big curls like ocean waves.", "dotted", 0.5),
            ("Draw a smooth spiral shell.", "dotted", 0.5),
            ("Draw zigzag mountains, steady and smooth.", "dotted", 0.5)],
    }
    for level in range(1, 6):
        for text, style, cov in prompts[level][:need[level]]:
            add("brush_control", level, "trace", text,
                {"target": text.split(".")[0], "style": style},
                {"min_coverage": cov}, *A)


def b_coloring(need):
    A = AGES["coloring"]
    pages = {
        1: [("sun", 1), ("apple", 1), ("ball", 1), ("moon", 1)],
        2: [("cat", 2), ("flower", 2), ("tree", 2), ("fish", 2)],
        3: [("house with sun and tree", 3), ("fish in the sea", 3),
            ("car on the road", 3), ("bird in a nest", 3)],
        4: [("garden with butterflies", 4), ("rocket in space", 4),
            ("castle on a hill", 4), ("market stall", 4)],
        5: [("sunset over mountains", 5), ("underwater castle", 5),
            ("city at night", 5), ("dragon in the clouds", 5)],
    }
    for level in range(1, 6):
        for art, parts in pages[level][:need[level]]:
            fit = {1: "Fill the big shape with one color.",
                   2: "Color inside the shapes.",
                   3: "Color each part of the picture neatly.",
                   4: "Choose colors that fit: blue sky, green grass.",
                   5: "Shade with light and dark colors."}[level]
            add("coloring", level, "trace", f"{fit} Picture: {art}.",
                {"target": art, "style": "coloring_page", "parts": parts},
                {"min_coverage": 0.3}, *A,
                narration=f"{fit} This picture is: {art}.")


def b_shape_drawing(need):
    A = AGES["shape_drawing"]
    prompts = {
        1: ["Draw a big round circle.", "Draw a long straight line.",
            "Draw a tiny circle.", "Draw a tall straight line."],
        2: ["Draw a square like this one.", "Draw a triangle like this one.",
            "Draw a rectangle like this one.", "Draw a star like this one."],
        3: ["Draw a house: a square with a triangle roof.",
            "Draw a face: a circle with two dot eyes.",
            "Draw a car: a rectangle with circle wheels.",
            "Draw a flower: a circle with oval petals."],
        4: ["Draw a cat from circles: head, body, ears.",
            "Draw a fish from ovals and a triangle tail.",
            "Draw a dog from a rectangle and circles.",
            "Draw an owl from two big circles."],
        5: ["Draw your dream playground from shapes.",
            "Draw an imagined animal built from shapes.",
            "Draw a robot friend built from shapes.",
            "Draw a whole city built from shapes."],
    }
    for level in range(1, 6):
        for text in prompts[level][:need[level]]:
            add("shape_drawing", level, "trace", text,
                {"target": text, "style": "free" if level >= 4 else "dotted"},
                {"min_coverage": 0.3 if level >= 4 else 0.5}, *A)


def b_scene_composition(need):
    A = AGES["scene_composition"]
    if need[1]:
        for scene in ["beach", "park", "farm", "space"][:need[1]]:
            add("scene_composition", 1, "listen_repeat",
                f"Place 3 stickers to finish the {scene} scene. Tap when done.",
                {"script": f"Place 3 stickers on the {scene}."}, {}, *A)
    if need[2]:
        scenes = ["Put the sky on top and your friends below.",
                  "Put the sun in the sky and fish in the sea.",
                  "Put a house on the hill and a tree beside it.",
                  "Put stars above and a campfire below."]
        for script in scenes[:need[2]]:
            add("scene_composition", 2, "listen_repeat",
                f"Build a scene: {script} Tap when done.",
                {"script": script}, {}, *A)
    if need[3]:
        topics = ["a dragon's birthday", "a trip to the moon",
                  "a picnic with giants", "a race of turtles"]
        for topic in topics[:need[3]]:
            add("scene_composition", 3, "listen_repeat",
                f"Draw a scene about {topic}, then tell its story. Tap when done.",
                {"script": f"Draw and tell: {topic}."}, {}, *A)
    if need[4]:
        topics = ["something NEAR (big) and something FAR (small)",
                  "a tall tower and a tiny mouse",
                  "a close-up flower and far mountains",
                  "a big ship and a distant lighthouse"]
        for topic in topics[:need[4]]:
            add("scene_composition", 4, "trace",
                f"Draw a scene with {topic}.",
                {"target": topic, "style": "free"},
                {"min_coverage": 0.2}, *A)
    if need[5]:
        topics = ["a lost puppy", "a magic seed", "a windy day", "a new friend"]
        for topic in topics[:need[5]]:
            add("scene_composition", 5, "trace",
                f"Draw a 3-panel picture story about {topic}: beginning, middle, end.",
                {"target": f"3-panel story: {topic}", "style": "free"},
                {"min_coverage": 0.2}, *A)


# ==========================================================================
# GEOGRAPHY
# ==========================================================================
def b_continents_oceans(need):
    A = AGES["continents_oceans"]
    if need[1]:
        taps = [("Tap the land.", "land", ["water"]),
                ("Tap the water.", "water", ["land"]),
                ("Tap the sky.", "sky", ["water"]),
                ("Tap the clouds.", "clouds", ["water"])]
        for prompt, ans, dis in taps[:need[1]]:
            tt("continents_oceans", 1, prompt, ans, dis, *A)
    if need[2]:
        qs2 = [("Which one is a continent?", "Africa", ["the Atlantic Ocean", "a lake"]),
               ("Which one is a continent?", "Asia", ["the Pacific Ocean", "a river"]),
               ("Which one is an ocean?", "the Atlantic Ocean", ["Africa", "a mountain"]),
               ("Which one is a continent?", "Europe", ["the Indian Ocean", "a desert"])]
        for prompt, ans, dis in qs2[:need[2]]:
            mc("continents_oceans", 2, prompt, ans, dis, *A)
    if need[3]:
        qs3 = [("Which is the biggest continent?", "Asia", ["Africa", "Europe"])]
        for animal, home in take(list(ANIMAL_HABITAT.items()), max(0, need[3] - 1)):
            dis = [h for h in ["Africa", "Asia", "Europe", "Antarctica", "Australia"]
                   if h != home][:2]
            qs3.append((f"The {animal} lives on which continent?", home, dis))
        for prompt, ans, dis in qs3[:need[3]]:
            mc("continents_oceans", 3, prompt, ans, dis, *A)
    if need[4]:
        qs4 = [("Which is the biggest ocean?",
                "the Pacific Ocean", ["the Atlantic Ocean", "the Indian Ocean"]),
               ("Which ocean is between America and Europe?",
                "the Atlantic Ocean", ["the Pacific Ocean", "the Indian Ocean"]),
               ("Which ocean is the coldest and smallest?",
                "the Arctic Ocean", ["the Pacific Ocean", "the Indian Ocean"]),
               ("Which ocean is between Asia and Australia?",
                "the Indian Ocean", ["the Atlantic Ocean", "the Arctic Ocean"])]
        for prompt, ans, dis in qs4[:need[4]]:
            mc("continents_oceans", 4, prompt, ans, dis, *A)
    if need[5]:
        qs5 = [("Australia is a country AND a...?", "continent", ["ocean", "city"]),
               ("How many continents are there?", "seven", ["five", "ten"]),
               ("Which continent is covered in ice?", "Antarctica", ["Africa", "Australia"]),
               ("Penguins live on which continent?", "Antarctica", ["Africa", "Asia"])]
        for prompt, ans, dis in qs5[:need[5]]:
            mc("continents_oceans", 5, prompt, ans, dis, *A)


def b_landmarks(need):
    A = AGES["landmarks"]
    if need[1]:
        for name, city, country, desc in LANDMARKS[:need[1]]:
            tt("landmarks", 1, f"Tap {desc}: the {name}.",
               name, [n for n, _, _, _ in LANDMARKS if n != name][:2], *A)
    if need[2]:
        for name, city, country, desc in LANDMARKS[:need[2]]:
            mc("landmarks", 2, f"The {name} is in which city?",
               city, [c for _, c, _, _ in LANDMARKS if c != city][:2], *A)
    if need[3]:
        for name, city, country, desc in LANDMARKS[:need[3]]:
            mc("landmarks", 3, f"The {name} is in which country?",
               country, [c for _, _, c, _ in LANDMARKS if c != country][:2], *A)
    if need[4]:
        for name, desc, place in NATURE_WONDERS[:need[4]]:
            mc("landmarks", 4, f"Which natural wonder is {desc}?",
               name, [n for n, _, _ in NATURE_WONDERS if n != name], *A)
        extra4 = [(f"Is the {n} made by people or by nature?", n)
                  for n, _, _, _ in LANDMARKS]
        for prompt, name in take(extra4, max(0, need[4] - len(NATURE_WONDERS))):
            mc("landmarks", 4, prompt, "made by people", ["made by nature"], *A)
    if need[5]:
        qs = [("Why do people visit the Pyramids of Egypt?",
               "to see ancient history", ["to go swimming", "to pick fruit"]),
              ("The Eiffel Tower was built for...?",
               "a big fair in Paris", ["a birthday cake", "a boat race"]),
              ("Why is the Great Wall of China so long?",
               "it protected the country long ago", ["it was a road for cars", "it was a slide"]),
              ("The Statue of Liberty stands in which city?",
               "New York", ["Paris", "London"])]
        for prompt, ans, dis in qs[:need[5]]:
            mc("landmarks", 5, prompt, ans, dis, *A)


def b_world_animals(need):
    A = AGES["world_animals"]
    if need[1]:
        qs = [("Do penguins live where it is hot or cold?", "cold", ["hot"]),
              ("Do camels live where it is hot or cold?", "hot", ["cold"]),
              ("Do polar bears live where it is hot or cold?", "cold", ["hot"]),
              ("Do lizards like it hot or cold?", "hot", ["cold"])]
        for prompt, ans, dis in qs[:need[1]]:
            mc("world_animals", 1, prompt, ans, dis, *A)
    if need[2]:
        groups = {"ocean": ["whale", "shark"], "land": ["lion", "elephant"]}
        items = [{"id": a, "label": a} for aa in groups.values() for a in aa]
        rng.shuffle(items)
        prompts2 = ["Sort: ocean animals or land animals?",
                    "Tap each animal into its home: ocean or land?",
                    "Where does each animal live: ocean or land?",
                    "Ocean home or land home? Sort them all!"]
        for prompt in prompts2[:need[2]]:
            add("world_animals", 2, "sort", prompt,
                {"items": list(items),
                 "groups": [{"id": "ocean", "label": "ocean"}, {"id": "land", "label": "land"}]},
                {"groups": {g: sorted(v) for g, v in groups.items()}}, *A)
    if need[3]:
        for animal, home in take(list(ANIMAL_HABITAT.items()), need[3]):
            others = rng.sample([h for h in ANIMAL_HABITAT.values() if h != home], 2)
            mc("world_animals", 3, f"Where does the {animal} live?",
               home, others, *A)
    if need[4]:
        qs = [("Why is the polar bear's fur white?",
               "to hide in the snow", ["to stay cool", "to look pretty"]),
              ("Why does a camel have a hump?",
               "it stores food for long desert trips",
               ["it holds water like a cup", "it keeps the camel warm"]),
              ("Why do ducks have webbed feet?",
               "to paddle through water", ["to fly faster", "to keep warm"]),
              ("Why does a giraffe have a long neck?",
               "to reach leaves high in trees", ["to see over walls", "to stay cool"])]
        for prompt, ans, dis in qs[:need[4]]:
            mc("world_animals", 4, prompt, ans, dis, *A)
    if need[5]:
        if need[5] >= 1:
            chain = ["grass", "rabbit", "fox"]
            items, ans = seq_items(chain, "c")
            add("world_animals", 5, "sequence",
                "Put the food chain in order: who eats whom?",
                {"items": items}, ans, *A,
                narration="Order the food chain: grass, then rabbit, then fox.")
        qs5 = [("In corn -> mouse -> owl, what eats the mouse?",
                "the owl", ["the corn", "the farmer"],
                "In the food chain corn, mouse, owl: what eats the mouse?"),
               ("In grass -> rabbit -> fox, what eats the rabbit?",
                "the fox", ["the grass", "the owl"],
                "In the food chain grass, rabbit, fox: what eats the rabbit?"),
               ("In the food chain grass -> grasshopper -> frog, who eats the frog?",
                "a bird or snake", ["the grass", "the grasshopper"],
                "Who eats the frog in the food chain?")]
        for prompt, ans, dis, narr in qs5[:max(0, need[5] - 1)]:
            mc("world_animals", 5, prompt, ans, dis, *A, narration=narr)


def b_map_skills(need):
    A = AGES["map_skills"]
    if need[1]:
        steps = ["cross the bridge", "pass the big tree", "reach home"]
        prompts = ["Help Sam get home. Put the map steps in order.",
                   "Order the map steps so Sam gets home.",
                   "Which way does Sam go? Put the steps in order.",
                   "Put the map steps in the right order so Sam gets home."]
        for prompt in prompts[:need[1]]:
            items, ans = seq_items(steps, "s")
            add("map_skills", 1, "sequence", prompt,
                {"items": items}, ans, *A)
    if need[2]:
        qs = [("The ball is under the box. Where is the ball?",
               "under the box", ["over the box", "near the sun"]),
              ("The cat is behind the door. Where is the cat?",
               "behind the door", ["under the mat", "on the moon"]),
              ("The bird is above the tree. Where is the bird?",
               "above the tree", ["under the tree", "inside the tree"])]
        for prompt, ans, dis in qs[:max(1, need[2] - 1)]:
            mc("map_skills", 2, prompt, ans, dis, *A)
        if need[2] > 1:
            tt("map_skills", 2, "On the map, tap what is NEAR the tree.",
               "the swing", ["the far hill", "the distant lake"], *A)
    if need[3]:
        qs = [("On a map key, blue shapes mean...?", "water", ["mountains", "roads"]),
              ("On a map key, brown bumps mean...?", "mountains", ["water", "roads"]),
              ("On a map key, black lines mean...?", "roads", ["water", "rivers"]),
              ("On a map key, green shapes mean...?", "parks and forests", ["water", "roads"])]
        for prompt, ans, dis in qs[:need[3]]:
            mc("map_skills", 3, prompt, ans, dis, *A)
    if need[4]:
        qs = [("The sun rises in the...?", "east", ["west", "north"]),
              ("The sun sets in the...?", "west", ["east", "south"]),
              ("Moss often grows on the shady side: which direction is usually shadiest?",
               "north", ["south", "east"])]
        for prompt, ans, dis in qs[:max(1, need[4] - 1)]:
            mc("map_skills", 4, prompt, ans, dis, *A)
        if need[4] > 1:
            tt("map_skills", 4, "Tap NORTH on the compass rose.",
               "north", ["south", "east"], *A)
    if need[5]:
        qs = [("On the grid map the star is at B2. The heart is one square right. Where is the heart?",
               "C2", ["B3", "C3"], "The star is at B 2. One square right is C 2."),
              ("On the grid map the dot is at A1. The moon is one square up. Where is the moon?",
               "A2", ["B1", "B2"], "The dot is at A 1. One square up is A 2."),
              ("On the grid map the fish is at C3. The boat is one square left. Where is the boat?",
               "B3", ["C2", "D3"], "The fish is at C 3. One square left is B 3."),
              ("On the grid map the sun is at D4. The cloud is one square down. Where is the cloud?",
               "D3", ["C4", "E4"], "The sun is at D 4. One square down is D 3.")]
        for prompt, ans, dis, narr in qs[:need[5]]:
            mc("map_skills", 5, prompt, ans, dis, *A, narration=narr)


def b_cultures(need):
    A = AGES["cultures"]
    if need[1]:
        qs = [("In some places people eat with chopsticks. Tap the chopsticks.",
               "chopsticks", ["a spoon", "a cup"]),
              ("In some places people drink from a small tea cup. Tap the tea cup.",
               "tea cup", ["a big mug", "a spoon"]),
              ("In some places people eat bread with their hands. Tap the bread.",
               "bread", ["a fork", "a shoe"]),
              ("In some places people greet with a bow. Tap the bow.",
               "a bow", ["a handshake", "a hat"])]
        for prompt, ans, dis in qs[:need[1]]:
            tt("cultures", 1, prompt, ans, dis, *A)
    if need[2]:
        for lang, hello in HELLOS[:need[2]]:
            others = [h for _, h in HELLOS if h != hello][:2]
            mc("cultures", 2, f"How do you say hello in {lang}?",
               hello, others, *A)
    if need[3]:
        for home, made_of, place in HOMES[:need[3]]:
            mc("cultures", 3, f"An {home} is a home made of {made_of}. Where would you find one?",
               place, [p for _, _, p in HOMES if p != place], *A)
        for _ in range(max(0, need[3] - len(HOMES))):
            mc("cultures", 3, "Some families eat dinner on the floor, some at a table. That is...",
               "a difference to respect", ["a mistake", "a rule"], *A)
    if need[4]:
        for name, place, desc in FESTIVALS[:need[4]]:
            mc("cultures", 4, f"{name} is {desc}. Where is it celebrated?",
               place, [p for _, p, _ in FESTIVALS if p != place][:2], *A)
    if need[5]:
        qs = [("During Lunar New Year in China, dancers dress as a long, colorful...?",
               "dragon", ["tiger", "bird"]),
              ("During Diwali in India, people light many small...?",
               "oil lamps", ["candles on a cake", "flashlights"]),
              ("During the Day of the Dead in Mexico, families remember...?",
               "loved ones who died", ["birthday parties", "new babies"]),
              ("During Hanukkah, families light a special...?",
               "menorah with candles", ["birthday cake", "bonfire"])]
        for prompt, ans, dis in qs[:need[5]]:
            mc("cultures", 5, prompt, ans, dis, *A)


# ==========================================================================
# CODING
# ==========================================================================
def b_sequencing(need):
    A = AGES["sequencing"]
    if need[1]:
        pairs = [
            (["put on socks", "put on shoes"], "Get dressed"),
            (["open the book", "read the story"], "Read a book"),
            (["wash your hands", "eat your lunch"], "Lunchtime"),
            (["say hello", "wave goodbye"], "Greet a friend"),
        ]
        for steps, title in pairs[:need[1]]:
            items, ans = seq_items(steps, "s")
            add("sequencing", 1, "sequence", f"{title}: what comes first?",
                {"items": items}, ans, *A)
    if need[2]:
        routines = [
            (["put on toothpaste", "brush teeth", "rinse mouth"], "Brush your teeth"),
            (["get the bread", "add peanut butter", "eat the sandwich"], "Make a sandwich"),
            (["find your shoes", "put shoes on", "tie the laces"], "Get ready to go"),
        ]
        for steps, title in routines[:need[2]]:
            items, ans = seq_items(steps, "s")
            add("sequencing", 2, "sequence", f"{title}: put the steps in order.",
                {"items": items}, ans, *A)
        if need[2] > 3:
            steps = ["wake up", "eat breakfast", "go to school"]
            items, ans = seq_items(steps, "s")
            add("sequencing", 2, "sequence", "Morning routine: put the steps in order.",
                {"items": items}, ans, *A)
    if need[3]:
        goals = ["get the star", "get the apple", "find the door", "catch the butterfly"]
        for goal in goals[:need[3]]:
            steps = ["move forward", "move forward again", f"grab {goal.split('the ')[1]}"]
            items, ans = seq_items(steps, "s")
            add("sequencing", 3, "sequence",
                f"Program Bot to {goal}: put the blocks in order.",
                {"items": items}, ans, *A)
    if need[4]:
        goals = [
            (["wake Bot up", "move forward", "turn left", "grab the apple", "say yum"],
             "get the apple"),
            (["wake Bot up", "hop forward", "turn right", "grab the ball", "say yay"],
             "get the ball"),
            (["wake Bot up", "swim forward", "dive down", "grab the pearl", "say wow"],
             "find the pearl"),
        ]
        for steps, goal in goals[:need[4]]:
            items, ans = seq_items(steps, "s")
            add("sequencing", 4, "sequence",
                f"Program Bot to {goal}: order all five blocks.",
                {"items": items}, ans, *A)
        if need[4] > 3:
            steps = ["wake Bot up", "climb up", "look around", "grab the flag", "wave hello"]
            items, ans = seq_items(steps, "s")
            add("sequencing", 4, "sequence",
                "Program Bot to plant the flag: order all five blocks.",
                {"items": items}, ans, *A)
    if need[5]:
        routines = [
            (["wake up", "__", "eat breakfast"], "get dressed", "Morning"),
            (["open the book", "__", "close the book"], "read the story", "Reading"),
        ]
        for steps, missing, title in routines[:need[5]]:
            mc("sequencing", 5, f"{title}: which step is missing? {' -> '.join(steps)}",
               missing, ["eat lunch", "go to sleep"], *A,
               narration=f"Which step is missing from: {', '.join(steps)}?")
        for _ in range(max(0, need[5] - len(routines))):
            mc("sequencing", 5, "Bedtime: which step is missing? brush teeth -> __ -> sleep",
               "put on pajamas", ["eat breakfast", "go outside"], *A)


def b_patterns_coding(need):
    A = AGES["patterns_coding"]
    if need[1]:
        pats = [("red, blue, red, __.", "blue", ["red", "green"]),
                ("circle, square, circle, __.", "square", ["circle", "triangle"]),
                ("hop, clap, hop, __.", "clap", ["hop", "spin"]),
                ("blue, red, blue, __.", "red", ["blue", "yellow"])]
        for shown, ans, dis in pats[:need[1]]:
            mc("patterns_coding", 1, f"What comes next? {shown}", ans, dis, *A)
    if need[2]:
        pats = [("red, blue, blue, red, blue, blue, red, __.", "blue", ["red", "yellow"]),
                ("star, star, moon, star, star, moon, star, __.", "star", ["moon", "sun"]),
                ("clap, clap, stomp, clap, clap, stomp, clap, __.", "clap", ["stomp", "hop"]),
                ("moon, star, star, moon, star, star, moon, __.", "star", ["moon", "sun"])]
        for shown, ans, dis in pats[:need[2]]:
            mc("patterns_coding", 2, f"What comes next? {shown}", ans, dis, *A,
               narration=f"What comes next in the pattern: {shown}")
    if need[3]:
        mc("patterns_coding", 3, "Which one is a repeating pattern?",
           "clap, stomp, clap, stomp",
           ["clap, clap, stomp, hop", "stomp, hop, clap, spin"], *A)
        reps = [("Which one repeats?",
                 "red, red, blue, red, red, blue",
                 ["red, blue, green, yellow", "blue, blue, blue, blue"]),
                ("Which one repeats?",
                 "hop, hop, spin, hop, hop, spin",
                 ["hop, spin, hop, hop", "spin, spin, spin, spin"])]
        for prompt, ans, dis in reps[:max(0, need[3] - 2)]:
            mc("patterns_coding", 3, prompt, ans, dis, *A)
        add("patterns_coding", 3, "listen_repeat",
            "Invent your own repeating pattern: clap, stomp, clap, stomp... Do it! Tap when done.",
            {"script": "Invent and perform a repeating pattern."}, {}, *A)
    if need[4]:
        qs = [("Bot does: hop, hop, spin, hop, hop, spin. What is the repeating part?",
               "hop, hop, spin", ["hop, spin", "spin, spin, hop"]),
              ("Bot does: clap, stomp, stomp, clap, stomp, stomp. What repeats?",
               "clap, stomp, stomp", ["clap, clap", "stomp, stomp, stomp"]),
              ("The song goes: la, la, loo, la, la, loo. What repeats?",
               "la, la, loo", ["la, loo", "loo, loo, la"]),
              ("Bot does: stomp, clap, clap, stomp, clap, clap. What repeats?",
               "stomp, clap, clap", ["stomp, stomp", "clap, clap, clap"])]
        for prompt, ans, dis in qs[:need[4]]:
            mc("patterns_coding", 4, prompt, ans, dis, *A)
    if need[5]:
        qs = [("Growing pattern: 1 dot, 2 dots, 3 dots, __.", "4 dots", ["3 dots", "5 stars"]),
              ("Growing pattern: 2 claps, 4 claps, 6 claps, __.", "8 claps", ["6 claps", "7 claps"]),
              ("Growing pattern: 5, 10, 15, __.", "20", ["18", "25"]),
              ("Growing pattern: 3, 6, 9, __.", "12", ["10", "11"])]
        for prompt, ans, dis in qs[:need[5]]:
            mc("patterns_coding", 5, prompt, ans, dis, *A)


def b_loops(need):
    A = AGES["loops"]
    if need[1]:
        hops = ["Hop two times: hop, hop! Again! Tap when you hopped.",
                "Hop three times: hop, hop, hop! Again! Tap when you hopped.",
                "Hop two times: hop, hop! One more set! Tap when you hopped.",
                "Clap two times: clap, clap! Again! Tap when you clapped."]
        for prompt in hops[:need[1]]:
            add("loops", 1, "listen_repeat", prompt,
                {"script": "Hop two times."}, {}, *A)
    if need[2]:
        qs = [("Bot must clap 3 times. Which block does it?",
               "repeat 3 times: clap", ["clap one time", "repeat 3 times: hop"]),
              ("Bot must stomp 2 times. Which block does it?",
               "repeat 2 times: stomp", ["stomp one time", "repeat 2 times: clap"]),
              ("Bot must spin 4 times. Which block does it?",
               "repeat 4 times: spin", ["spin one time", "repeat 4 times: hop"]),
              ("Bot must hop 5 times. Which block does it?",
               "repeat 5 times: hop", ["hop one time", "repeat 5 times: spin"])]
        for prompt, ans, dis in qs[:need[2]]:
            mc("loops", 2, prompt, ans, dis, *A)
    if need[3]:
        qs = [("The loop says: repeat 4 times: jump. How many jumps?",
               "4", ["3", "5"]),
              ("The loop says: repeat 3 times: hop. How many hops?",
               "3", ["2", "4"]),
              ("The loop says: repeat 5 times: clap. How many claps?",
               "5", ["4", "6"]),
              ("The loop says: repeat 2 times: spin. How many spins?",
               "2", ["3", "1"])]
        for prompt, ans, dis in qs[:need[3]]:
            mc("loops", 3, prompt, ans, dis, *A)
    if need[4]:
        qs = [("Repeat 2 times: clap, stomp. What does Bot do?",
               "clap, stomp, clap, stomp",
               ["clap, clap, stomp, stomp", "clap, stomp"]),
              ("Repeat 3 times: hop, clap. What does Bot do?",
               "hop, clap, hop, clap, hop, clap",
               ["hop, hop, hop, clap, clap, clap", "hop, clap"]),
              ("Repeat 2 times: spin, hop. What does Bot do?",
               "spin, hop, spin, hop",
               ["spin, spin, hop, hop", "spin, hop"]),
              ("Repeat 4 times: clap. What does Bot do?",
               "clap, clap, clap, clap",
               ["clap, clap", "clap"])]
        for prompt, ans, dis in qs[:need[4]]:
            mc("loops", 4, prompt, ans, dis, *A,
               narration=f"Repeat it out. What happens?")
    if need[5]:
        qs = [("Repeat 2 times: hop. Then repeat 3 times: spin. How many moves in all?",
               "5", ["6", "4"]),
              ("Repeat 3 times: clap. Then repeat 2 times: stomp. How many moves in all?",
               "5", ["6", "4"]),
              ("Repeat 4 times: hop. Then repeat 1 time: bow. How many moves in all?",
               "5", ["4", "6"]),
              ("Repeat 2 times: stomp. Then repeat 2 times: clap. How many moves in all?",
               "4", ["5", "3"])]
        for prompt, ans, dis in qs[:need[5]]:
            mc("loops", 5, prompt, ans, dis, *A)


def b_conditions(need):
    A = AGES["conditions"]
    if need[1]:
        qs = [("If it rains, take an umbrella. It is raining! Take the...?",
               "umbrella", ["sunglasses", "kite"]),
              ("If you are cold, wear a coat. You are cold! Wear the...?",
               "coat", ["swimsuit", "sandals"]),
              ("If it is sunny, wear sunglasses. It is sunny! Wear the...?",
               "sunglasses", ["coat", "boots"]),
              ("If you are thirsty, drink water. You are thirsty! Drink the...?",
               "water", ["milkshake", "sand"])]
        for prompt, ans, dis in qs[:need[1]]:
            mc("conditions", 1, prompt, ans, dis, *A)
    if need[2]:
        qs = [("If the light is green, the car goes. The light is green! The car will...?",
               "go", ["stop", "turn around"]),
              ("If the light is red, the car stops. The light is red! The car will...?",
               "stop", ["go", "honk"]),
              ("If the bell rings, line up. The bell rings! You will...?",
               "line up", ["keep playing", "run away"]),
              ("If the bell rings, freeze. The bell rings! You will...?",
               "freeze", ["keep dancing", "sit down"])]
        for prompt, ans, dis in qs[:need[2]]:
            mc("conditions", 2, prompt, ans, dis, *A)
    if need[3]:
        qs = [("If hungry: eat an apple. Else: play. Sam is NOT hungry. Sam will...?",
               "play", ["eat an apple", "take a nap"]),
              ("If tired: rest. Else: dance. Kim is NOT tired. Kim will...?",
               "dance", ["rest", "cry"]),
              ("If wet: dry off. Else: keep swimming. Max is NOT wet. Max will...?",
               "keep swimming", ["dry off", "go home"]),
              ("If sleepy: take a nap. Else: read. Jo is NOT sleepy. Jo will...?",
               "read", ["take a nap", "cry"])]
        for prompt, ans, dis in qs[:need[3]]:
            mc("conditions", 3, prompt, ans, dis, *A)
    if need[4]:
        qs = [("Bot's sensor: if a wall is ahead, turn. A wall is ahead! Bot will...?",
               "turn", ["move forward", "shut down"]),
              ("Bot's sensor: if a cliff is ahead, stop. A cliff is ahead! Bot will...?",
               "stop", ["move forward", "turn"]),
              ("Bot's sensor: if it is dark, turn on lights. It is dark! Bot will...?",
               "turn on lights", ["shut down", "spin"]),
              ("Bot's sensor: if music plays, dance. Music plays! Bot will...?",
               "dance", ["shut down", "beep"])]
        for prompt, ans, dis in qs[:need[4]]:
            mc("conditions", 4, prompt, ans, dis, *A)
    if need[5]:
        qs = [("Repeat 3 times: if the bell rings, clap. The bell rings 2 times. How many claps?",
               "2", ["3", "6"]),
              ("Repeat 4 times: if the light blinks, stomp. The light blinks 3 times. How many stomps?",
               "3", ["4", "12"]),
              ("Repeat 2 times: if the dog barks, wave. The dog barks 2 times. How many waves?",
               "2", ["4", "1"]),
              ("Repeat 3 times: if the horn honks, jump. The horn honks 1 time. How many jumps?",
               "1", ["3", "2"])]
        for prompt, ans, dis in qs[:need[5]]:
            mc("conditions", 5, prompt, ans, dis, *A)


def b_debugging(need):
    A = AGES["debugging"]
    if need[1]:
        qs = [("Two steps: 1. Put on shoes. 2. Put on socks. Which step is silly?",
               "step 2: socks go on first", ["step 1 is fine"],
               "Put on shoes, then put on socks. Which step is silly?"),
              ("Two steps: 1. Eat the soup. 2. Take a spoon. Which step is silly?",
               "step 1: take the spoon first", ["step 2 is fine"],
               "Eat the soup, then take a spoon. Which step is silly?"),
              ("Two steps: 1. Close your eyes. 2. Find your pillow. Which step is silly?",
               "step 1: keep eyes open to find it", ["step 2 is fine"],
               "Close your eyes, then find your pillow. Which step is silly?"),
              ("Two steps: 1. Brush teeth. 2. Put toothpaste on the brush. Which step is silly?",
               "step 1: toothpaste goes on first", ["step 2 is fine"],
               "Brush teeth, then put toothpaste on the brush. Which step is silly?")]
        for prompt, ans, dis, narr in qs[:need[1]]:
            mc("debugging", 1, prompt, ans, dis, *A, narration=narr)
    if need[2]:
        qs = [("1. Eat the sandwich. 2. Open the lunchbox. 3. Close the lunchbox. Which step is wrong?",
               "step 1", ["step 2", "step 3"], None),
              ("1. Put on a hat. 2. Go outside. 3. Open the door. Which two steps are mixed up?",
               "steps 2 and 3", ["steps 1 and 2", "steps 1 and 3"], None),
              ("1. Pour the milk. 2. Get the cup. 3. Drink. Which step is wrong?",
               "step 1", ["step 2", "step 3"], None),
              ("1. Open the book. 2. Read the story. 3. Close the book. Which step is wrong?",
               "none: all are right", ["step 1", "step 2"], None)]
        for prompt, ans, dis, _ in qs[:need[2]]:
            mc("debugging", 2, prompt, ans, dis, *A)
    if need[3]:
        qs = [("Bot should draw a square but drew a triangle. What is the bug?",
               "it drew one side too few", ["it drew too slowly", "it used red"], None),
              ("Bot should hop 4 times but hopped 3 times. What is the bug?",
               "it hopped one time too few", ["it hopped too fast", "it hopped sideways"], None),
              ("Bot should turn left but turned right. What is the bug?",
               "it turned the wrong way", ["it turned too slowly", "it did not move"], None),
              ("Bot should clap 2 times but clapped 4 times. What is the bug?",
               "it clapped two times too many",
               ["it clapped too quietly", "it clapped too slowly"], None)]
        for prompt, ans, dis, _ in qs[:need[3]]:
            mc("debugging", 3, prompt, ans, dis, *A)
    if need[4]:
        qs = [("Two bugs! 1. Wake up. 2. Eat dinner. 3. Go to school. 4. Brush teeth. Which two are mixed up?",
               "steps 2 and 4", ["steps 1 and 3", "steps 1 and 2"],
               "Wake up, eat dinner, go to school, brush teeth. Which two are mixed up?"),
              ("Two bugs! 1. Wash hands. 2. Eat lunch. 3. Cook lunch. 4. Set the table. Which two are mixed up?",
               "steps 2 and 3", ["steps 1 and 4", "steps 1 and 2"],
               "Wash hands, eat lunch, cook lunch, set the table. Which two are mixed up?"),
              ("Two bugs! 1. Get dressed. 2. Go to bed. 3. Eat breakfast. 4. Wake up. Which two are mixed up?",
               "steps 2 and 4", ["steps 1 and 3", "steps 1 and 2"],
               "Get dressed, go to bed, eat breakfast, wake up. Which two are mixed up?"),
              ("Two bugs! 1. Eat dinner. 2. Wake up. 3. Play outside. 4. Go to bed. Which two are mixed up?",
               "steps 1 and 2", ["steps 3 and 4", "steps 1 and 3"],
               "Eat dinner, wake up, play outside, go to bed. Which two are mixed up?")]
        for prompt, ans, dis, narr in qs[:need[4]]:
            mc("debugging", 4, prompt, ans, dis, *A, narration=narr)
    if need[5]:
        qs = [("The plant robot waters every hour and the plant is drowning. What is the bug?",
               "it waters too often", ["it waters too little", "the plant is broken"]),
              ("The night light turns on at noon and off at midnight. What is the bug?",
               "it is backwards", ["it is too bright", "it is broken forever"]),
              ("The door bot opens the door when no one is there. What is the bug?",
               "its sensor is too jumpy", ["the door is too heavy", "no bug at all"]),
              ("The alarm bot rings at night and is quiet in the morning. What is the bug?",
               "its times are swapped", ["it is too loud", "it needs a new bell"])]
        for prompt, ans, dis in qs[:need[5]]:
            mc("debugging", 5, prompt, ans, dis, *A)

# ==========================================================================
# SCIENCE
# ==========================================================================
def b_plants(need):
    A = AGES["plants"]
    if need[1]:
        qs = [("A tiny seed needs ___ to start growing.",
               "water", ["sand", "a hat"]),
              ("Seeds also love warm ___.",
               "sunlight", ["snow", "darkness"]),
              ("A seed needs ___ under the ground to drink.",
               "soil and water", ["a blanket", "a pillow"])]
        for prompt, ans, dis in qs[:need[1]]:
            mc("plants", 1, prompt, ans, dis, *A)
    if need[2]:
        parts = [("Tap the roots of the plant.", "roots", ["flower", "leaf"]),
                 ("Tap the flower of the plant.", "flower", ["stem", "roots"]),
                 ("Tap the leaf of the plant.", "leaf", ["flower", "roots"])]
        for prompt, ans, dis in parts[:need[2]]:
            tt("plants", 2, prompt, ans, dis, *A)
    if need[3]:
        qs = [("Plants need sun, water, and...?",
               "soil", ["candy", "pillows"]),
              ("Plants drink with their...?",
               "roots", ["leaves", "flowers"]),
              ("Plants make food in their...?",
               "leaves", ["roots", "seeds"]),
              ("Plants breathe in air through their...?",
               "leaves", ["roots", "flowers"])]
        for prompt, ans, dis in qs[:need[3]]:
            mc("plants", 3, prompt, ans, dis, *A)
    if need[4]:
        stages = ["seed", "sprout", "plant", "flower"]
        prompts = ["Put the plant's life in order.",
                   "Order the plant's life from first to last.",
                   "How does a plant grow? Order the stages.",
                   "From seed to flower: put them in order."]
        for prompt in prompts[:need[4]]:
            items, ans = seq_items(stages, "p")
            add("plants", 4, "sequence", prompt,
                {"items": items}, ans, *A)
    if need[5]:
        qs = [("A plant in a dark box for weeks will become...",
               "pale and weak", ["big and strong", "full of flowers"]),
              ("A plant with no water for weeks will become...",
               "dry and droopy", ["tall and green", "full of fruit"]),
              ("Why do plants lean toward the window?",
               "they grow toward the light", ["they are dancing", "they are cold"]),
              ("A plant with lots of light but no water will...?",
               "droop and dry out", ["grow faster", "make flowers"])]
        for prompt, ans, dis in qs[:need[5]]:
            mc("plants", 5, prompt, ans, dis, *A)


def b_animals_habitats(need):
    A = AGES["animals_habitats"]
    if need[1]:
        babies = [("A baby dog is called a...?", "puppy", ["kitten", "calf"]),
                  ("A baby cat is called a...?", "kitten", ["puppy", "chick"]),
                  ("A baby cow is called a...?", "calf", ["puppy", "kitten"]),
                  ("A baby duck is called a...?", "duckling", ["chick", "puppy"])]
        for prompt, ans, dis in babies[:need[1]]:
            mc("animals_habitats", 1, prompt, ans, dis, *A)
    if need[2]:
        groups = {"ocean": ["fish", "shark"], "forest": ["bear", "owl"]}
        items = [{"id": a, "label": a} for aa in groups.values() for a in aa]
        rng.shuffle(items)
        prompts = ["Sort: ocean home or forest home?",
                   "Where does each animal live: ocean or forest?",
                   "Tap each animal into its home: ocean or forest?",
                   "Ocean home or forest home? Sort them all!"]
        for prompt in prompts[:need[2]]:
            add("animals_habitats", 2, "sort", prompt,
                {"items": list(items),
                 "groups": [{"id": "ocean", "label": "ocean"}, {"id": "forest", "label": "forest"}]},
                {"groups": {g: sorted(v) for g, v in groups.items()}}, *A)
    if need[3]:
        groups = {"plants": ["cow", "horse"], "meat": ["lion", "tiger"]}
        items = [{"id": a, "label": a} for aa in groups.values() for a in aa]
        rng.shuffle(items)
        prompts = ["Sort by what they eat: plants or meat?",
                   "Who eats plants and who eats meat? Sort them!",
                   "Tap each animal into its food group: plants or meat.",
                   "Plants or meat? Tap each animal into its food group."]
        for prompt in prompts[:need[3]]:
            add("animals_habitats", 3, "sort", prompt,
                {"items": list(items),
                 "groups": [{"id": "plants", "label": "plants"}, {"id": "meat", "label": "meat"}]},
                {"groups": {g: sorted(v) for g, v in groups.items()}}, *A)
    if need[4]:
        qs = [("Why do some animals match the color of trees?",
               "to hide from danger", ["to look fancy", "to stay warm"]),
              ("A turtle's hard shell helps it...?",
               "stay safe", ["swim fast", "fly high"]),
              ("Why does a polar bear have thick fur?",
               "to stay warm", ["to look big", "to swim fast"]),
              ("Why do rabbits have long ears?",
               "to hear danger coming", ["to fly", "to look cute"])]
        for prompt, ans, dis in qs[:need[4]]:
            mc("animals_habitats", 4, prompt, ans, dis, *A)
    if need[5]:
        chain = ["grass", "grasshopper", "frog"]
        prompts = ["Put the food chain in order: who eats whom?",
                   "Order the food chain from first to last.",
                   "Who eats whom? Put them in order.",
                   "Order the food chain: who eats whom?"]
        for prompt in prompts[:need[5]]:
            items, ans = seq_items(chain, "f")
            add("animals_habitats", 5, "sequence", prompt,
                {"items": items}, ans, *A)


def b_weather(need):
    A = AGES["weather"]
    if need[1]:
        for sky in ["sunny", "rainy", "snowy"][:need[1]]:
            others = rng.sample([s for s in ["sunny", "cloudy", "rainy", "snowy"] if s != sky], 2)
            tt("weather", 1, f"Tap the {sky} picture.", sky, others, *A)
        if need[1] > 3:
            tt("weather", 1, "Tap the cloudy picture.", "cloudy", ["sunny", "snowy"], *A)
    if need[2]:
        qs = [("It is snowing outside. Put on your...?",
               "warm coat", ["swimsuit", "sandals"]),
              ("It is raining. Take your...?",
               "umbrella", ["sunglasses", "fan"]),
              ("It is hot and sunny. Put on your...?",
               "sunglasses", ["warm coat", "boots"])]
        for prompt, ans, dis in qs[:need[2]]:
            mc("weather", 2, prompt, ans, dis, *A)
    if need[3]:
        qs = [("Leaves turn red and fall in...?",
               "fall", ["spring", "summer"]),
              ("Flowers bloom and baby animals are born in...?",
               "spring", ["winter", "fall"]),
              ("It is hot and perfect for swimming in...?",
               "summer", ["winter", "spring"])]
        n_q = min(need[3], 3)
        for prompt, ans, dis in qs[:n_q]:
            mc("weather", 3, prompt, ans, dis, *A)
        if need[3] > n_q:
            seasons = ["spring", "summer", "fall", "winter"]
            items, ans = seq_items(seasons, "s")
            add("weather", 3, "sequence", "Put the seasons in order, starting with spring.",
                {"items": items}, ans, *A)
    if need[4]:
        steps = ["water rises up", "clouds form", "rain falls down"]
        prompts = ["Put the water cycle in order.",
                   "How does rain get made? Order the steps.",
                   "Order the water cycle from first to last.",
                   "Order the steps of the water cycle."]
        for prompt in prompts[:need[4]]:
            items, ans = seq_items(steps, "w")
            add("weather", 4, "sequence", prompt,
                {"items": items}, ans, *A)
    if need[5]:
        qs = [("Sun, sun, rain, sun, sun, rain, sun... What comes next?",
               "sun", ["rain", "snow"],
               "Sun, sun, rain, sun, sun, rain, sun. What comes next in the pattern?"),
              ("Rain, sun, rain, sun, rain... What comes next?",
               "sun", ["rain", "snow"],
               "Rain, sun, rain, sun, rain. What comes next in the pattern?"),
              ("Snow, snow, sun, snow, snow, sun... What comes next?",
               "snow", ["sun", "rain"],
               "Snow, snow, sun, snow, snow, sun. What comes next in the pattern?"),
              ("Cloudy, sunny, cloudy, sunny, cloudy... What comes next?",
               "sunny", ["cloudy", "snowy"],
               "Cloudy, sunny, cloudy, sunny, cloudy. What comes next in the pattern?")]
        for prompt, ans, dis, narr in qs[:need[5]]:
            mc("weather", 5, prompt, ans, dis, *A, narration=narr)


def b_human_body(need):
    A = AGES["human_body"]
    if need[1]:
        for part in ["nose", "eyes", "mouth", "hands"][:need[1]]:
            others = rng.sample([p for p in ["nose", "eyes", "mouth", "hands", "ears"] if p != part], 2)
            tt("human_body", 1, f"Point to your {part}. Tap the {part}.",
               part, others, *A)
    if need[2]:
        qs = [("Which part do you smell with?", "nose", ["eyes", "hands"]),
              ("Which part do you see with?", "eyes", ["nose", "mouth"]),
              ("Which part do you taste with?", "tongue", ["ears", "nose"]),
              ("Which part do you hear with?", "ears", ["nose", "mouth"])]
        for prompt, ans, dis in qs[:need[2]]:
            mc("human_body", 2, prompt, ans, dis, *A)
    if need[3]:
        qs = [("Your bones and muscles help you...?",
               "move", ["sleep", "dream"]),
              ("Your bones are like a ___ inside you.",
               "frame", ["balloon", "pillow"]),
              ("Muscles get stronger when you...?",
               "move and play", ["sit still", "sleep all day"]),
              ("Your heart beats faster when you...?",
               "run and play", ["sit still", "sleep"])]
        for prompt, ans, dis in qs[:need[3]]:
            mc("human_body", 3, prompt, ans, dis, *A)
    if need[4]:
        qs = [("Your heart's job is to...?",
               "pump blood", ["hold air", "digest food"]),
              ("Your lungs help you...?",
               "breathe", ["see", "hear"]),
              ("Your brain's job is to...?",
               "think", ["pump blood", "digest food"]),
              ("Your stomach's job is to...?",
               "digest food", ["pump blood", "breathe air"])]
        for prompt, ans, dis in qs[:need[4]]:
            mc("human_body", 4, prompt, ans, dis, *A)
    if need[5]:
        qs = [("Food gives your body...?",
               "energy", ["water", "air"]),
              ("Why do you feel sleepy at night?",
               "your body needs rest", ["your body is broken", "food makes you sleepy"]),
              ("Exercise helps your heart get...?",
               "stronger", ["smaller", "sleepier"]),
              ("Why do you need sleep?",
               "so your body and brain can rest",
               ["so you dream more", "so you grow taller faster"])]
        for prompt, ans, dis in qs[:need[5]]:
            mc("human_body", 5, prompt, ans, dis, *A)


def b_experiments(need):
    A = AGES["experiments"]
    if need[1]:
        qs = [("Predict: will a rock sink or float? Then test it!",
               "sink", ["float"]),
              ("Predict: will a leaf sink or float?",
               "float", ["sink"]),
              ("Predict: will a wooden block sink or float?",
               "float", ["sink"]),
              ("Predict: will a grape sink or float?",
               "sink", ["float"])]
        for prompt, ans, dis in qs[:need[1]]:
            mc("experiments", 1, prompt, ans, dis, *A)
    if need[2]:
        qs = [("Predict: red mixed with yellow makes...?",
               "orange", ["green", "purple"]),
              ("Predict: blue mixed with yellow makes...?",
               "green", ["orange", "purple"]),
              ("Predict: red mixed with blue makes...?",
               "purple", ["orange", "green"]),
              ("Predict: yellow mixed with blue makes...?",
               "green", ["orange", "purple"])]
        for prompt, ans, dis in qs[:need[2]]:
            mc("experiments", 2, prompt, ans, dis, *A)
    if need[3]:
        qs = [("What melts an ice cube fastest?",
               "warm sunshine", ["a shady spot", "the freezer"]),
              ("What melts butter fastest?",
               "a warm pan", ["a cold plate", "the freezer"]),
              ("What melts a snowball fastest?",
               "warm hands", ["cold snow", "a shady spot"]),
              ("What melts chocolate fastest?",
               "warm hands", ["a cold table", "the fridge"])]
        for prompt, ans, dis in qs[:need[3]]:
            mc("experiments", 3, prompt, ans, dis, *A)
    if need[4]:
        qs = [("A toy car rolls farther down a ___ ramp.",
               "steep", ["flat", "bumpy"]),
              ("A ball rolls fastest down a ___ slide.",
               "smooth", ["bumpy", "flat"]),
              ("A toy boat floats best in ___ water.",
               "calm", ["wavy", "frozen"]),
              ("A paper plane flies farther with ___ wings.",
               "wide", ["tiny", "wet"])]
        for prompt, ans, dis in qs[:need[4]]:
            mc("experiments", 4, prompt, ans, dis, *A)
    if need[5]:
        qs = [("For a fair test, change ___ thing(s) at a time.",
               "one", ["two", "every"]),
              ("Two plants. One gets water, one does not. What are we testing?",
               "if water helps plants grow",
               ["which plant is prettier", "how fast snails move"]),
              ("Two ice cubes. One in sun, one in shade. What are we testing?",
               "if sunshine melts ice faster",
               ["which cube is colder", "how ice tastes"]),
              ("Two seeds. One in light, one in dark. What are we testing?",
               "if light helps seeds grow",
               ["which seed is bigger", "how seeds taste"])]
        for prompt, ans, dis in qs[:need[5]]:
            mc("experiments", 5, prompt, ans, dis, *A)


# ==========================================================================
# MUSIC
# ==========================================================================
def b_rhythm(need):
    A = AGES["rhythm"]
    if need[1]:
        scripts = ["Clap a steady beat.", "Stomp a steady beat.", "Pat your knees to the beat.",
                   "Tap the table to the beat."]
        for script in scripts[:need[1]]:
            verb = script.split()[0]
            add("rhythm", 1, "listen_repeat",
                f"{verb.capitalize()} along to the beat: boom, boom, boom! Tap when done.",
                {"script": script}, {}, *A)
    if need[2]:
        pats = ["ta, ta", "ti-ti, ta", "ta, ti-ti", "clap, clap"]
        for pat in pats[:need[2]]:
            add("rhythm", 2, "listen_repeat",
                f"Copy the pattern: {pat}. Clap it back! Tap when done.",
                {"script": f"Clap back: {pat}."}, {}, *A,
                narration=f"Copy the clapping pattern: {pat}.")
    if need[3]:
        pats = ["ta, ta, ti-ti, ta", "ti-ti, ta, ta, ti-ti", "ta, ti-ti, ta, ta"]
        n_lr = min(need[3], 3)
        for pat in pats[:n_lr]:
            add("rhythm", 3, "listen_repeat",
                f"Copy the four-beat pattern: {pat}. Tap when done.",
                {"script": f"Clap back: {pat}."}, {}, *A)
        if need[3] > n_lr:
            add("rhythm", 3, "tap_count", "Clap 4 times, steady and strong.",
                {"objects": count_objects(4, "clap")}, {"count": 4}, *A)
    if need[4]:
        scripts = ["Clap: loud, soft, loud, soft.", "Stomp slow, then fast.",
                   "Clap: fast, fast, slow.", "Pat: soft, soft, LOUD!"]
        for script in scripts[:need[4]]:
            add("rhythm", 4, "listen_repeat",
                f"Copy it: {script} Tap when done.",
                {"script": script}, {}, *A)
    if need[5]:
        pats = ["ta, ta, ti-ti, ta, ta, ti-ti, ta",
                "ti-ti, ti-ti, ta, ta, ti-ti, ta, ta"]
        for pat in pats[:need[5]]:
            add("rhythm", 5, "listen_repeat",
                f"Copy the eight-beat: {pat}. Keep the beat!",
                {"script": "Clap back the eight-beat pattern."}, {}, *A)
        for n in [8, 6][:max(0, need[5] - len(pats))]:
            add("rhythm", 5, "tap_count", f"Clap {n} times and keep the beat going.",
                {"objects": count_objects(n, "clap")}, {"count": n}, *A)


def b_pitch(need):
    A = AGES["pitch"]
    if need[1]:
        pairs = [("A bird sings HIGH. A bear sings LOW. Which sound is high?",
                  "the bird's tweet", ["the bear's rumble", "the drum's boom"]),
                 ("A flute sounds HIGH. A tuba sounds LOW. Which sound is low?",
                  "the tuba's oom", ["the flute's twe", "the bell's ding"]),
                 ("A whistle is HIGH. A drum is LOW. Which sound is high?",
                  "the whistle", ["the drum", "the rumble"]),
                 ("A drum is LOW. A bell is HIGH. Which sound is high?",
                  "the bell", ["the drum", "the rumble"])]
        for prompt, ans, dis in pairs[:need[1]]:
            mc("pitch", 1, prompt, ans, dis, *A)
    if need[2]:
        notes = [("laaa", "Sing: laaa."), ("mmm", "Hum: mmm."),
                 ("ooo", "Sing: ooo."), ("wee", "Sing: wee.")]
        for note, script in notes[:need[2]]:
            add("pitch", 2, "listen_repeat",
                f"Sing one note: {note}! Tap when you sang it.",
                {"script": script}, {}, *A)
    if need[3]:
        scripts = ["Sing up, then down.", "Slide up like a siren, then back down.",
                   "Sing low to high to low.", "Whoosh up, whoosh down."]
        for script in scripts[:need[3]]:
            add("pitch", 3, "listen_repeat",
                f"Sing up like a slide whistle, then back down! Tap when done.",
                {"script": script}, {}, *A)
    if need[4]:
        scripts = ["Sing: low, high, low.", "Sing: high, low, high.",
                   "Sing: la, LA, la.", "Sing: do, MI, do."]
        for script in scripts[:need[4]]:
            add("pitch", 4, "listen_repeat",
                f"Sing three notes: low, HIGH, low. Tap when done.",
                {"script": script}, {}, *A)
    if need[5]:
        songs = [("do, do, sol, sol", "Sing: do, do, sol, sol."),
                 ("mi, mi, re, re", "Sing: mi, mi, re, re."),
                 ("sol, sol, la, la", "Sing: sol, sol, la, la."),
                 ("do, re, mi, re", "Sing: do, re, mi, re.")]
        for notes, script in songs[:need[5]]:
            add("pitch", 5, "listen_repeat",
                f"Echo the four-note song: {notes}. Tap when done.",
                {"script": script}, {}, *A)


def b_instruments(need):
    A = AGES["instruments"]
    if need[1]:
        taps = [("Tap the drum! Boom, boom!", "drum", ["flute", "bell"]),
                ("Tap the shaker! Shake, shake!", "shaker", ["piano", "drum"]),
                ("Tap the bell! Ding, ding!", "bell", ["drum", "flute"]),
                ("Tap the tambourine! Jingle, jingle!", "tambourine", ["violin", "drum"])]
        for prompt, ans, dis in taps[:need[1]]:
            tt("instruments", 1, prompt, ans, dis, *A)
    if need[2]:
        qs = [("Which instrument do you BLOW to play?",
               "flute", ["drum", "piano"]),
              ("Which instrument do you HIT to play?",
               "drum", ["violin", "flute"]),
              ("Which instrument do you SHAKE to play?",
               "maraca", ["piano", "flute"]),
              ("Which instrument do you STRUM to play?",
               "guitar", ["drum", "trumpet"])]
        for prompt, ans, dis in qs[:need[2]]:
            mc("instruments", 2, prompt, ans, dis, *A)
    if need[3]:
        groups = {"strings": ["violin", "guitar"], "drums": ["drum", "tambourine"],
                  "winds": ["flute", "trumpet"]}
        items = [{"id": a, "label": a} for aa in groups.values() for a in aa]
        rng.shuffle(items)
        prompts3 = ["Sort the instruments: strings, drums, or winds?",
                    "Tap each instrument into its family: strings, drums, or winds.",
                    "Which family does each instrument belong to? Sort them!",
                    "Strings, drums, or winds? Sort every instrument!"]
        for prompt in prompts3[:need[3]]:
            add("instruments", 3, "sort", prompt,
                {"items": list(items),
                 "groups": [{"id": g, "label": g} for g in groups]},
                {"groups": {g: sorted(v) for g, v in groups.items()}}, *A)
    if need[4]:
        qs = [("You SHAKE a ___ to make sound.",
               "maraca", ["piano", "violin"]),
              ("A violin sings when you move the ___ across its strings.",
               "bow", ["drumstick", "whistle"]),
              ("You STRUM a ___ to make sound.",
               "guitar", ["trumpet", "drum"]),
              ("You BLOW a ___ to make sound.",
               "trumpet", ["violin", "drum"])]
        for prompt, ans, dis in qs[:need[4]]:
            mc("instruments", 4, prompt, ans, dis, *A)
    if need[5]:
        qs = [("Which band is best for a loud parade?",
               "trumpet, drum, and cymbals",
               ["flute, violin, and harp", "piano, guitar, and recorder"]),
              ("Which instruments are best for a quiet lullaby?",
               "flute, violin, and harp",
               ["trumpet, drum, and cymbals", "electric guitar and drums"]),
              ("A string quartet has four ___ players.",
               "string", ["drum", "piano"]),
              ("An orchestra has many kinds of...?",
               "instruments playing together", ["singers only", "dancers only"])]
        for prompt, ans, dis in qs[:need[5]]:
            mc("instruments", 5, prompt, ans, dis, *A)


def b_dance(need):
    A = AGES["dance"]
    if need[1]:
        scripts = ["Dance, then freeze.", "Wiggle, then freeze.", "Hop, then freeze.",
                   "Spin, then freeze."]
        for script in scripts[:need[1]]:
            verb = script.split(",")[0]
            add("dance", 1, "listen_repeat",
                f"{verb}, {verb.lower()}... FREEZE! Tap when you froze.",
                {"script": script}, {}, *A)
    if need[2]:
        dances = ["jump, spin", "clap, stomp", "twirl, hop", "march, freeze"]
        for moves in dances[:need[2]]:
            add("dance", 2, "listen_repeat",
                f"Copy two moves: {moves}! Do it! Tap when done.",
                {"script": f"Copy: {moves}."}, {}, *A)
    if need[3]:
        scripts = ["Dance slow, then fast.", "Move like a turtle, then a bunny.",
                   "Sway slow, then shake fast.", "Float slow, then buzz fast."]
        for script in scripts[:need[3]]:
            add("dance", 3, "listen_repeat",
                f"{script} Tap when done.",
                {"script": script}, {}, *A)
    if need[4]:
        dances = ["jump, spin, clap, stomp", "twirl, hop, snap, freeze",
                  "march, clap, spin, bow", "stomp, stomp, clap, jump"]
        for moves in dances[:need[4]]:
            add("dance", 4, "listen_repeat",
                f"Copy four moves: {moves}! Tap when done.",
                {"script": f"Copy: {moves}."}, {}, *A)
    if need[5]:
        topics = ["a robot dance", "a jungle dance", "a snowflake dance", "a pirate dance"]
        for topic in topics[:need[5]]:
            add("dance", 5, "listen_repeat",
                f"Invent 4 moves for {topic} and teach them to someone! Tap when done.",
                {"script": f"Invent: {topic}."}, {}, *A)


# ==========================================================================
# FEELINGS & FOCUS
# ==========================================================================
def face_targets(correct, others):
    opts, cid = mc_options(correct, others)
    targets = []
    for o in opts:
        t = {"id": o["id"], "label": o["label"]}
        if o["id"] == cid:
            t["art"] = f"face_{o['label']}"
        targets.append(t)
    return targets, cid


def b_emotions(need):
    A = AGES["emotions"]
    if need[1]:
        for emo in ["happy", "sad"][:need[1]]:
            others = [e for e in ["happy", "sad"] if e != emo]
            targets, cid = face_targets(emo, others)
            add("emotions", 1, "tap_target", f"Tap the {emo} face.",
                {"targets": targets}, {"choice": cid}, *A)
        for _ in range(max(0, need[1] - 2)):
            targets, cid = face_targets("happy", ["sad"])
            add("emotions", 1, "tap_target", "Tap the happy face.",
                {"targets": targets}, {"choice": cid}, *A)
    if need[2]:
        for emo in ["mad", "scared", "surprised"][:need[2]]:
            others = rng.sample([e for e in EMOTION_FACES if e != emo], 2)
            targets, cid = face_targets(emo, others)
            add("emotions", 2, "tap_target", f"Tap the {emo} face.",
                {"targets": targets}, {"choice": cid}, *A)
        if need[2] > 3:
            targets, cid = face_targets("calm", ["mad", "scared"])
            add("emotions", 2, "tap_target", "Tap the calm face.",
                {"targets": targets}, {"choice": cid}, *A)
    if need[3]:
        for scene, emo in EMOTION_SCENES[:need[3]]:
            others = rng.sample([e for e in EMOTION_FACES if e != emo], 3)
            mc("emotions", 3, f"{scene} How do they feel?",
               emo, others, *A)
    if need[4]:
        qs = [("Your heart beats fast and your hands feel shaky. You might feel...?",
               "scared", ["sleepy", "silly"]),
              ("Your face feels hot and your hands make fists. You might feel...?",
               "mad", ["calm", "sleepy"]),
              ("Spilling a little water is a ___ feeling.",
               "small", ["huge", "forever"]),
              ("Losing your favorite toy is a ___ feeling.",
               "big", ["tiny", "silly"])]
        for prompt, ans, dis in qs[:need[4]]:
            mc("emotions", 4, prompt, ans, dis, *A)
    if need[5]:
        qs = [("First day of school: excited AND a little scared. Those are...?",
               "mixed feelings", ["no feelings", "bad manners"]),
              ("You feel happy AND sad when grandma leaves. Those are...?",
               "mixed feelings", ["silly feelings", "no feelings"]),
              ("Nervous-excited means ___.",
               "a little scared and a little excited",
               ["very angry", "super sleepy"]),
              ("You can feel two feelings ___ .",
               "at the same time", ["never", "only at night"])]
        for prompt, ans, dis in qs[:need[5]]:
            mc("emotions", 5, prompt, ans, dis, *A)


def b_breathing(need):
    A = AGES["breathing"]
    if need[1]:
        scripts = [("Breathe with the bubble.", "bubble"),
                   ("Breathe with the growing flower.", "growing flower"),
                   ("Breathe with the rising balloon.", "rising balloon"),
                   ("Breathe with the sleepy cloud.", "sleepy cloud")]
        for script, thing in scripts[:need[1]]:
            add("breathing", 1, "listen_repeat",
                f"Watch the {thing} grow... now shrink. Breathe with it! Tap when done.",
                {"script": script}, {}, *A)
    if need[2]:
        friends = ["Tuno", "Bea", "Curio", "Luna"]
        for friend in friends[:need[2]]:
            add("breathing", 2, "listen_repeat",
                f"Breathe with {friend}: in... out... three slow breaths. Tap when done.",
                {"script": f"Three slow breaths with {friend}."}, {}, *A)
    if need[3]:
        scripts = ["Four-count breathing.", "Star breathing: trace and breathe.",
                   "Slow owl breathing.", "Sleepy bear breathing."]
        for script in scripts[:need[3]]:
            add("breathing", 3, "listen_repeat",
                "Four-count breathing, all by yourself: in 2 3 4, out 2 3 4. Tap when done.",
                {"script": script}, {}, *A,
                narration="Breathe in for four counts, out for four counts.")
    if need[4]:
        mc("breathing", 4, "You feel upset. What is a good first tool?",
           "belly breaths", ["yelling", "hiding"], *A)
        scripts = ["Three belly breaths.", "Belly breaths until steady.",
                   "Slow breaths like sleeping lions."]
        for script in scripts[:max(0, need[4] - 1)]:
            add("breathing", 4, "listen_repeat",
                "You feel wobbly. Do 3 belly breaths to feel steady. Tap when calm.",
                {"script": script}, {}, *A)
    if need[5]:
        mc("breathing", 5, "When is a good time to use breathing?",
           "anytime you need it", ["never", "only at bedtime"], *A)
        scripts = ["Teach slow breathing.", "Show a friend the bubble breath.",
                   "Lead three breaths for your family."]
        for script in scripts[:max(0, need[5] - 1)]:
            add("breathing", 5, "listen_repeat",
                "Teach your stuffed animal to breathe slowly. Tap when you taught it.",
                {"script": script}, {}, *A)


def b_calm_down(need):
    A = AGES["calm_down"]
    if need[1]:
        scripts = ["Rest on the calm cloud.", "Rest in the cozy cave.",
                   "Rest under the soft blanket.", "Rest by the quiet pond."]
        for script in scripts[:need[1]]:
            place = script.split("the ")[1].rstrip(".")
            add("calm_down", 1, "listen_repeat",
                f"Visit {place}. Rest here as long as you like. Tap when ready.",
                {"script": script}, {}, *A)
    if need[2]:
        tools = [("belly breaths", ["stomping", "yelling"]),
                 ("a tight squeeze", ["throwing toys", "screaming"]),
                 ("counting to ten", ["hitting", "running away"]),
                 ("a sip of water", ["yelling", "hiding"])]
        for tool, dis in tools[:need[2]]:
            mc("calm_down", 2, "You feel mad. Which calm tool helps?",
               tool, dis, *A)
    if need[3]:
        qs = [("You lost the game and feel mad. First name it: 'I feel mad.' Then pick a tool.",
               "say it, then belly breaths",
               ["say nothing and stomp", "yell at the game"]),
              ("Your tower fell and you feel mad. First name it: 'I feel mad.' Then pick a tool.",
               "say it, then count to ten",
               ["throw the blocks", "quit forever"]),
              ("It is raining and you feel sad. First name it: 'I feel sad.' Then pick a tool.",
               "say it, then rest on the calm cloud",
               ["cry all day", "hide the rain"]),
              ("You feel left out and sad. First name it: 'I feel sad.' Then pick a tool.",
               "say it, then ask to join in",
               ["cry alone", "push in"])]
        for prompt, ans, dis in qs[:need[3]]:
            mc("calm_down", 3, prompt, ans, dis, *A,
               narration="Name the feeling, then pick a calm tool.")
    if need[4]:
        scripts = ["Three slow breaths, alone.", "Count to ten, slowly.",
                   "Squeeze and let go.", "Belly breaths, no help."]
        for script in scripts[:need[4]]:
            add("calm_down", 4, "listen_repeat",
                "Calm yourself down, no help this time. Tap when calm.",
                {"script": script}, {}, *A)
    if need[5]:
        qs = [("Your friend is crying. You can help by...?",
               "sitting with them and breathing together",
               ["telling them to stop", "running away"]),
              ("Your friend lost the game and is mad. A good friend...?",
               "says: let us take belly breaths",
               ["laughs at them", "takes their toy"]),
              ("Someone is scared of the dark. You can...?",
               "sit with them until they feel safe",
               ["leave them alone", "make scary noises"]),
              ("Your friend is scared of loud thunder. You can...?",
               "hold their hand and breathe together",
               ["laugh", "cover your ears and run"])]
        for prompt, ans, dis in qs[:need[5]]:
            mc("calm_down", 5, prompt, ans, dis, *A)


def b_attention(need):
    A = AGES["attention"]
    if need[1]:
        scripts = ["Watch the firefly for ten seconds.", "Watch the drifting cloud.",
                   "Watch the floating bubble.", "Watch the swaying flower."]
        for script in scripts[:need[1]]:
            thing = script.split("the ")[1].split(" for")[0].split(".")[0]
            add("attention", 1, "listen_repeat",
                f"Watch the {thing}. Follow it with your eyes. Tap when done.",
                {"script": script}, {}, *A)
    if need[2]:
        hides = [("Find the hidden star!", "star", ["moon", "cloud"]),
                 ("Find the hidden moon!", "moon", ["star", "sun"]),
                 ("Find the hidden fish!", "fish", ["crab", "shell"]),
                 ("Find the hidden bird!", "bird", ["plane", "kite"])]
        for prompt, ans, dis in hides[:need[2]]:
            tt("attention", 2, prompt, ans, dis, *A)
    if need[3]:
        scripts = ["Listen for the bell among the sounds.",
                   "Listen for the drum among the sounds.",
                   "Listen for the bird among the sounds.",
                   "Listen for the whistle among the sounds."]
        for script in scripts[:need[3]]:
            sound = script.split("the ")[1].split(" among")[0]
            add("attention", 3, "listen_repeat",
                f"Listen close: when you hear the {sound}, tap. Tap when you heard it.",
                {"script": script}, {}, *A)
    if need[4]:
        # Rule-switch: alternate color-sort and shape-sort rounds, fresh
        # shuffle and fresh wording each round.
        rounds = [
            ({"red": ["red circle", "red square"],
              "blue": ["blue circle", "blue square"]},
             "New rule: sort by COLOR."),
            ({"circle": ["red circle", "blue circle"],
              "square": ["red square", "blue square"]},
             "The rule SWITCHED! Now sort by SHAPE."),
            ({"green": ["green triangle", "green star"],
              "yellow": ["yellow triangle", "yellow star"]},
             "New rule again: sort by COLOR."),
            ({"triangle": ["green triangle", "yellow triangle"],
              "star": ["green star", "yellow star"]},
             "The rule SWITCHED again! Now sort by SHAPE."),
        ]
        for groups, prompt in rounds[:need[4]]:
            labels = [lbl for vs in groups.values() for lbl in vs]
            order = shuffled(list(range(len(labels))))
            items = [{"id": f"a{i}", "label": labels[i]} for i in order]
            ans = {"groups": {
                g: sorted(f"a{i}" for i, lbl in enumerate(labels) if lbl in vs)
                for g, vs in groups.items()}}
            add("attention", 4, "sort", prompt,
                {"items": list(items),
                 "groups": [{"id": g, "label": g} for g in groups]},
                ans, *A,
                narration=prompt)
    if need[5]:
        focus = [("Focus game: count the stars while the music plays. Tap when done.",
                  "Count stars with distractions."),
                 ("Focus game: count the claps while the dog barks. Tap when done.",
                  "Count claps with distractions."),
                 ("Focus game: watch the green light and ignore the red ones. Tap when done.",
                  "Watch green, ignore red.")]
        for prompt, script in focus[:max(0, need[5] - 1)]:
            add("attention", 5, "listen_repeat", prompt,
                {"script": script}, {}, *A)
        if need[5] >= 1:
            tt("attention", 5, "Tap ONLY the red fish!",
               "red fish", ["blue fish", "red crab"], *A)


# ==========================================================================
# FOOTER: compute need, build, validate, emit SQL + JSON
# ==========================================================================
import json as _json
import os as _os

TARGET_PER_PAIR = 4

_BUILDERS = {
    "alphabet": b_alphabet, "letter_sounds": b_letter_sounds, "blending": b_blending,
    "sight_words": b_sight_words, "sentences": b_sentences, "stories": b_stories,
    "trace_letters": b_trace_letters, "build_words": b_build_words,
    "write_sentences": b_write_sentences,
    "count": b_count, "cardinality": b_cardinality, "compare_order": b_compare_order,
    "add": b_add, "subtract": b_subtract, "place_value": b_place_value,
    "shapes_patterns": b_shapes_patterns, "fractions": b_fractions,
    "brush_control": b_brush_control, "coloring": b_coloring,
    "shape_drawing": b_shape_drawing, "scene_composition": b_scene_composition,
    "continents_oceans": b_continents_oceans, "landmarks": b_landmarks,
    "world_animals": b_world_animals, "map_skills": b_map_skills, "cultures": b_cultures,
    "sequencing": b_sequencing, "patterns_coding": b_patterns_coding,
    "loops": b_loops, "conditions": b_conditions, "debugging": b_debugging,
    "plants": b_plants, "animals_habitats": b_animals_habitats, "weather": b_weather,
    "human_body": b_human_body, "experiments": b_experiments,
    "rhythm": b_rhythm, "pitch": b_pitch, "instruments": b_instruments, "dance": b_dance,
    "emotions": b_emotions, "breathing": b_breathing, "calm_down": b_calm_down,
    "attention": b_attention,
}


def _load_existing() -> dict:
    here = _os.path.dirname(_os.path.abspath(__file__))
    with open(_os.path.join(here, "existing_coverage.json")) as f:
        snap = _json.load(f)
    return snap.get("by_code", {})


def _compute_need(existing: dict) -> dict[str, dict[int, int]]:
    need: dict[str, dict[int, int]] = {}
    for skill, builder in _BUILDERS.items():
        have = existing.get(skill, {})
        need[skill] = {lvl: max(0, TARGET_PER_PAIR - int(have.get(str(lvl), have.get(lvl, 0))))
                       for lvl in range(1, 6)}
    return need


_EMOJI_RE = None

def _validate() -> list[str]:
    import re
    errors: list[str] = []
    emoji_re = re.compile(
        "[\U0001F000-\U0001FAFF\u2600-\u27BF\u2B00-\u2BFF\uFE0F]")
    seen_prompts: dict[tuple[str, int], set[str]] = {}
    for i, a in enumerate(ACTS):
        tag = f"ACTS[{i}] {a['skill']}/L{a['level']} {a['kind']}"
        # skill/level/kind/points
        if a["skill"] not in _BUILDERS:
            errors.append(f"{tag}: unknown skill {a['skill']}")
        if not (1 <= a["level"] <= 5):
            errors.append(f"{tag}: bad level {a['level']}")
        if a["kind"] not in KINDS:
            errors.append(f"{tag}: bad kind {a['kind']}")
        if not (1 <= a["points"] <= 100):
            errors.append(f"{tag}: bad points {a['points']}")
        if a["min_age_band"] not in ("3-4", "5-6", "7-8") or a["max_age_band"] not in ("3-4", "5-6", "7-8"):
            errors.append(f"{tag}: bad age bands {a['min_age_band']}/{a['max_age_band']}")
        if not a["prompt_text"] or not a["prompt_text"].strip():
            errors.append(f"{tag}: empty prompt")
        # no emoji on child-facing text
        for field in ("prompt_text",):
            if emoji_re.search(a[field]):
                errors.append(f"{tag}: emoji in {field}")
        for label_src in (a["card"].get("options", []), a["card"].get("targets", []),
                          a["card"].get("items", [])):
            for o in label_src:
                if emoji_re.search(str(o.get("label", ""))):
                    errors.append(f"{tag}: emoji in card label {o.get('label')!r}")
        # narration present
        if not a["card"].get("narration"):
            errors.append(f"{tag}: missing narration")
        # exact-duplicate activities per (skill, level): same prompt AND same
        # card AND same answer. Repeated drill instructions with different
        # content (different shuffle, different options) are legitimate.
        key = (a["skill"], a["level"])
        seen_prompts.setdefault(key, set())
        triple = (a["prompt_text"], _json.dumps(a["card"], sort_keys=True),
                  _json.dumps(a["answer"], sort_keys=True))
        if triple in seen_prompts[key]:
            errors.append(f"{tag}: exact duplicate activity {a['prompt_text']!r}")
        seen_prompts[key].add(triple)

        card, ans, kind = a["card"], a["answer"], a["kind"]
        if kind in ("multiple_choice", "tap_target"):
            opts = card.get("options", []) if kind == "multiple_choice" else card.get("targets", [])
            ids = {o["id"] for o in opts}
            if ans.get("choice") not in ids:
                errors.append(f"{tag}: answer choice {ans.get('choice')!r} not in options {sorted(ids)}")
            if len(ids) != len(opts):
                errors.append(f"{tag}: duplicate option ids")
            labels = [o["label"] for o in opts]
            if len(set(labels)) != len(labels):
                errors.append(f"{tag}: duplicate option labels {labels}")
        elif kind == "tap_count":
            if not isinstance(ans.get("count"), int) or ans["count"] < 1:
                errors.append(f"{tag}: bad tap_count answer {ans}")
            objs = card.get("objects", [])
            if objs and len(objs) != ans["count"]:
                errors.append(f"{tag}: {len(objs)} objects but count={ans['count']}")
        elif kind == "sequence":
            items = card.get("items", [])
            ids = [o["id"] for o in items]
            if sorted(ids) != sorted(ans.get("sequence", [])):
                errors.append(f"{tag}: sequence answer mismatch ids={ids} ans={ans.get('sequence')}")
            if len(set(ids)) != len(ids):
                errors.append(f"{tag}: duplicate sequence item ids")
            if ids == list(ans.get("sequence", [])):
                errors.append(f"{tag}: display order already equals answer order (trivially solved)")
        elif kind == "sort":
            items = card.get("items", [])
            iids = {o["id"] for o in items}
            gans = ans.get("groups", {})
            flat = [x for vs in gans.values() for x in vs]
            if sorted(flat) != sorted(iids):
                errors.append(f"{tag}: sort answer does not partition items")
            if len(flat) != len(set(flat)):
                errors.append(f"{tag}: sort answer has duplicate item ids")
            for g, vs in gans.items():
                if list(vs) != sorted(vs):
                    errors.append(f"{tag}: sort group {g!r} not sorted {vs}")
        elif kind == "trace":
            mcov = ans.get("min_coverage")
            if not isinstance(mcov, (int, float)) or not (0 < mcov <= 1):
                errors.append(f"{tag}: bad min_coverage {mcov}")
        elif kind == "listen_repeat":
            if ans != {}:
                errors.append(f"{tag}: listen_repeat answer should be empty, got {ans}")
            if not card.get("script"):
                errors.append(f"{tag}: listen_repeat missing script")
    return errors


def _emit_sql(path: str) -> None:
    lines = [
        "-- Sky Phase 2 activity bank seed. Generated by supabase/seed_generators/bank_phase2.py",
        "-- Idempotent on full activity identity (skill_id, prompt_text, card, answer):",
        "-- the same prompt with different content is a distinct activity.",
        "-- Run AFTER supabase/seed.sql.",
        "",
    ]
    for a in ACTS:
        card = _json.dumps(a["card"], ensure_ascii=False).replace("'", "''")
        answer = _json.dumps(a["answer"], ensure_ascii=False).replace("'", "''")
        prompt = a["prompt_text"].replace("'", "''")
        lines.append(
            "INSERT INTO public.activities "
            "(skill_id, level, kind, prompt_text, card, answer, points, min_age_band, max_age_band)"
        )
        lines.append(
            f"SELECT s.id, {a['level']}, '{a['kind']}', '{prompt}', "
            f"'{card}'::jsonb, '{answer}'::jsonb, {a['points']}, "
            f"'{a['min_age_band']}', '{a['max_age_band']}'"
        )
        lines.append(f"FROM public.skills s WHERE s.code = '{a['skill']}'")
        lines.append(
            "AND NOT EXISTS (SELECT 1 FROM public.activities x "
            "WHERE x.skill_id = s.id "
            f"AND x.prompt_text = '{prompt}' "
            f"AND x.card = '{card}'::jsonb "
            f"AND x.answer = '{answer}'::jsonb);"
        )
        lines.append("")
    with open(path, "w") as f:
        f.write("\n".join(lines))


def _emit_json(path: str, need: dict, existing: dict) -> None:
    with open(path, "w") as f:
        _json.dump({
            "generated_at": "2026-09-25",
            "target_per_pair": TARGET_PER_PAIR,
            "activity_count": len(ACTS),
            "need": {s: {str(k): v for k, v in lv.items()} for s, lv in need.items()},
            "activities": ACTS,
        }, f, ensure_ascii=False, indent=1)


def main() -> None:
    existing = _load_existing()
    need = _compute_need(existing)
    total_need = sum(v for lv in need.values() for v in lv.values())
    print(f"need total: {total_need} activities across {len(need)} skills")
    for skill, builder in _BUILDERS.items():
        builder(need[skill])
    print(f"generated: {len(ACTS)} activities")
    errors = _validate()
    if errors:
        print(f"VALIDATION FAILED: {len(errors)} errors")
        for e in errors[:60]:
            print(" -", e)
        raise SystemExit(1)
    # coverage check: every pair should reach target
    made: dict[tuple[str, int], int] = {}
    for a in ACTS:
        made[(a["skill"], a["level"])] = made.get((a["skill"], a["level"]), 0) + 1
    short = []
    for skill in _BUILDERS:
        for lvl in range(1, 6):
            have = int(existing.get(skill, {}).get(str(lvl), 0))
            if have + made.get((skill, lvl), 0) < TARGET_PER_PAIR:
                short.append((skill, lvl, have, made.get((skill, lvl), 0)))
    if short:
        print(f"COVERAGE SHORTFALL: {len(short)} pairs below target")
        for s in short:
            print(" -", s)
        raise SystemExit(1)
    here = _os.path.dirname(_os.path.abspath(__file__))
    out_sql = _os.path.join(here, "..", "seed_phase2.sql")
    out_json = _os.path.join(here, "..", "seed_phase2.json")
    _emit_sql(out_sql)
    _emit_json(out_json, need, existing)
    print(f"wrote {out_sql} and {out_json}")


if __name__ == "__main__":
    main()
