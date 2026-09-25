#!/usr/bin/env python3
"""Sky Phase 3 — CODING content module. Host: Milo the robot.
Island: The Loom Cloud. Story friends: Sprocket the mouse inventor and
the Loom sprites (tiny weavers whose patterns unravel when the code breaks).

Every activity frames the child as a programmer giving instructions to a
character or machine — never an abstract worksheet question.
"""
from core import mc, tt, tc, seq, sort, trace, listen, AGES  # noqa: F401

SK = "sequencing"
PC = "patterns_coding"
LO = "loops"
CO = "conditions"
DE = "debugging"


def _s():
    return AGES[SK][0], AGES[SK][1]


def _p():
    return AGES[PC][0], AGES[PC][1]


def _l():
    return AGES[LO][0], AGES[LO][1]


def _c():
    return AGES[CO][0], AGES[CO][1]


def _d():
    return AGES[DE][0], AGES[DE][1]


# ---------------------------------------------------------------------------
# sequencing — L1 welcomes Milo, L5 writes master algorithms
# ---------------------------------------------------------------------------
def sequencing():
    a0, a1 = _s()
    # L1 — welcome
    seq(SK, 1, "BEEP! Milo woke up but his morning is all jumbled. Can you put his routine in order?",
        ["Wake up", "Brush gears", "Drink oil-juice"], a0, a1)
    seq(SK, 1, "WHIRR! Sprocket wants toast but the steps are mixed up. Line them up for him!",
        ["Put bread in the toaster", "Wait for the POP", "Spread jam"], a0, a1)
    mc(SK, 1, "BEEP! Milo wants to fly his kite. What should he do FIRST?",
       "Run with the string", ["Reel it all in", "Let go of the string", "Fold the kite up"], a0, a1)
    seq(SK, 1, "WHIRR! Sprocket is planting a moon-seed for the sprites. Show him the steps in order!",
        ["Dig a hole", "Drop in the seed", "Water it"], a0, a1)
    # L2 — the plot thickens
    seq(SK, 2, "BEEP! The cloud bridge needs its steps in order or it won't open. Line them up!",
        ["Find the brass key", "Turn the key", "Push the gate", "March across"], a0, a1)
    seq(SK, 2, "WHIRR! Sprocket's rocket is ready but the launch code is scrambled. Fix the order!",
        ["Fill the fuel tank", "Bolt on the fins", "Count down 3-2-1", "Press the red button"], a0, a1)
    mc(SK, 2, "BEEP! Milo's bubble bath is ready. What is the LAST thing he should do?",
       "Dry off with a towel", ["Climb into the tub", "Turn on the water", "Add bubble soap"], a0, a1)
    seq(SK, 2, "WHIRR! The sprites are baking star-cookies for Milo. Put their recipe in order!",
        ["Stir the dough", "Scoop little balls", "Bake them golden", "Cool on the rack"], a0, a1)
    # L3 — help a friend
    seq(SK, 3, "BEEP! Sprocket's tea party is a muddle! Order the steps so his friends get tea.",
        ["Boil the kettle", "Drop in the tea leaf", "Pour the hot water", "Pass the cups around"], a0, a1)
    mc(SK, 3, "WHIRR! Sprocket lost his kite steps. After he runs with the kite, what comes NEXT?",
       "Let out more string", ["Fold the kite up", "Run back indoors", "Cut the string"], a0, a1)
    seq(SK, 3, "BEEP! Sprocket must deliver lunchboxes before noon. Order his delivery route!",
        ["Pack the lunchbox", "Ring Mia's bell", "Hand over the box", "Wave goodbye"], a0, a1)
    seq(SK, 3, "WHIRR! The Loom sprites are thirsty! Order the steps to water the moonflower.",
        ["Carry water up the cloud", "Dig the soft soil", "Tuck in the seed", "Sing a growing song"], a0, a1)
    # L4 — the mystery
    seq(SK, 4, "BEEP! Someone nibbled Milo's midnight cookie! Order the clues to solve the mystery.",
        ["Crumbs led to the pantry", "A tiny gear lay nearby", "Sprocket was polishing tools", "Sprocket confessed: one nibble!"], a0, a1)
    seq(SK, 4, "WHIRR! The red thread snapped and the weaving drooped! Order what happened.",
        ["The red thread snapped at dawn", "Blue threads tangled by lunch", "The weaving drooped low", "Milo found the loose knot"], a0, a1)
    mc(SK, 4, "BEEP! The cloud fountain stopped and the pipes are dry! What should Milo check FIRST?",
       "The water tank", ["The pump switch", "The inlet hose", "The drain plug"], a0, a1)
    seq(SK, 4, "WHIRR! The cloud race is over! The signal flags tell the order — line up what happened.",
        ["The horn blew to start", "The red sprite zoomed ahead", "The blue sprite caught up", "The green sprite won by a whisker"], a0, a1)
    # L5 — master quest
    seq(SK, 5, "BEEP! You are the master builder now! Program the breakfast machine — six steps, perfect order.",
        ["Crack two eggs", "Whisk them fluffy", "Heat the pan", "Pour the eggs in", "Flip the omelet", "Slide it onto the plate"], a0, a1)
    seq(SK, 5, "WHIRR! The cloudship launches at dawn! Order the master launch code.",
        ["Check the wind dial", "Load the star maps", "Buckle every seatbelt", "Shout ALL ABOARD", "Release the mooring ropes"], a0, a1)
    mc(SK, 5, "BEEP! Master coder, Milo's parade needs a plan. Which step must come FIRST in any parade?",
       "Line everyone up", ["Wave to the crowd", "Play the drums", "Take a bow"], a0, a1)
    seq(SK, 5, "WHIRR! Write Milo's bedtime shutdown code! Order it so he dreams sweetly.",
        ["Dim the eye-lights", "Fold the arms in", "Hum the sleep song", "Power down softly", "Dream of tomorrow"], a0, a1)


