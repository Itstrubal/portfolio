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
