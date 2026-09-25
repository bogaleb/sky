#!/usr/bin/env python3
"""Sky Phase 3 — DRAWING content module.

Subject: drawing. Host: Captain Curio the fox. Island: The Painted Atelier.
Story friends: Quill the parrot, the Paint sprites (living blobs of color),
Wren the traveling bird, Pip the mouse.

Scenarios: painting portraits of story friends, the sprites losing their
colors, decorating the ship's sail, drawing a map for Wren, the gallery
wall needing pictures.

Level arcs: L1 welcome, L2 plot thickens, L3 help a friend, L4 mystery,
L5 master quest. trace is the star kind: every trace draws FOR someone.
"""

from core import mc, tt, tc, seq, sort, trace, listen, AGES


def _ages(skill: str) -> tuple[int, int]:
    return AGES[skill]


# ---------------------------------------------------------------------------
# Skill 1: brush_control (3-6) — dots and lines grow into smooth strokes
# ---------------------------------------------------------------------------

def _brush_control_l1() -> None:
    s = "brush_control"
    lo, hi = _ages(s)
    trace(s, 1,
          "Ahoy, artist! The Paint sprites want to play dots. Can you make a big dot for them?",
          "a big dot", lo, hi)
    trace(s, 1,
          "Curio's ship needs a mast before it can sail! Trace a straight line — it's the mast.",
          "a straight line", lo, hi)
    tc(s, 1,
       "Oh no — the Paint sprites spilled! How many blue blobs do you see?",
       3, "blue paint blobs", lo, hi)
    mc(s, 1,
       "Quill mixed up the practice strokes. Which one is a straight line?",
       "a straight line", ["a wavy line", "a zigzag line", "a curly line"],
       lo, hi)


def _brush_control_l2() -> None:
    s = "brush_control"
    lo, hi = _ages(s)
    trace(s, 2,
          "The ship is ready, but the sea is empty! Trace a wavy line — waves for Curio's ship.",
          "a wavy line", lo, hi)
    tt(s, 2,
       "Quill's practice sheet is a jumble. Tap the line that waves like the sea.",
       "the wavy line", ["the straight line", "the zigzag line", "the curly line"],
       lo, hi)
    mc(s, 2,
       "Quill's tail feathers need zigzag edges. Which line is a zigzag?",
       "the zigzag line", ["the wavy line", "the straight line", "the curly line"],
       lo, hi)
    listen(s, 2,
           "Say it with Curio, artist to artist — and make your voice wavy!",
           "Wavy lines dance like sea waves!", lo, hi)


def _brush_control_l3() -> None:
    s = "brush_control"
    lo, hi = _ages(s)
    trace(s, 3,
          "The wind curled Quill's tail feathers! Trace a spiral to smooth one out for him.",
          "a spiral", lo, hi)
    trace(s, 3,
          "A Paint sprite lost its kite string! Trace a long smooth line — it's the new string.",
          "a long smooth line", lo, hi)
    seq(s, 3,
        "Curio's flag needs painting in order. Put the steps in order, artist!",
        ["paint the pole", "paint the stripes", "paint the star"], lo, hi)
    mc(s, 3,
       "Which stroke makes the strongest rope for the ship?",
       "a long smooth line", ["a bumpy line", "a short dotty line", "a zigzag line"],
       lo, hi)


def _brush_control_l4() -> None:
    s = "brush_control"
    lo, hi = _ages(s)
    tt(s, 4,
       "A mysterious trail winds across the Atelier floor! Tap the trail that curls like a snake.",
       "the wavy trail", ["the straight trail", "the zigzag trail", "the dotted trail"],
       lo, hi)
    trace(s, 4,
          "The trail leads behind the easel! Trace the wiggly path to follow it, detective.",
          "a wiggly path", lo, hi)
    mc(s, 4,
       "The mystery trail is smooth and curvy. Which stroke could have made it?",
       "a wavy line", ["a straight line", "a zigzag line", "a row of dots"],
       lo, hi)
    tc(s, 4,
       "The trail was made by painty footprints! How many footprints lead to the easel?",
       4, "paint footprints", lo, hi)


def _brush_control_l5() -> None:
    s = "brush_control"
    lo, hi = _ages(s)
    trace(s, 5,
          "The gallery needs a rainbow, master artist! Trace a graceful curve for its top arc.",
          "a graceful curve", lo, hi)
    trace(s, 5,
          "Quill wants to sign his portrait. Trace the letter S — slow and smooth, like a captain.",
          "the letter S", lo, hi)
    mc(s, 5,
       "A young Paint sprite asks: which stroke takes the steadiest hand?",
       "a long smooth curve", ["a quick dot", "a bumpy zigzag", "a short straight dash"],
       lo, hi)
    listen(s, 5,
           "Teach the little sprites like a true master. Say it proud!",
           "Slow hands make smooth lines!", lo, hi)