# ---------------------------------------------------------------------------
# patterns_coding — the Loom sprites weave; the child keeps the pattern alive
# ---------------------------------------------------------------------------
def patterns_coding():
    a0, a1 = _p()
    # L1 — welcome: copy AB patterns
    mc(PC, 1, "BEEP! The Loom sprites are weaving: red, blue, red, blue... The pattern snagged! Which color comes next?",
       "red", ["blue", "green", "yellow"], a0, a1)
    mc(PC, 1, "WHIRR! The sprites dance: clap, stomp, clap, stomp... Show them the next move!",
       "clap", ["stomp", "spin", "hop"], a0, a1)
    tt(PC, 1, "BEEP! Sprocket's bead string goes: star, heart, star, heart... Tap the bead that comes next!",
       "star", ["heart", "circle", "square"], a0, a1)
    mc(PC, 1, "WHIRR! Milo's music box plays: ding, dong, ding, dong... What plays next?",
       "ding", ["dong", "buzz", "beep"], a0, a1)
    # L2 — the plot thickens: AAB, ABB, ABC
    mc(PC, 2, "BEEP! The weaving changed: red, red, blue, red, red... Which color keeps the pattern?",
       "blue", ["red", "green", "yellow"], a0, a1)
    mc(PC, 2, "WHIRR! The sprites stomp a new dance: stomp, stomp, clap, stomp, stomp... Next move?",
       "clap", ["stomp", "spin", "hop"], a0, a1)
    mc(PC, 2, "BEEP! Sprocket's flags wave: circle, square, triangle, circle, square... Which shape is next?",
       "triangle", ["circle", "square", "star"], a0, a1)
    tt(PC, 2, "WHIRR! Milo's drum plays: tap, tap, BANG, tap, tap... Tap the drum sound that comes next!",
       "BANG", ["tap", "clap", "buzz"], a0, a1)
    # L3 — help a friend
    mc(PC, 3, "BEEP! The sprites' blanket is unraveling in the MIDDLE: red, blue, ___, red, blue. Which color fills the hole?",
       "red", ["blue", "green", "yellow"], a0, a1)
    mc(PC, 3, "WHIRR! Teach Sprocket's toy drum: tap, tap, BANG, tap, tap... What comes next?",
       "BANG", ["tap", "rest", "clap"], a0, a1)
    tc(PC, 3, "BEEP! The sprites danced clap-stomp four times. How many CLAPS did they do? Count with me!",
       4, "claps", a0, a1)
    mc(PC, 3, "WHIRR! Mia's bracelet goes: heart, star, star, heart, star... Which bead comes next?",
       "star", ["heart", "circle", "diamond"], a0, a1)
    # L4 — the mystery
    mc(PC, 4, "BEEP! A mystery pattern grows: 1 clap, 2 claps, 3 claps... How many claps come next?",
       "4 claps", ["3 claps", "5 claps", "1 clap"], a0, a1)
    mc(PC, 4, "WHIRR! The weaving has a SNAG: red, blue, red, GREEN, red, blue... Which thread broke the pattern?",
       "green", ["blue", "red", "yellow"], a0, a1)
    mc(PC, 4, "BEEP! Sprocket's singing stairs grow: small, medium... What size step comes next?",
       "large", ["small", "medium", "tiny"], a0, a1)
    seq(PC, 4, "WHIRR! The pattern machine printed its tower code out of order. Rebuild the growing tower!",
        ["1 block", "2 blocks", "3 blocks", "4 blocks"], a0, a1)
    # L5 — master quest
    mc(PC, 5, "BEEP! Master weaver! The royal blanket grows: 2 red, 4 red, 6 red... How many red threads in the next row?",
       "8 red threads", ["7 red threads", "6 red threads", "10 red threads"], a0, a1)
    mc(PC, 5, "WHIRR! The sprites dance TWO patterns at once: clap, red, stomp, blue, clap, red... What comes next?",
       "stomp", ["clap", "blue", "spin"], a0, a1)
    mc(PC, 5, "BEEP! You invented a pattern: circle, circle, square... What comes next to keep YOUR rule?",
       "circle", ["square", "triangle", "star"], a0, a1)
    seq(PC, 5, "WHIRR! The grand parade needs YOUR pattern code! Lay the parade order.",
        ["Drums first", "Flags next", "Drums again", "Flags to finish"], a0, a1)


