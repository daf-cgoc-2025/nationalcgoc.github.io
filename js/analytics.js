/* ============================================================
   DAF CGOC — shared engagement analytics
   Loaded on every page of dafcgoc.org and penpal.dafcgoc.org.
   Sends detailed, PII-free interaction events through the gtag
   defined in each page's <head> (both GA properties receive them).

   Events sent:
     click_element    every button/link click, with label, destination,
                      page area, and the section it sits in
     partner_click    MOAA (and future partner) referral clicks
     file_download    PDFs and other documents, with file name
     section_view     first time a section is 50% seen
     section_time     seconds actually spent looking at each section
     scroll_depth     25 / 50 / 75 / 90 / 100 percent milestones
     page_engagement  active seconds on the page, sent when leaving

   Nothing here records names, emails, or form contents.
   ============================================================ */
(function () {
  "use strict";

  var MAX_EVENTS = 250;          // safety cap per page view
  var sent = 0;
  function track(name, params) {
    if (sent >= MAX_EVENTS || typeof window.gtag !== "function") return;
    sent++;
    window.gtag("event", name, params || {});
  }

  var PARTNER_DOMAINS = {
    "moaa.org": "MOAA", "pages.moaa.org": "MOAA",
    "usaa.com": "USAA", "zeffy.com": "Zeffy"
  };

  function clean(s, max) {
    return (s || "").replace(/\s+/g, " ").trim().slice(0, max || 100);
  }

  /* Which part of the page an element lives in */
  function pageArea(el) {
    if (el.closest("nav, .navbar, header")) return "nav";
    if (el.closest("footer")) return "footer";
    if (el.closest(".hero")) return "hero";
    if (el.closest(".opportunity-card, .card, .tile, .bento, .partner-offer")) return "card";
    if (el.closest("#intake, form")) return "form";
    return "body";
  }

  /* Nearest section id, or the nearest heading text as a fallback label */
  function sectionOf(el) {
    var s = el.closest("section[id], div.section[id]");
    if (s) return s.id;
    var h = el.closest("section, article, div.card, .opportunity-card");
    var head = h && h.querySelector("h1, h2, h3, h4");
    return head ? clean(head.textContent, 40) : "";
  }

  function labelFor(el) {
    return clean(
      el.getAttribute("aria-label") ||
      el.textContent ||
      el.getAttribute("title") ||
      (el.querySelector("img") && el.querySelector("img").alt) ||
      el.className, 80);
  }

  /* ---------- every click on a link or button ---------- */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("a, button, [role='button'], summary");
    if (!el) return;

    var href = el.getAttribute("href") || "";
    var params = {
      element_text: labelFor(el),
      element_type: el.tagName.toLowerCase(),
      element_id: el.id || "",
      page_area: pageArea(el),
      section_id: sectionOf(el),
      page_path: location.pathname
    };

    if (href) {
      params.link_url = clean(href, 200);
      if (/^mailto:/i.test(href)) params.link_type = "email";
      else if (/^tel:/i.test(href)) params.link_type = "phone";
      else if (/^#/.test(href)) params.link_type = "anchor";
      else {
        var host = "";
        try { host = new URL(href, location.href).hostname.replace(/^www\./, ""); } catch (err) {}
        params.link_domain = host;
        var internal = host === "" || host === location.hostname.replace(/^www\./, "") ||
                       /(^|\.)dafcgoc\.org$/.test(host);
        params.link_type = internal ? "internal" : "outbound";

        /* Downloads are labelled here for our own click report, but we do NOT
           send a file_download event: GA4 Enhanced Measurement already fires
           one automatically (with file_name / file_extension / link_url), and
           sending our own would double-count every download. */
        var m = href.match(/\.(pdf|docx?|xlsx?|pptx?|csv|zip|txt)(\?|$)/i);
        if (m) {
          params.link_type = "download";
          params.file_name = clean(href.split("/").pop().split("?")[0], 100);
          params.file_extension = m[1].toLowerCase();
        }

        /* partner referrals, reported back to the partner at renewal.
           Counts both the outbound sign-up links and clicks through to our
           own partner pages, so one report covers every MOAA touchpoint. */
        var partner = PARTNER_DOMAINS[host];
        if (!partner) {
          var p = href.toLowerCase();
          if (/\/moaa/.test(p)) partner = "MOAA";
          else if (/\/usaa/.test(p)) partner = "USAA";
          else if (/\/defo/.test(p)) partner = "DEFO";
        }
        if (partner) {
          track("partner_click", {
            partner: partner,
            placement: el.id || params.section_id || params.page_area,
            link_url: params.link_url,
            page_path: location.pathname
          });
        }

        /* clicks heading to the mentorship site, from anywhere */
        if (/penpal\.dafcgoc\.org/.test(host)) {
          track("penpal_referral", {
            placement: el.id || params.section_id || params.page_area,
            element_text: params.element_text,
            page_path: location.pathname
          });
        }
      }
    }

    track("click_element", params);
  }, true);

  /* ---------- section views + dwell time ---------- */
  var timers = {};   // section id -> accumulated ms
  var visible = {};  // section id -> timestamp when it became visible

  if ("IntersectionObserver" in window) {
    var seen = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var el = entry.target;
        var id = el.id || clean((el.querySelector("h1,h2,h3") || {}).textContent, 40) || "section";

        if (entry.isIntersecting) {
          var covered = entry.intersectionRect.height / (window.innerHeight || 1);
          if (entry.intersectionRatio >= 0.5 || covered >= 0.5) {
            if (!seen[id]) {
              seen[id] = true;
              track("section_view", { section_id: id, page_path: location.pathname });
            }
            if (!visible[id]) visible[id] = Date.now();
          }
        } else if (visible[id]) {
          timers[id] = (timers[id] || 0) + (Date.now() - visible[id]);
          visible[id] = 0;
        }
      });
    }, { threshold: [0.15, 0.5] });

    document.querySelectorAll("section[id], div.section[id], section, .opportunity-card")
      .forEach(function (s, i) { if (i < 60) io.observe(s); });
  }

  /* ---------- scroll depth ---------- */
  var marks = [25, 50, 75, 90, 100], hit = {};
  function checkScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    if (max <= 0) return;
    var pct = Math.min(100, Math.round(((window.scrollY || doc.scrollTop) / max) * 100));
    marks.forEach(function (m) {
      if (pct >= m && !hit[m]) {
        hit[m] = true;
        track("scroll_depth", { percent_scrolled: m, page_path: location.pathname });
      }
    });
  }
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    setTimeout(function () { checkScroll(); ticking = false; }, 350);
  }, { passive: true });

  /* ---------- active time on page, flushed on exit ---------- */
  var activeMs = 0, lastTick = Date.now(), idle = false, idleTimer;
  function beat() {
    var now = Date.now();
    if (!idle && !document.hidden) activeMs += now - lastTick;
    lastTick = now;
  }
  ["mousemove", "keydown", "scroll", "click", "touchstart"].forEach(function (evt) {
    window.addEventListener(evt, function () {
      beat();
      idle = false;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(function () { beat(); idle = true; }, 30000);
    }, { passive: true });
  });
  document.addEventListener("visibilitychange", beat);

  function flush() {
    beat();
    Object.keys(visible).forEach(function (id) {
      if (visible[id]) { timers[id] = (timers[id] || 0) + (Date.now() - visible[id]); visible[id] = 0; }
    });
    Object.keys(timers).forEach(function (id) {
      var secs = Math.round(timers[id] / 1000);
      if (secs >= 2) track("section_time", { section_id: id, seconds: secs, page_path: location.pathname });
      timers[id] = 0;
    });
    track("page_engagement", {
      seconds: Math.round(activeMs / 1000),
      percent_scrolled: Object.keys(hit).length ? Math.max.apply(null, Object.keys(hit).map(Number)) : 0,
      page_path: location.pathname
    });
    activeMs = 0;
  }
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", function () { if (document.hidden) flush(); });
})();