# ---------------------------------------------------------------------------
# Skill 2: coloring (3-7) — picking colors grows into light and shadow
# ---------------------------------------------------------------------------

def _coloring_l1() -> None:
    s = "coloring"
    lo, hi = _ages(s)
    mc(s, 1,
       "Ahoy, artist! Pip's cheese turned blue in his portrait! What color is cheese really?",
       "yellow", ["blue", "green", "purple"], lo, hi)
    tt(s, 1,
       "The Paint sprites are lined up to help. Tap the yellow sprite!",
       "the yellow sprite", ["the red sprite", "the blue sprite", "the green sprite"],
       lo, hi)
    mc(s, 1,
       "Curio painted the sky green by mistake! What color should the sky be?",
       "blue", ["green", "yellow", "purple"], lo, hi)
    tc(s, 1,
       "How many red Paint sprites are bouncing by the easel?",
       3, "red Paint sprites", lo, hi)


def _coloring_l2() -> None:
    s = "coloring"
    lo, hi = _ages(s)
    sort(s, 2,
         "Oh no — the Paint sprites lost their colors in the wind! Sort them into warm and cool colors.",
         {"warm colors": ["red", "orange", "yellow"],
          "cool colors": ["blue", "green", "purple"]}, lo, hi)
    mc(s, 2,
       "A sprite feels chilly and wants a warm color. Which one should it pick?",
       "orange", ["blue", "green", "purple"], lo, hi)
    trace(s, 2,
          "One pale sprite has no color at all! Trace a big circle — you're painting it a brand-new red coat.",
          "a big circle", lo, hi)
    listen(s, 2,
           "Say it with Curio — warm colors first, like sunshine!",
           "Red, orange, yellow — warm like the sun!", lo, hi)


def _coloring_l3() -> None:
    s = "coloring"
    lo, hi = _ages(s)
    mc(s, 3,
       "Wren wants a sunset postcard for her travels. Which color belongs in a sunset sky?",
       "pink", ["blue", "green", "gray"], lo, hi)
    tt(s, 3,
       "Wren's forest postcard needs leaves. Tap the sprite holding the leaf color!",
       "the green sprite", ["the brown sprite", "the yellow sprite", "the blue sprite"],
       lo, hi)
    trace(s, 3,
          "Quill splashed paint across his portrait sky! Trace a wavy line — fresh blue sky to cover the spill.",
          "a wavy line", lo, hi)
    seq(s, 3,
        "Curio teaches layering like a real painter. Put the painting steps in order!",
        ["paint the sky", "paint the sun", "paint the birds"], lo, hi)


def _coloring_l4() -> None:
    s = "coloring"
    lo, hi = _ages(s)
    mc(s, 4,
       "Mystery! The gallery's red painting turned orange overnight. What got mixed into the red?",
       "yellow", ["blue", "white", "black"], lo, hi)
    sort(s, 4,
         "The night painting lost its stars! Sort the colors into night-sky colors and daytime colors.",
         {"night sky": ["dark blue", "purple", "black"],
          "daytime": ["light blue", "yellow", "white"]}, lo, hi)
    tt(s, 4,
       "One sneaky sprite is hiding the stolen yellow! Tap the sprite that glows yellow.",
       "the glowing yellow sprite",
       ["the glowing blue sprite", "the glowing red sprite", "the glowing green sprite"],
       lo, hi)
    tc(s, 4,
       "The color thief spilled paint while escaping! How many paint drops do you see?",
       5, "paint drops", lo, hi)


def _coloring_l5() -> None:
    s = "coloring"
    lo, hi = _ages(s)
    mc(s, 5,
       "Master artist! The sun shines from the left. Which side of the apple is lighter?",
       "the left side", ["the right side", "the top", "the bottom"], lo, hi)
    mc(s, 5,
       "Quill wants his portrait to look round, not flat. What should you add?",
       "soft shadows", ["hard black lines", "extra bright dots", "a thick frame"],
       lo, hi)
    trace(s, 5,
          "The gallery's grand finale needs YOU! Trace a big circle — it's the moon for the night painting.",
          "a big circle", lo, hi)
    listen(s, 5,
           "Teach the sprites the master's secret of light. Say it like a pro!",
           "Light colors shine, dark colors hide!", lo, hi)


