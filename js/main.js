var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Fade images and videos in once they have loaded (CSS hides them until .is-loaded).
(function () {
  function markLoaded(el) { el.classList.add("is-loaded"); }

  document.querySelectorAll(".media img").forEach(function (img) {
    if (img.complete) { markLoaded(img); return; }
    img.addEventListener("load", function () { markLoaded(img); });
    img.addEventListener("error", function () { markLoaded(img); });
  });

  document.querySelectorAll(".media video").forEach(function (video) {
    if (video.readyState >= 2) { markLoaded(video); return; }
    video.addEventListener("loadeddata", function () { markLoaded(video); });
    video.addEventListener("error", function () { markLoaded(video); });
  });
})();

// Lazy-load and auto-play videos only while they're on screen.
// Keeps the big case-study videos from all downloading at once.
(function () {
  var videos = document.querySelectorAll("video[data-src]");
  if (!videos.length) return;

  function load(video) {
    if (!video.src) {
      video.src = video.dataset.src;
      video.load();
    }
  }

  if (!("IntersectionObserver" in window)) {
    videos.forEach(function (v) { load(v); v.play().catch(function () {}); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var video = entry.target;
      if (entry.isIntersecting) {
        load(video);
        var p = video.play();
        if (p && p.catch) p.catch(function () {});
      } else if (video.src) {
        video.pause();
      }
    });
  }, { rootMargin: "300px 0px" });

  videos.forEach(function (v) { observer.observe(v); });
})();

// Header: tint it once the page scrolls and fill the reading-progress line.
(function () {
  var header = document.querySelector(".site-header");
  if (!header) return;
  var progress = header.querySelector(".scroll-progress");
  var ticking = false;

  function update() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;

    header.classList.toggle("is-scrolled", y > 8);
    if (progress) progress.style.transform = "scaleX(" + (max > 0 ? Math.min(y / max, 1) : 0) + ")";

    ticking = false;
  }

  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
})();

// "Next project": slide this page out sideways, then open the next one, which
// slides in from the matching side (its head script reads the direction).
(function () {
  var link = document.querySelector(".next-link");
  if (!link) return;
  var root = document.documentElement;

  // Coming back via the browser's back button can restore the slid-out page.
  window.addEventListener("pageshow", function (e) {
    if (e.persisted) root.classList.remove("leave-forward", "leave-wrap");
  });

  // Drop the entrance classes once the page has animated in, so no leftover
  // transform/filter stays on the page.
  var main = document.querySelector("main");
  if (main) main.addEventListener("animationend", function (e) {
    if (e.target === main) root.classList.remove("enter-forward", "enter-wrap");
  });

  if (reduceMotion) return;

  link.addEventListener("click", function (e) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    var direction = link.dataset.direction || "forward";
    try { sessionStorage.setItem("pageEnter", direction); } catch (err) {}
    root.classList.add("leave-" + direction);
    // Match the leave animation's length in style.css (the rewind runs a bit longer)
    setTimeout(function () { window.location.href = link.href; }, direction === "wrap" ? 450 : 380);
  });
})();

// Switch between "How it's built" (.view-tech, where every visit starts) and
// "What it does". The page turns over, swapping views while it is edge-on.
(function () {
  var toggle = document.querySelector(".view-toggle");
  if (!toggle) return;
  var root = document.documentElement;
  // The home page turns as a whole; a project page turns its main content
  var page = document.querySelector(".home") || document.querySelector("main");
  var isProject = !document.querySelector(".home");
  var themeColor = document.querySelector('meta[name="theme-color"]');
  var busy = false;

  function sync() {
    var tech = root.classList.contains("view-tech");
    toggle.setAttribute("aria-checked", tech ? "true" : "false");
    if (themeColor) themeColor.content = getComputedStyle(document.body).backgroundColor;
  }

  function setView(tech) {
    root.classList.toggle("view-tech", tech);
    sync();
  }

  // Run fn once el's own animation ends (not one of its children's)
  function afterAnimation(el, fn) {
    el.addEventListener("animationend", function done(e) {
      if (e.target !== el) return;
      el.removeEventListener("animationend", done);
      fn();
    });
  }

  // Turn around the middle of what's on screen, not the middle of the page
  function centerOrigin() {
    page.style.transformOrigin = "50% " + (window.scrollY + window.innerHeight / 2 - page.offsetTop) + "px";
  }

  // A project's two versions are different stories, so start the new one at the top
  function showView(tech) {
    setView(tech);
    if (isProject) window.scrollTo({ top: 0, behavior: "instant" });
  }

  toggle.addEventListener("click", function () {
    if (busy) return;
    var tech = !root.classList.contains("view-tech");
    if (reduceMotion || !page) { showView(tech); return; }

    busy = true;
    centerOrigin();
    page.classList.add("flip-out");
    afterAnimation(page, function () {
      showView(tech);
      centerOrigin();
      page.classList.remove("flip-out");
      page.classList.add("flip-in");
      afterAnimation(page, function () {
        page.classList.remove("flip-in");
        page.style.transformOrigin = "";
        busy = false;
      });
    });
  });

  sync();
})();

