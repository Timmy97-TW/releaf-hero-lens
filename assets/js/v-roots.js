/* Variant 3 · Roots   (under the field, first reading)
   The cut is the ground in the photograph: a line traced just under the
   lowest visible legs, rising from the lower left to Farmer Chen's feet and
   running on level to the right. Below it the soil opens, softly and
   downward, toward the cursor, and the bench is found underground.

   From each person's feet a root grows down as the soil opens, and every root
   ends in the reactor. What was heard in the field went into what was built:
   the machine is fed by the visits above it. None of the roots is labelled,
   because the homepage makes no claim about which conversation changed which
   part. That is the Human Practices page's job. */

(function () {
  var hero = document.querySelector(".hero");
  var hint = document.querySelector(".hero__hint");
  var roots = null, lab, lctx, mask, mctx;

  /* The ground, as points on the farm photograph (fractions of width and
     height), measured under the lowest visible leg at each place. */
  var GROUND = [[0.00, 0.995], [0.45, 0.995], [0.50, 0.90], [0.58, 0.855], [0.65, 0.81], [0.71, 0.77], [0.76, 0.735], [0.82, 0.715], [1.00, 0.70]];
  /* where each person stands on it (x on the photograph), front to Chen */
  var FEET = [0.52, 0.575, 0.625, 0.665, 0.70, 0.735, 0.765];

  var LIFT = 0;   // how far the field is lifted this frame, px

  function groundY(S, x) {
    var u = (x - S.farmRect.x) / S.farmRect.w;
    return gy(S, u) - LIFT;
  }
  function gy(S, u) {
    for (var i = 1; i < GROUND.length; i++) {
      if (u <= GROUND[i][0] || i === GROUND.length - 1) {
        var a = GROUND[i - 1], b = GROUND[i];
        var v = a[1] + (b[1] - a[1]) * (u - a[0]) / (b[0] - a[0]);
        return S.farmRect.y + Math.min(v, 0.995) * S.farmRect.h;
      }
    }
  }

  function place(S) {
    var coreH = S.portrait ? S.H * 0.26 : S.H * 0.34;
    var cx = S.portrait ? S.W * 0.62 : S.farmRect.x + 0.80 * S.farmRect.w;
    var r = S.benchRect(cx, 0, coreH);
    r.y = S.H - 4 - S.BENCH.core[3] * r.h;
    return r;
  }

  /* One root per person, from the feet to a point on the reactor, with two
     rootlets. Seeded, so it is the same drawing on every visit. */
  function buildRoots(S, pl) {
    var seed = 11;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    var ends = [[0.30, 0.66], [0.36, 0.60], [0.43, 0.56], [0.47, 0.70], [0.52, 0.64], [0.58, 0.72], [0.50, 0.50]];
    return FEET.map(function (u, i) {
      var x = S.farmRect.x + u * S.farmRect.w, y = groundY(S, x);
      var e = ends[i];
      var ex = pl.x + e[0] * pl.w, ey = pl.y + e[1] * pl.h;
      return {
        p0: { x: x, y: y },
        c1: { x: x + (rnd() - 0.5) * 24, y: y + (ey - y) * 0.5 },
        c2: { x: ex + (x - ex) * 0.35 + (rnd() - 0.5) * 30, y: ey - (ey - y) * 0.2 },
        p1: { x: ex, y: ey },
        lets: [0.3 + rnd() * 0.15, 0.55 + rnd() * 0.15].map(function (t) { return { u: t, side: rnd() < 0.5 ? -1 : 1, len: 14 + rnd() * 18 }; }),
        chen: i === FEET.length - 1
      };
    });
  }

  function bez(r, u) {
    var v = 1 - u;
    return {
      x: v * v * v * r.p0.x + 3 * v * v * u * r.c1.x + 3 * v * u * u * r.c2.x + u * u * u * r.p1.x,
      y: v * v * v * r.p0.y + 3 * v * v * u * r.c1.y + 3 * v * u * u * r.c2.y + u * u * u * r.p1.y
    };
  }

  function groundPath(ctx, S, N) {
    for (var i = 0; i <= N; i++) { var x = S.W * i / N; ctx[i ? "lineTo" : "moveTo"](x, groundY(S, x)); }
  }

  Lens({
    hero: hero,
    follow: 14,
    farmFocus: [0.5, 0.5],
    farmFocusPortrait: [0.72, 0.5],
    resize: function (S) {
      roots = null;
      lab = lab || document.createElement("canvas");
      mask = mask || document.createElement("canvas");
      lab.width = mask.width = Math.ceil(S.W * S.dpr);
      lab.height = mask.height = Math.ceil(S.H * S.dpr);
      lctx = lab.getContext("2d"); mctx = mask.getContext("2d");
    },
    draw: function (S) {
      var ctx = S.ctx, p = S.pointer, st = S.state;
      var pl = place(S);
      var N = 64;

      /* how far the field is lifted: 0 lying flat, 1 lifted all the way.
         Lower cursor, deeper look. Absolute, so the moving ground never
         feeds back into the control. */
      var want, live = p.inside && p.everMoved;
      if (live) {
        want = S.clamp((p.y / S.H - 0.35) / 0.5, 0, 1);
        if (hint && want > 0.5) hint.classList.add("is-gone");
      } else if (S.reduced) {
        want = 0.6;
      } else {
        want = S.t < 0.8 ? 0 : 0.42 + 0.04 * Math.sin(S.t * 0.8);
      }
      if (st.o === undefined) st.o = 0;
      st.o = S.lerp(st.o, want, S.reduced ? 1 : 1 - Math.exp(-4 * S.dt));
      var o = st.o;
      LIFT = S.ease(o) * S.H * (S.portrait ? 0.18 : 0.20);
      roots = buildRoots(S, pl);

      /* 1 · farm, lifted */
      var fr = S.farmRect;
      ctx.drawImage(S.farm, fr.x, fr.y - LIFT, fr.w, fr.h);
      var cc = S.P(0.55, 0.55);
      var rg = ctx.createRadialGradient(cc.x, cc.y, S.W * 0.12, cc.x, cc.y, S.W * 0.85);
      rg.addColorStop(0, "rgba(7,11,9,0)");
      rg.addColorStop(0.55, "rgba(7,11,9,0.30)");
      rg.addColorStop(1, "rgba(7,11,9,0.82)");
      ctx.fillStyle = rg; ctx.fillRect(0, 0, S.W, S.H);
      var tg = ctx.createLinearGradient(0, 0, S.W * 0.5, S.H * 0.55);
      tg.addColorStop(0, "rgba(7,11,9,0.6)");
      tg.addColorStop(1, "rgba(7,11,9,0)");
      ctx.fillStyle = tg; ctx.fillRect(0, 0, S.W, S.H);

      /* 2 · underground: soil, with the bench in it */
      lctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
      lctx.globalCompositeOperation = "source-over";
      lctx.fillStyle = "#14100b";
      lctx.fillRect(0, 0, S.W, S.H);
      lctx.drawImage(S.bench, pl.x, pl.y, pl.w, pl.h);
      var fe = pl.w * 0.22;
      var lg = lctx.createLinearGradient(pl.x, 0, pl.x + fe, 0);
      lg.addColorStop(0, "#14100b"); lg.addColorStop(1, "rgba(20,16,11,0)");
      lctx.fillStyle = lg; lctx.fillRect(pl.x, pl.y, fe, pl.h);
      var tg2 = lctx.createLinearGradient(0, pl.y, 0, pl.y + pl.h * 0.35);
      tg2.addColorStop(0, "#14100b"); tg2.addColorStop(1, "rgba(20,16,11,0)");
      lctx.fillStyle = tg2; lctx.fillRect(pl.x, pl.y, pl.w, pl.h * 0.35);
      lctx.fillStyle = "rgba(20,16,11,0.22)";
      lctx.fillRect(0, 0, S.W, S.H);

      /* the opening: a fade down from the ground line, as deep as o says,
         drawn column by column because the ground slopes */
      mctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
      mctx.clearRect(0, 0, S.W, S.H);
      var cw = S.W / N;
      for (var i = 0; i < N; i++) {
        var x0 = i * cw, gy = groundY(S, x0 + cw / 2);
        var depth = S.H;
        var mg = mctx.createLinearGradient(0, gy, 0, gy + depth);
        mg.addColorStop(0, "rgba(0,0,0,1)");
        mg.addColorStop(1, "rgba(0,0,0,1)");
        mctx.fillStyle = mg;
        mctx.fillRect(x0 - 0.5, gy, cw + 1, depth);
      }
      lctx.setTransform(1, 0, 0, 1, 0, 0);
      lctx.globalCompositeOperation = "destination-in";
      lctx.drawImage(mask, 0, 0);

      ctx.save();
      ctx.beginPath();
      groundPath(ctx, S, N);
      ctx.lineTo(S.W, S.H + 10); ctx.lineTo(0, S.H + 10); ctx.closePath();
      ctx.clip();
      ctx.drawImage(lab, 0, 0, S.W, S.H);
      for (var k = 0; k < N; k++) {
        var xk = k * cw, gk = groundY(S, xk + cw / 2);
        var tf = ctx.createLinearGradient(0, gk, 0, gk + 70);
        tf.addColorStop(0, "rgba(14,10,6,0.9)");
        tf.addColorStop(1, "rgba(14,10,6,0)");
        ctx.fillStyle = tf;
        ctx.fillRect(xk - 0.5, gk, cw + 1, 70);
      }

      /* 3 · roots, grown with the opening, outlined so they read over the bench */
      var grow = S.clamp((o - 0.04) / 0.5, 0, 1);
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      roots.forEach(function (rt) {
        var steps = 36, upto = Math.floor(steps * grow);
        if (upto < 1) return;
        [["rgba(12,9,6,0.55)", 2.4], ["rgba(238,226,192,0.95)", 0]].forEach(function (pass) {
          var prev = rt.p0;
          for (var s = 1; s <= upto; s++) {
            var u = s / steps, q = bez(rt, u);
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y); ctx.lineTo(q.x, q.y);
            ctx.lineWidth = (rt.chen ? 4.6 : 3.4) * (1 - u * 0.72) + pass[1];
            ctx.strokeStyle = pass[0];
            ctx.stroke();
            prev = q;
          }
          rt.lets.forEach(function (l) {
            if (grow < l.u + 0.04) return;
            var a = bez(rt, l.u), b = bez(rt, l.u + 0.02);
            var nx = -(b.y - a.y), ny = b.x - a.x, nl = Math.hypot(nx, ny) || 1;
            var len = l.len * S.clamp((grow - l.u) / 0.2, 0, 1);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.quadraticCurveTo(a.x + nx / nl * len * 0.6 * l.side, a.y + len * 0.2, a.x + nx / nl * len * l.side, a.y + len * 0.7);
            ctx.lineWidth = 1.3 + pass[1] * 0.6;
            ctx.strokeStyle = pass[0];
            ctx.stroke();
          });
        });
        if (grow >= 0.999) {
          ctx.beginPath();
          ctx.arc(rt.p1.x, rt.p1.y, 3.4, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(111,227,154,0.95)";
          ctx.shadowColor = "rgba(111,227,154,0.9)"; ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });
      ctx.restore();

      /* 4 · the ground line, with a thin shadow of turf under it */
      ctx.save();
      ctx.beginPath();
      groundPath(ctx, S, N);
      ctx.strokeStyle = "rgba(0,0,0,0.45)";
      ctx.lineWidth = 6;
      ctx.globalAlpha = S.clamp(o * 3, 0, 1);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(243,238,210,0.85)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    }
  });
})();
