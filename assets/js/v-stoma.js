/* Variant 2 · Stoma
   The window is a leaf pore between two guard cells. It opens when the cursor
   rests and narrows to a slit while it moves, the way a stoma opens in calm
   light. Left alone it breathes. The ground is pale: the farm is washed toward
   the cream of the team shirts instead of darkened.

   Drawn the way a stoma works: the outline of the pair is fixed, and as the
   pore opens the two cells get thinner around it. */

(function () {
  var hero = document.querySelector(".hero");
  var hint = document.querySelector(".hero__hint");

  function geometry(S) {
    if (S.portrait) {
      var Lp = S.W * 0.84;
      return { L: Lp, home: { x: S.W * 0.5, y: S.H * 0.7 }, ang: -0.12 };
    }
    var L = Math.min(S.W * 0.36, S.H * 0.85);
    var h = S.P(0.83, 0.78);
    h.x = S.clamp(h.x, L * 0.6, S.W - L * 0.6);
    h.y = S.clamp(h.y, S.H * 0.4, S.H - L * 0.36);
    return { L: L, home: h, ang: -0.2 };
  }

  var N = 48;
  /* half-height of the pore at x, for a pore of half-length h and half-height a */
  function poreY(x, h, a) { var u = x / h; return a * Math.pow(Math.max(0, 1 - u * u), 0.8); }
  function outerY(x, H, B) { var u = x / H; return B * Math.sqrt(Math.max(0, 1 - u * u)); }

  function porePath(ctx, h, a, keep) {
    if (!keep) ctx.beginPath();
    for (var i = 0; i <= N; i++) { var x = -h + 2 * h * i / N; ctx[i ? "lineTo" : "moveTo"](x, -poreY(x, h, a)); }
    for (var j = N; j >= 0; j--) { var x2 = -h + 2 * h * j / N; ctx.lineTo(x2, poreY(x2, h, a)); }
    ctx.closePath();
  }

  /* one guard cell: from the pore edge out to the pair's outline, on one side */
  function cellPath(ctx, h, a, H, B, side) {
    ctx.beginPath();
    for (var i = 0; i <= N; i++) { var x = -H + 2 * H * i / N; ctx[i ? "lineTo" : "moveTo"](x, side * outerY(x, H, B)); }
    for (var j = N; j >= 0; j--) { var x2 = -h + 2 * h * j / N; ctx.lineTo(x2, side * poreY(x2, h, a)); }
    ctx.closePath();
  }

  Lens({
    hero: hero,
    farmFocus: [0.5, 0.55],
    farmFocusPortrait: [0.66, 0.5],
    init: function (S) {
      /* chloroplasts: guard cells are the only cells of the leaf skin that
         carry them, so a few are drawn in each */
      S.state.dots = [];
      for (var i = 0; i < 18; i++) {
        S.state.dots.push({ u: -0.8 + (i % 9) * 0.2 + (Math.random() - 0.5) * 0.06, side: i < 9 ? -1 : 1, d: 0.3 + Math.random() * 0.4, r: 0.8 + Math.random() * 0.4 });
      }
    },
    draw: function (S) {
      var ctx = S.ctx, p = S.pointer, st = S.state, g = geometry(S);
      if (st.open === undefined) { st.open = S.reduced ? 1 : 0.05; st.x = g.home.x; st.y = g.home.y; st.ang = g.ang; }

      var tx = g.home.x, ty = g.home.y, target;
      var live = p.inside && p.everMoved;
      if (live) {
        tx = p.x; ty = p.y;
        var still = S.t - p.lastMove;
        var speed = Math.hypot(p.vx, p.vy);
        target = speed > 260 ? 0.12 : still > 0.25 ? 1 : 0.5;
        if (hint) hint.classList.add("is-gone");
      } else if (S.reduced) {
        target = 1;
      } else {
        /* breathing: open for most of a seven-second cycle */
        var c = (S.t % 7) / 7;
        target = c < 0.14 ? 0.12 : 1;
      }
      var k = S.reduced ? 1 : 1 - Math.pow(target > st.open ? 0.15 : 0.004, S.dt);
      st.open = S.lerp(st.open, target, k);
      var km = S.reduced ? 1 : 1 - Math.pow(0.004, S.dt);
      st.x = S.lerp(st.x, tx, km);
      st.y = S.lerp(st.y, ty, km);
      st.ang = S.lerp(st.ang, g.ang + (live ? S.clamp(p.vx * 0.00022, -0.22, 0.22) : 0), km);

      /* 1 · the farm, washed pale behind the words and at the far corners */
      S.drawFarm();
      var tl = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(S.W * 0.52, S.H * 0.8));
      tl.addColorStop(0, "rgba(246,244,234,0.94)");
      tl.addColorStop(0.55, "rgba(246,244,234,0.72)");
      tl.addColorStop(1, "rgba(246,244,234,0)");
      ctx.fillStyle = tl; ctx.fillRect(0, 0, S.W, S.H);
      var bt = ctx.createLinearGradient(0, S.H - 90, 0, S.H);
      bt.addColorStop(0, "rgba(246,244,234,0)");
      bt.addColorStop(1, "rgba(246,244,234,0.85)");
      ctx.fillStyle = bt; ctx.fillRect(0, S.H - 90, S.W, 90);

      /* 2 · geometry of the pair: fixed outline, pore opening inside it */
      var L = g.L;
      var h = L * 0.40;                  // pore half-length
      var A = L * 0.24;                  // pore half-height when fully open
      var a = Math.max(1.5, A * st.open);
      var Ho = L * 0.48, Bo = A + L * 0.062; // the pair's outline

      /* the pore */
      ctx.save();
      ctx.translate(st.x, st.y);
      ctx.rotate(st.ang);
      porePath(ctx, h, a);
      ctx.clip();
      ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
      var bx = st.x - (st.x - S.W * 0.5) * 0.14;
      var by = st.y - (st.y - S.H * 0.5) * 0.05;
      S.drawBench(bx, by, A * 1.62);
      ctx.translate(st.x, st.y);
      ctx.rotate(st.ang);
      ctx.beginPath();
      ctx.rect(-L * 2, -L * 2, L * 4, L * 4);
      porePath(ctx, h, a, true);
      ctx.shadowColor = "rgba(10,30,20,0.6)";
      ctx.shadowBlur = 16;
      ctx.fillStyle = "#000";
      ctx.fill("evenodd");
      ctx.restore();

      /* 3 · the two guard cells */
      ctx.save();
      ctx.translate(st.x, st.y);
      ctx.rotate(st.ang);
      ctx.shadowColor = "rgba(10,30,20,0.35)";
      ctx.shadowBlur = 18;
      [-1, 1].forEach(function (side) {
        cellPath(ctx, h, a, Ho, Bo, side);
        var gr = ctx.createLinearGradient(0, side * a, 0, side * Bo);
        gr.addColorStop(0, "rgba(150,205,168,0.62)");
        gr.addColorStop(1, "rgba(79,156,111,0.50)");
        ctx.fillStyle = gr;
        ctx.fill();
      });
      ctx.shadowBlur = 0;
      [-1, 1].forEach(function (side) {
        cellPath(ctx, h, a, Ho, Bo, side);
        ctx.lineWidth = 1.1;
        ctx.strokeStyle = "rgba(20,64,43,0.8)";
        ctx.stroke();
      });
      /* the thickened inner wall along the pore */
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = "rgba(20,64,43,0.85)";
      porePath(ctx, h, a);
      ctx.stroke();
      /* chloroplasts, riding in the middle of each cell */
      st.dots.forEach(function (d) {
        var x = d.u * h;
        var y0 = poreY(x, h, a), y1 = outerY(x, Ho, Bo);
        if (y1 - y0 < 6) return;
        var y = d.side * (y0 + (y1 - y0) * (0.25 + d.d * 0.5));
        var rr = Math.min((y1 - y0) * 0.16, L * 0.010) * d.r;
        ctx.beginPath();
        ctx.ellipse(x, y, rr * 1.35, rr, 0.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(20,84,50,0.7)";
        ctx.fill();
      });
      ctx.restore();
    }
  });
})();
