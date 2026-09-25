#!/usr/bin/env python3
"""Sky Phase 3 math content — Milo's Number Volcano workshop.

Host: Milo the robot (enthusiastic inventor: "BEEP! My counting machine
is stuck..."). Story friends: Bolt the firefly (flashes to count),
Sprocket the mouse inventor (builds gadgets with Milo), and the Number
Volcano itself (rumbles happily when counted right, hiccups when numbers
go wrong).

Recurring scenarios: counting volcano rocks, fixing Milo's counting
machine, loading the rocket with fuel crystals, repairing the Pattern
Bridge, sharing star-berries fairly.

8 skills x 5 levels x 4 activities = 160 activities.
"""
from core import mc, tt, tc, seq, sort, trace, listen, AGES


def build() -> None:
    _count()
    _cardinality()
    _compare_order()
    _add()
    _subtract()
    _place_value()
    _shapes_patterns()
    _fractions()


# ---------------------------------------------------------------------------
# count (3-6): L1 counts to 5 -> L5 counts to 30+, skip counting
# ---------------------------------------------------------------------------
def _count() -> None:
    A = AGES["count"]

    # L1 — welcome: meet Bolt and the counting machine
    tc("count", 1,
       "BEEP! Bolt the firefly is flashing hello. Tap once for each flash you see!",
       3, "firefly flashes", *A)
    tc("count", 1,
       "The Number Volcano hiccuped and out tumbled some warm rocks. Tap each rock to count them!",
       4, "volcano rocks", *A)
    mc("count", 1,
       "Sprocket dropped his gears — plip, plop! Milo sees 2 gears, then 1 more rolls out. How many gears?",
       "3", ["2", "4", "1"], *A)
    tt("count", 1,
       "Tap the number on Milo's machine: Bolt flashed 5 times!",
       "5", ["4", "6", "3"], *A,
       narration="Bolt flashed five times. Tap the number five.")

    # L2 — the plot thickens: Sprocket's gear bag bursts
    tc("count", 2,
       "Sprocket's gear bag burst open! Tap each gear to help him count them all.",
       7, "brass gears", *A)
    tc("count", 2,
       "Bolt found a basket of star-berries for the rocket crew. Tap each berry to count them.",
       9, "star-berries", *A)
    mc("count", 2,
       "Milo's counting machine blinked 6 times, then 2 more times. What number did the machine record?",
       "8", ["7", "9", "6"], *A)
    seq("count", 2,
        "Oh no — the machine printed Bolt's flashes out of order! Put them back in counting order.",
        ["1 flash", "2 flashes", "3 flashes", "4 flashes", "5 flashes"], *A)

    # L3 — help a friend: Bolt lost count
    tc("count", 3,
       "Bolt lost count of his own flashes and feels wobbly. Count them with him — tap each flash!",
       12, "firefly flashes", *A)
    mc("count", 3,
       "Sprocket packed a box of crystal bolts and forgot the total. Milo counted 14. Which number goes on the label?",
       "14", ["13", "15", "41"], *A)
    tt("count", 3,
       "Bolt needs the number 13 for his flash code. Tap 13!",
       "13", ["31", "12", "14"], *A,
       narration="Tap the number thirteen.")
    listen("count", 3,
           "Bolt's secret count-code goes 11, 12, 13, 14. Say it with Milo so the volcano rumbles happily!",
           "Eleven, twelve, thirteen, fourteen!", *A)

    # L4 — the mystery: the hiccup scrambles the stones
    seq("count", 4,
        "The volcano hiccuped and scrambled Milo's number stones! Line them up from 16 to 20.",
        ["16", "17", "18", "19", "20"], *A)
    mc("count", 4,
       "Milo's machine shows 17, 19, 18, 20 in a jumble. Which number is missing from 16 to 20?",
       "16", ["17", "15", "21"], *A)
    tc("count", 4,
       "Midnight crystals for the rocket — they only glow if you count every one. Tap each crystal!",
       18, "midnight crystals", *A)
    trace("count", 4,
          "Trace the glowing number trail from 10 to 20 to guide Bolt safely home.",
          "the glowing number trail from 10 to 20", *A)

    # L5 — master quest: skip-counting for the grand show
    seq("count", 5,
        "Bolt learned to skip-count by twos! Lay out his flash pattern for the grand show.",
        ["2", "4", "6", "8", "10"], *A)
    seq("count", 5,
        "Now by fives — the volcano LOVES fives! Order Bolt's big flash code.",
        ["5", "10", "15", "20", "25"], *A)
    mc("count", 5,
       "Bolt flashes 5, 10, 15... Milo holds his breath. What number comes next?",
       "20", ["16", "25", "18"], *A)
    tc("count", 5,
       "The master launch needs every fuel crystal counted. Tap each one — the whole volcano is watching!",
       30, "fuel crystals", *A)


