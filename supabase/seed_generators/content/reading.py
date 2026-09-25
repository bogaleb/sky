#!/usr/bin/env python3
"""Sky Phase 3 — READING content module.

Host: Luna the owl. Island: The Floating Library.
Story world: Luna's Floating Library, with Pip the mouse (learning to read,
loves cheese), Hoot the owlet (Luna's chick), and the magical Star-Books.
Recurring scenarios: shelving star-books in ABC order, Pip's cheese labels,
Hoot's bedtime stories, the Tumble Wind that scatters letters, and the
Story Repair Shop.

6 skills x 5 levels x 4 activities = 120 activities.
Level arcs: L1 welcome, L2 plot thickens, L3 help a friend, L4 mystery,
L5 master quest.
"""

from core import (
    mc, tt, tc, seq, sort, trace, listen,
    AGES,
)


# ---------------------------------------------------------------------------
# skill 1: alphabet — points to letters (L1) -> ABC A-Z fluently (L5)
# ---------------------------------------------------------------------------
def _alphabet() -> None:
    A = AGES["alphabet"]

    # L1 — welcome to the adventure
    tt("alphabet", 1,
       "Welcome to the Floating Library! Luna's star-books glow with letters. "
       "Can you tap the star-book with the letter B?",
       "B", ["D", "P", "A"], *A,
       narration="Welcome to the Floating Library! Tap the star-book with the letter B.")
    mc("alphabet", 1,
       "Pip the mouse is learning his letters. His name starts with P. "
       "Which of these letters is P?",
       "P", ["B", "D", "Q"], *A)
    tc("alphabet", 1,
       "Hoot the owlet stacked glowing letter blocks on the rug. "
       "How many letter blocks do you see?",
       4, "letter blocks", *A)
    trace("alphabet", 1,
          "Luna is writing Pip a welcome note. Trace the big letter P "
          "to start his name.",
          "P", *A)

    # L2 — the plot thickens (Tumble Wind scatters the shelves)
    seq("alphabet", 2,
        "Oh my! The Tumble Wind scattered Luna's star-books. She shelved L, "
        "then M. Put these back in ABC order.",
        ["L", "M", "N", "O"], *A)
    mc("alphabet", 2,
       "Pip was shelving books: A, B... then a gust took the next one! "
       "Which letter goes after B?",
       "C", ["D", "A", "E"], *A)
    tt("alphabet", 2,
       "The Tumble Wind blew a book right off the shelf! Find the star-book "
       "with the letter S, hiding among the clouds.",
       "S", ["Z", "C", "G"], *A,
       narration="Find the star-book with the letter S, hiding among the clouds.")
    listen("alphabet", 2,
           "Hoot is singing the ABCs and got stuck at K. Sing the next "
           "letters with him, nice and clear.",
           "L, M, N, O, P", *A)

    # L3 — help a friend (Pip's labels, Hoot's name card)
    mc("alphabet", 3,
       "Pip's cheese label letters slid all around: C, H, E, E, S, E. "
       "Which word do they spell?",
       "cheese", ["cheeses", "chease", "chese"], *A)
    seq("alphabet", 3,
        "Pip's cheese jars lost their ABC labels. Help him shelve the "
        "letters in ABC order.",
        ["C", "E", "E", "H", "S"], *A)
    trace("alphabet", 3,
          "Hoot wants a name card for his nest. Trace the letter H to "
          "start his name.",
          "H", *A)
    tt("alphabet", 3,
       "Luna's midnight storybook is marked with the letter M. Tap the "
       "star-book with the letter M.",
       "M", ["N", "W", "H"], *A,
       narration="Tap the star-book with the letter M.")

    # L4 — the mystery (letters vanish from the Story Repair Shop)
    mc("alphabet", 4,
       "Oh my! The Repair Shop shelf reads A, B, C, D, F. One letter "
       "vanished overnight. Which one?",
       "E", ["G", "C", "I"], *A)
    tt("alphabet", 4,
       "The missing letter left a trail of sparkles behind the ink pots! "
       "Tap the glowing letter hiding there.",
       "E", ["F", "B", "G"], *A,
       narration="Tap the glowing letter hiding behind the ink pots.")
    seq("alphabet", 4,
        "The repair owls found the lost letters scattered: Q, R, S, T, U. "
        "Line them up in ABC order.",
        ["Q", "R", "S", "T", "U"], *A)
    listen("alphabet", 4,
           "The shop bell rings when letters are named in order. Say these "
           "with Luna, slowly: P, Q, R, S.",
           "P, Q, R, S", *A)

    # L5 — master quest (you teach Hoot; fluency)
    listen("alphabet", 5,
           "You are the Master Librarian now! Teach Hoot the whole alphabet, "
           "nice and clear, from A to Z.",
           "A B C D E F G H I J K L M N O P Q R S T U V W X Y Z", *A)
    mc("alphabet", 5,
       "Hoot asks a tricky one: what is the very last letter of the alphabet?",
       "Z", ["Y", "X", "A"], *A)
    tc("alphabet", 5,
       "Luna lined up her fanciest star-books for your graduation. "
       "Count them all!",
       7, "star-books", *A)
    trace("alphabet", 5,
          "Sign the Master Librarian scroll! Trace the fancy letter Z, the "
          "last letter, for the last step.",
          "Z", *A)


