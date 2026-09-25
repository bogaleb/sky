#!/usr/bin/env python3
"""Sky Phase 3 — FEELINGS content module (The Quiet Cloud, hosted by Tuno).

Story world: the Quiet Cloud, where Tuno the turtle lives with the Calm
Cloud (a soft cloud you rest on). Pebble the crab is a young friend who is
learning feelings too — the child often helps PEBBLE, which is gentler than
being quizzed about themselves.

Recurring places: the Breathing Cave (echoes your breath back), the Feeling
Weather (feelings are like weather — they pass), the calm-down toolbox, the
focus fireflies (watch ONE firefly).

Tone: Tuno's voice is slow, calm, kind. Never rushed, never loud, never
punishing. Wrong answers are never shamed; calm_down distractors may be
real kid impulses (yelling, hiding) framed kindly.

Skills:
  emotions   (3-7): L1 names happy/sad        -> L5 mixed feelings, empathy
  breathing  (3-8): L1 takes one deep breath  -> L5 breathes independently
  calm_down  (3-8): L1 knows one calm tool    -> L5 picks the right tool
  attention  (4-8): L1 focuses briefly        -> L5 sustains focus

Level arcs: L1 welcome / L2 plot thickens / L3 help a friend (Pebble!) /
L4 mystery / L5 master quest. Exactly 4 activities per level per skill.
"""
from core import mc, tt, tc, seq, sort, trace, listen, AGES, KID_NAMES


