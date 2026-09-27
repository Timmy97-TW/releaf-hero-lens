#!/usr/bin/env python3
"""Writes <slug>/index.html for every variant from one template.

The hero markup is the same on every page; what differs is the script that
draws the canvas, the hint line and the notes below the fold. Edit VARIANTS
and run:  python3 tools/build_pages.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

VARIANTS = [
    dict(
        slug="green-light", n="1", name="Green light",
        hint_mouse="Move to shine the light", hint_touch="Drag to shine the light", icon="light",
        notes="""
<p>The cursor is a green lamp. Where its light falls, the bench shows through the
field; behind the lamp the lit path narrows and closes over about two seconds,
like a comet&rsquo;s tail. The project&rsquo;s expression switch is designed to be
turned on by green light, and the bench has a green LED strip round its edge, so
the colour is ours. (The switch itself has not been shown to respond yet; the page
does not say it has.)</p>
<p>At rest the light sits as a pool in the grass to the right of the queue with
the reactor inside it, so the first screen already shows both layers. On a first
visit the lamp comes up the line of students and settles there.</p>
<p>The trail is one shape that tapers with age, so it moves without beading
or fog. The light gathers into a larger pool when the lamp is still and thins
when it moves fast. Green appears only as the light itself; the bench is shown
in its own colours.</p>
<h3>Things to decide</h3>
<ul>
<li>How long the tail lasts (now 1.5 seconds).</li>
<li>Where the pool rests. It is in the grass because that is the one part of the
photograph with nobody in it.</li>
</ul>""",
    ),
    dict(
        slug="along-the-line", n="2", name="Along the line",
        hint_mouse="Follow the line", hint_touch="Drag along the line", icon="right",
        notes="""
<p>One hairline runs along the ground under the queue, from the nearest student
past Farmer Chen to a single point: the bench. The part already walked is drawn
brighter, like a progress bar drawn by the people in the photograph.</p>
<p>The window now sits exactly under the cursor; there is no mapping and no lag to
fight. How far along the route you are sets two things: the size of the window,
and how far the reactor has slid into it. Near the end point the window is pulled
onto it and docks, so arriving takes no precision.</p>
<p>The window at its largest is less than half the height of the frame, and it
docks beside Chen. When the cursor leaves, it goes back to the dock. On a first
visit it walks the route once to show the idea.</p>
<h3>Things to decide</h3>
<ul>
<li>Whether the route should be visible all the time or only once the cursor is
on the photograph.</li>
<li>The strength of the pull toward the dock.</li>
</ul>""",
    ),
    dict(
        slug="roots", n="3", name="Roots",
        hint_mouse="Move down to look beneath", hint_touch="Touch low to look beneath", icon="down",
        notes="""
<p>The first reading of &ldquo;under the field&rdquo;. The cut is the real ground in the
photograph: the line where the students&rsquo; feet meet the grass, rising from the
lower left to Farmer Chen. The bench is underground.</p>
<p>The lower the cursor, the higher the field lifts, like turning back a sheet of turf.
Everyone in the line stays whole: the cut runs just under their feet.</p>
<p>From each person&rsquo;s feet a hairline root draws itself down as the field lifts,
white at the feet and green where it reaches the reactor. Chen&rsquo;s is a little
heavier than the rest. The meaning: what we heard
in the field went into what we built. The machine is fed by the visits above it.
That is the Integrated Human Practices argument, made in one picture.</p>
<p>No root is labelled. The homepage does not say which conversation changed which
part; the Human Practices page does that, with its evidence.</p>
<h3>Things to decide</h3>
<ul>
<li>How far the field rests lifted (now a little under half).</li>
<li>Whether Chen&rsquo;s root should stand out more, or not at all.</li>
</ul>""",
    ),
    dict(
        slug="membrane", n="4", name="Membrane",
        hint_mouse="Move up to lift the membrane", hint_touch="Drag up to lift the membrane", icon="updown",
        notes="""
<p>The second reading of &ldquo;under the field&rdquo;, and the one closest to the hardware.
The line between the field and the bench is the reactor&rsquo;s membrane. The 0.2&nbsp;&micro;m
membrane is the part of the design that does two jobs at once: it keeps the
engineered cells inside the vessel, and it lets the protectant they make pass out
to the plants.</p>
<p>So the line is a hairline with pores. Below it, a few rod-shaped cells drift and
turn back at it; none crosses. Now and then a green point leaves a cell, finds a
pore, passes through and rises into the field. Containment and delivery are the same line, which is the whole case
for putting the machine on the farm.</p>
<p>The cursor sets the membrane&rsquo;s height: lift it to see more of the bench, lower it
to give the field back. At rest it sits at about three quarters of the way down,
over the lab table and the pump.</p>
<h3>Things to decide</h3>
<ul>
<li>Whether eight cells and their slow trickle of protectant is the right amount of
motion for a first screen.</li>
<li>The drawn scale is symbolic: the cells and pores are not to scale with the
photograph, and the notes should stay the only place that says 0.2&nbsp;&micro;m.</li>
</ul>""",
    ),
]


ICONS = {
    "light": '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="8" cy="8" r="3"/><path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1"/></svg>',
    "right": '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 8h11M9.5 4l4 4-4 4"/></svg>',
    "down": '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2.5v11M4 9.5l4 4 4-4"/></svg>',
    "updown": '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v12M5 5l3-3 3 3M5 11l3 3 3-3"/></svg>',
}


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
  <link rel="stylesheet" href="../assets/css/hero.css" />
</head>
<body class="v-{v["slug"]}">

  <div class="navstrip">
    <div class="navstrip__tabs" aria-hidden="true"><span>Project</span><span>Wet Lab</span><span>Dry Lab</span><span>Hardware</span><span>Human Practices</span><span>Team</span></div>
    <a class="navstrip__back" href="../">All variants</a>
  </div>

  <header class="hero" role="img" aria-label="The ReLeaf team walks in single file along a bean trellis toward Farmer Chen, who waits with a basket at the head of the line. A window in the photograph shows, beneath the field, the team's bioreactor on a lab bench.">
    <canvas></canvas>
    <div class="hero__text">
      <h1 class="hero__claim">Every farmer a biomanufacturer.</h1>
      <p class="hero__line">A Stress-Responsive Optogenetic Bioreactor for Precision Plant Protection.</p>
    </div>
    <p class="hero__pill" aria-hidden="true"><span class="pill">{ICONS[v["icon"]]}<span class="mouse">{v["hint_mouse"]}</span><span class="touch">{v["hint_touch"]}</span></span></p>
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