# ---------------------------------------------------------------------------
# skill 2: letter_sounds — first sounds (L1) -> digraphs sh/ch/th/wh (L5)
# ---------------------------------------------------------------------------
def _letter_sounds() -> None:
    A = AGES["letter_sounds"]

    # L1 — hear the first sounds
    tt("letter_sounds", 1,
       "Luna is teaching Hoot beginning sounds. Tap the thing that starts "
       "with 'mmm', like moon.",
       "moon", ["sun", "tiger", "fish"], *A,
       narration="Tap the thing that starts with 'mmm', like moon.")
    mc("letter_sounds", 1,
       "Pip packed a picnic. Which snack starts with 'sss', like sun?",
       "sandwich", ["cheese", "apple", "milk"], *A)
    listen("letter_sounds", 1,
           "Hoot loves the 'tuh' sound. Say it with him, slow and strong: "
           "tuh-tuh-tiger.",
           "tuh, tuh, tiger", *A)
    tc("letter_sounds", 1,
       "Luna's pantry shelf holds treats that start with 'buh'. Count how "
       "many 'buh' treats you see.",
       3, "'buh' treats", *A)

    # L2 — the plot thickens (labels lose their first sounds)
    mc("letter_sounds", 2,
       "Oh no! Pip's cheese labels lost their first sounds. Which word "
       "starts with 'buh', like ball?",
       "bread", ["cheese", "crackers", "yogurt"], *A)
    tt("letter_sounds", 2,
       "Hoot hid three picture cards under the cushions. Tap the one that "
       "starts with 'fff', like fish.",
       "feather", ["leaf", "nest", "star"], *A,
       narration="Tap the picture card that starts with 'fff', like fish.")
    sort("letter_sounds", 2,
         "The pantry jars tumbled everywhere! Sort the treats: which start "
         "with 'mmm', and which with 'sss'?",
         {"Starts with mmm": ["muffin", "milk", "moon cake"],
          "Starts with sss": ["soup", "sandwich", "salad"]}, *A)
    listen("letter_sounds", 2,
           "The star-books hum when you say their sound. Say 'duh-duh-dog' "
           "with Luna.",
           "duh, duh, dog", *A)

    # L3 — help a friend (Pip's vowel homework)
    mc("letter_sounds", 3,
       "Pip is stuck on his nest-school homework. Which word has the 'a' "
       "sound, like cat?",
       "hat", ["bed", "pig", "cup"], *A)
    tt("letter_sounds", 3,
       "Hoot points at pictures, unsure. Tap the picture with the 'e' "
       "sound, like bed.",
       "pen", ["pin", "pan", "pot"], *A,
       narration="Tap the picture with the 'e' sound, like bed.")
    listen("letter_sounds", 3,
           "Pip keeps mixing up his middle sounds. Say the middle sound of "
           "'pig' with him: iii.",
           "p-i-g, pig. The middle sound is iii.", *A)
    sort("letter_sounds", 3,
         "Help Pip sort his word cards for nest school: short 'a' words "
         "and short 'o' words.",
         {"Short a, like cat": ["hat", "map", "pan"],
          "Short o, like hot": ["pot", "box", "fox"]}, *A)

    # L4 — the mystery (the Sound Thief)
    mc("letter_sounds", 4,
       "Mystery! The Sound Thief stole a first sound. '_un' shines in the "
       "sky. Which word was it?",
       "sun", ["bun", "run", "fun"], *A)
    tt("letter_sounds", 4,
       "The thief dropped a sound clue: 'sss'. Tap the picture whose name "
       "starts with that stolen sound.",
       "seal", ["moon", "leaf", "tent"], *A,
       narration="Tap the picture whose name starts with 'sss'.")
    mc("letter_sounds", 4,
       "Hoot found the thief's note: 'I love _ish!' It swims. Which word "
       "did the thief write?",
       "fish", ["dish", "wish", "squish"], *A)
    listen("letter_sounds", 4,
           "The thief returns stolen sounds when you name them. Say "
           "'lll-leaf' three times, like Luna.",
           "lll, lll, lll, leaf", *A)

    # L5 — master quest (digraphs; you are the Sound Keeper)
    mc("letter_sounds", 5,
       "Master challenge! Pip's favorite food starts with two letters that "
       "make one sound: 'cheese'. Which two?",
       "ch", ["sh", "c", "th"], *A)
    tt("letter_sounds", 5,
       "The last star-book only opens for the 'sh' sound. Tap the picture "
       "that starts with 'sh'.",
       "ship", ["chip", "thin", "zip"], *A,
       narration="Tap the picture that starts with 'sh'.")
    listen("letter_sounds", 5,
           "You are the Sound Keeper now! Teach Hoot the quiet library "
           "sound: 'shhh', like in 'ship'.",
           "shhh. sh, sh, ship.", *A)
    sort("letter_sounds", 5,
         "Sort the digraph cards for the graduation shelf: 'sh' words and "
         "'ch' words.",
         {"sh, like ship": ["ship", "fish", "shop"],
          "ch, like cheese": ["chat", "chips", "chick"]}, *A)


