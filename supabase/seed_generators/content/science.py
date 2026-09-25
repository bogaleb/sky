#!/usr/bin/env python3
"""Sky Phase 3 content: SCIENCE — The Greenhouse, hosted by Bea the bee.

Story world: Bea's greenhouse. Recurring friends: Sprout the seedling
(who grows across levels), Dewdrop the frog (weather watcher), and Bea's
hive-mates (Buzzy and the young bees). Running scenarios: Sprout's growth
diary, the Great Garden Mystery, Dewdrop's weather station, the Body
Expedition (a tiny tour inside the body), and Bea's experiment corner.

Skills: plants, animals_habitats, weather, human_body, experiments.
100 activities: 5 skills x 5 levels x 4.
"""

from core import mc, tt, tc, seq, sort, trace, listen, AGES


def _plants() -> None:
    s = "plants"
    a, b = AGES[s]

    # L1 — Welcome: meet Sprout, name plant parts.
    mc(s, 1, "Buzz buzz! Sprout the seedling just poked out of the soil! "
       "Which part of Sprout drinks up the water?",
       "roots", ["leaves", "flower", "stem"], a, b)
    tt(s, 1, "Buzz buzz! Welcome to the Greenhouse! Can you tap the leaf on little Sprout?",
       "leaf", ["root", "stem", "flower"], a, b,
       narration="Tap the leaf — the flat green part of the plant.")
    tc(s, 1, "Buzz buzz! Sprout grew four tiny leaves! Count the leaves with me.",
       4, "leaves", a, b, narration="Count the four tiny leaves on Sprout.")
    mc(s, 1, "Buzz buzz! Sprout is getting tall! Which part holds Sprout up straight?",
       "stem", ["roots", "leaves", "seeds"], a, b)

    # L2 — The plot thickens: what plants need.
    mc(s, 2, "Buzz buzz! Sprout looks droopy, but Bea watered it yesterday. "
       "What else might Sprout need?",
       "sunlight", ["even more water", "a darker corner", "a bigger pot"], a, b)
    listen(s, 2, "Buzz buzz! Sprout made a wish list! Say it with Bea so we remember.",
           "Plants need sunlight, water, and air to grow.", a, b)
    mc(s, 2, "Buzz buzz! Bea covered a plant with a box to keep it safe. "
       "After a week, what happened?",
       "it wilted without light",
       ["it grew taller", "it turned bright blue", "nothing changed at all"], a, b)
    trace(s, 2, "Buzz buzz! The watering can is full! Trace the water's path "
          "down to Sprout's roots.",
          "the water's path from the can down into the soil to the roots", a, b,
          narration="Trace the water's path from the watering can down into the soil to Sprout's roots.")

    # L3 — Help a friend: the life cycle begins.
    seq(s, 3, "Buzz buzz! The wind scattered Sprout's growth diary! Put Sprout's "
        "life in order, from first to last.",
        ["a tiny seed in the soil", "a sprout pokes out",
         "a tall stem with leaves", "a blooming flower"], a, b)
    mc(s, 3, "Buzz buzz! Buzzy buried his seed under a rock to keep it safe. "
       "What should he do instead?",
       "let sunlight reach it",
       ["cover it with a bigger rock", "dig it up to check", "water it every hour"], a, b)
    tt(s, 3, "Buzz buzz! Buzzy wants to see where plants drink. Tap Sprout's roots!",
       "roots", ["stem", "leaves", "flower"], a, b,
       narration="Tap the roots — the parts hiding under the soil.")
    mc(s, 3, "Buzz buzz! Which of these could grow into a brand-new plant?",
       "an apple seed", ["a pebble", "a marble", "a button"], a, b)

    # L4 — The mystery: the Great Garden Mystery.
    mc(s, 4, "Buzz buzz! Mystery! Bea watered her mint, but it still wilted. "
       "What is the sneaky reason?",
       "water is stuck with no drain hole",
       ["it needs even more water", "mint hates sunshine", "it wants a bigger pot"], a, b)
    mc(s, 4, "Buzz buzz! Two seedlings: one by the window, one in a dark box. "
       "After a week, which one stands tall?",
       "the one by the window",
       ["the one in the dark box", "both grow the same", "neither grows at all"], a, b)
    seq(s, 4, "Buzz buzz! Mystery! Sprout's leaves have tiny holes! What happened "
        "first, next, and last?",
        ["a hungry caterpillar visited", "it munched tiny holes in the leaves",
         "Bea found the holes this morning"], a, b)
    mc(s, 4, "Buzz buzz! The soil is dry AND Sprout is droopy. What is the best fix?",
       "give it water, then wait",
       ["pull it out to check the roots", "pour in lots of plant food",
        "move it to a dark corner"], a, b)

    # L5 — Master quest: the child teaches.
    mc(s, 5, "Buzz buzz! A new bee asks what plants need. Teach her like a master gardener!",
       "sunlight, water, and air",
       ["only water", "water and music", "soil and nothing else"], a, b)
    seq(s, 5, "Buzz buzz! Master quest! Tell Sprout's whole life story, from start to finish.",
        ["seed sleeping in the soil", "sprout pokes out", "tall plant with leaves",
         "flower blooms", "new seeds are made"], a, b)
    mc(s, 5, "Buzz buzz! Which part of the plant uses sunlight to make food?",
       "leaves", ["roots", "flowers", "seeds"], a, b)
    listen(s, 5, "Buzz buzz! Say Sprout's life story with Bea, nice and loud!",
           "Seed, sprout, plant, flower, seeds again!", a, b)


