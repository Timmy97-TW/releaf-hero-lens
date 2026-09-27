/* Variant 3 · Green light
   The cursor is a green lamp. Wherever it passes, the bench shows through,
   and a few seconds later the farm closes over it again. The project's
   expression switch answers to green light, and the bench switched on here
   the same way. Sweep across and the whole reactor comes up.

   The bench is registered to the frame this time: it is one layer the size
   of the hero, with the reactor placed under the grass to the right of the
   queue, so a sweep in any direction uncovers one consistent room. */

(function () {
  var hero = document.querySelector(".hero");
  var hint = document.querySelector(".hero__hint");
  var DECAY = 2.6;           // seconds for a lit patch to close again

  var mask, mctx, boost, bctx, lab, lctx, SCALE = 0.5;

  function brush(S) { return S.portrait ? S.W * 0.32 : Math.min(S.W * 0.14, S.H * 0.27); }

  function benchPlace(S) {
    /* reactor under the grass right of the queue; big enough that a sweep
       has something to find, and always covering the frame */
    var at = S.portrait ? { x: S.W * 0.5, y: S.H * 0.66 } : S.P(0.76, 0.66);
    var coreH = S.portrait ? S.H * 0.30 : S.H * 0.46;
    var r = S.benchRect(at.x, at.y, coreH);
    /* keep the whole bench photograph inside the frame where it fits */
    r.x = r.w <= S.W ? S.clamp(r.x, 0, S.W - r.w) : S.clamp(r.x, S.W - r.w, 0);
    r.y = r.h <= S.H ? S.clamp(r.y, 0, S.H - r.h) : S.clamp(r.y, S.H - r.h, 0);
    return r;
  }

  function stamp(S, x, y, R, strength) {
    var g = mctx.createRadialGradient(x, y, 0, x, y, R);
    g.addColorStop(0, "rgba(0,0,0," + strength + ")");
    g.addColorStop(0.55, "rgba(0,0,0," + strength * 0.85 + ")");
    g.addColorStop(1, "rgba(0,0,0,0)");
    mctx.fillStyle = g;
    mctx.fillRect(x - R, y - R, R * 2, R * 2);
  }

  /* When nobody is steering, the lamp sweeps the reactor in a slow S. */
  function idlePath(S, t, place) {
    var cx = place.x + place.w * 0.5, cy = place.y + place.h * 0.72;
    var cyc = 9, u = (t % cyc) / cyc;
    if (u > 0.55) return null;             // dark between sweeps
    var v = u / 0.55;
    var w = place.w * 0.36, h = place.h * 0.18;
    return { x: cx + Math.sin(v * Math.PI * 2.2 - 1.6) * w * 0.5, y: cy - h * 0.5 + v * h };
  }

  Lens({
    hero: hero,
    farmFocus: [0.5, 0.55],
    farmFocusPortrait: [0.66, 0.5],
    resize: function (S) {
      mask = mask || document.createElement("canvas");
      boost = boost || document.createElement("canvas");
      boost.width = Math.ceil(S.W * SCALE); boost.height = Math.ceil(S.H * SCALE);
      bctx = boost.getContext("2d");
      lab = lab || document.createElement("canvas");
      mask.width = Math.ceil(S.W * SCALE); mask.height = Math.ceil(S.H * SCALE);
      lab.width = Math.ceil(S.W * S.dpr); lab.height = Math.ceil(S.H * S.dpr);
      mctx = mask.getContext("2d"); lctx = lab.getContext("2d");
      S.state.prev = null;
    },
    draw: function (S) {
      var ctx = S.ctx, p = S.pointer, st = S.state;
      var place = benchPlace(S);
      var R = brush(S);

      /* 1 · the lit patches close again */
      mctx.setTransform(1, 0, 0, 1, 0, 0);
      mctx.globalCompositeOperation = "destination-out";
      mctx.fillStyle = "rgba(0,0,0," + Math.min(1, S.dt / DECAY * 1.6) + ")";
      mctx.fillRect(0, 0, mask.width, mask.height);
      mctx.globalCompositeOperation = "source-over";
      mctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);

      /* 2 · the lamp lights where it is */
      var lamp = null;
      if (p.inside && p.everMoved) {
        lamp = { x: p.x, y: p.y };
        if (hint) hint.classList.add("is-gone");
      } else if (!S.reduced) {
        lamp = idlePath(S, S.t, place);
      }
      if (S.reduced && !(p.inside && p.everMoved)) {
        /* no animation: leave the reactor lit */
        var c0 = { x: place.x + place.w * 0.5, y: place.y + place.h * 0.66 };
        stamp(S, c0.x, c0.y, R * 1.5, 1);
      }
      if (lamp) {
        var prev = st.prev || lamp;
        var dist = Math.hypot(lamp.x - prev.x, lamp.y - prev.y);
        var n = Math.max(1, Math.ceil(dist / (R * 0.25)));
        for (var i = 1; i <= n; i++) {
          stamp(S, S.lerp(prev.x, lamp.x, i / n), S.lerp(prev.y, lamp.y, i / n), R, 0.55);
        }
        st.prev = lamp;
      } else {
        st.prev = null;
      }

      /* 3 · the farm at dusk */
      S.drawFarm();
      var cc = S.P(0.5, 0.55);
      var rg = ctx.createRadialGradient(cc.x, cc.y, S.W * 0.1, cc.x, cc.y, S.W * 0.85);
      rg.addColorStop(0, "rgba(7,11,9,0.22)");
      rg.addColorStop(1, "rgba(7,11,9,0.84)");
      ctx.fillStyle = rg; ctx.fillRect(0, 0, S.W, S.H);
      var tg = ctx.createLinearGradient(0, 0, S.W * 0.5, S.H * 0.55);
      tg.addColorStop(0, "rgba(7,11,9,0.55)");
      tg.addColorStop(1, "rgba(7,11,9,0)");
      ctx.fillStyle = tg; ctx.fillRect(0, 0, S.W, S.H);

      /* 4 · the bench, only where the light has been */
      lctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
      lctx.globalCompositeOperation = "source-over";
      lctx.fillStyle = "#070b09";
      lctx.fillRect(0, 0, S.W, S.H);
      lctx.drawImage(S.bench, place.x, place.y, place.w, place.h);
      /* The mask decays evenly; drawn three times over itself it holds near
         full strength for the first second and then falls away, which reads
         as "on, then off" instead of a slow fog. */
      bctx.globalCompositeOperation = "copy";
      bctx.drawImage(mask, 0, 0);
      bctx.globalCompositeOperation = "source-over";
      bctx.drawImage(mask, 0, 0);
      bctx.drawImage(mask, 0, 0);
      lctx.globalCompositeOperation = "destination-in";
      lctx.drawImage(boost, 0, 0, S.W, S.H);
      ctx.drawImage(lab, 0, 0, S.W, S.H);

      /* 5 · a green cast on the edges of the lit patch, and the lamp itself */
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.05;
      lctx.globalCompositeOperation = "source-in";
      lctx.fillStyle = "#3fd87a";
      lctx.fillRect(0, 0, S.W, S.H);
      ctx.drawImage(lab, 0, 0, S.W, S.H);
      ctx.restore();
      if (lamp) {
        var gl = ctx.createRadialGradient(lamp.x, lamp.y, 0, lamp.x, lamp.y, R * 1.25);
        gl.addColorStop(0, "rgba(111,227,154,0.20)");
        gl.addColorStop(0.7, "rgba(111,227,154,0.05)");
        gl.addColorStop(1, "rgba(111,227,154,0)");
        ctx.fillStyle = gl;
        ctx.fillRect(lamp.x - R * 1.3, lamp.y - R * 1.3, R * 2.6, R * 2.6);
        ctx.beginPath();
        ctx.arc(lamp.x, lamp.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(190,255,210,0.95)";
        ctx.shadowColor = "#6fe39a"; ctx.shadowBlur = 16;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  });
})();