# ---------------------------------------------------------------------------
# skill 3: blending — compounds (L1) -> multisyllable words (L5)
# ---------------------------------------------------------------------------
def _blending() -> None:
    A = AGES["blending"]

    # L1 — two little words stuck together
    listen("blending", 1,
           "Luna found two little words stuck together: 'cow' and 'boy'. "
           "Say them fast with her: cowboy!",
           "cow... boy... cowboy!", *A)
    mc("blending", 1,
       "Pip glued two words together: 'pan' and 'cake'. What new word did "
       "he make?",
       "pancake", ["cupcake", "pancakes", "cake"], *A)
    tt("blending", 1,
       "Hoot mixed up his toy labels. Tap the picture of the 'toothbrush': "
       "'tooth' and 'brush'.",
       "toothbrush", ["hairbrush", "toothpaste", "paintbrush"], *A,
       narration="Tap the picture of the toothbrush.")
    tc("blending", 1,
       "Luna claps the parts of 'cowboy': cow... boy. How many claps did "
       "you hear?",
       2, "word parts", *A)

    # L2 — the plot thickens (stretchy CVC words)
    listen("blending", 2,
           "Hoot is learning to stretch words. Stretch it with him, slowly: "
           "ccc-aaa-tuh... cat!",
           "c-a-t, cat!", *A)
    mc("blending", 2,
       "Pip sounded out 'mmm-aaa-puh'. Which word did he read?",
       "map", ["mop", "cap", "nap"], *A)
    tt("blending", 2,
       "Luna stretched a word: 'hhh-aaa-tuh'. Tap the picture she named.",
       "hat", ["hot", "cat", "mat"], *A,
       narration="Tap the picture Luna named: hhh-aaa-tuh.")
    sort("blending", 2,
         "Help Hoot sort his sound cards: stretchy words and stuck-together "
         "words.",
         {"Stretchy words": ["cat", "sun", "pig"],
          "Stuck-together words": ["cowboy", "pancake", "toothbrush"]}, *A)

    # L3 — help a friend (Hoot's bedtime story)
    mc("blending", 3,
       "Hoot is stuck on a bedtime word: 'sss-uuu-nnn'. Help him. Which word?",
       "sun", ["fun", "bun", "run"], *A)
    listen("blending", 3,
           "Pip wants to read his cheese label: 'ch-eee-se'. Say it slowly, "
           "then fast, with Pip.",
           "ch-ee-se... cheese!", *A)
    tt("blending", 3,
       "Hoot stretched 'fff-iii-sssh'. Tap the picture of what he said.",
       "fish", ["dish", "fin", "ship"], *A,
       narration="Tap the picture of what Hoot said: fff-iii-sssh.")
    tc("blending", 3,
       "Luna claps the parts of 'bedtime': bed... time. How many parts?",
       2, "word parts", *A)

    # L4 — the mystery (the Tumble Wind jumbles syllables)
    seq("blending", 4,
        "The Tumble Wind jumbled Hoot's story word into pieces: 'ter', "
        "'but', 'fly'. Put them in order.",
        ["but", "ter", "fly"], *A)
    mc("blending", 4,
       "A jumbled word tumbled out of a star-book: 'win-dow'. Put the parts "
       "together. Which word?",
       "window", ["windmill", "door", "wind"], *A)
    tt("blending", 4,
       "The wind hid the word 'table' in pieces: 'ta' and 'ble'. Tap the "
       "picture it names.",
       "table", ["cable", "taco", "tent"], *A,
       narration="Tap the picture the word names: ta-ble.")
    listen("blending", 4,
           "Say the wind-scattered word slowly, then fast, to calm it down: "
           "'ap-ple'.",
           "ap-ple... apple!", *A)

    # L5 — master quest (big multisyllable words)
    listen("blending", 5,
           "Master Reader challenge! Clap and say the big word with Luna: "
           "'el-e-phant'.",
           "el-e-phant... elephant!", *A)
    seq("blending", 5,
        "Line up the word parts to unlock the Master Library: 'e', 'el', "
        "'phant'.",
        ["el", "e", "phant"], *A)
    mc("blending", 5,
       "Hoot found three flying words. Which one has the MOST parts?",
       "helicopter", ["pilot", "wing", "cloud"], *A)
    tc("blending", 5,
       "Clap the parts of the parade word 'watermelon': wa-ter-mel-on. "
       "How many parts?",
       4, "word parts", *A)


