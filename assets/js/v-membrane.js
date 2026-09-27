/* Variant 4 · Membrane   (under the field, second reading)
   The line between the field and the bench is the reactor's membrane. The
   0.2 µm membrane is the one part of the design that does two jobs at once:
   it keeps the engineered cells inside the vessel, and it lets the
   protectant they make pass out to the plants.

   So the line has pores. Below it, the cells (rods, since the chassis is
   B. subtilis) drift and bounce off it; none crosses. Small bright molecules
   leave the cells, find a pore, pass through and rise into the field. The
   cursor sets the membrane's height: lift it to see more of the bench.
   Containment and delivery are the same line: that is the argument. */

(function () {
  var hero = document.querySelector(".hero");
  var hint = document.querySelector(".hero__hint");
  var PORE = 26;            // pore spacing, px
  var cells = null, mols = [];

  function place(S) {
    /* the bench spans the width under the membrane, the reactor's foot just
       above the bottom edge */
    var b = S.bench, c = S.BENCH.core;
    var h = S.H * (S.portrait ? 0.42 : 0.60) / (c[3] - c[1]);
    var w = h * b.naturalWidth / b.naturalHeight;
    if (w < S.W * 1.02) { h *= S.W * 1.02 / w; w = S.W * 1.02; }
    var ax = S.portrait ? S.W * 0.5 : S.W * 0.60;
    var x = S.clamp(ax - S.BENCH.anchor[0] * w, S.W - w, 0);
    return { x: x, y: S.H - 6 - c[3] * h, w: w, h: h };
  }

  function poreAt(x) { return Math.round((x - (PORE - 2.5)) / PORE) * PORE + PORE - 2.5; }

  function rnd(a, b) { return a + Math.random() * (b - a); }

  Lens({
    hero: hero,
    follow: 12,
    farmFocus: [0.5, 0.45],
    farmFocusPortrait: [0.7, 0.45],
    resize: function () { cells = null; mols = []; },
    draw: function (S) {
      var ctx = S.ctx, p = S.pointer, st = S.state;
      var pl = place(S);
      var live = p.inside && p.everMoved;

      var rest = S.H * 0.84;
      var want = live ? S.clamp(p.y, S.H * 0.30, S.H * 0.92) : rest + Math.sin(S.t * 0.7) * S.H * 0.012;
      if (live && hint && Math.abs(p.y - rest) > 30) hint.classList.add("is-gone");
      if (st.m === undefined) st.m = S.reduced ? rest : S.H + 10;
      st.m = S.lerp(st.m, want, S.reduced ? 1 : 1 - Math.exp(-6 * S.dt));
      var m = st.m;

      if (!cells) {
        cells = [];
        for (var i = 0; i < 14; i++) {
          cells.push({ x: rnd(0.25, 0.95) * S.W, y: rnd(0.88, 0.97) * S.H, a: rnd(0, Math.PI), va: rnd(-0.4, 0.4), vx: rnd(-14, 14), vy: rnd(-10, 10), emit: rnd(0, 2) });
        }
      }

      /* ---- simulate ------------------------------------------------------- */
      var dt = S.reduced ? 0 : S.dt;
      cells.forEach(function (c) {
        c.vx += rnd(-30, 30) * dt; c.vy += rnd(-30, 30) * dt;
        c.vx *= 0.98; c.vy *= 0.98;
        c.x += c.vx * dt; c.y += c.vy * dt; c.a += c.va * dt;
        var top = m + 16;
        if (c.y < top) { c.y = top + 1; c.vy = Math.abs(c.vy) * 0.8 + 4; }   // the membrane holds them
        if (c.y > S.H - 12) { c.y = S.H - 12; c.vy = -Math.abs(c.vy); }
        if (c.x < 10) { c.x = 10; c.vx = Math.abs(c.vx); }
        if (c.x > S.W - 10) { c.x = S.W - 10; c.vx = -Math.abs(c.vx); }
        c.emit -= dt;
        if (c.emit <= 0 && mols.length < 160) {
          c.emit = rnd(0.5, 1.6);
          mols.push({ x: c.x, y: c.y, vy: -rnd(38, 64), ph: rnd(0, 6.28), passed: false, age: 0, life: rnd(3.2, 5.2) });
        }
      });
      mols = mols.filter(function (q) {
        q.age += dt;
        if (!q.passed) {
          /* near the membrane, steer to the nearest pore and go through it */
          if (q.y < m + 30) q.x = S.lerp(q.x, poreAt(q.x), 1 - Math.exp(-12 * dt));
          else q.x += Math.sin(q.ph + q.age * 3) * 10 * dt;
          q.y += q.vy * dt;
          if (q.y < m - 4) { q.passed = true; q.age = 0; }
          return q.age < 12;
        }
        q.y += q.vy * 0.8 * dt;
        q.x += Math.sin(q.ph + q.age * 1.6) * 18 * dt;
        return q.age < q.life;
      });

      /* ---- 1 · field ------------------------------------------------------ */
      S.drawFarm();
      var cc = S.P(0.55, 0.52);
      var rg = ctx.createRadialGradient(cc.x, cc.y, S.W * 0.12, cc.x, cc.y, S.W * 0.85);
      rg.addColorStop(0, "rgba(7,11,9,0)");
      rg.addColorStop(0.55, "rgba(7,11,9,0.30)");
      rg.addColorStop(1, "rgba(7,11,9,0.82)");
      ctx.fillStyle = rg; ctx.fillRect(0, 0, S.W, S.H);
      var tg = ctx.createLinearGradient(0, 0, S.W * 0.5, S.H * 0.55);
      tg.addColorStop(0, "rgba(7,11,9,0.6)");
      tg.addColorStop(1, "rgba(7,11,9,0)");
      ctx.fillStyle = tg; ctx.fillRect(0, 0, S.W, S.H);

      /* ---- 2 · below the membrane: the bench, and the cells --------------- */
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, m, S.W, S.H - m + 2);
      ctx.clip();
      ctx.fillStyle = "#070b09"; ctx.fillRect(0, m, S.W, S.H - m);
      ctx.drawImage(S.bench, pl.x, pl.y, pl.w, pl.h);
      ctx.fillStyle = "rgba(7,11,9,0.34)"; ctx.fillRect(0, m, S.W, S.H - m);
      var sh = ctx.createLinearGradient(0, m, 0, m + 60);
      sh.addColorStop(0, "rgba(0,0,0,0.55)");
      sh.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = sh; ctx.fillRect(0, m, S.W, 60);
      cells.forEach(function (c) {
        ctx.save();
        ctx.translate(c.x, c.y); ctx.rotate(c.a);
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-10, -3.8, 20, 7.6, 3.8); else ctx.rect(-10, -3.8, 20, 7.6);
        ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 6;
        ctx.fillStyle = "rgba(111,227,154,0.38)";
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(190,250,210,0.95)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
      });
      ctx.restore();

      /* ---- 3 · the membrane: two hairlines with pores through both -------- */
      ctx.save();
      ctx.fillStyle = "rgba(243,238,210,0.10)";
      ctx.fillRect(0, m - 3, S.W, 6);
      ctx.setLineDash([PORE - 5, 5]);
      ctx.strokeStyle = "rgba(243,238,210,0.9)";
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(0, m - 3); ctx.lineTo(S.W, m - 3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, m + 3); ctx.lineTo(S.W, m + 3); ctx.stroke();
      ctx.restore();

      /* ---- 4 · the protectant: through the pores and up into the field ---- */
      mols.forEach(function (q) {
        var a = q.passed ? Math.max(0, 1 - q.age / q.life) : 0.95;
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.passed ? 2.6 : 2.1, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(190,255,215," + a + ")";
        ctx.shadowColor = "rgba(111,227,154," + a + ")";
        ctx.shadowBlur = 10;
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      var bg = ctx.createLinearGradient(0, S.H - 64, 0, S.H);
      bg.addColorStop(0, "rgba(7,11,9,0)");
      bg.addColorStop(1, "rgba(7,11,9,0.6)");
      ctx.fillStyle = bg; ctx.fillRect(0, S.H - 64, S.W, 64);
    }
  });
})();