def _animals_habitats() -> None:
    s = "animals_habitats"
    a, b = AGES[s]

    # L1 — Welcome: match animals to homes.
    sort(s, 1, "Buzz buzz! These animals got mixed up on the way home! "
         "Put each animal in its home.",
         {"Pond": ["frog", "duck"], "Tree": ["bird", "squirrel"]}, a, b)
    mc(s, 1, "Buzz buzz! Dewdrop the frog is getting sleepy. Where will he rest tonight?",
       "in the pond", ["in a tree", "in the desert", "on a mountain top"], a, b)
    tt(s, 1, "Buzz buzz! Tap the animal that lives in a hive, just like Bea!",
       "bee", ["fish", "rabbit", "bird"], a, b,
       narration="Tap the bee — the animal that lives in a hive.")
    mc(s, 1, "Buzz buzz! Where would you find a fish swimming happily?",
       "in the pond", ["in a tree", "in the sky", "in the desert"], a, b)

    # L2 — The plot thickens: homes have reasons.
    mc(s, 2, "Buzz buzz! Why does Dewdrop love the pond so much?",
       "his skin must stay wet",
       ["he likes being dry", "he is afraid of land", "ponds are always warm"], a, b)
    mc(s, 2, "Buzz buzz! A polar bear is visiting and feels too hot! "
       "Where does a polar bear feel at home?",
       "the snowy Arctic",
       ["the hot desert", "a warm pond", "the steamy rainforest"], a, b)
    tc(s, 2, "Buzz buzz! Five ducks came to visit Dewdrop's pond! Count the ducks.",
       5, "ducks", a, b, narration="Count the five ducks visiting the pond.")
    tt(s, 2, "Buzz buzz! Something is hiding in the tree! Tap the animal that lives up there.",
       "squirrel", ["frog", "fish", "rabbit"], a, b,
       narration="Tap the squirrel hiding in the tree.")

    # L3 — Help a friend.
    mc(s, 3, "Buzz buzz! A baby bird tumbled out of its nest! "
       "Where should we gently put it back?",
       "in its nest in the tree",
       ["in the pond", "in a flower pot inside", "on the soft grass"], a, b)
    sort(s, 3, "Buzz buzz! Buzzy packed lunch for everyone! Sort who eats plants "
         "and who eats meat.",
         {"Eats plants": ["rabbit", "deer"], "Eats meat": ["fox", "owl"]}, a, b)
    mc(s, 3, "Buzz buzz! A lost bee is buzzing in circles. What kind of home "
       "should we look for?",
       "a hive", ["a burrow", "a nest of twigs", "a pond"], a, b)
    listen(s, 3, "Buzz buzz! Croak the frog song with Dewdrop!",
           "Frogs live in ponds. Birds live in trees.", a, b)

    # L4 — The mystery: adaptations.
    mc(s, 4, "Buzz buzz! Mystery! The duck dives every day but never gets soggy! Why?",
       "oily feathers push water away",
       ["it stays out of deep water", "the sun dries it fast",
        "its feathers soak up water"], a, b)
    mc(s, 4, "Buzz buzz! Why does the rabbit have such long ears?",
       "to hear danger from far away",
       ["to help it hop higher", "to swat away flies", "to look bigger to foxes"], a, b)
    seq(s, 4, "Buzz buzz! Dewdrop was not always a frog! Put his life in order.",
        ["tiny eggs in the pond", "a wiggly tadpole hatches",
         "the tadpole grows legs", "a frog hops onto land"], a, b)
    mc(s, 4, "Buzz buzz! Camels cross the hot desert. What helps the camel most?",
       "its hump stores food for the trip",
       ["its hump stores water", "it never feels thirsty", "its thick fur cools it down"], a, b)

    # L5 — Master quest: the child explains adaptations.
    mc(s, 5, "Buzz buzz! Teach the hive! Why do fish have fins?",
       "to swim and steer",
       ["to breathe the air", "to look pretty", "to walk on land"], a, b)
    sort(s, 5, "Buzz buzz! Master quest! Sort every animal into its home: water, land, or sky.",
         {"Water": ["fish", "frog"], "Land": ["rabbit", "fox"],
          "Sky": ["bird", "bee"]}, a, b)
    mc(s, 5, "Buzz buzz! A young bee asks why birds build nests. What do you tell her?",
       "to keep eggs safe and warm",
       ["to store food for winter", "to hide from rain only", "because trees are soft"], a, b)
    trace(s, 5, "Buzz buzz! Trace Bea's round trip: from the hive to the flower and back home!",
          "Bea's round trip from the hive to the flower and back", a, b,
          narration="Trace Bea's round trip from the hive to the flower and back home.")