# ---------------------------------------------------------------------------
# skill 4: sight_words — I/the/and (L1) -> 200 words in sentences (L5)
# ---------------------------------------------------------------------------
def _sight_words() -> None:
    A = AGES["sight_words"]

    # L1 — first star-words
    tt("sight_words", 1,
       "Pip's first star-book cover is full of words. Tap the word 'the'.",
       "the", ["then", "they", "there"], *A,
       narration="Tap the word 'the'.")
    mc("sight_words", 1,
       "Hoot's bedtime page reads: 'I see ___ moon.' Which word fits?",
       "the", ["a", "and", "to"], *A)
    tc("sight_words", 1,
       "Count how many times you see the word 'and' in Luna's line: 'Pip "
       "and Hoot and Luna'.",
       2, "times the word 'and' appears", *A)
    trace("sight_words", 1,
          "Luna is writing the most important word: 'I'. Trace the tall "
          "letter I.",
          "I", *A)

    # L2 — the plot thickens (trickier words)
    mc("sight_words", 2,
       "Pip's note says: 'You ___ kind.' Which word fits?",
       "are", ["is", "be", "was"], *A)
    tt("sight_words", 2,
       "Hoot's story page is full of tricky words. Tap the word 'that'.",
       "that", ["than", "this", "what"], *A,
       narration="Tap the word 'that'.")
    sort("sight_words", 2,
         "Help Pip sort his word cards: words he knows by heart, and words "
         "he is still learning.",
         {"Knows by heart": ["I", "the", "and"],
          "Still learning": ["said", "could", "would"]}, *A)
    listen("sight_words", 2,
           "Read Hoot's line with Luna, smooth like a storyteller: 'I see "
           "you.'",
           "I see you.", *A)

    # L3 — help a friend (Pip's cheese labels)
    seq("sight_words", 3,
        "Pip's cheese label words fell off! Put them in order: 'the', "
        "'cheese', 'is', 'here'.",
        ["the", "cheese", "is", "here"], *A)
    mc("sight_words", 3,
       "Pip's label says: 'This cheese is ___ Pip.' Which word finishes it?",
       "for", ["from", "four", "of"], *A)
    tt("sight_words", 3,
       "Hoot hid Pip's labels around the library. Tap the label that says "
       "'said'.",
       "said", ["sad", "says", "sand"], *A,
       narration="Tap the label that says 'said'.")
    mc("sight_words", 3,
       "Pip wants to thank you in writing. Which sentence is right?",
       "I like you.", ["I like your.", "Me like you.", "I likes you."], *A)

    # L4 — the mystery (the Story Repair Shop)
    seq("sight_words", 4,
        "The Story Repair Shop has a broken sentence: 'moon', 'the', 'is', "
        "'up'. Fix it!",
        ["the", "moon", "is", "up"], *A)
    mc("sight_words", 4,
       "A smudged note says: '___ found the book.' Which word makes sense?",
       "They", ["Them", "Their", "Those"], *A)
    tt("sight_words", 4,
       "The repair owls need the word 'because' for a tricky sentence. "
       "Tap it.",
       "because", ["become", "before", "between"], *A,
       narration="Tap the word 'because'.")
    sort("sight_words", 4,
         "Sort the repair words: naming words and action words.",
         {"Naming words": ["moon", "Pip", "book"],
          "Action words": ["runs", "reads", "eats"]}, *A)

    # L5 — master quest (expression and fluency)
    listen("sight_words", 5,
           "Master Reader! Read Luna's line like a brave hero: 'We will "
           "find the star-book!'",
           "We will find the star-book!", *A)
    mc("sight_words", 5,
       "Hoot is reading fast! Which sentence did he read correctly?",
       "They went to the big library.",
       ["They goed to the big library.", "They went to the big libary.",
        "They went to big library."], *A)
    tc("sight_words", 5,
       "How many words are in Luna's celebration line: 'You are a star "
       "reader now'?",
       6, "words", *A)
    tt("sight_words", 5,
       "For your graduation, tap the LONGEST word on the Master Reader "
       "scroll.",
       "celebration", ["star", "book", "read"], *A,
       narration="Tap the longest word on the Master Reader scroll.")