# ---------------------------------------------------------------------------
# cardinality (3-6): L1 "how many" small sets -> L5 compares quantities
# ---------------------------------------------------------------------------
def _cardinality() -> None:
    A = AGES["cardinality"]

    # L1 — welcome: how many flashes in the jar?
    tc("cardinality", 1,
       "Bolt flashed some flashes into Milo's jar. Tap once for each flash to find how many!",
       3, "flashes in the jar", *A)
    mc("cardinality", 1,
       "Sprocket dropped 4 gears into the oil pan — sploosh! How many gears are in the pan?",
       "4", ["3", "5", "2"], *A)
    tt("cardinality", 1,
       "Milo packed two baskets of star-berries. Tap the basket that holds exactly 2 berries!",
       "2 star-berries", ["1 star-berry", "3 star-berries", "4 star-berries"], *A,
       narration="Tap the basket that holds exactly two star-berries.")
    listen("cardinality", 1,
           "Milo is teaching the volcano to count berries: one berry, two berries, three berries! Say it with him!",
           "One berry, two berries, three berries!", *A)

    # L2 — the plot thickens: bigger jars, mixed-up labels
    tc("cardinality", 2,
       "The workshop shelf is covered in loose screws! Tap each screw to find how many.",
       8, "loose screws", *A)
    mc("cardinality", 2,
       "Bolt flashed 9 times into the counting jar. Milo peeked: 8, 9, or 10? How many flashes are in the jar?",
       "9", ["8", "10", "7"], *A)
    sort("cardinality", 2,
         "Sprocket's counting jars got mixed up! Sort them: jars holding 5 crystals, and jars holding 6 crystals.",
         {"5 crystals": ["five red crystals", "five blue crystals", "five green crystals"],
          "6 crystals": ["six red crystals", "six blue crystals", "six green crystals"]}, *A)
    seq("cardinality", 2,
        "Line up Milo's jars from fewest crystals to most crystals.",
        ["4 crystals", "5 crystals", "6 crystals", "7 crystals"], *A)

    # L3 — help a friend: Sprocket miscounted
    mc("cardinality", 3,
       "Sprocket needs 12 bolts for his gadget. He counted 10 in the tray and 2 on the floor. How many bolts is that?",
       "12", ["11", "13", "10"], *A)
    tc("cardinality", 3,
       "Bolt's flashes are hiding in the tall grass! Tap each flash to count them all.",
       11, "hidden flashes", *A)
    tt("cardinality", 3,
       "Milo's machine is dizzy. Tap the pile that holds exactly 10 bolts!",
       "10 bolts", ["9 bolts", "11 bolts", "12 bolts"], *A,
       narration="Tap the pile that holds exactly ten bolts.")
    trace("cardinality", 3,
          "Trace a counting circle around each gear so Milo can count them one by one.",
          "a counting circle around the gears", *A)

    # L4 — the mystery: which jar holds more?
    mc("cardinality", 4,
       "Jar A holds 14 crystals. Jar B holds 17. Milo's machine can't tell which holds more. How many MORE crystals does the fuller jar hold?",
       "3", ["2", "4", "31"], *A)
    tc("cardinality", 4,
       "The volcano coughed up moon-pebbles! Count them before they roll away!",
       16, "moon-pebbles", *A)
    seq("cardinality", 4,
        "The hiccup scattered Milo's crystal jars! Line them up from fewest to most.",
        ["13 crystals", "14 crystals", "15 crystals", "16 crystals"], *A)
    tt("cardinality", 4,
       "Bolt swears he flashed 18 times. Tap the number 18 to check his story!",
       "18", ["16", "17", "19"], *A,
       narration="Tap the number eighteen.")

    # L5 — master quest: the great volcano count-off
    mc("cardinality", 5,
       "The great count-off! Sprocket gathered 24 gears. Milo gathered 19. How many MORE gears does Sprocket have?",
       "5", ["4", "6", "15"], *A)
    sort("cardinality", 5,
         "The volcano judges the count-off! Sort the number stones: less than 20, or 20 and more.",
         {"Less than 20": ["17", "19", "18"],
          "20 or more": ["23", "21", "25"]}, *A)
    tt("cardinality", 5,
       "Two berry baskets: one holds 26 berries, one holds 23. Tap the basket with MORE berries!",
       "26 star-berries", ["23 star-berries", "24 star-berries", "25 star-berries"], *A,
       narration="Tap the basket holding more star-berries: twenty-six or twenty-three?")
    tc("cardinality", 5,
       "The master launch needs 29 fuel crystals and not one fewer. Tap each crystal to prove the count!",
       29, "fuel crystals", *A)


