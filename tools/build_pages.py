#!/usr/bin/env python3
"""Writes <slug>/index.html for every variant from one template.

The hero markup is the same on every page; what differs is the script that
draws the canvas, the hint line and the notes below the fold. Edit VARIANTS
and run:  python3 tools/build_pages.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

CAPTION = ("Above: the team walking Farmer Chen&rsquo;s field by the Datun Stream, "
           "Tamsui. Beneath: our bioreactor on the bench.")

VARIANTS = [
    dict(
        slug="leaf-window", n="1", name="Leaf window",
        hint_mouse="Move across the field", hint_touch="Drag across the field",
        notes="""
<p>The closest to Marburg: a hole in the top photograph that follows the cursor.
The hole is a leaf, about four times the size of Marburg&rsquo;s flashlight, because
our lower layer has one object in it and the window has to hold the whole reactor.</p>
<p>It rests in the grass to the right of the queue, tilted along the line of feet,
so the first screen shows every student and Farmer Chen uncovered. On a first
visit it falls into place with a slow sway. It lags the cursor slightly and tips
with the direction you move it, the way a leaf lags a hand.</p>
<p>The bench photograph sits a little behind the hole: move the leaf and the
reactor shifts less than the leaf does, so it reads as a room seen through an
opening rather than a sticker carried by the cursor.</p>
<h3>Things to decide</h3>
<ul>
<li>The leaf&rsquo;s resting place. The grass is the only part of the frame with no
people in it; anywhere else covers somebody.</li>
<li>Whether the leaf should keep its petiole and midrib stubs, or be a plain
pointed oval.</li>
</ul>""",
    ),
    dict(
        slug="stoma", n="2", name="Stoma",
        hint_mouse="Hold still over the field", hint_touch="Touch and hold",
        notes="""
<p>The window is a leaf pore: two guard cells around an opening. It opens when the
cursor rests and closes to a slit while the cursor moves, so the reader has to
stop to see the bench. Left alone, it breathes on a seven-second cycle, open most
of the time.</p>
<p>The guard cells carry a few green chloroplasts. They are the only cells in the
leaf skin that have them, so the detail is correct as well as decorative.</p>
<p>This is also the pale variant. Marburg darkened its top layer; here the farm
is washed toward the cream of the team shirts at the corners, and the claim is
set in ink. It shows how the hero reads if the homepage opens on a light ground.</p>
<h3>Things to decide</h3>
<ul>
<li>Pale or ink ground. The stoma works on either; the pale ground is the bigger
change from the current homepage.</li>
<li>Whether needing to hold still is too much to ask of a first-time reader.</li>
</ul>""",
    ),
    dict(
        slug="green-light", n="3", name="Green light",
        hint_mouse="Sweep the light across the field", hint_touch="Drag the light across the field",
        notes="""
<p>The cursor is a green lamp. The bench shows wherever it has passed and the farm
closes over it again a few seconds later. The project&rsquo;s expression switch is
driven by green light, and the bench has a green LED strip round its edge, so the
colour is ours and it means something.</p>
<p>A trail solves the size problem differently from a big window. The brush is
moderate, but a sweep lays down a wide patch, so the reader paints the whole
reactor into view with one gesture and watches it fade.</p>
<p>The bench is registered to the frame: one layer the size of the hero, with the
reactor under the grass to the right of the queue. Every sweep uncovers the same
room. Left alone, the lamp sweeps the reactor in a slow S every nine seconds.</p>
<h3>Things to decide</h3>
<ul>
<li>How long a lit patch stays open (now 2.6 seconds).</li>
<li>Whether the farm should sit this dark. The lamp needs dusk to read as light.</li>
</ul>""",
    ),
    dict(
        slug="along-the-line", n="4", name="Along the line",
        hint_mouse="Move left to right", hint_touch="Drag left to right",
        notes="""
