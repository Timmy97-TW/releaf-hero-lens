/* Variant 4 · Along the line
   The window is held to the queue. Wherever the cursor is, the window sits on
   the line of students at the same distance across, so moving left to right
   walks it up the line toward Farmer Chen. It grows as it goes, and at the
   head of the line it is wide enough to hold the whole reactor, which is
   registered to stand exactly where Chen stands: the line ends at the bench.
   Left alone it walks the line by itself. */

(function () {
  var hero = document.querySelector(".hero");
  var hint = document.querySelector(".hero__hint");

  function path(S) {
    return S.FARM.queue.map(function (q) { return S.P(q[0], q[1]); });
  }

  function along(pts, t) {
    var seg = [], total = 0;
    for (var i = 1; i < pts.length; i++) {
      var d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      seg.push(d); total += d;
    }
    var want = t * total;
    for (var j = 0; j < seg.length; j++) {
      if (want <= seg[j] || j === seg.length - 1) {
        var f = seg[j] ? Math.min(1, want / seg[j]) : 0;
        return { x: pts[j].x + (pts[j + 1].x - pts[j].x) * f, y: pts[j].y + (pts[j + 1].y - pts[j].y) * f };
      }
      want -= seg[j];
    }
  }

  function tFromX(pts, x) {
    var x0 = pts[0].x, x1 = pts[pts.length - 1].x;
    return Math.max(0, Math.min(1, (x - x0) / (x1 - x0)));
  }

  Lens({
    hero: hero,
    farmFocus: [0.5, 0.5],
    farmFocusPortrait: [0.7, 0.5],
    draw: function (S) {
      var ctx = S.ctx, p = S.pointer, st = S.state;
      var pts = path(S);
      var rMin = Math.min(S.W, S.H) * 0.09;
      var rMax = S.portrait ? S.W * 0.42 : Math.min(S.H * 0.40, S.W * 0.24);

      var tt;
      if (p.inside && p.everMoved) {
        tt = tFromX(pts, p.x);
        if (hint) hint.classList.add("is-gone");
      } else if (S.reduced) {
        tt = 1;
      } else {
        /* walk up the line, wait at the bench, walk back */
        var c = (S.t % 11) / 11;
        tt = c < 0.45 ? S.ease(c / 0.45) : c < 0.75 ? 1 : 1 - S.ease((c - 0.75) / 0.25);
      }
      if (st.t === undefined) st.t = tt;
      st.t = S.lerp(st.t, tt, S.reduced ? 1 : 1 - Math.pow(0.01, S.dt));

      var e = S.ease(st.t);
      var at = along(pts, st.t);
      var chen = pts[pts.length - 1];
      var r = S.lerp(rMin, rMax, Math.pow(st.t, 1.6));

      /* The bench stands where Chen stands. Lower down the line the window
         looks at the room beside it: the whiteboard and the power supply. */
      var size = S.benchRect(0, 0, rMax * 1.25);
      var place = S.benchRect(
        S.lerp(at.x + size.w * 0.30, chen.x, e),
        S.lerp(at.y + size.h * 0.22, chen.y + rMax * 0.12, e),
        rMax * 1.25);

      /* 1 · farm */
      S.drawFarm();
      var cc = S.P(0.55, 0.58);
      var rg = ctx.createRadialGradient(cc.x, cc.y, S.W * 0.12, cc.x, cc.y, S.W * 0.85);
      rg.addColorStop(0, "rgba(7,11,9,0)");
      rg.addColorStop(0.55, "rgba(7,11,9,0.36)");
      rg.addColorStop(1, "rgba(7,11,9,0.86)");
      ctx.fillStyle = rg; ctx.fillRect(0, 0, S.W, S.H);
      var tg = ctx.createLinearGradient(0, 0, S.W * 0.5, S.H * 0.55);
      tg.addColorStop(0, "rgba(7,11,9,0.6)");
      tg.addColorStop(1, "rgba(7,11,9,0)");
      ctx.fillStyle = tg; ctx.fillRect(0, 0, S.W, S.H);

      /* 2 · the stations: one small mark per person in the line */
      ctx.save();
      pts.forEach(function (q, i) {
        var ti = i / (pts.length - 1);
        var passed = ti <= st.t + 0.001;
        ctx.beginPath();
        ctx.arc(q.x, q.y, i === pts.length - 1 ? 5 : 3.2, 0, Math.PI * 2);
        ctx.fillStyle = passed ? "rgba(243,238,210,0.95)" : "rgba(243,238,210,0.35)";
        ctx.fill();
      });
      ctx.restore();

      /* 3 · the window, soft-edged like Marburg's, much larger at the head */
      ctx.save();
      ctx.beginPath();
      ctx.arc(at.x, at.y, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(S.bench, place.x, place.y, place.w, place.h);
      var fe = ctx.createRadialGradient(at.x, at.y, r * 0.72, at.x, at.y, r);
      fe.addColorStop(0, "rgba(7,11,9,0)");
      fe.addColorStop(1, "rgba(7,11,9,0.55)");
      ctx.fillStyle = fe;
      ctx.fillRect(at.x - r, at.y - r, r * 2, r * 2);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(at.x, at.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(243,238,210," + (0.35 + 0.5 * e) + ")";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  });
})();