# ---------------------------------------------------------------------------
# compare_order (4-7): L1 bigger/smaller -> L5 orders numbers to 50
# ---------------------------------------------------------------------------
def _compare_order() -> None:
    A = AGES["compare_order"]

    # L1 — welcome: big piles and small gears
    tt("compare_order", 1,
       "The volcano loves BIG piles! Tap the biggest rock pile!",
       "7 rocks", ["3 rocks", "5 rocks", "4 rocks"], *A,
       narration="Tap the biggest pile of rocks.")
    mc("compare_order", 1,
       "Sprocket's tiny gear has 2 teeth. Milo's big gear has 6 teeth. Which gear is smaller?",
       "2 teeth", ["6 teeth", "4 teeth", "5 teeth"], *A)
    sort("compare_order", 1,
         "Tidy the workshop! Sort the number cards into Big numbers and Small numbers.",
         {"Big numbers": ["8", "9", "7"],
          "Small numbers": ["2", "3", "4"]}, *A)
    listen("compare_order", 1,
           "Milo's rule: 8 is bigger than 3! Shout it with him so the volcano rumbles!",
           "Eight is bigger than three!", *A)

    # L2 — the plot thickens: jumbled volcano steps
    seq("compare_order", 2,
        "The volcano steps are jumbled! Put the stepping stones in order from smallest to biggest.",
        ["1", "2", "3", "4"], *A)
    mc("compare_order", 2,
       "Bolt's flash scores: 9, 12, 7, 10. Which flash was the BIGGEST?",
       "12", ["9", "10", "7"], *A)
    trace("compare_order", 2,
          "Trace the path from the small rock to the big rock so Bolt can hop across!",
          "the path from the small rock to the big rock", *A)
    tt("compare_order", 2,
       "Sprocket lost his smallest gear! Tap the smallest gear to find it.",
       "5 teeth", ["8 teeth", "6 teeth", "9 teeth"], *A,
       narration="Tap the smallest gear.")

    # L3 — help a friend: Sprocket's inventions are out of order
    seq("compare_order", 3,
        "Sprocket lined up his inventions all wrong! Fix the row from smallest number to biggest.",
        ["6", "7", "8", "9", "10"], *A)
    mc("compare_order", 3,
       "Milo's rocket dials must read 11, 12, 13, 14, 15 in order. Which number comes right after 12?",
       "13", ["12", "14", "11"], *A)
    sort("compare_order", 3,
         "Sprocket's number stones rolled everywhere! Sort them: smaller than 10, or bigger than 10.",
         {"Smaller than 10": ["8", "9", "7"],
          "Bigger than 10": ["12", "14", "11"]}, *A)
    listen("compare_order", 3,
           "Help Sprocket count his dials in order: eleven, twelve, thirteen! Say it with Milo!",
           "Eleven, twelve, thirteen!", *A)

    # L4 — the mystery: scrambled stones after the hiccup
    seq("compare_order", 4,
        "The hiccup scrambled the volcano's number stones! Line them up from 21 to 25.",
        ["21", "22", "23", "24", "25"], *A)
    mc("compare_order", 4,
       "The stones read 27, 29, 28 in a jumble. Which line shows them in order from smallest?",
       "27, 28, 29", ["27, 29, 28", "28, 27, 29", "29, 28, 27"], *A)
    tt("compare_order", 4,
       "One stone is missing: 23, 24, __, 26. Tap the missing number!",
       "25", ["24", "26", "27"], *A,
       narration="Twenty-three, twenty-four, blank, twenty-six. Tap the missing number.")
    trace("compare_order", 4,
          "Trace the lava's number trail from 20 to 30 to find where the missing stone rolled!",
          "the lava number trail from 20 to 30", *A)

    # L5 — master quest: the rocket countdown
    seq("compare_order", 5,
        "The rocket countdown is scrambled! Fix it from 10 down to 6 — the launch depends on you!",
        ["10", "9", "8", "7", "6"], *A)
    mc("compare_order", 5,
       "Fuel readings: 48, 35, 51, 42. Milo needs them biggest first. Which order is right?",
       "51, 48, 42, 35", ["48, 51, 42, 35", "35, 42, 48, 51", "51, 42, 48, 35"], *A)
    sort("compare_order", 5,
         "Final launch check! Sort the fuel cells: less than 40, or more than 40.",
         {"Less than 40": ["33", "37", "39"],
          "More than 40": ["44", "47", "41"]}, *A)
    tt("compare_order", 5,
       "The launch needs the BIGGEST fuel reading. Tap it!",
       "51", ["44", "47", "49"], *A,
       narration="Tap the biggest fuel reading.")


