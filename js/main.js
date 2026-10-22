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

// Reveal content as it scrolls into view, staggering items that appear together.
(function () {
  var targets = document.querySelectorAll([
    ".home-name", ".home-title", ".home-tagline", ".project-tile",
    ".hero-title", ".hero-client", ".hero-lead", ".hero-sub", ".hero .media", ".panel-grid",
    ".fact", ".section-title", ".body > p", ".media", ".flow li", ".back",
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