// Open brief <-> strict brief slider: the automation and review bars follow it.
(function () {
  document.querySelectorAll(".brief").forEach(function (brief) {
    var range = brief.querySelector(".brief-range");
    if (!range) return;
    function update() { brief.style.setProperty("--strict", range.value); }
    range.addEventListener("input", update);
    update();
  });
})();

// Image -> video app mock-up: plays the flow on a loop while it's on screen.
// A prompt is typed and a reference image dropped in, four candidates are
// generated, one is picked, then it's turned into a video, played and saved.
(function () {
  var app = document.querySelector(".i2v");
  if (!app) return;

  var panels = app.querySelectorAll(".i2v-panel");
  var arrows = app.querySelectorAll(".i2v-arrow");
  var box = app.querySelector(".i2v-textarea");
  var typed = app.querySelector(".i2v-typed");
  var drop = app.querySelector(".i2v-drop");
  var grid = app.querySelector(".i2v-grid");
  var options = app.querySelectorAll(".i2v-option");
  var player = app.querySelector(".i2v-player");
  var play = app.querySelector(".i2v-play");
  var time = app.querySelector(".i2v-time");
  var bar = app.querySelector(".i2v-track i");
  var btn = {
    images: app.querySelector('[data-step="images"]'),
    video: app.querySelector('[data-step="video"]'),
    save: app.querySelector('[data-step="save"]')
  };
  var PROMPT = "Lorem ipsum dolor sit amet, consectetur adipiscing elit";
  var PICK = 1;

  // A layer for each tile's "generated" image
  options.forEach(function (opt) { opt.insertBefore(document.createElement("b"), opt.firstChild); });

  function set(el, cls, on) { el.classList.toggle(cls, on !== false); }

  function reset() {
    typed.textContent = "";
    ["is-focused", "has-text"].forEach(function (c) { set(box, c, false); });
    ["has-image", "is-over"].forEach(function (c) { set(drop, c, false); });
    ["is-loading", "has-images"].forEach(function (c) { set(grid, c, false); });
    options.forEach(function (o) { set(o, "is-selected", false); set(o, "is-hover", false); });
    ["has-video", "is-loading", "is-playing"].forEach(function (c) { set(player, c, false); });
    Object.keys(btn).forEach(function (k) {
      ["is-ready", "is-loading", "is-pressed", "is-saved"].forEach(function (c) { set(btn[k], c, false); });
    });
    btn.save.textContent = "Save video";
    panels.forEach(function (p) { set(p, "is-active", false); set(p, "is-done", false); });
    arrows.forEach(function (a) { set(a, "is-live", false); });
    bar.style.transform = "scaleX(0)";
    time.textContent = "0:00";
    set(panels[0], "is-active");
  }

  // The final frame, for people who prefer less motion
  function showEnd() {
    reset();
    typed.textContent = PROMPT;
    set(box, "has-text");
    set(drop, "has-image");
    set(grid, "has-images");
    set(options[PICK], "is-selected");
    set(player, "has-video");
    panels.forEach(function (p) { set(p, "is-done"); set(p, "is-active", false); });
    arrows.forEach(function (a) { set(a, "is-live"); });
    Object.keys(btn).forEach(function (k) { set(btn[k], "is-ready"); });
  }

  if (reduceMotion) { showEnd(); return; }

  // Steps wait while the mock-up is off screen, so it picks up where it left off
  var visible = false;
  var waiting = [];
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) waiting.splice(0).forEach(function (fn) { fn(); });
    }, { threshold: 0.25 }).observe(app);
  } else {
    visible = true;
  }
  function wait(ms) {
    return new Promise(function (resolve) {
      setTimeout(function () {
        if (visible) resolve(); else waiting.push(resolve);
      }, ms);
    });
  }
  function press(el) {
    set(el, "is-pressed");
    return wait(180).then(function () { set(el, "is-pressed", false); });
  }

  function typeOut(i) {
    if (i > PROMPT.length) return Promise.resolve();
    typed.textContent = PROMPT.slice(0, i);
    set(box, "has-text", i > 0);
    return wait(40 + Math.random() * 50).then(function () { return typeOut(i + 1); });
  }

  function playVideo() {
    return new Promise(function (resolve) {
      var start = performance.now();
      (function tick(now) {
        var p = Math.min((now - start) / 5000, 1);
        bar.style.transform = "scaleX(" + p + ")";
        time.textContent = "0:0" + Math.floor(p * 5);
        if (p < 1) requestAnimationFrame(tick); else resolve();
      })(start);
    });
  }

  function loop() {
    reset();
    wait(700)
      .then(function () { set(box, "is-focused"); return wait(300); })
      .then(function () { return typeOut(1); })
      .then(function () { set(btn.images, "is-ready"); return wait(400); })
      .then(function () { set(box, "is-focused", false); set(drop, "is-over"); return wait(450); })
      .then(function () { set(drop, "is-over", false); set(drop, "has-image"); return wait(700); })
      .then(function () { return press(btn.images); })
      .then(function () { set(btn.images, "is-loading"); set(grid, "is-loading"); return wait(1500); })
      .then(function () {
        set(btn.images, "is-loading", false);
        set(grid, "is-loading", false);
        set(grid, "has-images");
        set(panels[0], "is-active", false);
        set(panels[0], "is-done");
        set(panels[1], "is-active");
        set(arrows[0], "is-live");
        return wait(1100);
      })
      .then(function () { set(options[0], "is-hover"); return wait(450); })
      .then(function () { set(options[0], "is-hover", false); set(options[PICK], "is-hover"); return wait(450); })
      .then(function () { set(options[PICK], "is-hover", false); set(options[PICK], "is-selected"); set(btn.video, "is-ready"); return wait(700); })
      .then(function () { return press(btn.video); })
      .then(function () {
        set(btn.video, "is-loading");
        set(player, "is-loading");
        set(panels[2], "is-active");
        set(arrows[1], "is-live");
        return wait(2300);
      })
      .then(function () {
        set(btn.video, "is-loading", false);
        set(player, "is-loading", false);
        set(player, "has-video");
        set(panels[1], "is-active", false);
        set(panels[1], "is-done");
        set(btn.save, "is-ready");
        return wait(900);
      })
      .then(function () { return press(play); })
      .then(function () { set(player, "is-playing"); return playVideo(); })
      .then(function () { set(player, "is-playing", false); return wait(500); })
      .then(function () { return press(btn.save); })
      .then(function () {
        set(btn.save, "is-saved");
        btn.save.textContent = "Saved ✓";
        set(panels[2], "is-active", false);
        set(panels[2], "is-done");
        return wait(2600);
      })
      .then(function () { set(app, "is-resetting"); return wait(500); })
      .then(function () { reset(); set(app, "is-resetting", false); loop(); });
  }

  loop();
})();