# ---------------------------------------------------------------------------
# add (4-7): L1 combines small groups -> L5 two-digit addition
# ---------------------------------------------------------------------------
def _add() -> None:
    A = AGES["add"]

    # L1 — welcome: berries and gears
    tc("add", 1,
       "Bolt flashed 2 times, then 1 more time. Tap once for each flash — how many in all?",
       3, "firefly flashes", *A)
    mc("add", 1,
       "Sprocket found 2 gears, then 2 more gears under the workbench. How many gears now?",
       "4", ["3", "5", "2"], *A)
    tt("add", 1,
       "Milo's berry bowl: 3 red berries plus 2 blue berries. Tap the bowl that holds 5 berries!",
       "5 berries", ["4 berries", "3 berries", "6 berries"], *A,
       narration="Three red berries plus two blue berries. Tap the bowl with five berries.")
    listen("add", 1,
           "Add with Milo: 1 berry plus 2 berries is 3 berries! Say the berry math with him!",
           "One plus two is three!", *A)

    # L2 — the plot thickens: rocket fuel
    mc("add", 2,
       "BEEP! The rocket needs fuel! Milo loaded 4 crystals, then Sprocket added 5 more. How many crystals?",
       "9", ["8", "10", "1"], *A)
    tc("add", 2,
       "Star-berries for the crew: 3 in the basket, 4 more just picked. Tap each berry to count them all!",
       7, "star-berries", *A)
    seq("add", 2,
        "Milo's adding machine tells the story in steps. Put the steps in order!",
        ["Milo had 4 crystals", "He added 3 more", "Now he has 7"], *A)
    tt("add", 2,
       "Sprocket had 5 bolts. Milo gave him 3 more. Tap the jar that now holds 8 bolts!",
       "8 bolts", ["7 bolts", "9 bolts", "6 bolts"], *A,
       narration="Five bolts plus three more. Tap the jar with eight bolts.")

    # L3 — help a friend: Sprocket's gadget needs 12 bolts
    mc("add", 3,
       "Sprocket's gadget needs 12 bolts. He has 7, and Milo hands him 5 more. Bolts now?",
       "12", ["11", "13", "2"], *A)
    mc("add", 3,
       "Bolt flashed 6 times, then 6 more times for Sprocket's birthday. How many flashes in all?",
       "12", ["11", "13", "6"], *A)
    sort("add", 3,
         "Milo's fuel recipes! Sort the pairs: which pairs make 10, and which make 11?",
         {"Make 10": ["6 and 4", "7 and 3", "8 and 2"],
          "Make 11": ["5 and 6", "9 and 2", "4 and 7"]}, *A)
    trace("add", 3,
          "Trace the giant plus sign to switch on Milo's adding machine!",
          "a big glowing plus sign", *A)

    # L4 — the mystery: the hiccup machine lies
    mc("add", 4,
       "The hiccup machine claims 9 + 8 = 16. Milo smells a glitch! What is 9 + 8 really?",
       "17", ["16", "18", "1"], *A)
    mc("add", 4,
       "Bolt flashed 13 times, then 5 more times before breakfast. How many flashes total?",
       "18", ["17", "19", "8"], *A)
    tt("add", 4,
       "A rockslide! 14 rocks plus 6 more rocks. Tap the pile showing 20 rocks!",
       "20 rocks", ["19 rocks", "21 rocks", "18 rocks"], *A,
       narration="Fourteen rocks plus six more. Tap the pile with twenty rocks.")
    seq("add", 4,
        "Rebuild the adding story the hiccup scrambled!",
        ["Milo poured 11 crystals", "Sprocket added 7 more", "The tank holds 18"], *A)

    # L5 — master quest: the grand launch
    mc("add", 5,
       "Grand launch! Milo loads 25 crystals. Sprocket loads 18 more. How many fuel crystals in all?",
       "43", ["33", "42", "7"], *A)
    mc("add", 5,
       "Bolt's grand flash code: 36 flashes, then 24 more! What is the grand total?",
       "60", ["50", "59", "61"], *A)
    sort("add", 5,
         "The volcano only rumbles for perfect fuel! Sort the pairs: which make 50, which make 60?",
         {"Make 50": ["30 and 20", "25 and 25", "40 and 10"],
          "Make 60": ["30 and 30", "40 and 20", "35 and 25"]}, *A)
    listen("add", 5,
           "You are the launch chief! Teach Bolt the big-add chant: 20 plus 30 is 50!",
           "Twenty plus thirty is fifty!", *A)