def _weather() -> None:
    s = "weather"
    a, b = AGES[s]

    # L1 — Welcome: sunny and rainy with Dewdrop.
    mc(s, 1, "Buzz buzz! Dewdrop is watching the sky! The sun is shining bright. "
       "What is the weather?",
       "sunny", ["rainy", "snowy", "windy"], a, b)
    tt(s, 1, "Buzz buzz! Dark clouds are rolling in! Tap the picture that shows rainy weather.",
       "rainy cloud", ["bright sun", "snowy cloud", "windy day"], a, b,
       narration="Tap the rainy cloud.")
    mc(s, 1, "Buzz buzz! The clouds turned dark and heavy. What might happen next?",
       "rain", ["bright sunshine", "snow in summer", "nothing at all"], a, b)
    listen(s, 1, "Buzz buzz! Say the weather words with Dewdrop!",
           "Sunny, rainy, cloudy, snowy!", a, b)

    # L2 — The plot thickens: Dewdrop's weather station.
    mc(s, 2, "Buzz buzz! Dewdrop's weather station shows rain clouds! What should Bea pack?",
       "a raincoat", ["sunglasses", "a snow shovel", "a sun hat"], a, b)
    mc(s, 2, "Buzz buzz! The wind is blowing leaves sideways! How strong is the wind?",
       "strong", ["gentle", "stopped", "soft as a whisper"], a, b)
    tc(s, 2, "Buzz buzz! Raindrops are plopping on Dewdrop's big leaf! Count them.",
       7, "raindrops", a, b, narration="Count the seven raindrops on the leaf.")
    mc(s, 2, "Buzz buzz! The rain stopped and colors arched across the sky! What is it?",
       "a rainbow", ["a storm cloud", "lightning", "the bright sun"], a, b)

    # L3 — Help a friend: warn the picnic ants.
    mc(s, 3, "Buzz buzz! Dewdrop must warn the picnic ants! Which clouds mean rain is coming?",
       "dark, heavy clouds",
       ["white fluffy clouds", "no clouds at all", "pink sunset clouds"], a, b)
    sort(s, 3, "Buzz buzz! Help Dewdrop sort his weather cards before the storm!",
         {"Sunny day": ["bright sun", "sunglasses"],
          "Rainy day": ["dark rain cloud", "umbrella"]}, a, b)
    mc(s, 3, "Buzz buzz! Sprout is thirsty and the sky is cloudy. Should Bea water Sprout now?",
       "wait — rain may come",
       ["yes, water right away", "never water plants", "water twice as much"], a, b)
    tt(s, 3, "Buzz buzz! Tap what you see in the sky BEFORE a storm starts.",
       "dark clouds", ["bright sun", "rainbow", "twinkling stars"], a, b,
       narration="Tap the dark clouds that come before a storm.")

    # L4 — The mystery: the water cycle.
    seq(s, 4, "Buzz buzz! Mystery! Where did the puddle go? Put the water's journey in order.",
        ["puddle water rises into the air", "clouds gather up high",
         "rain falls back down", "the puddle fills again"], a, b)
    mc(s, 4, "Buzz buzz! The morning grass is wet, but it never rained! What happened?",
       "dew formed overnight",
       ["it rained while we slept", "the grass made its own water",
        "Dewdrop splashed it"], a, b)
    mc(s, 4, "Buzz buzz! In winter the pond turned hard and slippery! What happened?",
       "the water froze into ice",
       ["snow piled on top", "the water sank away", "it turned to glass"], a, b)
    mc(s, 4, "Buzz buzz! The leaves turned red and gold, then fell down! "
       "What season is coming?",
       "autumn", ["spring", "summer", "winter"], a, b)

    # L5 — Master quest: the child teaches the water cycle.
    mc(s, 5, "Buzz buzz! Teach the hive! Where do clouds come from?",
       "water rising into the sky",
       ["smoke from houses", "cotton in the sky", "birds breathing out"], a, b)
    seq(s, 5, "Buzz buzz! Master quest! Put the whole year in order for Dewdrop's "
        "weather station.",
        ["spring flowers bloom", "summer sun shines hot",
         "autumn leaves fall", "winter snow falls"], a, b)
    mc(s, 5, "Buzz buzz! A young bee asks why it rains. What is the true story?",
       "heavy clouds let the water fall",
       ["the sky is crying", "clouds get squeezed dry", "water leaks from the sky"], a, b)
    listen(s, 5, "Buzz buzz! Say the water cycle with Dewdrop, round and round!",
           "Water rises up, clouds gather, rain falls down, again and again!", a, b)


