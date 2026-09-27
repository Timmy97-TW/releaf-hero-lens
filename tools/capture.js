/* Paste into a variant's tab: capture("name.png") posts a still of the hero
   (canvas plus the wordmark, claim and caption) to the sink on :8922. */
window.capture = async function (name) {
  var hero = document.querySelector(".hero"), c = hero.querySelector("canvas");
  var hr = hero.getBoundingClientRect();
  var out = document.createElement("canvas");
  out.width = hr.width; out.height = hr.height;
  var x = out.getContext("2d");
  x.drawImage(c, 0, 0, hr.width, hr.height);
  function put(el, fn) { var r = el.getBoundingClientRect(); fn(r.left - hr.left, r.top - hr.top, r); }
  document.querySelectorAll(".hero__claim, .hero__line").forEach(function (el) {
    var cs = getComputedStyle(el);
    if (cs.display === "none" || cs.opacity === "0") return;
    x.font = cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
    x.fillStyle = cs.color; x.textBaseline = "top"; x.letterSpacing = cs.letterSpacing;
    var range = document.createRange(); range.selectNodeContents(el);
    Array.from(range.getClientRects()).forEach(function () {});
    // draw line by line using the element's text wrapped at its own width
    var words = el.innerText.split(/\s+/), line = "", lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
    var r = el.getBoundingClientRect(), y = r.top - hr.top, left = r.left - hr.left;
    var center = cs.textAlign === "center";
    x.textAlign = center ? "center" : "left";
    if (center) left = left + r.width / 2;
    x.globalAlpha = parseFloat(getComputedStyle(el.parentNode).opacity) || 1;
    words.forEach(function (w) {
      var test = line ? line + " " + w : w;
      if (x.measureText(test).width > r.width + 1 && line) { x.fillText(line, left, y + (lh - parseFloat(cs.fontSize)) / 2); y += lh; line = w; }
      else line = test;
    });
    x.fillText(line, left, y + (lh - parseFloat(cs.fontSize)) / 2);
    x.globalAlpha = 1;
  });
  var res = await fetch("http://localhost:8922/" + name, { method: "POST", body: out.toDataURL("image/png") });
  return res.status;
};