# ---------------------------------------------------------------------------
# loops — the breakfast machine repeats; the child counts the rounds
# ---------------------------------------------------------------------------
def loops():
    a0, a1 = _l()
    # L1 — welcome: repeat an action
    tc(LO, 1, "BEEP! Milo's hop-loop is stuck! He hops 3 times. Tap once for each hop!",
       3, "hops", a0, a1)
    tc(LO, 1, "WHIRR! The breakfast machine toasts 4 slices. Count the slices with me!",
       4, "slices", a0, a1)
    mc(LO, 1, "BEEP! Sprocket winds his toy: turn, turn, turn, turn. How many turns did the loop do?",
       "4 turns", ["3 turns", "5 turns", "1 turn"], a0, a1)
    listen(LO, 1, "WHIRR! Chant Milo's loop song with him! Say it loud and proud!",
           "Round and round the gears go!", a0, a1)
    # L2 — the plot thickens
    tc(LO, 2, "BEEP! The breakfast machine runs 2 rounds, pouring 3 pancakes each round. How many pancakes in all?",
       6, "pancakes", a0, a1)
    tc(LO, 2, "WHIRR! Milo's dance loop is spin, hop, and he does it 3 times. Tap once for EVERY move he makes!",
       6, "moves", a0, a1)
    tc(LO, 2, "BEEP! Sprocket's sprinkler puffs 2 times in each of 4 rounds. Count all the puffs!",
       8, "puffs", a0, a1)
    seq(LO, 2, "WHIRR! Program the toast loop! Order the steps the machine repeats.",
        ["Drop the bread", "Toast it golden", "Pop it up"], a0, a1)
    # L3 — help a friend
    tc(LO, 3, "BEEP! Sprocket's kite needs 5 tugs on the string, 2 rounds. How many tugs will fly it?",
       10, "tugs", a0, a1)
    mc(LO, 3, "WHIRR! The Loom sprites weave 4 threads, 3 rounds. How many threads did they weave?",
       "12 threads", ["7 threads", "9 threads", "8 threads"], a0, a1)
    sort(LO, 3, "BEEP! Sprocket's machine does some steps ONCE and some on REPEAT. Sort them!",
         {"Do once": ["Press the green button", "Open the lid"],
          "Repeat": ["Stir the soup", "Sprinkle the salt"]}, a0, a1)
    mc(LO, 3, "WHIRR! Milo waters the moonflowers: 2 cups per flower, 5 flowers. How many cups?",
       "10 cups", ["7 cups", "5 cups", "12 cups"], a0, a1)
    # L4 — the mystery
    mc(LO, 4, "BEEP! Mystery! The cookie machine was set for 3 rounds of 4, but 16 cookies came out. How many rounds REALLY ran?",
       "4 rounds", ["3 rounds", "5 rounds", "2 rounds"], a0, a1)
    tc(LO, 4, "WHIRR! The loop counter broke! The bell rings once per round. Count the rings to find the rounds!",
       5, "rings", a0, a1)
    mc(LO, 4, "BEEP! Sprocket's toy hopped 12 times in hops of 3. How many loops did it do?",
       "4 loops", ["3 loops", "6 loops", "9 loops"], a0, a1)
    trace(LO, 4, "WHIRR! Draw the loop arrow! Trace the circle that tells Milo's arm to stir again and again.",
          "a round loop arrow", a0, a1)
    # L5 — master quest
    mc(LO, 5, "BEEP! Master coder! The loom weaves 6 threads per round for 5 rounds, then 2 extra threads. How many threads in all?",
       "32 threads", ["30 threads", "13 threads", "42 threads"], a0, a1)
    tc(LO, 5, "WHIRR! Count the master loop! The parade drum beats 4 times per round, 6 rounds. Count every beat!",
       24, "drum beats", a0, a1)
    mc(LO, 5, "BEEP! Milo's rocket test runs 3 countdowns of 10, 9, 8. How many numbers does he say in all?",
       "9 numbers", ["3 numbers", "10 numbers", "30 numbers"], a0, a1)
    seq(LO, 5, "WHIRR! Write the master weaving loop! Order it so it never tangles.",
        ["Start with a red thread", "Loop: weave under, then over", "Check the pattern", "Tie the knot to finish"], a0, a1)