def _human_body() -> None:
    s = "human_body"
    a, b = AGES[s]

    # L1 — Welcome: the Body Expedition begins, name body parts.
    tt(s, 1, "Buzz buzz! Our Body Expedition begins! Tap the nose in the picture.",
       "nose", ["ear", "eye", "mouth"], a, b,
       narration="Tap the nose in the picture.")
    mc(s, 1, "Buzz buzz! Our tiny tour bus is rolling! What do we use to see the road?",
       "eyes", ["ears", "nose", "hands"], a, b)
    tc(s, 1, "Buzz buzz! Hold up one hand! Count the fingers with Bea.",
       5, "fingers", a, b, narration="Count the five fingers on one hand.")
    mc(s, 1, "Buzz buzz! Bea is buzzing her buzziest buzz! What do we use to hear it?",
       "ears", ["eyes", "nose", "mouth"], a, b)

    # L2 — The plot thickens: the senses deepen.
    mc(s, 2, "Buzz buzz! The tour bus reached Nose Station! What does the nose help us do?",
       "smell the flowers", ["see colors", "hear buzzing", "taste honey"], a, b)
    mc(s, 2, "Buzz buzz! Buzzy tasted honey with his tongue! What does the tongue help us do?",
       "taste", ["smell", "hear", "see"], a, b)
    sort(s, 2, "Buzz buzz! Sort what each body part does on the tour!",
         {"Eyes": ["see"], "Ears": ["hear"], "Nose": ["smell"], "Tongue": ["taste"]}, a, b)
    listen(s, 2, "Buzz buzz! Point and say the senses with Bea!",
           "Eyes see. Ears hear. Nose smells.", a, b)

    # L3 — Help a friend: bones, skin, muscles.
    mc(s, 3, "Buzz buzz! Buzzy bumped his knee! What hard parts inside keep us standing tall?",
       "bones", ["muscles", "skin", "hair"], a, b)
    mc(s, 3, "Buzz buzz! What covers our whole body and keeps the inside safe?",
       "skin", ["hair", "clothes", "wings"], a, b)
    tt(s, 3, "Buzz buzz! The tour bus reached the heart! Tap the heart in the picture.",
       "heart", ["rib", "stomach", "brain"], a, b,
       narration="Tap the heart in the picture.")
    mc(s, 3, "Buzz buzz! Buzzy wants strong arms to lift honey jars! What helps arms move?",
       "muscles", ["longer bones", "softer skin", "lots of candy"], a, b)

    # L4 — The mystery: heart and lungs.
    mc(s, 4, "Buzz buzz! Mystery! After running, Buzzy's chest goes thump-thump-thump! "
       "What is thumping?",
       "his heart pumping",
       ["his lungs breathing", "his stomach growling", "his bones knocking"], a, b)
    mc(s, 4, "Buzz buzz! We breathe in... what does our body take from the air?",
       "oxygen", ["water", "smoke", "dust"], a, b)
    mc(s, 4, "Buzz buzz! Why do we breathe faster when we run?",
       "working muscles need more air",
       ["to cool the body down", "to fill the lungs like balloons",
        "to push the blood faster"], a, b)
    seq(s, 4, "Buzz buzz! Follow one breath on the Body Expedition! Put the journey in order.",
        ["air flows in through the nose", "air travels down to the lungs",
         "the body takes the air it needs", "used air flows back out"], a, b)

    # L5 — Master quest: how the systems work.
    mc(s, 5, "Buzz buzz! Teach the hive! What does the heart do all day?",
       "pumps blood around the body",
       ["makes the blood", "holds the air", "beats to make music"], a, b)
    mc(s, 5, "Buzz buzz! Master quest! What do the lungs do?",
       "take fresh air in and send used air out",
       ["pump the blood", "digest the food", "make us talk"], a, b)
    mc(s, 5, "Buzz buzz! A young bee asks why we must drink water every day!",
       "our bodies are mostly water",
       ["to wash our insides", "so we feel full", "to cool our bones"], a, b)
    trace(s, 5, "Buzz buzz! Trace the loop blood travels: out of the heart, "
          "around the body, and back!",
          "the loop blood travels from the heart around the body and back", a, b,
          narration="Trace the loop that blood travels, from the heart around the body and back.")


