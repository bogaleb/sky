#!/usr/bin/env python3
"""Sky Phase 3 content core: shared helpers, word banks, validation.

Content modules (content/*.py) import from here. They never touch the
database; they describe activities, and bank_phase3.py validates + emits.
"""
import random

rng = random.Random(20260925)

KINDS = {"multiple_choice", "tap_target", "tap_count", "sequence",
         "sort", "trace", "listen_repeat"}
BANDS = ("3-4", "5-6", "7-8")
POINTS = {1: 10, 2: 15, 3: 15, 4: 20, 5: 25}

ACTS: list[dict] = []


def band_of(age: float) -> str:
    a = int(age // 1)
    return "3-4" if a <= 4 else "5-6" if a <= 6 else "7-8"


def bands(age_min: int, age_max: int, level: int) -> tuple[str, str]:
    lo = age_min + (level - 1) * (age_max - age_min) / 4
    return band_of(lo), band_of(age_max)


def add(skill: str, level: int, kind: str, prompt: str, card: dict,
        answer: dict, age_min: int, age_max: int,
        narration: str | None = None) -> None:
    """Register one activity. narration defaults to prompt."""
    assert kind in KINDS, kind
    assert 1 <= level <= 5, level
    c = dict(card)
    c["narration"] = narration or prompt
    mn, mx = bands(age_min, age_max, level)
    ACTS.append({
        "skill": skill, "level": level, "kind": kind,
        "prompt_text": prompt, "card": c, "answer": answer,
        "points": POINTS[level], "min_age_band": mn, "max_age_band": mx,
    })


def mc_options(correct_label: str, distractors: list[str]) -> tuple[list[dict], str]:
    """Shuffled 4-option list. Returns (options, correct_id)."""
    assert len(distractors) == 3, f"need exactly 3 distractors, got {distractors}"
    labels = [correct_label] + distractors
    ids = [f"o{i}" for i in range(len(labels))]
    order = list(range(len(labels)))
    rng.shuffle(order)
    options = [{"id": ids[i], "label": labels[i]} for i in order]
    return options, ids[0]


def mc(skill, level, prompt, correct, distractors, age_min, age_max,
       narration=None):
    """Story-framed multiple choice. distractors: 3 misconception-based."""
    options, cid = mc_options(correct, distractors)
    add(skill, level, "multiple_choice", prompt,
        {"options": options}, {"choice": cid}, age_min, age_max, narration)


def tt(skill, level, prompt, correct, distractors, age_min, age_max,
       narration=None, art=None):
    """tap_target: find-it-in-the-scene. 3 distractors."""
    assert len(distractors) == 3, f"need exactly 3 distractors, got {distractors}"
    options, cid = mc_options(correct, distractors)
    targets = []
    for o in options:
        t = {"id": o["id"], "label": o["label"]}
        if art and o["id"] == cid:
            t["art"] = art
        targets.append(t)
    add(skill, level, "tap_target", prompt,
        {"targets": targets}, {"choice": cid}, age_min, age_max, narration)


def tc(skill, level, prompt, count: int, thing: str, age_min, age_max,
       narration=None, art=None):
    """tap_count: count things in the story. answer.count = count."""
    assert count > 0
    card = {"thing": thing, "total": count}
    if art:
        card["art"] = art
    add(skill, level, "tap_count", prompt, card,
        {"count": count}, age_min, age_max, narration)


def seq(skill, level, prompt, ordered_labels: list[str], age_min, age_max,
        narration=None, item_prefix="s"):
    """sequence: put story items in order. ordered_labels = correct order."""
    assert len(ordered_labels) >= 3
    ids = [f"{item_prefix}{i}" for i in range(len(ordered_labels))]
    items = [{"id": i, "label": l} for i, l in zip(ids, ordered_labels)]
    items = shuffled(items)
    add(skill, level, "sequence", prompt,
        {"items": items}, {"sequence": ids}, age_min, age_max, narration)


def sort(skill, level, prompt, groups: dict[str, list[str]], age_min, age_max,
         narration=None):
    """sort: groups = {group_id: [labels]}. Items are shuffled for the child."""
    assert len(groups) >= 2
    items = []
    answer_groups: dict[str, list[str]] = {}
    for gi, (gname, labels) in enumerate(groups.items()):
        gid = f"g{gi}"
        iids = []
        for li, label in enumerate(labels):
            iid = f"{gid}i{li}"
            items.append({"id": iid, "label": label, "group": gname})
            iids.append(iid)
        answer_groups[gid] = iids
    items = shuffled(items)
    group_labels = [{"id": f"g{gi}", "label": gname}
                    for gi, gname in enumerate(groups.keys())]
    add(skill, level, "sort", prompt,
        {"items": items, "groups": group_labels},
        {"groups": answer_groups}, age_min, age_max, narration)


def trace(skill, level, prompt, trace_label: str, age_min, age_max,
          narration=None, min_coverage=0.6):
    """trace: draw for a character. trace_label describes the path."""
    add(skill, level, "trace", prompt,
        {"trace": trace_label}, {"min_coverage": min_coverage},
        age_min, age_max, narration)


def listen(skill, level, prompt, script: str, age_min, age_max, narration=None):
    """listen_repeat: say it with a character. script = what to say."""
    add(skill, level, "listen_repeat", prompt,
        {"script": script}, {}, age_min, age_max, narration)


def shuffled(items: list) -> list:
    items = list(items)
    rng.shuffle(items)
    return items


def take(pool: list, n: int) -> list:
    """n distinct items from pool, deterministic."""
    return shuffled(pool)[:n]


# ---------------------------------------------------------------------------
# skill age ranges (must match 20260924000200_taxonomy.sql)
# ---------------------------------------------------------------------------
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
    "emotions": (3, 7), "breathing": (3, 8), "calm_down": (3, 8),
    "attention": (4, 8),
}