# ---------------------------------------------------------------------------
# emotions — naming feelings, the Feeling Weather, empathy
# ---------------------------------------------------------------------------
def _emotions() -> None:
    a_min, a_max = AGES["emotions"]

    # L1 — Welcome: meet Pebble and the Calm Cloud, name happy/sad/calm.
    mc("emotions", 1,
       "Pebble the crab found his favorite shell on the soft Calm Cloud. "
       "How is Pebble feeling?",
       "happy", ["sad", "mad", "scared"], a_min, a_max)
    tt("emotions", 1,
       "A gray cloud rained on Pebble's sandcastle and it melted away. "
       "Tap the face that shows how he feels.",
       "sad", ["happy", "mad", "surprised"], a_min, a_max)
    mc("emotions", 1,
       "Tuno is resting on the Calm Cloud with a warm, sleepy smile. "
       "What feeling is Tuno showing you?",
       "calm", ["happy", "sad", "surprised"], a_min, a_max)
    listen("emotions", 1,
           "Pebble is learning feeling words. Say 'happy' with Tuno, slow "
           "and soft, so Pebble can copy you.",
           "Happy... hap-py...", a_min, a_max)

    # L2 — The plot thickens: the Feeling Weather arrives.
    mc("emotions", 2,
       "The Feeling Weather is here! Dark clouds rumble and Pebble's claws "
       "are shaking. What is Pebble feeling?",
       "scared", ["sad", "mad", "surprised"], a_min, a_max)
    tt("emotions", 2,
       "Pebble built a tall tower and his brother knocked it down. "
       "Tap the face that matches Pebble now.",
       "mad", ["sad", "scared", "happy"], a_min, a_max)
    mc("emotions", 2,
       "Surprise! The Calm Cloud just puffed into a heart shape for Pebble. "
       "Which feeling just arrived?",
       "surprised", ["happy", "scared", "sad"], a_min, a_max)
    sort("emotions", 2,
         "Feelings are like weather — some loud, some soft. "
         "Help Tuno sort them.",
         {"Loud feelings": ["mad", "surprised"],
          "Soft feelings": ["sad", "calm"]},
         a_min, a_max)

    # L3 — Help a friend: help Pebble name his feelings.
    mc("emotions", 3,
       "Pebble lost his favorite shell and his tummy feels wobbly. Tuno "
       "says: first, name it. What is Pebble feeling?",
       "sad", ["scared", "mad", "happy"], a_min, a_max)
    tt("emotions", 3,
       "Pebble wants to hide because the thunder is so loud. "
       "Tap the face that shows his feeling.",
       "scared", ["sad", "mad", "surprised"], a_min, a_max)
    seq("emotions", 3,
        "Pebble's bad day got all mixed up. Put the three moments in order "
        "so Tuno can understand.",
        ["The wave took Pebble's shell",
         "Pebble felt sad and wobbly",
         "Tuno gave a slow hug"],
        a_min, a_max)
    mc("emotions", 3,
       "Pebble got a kind note from a friend and his heart feels warm and "
       "glowy. Help him name this feeling.",
       "happy", ["calm", "surprised", "proud"], a_min, a_max)

    # L4 — The mystery: puzzling feelings, mixed feelings.
    mc("emotions", 4,
       "Pebble is excited for the party but nervous about the loud music. "
       "What can Tuno tell him?",
       "Both feelings can be true",
       ["Pick only one feeling", "Feelings are wrong", "Hide the nervous one"],
       a_min, a_max)
    tt("emotions", 4,
       "Someone laughed when Pebble fell. He smiles, but his eyes look "
       "watery. Tap the face showing his REAL feeling.",
       "sad", ["happy", "mad", "surprised"], a_min, a_max)
    sort("emotions", 4,
         "The Feeling Weather always passes, like rain. Sort the storm "
         "feelings and the sunshine feelings.",
         {"Storm feelings": ["mad", "scared", "sad"],
          "Sunshine feelings": ["happy", "calm", "surprised"]},
         a_min, a_max)
    seq("emotions", 4,
        "Every storm on the Quiet Cloud passes in order. Put the storm's "
        "three moments in order.",
        ["A dark feeling cloud arrives",
         "The rain falls for a while",
         "The sun peeks back out"],
        a_min, a_max)

    # L5 — Master quest: the child is the feelings expert.
    mc("emotions", 5,
       "A new little crab is crying on the Calm Cloud. You are the feelings "
       "expert now. What do you do first?",
       "Ask how they are feeling",
       ["Tell them to stop crying", "Walk away quietly", "Give them your shell"],
       a_min, a_max)
    tt("emotions", 5,
       "Pebble's friend hides a sad face behind a big smile. Tap the clue "
       "that shows the REAL feeling.",
       "watery eyes", ["a big smile", "a happy dance", "a loud laugh"],
       a_min, a_max)
    listen("emotions", 5,
           "Teach Pebble the feelings song with Tuno: name it, feel it, "
           "let it pass.",
           "Name it... feel it... let it pass...", a_min, a_max)
    mc("emotions", 5,
       f"{KID_NAMES[0]} feels left out at the tide pool. What would a true "
       "feelings expert do?",
       "Invite them to play",
       ["Tell them it is fine", "Keep playing alone", "Laugh it off"],
       a_min, a_max)


