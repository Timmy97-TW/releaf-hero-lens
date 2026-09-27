/* Variant 5 · Under the field
   The farm is a sheet with a serrated leaf margin along its lower edge. A thin
   band of the bench shows beneath it from the start: the lit edge of the lab
   table, which is the same green as the leaf. Bring the cursor down and the
   edge lifts toward it, so the reader opens the field and finds the lab
   underneath. This one says "under" most literally. */

(function () {
  var hero = document.querySelector(".hero");
  var hint = document.querySelector(".hero__hint");

  function benchPlace(S) {
    var coreH = S.portrait ? S.H * 0.32 : S.H * 0.50;
    var at = S.portrait ? { x: S.W * 0.5, y: S.H * 0.74 } : { x: S.W * 0.66, y: S.H * 0.70 };
    var r = S.benchRect(at.x, at.y, coreH);
    var need = Math.max(S.W / r.w, S.H / r.h, 1);
    if (need > 1) r = S.benchRect(at.x, at.y, coreH * need);
    r.x = S.clamp(r.x, S.W - r.w, 0);
    r.y = S.clamp(r.y, S.H - r.h, 0);
    return r;
  }

  /* The margin: a smooth rise centred on cx, with teeth that lean toward the
     leaf tip (to the right), 26px apart. */
  function edge(S, cx, lift, sigma, keep) {
    var ctx = S.ctx, W = S.W, H = S.H;
    var base = H * 0.055;
    var step = 26, tooth = 6;
    if (!keep) ctx.beginPath();
    ctx.moveTo(0, H + 2);
    for (var x = 0; x <= W + step; x += step) {
      var y0 = H - base - lift * Math.exp(-Math.pow((x - cx) / sigma, 2));
      var y1 = H - base - lift * Math.exp(-Math.pow((x + step * 0.7 - cx) / sigma, 2));
      ctx.lineTo(x, y0);
      ctx.lineTo(x + step * 0.7, y1 - tooth);
    }
    ctx.lineTo(W + step, H + 2);
    ctx.closePath();
  }

  Lens({
    hero: hero,
    farmFocus: [0.5, 0.42],
    farmFocusPortrait: [0.66, 0.5],
    draw: function (S) {
      var ctx = S.ctx, p = S.pointer, st = S.state;
      var place = benchPlace(S);

      var wantLift, wantX;
      if (p.inside && p.everMoved) {
        /* the edge rises to just under the cursor once it is in the lower 70% */
        var reach = S.H - S.H * 0.055 - p.y + S.H * 0.06;
        wantLift = S.clamp(reach, 0, S.H * 0.68) * S.clamp((p.y / S.H - 0.28) / 0.25, 0, 1);
        wantX = p.x;
        if (hint && wantLift > 20) hint.classList.add("is-gone");
      } else if (S.reduced) {
        wantLift = S.H * 0.30; wantX = place.x + place.w * 0.5;
      } else {
        /* a slow breath at the edge: it lifts over the reactor now and then */
        var c = (S.t % 8) / 8;
        wantLift = c > 0.5 && c < 0.85 ? S.H * 0.30 * Math.sin((c - 0.5) / 0.35 * Math.PI) : 0;
        wantX = place.x + place.w * 0.5;
      }
      if (st.lift === undefined) { st.lift = 0; st.x = wantX; }
      var k = S.reduced ? 1 : 1 - Math.pow(0.006, S.dt);
      st.lift = S.lerp(st.lift, wantLift, k);
      st.x = S.lerp(st.x, wantX, k);
      var sigma = S.W * 0.16 + st.lift * 0.35;

      /* 1 · farm */
      S.drawFarm();
      var cc = S.P(0.55, 0.55);
      var rg = ctx.createRadialGradient(cc.x, cc.y, S.W * 0.12, cc.x, cc.y, S.W * 0.85);
      rg.addColorStop(0, "rgba(7,11,9,0)");
      rg.addColorStop(0.55, "rgba(7,11,9,0.32)");
      rg.addColorStop(1, "rgba(7,11,9,0.84)");
      ctx.fillStyle = rg; ctx.fillRect(0, 0, S.W, S.H);
      var tg = ctx.createLinearGradient(0, 0, S.W * 0.5, S.H * 0.55);
      tg.addColorStop(0, "rgba(7,11,9,0.6)");
      tg.addColorStop(1, "rgba(7,11,9,0)");
      ctx.fillStyle = tg; ctx.fillRect(0, 0, S.W, S.H);

      /* 2 · what is under the margin */
      ctx.save();
      edge(S, st.x, st.lift, sigma);
      ctx.clip();
      ctx.fillStyle = "#070b09";
      ctx.fillRect(0, 0, S.W, S.H);
      ctx.drawImage(S.bench, place.x, place.y, place.w, place.h);
      /* the field's edge throws a shadow down onto the bench */
      ctx.beginPath();
      ctx.rect(-10, -10, S.W + 20, S.H + 20);
      edge(S, st.x, st.lift, sigma, true);
      ctx.shadowColor = "rgba(0,0,0,0.75)";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = "#000";
      ctx.fill("evenodd");
      ctx.restore();

      /* 3 · the margin itself */
      ctx.save();
      edge(S, st.x, st.lift, sigma);
      ctx.strokeStyle = "rgba(243,238,210,0.85)";
      ctx.lineWidth = 1.3;
      ctx.lineJoin = "miter";
      ctx.stroke();
      ctx.restore();
    }
  });
})();
