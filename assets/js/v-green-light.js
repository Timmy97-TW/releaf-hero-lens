/* Variant 1 · Green light
   The cursor is a green lamp over the field. Where the light falls, the bench
   switches on underneath; behind the lamp the lit path narrows and closes like
   a comet's tail. The project's expression switch is designed to answer to
   green light, and the bench has a green LED strip round its edge, so the
   colour is ours.

   At rest the lamp sits as a pool of light in the grass right of the queue,
   with the reactor inside it, so the first screen shows both layers before
   anyone moves the mouse.

   The lit path is one filled shape (a chain of discs whose radius shrinks with
   age), feathered with a canvas shadow. One fill means no overlapping alpha,
   so the trail fades smoothly instead of leaving beads. */

(function () {
  var hero = document.querySelector(".hero");
  var hint = document.querySelector(".hero__hint");
  var LIFE = 2.2;          // seconds a point of the trail lives
  var HOLD = 0.7;          // of which it stays at full width
  var MS = 0.5;            // mask resolution

  var mask, mctx, lab, lctx, trail = [];

  function geo(S) {
    var Rrest = S.portrait ? S.W * 0.40 : Math.min(S.H * 0.29, S.W * 0.19);
    var pool = S.portrait ? { x: S.W * 0.52, y: S.H * 0.66 } : S.P(0.83, 0.72);
    pool.x = S.clamp(pool.x, Rrest, S.W - Rrest * 0.95);
    pool.y = S.clamp(pool.y, Rrest, S.H - Rrest * 1.05);
    return { Rrest: Rrest, Rmove: Rrest * 0.62, pool: pool };
  }

  function smooth(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }

  Lens({
    hero: hero,
    follow: 16,
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
      var ctx = S.ctx, p = S.pointer, st = S.state, g = geo(S);
      var live = p.inside && p.everMoved;

      /* ---- where the lamp is, and how wide its light ------------------- */
      if (st.x === undefined) {
        st.intro = S.reduced ? 1 : 0;
        var s0 = S.P(0.30, 0.52);
        st.x = S.reduced ? g.pool.x : s0.x; st.y = S.reduced ? g.pool.y : s0.y;
        st.r = S.reduced ? g.Rrest : g.Rmove;
      }
      var tx, ty, tr;
      if (live) {
        st.intro = 1;
        var speed = Math.hypot(p.vx, p.vy);
        /* the light gathers when the lamp slows down */
        tr = S.lerp(g.Rrest * 0.92, g.Rmove, smooth(speed / 700));
        if (hint) hint.classList.add("is-gone");
        st.x = p.x; st.y = p.y;
      } else if (st.intro < 1) {
        /* first visit: the lamp comes up the queue and settles in the grass */
        st.intro = Math.min(1, st.intro + S.dt / 2.6);
        var e = S.ease(st.intro), s1 = S.P(0.30, 0.52), mid = S.P(0.62, 0.40);
        var a = S.lerp(s1.x, mid.x, e), b = S.lerp(mid.x, g.pool.x, e);
        var c = S.lerp(s1.y, mid.y, e), d = S.lerp(mid.y, g.pool.y, e);
        st.x = S.lerp(a, b, e); st.y = S.lerp(c, d, e);
        tr = S.lerp(g.Rmove, g.Rrest, smooth((st.intro - 0.6) / 0.4));
      } else {
        /* resting: drift home and breathe very slightly */
        tx = g.pool.x + Math.sin(S.t * 0.6) * 4; ty = g.pool.y + Math.cos(S.t * 0.5) * 3;
        var kk = S.reduced ? 1 : 1 - Math.exp(-2.4 * S.dt);
        st.x = S.lerp(st.x, tx, kk); st.y = S.lerp(st.y, ty, kk);
        tr = g.Rrest;
      }
      st.r = S.lerp(st.r, tr, S.reduced ? 1 : 1 - Math.exp(-5 * S.dt));

      /* ---- the trail ------------------------------------------------------- */
      var last = trail[trail.length - 1];
      var step = Math.max(4, st.r * 0.2);
      if (!last) trail.push({ x: st.x, y: st.y, t: S.t, r: st.r });
      else {
        var dist = Math.hypot(st.x - last.x, st.y - last.y);
        var n = Math.floor(dist / step);
        for (var i = 1; i <= n; i++) {
          var f = i * step / dist;
          trail.push({ x: S.lerp(last.x, st.x, f), y: S.lerp(last.y, st.y, f), t: S.lerp(last.t, S.t, f), r: S.lerp(last.r, st.r, f) });
        }
      }
      while (trail.length && S.t - trail[0].t > LIFE) trail.shift();

      var off = S.W + 400;
      mctx.setTransform(1, 0, 0, 1, 0, 0);
      mctx.clearRect(0, 0, mask.width, mask.height);
      mctx.setTransform(MS, 0, 0, MS, -off * MS, 0);
      mctx.shadowColor = "#000";
      mctx.shadowBlur = Math.max(10, st.r * 0.24) * MS;
      mctx.shadowOffsetX = off * MS;
      mctx.beginPath();
      trail.forEach(function (q) {
        var age = S.t - q.t;
        var w = age < HOLD ? 1 : 1 - smooth((age - HOLD) / (LIFE - HOLD));
        var rr = q.r * (0.35 + 0.65 * w) * w;
        if (rr > 1) { mctx.moveTo(q.x + rr, q.y); mctx.arc(q.x, q.y, rr, 0, Math.PI * 2); }
      });
      mctx.moveTo(st.x + st.r, st.y);
      mctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      mctx.fillStyle = "#000";
      mctx.fill();

      /* ---- 1 · the field at dusk ----------------------------------------- */
      S.drawFarm();
      ctx.fillStyle = "rgba(7,11,9,0.28)";
      ctx.fillRect(0, 0, S.W, S.H);
      var cc = S.P(0.55, 0.58);
      var rg = ctx.createRadialGradient(cc.x, cc.y, S.W * 0.14, cc.x, cc.y, S.W * 0.85);
      rg.addColorStop(0, "rgba(7,11,9,0)");
      rg.addColorStop(1, "rgba(7,11,9,0.72)");
      ctx.fillStyle = rg; ctx.fillRect(0, 0, S.W, S.H);
      var tg = ctx.createLinearGradient(0, 0, S.W * 0.5, S.H * 0.55);
      tg.addColorStop(0, "rgba(7,11,9,0.55)");
      tg.addColorStop(1, "rgba(7,11,9,0)");
      ctx.fillStyle = tg; ctx.fillRect(0, 0, S.W, S.H);

      /* ---- 2 · green light spilling on the field around the lamp -------- */
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      var gl = ctx.createRadialGradient(st.x, st.y, st.r * 0.2, st.x, st.y, st.r * 1.9);
      gl.addColorStop(0, "rgba(90,220,140,0.30)");
      gl.addColorStop(0.55, "rgba(90,220,140,0.10)");
      gl.addColorStop(1, "rgba(90,220,140,0)");
      ctx.fillStyle = gl;
      ctx.fillRect(st.x - st.r * 2, st.y - st.r * 2, st.r * 4, st.r * 4);
      ctx.restore();

      /* ---- 3 · the bench, wherever the light has been ------------------- */
      var place = S.benchRect(g.pool.x, g.pool.y, g.Rrest * 1.3);
      lctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
      lctx.globalCompositeOperation = "source-over";
      lctx.clearRect(0, 0, S.W, S.H);
      lctx.drawImage(S.bench, place.x, place.y, place.w, place.h);
      /* the bench at the same dusk as the field, so the whiteboard does not glare */
      lctx.globalCompositeOperation = "source-atop";
      lctx.fillStyle = "rgba(10,20,14,0.26)";
      lctx.fillRect(place.x, place.y, place.w, place.h);
      /* soften the photograph's own edges so a sweep past them fades out */
      lctx.globalCompositeOperation = "destination-out";
      var fe = Math.min(place.w, place.h) * 0.14;
      [["x", 0], ["x", 1], ["y", 0], ["y", 1]].forEach(function (sd) {
        var gg, v0, v1;
        if (sd[0] === "x") {
          v0 = sd[1] ? place.x + place.w : place.x; v1 = sd[1] ? v0 - fe : v0 + fe;
          gg = lctx.createLinearGradient(v0, 0, v1, 0);
        } else {
          v0 = sd[1] ? place.y + place.h : place.y; v1 = sd[1] ? v0 - fe : v0 + fe;
          gg = lctx.createLinearGradient(0, v0, 0, v1);
        }
        gg.addColorStop(0, "rgba(0,0,0,1)"); gg.addColorStop(1, "rgba(0,0,0,0)");
        lctx.fillStyle = gg;
        lctx.fillRect(place.x - 2, place.y - 2, place.w + 4, place.h + 4);
      });
      lctx.globalCompositeOperation = "destination-in";
      lctx.setTransform(1, 0, 0, 1, 0, 0);
      lctx.drawImage(mask, 0, 0, lab.width, lab.height);
      ctx.drawImage(lab, 0, 0, S.W, S.H);

      /* ---- 4 · a faint green wash over the lit bench, and the lamp ------- */
      ctx.save();
      ctx.globalCompositeOperation = "soft-light";
      ctx.globalAlpha = 0.35;
      lctx.globalCompositeOperation = "source-in";
      lctx.fillStyle = "#58d68d";
      lctx.fillRect(0, 0, lab.width, lab.height);
      ctx.drawImage(lab, 0, 0, S.W, S.H);
      ctx.restore();

      if (live) {
        ctx.beginPath();
        ctx.arc(st.x, st.y, 5, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(210,255,225,0.95)";
        ctx.lineWidth = 1.5;
        ctx.shadowColor = "#6fe39a"; ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      var bg = ctx.createLinearGradient(0, S.H - 90, 0, S.H);
      bg.addColorStop(0, "rgba(7,11,9,0)");
      bg.addColorStop(1, "rgba(7,11,9,0.8)");
      ctx.fillStyle = bg; ctx.fillRect(0, S.H - 90, S.W, 90);
    }
  });
})();