# ---------------------------------------------------------------------------
# subtract (4-8): L1 take-away stories -> L5 two-digit subtraction
# ---------------------------------------------------------------------------
def _subtract() -> None:
    A = AGES["subtract"]

    # L1 — welcome: munched berries and fizzled flashes
    tc("subtract", 1,
       "5 berries in the bowl. Milo munched 2 — crunch! Tap once for each berry that is LEFT.",
       3, "berries left", *A)
    mc("subtract", 1,
       "Bolt flashed 5 times, but 2 flashes fizzled out. How many flashes still glow?",
       "3", ["4", "2", "7"], *A)
    tt("subtract", 1,
       "Sprocket had 5 gears. One rolled away! Tap the tray that now holds 4 gears.",
       "4 gears", ["3 gears", "5 gears", "2 gears"], *A,
       narration="Five gears minus one that rolled away. Tap the tray with four gears.")
    listen("subtract", 1,
           "Take away with Milo: 4 rocks minus 1 rock is 3 rocks! Say the rocky math!",
           "Four minus one is three!", *A)

    # L2 — the plot thickens: rock-cakes and runaway fireflies
    mc("subtract", 2,
       "Milo baked 9 rock-cakes. Sprocket munched 4 — crumbs everywhere! How many rock-cakes are left?",
       "5", ["6", "4", "13"], *A)
    tc("subtract", 2,
       "10 fireflies glowed in the jar. 4 flew out the window! Tap each one that is still inside.",
       6, "fireflies still inside", *A)
    seq("subtract", 2,
        "The take-away tale got tangled! Put the story in order.",
        ["There were 8 crystals", "The volcano hiccuped 3 away", "5 crystals are left"], *A)
    tt("subtract", 2,
       "10 rocks on the hill. 3 tumbled down! Tap the pile with 7 rocks left.",
       "7 rocks", ["6 rocks", "8 rocks", "5 rocks"], *A,
       narration="Ten rocks minus three that tumbled. Tap the pile with seven rocks.")

    # L3 — help a friend: Sprocket shares his bolts
    mc("subtract", 3,
       "Sprocket had 14 bolts and gave 6 to Milo for the rocket. How many bolts does Sprocket have now?",
       "8", ["9", "7", "20"], *A)
    mc("subtract", 3,
       "Bolt flashed 12 times. Then 5 flashes faded into the night. How many still glow?",
       "7", ["8", "6", "17"], *A)
    sort("subtract", 3,
         "Milo's take-away recipes! Sort: which take-aways leave 8, and which leave 9?",
         {"Leave 8": ["12 minus 4", "15 minus 7", "11 minus 3"],
          "Leave 9": ["13 minus 4", "14 minus 5", "12 minus 3"]}, *A)
    trace("subtract", 3,
          "Trace the long minus sign to power down the hiccup machine — gently!",
          "a long glowing minus sign", *A)

    # L4 — the mystery: what did the hiccup steal?
    mc("subtract", 4,
       "The tank held 18 crystals. Now it holds 11. How many crystals did the hiccup steal?",
       "7", ["8", "6", "29"], *A)
    mc("subtract", 4,
       "Milo counted 20 fireflies at dusk. Now only 13 glow. How many flew away?",
       "7", ["6", "8", "33"], *A)
    tt("subtract", 4,
       "Mystery rocks: 17 rocks minus some rocks leaves 9 rocks. Tap the missing number!",
       "8", ["7", "9", "6"], *A,
       narration="Seventeen minus what equals nine? Tap the missing number.")
    seq("subtract", 4,
        "Solve the berry mystery! Put the clues in order.",
        ["The jar held 16 berries", "Some berries vanished overnight", "Only 9 berries remain"], *A)

    # L5 — master quest: launch-day fuel check
    mc("subtract", 5,
       "Launch day! The tank holds 45 crystals. The launch burns 23. How many crystals are left?",
       "22", ["21", "23", "68"], *A)
    mc("subtract", 5,
       "Sprocket built 52 gadgets and gave 30 to the volcano crew. How many gadgets are left?",
       "22", ["21", "23", "82"], *A)
    sort("subtract", 5,
         "Final fuel check! Sort the take-aways: which leave 20, and which leave 30?",
         {"Leave 20": ["50 minus 30", "40 minus 20", "35 minus 15"],
          "Leave 30": ["60 minus 30", "45 minus 15", "50 minus 20"]}, *A)
    listen("subtract", 5,
           "You are the countdown captain! Teach Sprocket: 40 minus 10 is 30!",
           "Forty minus ten is thirty!", *A)