<p>This one is built on the photograph&rsquo;s diagonal. The window is held to the
queue: the cursor&rsquo;s position across the screen picks a point on the line of
students, from the nearest one to Farmer Chen. Small marks sit on each person in
the line and fill in as the window passes them.</p>
<p>The window grows as it climbs the line. Near the front it is small and shows the
room beside the reactor (whiteboard, power supply). At the head of the line it is
large, and the reactor is registered to stand where Chen stands. The line of
students ends at the bench.</p>
<p>Left alone, the window walks up the line, waits at the head for a few seconds
and walks back.</p>
<h3>Things to decide</h3>
<ul>
<li>At the head of the line the window covers Farmer Chen. That is the point of
the variant, and it is also the obvious objection to it.</li>
<li>Whether the station marks help or clutter.</li>
</ul>""",
    ),
    dict(
        slug="under-the-field", n="5", name="Under the field",
        hint_mouse="Bring the cursor down", hint_touch="Touch low on the field",
        notes="""
<p>The most literal reading of &ldquo;the bench is the layer underneath&rdquo;. The
farm photograph is a sheet with a serrated leaf margin along its bottom edge, and
a thin band of the lab shows under it from the start. Bring the cursor into the
lower part of the frame and the margin lifts toward it, opening the field.</p>
<p>The teeth of the margin lean one way, the way a leaf&rsquo;s serrations point to its
tip. The field casts a shadow down onto the bench so it reads as a layer lifted,
not a picture pasted on.</p>
<p>Because the opening grows from the bottom edge, it also works as a scroll cue:
the page continues below, and so does the project.</p>
<h3>Things to decide</h3>
<ul>
<li>How high the margin may lift (now up to two thirds of the frame).</li>
<li>Whether the resting band should be taller, so the bench is noticed without a
cursor.</li>
</ul>""",
    ),
]


def page(v, all_variants):
    switch = "\n".join(
        f'      <li><a href="../{o["slug"]}/"{" aria-current=\"page\"" if o is v else ""}>{o["n"]} &middot; {o["name"]}</a></li>'
        for o in all_variants
    )
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{v["name"]} &middot; ReLeaf first visual</title>
  <meta name="description" content="ReLeaf homepage first-visual study: {v["name"]}." />
  <link rel="icon" href="../assets/img/logo.png" />
  <link rel="preload" as="image" href="../assets/img/farm-2400.webp" />
  <link rel="stylesheet" href="../assets/css/hero.css" />
</head>
<body class="v-{v["slug"]}">

  <div class="navstrip">
    <img class="navstrip__logo" src="../assets/img/logo.png" alt="ReLeaf" />
    <div class="navstrip__tabs" aria-hidden="true"><span>Project</span><span>Wet Lab</span><span>Dry Lab</span><span>Hardware</span><span>Human Practices</span><span>Team</span></div>
    <a class="navstrip__back" href="../">All variants</a>
  </div>

  <header class="hero" role="img" aria-label="The ReLeaf team walks in single file along a bean trellis toward Farmer Chen, who waits with a basket at the head of the line. A window in the photograph shows, beneath the field, the team's bioreactor on a lab bench.">
    <canvas></canvas>
    <div class="hero__text">
      <img class="hero__mark" src="../assets/img/wordmark.png" alt="ReLeaf" width="667" height="306" />
      <h1 class="hero__claim">Every farmer a biomanufacturer.</h1>
    </div>
    <p class="hero__caption">{CAPTION}</p>
    <p class="hero__hint" aria-hidden="true"><span class="mouse">{v["hint_mouse"]}</span><span class="touch">{v["hint_touch"]}</span></p>
  </header>

  <section class="notes">
    <div class="notes__inner">
      <p class="notes__kicker">Variant {v["n"]}</p>
      <h2>{v["name"]}</h2>
{v["notes"]}
      <ul class="switcher">
{switch}
      </ul>
    </div>
  </section>

  <script src="../assets/js/lens-core.js"></script>
  <script src="../assets/js/v-{v["slug"]}.js"></script>
</body>
</html>
"""


for v in VARIANTS:
    d = ROOT / v["slug"]
    d.mkdir(exist_ok=True)
    (d / "index.html").write_text(page(v, VARIANTS))
    print("wrote", d / "index.html")
