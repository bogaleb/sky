#!/usr/bin/env python3
"""Sky Phase 3 — Writing content module (Inkwell Isle).

Host: Captain Curio the fox, adventurous and encouraging.
Story friends: Quill the parrot (Curio's first mate), the Inkwell sprites
(tiny ink creatures who EAT letters), Pip the mouse, and Wren the traveling
bird (message bottles).

Skills:
  trace_letters  — L1 traces lines/curves  -> L5 traces whole words smoothly
  build_words    — L1 builds CVC words      -> L5 builds multisyllable words
  write_sentences — L1 "I am" patterns     -> L5 full sentences, capitals +
                                              punctuation

Exactly 4 activities per level per skill (3 x 5 x 4 = 60).
"""
from core import mc, tt, tc, seq, sort, trace, listen, AGES

TL = "trace_letters"
BW = "build_words"
WS = "write_sentences"


# ---------------------------------------------------------------------------
# trace_letters — the Signpost Saga
# ---------------------------------------------------------------------------
def _trace_letters() -> None:
    lo, hi = AGES[TL]

    # L1 — Welcome to Inkwell Isle: lines, curves, and first letters.
    trace(TL, 1,
          "Ahoy, storyteller! Welcome to Inkwell Isle! The sea is wavy today "
          "— trace the wavy line with your finger!",
          "a wavy line", lo, hi)
    trace(TL, 1,
          "Look! Quill drew the sun in the sand. Can you trace the big round "
          "circle to finish his sunrise?",
          "a big round circle", lo, hi)
    tt(TL, 1,
       "Quill hid the letter C somewhere on our treasure map. Can you spot "
       "it and tap it?",
       "C", ["O", "G", "E"], lo, hi,
       narration="Four letters are hiding on the map: O, C, G, and E. "
                 "Tap the letter C.")
    tc(TL, 1,
       "Silly sprites! They spilled ink dots all over the Captain's Log. "
       "Can you count the ink dots for me?",
       5, "ink dots", lo, hi)

    # L2 — The plot thickens: the sprites are eating the signpost!
    trace(TL, 2,
          "Ahoy! The sprites nibbled the M off our signpost! Quill needs it "
          "back — trace the BIG letter M!",
          "uppercase M", lo, hi)
    trace(TL, 2,
          "Those hungry sprites struck again! The B is gone from BOTTLE BAY. "
          "Trace a bold B to fix the sign!",
          "uppercase B", lo, hi)
    mc(TL, 2,
       "Pip's cheese sign says CHE_SE now — the sprites ate a letter! Which "
       "letter is missing?",
       "E", ["A", "I", "O"], lo, hi,
       narration="The sign says C H blank S E. Which letter is missing: "
                 "E, A, I, or O?")
    seq(TL, 2,
        "Quill's letter flags got all tangled! Put the letters in ABC order "
        "to fix them!",
        ["A", "B", "C"], lo, hi)

    # L3 — Help a friend: notes for Pip and Wren.
    trace(TL, 3,
          "Pip the mouse wants a note that says 'soup'! Can you trace the "
          "little letter s to start his word?",
          "the letter s", lo, hi)
    trace(TL, 3,
          "Wren needs a message before she flies! Trace the letter e so "
          "Quill can finish writing 'hello'.",
          "the letter e", lo, hi)
    mc(TL, 3,
       "The sprites mixed up the letters on Pip's note! Which one is the "
       "letter b?",
       "b", ["d", "p", "q"], lo, hi,
       narration="Four letters on the note: d, b, p, and q. Which one is "
                 "the letter b?")
    tt(TL, 3,
       "Quill dropped his tiny letters in an ink puddle! Can you tap the "
       "little letter a hiding in the ink?",
       "a", ["e", "o", "c"], lo, hi,
       narration="Four letters in the ink puddle: e, a, o, and c. Tap the "
                 "little letter a.")

    # L4 — The mystery: a smudged bottle and a jumbled pile.
    trace(TL, 4,
          "A mystery bottle washed ashore — but the S on its seal is "
          "smudged! Trace the twisty S to open it!",
          "uppercase S", lo, hi)
    trace(TL, 4,
          "The mystery note has a zigzag word! Trace the buzzy letter z to "
          "read the secret clue!",
          "the letter z", lo, hi)
    sort(TL, 4,
         "The sprites dumped ALL the letters in one inky pile! Can you sort "
         "the BIG letters from the little letters?",
         {"BIG letters": ["A", "B", "C"],
          "little letters": ["a", "b", "c"]}, lo, hi)
    listen(TL, 4,
           "Quill squawks letter names to scare the sprites away! Squawk "
           "the letter B with him — loud and proud!",
           "B", lo, hi)

    # L5 — Master quest: rewrite the whole sign, word by word.
    trace(TL, 5,
          "Master quest, storyteller! The whole WELCOME sign faded in the "
          "sun! Trace the word SUN to bring it back!",
          "the word SUN", lo, hi)
    trace(TL, 5,
          "The sprites ate the word SHIP right off our sail! Trace it "
          "smoothly, all in one go, Captain!",
          "the word SHIP", lo, hi)
    mc(TL, 5,
       "Quill traced a word in the sand, but a wave washed half away! Which "
       "word was it?",
       "SHIP", ["SHOP", "CHIP", "SHEEP"], lo, hi,
       narration="Was the washed-away word SHIP, SHOP, CHIP, or SHEEP?")
    tt(TL, 5,
       "Three bottles washed up on the beach! Tap the bottle with the word "
       "SUN.",
       "SUN", ["RUN", "FUN", "MUD"], lo, hi,
       narration="Three bottles say RUN, SUN, and FUN. Tap the bottle that "
                 "says SUN.")


