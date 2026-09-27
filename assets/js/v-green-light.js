/* Variant 1 · Green light
   The cursor is a lamp. Where its light falls, the bench appears under the
   field; behind it the lit path narrows and closes. The project's expression
   switch is designed to answer to green light, so the light is green, and
   used nowhere else on the screen.

   At rest the light is a pool in the grass right of the queue with the
   reactor inside it, so the first screen already shows both layers.

   The lit path is one filled shape (a chain of discs that shrink with age),
   feathered by a canvas shadow: one fill, so it never beads or fogs. */

(function () {
  var hero = document.querySelector(".hero");
  var LIFE = 1.5, HOLD = 0.35, MS = 0.5;
  var mask, mctx, lab, lctx, trail = [];

  function geo(S) {
    var R = S.portrait ? S.W * 0.36 : Math.min(S.H * 0.27, S.W * 0.17);
    var pool = S.portrait ? { x: S.W * 0.5, y: S.H * 0.68 } : S.P(0.835, 0.73);
    pool.x = S.clamp(pool.x, R, S.W - R * 1.08);
    pool.y = S.clamp(pool.y, R, S.H - R * 1.12);
    return { R: R, pool: pool };
  }
  function smooth(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }

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
      var ctx = S.ctx, p = S.pointer, g = geo(S);
      var live = p.inside && p.everMoved;

      /* the lamp: under the cursor when there is one, else home to the pool */
      var tx = live ? p.x : g.pool.x, ty = live ? p.y : g.pool.y;
      var speed = live ? Math.hypot(p.vx, p.vy) : 0;
      var x = live ? p.x : S.to("lx", tx, 5), y = live ? p.y : S.to("ly", ty, 5);
      if (live) { S.state.lx = x; S.state.ly = y; S.state["lx$v"] = p.vx; S.state["ly$v"] = p.vy; S.hint(); }
      /* the light gathers when the lamp is still and thins when it moves */
      var r = S.to("r", g.R * S.lerp(live ? 0.9 : 1, 0.6, smooth(speed / 900)), 8);

      /* trail, resampled so a fast sweep has no gaps */
      var last = trail[trail.length - 1], step = Math.max(4, r * 0.18);
      if (!last) trail.push({ x: x, y: y, t: S.t, r: r });
      else {
        var dist = Math.hypot(x - last.x, y - last.y), n = Math.floor(dist / step);
        for (var i = 1; i <= n; i++) {
          var f = i * step / dist;
          trail.push({ x: S.lerp(last.x, x, f), y: S.lerp(last.y, y, f), t: S.lerp(last.t, S.t, f), r: S.lerp(last.r, r, f) });
        }
      }
      while (trail.length && S.t - trail[0].t > LIFE) trail.shift();

      var off = S.W + 400;
      mctx.setTransform(1, 0, 0, 1, 0, 0);
      mctx.clearRect(0, 0, mask.width, mask.height);
      mctx.setTransform(MS, 0, 0, MS, -off * MS, 0);
      mctx.shadowColor = "#000";
      mctx.shadowBlur = Math.max(12, r * 0.34) * MS;
      mctx.shadowOffsetX = off * MS;
      mctx.beginPath();
      trail.forEach(function (q) {
        var age = S.t - q.t;
        var w = age < HOLD ? 1 : 1 - smooth((age - HOLD) / (LIFE - HOLD));
        var rr = q.r * w;
        if (rr > 1) { mctx.moveTo(q.x + rr, q.y); mctx.arc(q.x, q.y, rr, 0, Math.PI * 2); }
      });
      mctx.moveTo(x + r, y); mctx.arc(x, y, r, 0, Math.PI * 2);
      mctx.fillStyle = "#000";
      mctx.fill();

      /* 1 · the field */
      S.grade();

      /* 2 · a breath of green light on the field around the lamp */
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      var gl = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 1.8);
      gl.addColorStop(0, "rgba(52,199,89,0.22)");
      gl.addColorStop(1, "rgba(52,199,89,0)");
      ctx.fillStyle = gl;
      ctx.fillRect(x - r * 2, y - r * 2, r * 4, r * 4);
      ctx.restore();

      /* 3 · the bench, only where the light is */
      var pl = S.benchRect(g.pool.x, g.pool.y + g.R * 0.16, g.R * 1.72);
      lctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
      lctx.globalCompositeOperation = "source-over";
      lctx.clearRect(0, 0, S.W, S.H);
      lctx.drawImage(S.bench, pl.x, pl.y, pl.w, pl.h);
      lctx.globalCompositeOperation = "source-atop";
      lctx.fillStyle = "rgba(0,0,0,0.2)";
      lctx.fillRect(pl.x, pl.y, pl.w, pl.h);
      lctx.globalCompositeOperation = "destination-out";
      var fe = Math.min(pl.w, pl.h) * 0.16;
      [[pl.x, 0, pl.x + fe, 0], [pl.x + pl.w, 0, pl.x + pl.w - fe, 0], [0, pl.y, 0, pl.y + fe], [0, pl.y + pl.h, 0, pl.y + pl.h - fe]].forEach(function (c) {
        var gg = lctx.createLinearGradient(c[0], c[1], c[2], c[3]);
        gg.addColorStop(0, "#000"); gg.addColorStop(1, "rgba(0,0,0,0)");
        lctx.fillStyle = gg;
        lctx.fillRect(pl.x - 1, pl.y - 1, pl.w + 2, pl.h + 2);
      });
      lctx.globalCompositeOperation = "destination-in";
      lctx.setTransform(1, 0, 0, 1, 0, 0);
      lctx.drawImage(mask, 0, 0, lab.width, lab.height);
      ctx.drawImage(lab, 0, 0, S.W, S.H);

      S.fadeBottom();
      if (live) S.dot(x, y, 3.5);
    }
  });
})();
