/* v-light.js · the green-light hero and its directions
   One engine, five pages. Each page sets window.LIGHT_PRESET before loading
   this file; the Tune panel (tune.js) edits the same object live, and the
   URL can carry any value (?R=0.3&rightFade=0.15), so a setting can be sent
   to someone as a link.

   The bench is a full-frame layer under the farm, registered so the reactor
   stands where benchX / benchY say (the middle of the screen by default).
   The light is a lamp at the cursor: where it falls, the bench shows; behind
   it the lit path narrows and closes. The lit path is one filled shape (a
   chain of discs that shrink with age) feathered by a canvas shadow, so it
   never beads or fogs. */

(function () {
  var DEFAULTS = {
    green: 1,          // 1 green light, 0 a dark hole
    R: 0.34,           // lamp radius at rest, as a fraction of the hero height
    Rmove: 0.62,       // radius while moving fast, as a fraction of R
    life: 1.5,         // seconds the trail stays open
    feather: 0.34,     // softness of the edge, as a fraction of the radius
    rest: "bench",     // where the light sits with no cursor: bench (on the reactor) | none
    benchX: 0.5,       // where the reactor stands across the screen
    benchY: 0.60,      // and down it
    benchScale: 0.74,  // 1 = the photograph just covers the screen
    boardDim: 0.4,     // 0..1 darkens the bench above the reactor (the whiteboard)
    dim: 0.16,         // overall dim on the farm
    vignette: 0,       // 0..1 darkness toward the edges, focusing the centre
    rightFade: 0,      // 0..1 black on the right edge of the farm
    rightFadeW: 0.35,  // how far in from the right the fade reaches
    warm: 0,           // seconds of farm alone before the light can switch on
    idleOff: 0,        // seconds of stillness before the light switches off (0 = never)
    centreGrow: 0,     // 0..1 the lamp is larger near the centre, smaller near the edges
    darkRim: 0,        // 0..1 a dark halo around the lamp, on the farm
    scroll: 0          // 1 = scrolling opens the light from the reactor to full frame
  };

  var C = window.LIGHT = Object.assign({}, DEFAULTS, window.LIGHT_PRESET || {});
  var q = new URLSearchParams(location.search);
  Object.keys(DEFAULTS).forEach(function (k) {
    if (!q.has(k)) return;
    C[k] = typeof DEFAULTS[k] === "number" ? Number(q.get(k)) : q.get(k);
  });
  window.LIGHT_DEFAULTS = Object.assign({}, DEFAULTS, window.LIGHT_PRESET || {});

  var hero = document.querySelector(".hero");
  var wrap = document.querySelector(".hero-wrap");
  var MS = 0.5;
  var mask, mctx, lab, lctx, trail = [];

  function smooth(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }

  /* the bench as a full-frame layer, reactor at (benchX, benchY) */
  function benchLayer(S) {
    var b = S.bench, c = S.BENCH.core;
    var s = Math.max(S.W / b.naturalWidth, S.H / b.naturalHeight) * C.benchScale;
    var w = b.naturalWidth * s, h = b.naturalHeight * s;
    var coreMidY = (c[1] + c[3]) / 2;
    var x = S.W * C.benchX - S.BENCH.anchor[0] * w;
    var y = S.H * C.benchY - coreMidY * h;
    if (w >= S.W) x = S.clamp(x, S.W - w, 0);
    if (h >= S.H) y = S.clamp(y, S.H - h, 0);
    return { x: x, y: y, w: w, h: h, cx: x + S.BENCH.anchor[0] * w, cy: y + coreMidY * h };
  }

  function restPoint(S, bl) { return { x: bl.cx, y: bl.cy }; }

  function scrollProgress(S) {
    if (!C.scroll || !wrap) return 0;
    var r = wrap.getBoundingClientRect();
    var span = r.height - S.H;
    return span > 0 ? S.clamp(-r.top / span, 0, 1) : 0;
  }

  Lens({
    hero: hero,
    follow: 22,
    farmFocus: [0.5, 0.55],
    farmFocusPortrait: [0.66, 0.5],
    resize: function (S) {
      mask = mask || document.createElement("canvas");
      lab = lab || document.createElement("canvas");
      mask.width = Math.ceil(S.W * MS); mask.height = Math.ceil(S.H * MS);
      lab.width = Math.ceil(S.W * S.dpr); lab.height = Math.ceil(S.H * S.dpr);
      mctx = mask.getContext("2d"); lctx = lab.getContext("2d");
      trail = [];
    },
    draw: function (S) {
      var ctx = S.ctx, p = S.pointer;
      var live = p.inside && p.everMoved;
      var bl = benchLayer(S);
      var rest = restPoint(S, bl);
      var R = S.H * C.R * (S.portrait ? 0.9 : 1);
      var sp = scrollProgress(S);

      /* ---- is the light on? ------------------------------------------------ */
      var warmDone = S.t > C.warm;
      var awake = live && warmDone && (!C.idleOff || S.t - p.lastMove < C.idleOff);
      var restOn = C.rest !== "none" && warmDone && !live;
      var power = S.to("power", awake || restOn ? 1 : 0, awake ? 7 : 3.5);
      if (awake) S.hint();
      if (C.warm && !warmDone) hero.classList.add("is-waiting"); else hero.classList.remove("is-waiting");

      /* ---- where the lamp is and how wide ---------------------------------- */
      var x, y;
      if (live) {
        x = p.x; y = p.y;
        S.state.lx = x; S.state.ly = y; S.state["lx$v"] = p.vx; S.state["ly$v"] = p.vy;
      } else {
        x = S.to("lx", rest.x, 5); y = S.to("ly", rest.y, 5);
      }
      var speed = live ? Math.hypot(p.vx, p.vy) : 0;
      var grow = 1;
      if (C.centreGrow) {
        var dn = Math.hypot((x - S.W / 2) / (S.W / 2), (y - S.H / 2) / (S.H / 2)) / Math.SQRT2;
        grow = 1 + C.centreGrow * (0.35 - 0.9 * dn);
      }
      var r = S.to("r", R * grow * S.lerp(live ? 0.92 : 1, C.Rmove, smooth(speed / 900)), 8) * power;

      /* ---- the trail -------------------------------------------------------- */
      var last = trail[trail.length - 1], step = Math.max(4, r * 0.18);
      if (r > 1) {
        if (!last) trail.push({ x: x, y: y, t: S.t, r: r });
        else {
          var dist = Math.hypot(x - last.x, y - last.y), n = Math.floor(dist / step);
          for (var i = 1; i <= n; i++) {
            var f = i * step / dist;
            trail.push({ x: S.lerp(last.x, x, f), y: S.lerp(last.y, y, f), t: S.lerp(last.t, S.t, f), r: S.lerp(last.r, r, f) });
          }
        }
      }
      var LIFE = Math.max(0.05, C.life), HOLD = LIFE * 0.23;
      while (trail.length && S.t - trail[0].t > LIFE) trail.shift();

      var off = S.W + 400;
      mctx.setTransform(1, 0, 0, 1, 0, 0);
      mctx.clearRect(0, 0, mask.width, mask.height);
      mctx.setTransform(MS, 0, 0, MS, -off * MS, 0);
      mctx.shadowColor = "#000";
      mctx.shadowBlur = Math.max(12, R * C.feather) * MS;
      mctx.shadowOffsetX = off * MS;
      mctx.beginPath();
      trail.forEach(function (tq) {
        var age = S.t - tq.t;
        var w = age < HOLD ? 1 : 1 - smooth((age - HOLD) / (LIFE - HOLD));
        var rr = tq.r * w;
        if (rr > 1) { mctx.moveTo(tq.x + rr, tq.y); mctx.arc(tq.x, tq.y, rr, 0, Math.PI * 2); }
      });
      if (r > 1) { mctx.moveTo(x + r, y); mctx.arc(x, y, r, 0, Math.PI * 2); }
      /* scrolling opens a light from the reactor out to the whole frame */
      if (sp > 0) {
        var ro = Math.pow(sp, 1.35) * Math.hypot(S.W, S.H) * 0.95;
        mctx.moveTo(bl.cx + ro, bl.cy); mctx.arc(bl.cx, bl.cy, ro, 0, Math.PI * 2);
      }
      mctx.fillStyle = "#000";
      mctx.fill();

      /* ---- 1 · the field ------------------------------------------------------ */
      var fr = S.farmRect;
      ctx.drawImage(S.farm, fr.x, fr.y, fr.w, fr.h);
      ctx.fillStyle = "rgba(0,0,0," + C.dim + ")";
      ctx.fillRect(0, 0, S.W, S.H);
      if (C.vignette > 0) {
        var vg = ctx.createRadialGradient(S.W / 2, S.H * 0.55, S.H * 0.18, S.W / 2, S.H * 0.55, Math.hypot(S.W, S.H) * 0.55);
        vg.addColorStop(0, "rgba(0,0,0,0)");
        vg.addColorStop(1, "rgba(0,0,0," + (0.92 * C.vignette) + ")");
        ctx.fillStyle = vg; ctx.fillRect(0, 0, S.W, S.H);
      }
      if (C.rightFade > 0) {
        var rf = ctx.createLinearGradient(S.W * (1 - C.rightFadeW), 0, S.W, 0);
        rf.addColorStop(0, "rgba(0,0,0,0)");
        rf.addColorStop(1, "rgba(0,0,0," + C.rightFade + ")");
        ctx.fillStyle = rf; ctx.fillRect(S.W * (1 - C.rightFadeW), 0, S.W * C.rightFadeW, S.H);
      }
      /* the headline's corner */
      var tl = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(S.W * 0.62, S.H * 0.7));
      tl.addColorStop(0, "rgba(0,0,0,0.58)");
      tl.addColorStop(0.6, "rgba(0,0,0,0.2)");
      tl.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = tl; ctx.fillRect(0, 0, S.W, S.H);

      /* ---- 2 · around the lamp: green light, or a dark rim ------------------- */
      if (r > 1 && C.green) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        var gl = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 1.8);
        gl.addColorStop(0, "rgba(52,199,89," + 0.22 * power + ")");
        gl.addColorStop(1, "rgba(52,199,89,0)");
        ctx.fillStyle = gl;
        ctx.fillRect(x - r * 2, y - r * 2, r * 4, r * 4);
        ctx.restore();
      }
      if (r > 1 && C.darkRim > 0) {
        var dr = ctx.createRadialGradient(x, y, r * 0.85, x, y, r * 2.4);
        dr.addColorStop(0, "rgba(0,0,0," + 0.62 * C.darkRim * power + ")");
        dr.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = dr;
        ctx.fillRect(x - r * 2.5, y - r * 2.5, r * 5, r * 5);
      }

      /* ---- 3 · the bench, only where the light is ---------------------------- */
      lctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
      lctx.globalCompositeOperation = "source-over";
      lctx.fillStyle = "#000";
      lctx.fillRect(0, 0, S.W, S.H);
      lctx.drawImage(S.bench, bl.x, bl.y, bl.w, bl.h);
      /* where the photograph stops short of the frame, it fades to black */
      var fe = Math.min(bl.w, bl.h) * 0.12;
      [[bl.x, 0, bl.x + fe, 0, bl.x > 0], [bl.x + bl.w, 0, bl.x + bl.w - fe, 0, bl.x + bl.w < S.W],
       [0, bl.y, 0, bl.y + fe, bl.y > 0], [0, bl.y + bl.h, 0, bl.y + bl.h - fe, bl.y + bl.h < S.H]].forEach(function (e) {
        if (!e[4]) return;
        var gg = lctx.createLinearGradient(e[0], e[1], e[2], e[3]);
        gg.addColorStop(0, "#000"); gg.addColorStop(1, "rgba(0,0,0,0)");
        lctx.fillStyle = gg;
        lctx.fillRect(bl.x, bl.y, bl.w, bl.h);
      });
      if (C.boardDim > 0) {
        var ct = bl.y + S.BENCH.core[1] * bl.h;
        var bd = lctx.createLinearGradient(0, ct + bl.h * 0.04, 0, ct - bl.h * 0.22);
        bd.addColorStop(0, "rgba(0,0,0,0)");
        bd.addColorStop(1, "rgba(0,0,0," + C.boardDim + ")");
        lctx.fillStyle = bd;
        lctx.fillRect(bl.x, bl.y, bl.w, ct + bl.h * 0.04 - bl.y);
      }
      lctx.fillStyle = "rgba(0,0,0," + (C.green ? 0.12 : 0.04) + ")";
      lctx.fillRect(0, 0, S.W, S.H);
      lctx.globalCompositeOperation = "destination-in";
      lctx.setTransform(1, 0, 0, 1, 0, 0);
      lctx.drawImage(mask, 0, 0, lab.width, lab.height);
      ctx.drawImage(lab, 0, 0, S.W, S.H);

      /* a dark lens: the rim darkens both layers, so the opening reads as depth */
      if (r > 1 && C.darkRim > 0) {
        var lr = ctx.createRadialGradient(x, y, r * 0.45, x, y, r * 1.6);
        lr.addColorStop(0, "rgba(0,0,0,0)");
        lr.addColorStop(0.42, "rgba(0,0,0," + 0.55 * C.darkRim * power + ")");
        lr.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = lr;
        ctx.fillRect(x - r * 1.7, y - r * 1.7, r * 3.4, r * 3.4);
      }

      S.fadeBottom(S.H * 0.14, 0.6);
      S.dimText(sp * 2.2);
      if (live) S.dot(p.x, p.y, 3.5);
    }
  });
})();