# ---------------------------------------------------------------------------
# place_value (6-8): L1 tens and ones -> L5 hundreds
# ---------------------------------------------------------------------------
def _place_value() -> None:
    A = AGES["place_value"]

    # L1 — welcome: Milo's bundle packs
    tt("place_value", 1,
       "Milo bundles bolts: 3 bundles of ten, plus 4 loose bolts. Tap the number he built!",
       "34", ["43", "30", "33"], *A,
       narration="Three tens and four ones. Tap the number Milo built.")
    mc("place_value", 1,
       "Sprocket's tray shows 2 tens and 5 ones. What number did he build?",
       "25", ["52", "20", "7"], *A)
    sort("place_value", 1,
         "Milo's digit sorter is jammed! Sort the digits: which live in the Tens place, which in the Ones place?",
         {"Tens place": ["the 4 in 47", "the 2 in 25", "the 8 in 83"],
          "Ones place": ["the 7 in 47", "the 5 in 25", "the 3 in 83"]}, *A)
    listen("place_value", 1,
           "Build it with Milo: 3 tens and 2 ones make 32! Say the builder chant!",
           "Three tens and two ones make thirty-two!", *A)

    # L2 — the plot thickens: the flashing counter
    mc("place_value", 2,
       "BEEP! Sprocket's counter shows 6 tens and 1 one. What number is flashing?",
       "61", ["16", "60", "7"], *A)
    tt("place_value", 2,
       "Bolt's flash code needs five tens and eight ones. Tap the right number!",
       "58", ["85", "50", "68"], *A,
       narration="Five tens and eight ones. Tap the right number.")
    seq("place_value", 2,
        "Milo's number packs are out of order! Line them up from smallest to biggest.",
        ["23", "32", "41"], *A)
    trace("place_value", 2,
          "Trace the digits 1 and 0 to build a brand-new ten-stick for Sprocket!",
          "the digits 1 and 0, a ten-stick", *A)

    # L3 — help a friend: the tipped tens tray
    mc("place_value", 3,
       "Sprocket built the number 74, but his tens tray tipped over! He still has 7 tens. How many ones does he need?",
       "4", ["7", "3", "5"], *A)
    mc("place_value", 3,
       "Bolt flashed 5 tens and 6 ones at the volcano. The volcano rumbles: how many flashes?",
       "56", ["65", "50", "11"], *A)
    sort("place_value", 3,
         "Help Sprocket re-pack! Sort the numbers: which have 4 tens, and which have 7 tens?",
         {"4 tens": ["42", "47", "40"],
          "7 tens": ["71", "79", "70"]}, *A)
    listen("place_value", 3,
           "Fix it with Milo: seventy-four is seven tens and four ones! Say it proud!",
           "Seventy-four is seven tens and four ones!", *A)

    # L4 — the mystery: the hundred-box
    mc("place_value", 4,
       "Milo found a mystery box: 3 hundreds, 2 tens, 5 ones. What number is hiding inside?",
       "325", ["235", "320", "352"], *A)
    tt("place_value", 4,
       "The volcano coughed up a hundred-stone: 4 hundreds, 1 ten, 7 ones. Tap the number!",
       "417", ["471", "147", "714"], *A,
       narration="Four hundreds, one ten, seven ones. Tap the number.")
    seq("place_value", 4,
        "The hundred-packs rolled down the volcano! Stack them from smallest to biggest.",
        ["150", "250", "350"], *A)
    trace("place_value", 4,
          "Trace the digits 2, 0, 0 to forge two hundred fuel crystals!",
          "the digits 2-0-0", *A)

    # L5 — master quest: the fuel master
    mc("place_value", 5,
       "Grand launch fuel: 5 hundreds, 3 tens, 8 ones. You are the fuel master — how much fuel is that?",
       "538", ["583", "530", "835"], *A)
    mc("place_value", 5,
       "Sprocket's mega-gadget holds 700 + 40 + 6. What number does the dial show?",
       "746", ["764", "740", "476"], *A)
    sort("place_value", 5,
         "The volcano inspects every digit! Sort them: Hundreds place, or Ones place?",
         {"Hundreds place": ["the 5 in 538", "the 7 in 746", "the 2 in 325"],
          "Ones place": ["the 8 in 538", "the 6 in 746", "the 5 in 325"]}, *A)
    listen("place_value", 5,
           "You are the hundreds hero! Teach Bolt: five hundreds is five hundred!",
           "Five hundreds is five hundred!", *A)


