/*---------------------------------------------------------------------------------
 * Main JS - Vanilla (no jQuery)
 *---------------------------------------------------------------------------------*/

(function () {
  "use strict";

  /* ---------------------------------------------------- */
  /* Preloader
  /* ---------------------------------------------------- */
  window.addEventListener("load", function () {
    const loader = document.getElementById("loader");
    const preloader = document.getElementById("preloader");

    if (loader) {
      loader.style.transition = "opacity 0.5s";
      loader.style.opacity = "0";
      setTimeout(function () {
        if (preloader) {
          preloader.style.transition = "opacity 0.5s";
          preloader.style.opacity = "0";
          setTimeout(function () {
            preloader.style.display = "none";
          }, 500);
        }
      }, 300);
    }
  });

  /* ---------------------------------------------------- */
  /* Header opacity toggle on scroll (RAF-throttled)
  /* ---------------------------------------------------- */
  (function () {
    const header = document.getElementById("main-header");
    if (!header) return;
    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        const threshold = header.offsetHeight + 30;
        if (window.scrollY > threshold) {
          header.classList.add("opaque");
        } else {
          header.classList.remove("opaque");
        }
        ticking = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  })();

  /* ---------------------------------------------------- */
  /* Primary navigation: ARIA, dropdown, mobile menu
  /* ---------------------------------------------------- */
  const navWrap = document.querySelector("nav#nav-wrap");
  const nav = document.querySelector("ul#nav");

  if (navWrap && nav) {
    // Landmark label for screen readers
    if (!navWrap.hasAttribute("aria-label")) {
      navWrap.setAttribute("aria-label", "Primary");
    }
    // Mark current page on the link whose href matches location (best-effort).
    // Falls back gracefully if no match — existing .current class still styles it.
    (function markCurrent() {
      const here = location.pathname.replace(/\/index\.html$/, "/");
      nav.querySelectorAll("a[href]").forEach(function (a) {
        const href = a.getAttribute("href");
        if (!href || href === "#") return;
        try {
          const url = new URL(a.href, location.href);
          const target = url.pathname.replace(/\/index\.html$/, "/");
          if (target === here) a.setAttribute("aria-current", "page");
        } catch (_) { /* ignore */ }
      });
      // Mirror .current class to aria-current for legacy markup
      nav.querySelectorAll("li.current > a, li.dropdown-current > a").forEach(function (a) {
        if (!a.hasAttribute("aria-current")) a.setAttribute("aria-current", "page");
      });
    })();

    /* --- Replace static mobile-btn anchors with one accessible toggle --- */
    navWrap.querySelectorAll("a.mobile-btn").forEach(function (btn) { btn.remove(); });

    const toggleBtn = document.createElement("a");
    toggleBtn.id = "toggle-btn";
    toggleBtn.href = "#";
    toggleBtn.setAttribute("role", "button");
    toggleBtn.setAttribute("aria-label", "Toggle navigation menu");
    toggleBtn.setAttribute("aria-expanded", "false");
    toggleBtn.setAttribute("aria-controls", "nav");
    toggleBtn.innerHTML = '<span class="menu-icon" aria-hidden="true">Menu</span>';
    navWrap.prepend(toggleBtn);

    // Activate via Space as well as Enter (anchor with role=button)
    toggleBtn.addEventListener("keydown", function (e) {
      if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        toggleBtn.click();
      } else if (e.key === "Escape" && nav.classList.contains("is-open")) {
        e.preventDefault();
        setMobileMenu(false);
        toggleBtn.focus();
      }
    });

    function isMobile() {
      return window.getComputedStyle(toggleBtn).display !== "none";
    }

    function setMobileMenu(open) {
      if (open) {
        nav.classList.add("is-open");
        toggleBtn.setAttribute("aria-expanded", "true");
      } else {
        nav.classList.remove("is-open");
        toggleBtn.setAttribute("aria-expanded", "false");
        // Also collapse any open submenus
        nav.querySelectorAll(".dropdown.is-open, .dropdown > a[aria-expanded='true']").forEach(function (el) {
          el.classList.remove("is-open");
          if (el.tagName === "A") el.setAttribute("aria-expanded", "false");
        });
        nav.querySelectorAll(".dropdown > a[aria-expanded='true']").forEach(function (a) {
          a.setAttribute("aria-expanded", "false");
        });
      }
    }

    toggleBtn.addEventListener("click", function (e) {
      e.preventDefault();
      setMobileMenu(!nav.classList.contains("is-open"));
    });

    function syncForViewport() {
      if (isMobile()) {
        nav.classList.add("mobile");
      } else {
        nav.classList.remove("mobile");
        setMobileMenu(false);
      }
    }
    syncForViewport();
    window.addEventListener("resize", syncForViewport);

    /* --- Dropdown (Partners) accessibility --- */
    nav.querySelectorAll("li.dropdown, li.dropdown-current").forEach(function (li) {
      const trigger = li.querySelector("a.top-level");
      const panel = li.querySelector(".dropdown-content");
      if (!trigger || !panel) return;

      // Give the panel an id for aria-controls
      if (!panel.id) panel.id = "submenu-" + Math.random().toString(36).slice(2, 8);

      trigger.setAttribute("role", "button");
      trigger.setAttribute("aria-haspopup", "true");
      trigger.setAttribute("aria-expanded", "false");
      trigger.setAttribute("aria-controls", panel.id);

      function open() {
        trigger.setAttribute("aria-expanded", "true");
        li.classList.add("is-open");
      }
      function close() {
        trigger.setAttribute("aria-expanded", "false");
        li.classList.remove("is-open");
      }
      function toggle() {
        if (trigger.getAttribute("aria-expanded") === "true") close();
        else open();
      }

      // Click toggles (covers both touch and mouse). Prevent default since href="#".
      trigger.addEventListener("click", function (e) {
        e.preventDefault();
        toggle();
      });

      // Keyboard: Enter/Space toggles; ArrowDown opens and moves to first item;
      // Escape closes and returns focus to trigger.
      trigger.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          toggle();
          if (trigger.getAttribute("aria-expanded") === "true") {
            const first = panel.querySelector("a");
            if (first) first.focus();
          }
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          open();
          const first = panel.querySelector("a");
          if (first) first.focus();
        } else if (e.key === "Escape") {
          close();
        }
      });

      // Inside the panel: Esc returns to trigger; ArrowDown/Up move between items
      panel.addEventListener("keydown", function (e) {
        const items = Array.from(panel.querySelectorAll("a"));
        const idx = items.indexOf(document.activeElement);
        if (e.key === "Escape") {
          e.preventDefault();
          close();
          trigger.focus();
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          const next = items[(idx + 1) % items.length];
          if (next) next.focus();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          const prev = items[(idx - 1 + items.length) % items.length];
          if (prev) prev.focus();
        } else if (e.key === "Tab") {
          // Closing on Tab-out of the submenu lets focus continue naturally
          setTimeout(function () {
            if (!li.contains(document.activeElement)) close();
          }, 0);
        }
      });

      // Click outside closes
      document.addEventListener("click", function (e) {
        if (!li.contains(e.target)) close();
      });
    });

    /* --- Nav link click handling on mobile: close menu after navigation --- */
    nav.addEventListener("click", function (e) {
      const link = e.target.closest("a");
      if (!link) return;

      // Don't close on dropdown trigger (handled above)
      if (link.classList.contains("top-level")) return;

      if (nav.classList.contains("mobile")) {
        // Allow navigation to proceed, then close the panel
        setMobileMenu(false);
      }
    });
  }

  /* ---------------------------------------------------- */
  /* Modal Popup (inline modals for home page portfolio)
  /* ---------------------------------------------------- */
  document.querySelectorAll(".item-wrap a").forEach(function (trigger) {
    trigger.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href");
      const modal = document.querySelector(targetId);
      if (!modal) return;

      // Create overlay
      const overlay = document.createElement("div");
      overlay.className = "mfp-bg mfp-fade";
      overlay.style.cssText =
        "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:1042;opacity:0;transition:opacity 0.3s";
      document.body.appendChild(overlay);
      requestAnimationFrame(function () {
        overlay.style.opacity = "1";
      });

      // Create wrapper
      const wrapper = document.createElement("div");
      wrapper.className = "mfp-wrap";
      wrapper.style.cssText =
        "position:fixed;top:0;left:0;width:100%;height:100%;z-index:1043;overflow-y:auto;display:flex;align-items:center;justify-content:center;padding:20px";

      // Clone and show modal content
      const content = modal.cloneNode(true);
      content.classList.remove("mfp-hide");
      content.style.cssText =
        "max-width:700px;width:100%;background:#111;border-radius:8px;overflow:hidden;position:relative";

      // Add close button
      const closeBtn = document.createElement("button");
      closeBtn.className = "popup-modal-dismiss";
      closeBtn.style.cssText =
        "position:absolute;top:10px;right:15px;background:none;border:none;color:#fff;font-size:28px;cursor:pointer;z-index:10;line-height:1";
      closeBtn.innerHTML = "&times;";
      content.appendChild(closeBtn);

      wrapper.appendChild(content);
      document.body.appendChild(wrapper);
      document.body.style.overflow = "hidden";

      function closeModal() {
        overlay.style.opacity = "0";
        setTimeout(function () {
          overlay.remove();
          wrapper.remove();
          document.body.style.overflow = "";
        }, 300);
      }

      overlay.addEventListener("click", closeModal);
      closeBtn.addEventListener("click", function (e) {
        e.preventDefault();
        closeModal();
      });
      wrapper.addEventListener("click", function (e) {
        if (e.target === wrapper) closeModal();
      });
    });
  });
})();
