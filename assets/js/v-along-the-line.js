/* Variant 2 · Along the line
   A route is drawn along the ground under the queue: one mark at each
   person's feet, from the nearest student up to Farmer Chen, and one more
   mark past her where the line would continue. That last mark is the bench.

   The window sits exactly under the cursor, with no lag to fight. How far
   along the route the cursor is sets how large the window is and how much of
   the reactor has slid into it. Near the last mark the window is drawn onto
   it and docks, so arriving is easy. When the cursor leaves, the window
   returns to the dock: beside Chen, never over her. */

(function () {
  var hero = document.querySelector(".hero");
  var hint = document.querySelector(".hero__hint");

  function feetY(S, u) {
    var a = S.FARM.feetFront, b = S.FARM.feetChen;
    return S.lerp(a[1], b[1], (u - a[0]) / (b[0] - a[0]));
  }

  function route(S) {
    var q = S.FARM.queue;
    var pts = q.map(function (c, i) {
      var u = c[0];
      var v = i === q.length - 1 ? S.FARM.feetChen[1] : feetY(S, u);
      return S.P(u, v);
    });
    var dock = S.portrait ? { x: S.W * 0.74, y: S.H * 0.62 } : S.P(0.915, 0.60);
    return { pts: pts, dock: dock };
  }

  function sizes(S) {
    var rMax = S.portrait ? S.W * 0.26 : Math.min(S.H * 0.23, S.W * 0.13);
    return { rMin: rMax * 0.5, rMax: rMax };
  }

  Lens({
    hero: hero,
    follow: 40,
    farmFocus: [0.5, 0.52],
    farmFocusPortrait: [0.78, 0.5],
    draw: function (S) {
      var ctx = S.ctx, p = S.pointer, st = S.state;
      var R = route(S), sz = sizes(S);
      var dock = R.dock;
      dock.x = Math.min(dock.x, S.W - sz.rMax * 1.02);
      var x0 = R.pts[0].x, x1 = dock.x;

      var live = p.inside && p.everMoved;
      var cx, cy;
      if (st.intro === undefined) st.intro = S.reduced ? 1 : 0;

      if (live) {
        st.intro = 1;
        cx = p.x; cy = p.y;
        if (hint) hint.classList.add("is-gone");
      } else if (st.intro < 1) {
        /* first visit: the window walks the route once and docks */
        st.intro = Math.min(1, st.intro + S.dt / 2.8);
        var e0 = S.ease(st.intro);
        var all = R.pts.concat([dock]);
        var f = e0 * (all.length - 1), i0 = Math.floor(f), fr = f - i0;
        var A = all[Math.min(i0, all.length - 1)], B = all[Math.min(i0 + 1, all.length - 1)];
        cx = S.lerp(A.x, B.x, fr); cy = S.lerp(A.y, B.y, fr) - sz.rMin * 0.4 * (1 - e0);
      } else {
        cx = dock.x; cy = dock.y;
      }

      /* how far along the route */
      var t = S.clamp((cx - x0) / (x1 - x0), 0, 1);

      /* the dock pulls the window in when it is close */
      var dd = Math.hypot(cx - dock.x, cy - dock.y);
      var pull = live ? Math.pow(S.clamp(1 - dd / (sz.rMax * 1.5), 0, 1), 1.5) : 1;
      if (!live && st.intro < 1) pull = 0;
      var wx = S.lerp(cx, dock.x, pull), wy = S.lerp(cy, dock.y, pull);
      var tt = Math.max(t, pull);

      /* smooth only the size and the dock, never the position under the cursor */
      if (st.tt === undefined) st.tt = tt;
      st.tt = S.lerp(st.tt, tt, S.reduced ? 1 : 1 - Math.exp(-10 * S.dt));
      if (st.wx === undefined || live) { st.wx = wx; st.wy = wy; }
      else { var kk = S.reduced ? 1 : 1 - Math.exp(-6 * S.dt); st.wx = S.lerp(st.wx, wx, kk); st.wy = S.lerp(st.wy, wy, kk); }
      var e = S.ease(st.tt);
      var r = S.lerp(sz.rMin, sz.rMax, e);

      /* 1 · farm */
      S.drawFarm();
      var cc = S.P(0.55, 0.58);
      var rg = ctx.createRadialGradient(cc.x, cc.y, S.W * 0.12, cc.x, cc.y, S.W * 0.85);
      rg.addColorStop(0, "rgba(7,11,9,0)");
      rg.addColorStop(0.55, "rgba(7,11,9,0.32)");
      rg.addColorStop(1, "rgba(7,11,9,0.84)");
      ctx.fillStyle = rg; ctx.fillRect(0, 0, S.W, S.H);
      var tg = ctx.createLinearGradient(0, 0, S.W * 0.5, S.H * 0.55);
      tg.addColorStop(0, "rgba(7,11,9,0.6)");
      tg.addColorStop(1, "rgba(7,11,9,0)");
      ctx.fillStyle = tg; ctx.fillRect(0, 0, S.W, S.H);
      var bg = ctx.createLinearGradient(0, S.H - 90, 0, S.H);
      bg.addColorStop(0, "rgba(7,11,9,0)");
      bg.addColorStop(1, "rgba(7,11,9,0.8)");
      ctx.fillStyle = bg; ctx.fillRect(0, S.H - 90, S.W, 90);

      /* 2 · the route: faint ahead, inked behind */
      var all2 = R.pts.concat([dock]);
      var reach = x0 + (x1 - x0) * st.tt;
      ctx.save();
      ctx.lineWidth = 1.3;
      ctx.lineCap = "round";
      ctx.setLineDash([2, 6]);
      ctx.strokeStyle = "rgba(243,238,210,0.6)";
      ctx.beginPath();
      all2.forEach(function (q, i) { ctx[i ? "lineTo" : "moveTo"](q.x, q.y); });
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(243,238,210,0.92)";
      ctx.beginPath();
      ctx.rect(0, 0, reach, S.H);
      ctx.clip();
      ctx.beginPath();
      all2.forEach(function (q, i) { ctx[i ? "lineTo" : "moveTo"](q.x, q.y); });
      ctx.stroke();
      ctx.restore();
      R.pts.forEach(function (q, i) {
        var on = q.x <= reach + 1;
        ctx.beginPath();
        ctx.arc(q.x, q.y, i === R.pts.length - 1 ? 4.5 : 3.2, 0, Math.PI * 2);
        ctx.fillStyle = on ? "rgba(243,238,210,0.95)" : "rgba(243,238,210,0.45)";
        ctx.fill();
      });

      /* 3 · the window: the reactor slides in as the route is walked */
      var coreH = sz.rMax * 1.5;
      var size = S.benchRect(0, 0, coreH);
      var ax = S.lerp(st.wx + size.w * 0.13, st.wx, e);
      var ay = S.lerp(st.wy + size.h * 0.02, st.wy + r * 0.06, e);
      ctx.save();
      ctx.beginPath();
      ctx.arc(st.wx, st.wy, r, 0, Math.PI * 2);
      ctx.fillStyle = "#070b09";
      ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 30;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.clip();
      S.drawBench(ax, ay, coreH);
      var fe = ctx.createRadialGradient(st.wx, st.wy, r * 0.7, st.wx, st.wy, r);
      fe.addColorStop(0, "rgba(7,11,9,0)");
      fe.addColorStop(1, "rgba(7,11,9,0.45)");
      ctx.fillStyle = fe;
      ctx.fillRect(st.wx - r, st.wy - r, r * 2, r * 2);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(st.wx, st.wy, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(243,238,210," + (0.45 + 0.45 * e) + ")";
      ctx.lineWidth = 1.3;
      ctx.stroke();

      /* the dock mark, on the route where it enters the window */
      ctx.beginPath();
      ctx.arc(dock.x, dock.y + (st.wy === dock.y ? 0 : 0), 6, 0, Math.PI * 2);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(243,238,210,0.9)";
      if (pull > 0.95 || (!live && st.intro >= 1)) { ctx.fillStyle = "rgba(111,227,154,0.95)"; ctx.fill(); }
      ctx.stroke();

      /* the cursor itself, so the pull toward the dock never hides it */
      if (live && pull > 0.02) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(243,238,210,0.95)";
        ctx.fill();
      }
    }
  });
})();