// Flow chart: leave enough room under each row for its tallest step to open
// without covering the row (or the section) below it
(function () {
  var chart = document.querySelector(".flowchart-steps");
  if (!chart) return;
  var steps = [].slice.call(chart.querySelectorAll(".flowchart-step"));
  // Room an opened step needs below its row: its details, the 4px detail
  // margin and 28px of breathing room
  function room(list) {
    var max = 0;
    list.forEach(function (s) {
      var d = s.querySelector(".flowchart-detail");
      if (d && d.scrollHeight) max = Math.max(max, d.scrollHeight + 32);
    });
    return max;
  }
  function fit() {
    var tops = steps.map(function (s) { return s.offsetTop; });
    var first = Math.min.apply(null, tops), last = Math.max.apply(null, tops);
    var top = steps.filter(function (s) { return s.offsetTop === first; });
    var bottom = steps.filter(function (s) { return s.offsetTop === last; });
    chart.style.setProperty("--row-gap", Math.max(room(top), 48) + "px");
    // Below the chart, only add what the next section's top margin doesn't
    // already cover (the two margins overlap, so the larger one is the gap)
    var section = chart.closest(".section");
    var next = section && section.nextElementSibling;
    var below = Math.max(section ? parseFloat(getComputedStyle(section).marginBottom) || 0 : 0,
      next ? parseFloat(getComputedStyle(next).marginTop) || 0 : 0);
    chart.style.setProperty("--after-room", Math.max(room(bottom) - below, 0) + "px");
  }
  fit();
  window.addEventListener("resize", fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  // The chart is hidden in "What it does"; measure again when it shows
  new MutationObserver(fit).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
})();

// Home: the title cycles through roles, deleting each one and typing the next.
(function () {
  var title = document.querySelector(".home-title");
  if (!title) return;
  var roles = [
    "Visual AI Pipeline Architect",
    "Gen AI Builder",
    "Gen AI Specialist",
    "Forward Deployment Creative",
    "Creative Technologist"
  ];
  var i = 0;

  var text = document.createElement("span");
  var caret = document.createElement("span");
  caret.className = "type-caret";
  caret.setAttribute("aria-hidden", "true");
  text.textContent = roles[0];
  title.textContent = "";
  title.append(text, caret);
  // Screen readers get the whole list once instead of half-typed words
  title.setAttribute("aria-label", roles.join(", "));
  text.setAttribute("aria-hidden", "true");

  if (reduceMotion) {
    setInterval(function () {
      i = (i + 1) % roles.length;
      text.textContent = roles[i];
    }, 3000);
    return;
  }

  function type(n) {
    text.textContent = roles[i].slice(0, n);
    if (n < roles[i].length) {
      setTimeout(type, 60 + Math.random() * 60, n + 1);
    } else {
      title.classList.add("is-holding");
      setTimeout(erase, 2200, n);
    }
  }

  function erase(n) {
    title.classList.remove("is-holding");
    text.textContent = roles[i].slice(0, n);
    if (n > 0) {
      setTimeout(erase, 32, n - 1);
    } else {
      i = (i + 1) % roles.length;
      setTimeout(type, 350, 1);
    }
  }

  title.classList.add("is-holding");
  setTimeout(erase, 2800, roles[0].length);
})();

// Reveal content as it scrolls into view, staggering items that appear together.
(function () {
  var targets = document.querySelectorAll([
    ".home-name", ".home-title", ".home-tagline", ".project-tile",
    ".hero-title", ".hero-client", ".hero-lead", ".hero-sub", ".hero .media", ".panel-grid",
    ".fact", ".section-title", ".body > p", ".media", ".flow li", ".next",
    ".spec-list", ".brief", ".i2v-figure",
    ".site-footer-inner > *"
  ].join(","));

  if (reduceMotion || !("IntersectionObserver" in window)) return;

  var observer = new IntersectionObserver(function (entries) {
    var i = 0;
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      el.style.setProperty("--delay", Math.min(i++ * 80, 400) + "ms");
      el.classList.add("is-visible");
      observer.unobserve(el);
    });
  }, { rootMargin: "0px 0px -40px 0px" });

  targets.forEach(function (el) {
    el.classList.add("reveal");
    observer.observe(el);
  });
})();

