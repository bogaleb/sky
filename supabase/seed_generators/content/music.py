#!/usr/bin/env python3
"""Sky Phase 3 — MUSIC content module (The Rhythm Stage, hosted by Riff).

Story world: Riff the rabbit and his band (Pip the mouse on drums, Hoot the
owlet humming) are putting on a concert tonight at the Rhythm Stage. The
Echo Cave echoes everything back — sometimes helpfully, sometimes jumbled.
Running threads: the concert tonight, Riff's lost drumsticks, the parade
that needs a beat, the Echo Cave mixing up songs, teaching the Loom
sprites to dance.

Riff's voice: bouncy, rhythmic. "Hop to it!..." Everything is a song
waiting to happen. The child is the band's helper and, by L5, its leader.

Skills:
  rhythm      (3-7): L1 clap along -> L5 read/create rhythm patterns
  pitch       (3-7): L1 high vs low -> L5 order notes by pitch
  instruments (3-7): L1 name instruments -> L5 group by family
  dance       (3-6): L1 copy moves -> L5 create movement sequences

Rhythms/sounds are written in WORDS (no audio files): "loud, soft, soft",
"fast, fast, slow", "high, low, high". Pitch: "like a bird" (high) vs
"like a bear" (low).
"""
from core import mc, tt, tc, seq, sort, trace, listen, AGES  # noqa: F401


# ===========================================================================
# RHYTHM — the concert tonight
# ===========================================================================
def _rhythm() -> None:
    A = AGES["rhythm"]

    # -- L1: Welcome to the Rhythm Stage ------------------------------------
    listen("rhythm", 1,
           "Hop to it! The concert is tonight and Riff needs a beat buddy. "
           "Riff claps: clap, CLAP. Clap it back with him!",
           "Clap with Riff: clap, CLAP. Your turn - clap it back!",
           *A)
    tc("rhythm", 1,
       "Pip the mouse is warming up his drum: boom, boom, boom. "
       "Count Pip's drumbeats with him!",
       3, "drumbeats", *A)
    mc("rhythm", 1,
       "Riff stomps LOUD, then tiptoes soft, soft. Which word shows the LOUD part?",
       "STOMP", ["clap", "tap", "pat"], *A)
    tt("rhythm", 1,
       "Pip needs his drum to keep the beat! Tap the drum in Riff's band corner.",
       "drum", ["trumpet", "violin", "flute"], *A)

    # -- L2: Riff lost his drumsticks! --------------------------------------
    listen("rhythm", 2,
           "Oh no - Riff lost his drumsticks! No worries, use your hands: "
           "clap, clap, STOMP. Clap it back!",
           "Riff claps: clap, clap, STOMP. Clap it back, nice and bouncy!",
           *A)
    mc("rhythm", 2,
       "Hop to it! The parade needs a beat: STOMP, clap, clap, STOMP, clap, clap... "
       "What comes next?",
       "STOMP", ["clap", "snap", "rest"], *A)
    tc("rhythm", 2,
       "Hoot is humming the beat while Riff hunts for drumsticks: STOMP, STOMP, "
       "STOMP, STOMP. Count the stomps!",
       4, "stomps", *A)
    seq("rhythm", 2,
        "Riff invented a one-drumstick beat: tap, clap, STOMP! Line the sounds up in order.",
        ["tap", "clap", "STOMP"], *A)

    # -- L3: Help Pip fix his drum part ------------------------------------
    listen("rhythm", 3,
           "Pip the mouse keeps rushing the drum part. Slow it down for him: "
           "slow, slow, FAST. Play it back!",
           "Riff plays: slow, slow, FAST. Now play it back to teach Pip!",
           *A)
    mc("rhythm", 3,
       "Pip played boom, boom, BANG, boom, boom... He forgot what comes next. Help him!",
       "BANG", ["boom", "tap", "rest"], *A)
    tt("rhythm", 3,
       "Hoot mixed up the beat cards! Tap the card showing Riff's parade beat: "
       "STOMP, clap, clap.",
       "STOMP, clap, clap",
       ["clap, STOMP, clap", "clap, clap, STOMP", "STOMP, STOMP, clap"], *A)
    seq("rhythm", 3,
        "Teach the Loom sprites Riff's beat! Line up the sounds: tip, tap, BANG.",
        ["tip", "tap", "BANG"], *A)

    # -- L4: The Echo Cave mystery ------------------------------------------
    listen("rhythm", 4,
           "Spooky! The Echo Cave copies every sound. Riff claps: STOMP, clap, clap. "
           "Echo it back, cave-style!",
           "The cave echoes: STOMP, clap, clap. Echo it back just like the cave!",
           *A)
    mc("rhythm", 4,
       "The cave jumbled Riff's beat! It sang clap, clap, STOMP - but Riff's REAL "
       "parade beat starts with...?",
       "STOMP", ["clap", "snap", "tap"], *A)
    tc("rhythm", 4,
       "Echoes are bouncing off the cave walls! Count every echo as it flies past you.",
       5, "echoes", *A)
    trace("rhythm", 4,
          "Draw the echo's bouncing path! Trace the zigzag line to help the echo "
          "escape the cave.",
          "zigzag echo path", *A)

    # -- L5: Master quest - lead the concert! -------------------------------
    listen("rhythm", 5,
           "Showtime! YOU lead the band now. Play your own beat: loud, soft, soft, "
           "LOUD. The band follows you!",
           "You're the leader! Play your beat: loud, soft, soft, LOUD. "
           "The band follows you!",
           *A)
    mc("rhythm", 5,
       "The crowd wants an encore: tap, tap, REST, tap, tap... What comes next in "
       "the tricky beat?",
       "REST", ["tap", "STOMP", "clap"], *A)
    seq("rhythm", 5,
        "Line up the concert program, maestro: warm-up beat first, parade march "
        "next, grand finale last!",
        ["warm-up beat", "parade march", "grand finale"], *A)
    sort("rhythm", 5,
         "Sort the band's sounds before the show: LOUD sounds in one pile, soft "
         "sounds in another!",
         {"LOUD sounds": ["STOMP", "BANG", "CRASH"],
          "soft sounds": ["tap", "tip", "pat"]}, *A)


