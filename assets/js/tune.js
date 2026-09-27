/* tune.js · a small panel for poking at a direction.
   Opens from "Tune" in the nav. Every control edits window.LIGHT live.
   "Copy link" puts the changed values in the URL and copies it, so a
   setting can be sent to the team and opened exactly as it was left. */

(function () {
  var C = window.LIGHT, D = window.LIGHT_DEFAULTS;
  if (!C) return;

  var ROWS = [
    ["Light", [
      ["R", "Size", 0.10, 0.55, 0.01],
      ["life", "Trail, seconds", 0.1, 4, 0.1],
      ["feather", "Edge softness", 0.05, 0.9, 0.01],
      ["green", "Green light", "toggle"],
      ["darkRim", "Dark rim", 0, 1, 0.05],
      ["centreGrow", "Larger at centre", 0, 1, 0.05],
      ["rest", "At rest", ["bench", "none"]]
    ]],
    ["Farm", [
      ["dim", "Dim", 0, 0.6, 0.01],
      ["vignette", "Centre focus", 0, 1, 0.05],
      ["rightFade", "Right fade", 0, 1, 0.01],
      ["rightFadeW", "Right fade width", 0.1, 0.8, 0.01]
    ]],
    ["Bench", [
      ["benchX", "Reactor across", 0.2, 0.8, 0.01],
      ["benchY", "Reactor down", 0.3, 0.8, 0.01],
      ["benchScale", "Scale", 0.6, 1.8, 0.01],
      ["boardDim", "Whiteboard dim", 0, 1, 0.05]
    ]],
    ["Timing", [
      ["warm", "Farm alone first, s", 0, 8, 0.5],
      ["idleOff", "Off when still, s", 0, 10, 0.5]
    ]]
  ];

  var css = document.createElement("style");
  css.textContent = [
    ".tune-btn{position:absolute;right:clamp(96px,9vw,130px);font:500 .8rem var(--font);color:rgba(255,255,255,.8);background:none;border:0;cursor:pointer;padding:6px 0}",
    ".tune-btn:hover,.tune-btn[aria-expanded=true]{color:#fff}",
    ".tune{position:fixed;z-index:60;top:calc(var(--nav-h) + 12px);right:12px;width:300px;max-height:calc(100vh - var(--nav-h) - 24px);overflow:auto;",
    "padding:14px 16px 16px;border-radius:18px;background:rgba(28,28,30,.78);-webkit-backdrop-filter:saturate(180%) blur(24px);backdrop-filter:saturate(180%) blur(24px);",
    "box-shadow:0 20px 60px rgba(0,0,0,.45),inset 0 0 0 .5px rgba(255,255,255,.14);color:#f5f5f7;font:400 .8rem var(--font);letter-spacing:-.005em;",
    "transform-origin:top right;transition:opacity .25s var(--ease),transform .25s var(--ease)}",
    ".tune[hidden]{display:block;opacity:0;transform:scale(.96);pointer-events:none}",
    ".tune h4{margin:14px 0 6px;font-size:.72rem;font-weight:600;color:rgba(235,235,245,.6);text-transform:uppercase;letter-spacing:.06em}",
    ".tune h4:first-child{margin-top:2px}",
    ".tune__row{display:grid;grid-template-columns:1fr auto;align-items:center;gap:2px 8px;margin:0 0 8px}",
    ".tune__row label{color:rgba(245,245,247,.92)}",
    ".tune__row output{color:rgba(235,235,245,.6);font-variant-numeric:tabular-nums}",
    ".tune__row input[type=range]{grid-column:1/-1;width:100%;margin:2px 0 0;accent-color:#34c759;height:18px}",
    ".tune__seg{grid-column:1/-1;display:flex;gap:2px;padding:2px;border-radius:9px;background:rgba(118,118,128,.24)}",
    ".tune__seg button{flex:1;border:0;border-radius:7px;padding:4px 0;background:none;color:#f5f5f7;font:500 .75rem var(--font);cursor:pointer}",
    ".tune__seg button[aria-pressed=true]{background:rgba(99,99,102,.9);box-shadow:0 1px 3px rgba(0,0,0,.3)}",
    ".tune__sw{appearance:none;-webkit-appearance:none;width:36px;height:22px;border-radius:11px;background:rgba(120,120,128,.32);position:relative;cursor:pointer;transition:background .2s}",
    ".tune__sw:checked{background:#34c759}",
    ".tune__sw::after{content:'';position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform .2s var(--ease)}",
    ".tune__sw:checked::after{transform:translateX(14px)}",
    ".tune__foot{display:flex;gap:8px;margin-top:14px}",
    ".tune__foot button{flex:1;border:0;border-radius:980px;padding:8px 0;font:500 .8rem var(--font);cursor:pointer}",
    ".tune__reset{background:rgba(118,118,128,.24);color:#f5f5f7}",
    ".tune__copy{background:#f5f5f7;color:#1d1d1f}"
  ].join("");
  document.head.appendChild(css);

  var nav = document.querySelector(".navstrip");
  var btn = document.createElement("button");
  btn.className = "tune-btn"; btn.type = "button"; btn.textContent = "Tune";
  btn.setAttribute("aria-expanded", "false");
  nav.appendChild(btn);

  var panel = document.createElement("div");
  panel.className = "tune"; panel.hidden = true;
  panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "Tune this version");
  document.body.appendChild(panel);

  var inputs = {};
  function fmt(v) { return Math.abs(v) >= 10 ? v.toFixed(0) : (+v).toFixed(2).replace(/0$/, ""); }

  ROWS.forEach(function (grp) {
    var h = document.createElement("h4"); h.textContent = grp[0]; panel.appendChild(h);
    grp[1].forEach(function (row) {
      var k = row[0], el = document.createElement("div");
      el.className = "tune__row";
      if (row[2] === "toggle") {
        el.innerHTML = '<label for="t-' + k + '">' + row[1] + '</label><input class="tune__sw" type="checkbox" id="t-' + k + '">';
        var cb = el.querySelector("input");
        cb.checked = !!C[k];
        cb.addEventListener("change", function () { C[k] = cb.checked ? 1 : 0; });
        inputs[k] = function () { cb.checked = !!C[k]; };
      } else if (Array.isArray(row[2])) {
        el.innerHTML = '<label>' + row[1] + '</label><span></span><div class="tune__seg"></div>';
        var seg = el.querySelector(".tune__seg");
        var btns = row[2].map(function (opt) {
          var b = document.createElement("button");
          b.type = "button"; b.textContent = opt[0].toUpperCase() + opt.slice(1);
          b.addEventListener("click", function () { C[k] = opt; sync(); });
          seg.appendChild(b); return [opt, b];
        });
        function sync() { btns.forEach(function (o) { o[1].setAttribute("aria-pressed", String(C[k] === o[0])); }); }
        sync(); inputs[k] = sync;
      } else {
        el.innerHTML = '<label for="t-' + k + '">' + row[1] + '</label><output></output><input type="range" id="t-' + k + '" min="' + row[2] + '" max="' + row[3] + '" step="' + row[4] + '">';
        var rg = el.querySelector("input"), out = el.querySelector("output");
        rg.value = C[k]; out.textContent = fmt(C[k]);
        rg.addEventListener("input", function () { C[k] = Number(rg.value); out.textContent = fmt(C[k]); });
        inputs[k] = function () { rg.value = C[k]; out.textContent = fmt(C[k]); };
      }
      panel.appendChild(el);
    });
  });

  var foot = document.createElement("div");
  foot.className = "tune__foot";
  foot.innerHTML = '<button type="button" class="tune__reset">Reset</button><button type="button" class="tune__copy">Copy link</button>';
  panel.appendChild(foot);

  foot.querySelector(".tune__reset").addEventListener("click", function () {
    Object.keys(D).forEach(function (k) { C[k] = D[k]; if (inputs[k]) inputs[k](); });
    history.replaceState(null, "", location.pathname);
  });
  foot.querySelector(".tune__copy").addEventListener("click", function (e) {
    var q = new URLSearchParams();
    Object.keys(D).forEach(function (k) { if (C[k] !== D[k]) q.set(k, C[k]); });
    var url = location.origin + location.pathname + (q.toString() ? "?" + q : "");
    history.replaceState(null, "", url);
    var b = e.currentTarget;
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () {
      b.textContent = "Copied";
    }, function () { b.textContent = "Link in address bar"; });
    setTimeout(function () { b.textContent = "Copy link"; }, 1600);
  });

  btn.addEventListener("click", function () {
    panel.hidden = !panel.hidden;
    btn.setAttribute("aria-expanded", String(!panel.hidden));
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !panel.hidden) { panel.hidden = true; btn.setAttribute("aria-expanded", "false"); }
  });
})();