# ---------------------------------------------------------------------------
# Skill 3: shape_drawing (4-7) — circles grow into shape-built objects
# ---------------------------------------------------------------------------

def _shape_drawing_l1() -> None:
    s = "shape_drawing"
    lo, hi = _ages(s)
    trace(s, 1,
          "Ahoy, artist! Pip wants his portrait, but the sun is missing! Trace a big circle — it's the sun!",
          "a big circle", lo, hi)
    mc(s, 1,
       "Quill dropped the shape blocks! Which shape rolls like a ball?",
       "a circle", ["a square", "a triangle", "a rectangle"], lo, hi)
    tt(s, 1,
       "A circle is hiding among the shapes! Tap the circle.",
       "the circle", ["the square", "the triangle", "the star"], lo, hi)
    tc(s, 1,
       "How many round cookies are on Pip's portrait table?",
       3, "round cookies", lo, hi)


def _shape_drawing_l2() -> None:
    s = "shape_drawing"
    lo, hi = _ages(s)
    mc(s, 2,
       "Curio's ship needs a brand-new sail. Which shape makes a strong sail?",
       "a triangle", ["a circle", "a square", "a star"], lo, hi)
    seq(s, 2,
        "Build a snowman for the winter painting! Order the circles from small to big.",
        ["the small circle", "the middle circle", "the big circle"], lo, hi)
    trace(s, 2,
          "The new sail is blank! Trace a triangle — it's the sail for Curio's ship.",
          "a triangle", lo, hi)
    tt(s, 2,
       "The sail pattern needs triangles. Tap the triangle!",
       "the triangle", ["the circle", "the square", "the oval"], lo, hi)


def _shape_drawing_l3() -> None:
    s = "shape_drawing"
    lo, hi = _ages(s)
    mc(s, 3,
       "Wren needs a map of the Atelier! What shapes make a house?",
       "a square and a triangle",
       ["a circle and a star", "an oval and a diamond", "a rectangle and a circle"],
       lo, hi)
    trace(s, 3,
          "Wren can't find the treasure! Trace a straight line — it's the path on her map.",
          "a straight line", lo, hi)
    mc(s, 3,
       "What shape is Wren's round compass?",
       "a circle", ["an oval", "a square", "a diamond"], lo, hi)
    listen(s, 3,
           "Say it with Curio — shapes are the building blocks of every picture!",
           "Circles, squares, triangles — shapes build everything!", lo, hi)


def _shape_drawing_l4() -> None:
    s = "shape_drawing"
    lo, hi = _ages(s)
    sort(s, 4,
         "The shape box tumbled everywhere! Sort the shapes into round ones and pointy ones.",
         {"round shapes": ["circle", "oval"],
          "pointy shapes": ["triangle", "star", "diamond"]}, lo, hi)
    tt(s, 4,
       "One shape snuck into the wrong family! Tap the shape that is NOT round.",
       "the triangle", ["the circle", "the oval", "the ring"], lo, hi)
    mc(s, 4,
       "The gallery's square painting went missing! Which shape has four equal sides?",
       "a square", ["a rectangle", "a diamond", "a triangle"], lo, hi)
    tc(s, 4,
       "The thief left triangle footprints! How many corners does each triangle have?",
       3, "corners", lo, hi)


def _shape_drawing_l5() -> None:
    s = "shape_drawing"
    lo, hi = _ages(s)
    mc(s, 5,
       "Master artist! Quill wants a portrait but the Paint sprites mixed up. What shapes make a cat's head?",
       "a circle", ["a triangle", "a square", "a star"], lo, hi)
    mc(s, 5,
       "Quill wants a portrait of his fish friend! What shapes make a fish?",
       "an oval and a triangle",
       ["a square and a star", "a circle and a square", "a diamond and a rectangle"],
       lo, hi)
    trace(s, 5,
          "The gallery wall needs YOUR masterpiece! Trace a big circle — it's the cat's head for Pip's portrait.",
          "a big circle", lo, hi)
    seq(s, 5,
        "Teach the sprites your master method! Put the drawing steps in order.",
        ["draw the big shapes", "add the small details", "paint the colors"],
        lo, hi)


# ---------------------------------------------------------------------------
# Skill 4: scene_composition (4-8) — placing one object grows into full scenes
# ---------------------------------------------------------------------------