# ===========================================================================
# PITCH — Hoot's humming lessons
# ===========================================================================
def _pitch() -> None:
    A = AGES["pitch"]

    # -- L1: Meet Hoot the owlet -------------------------------------------
    listen("pitch", 1,
           "Meet Hoot the owlet! He hums HIGH like a tiny bird: wee-ee-ee! "
           "Hum it back with him!",
           "Hoot hums high like a bird: wee-ee-ee! Hum it back with Hoot!",
           *A)
    mc("pitch", 1,
       "Hoot sings two notes: one like a bird, one like a bear. Which note is HIGH?",
       "the bird's note", ["the bear's note", "the quiet note", "the middle note"],
       *A)
    tt("pitch", 1,
       "Hoot wants to sing with the HIGHEST singer in the meadow. Tap it!",
       "bird", ["bear", "frog", "turtle"], *A)
    mc("pitch", 1,
       "Riff plinks the piano: plink means HIGH, plunk means LOW. Which word is "
       "the HIGH note?",
       "plink", ["plunk", "plonk", "plank"], *A)

    # -- L2: Up and down the music stairs -----------------------------------
    listen("pitch", 2,
           "Hoot is hopping up the music stairs: low, higher, HIGHEST! Sing the "
           "climb back with him!",
           "Sing with Hoot up the stairs: low... higher... HIGHEST! Now sing it back!",
           *A)
    mc("pitch", 2,
       "Hoot sang low, then middle, then high. Which note was the HIGHEST of the three?",
       "the last one", ["the first one", "the middle one", "they were all the same"],
       *A)
    seq("pitch", 2,
        "Hoot's hums tumbled down the music stairs! Put them back from LOWEST to HIGHEST.",
        ["low hum", "middle hum", "high hum"], *A)
    tt("pitch", 2,
       "The Echo Cave echoed Hoot's high note. Tap the HIGH echo, the one like a bird!",
       "high wee-ee", ["low whoo", "middle laa", "rumbly hum"], *A)

    # -- L3: Teach Pip high vs low -----------------------------------------
    listen("pitch", 3,
           "Pip the mouse mixes up high and low! Teach him: HIGH like a bird, then "
           "LOW like a bear.",
           "Teach Pip! First HIGH like a bird: wee! Then LOW like a bear: whoo. "
           "Sing it for Pip!",
           *A)
    mc("pitch", 3,
       "Pip asks: is my drum HIGH like a bird or LOW like a bear? Help Pip get it right!",
       "low like a bear",
       ["high like a bird", "squeaky like a mouse", "soft like a whisper"], *A)
    trace("pitch", 3,
          "Draw Hoot's hum! Trace the line that climbs UP, up, up like his note "
          "rising to the sky.",
          "rising hum line", *A)
    mc("pitch", 3,
       "Hoot hums Pip a lullaby: high, low, high. Which note does Pip hear FIRST?",
       "high", ["low", "middle", "both at once"], *A)

    # -- L4: The scrambled music box ---------------------------------------
    listen("pitch", 4,
           "Mystery! Someone scrambled Hoot's music box. Hum the notes back slowly: "
           "low... high... low...",
           "The music box plays: low... high... low... Hum it back slowly with Hoot!",
           *A)
    mc("pitch", 4,
       "The box played high, high, LOW, high. One sneaky LOW note is hiding! "
       "Which one was it?",
       "the third note", ["the first note", "the second note", "the fourth note"],
       *A)
    seq("pitch", 4,
        "Fix the music box! Line the notes up from HIGHEST to LOWEST.",
        ["bird-high note", "middle note", "bear-low note"], *A)
    tt("pitch", 4,
       "One echo in the cave is Hoot's REAL high hum. Tap the HIGHEST echo!",
       "the tippy-top echo",
       ["the middle echo", "the low rumbly echo", "the soft quiet echo"], *A)

    # -- L5: Master quest - compose the lullaby ----------------------------
    listen("pitch", 5,
           "You're the composer now! Teach the band YOUR lullaby: high, low, low, "
           "high. Sing it!",
           "Sing your lullaby for the band: high... low... low... high! "
           "They'll sing it back!",
           *A)
    mc("pitch", 5,
       "Hoot's finale climbs low, middle, high... The last note must soar even "
       "HIGHER. Which ending is right?",
       "higher than high",
       ["low like a bear", "a middle hum", "the same high again"], *A)
    seq("pitch", 5,
        "Line up the whole lullaby for the concert: lowest bear note first, up to "
        "the star-high note!",
        ["bear-low", "middle", "bird-high", "star-high"], *A)
    sort("pitch", 5,
         "Sort the band's sounds by pitch for the big show: HIGH sounds here, LOW "
         "sounds there!",
         {"HIGH sounds": ["flute's toot", "bird's chirp", "Hoot's wee"],
          "LOW sounds": ["drum's boom", "bear's growl", "piano's low plunk"]}, *A)


