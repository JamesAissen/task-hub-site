/* ============================================================
   flavor.js — Daily Brief flavor carousel
   Self-contained module for task-hub-site. Inserts a full-width
   card that cycles (every 15s, like the weather panel) through:
   Today in history → Quote → Word of the day → Audio & music →
   Iowa & local.

   Data: reads brief.flavor from the same Firebase-delivered
   brief the page already renders (window.localStorage cst_brief_v1),
   expecting: brief.flavor = [{tag, text, src}, ...]
   Falls back to built-in content when no data is present.

   Safe: touches nothing else on the page. No auth, no tasks.
   ============================================================ */
(function () {
  "use strict";

  var DUR = 15000;

  var FALLBACK = [
    { tag: "Today in history", text: "1965 — Bob Dylan went electric at the Newport Folk Festival, one of the pivotal turns in modern music.", src: "HistoryNet" },
    { tag: "Quote of the day", text: "“Early to bed and early to rise makes a man healthy, wealthy, and wise.” — Benjamin Franklin", src: "BrainyQuote" },
    { tag: "Word of the day", text: "pelf (n.) — money or wealth, especially when regarded as ill-gotten or corrupting.", src: "Dictionary.com" },
    { tag: "Audio & music", text: "Dirk Ulrich has reacquired Plugin Alliance and Brainworx — both brands return to his ownership after four years under Native Instruments.", src: "ProSoundWeb" },
    { tag: "Iowa & local", text: "Iowa Democrats’ bid to restore their first-in-the-nation presidential caucuses was unsuccessful Friday.", src: "Iowa Capital Dispatch" }
  ];

  var COLORS = {
    "Today in history": "var(--cyan)",
    "Quote of the day": "#b98bff",
    "Word of the day": "var(--green)",
    "Audio & music": "var(--cyan)",
    "Iowa & local": "var(--amber)"
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function getSlides() {
    try {
      var b = JSON.parse(localStorage.getItem("cst_brief_v1"));
      if (b && Array.isArray(b.flavor) && b.flavor.length) {
        return b.flavor.filter(function (s) { return s && s.text; });
      }
    } catch (e) {}
    return FALLBACK;
  }

  function build() {
    var grid = document.querySelector(".grid");
    if (!grid || document.getElementById("flavor-card")) return;

    var card = document.createElement("div");
    card.className = "card col-12";
    card.id = "flavor-card";
    card.innerHTML =
      '<h2><span class="dot"></span>Daily Flavor' +
      '<span class="hdr-note" id="flv-src" style="margin-left:auto;"></span></h2>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;">' +
        '<span id="flv-tag" style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;' +
          'padding:3px 10px;border-radius:6px;border:1px solid var(--line);color:var(--cyan);"></span>' +
        '<span style="display:flex;gap:6px;">' +
          '<button id="flv-prev" aria-label="Previous" style="width:26px;height:26px;border:1px solid var(--line);' +
            'background:transparent;color:var(--muted);border-radius:7px;cursor:pointer;">‹</button>' +
          '<button id="flv-next" aria-label="Next" style="width:26px;height:26px;border:1px solid var(--line);' +
            'background:transparent;color:var(--muted);border-radius:7px;cursor:pointer;">›</button>' +
        '</span>' +
      '</div>' +
      '<div id="flv-text" style="font-size:16px;line-height:1.5;min-height:44px;transition:opacity .17s ease;"></div>' +
      '<div class="wx-dots" id="flv-dots" style="margin-top:12px;"></div>';
    grid.appendChild(card);

    var slides = getSlides();
    var i = 0, timer = null;
    var tag = document.getElementById("flv-tag"),
        txt = document.getElementById("flv-text"),
        src = document.getElementById("flv-src"),
        dots = document.getElementById("flv-dots");

    function paint() {
      var s = slides[i];
      var c = COLORS[s.tag] || "var(--cyan)";
      txt.style.opacity = "0";
      setTimeout(function () {
        tag.textContent = s.tag || "";
        tag.style.color = c;
        txt.innerHTML = esc(s.text);
        src.textContent = s.src || "";
        txt.style.opacity = "1";
      }, 170);
      dots.innerHTML = slides.map(function (_, k) {
        return '<i class="' + (k === i ? "on" : "") + '"></i>';
      }).join("");
    }

    function cycle() {
      clearInterval(timer);
      timer = setInterval(function () { i = (i + 1) % slides.length; paint(); }, DUR);
    }
    function go(n) { i = (n + slides.length) % slides.length; paint(); cycle(); }

    document.getElementById("flv-prev").addEventListener("click", function () { go(i - 1); });
    document.getElementById("flv-next").addEventListener("click", function () { go(i + 1); });

    paint(); cycle();

    // refresh slides if the brief updates in another tab / after sync
    window.addEventListener("storage", function (e) {
      if (e.key === "cst_brief_v1") {
        var fresh = getSlides();
        if (fresh.length) { slides = fresh; i = 0; paint(); cycle(); }
      }
    });
  }

  /* ---------- UI enhancements: clock spacing + Celsius readouts ---------- */

  function injectStyles() {
    if (document.getElementById("flv-enhance-css")) return;
    var st = document.createElement("style");
    st.id = "flv-enhance-css";
    st.textContent =
      ".clock{padding:8px 4px 0 24px;}" +
      ".clock .time{letter-spacing:1px;}" +
      ".clock .zone{margin-top:7px;}" +
      ".wx-c{font-size:15px;color:var(--muted);text-align:right;margin-top:3px;font-variant-numeric:tabular-nums;}";
    document.head.appendChild(st);
  }

  function addCelsius() {
    document.querySelectorAll(".wx-top").forEach(function (top) {
      var t = top.querySelector(".wx-temp");
      if (!t) return;
      var f = parseInt((t.textContent || "").replace(/[^\d-]/g, ""), 10);
      if (isNaN(f)) return;
      var c = Math.round((f - 32) * 5 / 9);
      var holder = t.parentElement === top ? t : t.parentElement;
      var cEl = holder.querySelector(".wx-c");
      if (t.parentElement === top) {
        var wrap = document.createElement("div");
        top.replaceChild(wrap, t);
        wrap.appendChild(t);
        holder = wrap;
        cEl = null;
      }
      if (!cEl) {
        cEl = document.createElement("div");
        cEl.className = "wx-c";
        holder.appendChild(cEl);
      }
      cEl.textContent = c + "°C";
    });
  }

  function hookWeatherRepaints() {
    // paintWx rewrites the temp HTML on data render + every 15s cycle;
    // wrap it so the Celsius line is re-added after each repaint.
    if (typeof window.paintWx === "function" && !window.paintWx.__flvWrapped) {
      var orig = window.paintWx;
      var wrapped = function (el, w) {
        orig(el, w);
        setTimeout(function () { applyLive(); }, 420);
      };
      wrapped.__flvWrapped = true;
      window.paintWx = wrapped;
    }
  }

  /* ---------- live current temperature (Open-Meteo, no key) ---------- */

  var COORDS = {
    "Clarksville": [42.7802, -92.6681],
    "Prairie du Chien": [43.0517, -91.1412]
  };
  var LIVE = {};   // town -> current temp °F

  function applyLive() {
    document.querySelectorAll(".wx-top").forEach(function (top) {
      var townEl = top.querySelector(".wx-town");
      var t = top.querySelector(".wx-temp");
      if (!townEl || !t) return;
      var town = (townEl.textContent || "").trim();
      var live = LIVE[town];
      if (live == null) return;
      var shown = parseInt((t.textContent || "").replace(/[^\d-]/g, ""), 10);
      if (shown === live) return;
      t.innerHTML = live + "&deg;<small>F</small>";
      t.title = "Live current temperature";
    });
    addCelsius();
  }

  function fetchLive() {
    Object.keys(COORDS).forEach(function (town) {
      var c = COORDS[town];
      fetch("https://api.open-meteo.com/v1/forecast?latitude=" + c[0] +
            "&longitude=" + c[1] +
            "&current=temperature_2m&temperature_unit=fahrenheit")
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d && d.current && typeof d.current.temperature_2m === "number") {
            LIVE[town] = Math.round(d.current.temperature_2m);
            applyLive();
          }
        })
        .catch(function () {});   // offline/API down: keep showing brief temps
    });
  }

  function enhance() {
    injectStyles();
    addCelsius();
    hookWeatherRepaints();
    fetchLive();
    setInterval(fetchLive, 10 * 60 * 1000);   // refresh every 10 minutes
    // retry briefly in case the brief data paints after us
    var tries = 0;
    var iv = setInterval(function () {
      addCelsius();
      applyLive();
      hookWeatherRepaints();
      if (++tries >= 5) clearInterval(iv);
    }, 1000);
  }

  function start() { build(); enhance(); }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