# ---------------------------------------------------------------------------
# breathing — the Breathing Cave, brave breaths
# ---------------------------------------------------------------------------
def _breathing() -> None:
    a_min, a_max = AGES["breathing"]

    # L1 — Welcome: the Breathing Cave echoes your breath back.
    listen("breathing", 1,
           "Welcome to the Breathing Cave — it echoes your breath back. "
           "Let's take one slow breath with Tuno.",
           "Breathe in... 2... 3... Breathe out... 2... 3...",
           a_min, a_max)
    tc("breathing", 1,
       "The cave echoes every breath you take. Take 3 slow breaths with "
       "Tuno and tap for each one.",
       3, "slow breaths", a_min, a_max)
    mc("breathing", 1,
       "Tuno smells the soup to breathe in, then blows cool to breathe out. "
       "Which part comes first?",
       "Breathe in", ["Breathe out", "Breathe fast", "Hold it tight"],
       a_min, a_max)
    tt("breathing", 1,
       "Pebble forgot how a calm breath starts. Tap the picture that shows "
       "the very first step.",
       "smelling the soup",
       ["blowing fast", "holding breath", "talking loud"],
       a_min, a_max)

    # L2 — The plot thickens: Pebble is scared of the thunder.
    listen("breathing", 2,
           "Pebble is scared of the thunder. Let's breathe with Tuno "
           "together — slow in, slow out.",
           "Breathe in... 2... 3... Breathe out... 2... 3... "
           "Breathe in... 2... 3... Breathe out... 2... 3...",
           a_min, a_max)
    tc("breathing", 2,
       "Thunder rumbled 4 times outside the cave. Take 4 slow breaths with "
       "Tuno — one for each rumble.",
       4, "slow breaths", a_min, a_max)
    mc("breathing", 2,
       "Pebble's breath is fast and shaky. What should his breathing become "
       "so he feels calm?",
       "Slow and deep", ["Fast and quick", "Held in tight", "Loud and puffy"],
       a_min, a_max)
    tt("breathing", 2,
       "The cave echoes best when breaths are slow and deep. Tap the breath "
       "for Pebble to copy.",
       "a slow deep breath",
       ["fast panting", "a held breath", "a sneezy breath"],
       a_min, a_max)

    # L3 — Help a friend: breathe Pebble through his bad day.
    listen("breathing", 3,
           "Pebble's bad day is back — a wave took his shell again. Breathe "
           "with him until he feels steady.",
           "Breathe in... 2... 3... Breathe out... 2... 3... "
           "Breathe in... 2... 3... Breathe out... 2... 3...",
           a_min, a_max)
    tc("breathing", 3,
       "Pebble needs 5 slow breaths to feel steady again. Count them with "
       "Tuno, nice and slow.",
       5, "slow breaths", a_min, a_max)
    mc("breathing", 3,
       "Pebble wants to breathe fast because he is upset. What can you "
       "teach him instead?",
       "Slow breaths calm the body",
       ["Fast breaths fix feelings", "Skip breathing for now",
        "Breathe only at bedtime"],
       a_min, a_max)
    seq("breathing", 3,
        "Pebble forgot the brave breath steps. Put them in order so he can "
        "copy you.",
        ["Smell the soup (breathe in)",
         "Blow the bubbles (breathe out)",
         "Feel your tummy get soft"],
        a_min, a_max)

    # L4 — The mystery: the cave echoes are sleeping.
    listen("breathing", 4,
           "The cave has gone quiet — its echoes are sleeping. Wake them "
           "with long, deep breaths.",
           "Breathe in... 2... 3... 4... Breathe out... 2... 3... 4...",
           a_min, a_max)
    tc("breathing", 4,
       "Six echoes are sleeping deep in the cave. Wake each one with a "
       "slow breath — count to 6.",
       6, "slow breaths", a_min, a_max)
    mc("breathing", 4,
       "The echoes woke up, but they are tiny and shy. What makes a cave "
       "echo grow big and strong?",
       "Longer, slower breaths",
       ["Shorter, faster breaths", "Louder talking", "No breathing at all"],
       a_min, a_max)
    mc("breathing", 4,
       "Pebble can only hear the echo when he is very still inside. What "
       "helps him get still?",
       "Slow breathing",
       ["Wiggling fast", "Shouting hello", "Running in circles"],
       a_min, a_max)

    # L5 — Master quest: the child is the breath teacher.
    listen("breathing", 5,
           "You are the breath teacher now! Lead Pebble through the storm "
           "breath — he will copy you.",
           "Breathe in... 2... 3... 4... Hold... Breathe out... 2... 3... 4...",
           a_min, a_max)
    tc("breathing", 5,
       "The big storm needs 7 brave breaths. Lead them, breath teacher — "
       "Tuno is counting with you.",
       7, "brave breaths", a_min, a_max)
    mc("breathing", 5,
       "The storm is coming and Tuno is far away. What can Pebble do all "
       "by himself?",
       "Use his brave breath alone",
       ["Wait for Tuno", "Hide until it ends", "Yell at the storm"],
       a_min, a_max)
    seq("breathing", 5,
        "Teach the whole Quiet Cloud your calm-breath routine. Put the "
        "steps in order.",
        ["Notice the wobbly feeling",
         "Take slow brave breaths",
         "Smile — the storm has passed"],
        a_min, a_max)