# ---------------------------------------------------------------------------
# shared word / fact banks (hand-curated, from Phase 2)
# ---------------------------------------------------------------------------
UPPER = list("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
LOWER = list("abcdefghijklmnopqrstuvwxyz")

SIGHT = {
    1: ["I", "the", "and", "a", "to"],
    2: ["is", "you", "that", "it", "he", "was", "for", "on", "are", "as",
        "with", "his", "they", "at", "be", "this", "have", "from", "or", "one"],
    3: ["had", "by", "but", "not", "what", "all", "were", "we", "when", "your",
        "can", "said", "there", "use", "each", "which", "she", "do", "how",
        "their", "if", "will", "up", "other", "about"],
    4: ["out", "many", "then", "them", "these", "so", "some", "her", "would",
        "make", "like", "him", "into", "time", "has", "look", "two", "more",
        "write", "go", "see", "number", "no", "way", "could", "people", "my",
        "than", "first", "water", "been", "call", "who", "now", "find", "long",
        "down", "day", "did", "get"],
}
SIGHT[5] = SIGHT[4]

CVC_WORDS = ["cat", "dog", "sun", "pig", "bus", "hen", "fox", "cup", "map",
             "bed", "hat", "box"]
DIGRAPH_WORDS = ["ship", "fish", "chat", "thin", "shop", "chips", "whale",
                 "thumb", "sheep", "chick"]
SYLLABLE_WORDS = [("sun", "shine"), ("but", "ter", "fly"), ("ta", "ble"),
                  ("ap", "ple"), ("ti", "ger"), ("win", "dow")]
KID_NAMES = ["Mia", "Sam", "Leo", "Ana", "Max", "Eva"]

SOUND_LETTERS = {
    "M": ("moon", "mmm"), "S": ("sun", "sss"), "T": ("tiger", "tuh"),
    "B": ("ball", "buh"), "C": ("cat", "kuh"), "D": ("dog", "duh"),
    "F": ("fish", "fff"), "L": ("leaf", "lll"), "N": ("nest", "nnn"),
    "P": ("pig", "puh"), "R": ("rain", "rrr"), "H": ("hat", "huh"),
}
SHORT_VOWELS = [("a", "cat"), ("e", "bed"), ("i", "pig"), ("o", "hot"),
                ("u", "cup")]
DIGRAPHS = [("sh", "ship"), ("ch", "cheese"), ("th", "thumb"),
            ("wh", "whale")]

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
    ("Statue of Liberty", "New York", "the USA",
     "a giant statue holding a torch"),
    ("Great Wall", "Beijing", "China", "a very long wall"),
    ("Pyramids", "Giza", "Egypt", "huge triangle tombs"),
    ("Big Ben", "London", "England", "a famous clock tower"),
    ("Taj Mahal", "Agra", "India", "a white marble palace"),
]
HELLOS = [("Spanish", "hola"), ("French", "bonjour"),
          ("Japanese", "konnichiwa"), ("Chinese", "ni hao"),
          ("Hawaiian", "aloha"), ("Italian", "ciao")]
FESTIVALS = [("Diwali", "India", "the festival of lights"),
             ("Lunar New Year", "China", "dragon dances and red lanterns"),
             ("Carnival", "Brazil", "a giant street parade"),
             ("Day of the Dead", "Mexico", "families remember loved ones")]

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


# ---------------------------------------------------------------------------
# validation (same strictness as Phase 2)
# ---------------------------------------------------------------------------
def validate() -> list[str]:
    errors: list[str] = []
    seen: set[tuple] = set()
    for a in ACTS:
        key = (a["skill"], a["level"], a["prompt_text"])
        if key in seen:
            errors.append(f"duplicate prompt for {a['skill']} L{a['level']}: "
                          f"{a['prompt_text'][:60]}")
        seen.add(key)
        kind = a["kind"]
        card, answer = a["card"], a["answer"]
        if kind in ("multiple_choice", "tap_target"):
            opts = card.get("options", card.get("targets", []))
            ids = {o["id"] for o in opts}
            if answer.get("choice") not in ids:
                errors.append(f"{a['skill']}: answer.choice not in options")
            if len(opts) != 4:
                errors.append(f"{a['skill']}: expected 4 options, got "
                              f"{len(opts)}")
        elif kind == "tap_count":
            if not isinstance(answer.get("count"), int) or answer["count"] < 1:
                errors.append(f"{a['skill']}: bad tap_count answer")
        elif kind == "sequence":
            item_ids = {i["id"] for i in card.get("items", [])}
            if set(answer.get("sequence", [])) != item_ids:
                errors.append(f"{a['skill']}: sequence answer mismatch")
        elif kind == "sort":
            item_ids = {i["id"] for i in card.get("items", [])}
            grouped = [i for g in answer.get("groups", {}).values()
                       for i in g]
            if set(grouped) != item_ids or len(grouped) != len(item_ids):
                errors.append(f"{a['skill']}: sort groups don't partition")
        elif kind == "trace":
            mcov = answer.get("min_coverage", 0)
            if not (0 < mcov <= 1):
                errors.append(f"{a['skill']}: bad min_coverage")
        # prompt quality gates
        p = a["prompt_text"]
        if len(p) > 220:
            errors.append(f"{a['skill']}: prompt too long ({len(p)} chars)")
    # coverage: every skill x level needs >= 4 activities
    from collections import Counter
    counts = Counter((a["skill"], a["level"]) for a in ACTS)
    for skill in AGES:
        for level in range(1, 6):
            if counts[(skill, level)] < 4:
                errors.append(f"coverage: {skill} L{level} has "
                              f"{counts[(skill, level)]} < 4")
    return errors