# ---------------------------------------------------------------------------
# shapes_patterns (3-7): L1 names shapes -> L5 completes complex patterns
# ---------------------------------------------------------------------------
def _shapes_patterns() -> None:
    A = AGES["shapes_patterns"]

    # L1 — welcome: gadget parts
    tt("shapes_patterns", 1,
       "Sprocket needs a triangle gear for his gadget! Tap the triangle gear.",
       "triangle gear", ["circle gear", "square gear", "star gear"], *A,
       narration="Find the triangle gear and tap it.")
    mc("shapes_patterns", 1,
       "Milo's new window is perfectly round, like a ball. What shape is the window?",
       "circle", ["square", "triangle", "oval"], *A)
    trace("shapes_patterns", 1,
          "Trace the square window so Sprocket can fit it into his workshop wall!",
          "a square window", *A)
    listen("shapes_patterns", 1,
           "Name the shapes with Milo: circle, square, triangle! Shout them like an inventor!",
           "Circle, square, triangle!", *A)

    # L2 — the plot thickens: the Pattern Bridge
    seq("shapes_patterns", 2,
        "The Pattern Bridge lost its stones in the hiccup! Relay the row: circle, square, circle, square.",
        ["circle", "square", "circle", "square"], *A)
    tt("shapes_patterns", 2,
       "Sprocket dropped his hexagon bolt! Tap the hexagon bolt.",
       "hexagon bolt", ["pentagon bolt", "circle bolt", "square bolt"], *A,
       narration="Find the hexagon bolt and tap it.")
    mc("shapes_patterns", 2,
       "The bridge glows red, blue, red, blue... What color comes next?",
       "red", ["blue", "green", "yellow"], *A)
    sort("shapes_patterns", 2,
         "Tidy the shape bin! Sort the shapes: round ones, and pointy ones.",
         {"Round": ["circle", "oval"],
          "Pointy": ["triangle", "square", "star", "diamond"]}, *A)

    # L3 — help a friend: finish Sprocket's rows
    seq("shapes_patterns", 3,
        "Help Sprocket finish his gear row: big gear, small gear, big gear, small gear!",
        ["big gear", "small gear", "big gear", "small gear"], *A)
    mc("shapes_patterns", 3,
       "Bolt blinks a signal: flash, flash, pause, flash, flash, pause... What comes next?",
       "pause", ["flash", "double flash", "long glow"], *A)
    tt("shapes_patterns", 3,
       "The bridge pattern reads square, circle, square, circle... Tap the shape that comes next!",
       "square", ["circle", "triangle", "star"], *A,
       narration="Square, circle, square, circle. Tap the shape that comes next.")
    trace("shapes_patterns", 3,
          "Trace the zigzag crack in the bridge so Milo can seal it with lava-glue!",
          "a zigzag crack", *A)

    # L4 — the mystery: growing stones
    mc("shapes_patterns", 4,
       "Mystery stones! The dots grow: 1 dot, 2 dots, 3 dots... How many dots on the next stone?",
       "4", ["3", "5", "6"], *A)
    seq("shapes_patterns", 4,
        "The hiccup stacked Milo's block tower wrong! Rebuild it from 2 blocks to 6 blocks.",
        ["2 blocks", "4 blocks", "6 blocks"], *A)
    tt("shapes_patterns", 4,
       "The code stones read circle, square, triangle, circle, square... Tap the missing stone!",
       "triangle", ["square", "circle", "star"], *A,
       narration="Circle, square, triangle, circle, square. Tap the missing stone.")
    sort("shapes_patterns", 4,
         "Milo found two kinds of secret codes! Sort them: AB patterns, and ABC patterns.",
         {"AB patterns": ["red, blue, red, blue", "up, down, up, down"],
          "ABC patterns": ["red, blue, green, red, blue, green",
                           "circle, square, triangle, circle, square, triangle"]}, *A)

    # L5 — master quest: design the new bridge
    mc("shapes_patterns", 5,
       "The master gate code: 5, 10, 15... You designed this bridge! What number opens the gate?",
       "20", ["16", "25", "18"], *A)
    seq("shapes_patterns", 5,
        "Lay your master bridge row for the grand opening: star, star, circle, star, star, circle!",
        ["star", "star", "circle", "star", "star", "circle"], *A)
    tt("shapes_patterns", 5,
       "Bolt's farewell code: flash, pause, pause, flash, pause, pause... Tap what comes next!",
       "flash", ["pause", "double flash", "glow"], *A,
       narration="Flash, pause, pause, flash, pause, pause. Tap what comes next.")
    listen("shapes_patterns", 5,
           "You are the pattern master! Teach Sprocket your song: circle, circle, square — again!",
           "Circle, circle, square, circle, circle, square!", *A)