# ---------------------------------------------------------------------------
# calm_down — the calm-down toolbox, picking the right tool
# ---------------------------------------------------------------------------
def _calm_down() -> None:
    a_min, a_max = AGES["calm_down"]

    # L1 — Welcome: meet the calm-down toolbox, learn belly breaths.
    mc("calm_down", 1,
       "Tuno keeps a calm-down toolbox on the Calm Cloud. Which tool "
       "should we try first?",
       "Belly breaths", ["Yelling loud", "Throwing shells", "Running away"],
       a_min, a_max)
    tt("calm_down", 1,
       "Open the toolbox with Tuno. Tap the tool that fills your belly "
       "like a balloon.",
       "belly breaths", ["stompy feet", "yelling", "hiding"],
       a_min, a_max)
    listen("calm_down", 1,
           "Let's try belly breaths with Tuno. Put your hand on your tummy "
           "and breathe along.",
           "Belly out... breathe in... Belly soft... breathe out...",
           a_min, a_max)
    mc("calm_down", 1,
       "Pebble's claws are trembling. What is Tuno's calm-down toolbox for?",
       "Things that help big feelings get smaller",
       ["Things that make feelings bigger", "Things to throw far",
        "Things to hide under"],
       a_min, a_max)

    # L2 — The plot thickens: Pebble's bad day, more tools.
    mc("calm_down", 2,
       "Pebble's tower fell and he wants to yell. Tuno kneels down slowly. "
       "What could help instead?",
       "A tight turtle squeeze",
       ["Yelling louder", "Kicking the tower", "Hiding all day"],
       a_min, a_max)
    tt("calm_down", 2,
       "Pebble's feelings are buzzing like bees. Tap the tool that gives "
       "his body a cozy squeeze.",
       "a cozy squeeze", ["running away", "yelling", "throwing sand"],
       a_min, a_max)
    mc("calm_down", 2,
       "Tuno counts to ten when his mind starts to race. Why does slow "
       "counting help?",
       "It gives the feeling time to shrink",
       ["It erases every feeling", "It scares feelings away",
        "It counts your shells"],
       a_min, a_max)
    listen("calm_down", 2,
           "Count to ten with Tuno — slow as a turtle, soft as a cloud.",
           "1... 2... 3... 4... 5... 6... 7... 8... 9... 10...",
           a_min, a_max)

    # L3 — Help a friend: help Pebble pick the right tool.
    mc("calm_down", 3,
       "Pebble is MAD his sandcastle fell down. Which tool fits a mad "
       "feeling best?",
       "Stompy march, then belly breaths",
       ["Yelling at the waves", "Smashing the buckets", "Sitting in the rain"],
       a_min, a_max)
    tt("calm_down", 3,
       "Pebble is scared of the dark cave ahead. Tap the tool that helps "
       "scared feelings.",
       "a cozy squeeze",
       ["hiding forever", "yelling at the dark", "running in circles"],
       a_min, a_max)
    sort("calm_down", 3,
         "Pebble mixed up his toolbox! Sort what helps big feelings and "
         "what makes them bigger.",
         {"Helps big feelings": ["belly breaths", "a tight squeeze",
                                 "counting to ten"],
          "Makes them bigger": ["yelling", "hiding", "throwing things"]},
         a_min, a_max)
    mc("calm_down", 3,
       "Pebble tried belly breaths and his claws stopped shaking. What "
       "should he do now?",
       "Keep breathing until calm",
       ["Stop after one breath", "Yell just a little", "Throw one shell"],
       a_min, a_max)

    # L4 — The mystery: the toolbox steps got mixed up.
    seq("calm_down", 4,
        "The toolbox steps got all mixed up! Put Tuno's calm-down steps in "
        "the right order.",
        ["Name the feeling", "Take slow breaths", "Pick a calm tool"],
        a_min, a_max)
    mc("calm_down", 4,
       "Pebble tried yelling, but his tummy still feels wobbly. What did "
       "Tuno notice?",
       "Yelling didn't shrink the feeling",
       ["Yelling fixed everything", "Feelings enjoy yelling", "Tuno yelled too"],
       a_min, a_max)
    sort("calm_down", 4,
         "Some tools fit some feelings best. Sort the tools for mad "
         "feelings and scared feelings.",
         {"For mad feelings": ["stompy march", "belly breaths"],
          "For scared feelings": ["a tight squeeze", "counting to ten"]},
         a_min, a_max)
    tt("calm_down", 4,
       "Pebble feels wobbly but cannot say why. Tap the FIRST step Tuno "
       "always does.",
       "name the feeling",
       ["pick a tool", "take a breath", "count to ten"],
       a_min, a_max)

    # L5 — Master quest: the child is the Calm Captain.
    mc("calm_down", 5,
       "You are the Calm Captain now! A baby turtle is crying at the tide "
       "pool. What do you do first?",
       "Kneel down and ask how they feel",
       ["Say big kids don't cry", "Hand them a snack fast", "Carry them away"],
       a_min, a_max)
    seq("calm_down", 5,
        "Teach Pebble the whole bedtime calm-down routine. Put the steps "
        "in order.",
        ["Name the day's biggest feeling",
         "Take five slow breaths",
         "Pick a cozy sleep tool"],
        a_min, a_max)
    mc("calm_down", 5,
       "Pebble is calm now, but storm clouds are gathering again. What "
       "does a Calm Captain do?",
       "Use the tools BEFORE the big feeling",
       ["Wait until it feels huge", "Hide the toolbox", "Yell at the clouds"],
       a_min, a_max)
    tt("calm_down", 5,
       "The Quiet Cloud needs a new keeper of the calm-down toolbox. "
       "Tap the one who is ready.",
       "Pebble the crab",
       ["the grumpy wave", "the sleepy echo", "the loud thunder"],
       a_min, a_max)