def _experiments() -> None:
    s = "experiments"
    a, b = AGES[s]

    # L1 — Welcome: predict what happens.
    mc(s, 1, "Buzz buzz! Bea drops a wooden block and a coin into the pond! "
       "Which one floats?",
       "the wooden block", ["the coin", "both float", "both sink"], a, b)
    mc(s, 1, "Buzz buzz! Bea left an ice cube in the warm sunshine! What happens?",
       "it melts into water",
       ["it gets even colder", "it turns to stone", "it disappears forever"], a, b)
    tc(s, 1, "Buzz buzz! Bea lined up jars for her experiment corner! Count the jars.",
       6, "jars", a, b, narration="Count the six jars in Bea's experiment corner.")
    listen(s, 1, "Buzz buzz! Say the scientist's rhyme with Bea!",
           "First I guess, then I test, then I see!", a, b)

    # L2 — The plot thickens: sink/float and ramp tests.
    mc(s, 2, "Buzz buzz! Which of these will float in Dewdrop's pond?",
       "a wooden spoon", ["a metal key", "a glass marble", "a heavy rock"], a, b)
    mc(s, 2, "Buzz buzz! Bea rolls a ball down a steep ramp and a gentle ramp! "
       "Which ball goes faster?",
       "the one on the steep ramp",
       ["the one on the gentle ramp", "both go the same speed",
        "the ramp does not matter"], a, b)
    sort(s, 2, "Buzz buzz! Help Bea sort her experiment tools before the big test!",
         {"Floats": ["wooden block", "leaf", "plastic duck"],
          "Sinks": ["rock", "coin", "metal key"]}, a, b)
    tt(s, 2, "Buzz buzz! Tap the thing Bea should test next — the one that might float!",
       "feather", ["coin", "rock", "marble"], a, b,
       narration="Tap the feather — the thing that might float.")

    # L3 — Help a friend: Buzzy's questions.
    mc(s, 3, "Buzz buzz! Buzzy planted one seed deep and one seed shallow! What will happen?",
       "both grow, the shallow one pops up first",
       ["the deep one grows faster", "only the deep one grows",
        "seeds cannot grow in soil"], a, b)
    mc(s, 3, "Buzz buzz! Buzzy shines a light on his toy! Where does the shadow fall?",
       "on the far side from the light",
       ["right under the light", "on the same side as the light",
        "shadows only come at night"], a, b)
    seq(s, 3, "Buzz buzz! Help Buzzy do the sink-or-float test in the right order!",
        ["guess: will it sink or float?", "gently drop it in the water",
         "watch what happens", "tell a friend what you saw"], a, b)
    mc(s, 3, "Buzz buzz! Buzzy poured oil into water! What happens in the jar?",
       "the oil floats on top",
       ["they mix into one", "the water floats on top", "both disappear"], a, b)

    # L4 — The mystery: fair tests.
    mc(s, 4, "Buzz buzz! Mystery! Bea raced two ramps, but one ball was big and one was "
       "tiny! Why is the test unfair?",
       "she changed two things at once",
       ["big balls always win", "she tested on a cloudy day", "the ramp color matters"], a, b)
    mc(s, 4, "Buzz buzz! Bea wants to find which paper plane flies farthest! "
       "What is the fair way?",
       "throw each one the same way",
       ["throw the red one harder", "only test the pretty one",
        "let Dewdrop guess instead"], a, b)
    mc(s, 4, "Buzz buzz! Garden mystery solved? The window plant thrived, the closet plant "
       "wilted! What did Bea learn?",
       "plants need light to grow",
       ["closets are too quiet", "the window plant got lucky", "plants grow better alone"], a, b)
    trace(s, 4, "Buzz buzz! Trace the ball's path as it zooms down Bea's ramp!",
          "the ball's path rolling down the ramp", a, b,
          narration="Trace the ball's path rolling down the ramp.")

    # L5 — Master quest: design fair tests.
    mc(s, 5, "Buzz buzz! Master quest! Teach Buzzy the golden rule of testing!",
       "change only one thing at a time",
       ["change everything at once", "keep your test a secret",
        "only test your favorite"], a, b)
    mc(s, 5, "Buzz buzz! A young bee asks: how do we know the result is true and not "
       "just luck?",
       "test it again and see",
       ["ask the loudest bee", "one test is enough", "it felt true"], a, b)
    seq(s, 5, "Buzz buzz! Teach the hive the scientist's steps, in order!",
        ["ask a question", "guess what will happen", "test it fairly",
         "share what you learned"], a, b)
    listen(s, 5, "Buzz buzz! Say the scientist's promise with Bea, nice and loud!",
           "I change one thing, and I test again!", a, b)


def build() -> None:
    """Register all 100 science activities (5 skills x 5 levels x 4)."""
    _plants()
    _animals_habitats()
    _weather()
    _human_body()
    _experiments()