# ===========================================================================
# INSTRUMENTS — the band's parade
# ===========================================================================
def _instruments() -> None:
    A = AGES["instruments"]

    # -- L1: Meet the band --------------------------------------------------
    tt("instruments", 1,
       "The band is tuning up! Tap the DRUM so Pip can start the concert.",
       "drum", ["trumpet", "violin", "flute"], *A)
    mc("instruments", 1,
       "Hoot wants a buddy to hum with. Which instrument do you play by BLOWING?",
       "flute", ["drum", "violin", "piano"], *A)
    listen("instruments", 1,
           "The band is warming up! Strum along on the guitar: strum, strum, STRUM! "
           "Strum it back!",
           "Strum with the band: strum, strum, STRUM! Strum it back!",
           *A)
    mc("instruments", 1,
       "Pip shakes something that goes chicka-chicka-chick! Which instrument is "
       "Pip playing?",
       "maracas", ["drum", "xylophone", "trumpet"], *A)

    # -- L2: The parade mix-up ----------------------------------------------
    tt("instruments", 2,
       "The parade lineup got mixed up! Tap the TRUMPET - the band needs its loud "
       "parade horn.",
       "trumpet", ["flute", "violin", "drum"], *A)
    mc("instruments", 2,
       "Riff's drumsticks are STILL missing! Which instrument can keep the beat "
       "by SHAKING?",
       "maracas", ["violin", "flute", "piano"], *A)
    tc("instruments", 2,
       "The band lined up their instruments for the parade. Count every instrument "
       "you see!",
       5, "instruments", *A)
    seq("instruments", 2,
        "The parade master needs the band in playing order: drums first, then "
        "horns, then strings. Line them up!",
        ["drum", "trumpet", "violin"], *A)

    # -- L3: Help Pip pick an instrument ------------------------------------
    mc("instruments", 3,
       "Pip wants an instrument he can SHAKE while he marches. Which one fits him best?",
       "maracas", ["violin", "flute", "piano"], *A)
    listen("instruments", 3,
           "Hoot wants to learn the flute! Blow along with him: whooo, whooo, WHEEE! "
           "Blow it back!",
           "Blow with Hoot: whooo... whooo... WHEEE! Now you blow it back!",
           *A)
    tt("instruments", 3,
       "Riff needs a beat-keeper while his drumsticks are missing. Tap the "
       "instrument you play by SHAKING!",
       "maracas", ["drum", "violin", "piano"], *A)
    mc("instruments", 3,
       "Which instrument has STRINGS that you play with a bow?",
       "violin", ["guitar", "piano", "flute"], *A)

    # -- L4: Mystery in the Echo Cave ---------------------------------------
    mc("instruments", 4,
       "Mystery! The Echo Cave hums a lonely plink... plink... Which instrument is "
       "lost in the cave?",
       "piano", ["xylophone", "drum", "trumpet"], *A)
    tt("instruments", 4,
       "Something shiny is hiding in the Echo Cave. Tap the instrument with STRINGS!",
       "violin", ["flute", "trumpet", "drum"], *A)
    listen("instruments", 4,
           "The cave echoes a mystery beat: BOOM-chicka-BOOM! Echo it back so we "
           "can guess the instrument!",
           "Echo the mystery sound: BOOM-chicka-BOOM! Echo it back!",
           *A)
    mc("instruments", 4,
       "That BOOM-chicka-BOOM is big and boomy with a shaky chicka. Which "
       "instrument makes it?",
       "drum", ["maracas", "violin", "flute"], *A)

    # -- L5: Master quest - lead the parade! --------------------------------
    sort("instruments", 5,
         "The grand parade is here! Sort every instrument into its family. Riff's "
         "rule: strings inside count as STRINGS - even the piano!",
         {"things you HIT": ["drum", "xylophone", "maracas"],
          "things with STRINGS": ["violin", "guitar", "piano"],
          "things you BLOW": ["trumpet", "flute"]}, *A)
    mc("instruments", 5,
       "For the grand finale, Riff needs the LOUDEST instrument. Which one shakes "
       "the whole stage?",
       "drum", ["flute", "violin", "maracas"], *A)
    tc("instruments", 5,
       "Every instrument family is marching in the grand parade! Count all the "
       "instruments.",
       8, "instruments", *A)
    listen("instruments", 5,
           "You're leading the parade! Call the beat for each family: BOOM for "
           "drums, TOOT for horns, STRUM for strings!",
           "Lead the parade! Shout: BOOM! TOOT! STRUM! The band follows you - "
           "call it again!",
           *A)