// Local preview only: a button to see the page at phone width. It never shows
// on the live site, or inside the phone frame itself.
(function () {
  var host = window.location.hostname;
  if (host !== "localhost" && host !== "127.0.0.1") return;
  if (window.self !== window.top) return;

  var root = document.documentElement;
  var button = document.createElement("button");
  button.type = "button";
  button.className = "dev-view-toggle";
  document.body.appendChild(button);

  var overlay = null;

  function open() {
    overlay = document.createElement("div");
    overlay.className = "dev-phone";
    var frame = document.createElement("iframe");
    frame.src = window.location.href;
    frame.title = "Phone view";
    overlay.appendChild(frame);
    document.body.appendChild(overlay);
    root.classList.add("dev-phone-open");
  }

  function close() {
    // Land on whichever page was open in the phone frame
    var href = null;
    try { href = overlay.querySelector("iframe").contentWindow.location.href; } catch (err) {}
    overlay.remove();
    overlay = null;
    root.classList.remove("dev-phone-open");
    if (href && href !== window.location.href) window.location.href = href;
  }

  function render() {
    var phone = sessionStorage.getItem("devView") === "phone";
    button.textContent = phone ? "Desktop view" : "Phone view";
    if (phone && !overlay) open();
    if (!phone && overlay) close();
  }

  button.addEventListener("click", function () {
    var phone = sessionStorage.getItem("devView") === "phone";
    try { sessionStorage.setItem("devView", phone ? "desktop" : "phone"); } catch (err) {}
    render();
  });
  render();
})();