# ---------------------------------------------------------------------------
# conditions — IF this, THEN that; Milo's rule machines
# ---------------------------------------------------------------------------
def conditions():
    a0, a1 = _c()
    # L1 — welcome: if-then choices
    mc(CO, 1, "BEEP! Milo's rule: IF it rains, Sprocket takes the umbrella. Look outside — it's raining! What does Sprocket take?",
       "The umbrella", ["The sunglasses", "The kite", "The sandwich"], a0, a1)
    mc(CO, 1, "WHIRR! Milo's rule: IF the light is green, the cloudship goes. The light is green! What happens?",
       "The cloudship goes", ["The cloudship stops", "The cloudship waits", "The cloudship turns back"], a0, a1)
    tt(CO, 1, "BEEP! Milo's rule: IF you're hungry, grab the snack! Sprocket's tummy is rumbling. Tap his snack!",
       "apple", ["toy car", "book", "hat"], a0, a1)
    mc(CO, 1, "WHIRR! Milo's rule: IF Milo is beeping, his battery is low. Milo is beeping! What does he need?",
       "A battery charge", ["More oil", "A quick nap", "A polish"], a0, a1)
    # L2 — the plot thickens
    mc(CO, 2, "BEEP! The bridge rule: IF you hold the brass key, the bridge opens. Sprocket holds the brass key! What happens?",
       "The bridge opens", ["The bridge stays shut", "The bridge asks again", "Nothing happens yet"], a0, a1)
    mc(CO, 2, "WHIRR! Milo's oven rule: IF the bell dings, the cookies are done. DING DING! What do we do?",
       "Take the cookies out", ["Put them in", "Wait longer", "Turn up the heat"], a0, a1)
    mc(CO, 2, "BEEP! Sprocket's rule: IF the tank is full, the rocket can launch. The tank is only half full! Can it launch?",
       "Not yet — fill the tank", ["Yes, blast off!", "Yes, with half power", "No, never again"], a0, a1)
    tt(CO, 2, "WHIRR! Milo's rule: IF the sprite is sleepy, bring its blanket! Which sprite is yawning? Tap its blanket!",
       "sleepy sprite's blanket", ["dancing sprite's drum", "hungry sprite's apple", "singing sprite's bell"], a0, a1)
    # L3 — help a friend
    mc(CO, 3, "BEEP! Picnic rule: IF the sun shines, Sprocket packs the basket. The sun is shining! Help him — what does he pack?",
       "The picnic basket", ["The umbrella", "The snow boots", "The flashlight"], a0, a1)
    mc(CO, 3, "WHIRR! Milo's rule: IF the music plays, the sprites dance. The music stopped! What do the sprites do?",
       "They rest", ["They keep dancing", "They dance faster", "They never stop"], a0, a1)
    mc(CO, 3, "BEEP! Sprocket is shivering! His rule: IF I'm cold, I wear my scarf. What should you hand him?",
       "His red scarf", ["His sunglasses", "His rain boots", "His party hat"], a0, a1)
    seq(CO, 3, "WHIRR! Teach the baby sprites Milo's rainy-day rule! Put the rule in order.",
        ["IF dark clouds gather", "grab the big umbrella", "THEN march outside"], a0, a1)
    # L4 — the mystery: AND / OR
    mc(CO, 4, "BEEP! Picnic rule: IF it is sunny AND the basket is packed, they picnic. It is sunny, but the basket is EMPTY! Do they picnic?",
       "Not yet — pack first", ["Yes, picnic now!", "Yes, but indoors", "No picnics ever"], a0, a1)
    mc(CO, 4, "WHIRR! The gate rule: IF you know the password OR you have the key, it opens. Mia forgot the password but HAS the key! Does it open?",
       "Yes — the key works", ["No — needs both", "No — password only", "No — she must wait"], a0, a1)
    mc(CO, 4, "BEEP! Mystery! The bridge stayed shut. The rule: IF brass key, it opens. What MUST be true?",
       "Nobody held the brass key", ["Everyone held the key", "The key was shiny", "The lock was new"], a0, a1)
    tc(CO, 4, "WHIRR! Milo's rule: IF the bell dings three times, class starts. It dinged twice! How many MORE dings?",
       1, "more dings", a0, a1)
    # L5 — master quest
    mc(CO, 5, "BEEP! Master rule-writer! The vault opens IF you turn the key AND say the word. Sam turned the key but stayed silent! Does it open?",
       "No — say the word too", ["Yes — the key is enough", "Yes — silence counts", "No — turn it again"], a0, a1)
    mc(CO, 5, "WHIRR! Program the cloudship: IF storm clouds gather OR the wind howls, land now! The wind howls on a clear day! What does the ship do?",
       "It lands", ["It keeps flying", "It speeds up", "It lands tomorrow"], a0, a1)
    seq(CO, 5, "BEEP! Write Milo's bedtime code! Order the rule that keeps his dreams safe.",
        ["IF the moon rises", "THEN dim the eye-lights", "AND hum the sleep song", "ELSE keep watch"], a0, a1)
    mc(CO, 5, "WHIRR! Sprocket's plant rule: IF the soil is dry, water it. The soil is damp! Should you water it?",
       "No — wait until dry", ["Yes — water it now", "Yes — twice as much", "Repot it instead"], a0, a1)