def _scene_composition_l1() -> None:
    s = "scene_composition"
    lo, hi = _ages(s)
    mc(s, 1,
       "Ahoy, artist! The gallery wall needs a sunny picture. Where does the sun go?",
       "in the sky", ["under the sea", "behind the hill", "on the ground"], lo, hi)
    tt(s, 1,
       "The picture is almost done! Tap where the sun should shine.",
       "the sky", ["the sea", "the ground", "the cave"], lo, hi)
    trace(s, 1,
          "The picture needs clouds too! Trace a wavy line — it's a soft cloud for the sky.",
          "a wavy line", lo, hi)
    tc(s, 1,
       "How many birds are flying in Curio's sky painting?",
       2, "birds", lo, hi)


def _scene_composition_l2() -> None:
    s = "scene_composition"
    lo, hi = _ages(s)
    sort(s, 2,
         "The gallery pictures got all jumbled! Sort things into sky things and ground things.",
         {"in the sky": ["sun", "cloud", "bird"],
          "on the ground": ["tree", "flower", "house"]}, lo, hi)
    mc(s, 2,
       "Quill painted a fish in the sky! What's wrong with his picture?",
       "fish live in the sea", ["fish are too small", "the sky is blue", "fish need friends"],
       lo, hi)
    trace(s, 2,
          "Wren's postcard is missing the sea! Trace a wavy line — it's the ocean under her sky.",
          "a wavy line", lo, hi)
    listen(s, 2,
           "Say it with Curio — every picture needs a place for everything!",
           "Sky on top, ground below — every picture needs a place to go!",
           lo, hi)


def _scene_composition_l3() -> None:
    s = "scene_composition"
    lo, hi = _ages(s)
    seq(s, 3,
        "Help Curio paint the ship's sail! Put the painting steps in order.",
        ["paint the background", "paint the ship", "paint the flag on top"],
        lo, hi)
    mc(s, 3,
       "The sail needs something brave at the very top. What should fly highest?",
       "Curio's fox flag", ["an anchor", "a treasure chest", "a seagull"],
       lo, hi)
    trace(s, 3,
          "The sail's flag is blank! Trace a straight line — it's the flagpole for Curio's flag.",
          "a straight line", lo, hi)
    tt(s, 3,
       "The ship painting needs its flag! Tap the flag at the top of the ship.",
       "the flag", ["the anchor", "the treasure chest", "the seagull"], lo, hi)


def _scene_composition_l4() -> None:
    s = "scene_composition"
    lo, hi = _ages(s)
    sort(s, 4,
         "The gallery's big painting fell apart! Sort the pieces into background and foreground.",
         {"background": ["distant mountains", "clouds", "sun"],
          "foreground": ["big flowers", "Pip the mouse", "fence"]}, lo, hi)
    mc(s, 4,
       "Mystery! The night painting's moon is missing. A note says: look behind the clouds. Where do you paint it?",
       "behind the clouds",
       ["in front of the clouds", "under the ground", "on top of the sun"],
       lo, hi)
    tc(s, 4,
       "How many stars are hiding in the night painting?",
       5, "stars", lo, hi)
    listen(s, 4,
           "Describe the clue like a true art detective!",
           "I see the moon behind the clouds!", lo, hi)


def _scene_composition_l5() -> None:
    s = "scene_composition"
    lo, hi = _ages(s)
    mc(s, 5,
       "Master artist! The gallery's grand wall is empty. Which scene is complete?",
       "sky, sea, ship, and sun",
       ["only a ship", "sky and sea but no sun", "a sun floating alone"],
       lo, hi)
    trace(s, 5,
          "This is YOUR master quest! Trace a spiral — it's the swirling wind filling your grand sky painting.",
          "a spiral", lo, hi)
    seq(s, 5,
        "Teach the sprites the master's order! Put the scene steps in order.",
        ["paint the background", "paint the middle", "add the close-up details"],
        lo, hi)
    mc(s, 5,
       "Quill asks: in your painting, why do the far mountains look small?",
       "far things look smaller",
       ["the mountains are shrinking", "the paint faded", "clouds squished them"],
       lo, hi)


# ---------------------------------------------------------------------------
# build()
# ---------------------------------------------------------------------------

def build() -> None:
    """Register all 80 drawing activities (4 skills x 5 levels x 4)."""
    for fn in (
        _brush_control_l1, _brush_control_l2, _brush_control_l3,
        _brush_control_l4, _brush_control_l5,
        _coloring_l1, _coloring_l2, _coloring_l3,
        _coloring_l4, _coloring_l5,
        _shape_drawing_l1, _shape_drawing_l2, _shape_drawing_l3,
        _shape_drawing_l4, _shape_drawing_l5,
        _scene_composition_l1, _scene_composition_l2, _scene_composition_l3,
        _scene_composition_l4, _scene_composition_l5,
    ):
        fn()