# ===========================================================================
# DANCE — teaching the Loom sprites to dance
# ===========================================================================
def _dance() -> None:
    A = AGES["dance"]

    # -- L1: Copy Riff -------------------------------------------------------
    listen("dance", 1,
           "Hop to it! Riff is doing his bunny hop: hop, hop, HOP! Dance it with him!",
           "Dance with Riff: hop, hop, HOP! Your turn - hop it back!",
           *A)
    mc("dance", 1,
       "Riff showed you two moves: first a twirl, then a hop. Which move came FIRST?",
       "twirl", ["hop", "stomp", "clap"], *A)
    tt("dance", 1,
       "Riff is striking dance poses on stage! Tap the bunny doing the TWIRL.",
       "twirling bunny",
       ["hopping bunny", "sleeping bunny", "stomping bunny"], *A)
    tc("dance", 1,
       "Riff hopped all the way across the stage: hop, hop, hop, hop. Count his hops!",
       4, "hops", *A)

    # -- L2: The Loom sprites want to learn ----------------------------------
    listen("dance", 2,
           "The Loom sprites want to dance! Teach them Riff's move: stomp, stomp, "
           "TWIRL! Do it with him!",
           "Teach the sprites: stomp, stomp, TWIRL! Do it with Riff so they can "
           "copy you!",
           *A)
    seq("dance", 2,
        "The sprites learned three moves but forgot the order! Line them up: hop, "
        "stomp, twirl.",
        ["hop", "stomp", "twirl"], *A)
    mc("dance", 2,
       "A sprite danced hop, hop, hop... then froze. Riff's dance goes hop, hop, "
       "TWIRL. What comes next?",
       "twirl", ["hop", "stomp", "clap"], *A)
    tc("dance", 2,
       "The Loom sprites are hopping in a line behind Riff. Count every hopping "
       "sprite!",
       5, "sprites", *A)

    # -- L3: Help Pip the sprite ---------------------------------------------
    listen("dance", 3,
           "Pip the sprite keeps doing the moves backwards! Show him slowly: hop, "
           "stomp, TWIRL.",
           "Slow it down for Pip: hop... stomp... TWIRL! Do it slowly so Pip can "
           "follow!",
           *A)
    mc("dance", 3,
       "Pip danced twirl, stomp, hop. Riff's dance is hop, stomp, twirl. Which move "
       "is in the WRONG spot?",
       "twirl", ["hop", "stomp", "all of them"], *A)
    trace("dance", 3,
          "Draw the dance path! Trace the curvy line so the sprite can twirl all "
          "the way across the stage.",
          "curvy twirl path", *A)
    seq("dance", 3,
        "Riff taught Pip a brand-new dance! Line it up: stomp first, then hop, then "
        "twirl.",
        ["stomp", "hop", "twirl"], *A)

    # -- L4: The Echo Cave dances backwards ----------------------------------
    listen("dance", 4,
           "Mystery! The Echo Cave copies Riff's dance - but backwards! Copy the "
           "cave: TWIRL, stomp, hop!",
           "The cave dances backwards: TWIRL... stomp... hop! Copy the cave's "
           "silly dance!",
           *A)
    mc("dance", 4,
       "The cave jumbled Riff's dance: hop, twirl, stomp. His REAL dance is hop, "
       "stomp, twirl. What's wrong?",
       "twirl and stomp swapped spots",
       ["hop is in the wrong spot", "nothing is wrong", "a move is missing"], *A)
    tc("dance", 4,
       "Bunny echoes are bouncing all over the cave! Count every hopping echo "
       "you see.",
       6, "hopping echoes", *A)
    trace("dance", 4,
          "The cave mixed up the dance map! Trace the dotted path to lead Riff OUT "
          "of the Echo Cave.",
          "dotted cave path", *A)

    # -- L5: Master quest - dance captain! ------------------------------------
    listen("dance", 5,
           "You're the dance captain now! Make up YOUR finale: hop, hop, stomp, "
           "TWIRL! Teach everyone!",
           "Dance captain, show your finale: hop, hop, stomp, TWIRL! The whole "
           "stage copies YOU!",
           *A)
    seq("dance", 5,
        "The crowd voted on the finale! Line it up: twirl first, then hop, then "
        "stomp, then FREEZE!",
        ["twirl", "hop", "stomp", "FREEZE"], *A)
    mc("dance", 5,
       "For the biggest finish ever, the last move must be BOLD. Which ending is "
       "the boldest?",
       "FREEZE with arms up", ["a tiny hop", "a slow tiptoe", "a little bow"],
       *A)
    sort("dance", 5,
         "Sort the finale moves, dance captain: BOUNCY moves in one group, SPINNY "
         "moves in another!",
         {"BOUNCY moves": ["hop", "stomp", "jump"],
          "SPINNY moves": ["twirl", "spin", "whirl"]}, *A)


def build() -> None:
    """Register all 80 music activities (4 skills x 5 levels x 4)."""
    _rhythm()
    _pitch()
    _instruments()
    _dance()