# ---------------------------------------------------------------------------
# skill 5: sentences — left-to-right (L1) -> read with expression (L5)
# ---------------------------------------------------------------------------
def _sentences() -> None:
    A = AGES["sentences"]

    # L1 — stories have a starting line
    tt("sentences", 1,
       "Every story starts somewhere! Tap the FIRST word of Luna's line: "
       "'Hoot loves shiny stars'.",
       "Hoot", ["loves", "shiny", "stars"], *A,
       narration="Tap the first word of the line: Hoot loves shiny stars.")
    mc("sentences", 1,
       "Pip is learning to read like Luna. Which way do the words go?",
       "left to right", ["right to left", "top to bottom", "in circles"], *A)
    trace("sentences", 1,
          "Reading is a journey! Trace the reading path under the words, "
          "from left to right.",
          "left-to-right arrow", *A)
    tc("sentences", 1,
       "How many words are in Pip's sign: 'Pip loves cheese'?",
       3, "words", *A)

    # L2 — the plot thickens (capitals and full stops)
    mc("sentences", 2,
       "Hoot wrote three signs for his nest. Which one is written the "
       "right way?",
       "Pip naps.", ["pip naps.", "Pip naps", "pip naps"], *A)
    tt("sentences", 2,
       "Tap the capital letter that starts the sentence: 'Hoot is sleepy.'",
       "H", ["h", "o", "e"], *A,
       narration="Tap the capital letter that starts the sentence.")
    sort("sentences", 2,
         "Help Hoot tidy the sentence shelf: beginnings and endings.",
         {"Sentence beginnings": ["The moon", "Pip", "Hoot"],
          "Sentence endings": ["is round.", "naps.", "reads."]}, *A)
    listen("sentences", 2,
           "Read with a full-stop voice, strong at the end: 'The star-book "
           "glows.'",
           "The star-book glows.", *A)

    # L3 — help a friend (Hoot's bedtime sentences)
    seq("sentences", 3,
        "Hoot's bedtime words are mixed up: 'stars', 'Hoot', 'counts'. Line "
        "them up to make a sentence.",
        ["Hoot", "counts", "stars"], *A)
    mc("sentences", 3,
       "Pip wrote a thank-you note: 'thank you for the cheese'. Which "
       "version is right?",
       "Thank you for the cheese.",
       ["thank you for the cheese.", "Thank you for the cheese",
        "thank you for the Cheese."], *A)
    tt("sentences", 3,
       "Tap the word that needs a capital letter: 'pip found a star-book.'",
       "pip", ["found", "a", "star-book"], *A,
       narration="Tap the word that needs a capital letter.")
    trace("sentences", 3,
          "Underline Hoot's whole sentence with your finger, left to right, "
          "to tuck it into bed.",
          "sentence underline", *A)

    # L4 — the mystery (jumbled story pages)
    seq("sentences", 4,
        "The mystery pages blew everywhere! Put the story in order: 'Hoot "
        "woke up.', 'He found a glowing book.', 'He read all night.'",
        ["Hoot woke up.", "He found a glowing book.", "He read all night."], *A)
    mc("sentences", 4,
       "Detective time! Which sentence tells what happened FIRST?",
       "Pip heard a noise.",
       ["Pip found the book.", "Pip read the book.", "Pip went home."], *A)
    sort("sentences", 4,
         "Sort the clues: things Pip SAW and things Pip HEARD.",
         {"Pip saw": ["a glowing book", "an open window", "a feather"],
          "Pip heard": ["a giggle", "pages turning", "a hoot"]}, *A)
    listen("sentences", 4,
           "Read the mystery line like a detective: 'Someone moved my "
           "star-book!'",
           "Someone moved my star-book!", *A)

    # L5 — master quest (read with expression)
    listen("sentences", 5,
           "Master Reader! Read Luna's line like you are amazed: 'The "
           "library is flying!'",
           "The library is flying!", *A)
    mc("sentences", 5,
       "Luna wrote the same line two ways. Which one sounds excited?",
       "Hoot found the treasure!",
       ["Hoot found the treasure.", "hoot found the treasure!",
        "Hoot found the treasure?"], *A)
    tc("sentences", 5,
       "Clap the words in the cheering line: 'Hip hip hooray for Hoot'.",
       5, "words", *A)
    tt("sentences", 5,
       "Tap the sentence that asks a question.",
       "Where is my book?",
       ["My book is here.", "I love my book!", "my book is lost."], *A,
       narration="Tap the sentence that asks a question.")


