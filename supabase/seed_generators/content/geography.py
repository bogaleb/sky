#!/usr/bin/env python3
"""Sky Phase 3 — Geography content module (The Observatory).

Host: Atlas the elephant — grand, warm. "Gather round, explorers..."
Story friends: Wren the traveling bird (sends postcards from everywhere),
the magic globe (its labels keep falling off), Atlas's giant telescope.

Scenarios rotate: Wren's postcards with clues, telescope spottings, packing
Wren's suitcase, the unlabeled globe, festival invitations, mystery photos.

5 skills x 5 levels x 4 activities = 100 activities. Every fact double-checked:
continents/oceans, landmark/country pairings, animal habitats, map
conventions, greetings and festivals.
"""
from core import mc, tt, tc, seq, sort, trace, listen, AGES

CO = AGES["continents_oceans"]
LM = AGES["landmarks"]
WA = AGES["world_animals"]
MS = AGES["map_skills"]
CU = AGES["cultures"]


# ---------------------------------------------------------------------------
# Skill 1: continents_oceans — the magic globe
# ---------------------------------------------------------------------------
def _continents_oceans() -> None:
    s = "continents_oceans"

    # L1 — Welcome: big land, big water.
    tt(s, 1,
       "Gather round, explorers! Atlas's magic globe is spinning. Can you tap the big blue water?",
       "the ocean", ["the continent", "an island", "a mountain"], *CO,
       narration="Tap the big blue water on the spinning globe. That is the ocean.")
    mc(s, 1,
       "Wren sent a postcard: 'I flew over the biggest ocean in the world!' Which ocean did Wren cross?",
       "Pacific Ocean", ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean"], *CO)
    tc(s, 1,
       "Atlas points his trunk at the globe. 'Let's count Earth's oceans together, explorer!' How many oceans are there?",
       5, "oceans", *CO)
    listen(s, 1,
           "Atlas stomps happily. 'Every explorer must know two big words!' Can you say them with Atlas?",
           "continent, ocean", *CO)

    # L2 — The plot thickens: the globe's labels fell off!
    tt(s, 2,
       "Oh no! The labels fell off the magic globe. Can you tap Africa to stick its name back on?",
       "Africa", ["Asia", "Europe", "South America"], *CO,
       narration="Tap Africa on the globe to stick its name label back on.")
    mc(s, 2,
       "Wren's postcard shows bouncing kangaroos! 'Guess where I am!' Which continent is Wren visiting?",
       "Australia", ["Africa", "Asia", "South America"], *CO)
    sort(s, 2,
         "A gust of wind mixed up the globe's labels! Sort them back into Continents and Oceans.",
         {"Continents": ["Africa", "Asia", "Europe"],
          "Oceans": ["Pacific Ocean", "Atlantic Ocean", "Indian Ocean"]}, *CO)
    listen(s, 2,
           "Wren flutters down, chirping the ocean names she learned. Can you say them with Wren?",
           "Pacific, Atlantic, Indian", *CO)

    # L3 — Help a friend: Wren's postcard got rained on.
    mc(s, 3,
       "Wren's postcard got rained on! You can only read: '...snowy land... penguins everywhere!' Where is Wren?",
       "Antarctica", ["Africa", "Asia", "Europe"], *CO)
    tt(s, 3,
       "Wren writes: 'I am on the continent with the Eiffel Tower!' Tap it on the globe for her.",
       "Europe", ["Asia", "Africa", "North America"], *CO,
       narration="Tap the continent with the Eiffel Tower. That is Europe.")
    sort(s, 3,
         "Help Atlas tidy the observatory shelf! Sort the words into Land and Water.",
         {"Land": ["continent", "island", "mountain"],
          "Water": ["ocean", "river", "lake"]}, *CO)
    mc(s, 3,
       "Wren's new photo shows a very long wall winding over green hills. Which continent is she on?",
       "Asia", ["Africa", "Europe", "South America"], *CO)

    # L4 — The mystery: a postcard with no name.
    mc(s, 4,
       "A mystery postcard arrived with no name! It says: 'This is the smallest continent — and it is a country too!' Where?",
       "Australia", ["Europe", "Antarctica", "South America"], *CO)
    seq(s, 4,
        "Atlas's telescope measured the continents! Put them in order from biggest to smallest.",
        ["Asia", "Africa", "North America", "Australia"], *CO)
    trace(s, 4,
          "Wren's little boat must cross the big ocean between Europe and North America. Trace the wavy route for her!",
          "the wavy ocean route", *CO)
    mc(s, 4,
       "Atlas peers at the top of the globe. 'Which ocean sits near the North Pole, under the ice?' Can you tell him?",
       "Arctic Ocean", ["Pacific Ocean", "Atlantic Ocean", "Indian Ocean"], *CO)

    # L5 — Master quest: you are the globe guide.
    tt(s, 5,
       "You are the globe master now! Atlas spins it fast — can you tap South America?",
       "South America", ["North America", "Africa", "Europe"], *CO,
       narration="The globe is spinning fast. Tap South America, master explorer.")
    mc(s, 5,
       "Atlas's telescope is foggy, so YOU are the guide! Wren asks: 'Which continent is south of Europe and home to kangaroos?'",
       "Australia", ["Africa", "South America", "Asia"], *CO)
    sort(s, 5,
         "The labels fell off AGAIN! Only a master explorer can fix them all. Sort every label.",
         {"Continents": ["Africa", "Asia", "North America"],
          "Oceans": ["Pacific Ocean", "Atlantic Ocean", "Arctic Ocean"]}, *CO)
    seq(s, 5,
        "Wren flew all the way around the world! Put her stops in the order she visited them.",
        ["Europe", "Africa", "Asia", "Australia"], *CO)


# ---------------------------------------------------------------------------
# Skill 2: landmarks — Atlas's telescope
# ---------------------------------------------------------------------------
def _landmarks() -> None:
    s = "landmarks"

    # L1 — Welcome: famous places.
    tt(s, 1,
       "Atlas points his telescope at a postcard city. 'Tap the tall iron tower, explorer!'",
       "Eiffel Tower", ["Big Ben", "the Pyramids", "the Statue of Liberty"], *LM,
       narration="Look through the telescope. Tap the tall iron tower.")
    mc(s, 1,
       "Wren's postcard reads: 'I see a giant statue holding a torch in New York!' Which landmark did Wren visit?",
       "Statue of Liberty", ["Eiffel Tower", "Big Ben", "the Pyramids"], *LM)
    tc(s, 1,
       "Wren photographed the desert. 'How many huge triangle tombs do you see, explorer?'",
       3, "pyramids", *LM)
    listen(s, 1,
           "Wren loves saying landmark names! Say this one with her, nice and slow.",
           "Eiffel Tower", *LM)

    # L2 — The plot thickens: the telescope is foggy.
    mc(s, 2,
       "Atlas's telescope is all foggy! He sees a very long wall winding over hills. Which landmark is it?",
       "Great Wall", ["the Pyramids", "Eiffel Tower", "Big Ben"], *LM)
    tt(s, 2,
       "The fog is lifting! 'Tap the white marble palace glowing in the sun.'",
       "Taj Mahal", ["the Pyramids", "the Colosseum", "Eiffel Tower"], *LM,
       narration="The fog is lifting. Tap the white marble palace glowing in the sun.")
    seq(s, 2,
        "Wren visited three landmarks today! Put her day in the order she saw them.",
        ["Eiffel Tower", "Big Ben", "Statue of Liberty"], *LM)
    sort(s, 2,
         "Help Atlas file his telescope photos! Sort them into Tall Towers and Wonders of Stone.",
         {"Tall Towers": ["Eiffel Tower", "Big Ben", "Leaning Tower of Pisa"],
          "Wonders of Stone": ["the Pyramids", "Great Wall", "Taj Mahal"]}, *LM)

    # L3 — Help a friend: Wren mixed up her photos.
    mc(s, 3,
       "Wren mixed up her photos! This one shows huge triangle tombs in the desert. Help her label it.",
       "the Pyramids", ["Taj Mahal", "Great Wall", "the Colosseum"], *LM)
    tt(s, 3,
       "Wren's camera roll is a mess! 'Tap the photo of the Sydney Opera House.'",
       "Sydney Opera House", ["Eiffel Tower", "Big Ben", "Taj Mahal"], *LM,
       narration="Wren's photos are all mixed up. Tap the Sydney Opera House.")
    mc(s, 3,
       "This photo shows a giant statue with a lion's body and a human head in Egypt. What is it?",
       "the Sphinx", ["the Pyramids", "the Colosseum", "Big Ben"], *LM)
    trace(s, 3,
          "Wren wants to walk the whole Great Wall! Trace its winding line to guide her.",
          "the winding wall", *LM)

    # L4 — The mystery: postcards with no names.
    mc(s, 4,
       "A mystery postcard! It says only: 'I am standing by a giant waterfall between two countries!' Where is Wren?",
       "Niagara Falls", ["the Grand Canyon", "Mount Everest", "the Amazon Rainforest"], *LM)
    mc(s, 4,
       "Atlas spots a red bridge over a foggy bay in California. Which landmark did he find?",
       "Golden Gate Bridge", ["Sydney Opera House", "Big Ben", "Eiffel Tower"], *LM)
    seq(s, 4,
        "Wren's mystery tour! She will not tell Atlas the order — can you fix her jumbled list?",
        ["the Pyramids", "Taj Mahal", "Great Wall", "Sydney Opera House"], *LM)
    sort(s, 4,
         "Some landmarks were built by people, and some were made by nature! Sort Wren's photos.",
         {"Built by People": ["Eiffel Tower", "the Pyramids", "Great Wall"],
          "Made by Nature": ["the Grand Canyon", "Niagara Falls", "Mount Everest"]}, *LM)

    # L5 — Master quest: match landmarks to countries.
    mc(s, 5,
       "You are the landmark master! Atlas asks: 'The Colosseum stands in which country?'",
       "Italy", ["France", "Spain", "Greece"], *LM)
    mc(s, 5,
       "Wren asks the expert — that's you! 'Christ the Redeemer watches over which city?'",
       "Rio de Janeiro", ["Paris", "London", "Sydney"], *LM)
    sort(s, 5,
         "Only a master can match every landmark to its country! Sort them all.",
         {"France": ["Eiffel Tower"],
          "England": ["Big Ben"],
          "the USA": ["Statue of Liberty", "Golden Gate Bridge"],
          "Egypt": ["the Pyramids", "the Sphinx"]}, *LM)
    listen(s, 5,
           "Teach Wren like a true master! Say each landmark and its country.",
           "Eiffel Tower, France! Big Ben, England!", *LM)


# ---------------------------------------------------------------------------
# Skill 3: world_animals — Wren's animal photos
# ---------------------------------------------------------------------------
def _world_animals() -> None:
    s = "world_animals"

    # L1 — Welcome: name the animals.
    tt(s, 1,
       "Wren is visiting the outback! 'Tap the animal that hops on big back legs.'",
       "kangaroo", ["koala", "penguin", "camel"], *WA,
       narration="Wren is in the outback. Tap the animal that hops on big back legs.")
    mc(s, 1,
       "Wren's photo shows a black-and-white bird that cannot fly but loves the snow. Who is it?",
       "penguin", ["polar bear", "seal", "puffin"], *WA)
    tc(s, 1,
       "Look at the icy shore in Wren's photo! How many penguins are waddling?",
       4, "penguins", *WA)
    listen(s, 1,
           "Atlas is teaching animal names! Say this one with him, nice and loud.",
           "kangaroo", *WA)

    # L2 — The plot thickens: new habitats.
    mc(s, 2,
       "Wren met the 'ship of the desert' — it has humps on its back and walks for miles! Which animal?",
       "camel", ["horse", "donkey", "llama"], *WA)
    tt(s, 2,
       "Deep in the bamboo forest... 'Tap the black-and-white bear munching bamboo!'",
       "panda", ["koala", "sloth", "raccoon"], *WA,
       narration="Deep in the bamboo forest. Tap the black-and-white bear munching bamboo.")
    sort(s, 2,
         "Atlas's animal photos blew everywhere! Sort them into Snow Animals and Desert Animals.",
         {"Snow Animals": ["penguin", "polar bear", "seal"],
          "Desert Animals": ["camel", "fennec fox", "lizard"]}, *WA)
    seq(s, 2,
        "Wren's savanna day! Put the animals she saw in the order she met them.",
        ["lion", "zebra", "giraffe"], *WA)

    # L3 — Help a friend: Wren's photos got mixed up.
    sort(s, 3,
         "Wren mixed up her animal photos! Help her sort them into The Savanna and The Ocean.",
         {"The Savanna": ["lion", "zebra", "giraffe"],
          "The Ocean": ["whale", "dolphin", "seal"]}, *WA)
    mc(s, 3,
       "This photo shows a slow climber hanging upside down in the rainforest. Who needs a label?",
       "sloth", ["monkey", "koala", "lemur"], *WA)
    tt(s, 3,
       "Atlas asks: 'Which of these animals lives at the very top of the world, in the Arctic?'",
       "polar bear", ["penguin", "brown bear", "seal"], *WA,
       narration="Which animal lives at the very top of the world, in the Arctic? Tap it.")
    listen(s, 3,
           "Wren keeps forgetting! 'Where do giant pandas live?' Say the answer with Wren.",
           "China", *WA)

    # L4 — The mystery: footprints and night sounds.
    mc(s, 4,
       "Mystery footprints in the snow! Huge paws, white fur, near the North Pole. Who walked here?",
       "polar bear", ["brown bear", "arctic fox", "penguin"], *WA)
    mc(s, 4,
       "Wren hears a strange 'laugh' on the night savanna. Which animal makes that laughing sound?",
       "hyena", ["lion", "zebra", "jackal"], *WA)
    trace(s, 4,
          "A whale is singing far out at sea! Trace the wavy ocean path so Wren can follow the song.",
          "the wavy ocean path", *WA)
    seq(s, 4,
        "The Arctic tern flies farther than any bird! Put its long journey in order.",
        ["the Arctic", "the ocean", "Antarctica"], *WA)

    # L5 — Master quest: match animals to continents.
    sort(s, 5,
         "You are the animal expert! Match every animal to its continent.",
         {"Africa": ["lion", "elephant", "giraffe"],
          "Australia": ["kangaroo", "koala"],
          "Antarctica": ["penguin"]}, *WA)
    mc(s, 5,
       "Atlas tests the master: 'Which of these animals lives ONLY in the wild in China?'",
       "panda", ["koala", "tiger", "red panda"], *WA)
    tt(s, 5,
       "Wren is in the rainforest and hears chattering above! 'Tap the rainforest animal.'",
       "monkey", ["camel", "penguin", "polar bear"], *WA,
       narration="Wren hears chattering in the rainforest. Tap the rainforest animal.")
    tc(s, 5,
       "Wren's photo album is full! 'How many animal photos did she take on this trip, explorer?'",
       6, "animal photos", *WA)


# ---------------------------------------------------------------------------
# Skill 4: map_skills — Wren's hand-drawn maps
# ---------------------------------------------------------------------------
def _map_skills() -> None:
    s = "map_skills"

    # L1 — Welcome: follow a simple map.
    tt(s, 1,
       "Wren drew you a little map! 'Can you tap the school, explorer?'",
       "the school", ["the park", "the lake", "the shop"], *MS,
       narration="Wren drew a little map. Tap the school.")
    mc(s, 1,
       "On Wren's map there is a blue squiggle. On maps, the color blue usually means...",
       "water", ["roads", "mountains", "forests"], *MS)
    trace(s, 1,
          "Wren wants to sail her paper boat to the pond! Trace the dotted path on the map.",
          "the dotted path", *MS)
    tc(s, 1,
       "Wren's map has tiny trees! 'How many trees can you count, explorer?'",
       4, "trees", *MS)

    # L2 — The plot thickens: the map key.
    mc(s, 2,
       "Atlas studies the map key. 'The green shapes stand for... what, explorer?'",
       "forests", ["water", "roads", "cities"], *MS)
    seq(s, 2,
        "Wren is giving Atlas a tour! Put her stops in the order they visit them.",
        ["the house", "the bridge", "the hill"], *MS)
    tt(s, 2,
       "On the treasure map... 'Tap the triangle that means mountain!'",
       "the mountain", ["the river", "the road", "the lake"], *MS,
       narration="On the treasure map. Tap the triangle that means mountain.")
    listen(s, 2,
           "Every explorer needs the compass words! Point north and say it with Atlas.",
           "North", *MS)

    # L3 — Help a friend: Wren is lost!
    mc(s, 3,
       "Wren is lost! The map key says the star means treasure, and the star is by the big oak. Where should she dig?",
       "under the big oak", ["by the river", "on the hill", "at the gate"], *MS)
    sort(s, 3,
         "Wren's map stickers are all mixed up! Sort them into Water Places and Land Places.",
         {"Water Places": ["lake", "river", "pond"],
          "Land Places": ["forest", "mountain", "desert"]}, *MS)
    trace(s, 3,
          "Wren's boat must follow the river to the lake! Trace the wavy river for her.",
          "the wavy river", *MS)
    tc(s, 3,
       "The treasure map has red X marks! 'How many X's do you see, explorer?'",
       3, "red X marks", *MS)

    # L4 — The mystery: compass directions.
    mc(s, 4,
       "The sun rises in the east. Wren is facing the sunrise. Which way is she facing?",
       "east", ["west", "north", "south"], *MS)
    mc(s, 4,
       "Mystery! The compass needle points north, but Wren wants to walk the OPPOSITE way. Which way should she go?",
       "south", ["north", "east", "west"], *MS)
    tt(s, 4,
       "Atlas hands you his brass compass. 'Tap the arrow that points north!'",
       "the N arrow", ["the S arrow", "the E arrow", "the W arrow"], *MS,
       narration="Atlas hands you his brass compass. Tap the arrow that points north.")
    seq(s, 4,
        "Atlas teaches the compass trick! Put the directions in clockwise order, starting at north.",
        ["north", "east", "south", "west"], *MS)

    # L5 — Master quest: read maps like an expert.
    mc(s, 5,
       "You are the map master! The lake is north of the forest. Wren stands in the forest and walks north. Where is she now?",
       "at the lake", ["at the mountain", "at the desert", "at the river"], *MS)
    sort(s, 5,
         "Atlas drew a master map! The lake and mountain are north of camp. The forest and desert are south. Sort where Wren ends up!",
         {"North of Camp": ["the lake", "the mountain"],
          "South of Camp": ["the forest", "the desert"]}, *MS)
    trace(s, 5,
          "Only a master can find the safe way! Trace the curvy path around the mountain to the observatory.",
          "the curvy mountain path", *MS)
    listen(s, 5,
           "Teach Wren the direction song, master explorer! Sing it with Atlas.",
           "North, south, east, west", *MS)


# ---------------------------------------------------------------------------
# Skill 5: cultures — festival invitations and hellos
# ---------------------------------------------------------------------------
def _cultures() -> None:
    s = "cultures"

    # L1 — Welcome: say hello around the world.
    listen(s, 1,
           "Wren just landed in Spain! Say hello in Spanish with her.",
           "Hola", *CU)
    mc(s, 1,
       "Wren fluttered to France! How do friends there say hello?",
       "bonjour", ["hola", "ciao", "aloha"], *CU)
    tt(s, 1,
       "Atlas heard many hellos! 'Tap the word that means hello in Hawaiian.'",
       "aloha", ["hola", "bonjour", "ciao"], *CU,
       narration="Atlas heard many hellos. Tap the word that means hello in Hawaiian.")
    tc(s, 1,
       "Wren is collecting hellos! 'How many has she learned: hola, bonjour, ciao?'",
       3, "hellos", *CU)

    # L2 — The plot thickens: festival invitations arrive.
    mc(s, 2,
       "An invitation arrived! 'Come to Diwali, the festival of lights!' Which country sent it?",
       "India", ["China", "Brazil", "Mexico"], *CU)
    tt(s, 2,
       "Wren is decorating for Lunar New Year! 'Tap the red lanterns.'",
       "red lanterns", ["maracas", "a sombrero", "a trumpet"], *CU,
       narration="Wren is decorating for Lunar New Year. Tap the red lanterns.")
    seq(s, 2,
        "Wren's festival day! Put it in the order it happens.",
        ["the parade", "the feast", "the fireworks"], *CU)
    listen(s, 2,
           "Wren is off to Japan! Say hello in Japanese with her.",
           "Konnichiwa", *CU)

    # L3 — Help a friend: pack the right snacks.
    sort(s, 3,
         "Wren is packing snacks for her trip! Help her match each food to its country.",
         {"Mexico": ["tacos"],
          "Japan": ["sushi"],
          "Italy": ["pizza"],
          "India": ["curry"]}, *CU)
    mc(s, 3,
       "Wren just landed in Japan and is very hungry! Which food should she try?",
       "sushi", ["tacos", "pizza", "curry"], *CU)
    mc(s, 3,
       "A friend in Brazil invited Wren to Carnival! What will she see there?",
       "a giant street parade", ["a dragon dance", "a lantern festival", "a tomato fight"], *CU)
    trace(s, 3,
          "The Lunar New Year dragon is ready to dance! Trace its curvy parade path.",
          "the curvy dragon path", *CU)

    # L4 — The mystery: homes around the world.
    mc(s, 4,
       "Mystery house! It is built from blocks of ice and snow. Where would Wren find it?",
       "the Arctic", ["the desert", "the rainforest", "the savanna"], *CU)
    mc(s, 4,
       "A postcard shows a round tent that traveling families carry across the grasslands. What is it called?",
       "a yurt", ["an igloo", "a teepee", "a castle"], *CU)
    tt(s, 4,
       "Wren is visiting a village over the water! 'Tap the home standing on tall stilts.'",
       "the stilt house", ["the igloo", "the yurt", "the log cabin"], *CU,
       narration="Wren visits a village over the water. Tap the home standing on tall stilts.")
    seq(s, 4,
        "Wren's invitations arrived in a pile! Put the festivals in the order she opened them.",
        ["Diwali", "Lunar New Year", "Carnival"], *CU)

    # L5 — Master quest: the culture expert.
    mc(s, 5,
       "You are the culture master! Which festival honors loved ones who have passed away?",
       "Day of the Dead", ["Diwali", "Carnival", "Lunar New Year"], *CU)
    sort(s, 5,
         "Only a master can match every celebration to its country!",
         {"India": ["Diwali"],
          "China": ["Lunar New Year"],
          "Brazil": ["Carnival"],
          "Mexico": ["Day of the Dead"]}, *CU)
    listen(s, 5,
           "Teach Wren like a true master! Say all the hellos you know.",
           "Hola, bonjour, konnichiwa", *CU)
    tc(s, 5,
       "Wren hung lanterns for the festival! 'How many lanterns are glowing, explorer?'",
       8, "lanterns", *CU)


def build() -> None:
    """Register all 100 geography activities (5 skills x 5 levels x 4)."""
    _continents_oceans()
    _landmarks()
    _world_animals()
    _map_skills()
    _cultures()