# ---------------------------------------------------------------------------
# debugging — spot it, fix it, like a real engineer
# ---------------------------------------------------------------------------
def debugging():
    a0, a1 = _d()
    # L1 — welcome: spot the wrong step
    mc(DE, 1, "BEEP! Milo's toast program: 1 Freeze the bread, 2 Toast it golden, 3 Spread jam. Which step is BROKEN?",
       "Freeze the bread", ["Toast it golden", "Spread jam", "All steps are fine"], a0, a1)
    mc(DE, 1, "WHIRR! Sprocket's kite code: 1 Run with the kite, 2 Let go of the string, 3 Watch it soar. Which step breaks it?",
       "Let go of the string", ["Run with the kite", "Watch it soar", "All steps are fine"], a0, a1)
    tt(DE, 1, "BEEP! The sprite dance code says: clap, stomp, NAP, clap, stomp. Tap the move that does NOT belong!",
       "nap", ["clap", "stomp", "spin"], a0, a1)
    mc(DE, 1, "WHIRR! Milo's bath program: 1 Fill the tub, 2 Drain the tub, 3 Climb in. Which step is in the WRONG place?",
       "Drain the tub", ["Fill the tub", "Climb in", "All steps are fine"], a0, a1)
    # L2 — the plot thickens
    seq(DE, 2, "BEEP! Sprocket's sandwich machine mixed up the order! Fix the code.",
        ["Lay the bread down", "Add cheese and tomato", "Close the sandwich", "Take a big bite"], a0, a1)
    tt(DE, 2, "WHIRR! The loom wove: red, blue, red, blue, YELLOW, red, blue. Tap the thread that broke the weaving!",
       "yellow", ["blue", "red", "green"], a0, a1)
    mc(DE, 2, "BEEP! Milo's counting code prints: 1, 2, 3, 5... Which number should come right after 3?",
       "4", ["5", "3", "6"], a0, a1)
    mc(DE, 2, "WHIRR! The watering robot: 1 Check the soil, 2 Flood the pot, 3 Walk away. Sprocket's plant drooped! Which step drowned it?",
       "Flood the pot", ["Check the soil", "Walk away", "All steps are fine"], a0, a1)
    # L3 — help a friend
    seq(DE, 3, "BEEP! Sprocket's toy marches BACKWARD! Reorder its steps so it marches forward.",
        ["Lift the left foot", "Put it down in front", "Lift the right foot", "Put it down in front"], a0, a1)
    mc(DE, 3, "WHIRR! The music box plays: ding, dong, BANG, ding, dong. Sprocket covers his ears! Which sound is the bug?",
       "BANG", ["ding", "dong", "the pause"], a0, a1)
    mc(DE, 3, "BEEP! Milo's morning code: 1 Wake up, 2 Brush gears, 3 Go back to sleep, 4 Drink oil-juice. Sprocket says step 3 is sneaky! Is he right?",
       "Yes — delete step 3", ["No — keep it", "Move it to step 1", "Add another nap"], a0, a1)
    tc(DE, 3, "WHIRR! Count the bugs! Sprocket's kite string has 5 knots, but only 2 should be there. How many EXTRA knots?",
       3, "extra knots", a0, a1)
    # L4 — the mystery
    mc(DE, 4, "BEEP! Mystery! The weaving unraveled overnight, but the code was perfect! What should Milo check FIRST?",
       "What changed overnight", ["Rewrite all the code", "Buy a new loom", "The weather"], a0, a1)
    seq(DE, 4, "WHIRR! The parade code tangled! The drums play when the flags should wave. Untangle it!",
        ["Drums boom", "Flags wave", "Drums boom", "Flags wave"], a0, a1)
    mc(DE, 4, "BEEP! Sprocket's bridge code: IF key THEN open. He HAS a key, but the bridge stays shut! What's the most likely bug?",
       "He holds the wrong key", ["The bridge needs paint", "The rule needs deleting", "Wait until tomorrow"], a0, a1)
    mc(DE, 4, "WHIRR! Milo's loop stirs the soup 10 times, but it's still lumpy! The code is fine — what's the REAL bug?",
       "The spoon fell out", ["Stir faster", "Count higher", "A bigger pot"], a0, a1)
    # L5 — master quest
    seq(DE, 5, "BEEP! Master debugger! Sprocket's rocket code is scrambled. Fix all five steps!",
        ["Load the fuel", "Bolt the fins tight", "Count down 3-2-1", "Press the red button", "Wave it goodbye"], a0, a1)
    mc(DE, 5, "WHIRR! The grand loom stopped mid-blanket. A GREEN thread sits in the red-blue pattern, and a red end hangs LOOSE. Which bug do you fix FIRST?",
       "The loose red end", ["The green thread", "Both at once", "Neither — start over"], a0, a1)
    mc(DE, 5, "BEEP! Milo's rule: IF the bell dings THEN the cookies are done. The bell dinged, but the cookies are raw! The bell works fine. What's broken?",
       "The bell rang too early", ["The bell is broken", "The oven forgot how", "Bake them less"], a0, a1)
    listen(DE, 5, "WHIRR! Teach the baby sprites Milo's debugger chant! Say it with me, master debugger!",
           "Find the bug, fix it with a hug!", a0, a1)


def build() -> None:
    sequencing()
    patterns_coding()
    loops()
    conditions()
    debugging()
