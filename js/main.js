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

// Reveal content as it scrolls into view, staggering items that appear together.
(function () {
  var targets = document.querySelectorAll([
    ".home-name", ".home-title", ".home-tagline", ".project-tile",
    ".hero-title", ".hero-client", ".hero-lead", ".hero-sub", ".hero .media", ".panel-grid",
    ".fact", ".section-title", ".body > p", ".media", ".flow li", ".next",
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
