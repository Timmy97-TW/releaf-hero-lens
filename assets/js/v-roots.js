/* Variant 3 · Roots   (under the field, first reading)
   Move down and the field lifts along the ground under the students' feet,
   like turf turned back. Beneath it, in black, is the bench. From each
   person's feet a single hairline root draws itself down to the reactor and
   ends in a green point.

   What was heard in the field went into what was built. None of the roots is
   labelled: the homepage makes no claim about which conversation changed
   which part. That is the Human Practices page's job. */

(function () {
  var hero = document.querySelector(".hero");
  var lab, lctx;

  /* the ground, on the farm photograph, just under the lowest visible legs */
  var GROUND = [[0.00, 0.995], [0.45, 0.995], [0.50, 0.90], [0.58, 0.855], [0.65, 0.81], [0.71, 0.77], [0.76, 0.735], [0.82, 0.715], [1.00, 0.70]];
  var FEET = [0.52, 0.575, 0.625, 0.665, 0.70, 0.735, 0.765];
  var ENDS = [[0.31, 0.66], [0.37, 0.61], [0.43, 0.57], [0.47, 0.71], [0.52, 0.65], [0.58, 0.73], [0.50, 0.52]];

  function groundY(S, x, lift) {
    var u = (x - S.farmRect.x) / S.farmRect.w;
    for (var i = 1; i < GROUND.length; i++) {
      if (u <= GROUND[i][0] || i === GROUND.length - 1) {
        var a = GROUND[i - 1], b = GROUND[i];
        var v = a[1] + (b[1] - a[1]) * (u - a[0]) / (b[0] - a[0]);
        return S.farmRect.y + v * S.farmRect.h - lift;
      }
    }
  }

  function place(S) {
    var coreH = S.portrait ? S.H * 0.26 : S.H * 0.33;
    var cx = S.portrait ? S.W * 0.62 : S.farmRect.x + 0.80 * S.farmRect.w;
    var r = S.benchRect(cx, 0, coreH);
    r.y = S.H - 2 - S.BENCH.core[3] * r.h;
    return r;
  }

  function bez(a, b, c, d, u) {
    var v = 1 - u;
    return {
      x: v * v * v * a.x + 3 * v * v * u * b.x + 3 * v * u * u * c.x + u * u * u * d.x,
      y: v * v * v * a.y + 3 * v * v * u * b.y + 3 * v * u * u * c.y + u * u * u * d.y
    };
  }

  Lens({
    hero: hero,
    follow: 18,
    farmFocus: [0.5, 0.5],
    farmFocusPortrait: [0.72, 0.5],
    resize: function (S) {
      lab = lab || document.createElement("canvas");
      lab.width = Math.ceil(S.W * S.dpr); lab.height = Math.ceil(S.H * S.dpr);
      lctx = lab.getContext("2d");
    },
    draw: function (S) {
      var ctx = S.ctx, p = S.pointer;
      var live = p.inside && p.everMoved;
      var pl = place(S);
      var N = 72;

      /* lower cursor, deeper look; absolute, so the moving ground never
         feeds back into the control */
      var want = live ? S.clamp((p.y / S.H - 0.38) / 0.46, 0, 1) : (S.t < 0.9 ? 0 : 0.45);
      if (live && want > 0.55) S.hint();
      var o = S.clamp(S.to("o", want, 7), 0, 1.05);
      var lift = o * S.H * (S.portrait ? 0.16 : 0.18);
      S.dimText((o - 0.5) / 0.5);

      /* 1 · the field, lifted */
      S.grade(lift);
      var fr = S.farmRect;

      /* 2 · underground: black, with the bench rising out of it */
      lctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
      lctx.globalCompositeOperation = "source-over";
      lctx.fillStyle = "#000";
      lctx.fillRect(0, 0, S.W, S.H);
      lctx.drawImage(S.bench, pl.x, pl.y, pl.w, pl.h);
      var fx = lctx.createLinearGradient(pl.x, 0, pl.x + pl.w * 0.25, 0);
      fx.addColorStop(0, "#000"); fx.addColorStop(1, "rgba(0,0,0,0)");
      lctx.fillStyle = fx; lctx.fillRect(pl.x, pl.y, pl.w * 0.25, pl.h);
      var fy = lctx.createLinearGradient(0, pl.y, 0, pl.y + pl.h * 0.42);
      fy.addColorStop(0, "#000"); fy.addColorStop(1, "rgba(0,0,0,0)");
      lctx.fillStyle = fy; lctx.fillRect(pl.x, pl.y, pl.w, pl.h * 0.42);
      lctx.fillStyle = "rgba(0,0,0,0.18)"; lctx.fillRect(0, 0, S.W, S.H);

      ctx.save();
      ctx.beginPath();
      for (var i = 0; i <= N; i++) { var x = S.W * i / N; ctx[i ? "lineTo" : "moveTo"](x, groundY(S, x, lift)); }
      ctx.lineTo(S.W, S.H + 2); ctx.lineTo(0, S.H + 2); ctx.closePath();
      ctx.clip();
      ctx.drawImage(lab, 0, 0, S.W, S.H);
      /* the turf's own shadow, just under the cut */
      var cw = S.W / N;
      for (var k = 0; k < N; k++) {
        var gk = groundY(S, k * cw + cw / 2, lift);
        var sg = ctx.createLinearGradient(0, gk, 0, gk + 48);
        sg.addColorStop(0, "rgba(0,0,0,0.85)"); sg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = sg; ctx.fillRect(k * cw - 0.5, gk, cw + 1, 48);
      }

      /* 3 · roots: hairlines, white at the feet, green at the reactor */
      var grow = S.clamp((o - 0.06) / 0.55, 0, 1);
      ctx.lineCap = "round";
      FEET.forEach(function (u, idx) {
        var x0 = fr.x + u * fr.w, a = { x: x0, y: groundY(S, x0, lift) };
        var e = ENDS[idx], d = { x: pl.x + e[0] * pl.w, y: pl.y + e[1] * pl.h };
        var b = { x: a.x + (idx % 2 ? 8 : -8), y: a.y + (d.y - a.y) * 0.55 };
        var c = { x: d.x + (a.x - d.x) * 0.3, y: d.y - (d.y - a.y) * 0.18 };
        var gr = ctx.createLinearGradient(a.x, a.y, d.x, d.y);
        gr.addColorStop(0, "rgba(255,255,255,0.85)");
        gr.addColorStop(1, "rgba(52,199,89,0.95)");
        ctx.strokeStyle = gr;
        ctx.lineWidth = idx === FEET.length - 1 ? 1.8 : 1.25;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        var steps = 48, upto = Math.floor(steps * grow);
        for (var s = 1; s <= upto; s++) { var q = bez(a, b, c, d, s / steps); ctx.lineTo(q.x, q.y); }
        ctx.stroke();
        if (grow >= 0.999) {
          ctx.beginPath(); ctx.arc(d.x, d.y, 2.6, 0, Math.PI * 2);
          ctx.fillStyle = "#34c759";
          ctx.shadowColor = "rgba(52,199,89,0.9)"; ctx.shadowBlur = 10;
          ctx.fill(); ctx.shadowBlur = 0;
        }
      });
      ctx.restore();

      /* 4 · the cut, as one hairline */
      ctx.beginPath();
      for (var m = 0; m <= N; m++) { var xm = S.W * m / N; ctx[m ? "lineTo" : "moveTo"](xm, groundY(S, xm, lift)); }
      ctx.strokeStyle = "rgba(255,255,255," + (0.25 + 0.4 * S.clamp(o, 0, 1)) + ")";
      ctx.lineWidth = 1;
      ctx.stroke();

      if (live) S.dot(p.x, p.y, 3);
    }
  });
})();