# ---------------------------------------------------------------------------
# build_words — Quill's message workshop
# ---------------------------------------------------------------------------
def _build_words() -> None:
    lo, hi = AGES[BW]

    # L1 — Welcome: first CVC words for Quill's messages.
    seq(BW, 1,
        "Ahoy, storyteller! Quill wants to label his pet crab! Put the "
        "letters in order to build the word CAT.",
        ["C", "A", "T"], lo, hi)
    seq(BW, 1,
        "The sun is shining on Inkwell Isle! Build the word SUN so Quill "
        "can write it in the Captain's Log.",
        ["S", "U", "N"], lo, hi)
    mc(BW, 1,
       "Pip's cheese sign says CHE_SE — a sprite took a bite! Which letter "
       "is missing?",
       "E", ["A", "I", "O"], lo, hi,
       narration="The sign says C H blank S E. Which letter is missing: "
                 "E, A, I, or O?")
    tt(BW, 1,
       "Quill is writing the word MAP but dropped a letter! Tap the letter "
       "that finishes M_P.",
       "A", ["E", "I", "O"], lo, hi,
       narration="The word is M blank P. Tap the letter that finishes it: "
                 "A, E, I, or O?")

    # L2 — The plot thickens: the sprites are stealing letter PAIRS.
    seq(BW, 2,
        "The sprites stole the SH off our sail! Put the letters in order to "
        "rebuild the word SHIP.",
        ["S", "H", "I", "P"], lo, hi)
    mc(BW, 2,
       "Quill's note says _IP — the beginning blew away! Which letters "
       "start the word SHIP?",
       "SH", ["CH", "WH", "TH"], lo, hi,
       narration="The note says blank I P. Which letters start the word: "
                 "SH, CH, WH, or TH?")
    tt(BW, 2,
       "Three message flags are flapping! Tap the flag that says FISH.",
       "FISH", ["DISH", "WISH", "FIST"], lo, hi,
       narration="Three flags say DISH, FISH, and WISH. Tap the flag that "
                 "says FISH.")
    sort(BW, 2,
         "The sprites mixed SHIP's letters with extras! Sort the letters "
         "that spell SHIP from the extra letters.",
         {"SHIP letters": ["S", "H", "I", "P"],
          "extra letters": ["A", "T", "E"]}, lo, hi)

    # L3 — Help a friend: longer words for Wren and Pip.
    seq(BW, 3,
        "Wren spotted a whale from the sky! Help Quill build the word "
        "WHALE for the Captain's Log.",
        ["W", "H", "A", "L", "E"], lo, hi)
    mc(BW, 3,
       "Pip's new sign says THU_B — a sprite is sitting on a letter! Which "
       "letter is missing?",
       "M", ["N", "B", "P"], lo, hi,
       narration="The sign says T H U blank. Which letter is missing: "
                 "M, N, B, or P?")
    listen(BW, 3,
           "Quill is dictating a pirate message! Say the word WHALE with "
           "him — stretch it out nice and long!",
           "whale", lo, hi)
    tc(BW, 3,
       "Quill wants to count before he writes! How many letters are in the "
       "word WHALE? Count them with him!",
       5, "letters", lo, hi)

    # L4 — The mystery: jumbled letters from an unknown sender.
    seq(BW, 4,
        "A mystery bottle holds jumbled letters! Put them in order to read "
        "the secret word.",
        ["S", "T", "A", "R"], lo, hi)
    mc(BW, 4,
       "The letters T, R, A, P washed up on deck. Which word did the waves "
       "spell?",
       "TRAP", ["PART", "RAPT", "TARP"], lo, hi,
       narration="The letters are T, R, A, P. Which word do they spell: "
                 "TRAP, PART, RAPT, or TARP?")
    sort(BW, 4,
         "Quill dropped two words' letters in the ink! Sort the letters "
         "into CAT and DOG.",
         {"CAT letters": ["C", "A", "T"],
          "DOG letters": ["D", "O", "G"]}, lo, hi)
    listen(BW, 4,
           "The mystery sender left a voice note! Listen close, then say "
           "the secret word with Quill: STAR.",
           "star", lo, hi)

    # L5 — Master quest: big multisyllable words, the child leads.
    seq(BW, 5,
        "Master quest! A tiger is painted on our new sail! Build the big "
        "word TIGER all by yourself!",
        ["T", "I", "G", "E", "R"], lo, hi)
    mc(BW, 5,
       "The word BUTTERFLY lost its first part in a storm! Which part is "
       "missing?",
       "BUTTER", ["BITTER", "BATTER", "BETTER"], lo, hi,
       narration="The word is blank FLY. Which part is missing: BUTTER, "
                 "BITTER, BATTER, or BETTER?")
    listen(BW, 5,
           "Quill is writing the Captain's Log in his LOUDEST voice! Say "
           "the big word BUTTERFLY with him!",
           "butterfly", lo, hi)
    tt(BW, 5,
       "Three sails are up on the ship! Tap the sail that says TIGER.",
       "TIGER", ["LIGER", "TIGGER", "TIMER"], lo, hi,
       narration="Three sails say LIGER, TIGER, and TIMER. Tap the sail "
                 "that says TIGER.")