# ---------------------------------------------------------------------------
# fractions (5-8): L1 halves -> L5 thirds/quarters of sets
# ---------------------------------------------------------------------------
def _fractions() -> None:
    A = AGES["fractions"]

    # L1 — welcome: fair shares
    tt("fractions", 1,
       "Milo cut a star-berry two ways. Tap the berry cut into two EQUAL halves!",
       "cut into 2 equal halves",
       ["cut into 2 uneven pieces", "cut into 3 pieces", "a whole berry"], *A,
       narration="Tap the berry cut into two equal halves.")
    mc("fractions", 1,
       "Milo shares one rock-cake with Sprocket, cut right down the middle. What does each friend get?",
       "one half", ["one whole", "one third", "two halves"], *A)
    sort("fractions", 1,
         "Snack time! Sort the snacks: halves for sharing, and wholes for keeping.",
         {"Halves": ["half a berry", "half a cake", "half an apple"],
          "Wholes": ["a whole berry", "a whole cake", "a whole apple"]}, *A)
    listen("fractions", 1,
           "The fair-share rule: two halves make one whole! Chant it with Milo!",
           "Two halves make one whole!", *A)

    # L2 — the plot thickens: halves of sets
    mc("fractions", 2,
       "Bolt collected 6 flashes of light and shares half with Milo. How many flashes does each friend get?",
       "3", ["2", "4", "6"], *A)
    tt("fractions", 2,
       "Milo needs half of 8 stars for his star-map. Tap the group showing half of 8!",
       "4 stars", ["8 stars", "2 stars", "6 stars"], *A,
       narration="Tap the group showing half of eight stars.")
    seq("fractions", 2,
        "Put Milo's cake-sharing story in order!",
        ["Milo baked 2 cakes", "He cut each cake in half", "Now there are 4 halves"], *A)
    trace("fractions", 2,
          "Trace the line that cuts the rock-cake into two equal halves!",
          "a line through the middle of the cake", *A)

    # L3 — help a friend: Sprocket's picnic
    mc("fractions", 3,
       "Sprocket has 8 crystals and shares half with Milo for the rocket. How many does Milo get?",
       "4", ["2", "6", "8"], *A)
    mc("fractions", 3,
       "Bolt's glow-cookie is cut into 4 equal parts. What is ONE part called?",
       "one quarter", ["one half", "one third", "one whole"], *A)
    sort("fractions", 3,
         "Sprocket's picnic packs! Sort them: packs cut into halves, and packs cut into quarters.",
         {"Halves": ["cut into 2 equal parts", "one half of a pie", "half a sandwich"],
          "Quarters": ["cut into 4 equal parts", "one quarter of a pie", "a quarter sandwich"]}, *A)
    tt("fractions", 3,
       "Milo ordered a quarter-pie! Tap the pie cut into 4 equal quarters.",
       "cut into 4 equal parts",
       ["cut into 2 halves", "cut into 3 parts", "a whole pie"], *A,
       narration="Tap the pie cut into four equal quarters.")

    # L4 — the mystery: the unequal volcano split
    mc("fractions", 4,
       "The volcano split 12 crystals into 3 EQUAL piles for Milo, Sprocket, and Bolt. How many crystals in each pile?",
       "4", ["3", "6", "5"], *A)
    mc("fractions", 4,
       "One third of 9 star-berries are ripe and red. How many berries are ripe?",
       "3", ["2", "4", "6"], *A)
    tt("fractions", 4,
       "Milo hid one third of 12 bolts in the toolbox. Tap the pile with 4 bolts!",
       "4 bolts", ["3 bolts", "6 bolts", "2 bolts"], *A,
       narration="One third of twelve is four. Tap the pile with four bolts.")
    seq("fractions", 4,
        "Rebuild the great crystal share that the hiccup scattered!",
        ["12 crystals in the pot", "Split into 3 equal piles", "Each friend gets 4"], *A)

    # L5 — master quest: the grand feast
    mc("fractions", 5,
       "Grand feast! One quarter of 20 berries go to Bolt. You are the feast master — how many berries?",
       "5", ["4", "10", "6"], *A)
    mc("fractions", 5,
       "Two thirds of 12 gears are shiny and new. How many gears shine?",
       "8", ["4", "6", "9"], *A)
    sort("fractions", 5,
         "The volcano demands perfect shares! Sort: groups showing half of 10, and a quarter of 12.",
         {"Half of 10": ["5 stars", "5 bolts", "5 berries"],
          "Quarter of 12": ["3 stars", "3 bolts", "3 berries"]}, *A)
    listen("fractions", 5,
           "You are the fair-share champion! Teach Bolt: a quarter of twelve is three!",
           "A quarter of twelve is three!", *A)