# ---------------------------------------------------------------------------
# skill 6: stories — point to what happened (L1) -> retell chapters (L5)
# ---------------------------------------------------------------------------
def _stories() -> None:
    A = AGES["stories"]

    # L1 — welcome to story time
    tt("stories", 1,
       "Luna just read about Pip's picnic. Tap what Pip ate at the picnic.",
       "cheese", ["cake", "grapes", "soup"], *A,
       narration="Tap what Pip ate at the picnic.")
    mc("stories", 1,
       "In the picnic story, who loves cheese more than anything?",
       "Pip", ["Hoot", "Luna", "the wind"], *A)
    tc("stories", 1,
       "How many friends shared the picnic: Pip, Hoot, and Luna?",
       3, "friends", *A)
    listen("stories", 1,
           "Tell Luna your favorite part of the picnic story.",
           "My favorite part was...", *A)

    # L2 — the plot thickens (beginning, middle, end)
    seq("stories", 2,
        "Put Pip's adventure in order: 'Pip woke up.', 'Pip packed cheese.', "
        "'Pip shared with Hoot.'",
        ["Pip woke up.", "Pip packed cheese.", "Pip shared with Hoot."], *A)
    mc("stories", 2,
       "What happened in the MIDDLE of Pip's adventure?",
       "Pip packed cheese.",
       ["Pip woke up.", "Pip shared with Hoot.", "Pip went to sleep."], *A)
    tt("stories", 2,
       "Tap the picture that shows the END of the story.",
       "friends sharing cheese",
       ["Pip waking up", "Pip packing cheese", "Luna shelving books"], *A,
       narration="Tap the picture that shows the end of the story: friends "
                 "sharing cheese.")
    sort("stories", 2,
         "Help Hoot sort the story bits: how it STARTED and how it ENDED.",
         {"How it started": ["Pip woke up", "the sun rose"],
          "How it ended": ["friends shared", "everyone yawned"]}, *A)

    # L3 — help a friend (Hoot forgot the story)
    mc("stories", 3,
       "Hoot forgot why Pip was sad. Why was Pip sad in the story?",
       "His cheese rolled down the hill.",
       ["Hoot ate all the cheese.", "The wind took the blanket.",
        "Luna closed the library."], *A)
    listen("stories", 3,
           "Pip cannot remember the story! Retell it for him in your own "
           "words.",
           "First... then... last...", *A)
    tt("stories", 3,
       "Tap who helped Pip when his cheese rolled away.",
       "Hoot", ["Pip", "Luna", "the wind"], *A,
       narration="Tap who helped Pip when his cheese rolled away.")
    tc("stories", 3,
       "How many cheeses did Pip pack: one for him, one for Hoot, one for "
       "Luna?",
       3, "cheeses", *A)

    # L4 — the mystery (the ending blew away)
    mc("stories", 4,
       "Oh no! The story's ending blew away. Which ending fits best?",
       "They shared the cheese and watched the stars.",
       ["Pip kept it all for himself.", "They left without eating.",
        "The picnic never happened."], *A)
    seq("stories", 4,
        "Rebuild the mystery tale: 'A note appeared.', 'The ink was fresh.', "
        "'Hoot giggled behind the shelf.'",
        ["A note appeared.", "The ink was fresh.",
         "Hoot giggled behind the shelf."], *A)
    sort("stories", 4,
         "Sort the clues: clues that MATTER and red herrings.",
         {"Clues that matter": ["fresh ink", "a giggle", "crumbs"],
          "Red herrings": ["a cloudy sky", "a loud bell", "cold soup"]}, *A)
    listen("stories", 4,
           "Tell the mystery ending in your spookiest storyteller voice.",
           "And then... the pages turned themselves!", *A)

    # L5 — master quest (retell the chapters)
    listen("stories", 5,
           "Master Storyteller! Retell Pip's whole cheese adventure, "
           "beginning to end.",
           "Once upon a time...", *A)
    mc("stories", 5,
       "What is the lesson of Pip's cheese adventure?",
       "Sharing makes everything better.",
       ["Keep everything for yourself.", "Adventures are too messy.",
        "Cheese is only for mice."], *A)
    seq("stories", 5,
        "Line up the four chapters: 'The Picnic Plan', 'The Rolling "
        "Cheese', 'The Great Share', 'Stars and Yawns'.",
        ["The Picnic Plan", "The Rolling Cheese", "The Great Share",
         "Stars and Yawns"], *A)
    trace("stories", 5,
          "Draw the story path: from Pip's house, over the hill, to the "
          "picnic blanket.",
          "story path", *A)


# ---------------------------------------------------------------------------
def build() -> None:
    """Generate all 120 reading activities (6 skills x 5 levels x 4)."""
    _alphabet()
    _letter_sounds()
    _blending()
    _sight_words()
    _sentences()
    _stories()
