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
        preset="{}",
        hint_mouse="Move to shine the light", hint_touch="Drag to shine the light", icon="light",
        notes="""
<p>The base. The whole bench photograph now lies under the farm as one full-frame
layer, with the reactor standing in the middle of the screen. The cursor is a green
lamp: where its light falls, the bench shows through; behind it the lit path narrows
and closes. At rest the light sits in the middle over the reactor, so the first
screen shows both layers.</p>
<p>The headline and project line sit in the top left, over the dark of the trees.
The project&rsquo;s expression switch is designed to answer to green light; the page
does not say it has been shown to.</p>
<h3>To try in Tune</h3>
<ul>
<li>Size and trail length decide how much of the reactor a single sweep shows.</li>
<li>Bench scale: 0.74 fits the whole reactor in the resting light; 1 fills the screen with it.</li>
<li>&ldquo;At rest&rdquo; set to None turns this into Farm first without the timing.</li>
</ul>""",
    ),
    dict(
        slug="farm-first", n="2", name="Farm first",
        preset='{"rest":"none","warm":3,"idleOff":4,"R":0.3}',
        hint_mouse="Move to switch on the light", hint_touch="Drag to switch on the light", icon="light",
        notes="""
<p>For the reader to look at the farm before anything else. On arrival there is no
light at all: only the photograph and the headline, for three seconds. Then the hint
appears, and the light switches on only when the cursor moves, growing from nothing
over half a second.</p>
<p>If the cursor stays still for four seconds, the light fades out and the farm is
whole again. The bench is something the reader goes looking for, not something
the page opens on.</p>
<h3>To try in Tune</h3>
<ul>
<li>&ldquo;Farm alone first&rdquo;: how long the photograph holds before the light is allowed.</li>
<li>&ldquo;Off when still&rdquo;: set to 0 to keep the light on once it has been found.</li>
</ul>""",
    ),
    dict(
        slug="right-shade", n="3", name="Right shade",
        preset='{"benchX":0.74,"benchY":0.6,"rightFade":0.15,"rightFadeW":0.45,"R":0.3}',
        hint_mouse="Move to shine the light", hint_touch="Drag to shine the light", icon="light",
        notes="""
<p>The farm fades toward black on its right side, at 15%, and the reactor is
registered to stand in that right third. The light rests there. The queue on the
left stays untouched and bright; the bench appears where the frame is quietest.</p>
<p>At 15% the fade is a tint more than a shade. It is on a slider: at 40&ndash;60% the
right side becomes a dark stage for the bench and the contrast difference is obvious.
The reactor stands where Chen&rsquo;s line is heading, so the eye runs up the queue and
lands on it.</p>
<h3>To try in Tune</h3>
<ul>
<li>Right fade strength and width.</li>
<li>&ldquo;Reactor across&rdquo; moves the bench under the fade.</li>
</ul>""",
    ),
    dict(
        slug="dark-focus", n="4", name="Dark focus",
        preset='{"green":0,"darkRim":0.85,"vignette":0.7,"centreGrow":0.6,"life":0.35,"feather":0.4,"dim":0.1,"R":0.32,"boardDim":0.7}',
        hint_mouse="Move to look through", hint_touch="Drag to look through", icon="light",
        notes="""
<p>No green. The farm darkens toward every edge, so the eye is held in the middle of
the frame, and the hole is a plain dark-edged opening, closer to Marburg&rsquo;s. Around
the hole the farm darkens further, so the opening reads as depth.</p>
<p>The hole is larger near the centre and smaller toward the edges, so the most
powerful view is the one in the middle, where the reactor stands. It barely trails;
it is a lens, not a lamp.</p>
<h3>To try in Tune</h3>
<ul>
<li>Centre focus and Dark rim together set how theatrical it is.</li>
<li>&ldquo;Larger at centre&rdquo; at 1 makes the edges almost closed.</li>
</ul>""",
    ),
    dict(
        slug="scroll-light", n="5", name="Scroll to light",
        preset='{"scroll":1,"rest":"none","R":0.2}',
        hint_mouse="Scroll to switch on the light", hint_touch="Scroll to switch on the light", icon="down",
        notes="""
<p>The first screen is the farm, whole. The cursor still carries a small green lamp
for anyone who moves it. Scrolling is what switches the light on: the frame holds
still, and a light opens from the reactor at the centre until the bench fills the
screen. The headline fades as it opens. Then the page carries on.</p>
<p>This puts the reveal under the reader&rsquo;s own intent to go further, and it makes
the handover from the first screen to the rest of the homepage a single motion.</p>
<h3>To try in Tune</h3>
<ul>
<li>Size sets the small cursor lamp; set it to its minimum to leave the farm
untouched until the scroll.</li>
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

  <div class="hero-wrap">
  <header class="hero" role="img" aria-label="The ReLeaf team walks in single file along a bean trellis toward Farmer Chen, who waits with a basket at the head of the line. A window in the photograph shows, beneath the field, the team's bioreactor on a lab bench.">
    <canvas></canvas>
    <div class="hero__text">
      <h1 class="hero__claim">Every farmer a biomanufacturer.</h1>
      <p class="hero__line">A Stress-Responsive Optogenetic Bioreactor for Precision Plant Protection.</p>
    </div>
    <p class="hero__pill" aria-hidden="true"><span class="pill">{ICONS[v["icon"]]}<span class="mouse">{v["hint_mouse"]}</span><span class="touch">{v["hint_touch"]}</span></span></p>
  </header>
  </div>

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
  <script>window.LIGHT_PRESET = {v["preset"]};</script>
  <script src="../assets/js/v-light.js"></script>
  <script src="../assets/js/tune.js"></script>
</body>
</html>
"""


for v in VARIANTS:
    d = ROOT / v["slug"]
    d.mkdir(exist_ok=True)
    (d / "index.html").write_text(page(v, VARIANTS))
    print("wrote", d / "index.html")
