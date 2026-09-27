/* Variant 1 · Leaf window
   A leaf-shaped hole. It lies in the grass beside the queue, tilted along the
   line the students walk, and follows the cursor with a leaf's lag. On a
   first visit it falls into place. */

(function () {
  var hero = document.querySelector(".hero");
  var hint = document.querySelector(".hero__hint");

  function geometry(S) {
    if (S.portrait) {
      var Lp = S.W * 0.92;
      return { L: Lp, Wd: Lp * 0.6, home: { x: S.W * 0.52, y: S.H * 0.72 }, ang: -0.22 };
    }
    var L = Math.min(S.W * 0.37, S.H * 0.88);
    var h = S.P(0.815, 0.770);
    /* Keep the resting leaf on screen however the photo is cropped. */
    h.x = S.clamp(h.x, L * 0.45, S.W - L * 0.42);
    h.y = S.clamp(h.y, S.H * 0.40, S.H - L * 0.36);
    return { L: L, Wd: L * 0.62, home: h, ang: -0.26 };
  }

  Lens({
    hero: hero,
    farmFocus: [0.5, 0.55],
    farmFocusPortrait: [0.66, 0.5],
    draw: function (S) {
      var ctx = S.ctx, p = S.pointer, st = S.state, g = geometry(S);

      if (!st.init) {
        st.init = true;
        st.x = g.home.x; st.y = S.reduced ? g.home.y : -g.L * 0.4;
        st.ang = S.reduced ? g.ang : g.ang - 0.9;
        st.intro = S.reduced ? 1 : 0;
      }

      /* where the leaf wants to be */
      var tx = g.home.x, ty = g.home.y, tang = g.ang;
      if (p.inside && p.everMoved) {
        tx = p.x; ty = p.y;
        tang = g.ang + S.clamp(p.vx * 0.00032, -0.32, 0.32);
        if (hint) hint.classList.add("is-gone");
      }

      if (st.intro < 1 && !(p.inside && p.everMoved)) {
        /* falling: a slow sway down to the grass */
        st.intro = Math.min(1, st.intro + S.dt / 2.2);
        var e = S.ease(st.intro);
        st.x = g.home.x + Math.sin(st.intro * 7.5) * g.L * 0.16 * (1 - e);
        st.y = S.lerp(-g.L * 0.4, g.home.y, e);
        st.ang = g.ang + Math.sin(st.intro * 7.5 + 1.2) * 0.55 * (1 - e);
      } else {
        st.intro = 1;
        var k = S.reduced ? 1 : 1 - Math.pow(0.004, S.dt);
        st.x = S.lerp(st.x, tx, k);
        st.y = S.lerp(st.y, ty, k);
        st.ang = S.lerp(st.ang, tang, S.reduced ? 1 : 1 - Math.pow(0.02, S.dt));
      }

      /* 1 · the farm, lit toward the queue and dark at the corners */
      S.drawFarm();
      var c = S.P(0.56, 0.60);
      var rg = ctx.createRadialGradient(c.x, c.y, S.W * 0.12, c.x, c.y, S.W * 0.85);
      rg.addColorStop(0, "rgba(7,11,9,0)");
      rg.addColorStop(0.55, "rgba(7,11,9,0.38)");
      rg.addColorStop(1, "rgba(7,11,9,0.86)");
      ctx.fillStyle = rg; ctx.fillRect(0, 0, S.W, S.H);
      var tg = ctx.createLinearGradient(0, 0, S.W * 0.5, S.H * 0.55);
      tg.addColorStop(0, "rgba(7,11,9,0.62)");
      tg.addColorStop(1, "rgba(7,11,9,0)");
      ctx.fillStyle = tg; ctx.fillRect(0, 0, S.W, S.H);

      var bg = ctx.createLinearGradient(0, S.H - 110, 0, S.H);
      bg.addColorStop(0, "rgba(7,11,9,0)");
      bg.addColorStop(1, "rgba(7,11,9,0.9)");
      ctx.fillStyle = bg; ctx.fillRect(0, S.H - 110, S.W, 110);

      /* 2 · the hole */
      var L = g.L, Wd = g.Wd;
      ctx.save();
      ctx.translate(st.x, st.y);
      ctx.rotate(st.ang);
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = 50;
      ctx.fillStyle = "#070b09";
      S.leafPath(ctx, L, Wd);
      ctx.fill();
      ctx.shadowBlur = 0;
      S.leafPath(ctx, L, Wd);
      ctx.clip();

      /* the bench, upright, a little behind the hole so it shifts as it moves */
      ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
      var bx = st.x - (st.x - S.W * 0.5) * 0.16;
      var by = st.y - (st.y - S.H * 0.5) * 0.05;
      S.drawBench(bx, by, Wd * 0.64);

      /* inner shadow: the farm's edge falls into the hole */
      ctx.translate(st.x, st.y);
      ctx.rotate(st.ang);
      ctx.beginPath();
      ctx.rect(-L * 2, -L * 2, L * 4, L * 4);
      S.leafPath(ctx, L, Wd, true);
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 26;
      ctx.fillStyle = "#000";
      ctx.fill("evenodd");
      ctx.restore();

      /* rim, petiole, and the two ends of the midrib */
      ctx.save();
      ctx.translate(st.x, st.y);
      ctx.rotate(st.ang);
      ctx.strokeStyle = "rgba(243,238,210,0.9)";
      ctx.lineWidth = 1.5;
      S.leafPath(ctx, L, Wd);
      ctx.stroke();
      ctx.lineCap = "round";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-L / 2, 0);
      ctx.quadraticCurveTo(-L / 2 - L * 0.08, L * 0.005, -L / 2 - L * 0.15, L * 0.045);
      ctx.stroke();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = "rgba(243,238,210,0.55)";
      ctx.beginPath(); ctx.moveTo(-L / 2, 0); ctx.lineTo(-L / 2 + L * 0.09, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(L / 2 - L * 0.07, 0); ctx.lineTo(L / 2, 0); ctx.stroke();
      ctx.restore();

    }
  });
})();
