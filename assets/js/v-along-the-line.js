/* Variant 2 · Along the line
   One hairline runs along the ground under the queue, from the nearest
   student past Farmer Chen to a single point: the bench. It fills in as the
   window travels, like a progress bar drawn by the people in the photograph.

   The window is under the cursor, with a spring so light it never feels late.
   Its size follows how far along the line you are; near the end point it is
   drawn onto it and docks. At rest it sits docked, beside Chen, never over her. */

(function () {
  var hero = document.querySelector(".hero");
  var FEET = [[0.30, 0.995], [0.42, 0.93], [0.52, 0.875], [0.60, 0.835], [0.67, 0.79], [0.72, 0.755], [0.765, 0.73]];

  /* a smooth curve through the feet (Catmull-Rom), sampled to a polyline */
  function route(S) {
    var pts = FEET.map(function (f) { return S.P(f[0], f[1]); });
    var dock = S.portrait ? { x: S.W * 0.76, y: S.H * 0.60 } : S.P(0.905, 0.60);
    var r = sizes(S).rMax;
    dock.x = Math.min(dock.x, S.W - r * 1.1);
    pts.push(dock);
    var out = [];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (var k = 0; k < 12; k++) {
        var t = k / 12, t2 = t * t, t3 = t2 * t;
        out.push({
          x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
          y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
        });
      }
    }
    out.push(dock);
    var len = [0];
    for (var j = 1; j < out.length; j++) len.push(len[j - 1] + Math.hypot(out[j].x - out[j - 1].x, out[j].y - out[j - 1].y));
    return { pts: out, len: len, dock: dock };
  }

  function sizes(S) {
    var rMax = S.portrait ? S.W * 0.25 : Math.min(S.H * 0.22, S.W * 0.125);
    return { rMin: rMax * 0.52, rMax: rMax };
  }

  /* nearest point on the route to (x, y), as a fraction of its length */
  function project(R, x, y) {
    var best = 1e18, at = 0;
    for (var i = 1; i < R.pts.length; i++) {
      var a = R.pts[i - 1], b = R.pts[i];
      var dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1;
      var u = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / L2));
      var px = a.x + dx * u, py = a.y + dy * u, d = (x - px) * (x - px) + (y - py) * (y - py);
      if (d < best) { best = d; at = R.len[i - 1] + (R.len[i] - R.len[i - 1]) * u; }
    }
    return at / R.len[R.len.length - 1];
  }

  function strokeTo(ctx, R, frac) {
    var stop = frac * R.len[R.len.length - 1];
    ctx.beginPath();
    ctx.moveTo(R.pts[0].x, R.pts[0].y);
    for (var i = 1; i < R.pts.length; i++) {
      if (R.len[i] <= stop) { ctx.lineTo(R.pts[i].x, R.pts[i].y); continue; }
      var a = R.pts[i - 1], b = R.pts[i], u = (stop - R.len[i - 1]) / (R.len[i] - R.len[i - 1]);
      ctx.lineTo(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u);
      break;
    }
    ctx.stroke();
  }

  Lens({
    hero: hero,
    follow: 38,
    farmFocus: [0.5, 0.52],
    farmFocusPortrait: [0.78, 0.5],
    draw: function (S) {
      var ctx = S.ctx, p = S.pointer;
      var R = route(S), sz = sizes(S), dock = R.dock;
      var live = p.inside && p.everMoved;

      var cx = live ? p.x : dock.x, cy = live ? p.y : dock.y;
      var t = live ? Math.max(project(R, cx, cy), S.clamp((cx - R.pts[0].x) / (dock.x - R.pts[0].x), 0, 1) * 0.98) : 1;
      var dd = Math.hypot(cx - dock.x, cy - dock.y);
      var pull = live ? Math.pow(S.clamp(1 - dd / (sz.rMax * 1.6), 0, 1), 1.4) : 1;
      if (live && (t > 0.1 || pull > 0)) S.hint();

      var wx = S.to("wx", S.lerp(cx, dock.x, pull), live ? 60 : 9);
      var wy = S.to("wy", S.lerp(cy, dock.y, pull), live ? 60 : 9);
      var prog = S.to("prog", Math.max(t, pull), 14);
      var e = S.ease(S.clamp(prog, 0, 1));
      var r = S.lerp(sz.rMin, sz.rMax, e);

      /* 1 · field */
      S.grade();
      S.fadeBottom();

      /* 2 · the route: a hairline, and the part already walked */
      ctx.save();
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(255,255,255,0.28)"; ctx.lineWidth = 1;
      strokeTo(ctx, R, 1);
      ctx.strokeStyle = "rgba(255,255,255,0.92)"; ctx.lineWidth = 1.5;
      strokeTo(ctx, R, S.clamp(prog, 0, 1));
      ctx.restore();

      /* 3 · the window */
      var coreH = sz.rMax * 1.46;
      var size = S.benchRect(0, 0, coreH);
      var ax = S.lerp(wx + size.w * 0.13, wx, e), ay = S.lerp(wy + size.h * 0.02, wy + r * 0.05, e);
      ctx.save();
      ctx.beginPath(); ctx.arc(wx, wy, r, 0, Math.PI * 2);
      ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 10;
      ctx.fillStyle = "#000"; ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.clip();
      S.drawBench(ax, ay, coreH);
      ctx.restore();
      ctx.beginPath(); ctx.arc(wx, wy, r - 0.5, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.38)"; ctx.lineWidth = 1;
      ctx.stroke();

      /* the end point, and the cursor when the dock has pulled the window off it */
      if (pull < 0.98) {
        ctx.beginPath(); ctx.arc(dock.x, dock.y, 4, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = 1.2; ctx.stroke();
      }
      if (live && Math.hypot(p.x - wx, p.y - wy) > 6) S.dot(p.x, p.y, 3);
    }
  });
})();
