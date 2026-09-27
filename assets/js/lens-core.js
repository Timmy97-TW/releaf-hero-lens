/* =============================================================================
   lens-core.js
   -----------------------------------------------------------------------------
   The shared engine behind every variant. One <canvas> fills the hero. Each
   frame it draws the farm photograph, then the variant cuts a window in it and
   draws the bench photograph through that window.

   The two photographs are not the same scene, which is the one real difference
   from Marburg 2024. Their lower layer was a meadow of dandelions: any spot the
   flashlight uncovered showed flowers. Our lower layer has one object in it, so
   the window has to be large and has to know where the reactor is. BENCH below
   says where it is. When the new bench photograph arrives, change the file and
   these four numbers and nothing else.
   ========================================================================== */

(function () {
  "use strict";

  /* ---- the two photographs ------------------------------------------------ */

  var ROOT = (document.currentScript && document.currentScript.src || "").replace(/assets\/js\/lens-core\.js.*$/, "");

  var FARM = {
    base: ROOT + "assets/img/farm",
    /* Points on the farm photograph, as fractions of its width and height.
       Measured on the 6192x4128 original. */
    chen:      [0.760, 0.470],  // Farmer Chen's face
    front:     [0.260, 0.560],  // the nearest student's shoulders
    feetFront: [0.250, 0.990],  // where the queue leaves the frame
    feetChen:  [0.735, 0.665],  // Chen's feet
    queue: [                    // shirt centres, nearest to farthest, then Chen
      [0.255, 0.640], [0.380, 0.610], [0.525, 0.560], [0.585, 0.585],
      [0.635, 0.560], [0.680, 0.540], [0.715, 0.530], [0.760, 0.540]
    ]
  };

  var BENCH = {
    base: ROOT + "assets/img/bench",
    /* The point that lands in the middle of every window: the vessel on its
       stand, between the clamp and the carboys. */
    anchor: [0.500, 0.665],
    /* The box that has to fit inside the window: from the top of the stand to
       the stand's foot, from the stand to the pump. Everything else (power
       supply, laptop, whiteboard) is welcome but may be cut. */
    core: [0.285, 0.455, 0.720, 0.915]
  };

  /* ---- helpers --------------------------------------------------------------- */

  function loadImg(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.decoding = "async";
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = src;
    });
  }

  function loadPhoto(base, big) {
    var size = big ? "-2400" : "-1400";
    return loadImg(base + size + ".webp").catch(function () { return loadImg(base + size + ".jpg"); });
  }

  function cover(iw, ih, W, H, fx, fy) {
    var s = Math.max(W / iw, H / ih);
    var w = iw * s, h = ih * s;
    return { x: (W - w) * fx, y: (H - h) * fy, w: w, h: h, s: s };
  }

  /* exact step of a critically damped spring toward target, angular
     frequency w (rad/s): returns [position, velocity] */
  function spring(x, v, target, w, dt) {
    var d = x - target, e = Math.exp(-w * dt);
    return [target + (d + (v + w * d) * dt) * e, (v - w * (v + w * d) * dt) * e];
  }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  /* A leaf pointing along +x, centred on the origin: ovate, widest a little
     behind the middle, with a drawn-out tip. */
  function leafPath(ctx, L, W, keep) {
    var h = L / 2, w = W / 2;
    if (!keep) ctx.beginPath();
    ctx.moveTo(-h, 0);
    ctx.bezierCurveTo(-h + L * 0.10, -w * 1.30, h - L * 0.34, -w * 1.02, h, 0);
    ctx.bezierCurveTo(h - L * 0.34, w * 1.02, -h + L * 0.10, w * 1.30, -h, 0);
    ctx.closePath();
  }

  /* ---- the engine ------------------------------------------------------------ */

  function Lens(opts) {
    var hero = opts.hero;
    var canvas = hero.querySelector("canvas");
    var ctx = canvas.getContext("2d");
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var S = {
      ctx: ctx, W: 0, H: 0, dpr: 1, t: 0, dt: 0, reduced: reduced,
      farm: null, bench: null, farmRect: null,
      FARM: FARM, BENCH: BENCH,
      pointer: { x: 0, y: 0, tx: 0, ty: 0, vx: 0, vy: 0, inside: false, touched: false, lastMove: -1e9, everMoved: false },
      state: {},
      P: function (u, v) { var r = S.farmRect; return { x: r.x + u * r.w, y: r.y + v * r.h }; },
      toFarm: function (x, y) { var r = S.farmRect; return { u: (x - r.x) / r.w, v: (y - r.y) / r.h }; },
      /* Where the bench photograph goes so that its anchor sits at (cx, cy)
         and its core box is coreH pixels tall. */
      benchRect: function (cx, cy, coreH) {
        var b = S.bench, c = BENCH.core;
        var s = coreH / ((c[3] - c[1]) * b.naturalHeight);
        var w = b.naturalWidth * s, h = b.naturalHeight * s;
        return { x: cx - BENCH.anchor[0] * w, y: cy - BENCH.anchor[1] * h, w: w, h: h, s: s };
      },
      drawBench: function (cx, cy, coreH) {
        var r = S.benchRect(cx, cy, coreH);
        ctx.drawImage(S.bench, r.x, r.y, r.w, r.h);
        return r;
      },
      drawFarm: function () {
        var r = S.farmRect;
        ctx.drawImage(S.farm, r.x, r.y, r.w, r.h);
      },
      coreAspect: function () {
        var b = S.bench, c = BENCH.core;
        return ((c[2] - c[0]) * b.naturalWidth) / ((c[3] - c[1]) * b.naturalHeight);
      },
      portrait: false,
      leafPath: leafPath, clamp: clamp, lerp: lerp, ease: ease,
      /* S.to("name", target, w): a spring-smoothed value kept in S.state */
      to: function (key, target, w) {
        var st = S.state;
        if (st[key] === undefined || S.reduced) { st[key] = target; st[key + "$v"] = 0; return target; }
        var r = spring(st[key], st[key + "$v"] || 0, target, w || 10, S.dt);
        st[key] = r[0]; st[key + "$v"] = r[1];
        return r[0];
      },
      /* The one photographic grade every variant shares: a slight overall
         dim, a soft dark at the top for the headline, and a fall to black at
         the bottom for the page that follows. Pass a lift to draw the photo
         raised by that many pixels. */
      grade: function (lift) {
        var r = S.farmRect;
        ctx.drawImage(S.farm, r.x, r.y - (lift || 0), r.w, r.h);
        ctx.fillStyle = "rgba(0,0,0,0.16)";
        ctx.fillRect(0, 0, S.W, S.H);
        var t = ctx.createLinearGradient(0, 0, 0, S.H * 0.46);
        t.addColorStop(0, "rgba(0,0,0,0.62)");
        t.addColorStop(0.55, "rgba(0,0,0,0.22)");
        t.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = t; ctx.fillRect(0, 0, S.W, S.H * 0.46);
      },
      fadeBottom: function (h, a) {
        h = h || S.H * 0.16;
        var b = ctx.createLinearGradient(0, S.H - h, 0, S.H);
        b.addColorStop(0, "rgba(0,0,0,0)");
        b.addColorStop(1, "rgba(0,0,0," + (a === undefined ? 0.7 : a) + ")");
        ctx.fillStyle = b; ctx.fillRect(0, S.H - h, S.W, h);
      },
      /* Fades the headline back when a variant needs the space it sits in. */
      dimText: function (v) {
        if (!textEl) return;
        v = clamp(v, 0, 1);
        if (Math.abs(v - (S.state.$dim || 0)) < 0.01) return;
        S.state.$dim = v;
        textEl.style.opacity = String(1 - v * 0.8);
      },
      hint: function () { if (pill) pill.classList.add("is-gone"); },
      /* a small white point with a soft glow, for when the cursor is hidden */
      dot: function (x, y, r, color) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, r || 3.5, 0, Math.PI * 2);
        ctx.fillStyle = color || "rgba(255,255,255,0.95)";
        ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      }
    };
    var textEl = hero.querySelector(".hero__text"), pill = hero.querySelector(".hero__pill");

    function resize() {
      var rect = hero.getBoundingClientRect();
      S.dpr = Math.min(window.devicePixelRatio || 1, 2);
      S.W = rect.width; S.H = rect.height;
      canvas.width = Math.round(S.W * S.dpr);
      canvas.height = Math.round(S.H * S.dpr);
      S.portrait = S.W / S.H < 1.05;
      if (S.farm) {
        var f = S.portrait ? (opts.farmFocusPortrait || [0.62, 0.5]) : (opts.farmFocus || [0.5, 0.45]);
        S.farmRect = cover(S.farm.naturalWidth, S.farm.naturalHeight, S.W, S.H, f[0], f[1]);
      }
      if (opts.resize && S.farm) opts.resize(S);
    }

    function setTarget(e) {
      var rect = hero.getBoundingClientRect();
      var p = S.pointer;
      p.tx = e.clientX - rect.left;
      p.ty = e.clientY - rect.top;
      p.lastMove = S.t;
      if (!p.everMoved) { p.x = p.tx; p.y = p.ty; }
      p.everMoved = true;
    }

    hero.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse" && !e.isPrimary) return;
      S.pointer.inside = true;
      S.pointer.touched = e.pointerType !== "mouse";
      setTarget(e);
    });
    hero.addEventListener("pointerdown", function (e) {
      S.pointer.inside = true;
      S.pointer.touched = e.pointerType !== "mouse";
      setTarget(e);
    });
    hero.addEventListener("pointerleave", function (e) {
      if (e.pointerType === "mouse") S.pointer.inside = false;
    });

    window.addEventListener("resize", resize);

    var visible = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }).observe(hero);
    }
    document.addEventListener("visibilitychange", kick);

    var last = performance.now(), running = false, frozen = false;
    function frame(now) {
      running = false;
      if (frozen || !visible || document.hidden) return;
      step(Math.min(0.05, (now - last) / 1000));
      last = now;
      kick();
    }

    function step(dt) {
      S.dt = dt;
      S.t += dt;

      var p = S.pointer;
      /* The pointer is followed by a critically damped spring: it starts
         gently, arrives without overshoot, and never lags by a fixed
         fraction the way a plain lerp does. Reduced motion: no spring. */
      if (reduced) { p.vx = (p.tx - p.x) / Math.max(dt, 1e-3); p.vy = (p.ty - p.y) / Math.max(dt, 1e-3); p.x = p.tx; p.y = p.ty; }
      else {
        var w = opts.follow || 18;
        var sx = spring(p.x, p.vx, p.tx, w, dt), sy = spring(p.y, p.vy, p.ty, w, dt);
        p.x = sx[0]; p.vx = sx[1]; p.y = sy[0]; p.vy = sy[1];
      }

      ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
      ctx.clearRect(0, 0, S.W, S.H);
      opts.draw(S);
    }

    /* For checking a variant in a background tab, where frames do not run:
       __lensStep(seconds) advances the animation by hand. */
    window.__lensStep = function (seconds) {
      for (var i = 0; i < Math.round(seconds * 60); i++) step(1 / 60);
    };
    function kick() {
      if (!running && S.farm) { running = true; last = performance.now(); requestAnimationFrame(frame); }
    }

    var big = Math.max(window.innerWidth, window.innerHeight) * Math.min(window.devicePixelRatio || 1, 2) > 1600;
    Promise.all([loadPhoto(FARM.base, big), loadPhoto(BENCH.base, big)]).then(function (imgs) {
      S.farm = imgs[0]; S.bench = imgs[1];
      resize();
      if (opts.init) opts.init(S);
      hero.classList.add("is-ready");
      window.__lens = S;
      /* ?at=0.6,0.4 puts the cursor there (fractions of the hero);
         ?still=3 then runs three seconds of animation at once. Used for the
         thumbnails on the index page. */
      var q = new URLSearchParams(location.search);
      if (q.get("at")) {
        var a = q.get("at").split(",").map(Number);
        var pt = S.pointer;
        pt.inside = true; pt.everMoved = true;
        pt.x = pt.tx = a[0] * S.W; pt.y = pt.ty = a[1] * S.H;
      }
      if (q.get("still")) { hero.classList.add("is-still"); canvas.style.transition = "none"; window.__lensStep(Number(q.get("still"))); frozen = true; }
      kick();
    });

    return S;
  }

  window.Lens = Lens;
})();