# ---------------------------------------------------------------------------
# write_sentences — the Captain's Log
# ---------------------------------------------------------------------------
def _write_sentences() -> None:
    lo, hi = AGES[WS]

    # L1 — Welcome: "I am" patterns with Quill.
    seq(WS, 1,
        "Ahoy, storyteller! Quill wants to introduce himself! Put the words "
        "in order: I — am — Quill.",
        ["I", "am", "Quill."], lo, hi)
    seq(WS, 1,
        "Now say it like a pirate captain! Put the words in order to write: "
        "I am brave.",
        ["I", "am", "brave."], lo, hi)
    mc(WS, 1,
       "Quill wrote some notes, but the sprites shuffled the words! Which "
       "sentence is written the right way?",
       "I am Quill.", ["Am I Quill.", "I am Quill", "i am quill."], lo, hi,
       narration="Which sentence is written the right way: I am Quill. "
                 "Am I Quill. I am Quill. or i am quill.?")
    listen(WS, 1,
           "Quill is practicing his introduction! Say it with him, loud "
           "and proud: I am Quill!",
           "I am Quill!", lo, hi)

    # L2 — The plot thickens: the sprites are nibbling capitals!
    mc(WS, 2,
       "The sprites nibbled the capital off Quill's note! Which sentence is "
       "written correctly?",
       "Sam is brave.", ["sam is brave.", "Sam is brave", "SAM IS BRAVE."],
       lo, hi,
       narration="Which sentence is written correctly: Sam is brave. "
                 "sam is brave. Sam is brave. or SAM IS BRAVE.?")
    seq(WS, 2,
        "Pip is SO hungry! Put the words in order so Quill can write: Pip "
        "likes cheese.",
        ["Pip", "likes", "cheese."], lo, hi)
    tt(WS, 2,
       "Uh oh — one word lost its capital letter! Which word should start "
       "BIG?",
       "sam", ["is", "brave", "fun"], lo, hi,
       narration="The sentence is: sam is brave and fun. Which word should "
                 "start with a big letter: sam, is, brave, or fun?")
    listen(WS, 2,
           "Quill is reading the Captain's Log out loud! Read this line "
           "with him: Sam is brave.",
           "Sam is brave.", lo, hi)

    # L3 — Help a friend: notes FOR Pip and Wren.
    seq(WS, 3,
        "Wren the traveling bird is leaving! Put the words in order to "
        "write her a goodbye note.",
        ["Wren", "flies", "far."], lo, hi)
    mc(WS, 3,
       "Pip asked for a thank-you note! Which one is written correctly?",
       "Thank you, Pip.", ["thank you, Pip.", "Thank you, Pip",
                           "Thank you pip."],
       lo, hi,
       narration="Which note is written correctly: Thank you, Pip. "
                 "thank you, Pip. Thank you, Pip. or Thank you pip.?")
    sort(WS, 3,
         "The sprites mixed up Quill's word cards! Sort the words that "
         "START a sentence from the middle words.",
         {"Start words": ["Sam", "Pip", "Wren"],
          "Middle words": ["is", "likes", "flies"]}, lo, hi)
    listen(WS, 3,
           "Pip LOVES your note! Read it to him with Quill: Thank you, Pip!",
           "Thank you, Pip!", lo, hi)

    # L4 — The mystery: a jumbled page from the Captain's Log.
    seq(WS, 4,
        "A mysterious page fell out of the Captain's Log! Put the words in "
        "order to read the clue.",
        ["The", "map", "is", "old."], lo, hi)
    mc(WS, 4,
       "Two log entries — but one is a sprite trick! Which entry is "
       "written correctly?",
       "We found gold.", ["we found gold.", "We found gold",
                          "We found Gold."],
       lo, hi,
       narration="Which entry is written correctly: We found gold. "
                 "we found gold. We found gold. or We found Gold.?")
    tc(WS, 4,
       "Quill's secret message is hiding something! Count the words in his "
       "clue: We found gold.",
       3, "words", lo, hi)
    listen(WS, 4,
           "Shout the secret clue with Quill so the whole crew can hear: "
           "We found gold!",
           "We found gold!", lo, hi)

    # L5 — Master quest: the child writes the log entry.
    seq(WS, 5,
        "Master quest, storyteller! Write the Captain's Log entry yourself! "
        "Put the words in order.",
        ["The", "crew", "is", "the", "best."], lo, hi)
    mc(WS, 5,
       "Which message is ready to send to Wren in her bottle?",
       "You fly far, Wren.",
       ["you fly far, Wren.", "You fly far, wren.", "You fly far, Wren"],
       lo, hi,
       narration="Which message is ready to send: You fly far, Wren. "
                 "you fly far, Wren. You fly far, wren. or You fly far, "
                 "Wren.?")
    listen(WS, 5,
           "Read your finished log entry out loud, Captain! The whole crew "
           "is listening: The crew is the best!",
           "The crew is the best!", lo, hi)
    tt(WS, 5,
       "Three notes for Wren — but only one is PERFECT! Tap the note that "
       "is written perfectly.",
       "Wren flies far.",
       ["wren flies far.", "Wren flies far", "Wren Flies Far."], lo, hi,
       narration="Three notes: Wren flies far. wren flies far. Wren flies "
                 "far. Wren Flies Far. Tap the perfect one.")


def build() -> None:
    """Register all 60 writing activities (3 skills x 5 levels x 4)."""
    _trace_letters()
    _build_words()
    _write_sentences()
