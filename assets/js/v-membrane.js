/* Variant 4 · Membrane   (under the field, second reading)
   The line between the field and the bench is the reactor's membrane. The
   0.2 µm membrane is the one part of the design that does two jobs at once:
   it keeps the engineered cells in the vessel, and lets the protectant they
   make pass out to the plants.

   So the line is a hairline with pores. Below it, a few cells (drawn as
   rods; the chassis is B. subtilis) drift and turn back at the line. Now and
   then a green point leaves a cell, finds a pore, and rises into the field.
   The cursor sets the line's height. Containment and delivery are one line.

   The drawn scale is symbolic; the page never states the pore size. */

(function () {
  var hero = document.querySelector(".hero");
  var PORE = 24;
  var cells = null, mols = [];

  function place(S) {
    var b = S.bench, c = S.BENCH.core;
    var h = S.H * (S.portrait ? 0.42 : 0.60) / (c[3] - c[1]);
    var w = h * b.naturalWidth / b.naturalHeight;
    if (w < S.W * 1.02) { h *= S.W * 1.02 / w; w = S.W * 1.02; }
    var ax = S.portrait ? S.W * 0.5 : S.W * 0.60;
    var x = S.clamp(ax - S.BENCH.anchor[0] * w, S.W - w, 0);
    return { x: x, y: S.H - 4 - c[3] * h, w: w, h: h };
  }
  function poreAt(x) { return Math.round((x - (PORE - 1.5)) / PORE) * PORE + PORE - 1.5; }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  Lens({
    hero: hero,
    follow: 16,
    farmFocus: [0.5, 0.45],
    farmFocusPortrait: [0.7, 0.45],
    resize: function () { cells = null; mols = []; },
    draw: function (S) {
      var ctx = S.ctx, p = S.pointer;
      var live = p.inside && p.everMoved;
      var pl = place(S);

      var rest = S.H * 0.82;
      var want = live ? S.clamp(p.y, S.H * 0.34, S.H * 0.9) : (S.t < 0.6 ? S.H + 8 : rest);
      if (live && Math.abs(p.y - rest) > 40) S.hint();
      var m = S.to("m", want, 8);
      S.dimText((S.H * 0.5 - m) / (S.H * 0.16));

      if (!cells) {
        cells = [];
        for (var i = 0; i < 8; i++) cells.push({ x: rnd(0.3, 0.92) * S.W, y: S.H * rnd(0.9, 0.96), a: rnd(-0.4, 0.4), va: rnd(-0.15, 0.15), vx: rnd(-10, 10), vy: rnd(-6, 6), emit: rnd(0.4, 2.4) });
      }

      /* ---- simulate: cells wander and turn back at the line ------------- */
      var dt = S.reduced ? 0 : S.dt;
      cells.forEach(function (c) {
        c.vx = S.clamp(c.vx + rnd(-18, 18) * dt, -16, 16);
        c.vy = S.clamp(c.vy + rnd(-18, 18) * dt, -12, 12);
        c.x += c.vx * dt; c.y += c.vy * dt; c.a += c.va * dt;
        if (c.y < m + 18) { c.y = m + 18; c.vy = Math.abs(c.vy) + 3; }
        if (c.y > S.H - 14) { c.y = S.H - 14; c.vy = -Math.abs(c.vy); }
        if (c.x < 24 || c.x > S.W - 24) { c.vx = -c.vx; c.x = S.clamp(c.x, 24, S.W - 24); }
        c.emit -= dt;
        if (c.emit <= 0 && mols.length < 36) {
          c.emit = rnd(1.2, 2.8);
          mols.push({ x: c.x, y: c.y - 4, vy: -rnd(26, 40), ph: rnd(0, 6.28), passed: false, age: 0, life: rnd(3.5, 5.5) });
        }
      });
      mols = mols.filter(function (q) {
        q.age += dt;
        if (!q.passed) {
          if (q.y < m + 30) q.x = S.lerp(q.x, poreAt(q.x), 1 - Math.exp(-10 * dt));
          q.y += q.vy * dt;
          if (q.y < m - 3) { q.passed = true; q.age = 0; }
          return q.age < 14;
        }
        q.y += q.vy * 0.7 * dt;
        q.x += Math.sin(q.ph + q.age * 1.2) * 10 * dt;
        return q.age < q.life;
      });

      /* ---- 1 · field ------------------------------------------------------- */
      S.grade();

      /* ---- 2 · below the line: the bench, quiet, and the cells ------------ */
      ctx.save();
      ctx.beginPath(); ctx.rect(0, m, S.W, S.H - m + 2); ctx.clip();
      ctx.fillStyle = "#000"; ctx.fillRect(0, m, S.W, S.H - m);
      ctx.drawImage(S.bench, pl.x, pl.y, pl.w, pl.h);
      ctx.fillStyle = "rgba(0,0,0,0.38)"; ctx.fillRect(0, m, S.W, S.H - m);
      var sh = ctx.createLinearGradient(0, m, 0, m + 56);
      sh.addColorStop(0, "rgba(0,0,0,0.6)"); sh.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = sh; ctx.fillRect(0, m, S.W, 56);
      ctx.lineWidth = 1;
      cells.forEach(function (c) {
        ctx.save();
        ctx.translate(c.x, c.y); ctx.rotate(c.a);
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-9, -3.5, 18, 7, 3.5); else ctx.rect(-9, -3.5, 18, 7);
        ctx.fillStyle = "rgba(255,255,255,0.10)"; ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.stroke();
        ctx.restore();
      });
      ctx.restore();
      S.fadeBottom(S.H * 0.1, 0.5);

      /* ---- 3 · the membrane: one hairline, pores through it -------------- */
      ctx.save();
      var glow = ctx.createLinearGradient(0, m - 10, 0, m + 10);
      glow.addColorStop(0, "rgba(255,255,255,0)");
      glow.addColorStop(0.5, "rgba(255,255,255,0.07)");
      glow.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = glow; ctx.fillRect(0, m - 10, S.W, 20);
      ctx.setLineDash([PORE - 3, 3]);
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, Math.round(m) + 0.5); ctx.lineTo(S.W, Math.round(m) + 0.5); ctx.stroke();
      ctx.restore();

      /* ---- 4 · the protectant ---------------------------------------------- */
      ctx.save();
      mols.forEach(function (q) {
        var a = q.passed ? Math.max(0, 1 - q.age / q.life) : 0.9;
        ctx.beginPath();
        ctx.arc(q.x, q.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(52,199,89," + a + ")";
        ctx.shadowColor = "rgba(52,199,89," + a * 0.9 + ")";
        ctx.shadowBlur = 8;
        ctx.fill();
      });
      ctx.restore();

      if (live) S.dot(p.x, p.y, 3);
    }
  });
})();
