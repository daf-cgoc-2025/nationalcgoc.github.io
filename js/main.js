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
  /* Adjust Primary Navigation Background Opacity
  /* ---------------------------------------------------- */
  window.addEventListener("scroll", function () {
    const header = document.getElementById("main-header");
    if (!header) return;
    const h = header.offsetHeight;
    const y = window.scrollY;

    if (y > h + 30) {
      header.classList.add("opaque");
    } else {
      header.classList.remove("opaque");
    }
  });

  /* ---------------------------------------------------- */
  /* Mobile Menu
  /* ---------------------------------------------------- */
  const navWrap = document.querySelector("nav#nav-wrap");
  const nav = document.querySelector("ul#nav");

  if (navWrap && nav) {
    // Remove the static mobile-btn links
    navWrap.querySelectorAll("a.mobile-btn").forEach(function (btn) {
      btn.remove();
    });

    // Create toggle button
    const toggleBtn = document.createElement("a");
    toggleBtn.id = "toggle-btn";
    toggleBtn.href = "#";
    toggleBtn.title = "Menu";
    toggleBtn.innerHTML = '<span class="menu-icon">Menu</span>';
    navWrap.prepend(toggleBtn);

    // Toggle nav visibility
    toggleBtn.addEventListener("click", function (e) {
      e.preventDefault();
      if (nav.style.display === "block") {
        nav.style.display = "none";
      } else {
        nav.style.display = "block";
      }
    });

    // Handle mobile class
    function checkMobile() {
      if (window.getComputedStyle(toggleBtn).display !== "none") {
        nav.classList.add("mobile");
      } else {
        nav.classList.remove("mobile");
        nav.style.display = "";
      }
    }
    checkMobile();
    window.addEventListener("resize", checkMobile);

    // Handle nav link clicks
    nav.addEventListener("click", function (e) {
      const link = e.target.closest("a");
      if (!link) return;

      if (nav.classList.contains("mobile")) {
        const parent = link.parentElement;
        if (
          (parent.classList.contains("dropdown") || parent.classList.contains("dropdown-current")) &&
          link.classList.contains("top-level")
        ) {
          e.preventDefault();
          parent.classList.toggle("open");
          const dropdownContent = parent.querySelector(".dropdown-content");
          if (dropdownContent) {
            dropdownContent.style.display =
              dropdownContent.style.display === "block" ? "none" : "block";
          }
          return;
        }
        nav.style.display = "none";
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