# ---------------------------------------------------------------------------
# attention — the focus fireflies, watch ONE firefly
# ---------------------------------------------------------------------------
def _attention() -> None:
    a_min, a_max = AGES["attention"]

    # L1 — Welcome: meet the focus fireflies.
    tt("attention", 1,
       "The focus fireflies are dancing! Watch ONE firefly — tap the one "
       "glowing steady and still.",
       "the steady firefly",
       ["the zippy firefly", "the blinky firefly", "the sleepy firefly"],
       a_min, a_max)
    mc("attention", 1,
       "Tuno watches one firefly for a whole slow breath. What is Tuno doing?",
       "Paying attention",
       ["Falling asleep", "Counting clouds", "Hiding away"],
       a_min, a_max)
    tc("attention", 1,
       "Three fireflies glow in a row on the Quiet Cloud. Count the steady "
       "glows with Tuno.",
       3, "steady firefly glows", a_min, a_max)
    listen("attention", 1,
           "Say 'I am watching' with Tuno, slow and soft, while you watch "
           "your one firefly.",
           "I am watching... my firefly...", a_min, a_max)

    # L2 — The plot thickens: distractions arrive.
    tt("attention", 2,
       "The fireflies are dancing and a frog is croaking LOUD. Ignore it — "
       "tap YOUR steady firefly.",
       "the steady firefly",
       ["the zippy firefly", "the blinky firefly", "the darting firefly"],
       a_min, a_max)
    mc("attention", 2,
       "A shiny beetle just zoomed past your nose! What should your eyes "
       "do now?",
       "Keep watching my firefly",
       ["Chase the beetle", "Close my eyes", "Watch everything"],
       a_min, a_max)
    sort("attention", 2,
         "Tuno is sorting what helps us focus. Help him tidy the Quiet Cloud.",
         {"Helps me focus": ["one firefly", "slow breathing", "a quiet spot"],
          "Steals my focus": ["loud noises", "wiggly distractions",
                              "too many things"]},
         a_min, a_max)
    tc("attention", 2,
       "Two fireflies glow steady while the others zip around. Count only "
       "the steady ones.",
       2, "steady fireflies", a_min, a_max)

    # L3 — Help a friend: Pebble gets distracted.
    tt("attention", 3,
       "Pebble keeps losing his firefly — he watches every zippy one! Tap "
       "the steady firefly to show him.",
       "the steady firefly",
       ["the zippy firefly", "the blinky firefly", "the swirly firefly"],
       a_min, a_max)
    mc("attention", 3,
       "Pebble's eyes follow every beetle and frog. What can you teach him?",
       "Pick one firefly and stay with it",
       ["Watch everything at once", "Close your eyes tight", "Chase the beetles"],
       a_min, a_max)
    trace("attention", 3,
          "Pebble's firefly got lost in the reeds! Trace its glowing path "
          "home with your finger.",
          "the firefly's glowing path home", a_min, a_max)
    seq("attention", 3,
        "Teach Pebble Tuno's focus steps. Put them in order.",
        ["Pick one firefly",
         "Watch it for three breaths",
         "Smile — you did it"],
        a_min, a_max)

    # L4 — The mystery: which is the real Focus Firefly?
    mc("attention", 4,
       "One firefly blinks a secret pattern: blink... blink-blink... blink. "
       "What should you do?",
       "Watch closely to learn it",
       ["Look away quickly", "Guess without watching", "Chase it to see"],
       a_min, a_max)
    tt("attention", 4,
       "Three fireflies look the same, but only one is the true Focus "
       "Firefly. Tap the steady one.",
       "the steady-glowing firefly",
       ["the flickering firefly", "the darting firefly", "the fading firefly"],
       a_min, a_max)
    sort("attention", 4,
         "The Wind Sprite is scattering distractions! Sort what to watch "
         "and what to let pass by.",
         {"Keep watching": ["my one firefly", "the steady glow"],
          "Let pass by": ["zippy beetles", "loud croaks", "wiggly leaves"]},
         a_min, a_max)
    tc("attention", 4,
       "The Focus Firefly blinked 5 slow times just for you. Count the "
       "slow blinks with Tuno.",
       5, "slow blinks", a_min, a_max)

    # L5 — Master quest: lead the firefly parade.
    tt("attention", 5,
       "You lead the firefly parade! Tap the steadiest glow — every "
       "firefly will follow it.",
       "the steadiest glow",
       ["the zappiest glow", "the wiggliest glow", "the sleepiest glow"],
       a_min, a_max)
    mc("attention", 5,
       "The parade passes the noisy frog pond and the beetle race. What "
       "does the leader do?",
       "Keep the glow steady and lead on",
       ["Stop to watch the race", "Croak with the frogs", "Scatter the parade"],
       a_min, a_max)
    seq("attention", 5,
        "Teach the whole Quiet Cloud your focus parade routine. Put it in "
        "order.",
        ["Pick your one steady glow",
         "Ignore the zips and croaks",
         "Lead the parade home"],
        a_min, a_max)
    listen("attention", 5,
           "Lead the focus chant for the whole parade — slow, steady, and "
           "proud.",
           "Steady... and slow... I can focus...", a_min, a_max)


# ---------------------------------------------------------------------------
def build() -> None:
    """Register all 80 feelings activities (4 skills x 5 levels x 4)."""
    _emotions()
    _breathing()
    _calm_down()
    _attention()
