/* ============================================================
   DAF CGOC — shared analytics events (loaded on every page)
   Sends PII-free engagement events via the gtag defined in each
   page's <head>. File downloads, outbound clicks, and 90% scroll
   are covered by GA4 Enhanced Measurement (property setting) —
   this file only adds what GA can't see on its own: which page
   sections people actually reach and read.
   ============================================================ */
(function () {
  "use strict";

  function track(name, params) {
    if (typeof window.gtag === "function") window.gtag("event", name, params || {});
  }

  /* Section engagement: fire once per section when half the section is
     visible, or (for sections taller than the screen) when the section
     fills half the viewport. */
  if ("IntersectionObserver" in window) {
    var seen = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var id = entry.target.id;
        if (!entry.isIntersecting || seen[id]) return;
        var viewportCovered = entry.intersectionRect.height / (window.innerHeight || 1);
        if (entry.intersectionRatio < 0.5 && viewportCovered < 0.5) return;
        seen[id] = true;
        track("section_view", { section_id: id });
        io.unobserve(entry.target);
      });
    }, { threshold: [0.15, 0.5] });
    document.querySelectorAll("section[id], div.section[id]").forEach(function (s) {
      io.observe(s);
    });
  }
})();
