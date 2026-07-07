/* ============================================================
   DAF CGOC — Mentorship / Penpal Program
   Standalone page interactivity. Vanilla, no dependencies.
   ============================================================ */
(function () {
  "use strict";

  var docEl = document.documentElement;
  docEl.classList.add("js");

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia("(hover: hover)").matches;

  /* ---------- Config: the ONE seam a real backend replaces ----------
     MVP = mock mode (ENDPOINT empty): validates, logs the payload, shows
     the success state — nothing is sent. To go live, set ENDPOINT (+ any
     key) and the same JSON POST works with Web3Forms / Formspree / Apps
     Script. SWAP BEFORE GOING LIVE. */
  var CONFIG = {
    ENDPOINT: "",                       // "" => mock. e.g. https://api.web3forms.com/submit
    ACCESS_KEY: "",                     // provider public key, if required
    NOTIFY_EMAIL: "penpal@dafcgoc.org"  // PLACEHOLDER — confirm before launch (mailto fallback)
  };

  /* ---------- Reveal on scroll ---------- */
  (function reveals() {
    var els = document.querySelectorAll(".reveal");
    if (!els.length) return;
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    document.querySelectorAll(".reveal[data-stagger]").forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (c, i) {
        c.style.setProperty("--i", i);
      });
    });
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        entry.target.addEventListener("transitionend", function () {
          entry.target.style.willChange = "auto";
        }, { once: true });
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- Scroll progress bar (JS fallback only) ---------- */
  (function progress() {
    var bar = document.querySelector(".scroll-progress");
    if (!bar) return;
    if (reduce) return;
    if (window.CSS && CSS.supports && CSS.supports("animation-timeline: scroll()")) return;
    var ticking = false;
    function update() {
      var h = docEl.scrollHeight - docEl.clientHeight;
      var p = h > 0 ? docEl.scrollTop / h : 0;
      bar.style.transform = "scaleX(" + p + ")";
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  })();

  /* ---------- Pointer micro-interactions ---------- */
  if (!reduce && canHover) {
    document.querySelectorAll(".magnetic").forEach(function (el) {
      var STR = 0.3;
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        requestAnimationFrame(function () {
          el.style.transform = "translate(" + x * STR + "px," + y * STR + "px)";
        });
      });
      el.addEventListener("mouseleave", function () {
        requestAnimationFrame(function () { el.style.transform = ""; });
      });
    });
    document.querySelectorAll(".spotlight").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        requestAnimationFrame(function () {
          el.style.setProperty("--mx", (e.clientX - r.left) + "px");
          el.style.setProperty("--my", (e.clientY - r.top) + "px");
        });
      });
    });
  }

  /* ============================================================
     Intake form
     ============================================================ */
  var form = document.getElementById("intake-form");
  if (!form) return;

  var successPanel = document.getElementById("intake-success");
  var statusEl = document.getElementById("form-status");
  var summaryEl = document.getElementById("error-summary");
  var submitBtn = form.querySelector(".btn-submit");

  var branches = {
    mentee: document.getElementById("fs-mentee"),
    mentor: document.getElementById("fs-mentor")
  };
  var stepEls = form.querySelectorAll(".fstep");

  /* ----- Branching (JS is the source of truth) ----- */
  function setBranch(role) {
    Object.keys(branches).forEach(function (key) {
      var fs = branches[key];
      if (!fs) return;
      var active = key === role;
      fs.hidden = !active;
      fs.querySelectorAll("input, select, textarea").forEach(function (el) {
        el.disabled = !active;
      });
      if (active) refreshGroupsIn(fs);
    });
    document.querySelectorAll(".role-card").forEach(function (card) {
      var input = card.querySelector('input[name="role"]');
      card.classList.toggle("is-selected", !!(input && input.checked));
    });
    updateCommissionConditionals();
    updateSteps();
  }

  /* Conditional commissioning-source fields (AFROTC school / Other) */
  function toggleConditional(wrapId, inputId, show) {
    var wrap = document.getElementById(wrapId);
    var input = document.getElementById(inputId);
    if (!wrap || !input) return;
    wrap.hidden = !show;
    input.disabled = !show;
    if (show) {
      input.setAttribute("required", "");
    } else {
      input.removeAttribute("required");
      input.removeAttribute("aria-invalid");
      input.value = "";
      var err = wrap.querySelector(".field-error");
      if (err) err.textContent = "";
    }
  }
  function updateCommissionConditionals() {
    var menteeActive = branches.mentee && !branches.mentee.hidden;
    var src = document.getElementById("commission-source");
    var val = menteeActive && src ? src.value : "";
    toggleConditional("afrotc-det-field", "afrotc-det", val === "afrotc");
    toggleConditional("other-source-field", "other-source", val === "other");
  }
  var commissionSelect = document.getElementById("commission-source");
  if (commissionSelect) commissionSelect.addEventListener("change", function () {
    updateCommissionConditionals();
    updateSteps();
  });

  form.querySelectorAll('input[name="role"]').forEach(function (r) {
    r.addEventListener("change", function () {
      clearGroupError("role");
      setBranch(r.value);
    });
  });
  // Clear group errors as soon as the user makes a valid selection
  ["matchPref", "menteeCount"].forEach(function (nm) {
    form.querySelectorAll('input[name="' + nm + '"]').forEach(function (r) {
      r.addEventListener("change", function () { clearGroupError(nm); });
    });
  });
  var commitEl = document.getElementById("commit");
  if (commitEl) commitEl.addEventListener("change", function () {
    if (commitEl.checked) clearGroupError("commit");
  });

  /* ----- "choose exactly N / up to N" enforcement ----- */
  function enforceLimit(fieldset) {
    var max = +fieldset.dataset.max;
    var min = +fieldset.dataset.min || 0;
    var boxes = Array.prototype.slice.call(fieldset.querySelectorAll('input[type="checkbox"]'));
    var live = fieldset.querySelector(".field-error");

    function refresh() {
      var checkedCount = boxes.filter(function (b) { return b.checked; }).length;
      var atMax = checkedCount >= max;
      boxes.forEach(function (b) {
        if (!b.checked) { b.setAttribute("aria-disabled", String(atMax)); }
        else { b.removeAttribute("aria-disabled"); }
        var row = b.closest(".check");
        if (row) row.classList.toggle("is-locked", !b.checked && atMax);
      });
      if (live && live.dataset.sticky === "1" && checkedCount >= min && checkedCount <= max) {
        setGroupError(fieldset.id, "");
      }
      if (live && live.dataset.sticky !== "1") {
        live.textContent = atMax
          ? "That's " + max + ". Uncheck one to change your choice."
          : "";
      }
      updateSteps();
    }
    boxes.forEach(function (b) {
      b.addEventListener("click", function (e) {
        if (b.getAttribute("aria-disabled") === "true" && b.checked) { e.preventDefault(); }
      });
    });
    fieldset.addEventListener("change", refresh);
    fieldset._refresh = refresh;
    fieldset._count = function () { return boxes.filter(function (b) { return b.checked; }).length; };
    fieldset._validate = function () {
      var n = fieldset._count();
      if (n < min) return min === max
        ? "Please choose exactly " + min + "."
        : "Please choose at least " + min + ".";
      if (n > max) return "Please choose no more than " + max + ".";
      return "";
    };
    refresh();
  }
  ["goals", "mentoring"].forEach(function (id) {
    var fs = document.getElementById(id);
    if (fs) enforceLimit(fs);
  });
  function refreshGroupsIn(branch) {
    branch.querySelectorAll("[data-max]").forEach(function (fs) {
      if (typeof fs._refresh === "function") fs._refresh();
    });
  }

  /* ----- Validation helpers ----- */
  function labelFor(el) {
    var lab = el.id && form.querySelector('label[for="' + el.id + '"]');
    if (lab) return lab.textContent.replace(/\*/g, "").trim();
    var wrapLegend = el.closest("fieldset") && el.closest("fieldset").querySelector("legend");
    return wrapLegend ? wrapLegend.textContent.replace(/\*/g, "").trim() : el.name;
  }
  function friendly(el) {
    if (el.validity.valueMissing) {
      return el.type === "checkbox" ? "This box must be checked." : "This field is required.";
    }
    if (el.validity.typeMismatch && el.type === "email") {
      return "Enter a valid email, e.g. name@us.af.mil";
    }
    return el.validationMessage || "Please check this field.";
  }
  function errorElFor(el) {
    var byName = document.getElementById(el.name + "-error");
    if (byName) return byName;
    var wrap = el.closest(".field");
    if (!wrap) return null;
    var e = wrap.querySelector(".field-error");
    if (!e) {
      e = document.createElement("p");
      e.className = "field-error";
      e.id = (el.id || el.name) + "-error";
      e.setAttribute("aria-live", "polite");
      wrap.appendChild(e);
    }
    return e;
  }
  function setFieldError(el, msg) {
    var e = errorElFor(el);
    if (!e) return;
    if (msg) {
      el.setAttribute("aria-invalid", "true");
      var d = (el.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
      if (d.indexOf(e.id) === -1) { d.push(e.id); el.setAttribute("aria-describedby", d.join(" ")); }
      e.dataset.sticky = "1";
      e.textContent = msg;
    } else {
      el.removeAttribute("aria-invalid");
      e.dataset.sticky = "";
      e.textContent = "";
    }
  }
  function setGroupError(name, msg) {
    var e = document.getElementById(name + "-error");
    if (e) { e.dataset.sticky = msg ? "1" : ""; e.textContent = msg || ""; }
    var inputName = name === "commit" ? "commitment" : name;
    form.querySelectorAll('input[name="' + inputName + '"]').forEach(function (inp) {
      if (msg) {
        inp.setAttribute("aria-invalid", "true");
        if (e) {
          var d = (inp.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
          if (d.indexOf(e.id) === -1) { d.push(e.id); inp.setAttribute("aria-describedby", d.join(" ")); }
        }
      } else {
        inp.removeAttribute("aria-invalid");
      }
    });
  }
  function clearGroupError(name) { setGroupError(name, ""); }

  function validateField(el) {
    if (el.disabled || el.type === "radio" || el.type === "checkbox" || el.name === "botcheck") return true;
    var ok = el.checkValidity();
    setFieldError(el, ok ? "" : friendly(el));
    return ok;
  }

  function radioGroupChecked(name) {
    return !!form.querySelector('input[name="' + name + '"]:checked');
  }

  /* ----- On-blur validation for text fields ----- */
  form.addEventListener("blur", function (e) {
    var t = e.target;
    if (t.matches && t.matches("input, textarea, select")) validateField(t);
  }, true);
  form.addEventListener("change", function (e) {
    var t = e.target;
    if (t.matches && t.matches("select")) validateField(t);
  });
  form.addEventListener("input", function (e) {
    var t = e.target;
    if (t.matches && t.matches('[aria-invalid="true"]')) validateField(t);
    updateSteps();
  });

  /* ----- Error summary ----- */
  function showSummary(errors) {
    summaryEl.textContent = "";
    var h = document.createElement("h2");
    h.textContent = "There is a problem";
    summaryEl.appendChild(h);
    var ul = document.createElement("ul");
    errors.forEach(function (x) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#" + x.focusId;
      a.textContent = x.label + ": " + x.msg;
      a.addEventListener("click", function (ev) {
        ev.preventDefault();
        var target = document.getElementById(x.focusId);
        if (target) { target.focus(); target.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" }); }
      });
      li.appendChild(a);
      ul.appendChild(li);
    });
    summaryEl.appendChild(ul);
    summaryEl.hidden = false;
    if (!/^Error: /.test(document.title)) document.title = "Error: " + document.title;
    summaryEl.focus();
  }
  function hideSummary() {
    summaryEl.hidden = true;
    summaryEl.textContent = "";
    document.title = document.title.replace(/^Error: /, "");
  }

  /* ----- Collect all errors ----- */
  function collectErrors() {
    var errors = [];
    function push(focusId, label, msg) { errors.push({ focusId: focusId, label: label, msg: msg }); }

    // native text / email / textarea
    form.querySelectorAll("input, textarea, select").forEach(function (el) {
      if (el.disabled || el.type === "radio" || el.type === "checkbox" || el.name === "botcheck") return;
      if (!validateField(el)) push(el.id, labelFor(el), friendly(el));
    });

    // role (required)
    if (!radioGroupChecked("role")) {
      setGroupError("role", "Please choose Mentee or Mentor.");
      push("role-mentee", "Sign up as", "Please choose Mentee or Mentor.");
    } else {
      clearGroupError("role");
    }

    var role = (form.querySelector('input[name="role"]:checked') || {}).value;

    if (role === "mentee") {
      var goals = document.getElementById("goals");
      var gm = goals._validate();
      setGroupError("goals", gm);
      if (gm) push(goals.querySelector("input").id || "goals", "Top goals", gm);
      if (!radioGroupChecked("matchPref")) {
        setGroupError("matchPref", "Please choose a matching preference.");
        push(form.querySelector('input[name="matchPref"]').id, "Matching preference", "Please choose one.");
      } else { clearGroupError("matchPref"); }
    }

    if (role === "mentor") {
      var mentoring = document.getElementById("mentoring");
      var mm = mentoring._validate();
      setGroupError("mentoring", mm);
      if (mm) push(mentoring.querySelector("input").id || "mentoring", "Mentoring areas", mm);
      if (!radioGroupChecked("menteeCount")) {
        setGroupError("menteeCount", "Please choose how many mentees you can take.");
        push(form.querySelector('input[name="menteeCount"]').id, "How many mentees", "Please choose one.");
      } else { clearGroupError("menteeCount"); }
    }

    // commitment
    var commit = document.getElementById("commit");
    if (!commit.checked) {
      setGroupError("commit", "You must agree to the check-in commitment.");
      push("commit", "Commitment", "Please agree to continue.");
    } else { clearGroupError("commit"); }

    return errors;
  }

  /* ----- Payload + submit seam ----- */
  function buildPayload() {
    var fd = new FormData(form); // disabled (hidden-branch) fields auto-excluded
    var role = fd.get("role");
    return {
      schemaVersion: 1,
      program: "DAF CGOC Mentorship",
      role: role,
      name: { rank: fd.get("rank") || "", first: fd.get("firstName"), last: fd.get("lastName") },
      email: fd.get("email"),
      mentee: role === "mentee" ? {
        commissioningSource: fd.get("commissionSource"),
        afrotcDetachment: fd.get("afrotcDetachment") || "",
        otherSource: fd.get("otherSource") || "",
        commissioningDateExpected: fd.get("commissionDateExpected"),
        afsc: fd.get("menteeAfsc"),
        firstDutyLocation: fd.get("menteeDuty"),
        goals: fd.getAll("goals"),
        matchPreference: fd.get("matchPref")
      } : null,
      mentor: role === "mentor" ? {
        rankTimeInService: fd.get("rankTis"),
        afscTitle: fd.get("mentorAfsc"),
        dutyLocation: fd.get("mentorDuty"),
        commissioningDateActual: fd.get("commissionDateActual"),
        experiences: fd.get("experiences"),
        mentoringAreas: fd.getAll("mentoring"),
        menteeCapacity: fd.get("menteeCount")
      } : null,
      ask: fd.get("ask") || "",
      commitment: fd.get("commitment") === "on"
    };
  }

  async function submitIntake(payload) {
    if (!CONFIG.ENDPOINT) {                       // MOCK mode (MVP)
      await new Promise(function (r) { setTimeout(r, 850); });
      console.log("[penpal mock submitIntake] would send:", payload);
      try { localStorage.setItem("penpal:lastIntake", JSON.stringify(payload)); } catch (e) {}
      return { ok: true, mock: true };
    }
    var body = CONFIG.ACCESS_KEY
      ? Object.assign({ access_key: CONFIG.ACCESS_KEY, subject: "New DAF CGOC mentorship intake" }, payload)
      : payload;
    var res = await fetch(CONFIG.ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error("bad status " + res.status);
    return res.json();
  }

  function mailtoFallback(p) {
    var subject = encodeURIComponent("DAF CGOC mentorship intake — " + p.name.first + " " + p.name.last + " (" + p.role + ")");
    var body = encodeURIComponent(JSON.stringify(p, null, 2));
    window.location.href = "mailto:" + CONFIG.NOTIFY_EMAIL + "?subject=" + subject + "&body=" + body;
  }

  /* ----- Submit handler ----- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // honeypot: silently accept bots without recording
    var hp = form.querySelector('input[name="botcheck"]');
    if (hp && hp.value) { showSuccess(); return; }

    var errors = collectErrors();
    if (errors.length) { showSummary(errors); return; }
    hideSummary();

    var payload = buildPayload();
    submitBtn.disabled = true;
    submitBtn.classList.add("is-loading");
    statusEl.textContent = "Submitting your intake…";
    statusEl.classList.remove("is-success");

    submitIntake(payload).then(function () {
      showSuccess();
    }).catch(function () {
      statusEl.textContent = "Couldn't reach the server — opening your email app as a fallback…";
      mailtoFallback(payload);
      submitBtn.disabled = false;
      submitBtn.classList.remove("is-loading");
    });
  });

  /* ----- Success / reset ----- */
  function showSuccess() {
    form.hidden = true;
    successPanel.hidden = false;
    var heading = successPanel.querySelector("h3");
    if (heading) { heading.setAttribute("tabindex", "-1"); heading.focus(); }
    var check = successPanel.querySelector(".success-check");
    if (check) { check.classList.remove("play"); void check.offsetWidth; check.classList.add("play"); }
    successPanel.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  }

  var againBtn = document.getElementById("intake-again");
  if (againBtn) {
    againBtn.addEventListener("click", function () {
      form.reset();
      hideSummary();
      form.querySelectorAll('[aria-invalid="true"]').forEach(function (el) { el.removeAttribute("aria-invalid"); });
      form.querySelectorAll(".field-error").forEach(function (el) { el.textContent = ""; el.dataset.sticky = ""; });
      setBranch(null);
      statusEl.textContent = "";
      statusEl.classList.remove("is-success");
      submitBtn.disabled = false;
      submitBtn.classList.remove("is-loading");
      successPanel.hidden = true;
      form.hidden = false;
      var first = document.getElementById("first");
      if (first) first.focus();
    });
  }

  /* ----- Form step indicator (cosmetic) ----- */
  function textValid(id) { var el = document.getElementById(id); return el && el.value.trim() && el.checkValidity(); }
  function branchComplete() {
    var role = (form.querySelector('input[name="role"]:checked') || {}).value;
    if (!role) return false;
    var fs = branches[role];
    if (!fs) return false;
    var ok = true;
    fs.querySelectorAll("input, textarea, select").forEach(function (el) {
      if (el.disabled || el.type === "checkbox" || el.type === "radio") return;
      if (!el.checkValidity()) ok = false;
    });
    if (role === "mentee") {
      if (document.getElementById("goals")._count() !== 2) ok = false;
      if (!radioGroupChecked("matchPref")) ok = false;
    } else {
      var mc = document.getElementById("mentoring")._count();
      if (mc < 1 || mc > 3) ok = false;
      if (!radioGroupChecked("menteeCount")) ok = false;
    }
    return ok;
  }
  function updateSteps() {
    if (!stepEls || !stepEls.length) return;
    var commit = document.getElementById("commit");
    var s1 = textValid("first") && textValid("last") && textValid("email");
    var s2 = radioGroupChecked("role") && branchComplete();
    var s3 = commit && commit.checked;
    var state = [
      s1 ? "done" : "current",
      s2 ? "done" : (s1 ? "current" : ""),
      s3 ? "done" : (s2 ? "current" : "")
    ];
    stepEls.forEach(function (el, i) {
      el.classList.remove("is-current", "is-done");
      if (state[i] === "done") el.classList.add("is-done");
      else if (state[i] === "current") el.classList.add("is-current");
    });
  }

  /* ----- Hero audience toggle (cadet vs mentor) ----- */
  (function audience() {
    var group = document.getElementById("audience");
    if (!group) return;
    var panels = document.querySelectorAll(".hero-swap__panel");
    function apply(aud) {
      docEl.setAttribute("data-audience", aud);
      panels.forEach(function (p) {
        var on = p.getAttribute("data-audience") === aud;
        p.classList.toggle("is-active", on);
        if (on) p.removeAttribute("inert");
        else p.setAttribute("inert", "");
      });
    }
    group.addEventListener("change", function (e) {
      if (e.target.name === "audience") apply(e.target.value);
    });
    var checked = group.querySelector('input[name="audience"]:checked');
    apply(checked ? checked.value : "cadet");
    // Hero CTA pre-selects the matching role in the intake form
    document.querySelectorAll(".hero__cta [data-role]").forEach(function (a) {
      a.addEventListener("click", function () {
        var role = a.getAttribute("data-role");
        var radio = document.getElementById(role === "mentor" ? "role-mentor" : "role-mentee");
        if (radio && !radio.checked) { radio.checked = true; clearGroupError("role"); setBranch(role); }
      });
    });
  })();

  // initial state (handles bfcache-restored radios)
  var pre = form.querySelector('input[name="role"]:checked');
  setBranch(pre ? pre.value : null);
})();
