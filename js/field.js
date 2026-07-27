/* ============================================================
   Cody Heart — home page behaviour

   Anything marked .reveal fades in as it enters view. Degrades
   to "everything is simply visible" when IntersectionObserver is
   missing or motion is reduced. (The header needs no JS now: it
   is a transparent absolute bar, and the floating pill nav is
   pure CSS.)
   ============================================================ */
(function () {
  'use strict';

  (function reveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });

    items.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- Chicago clock ----------
     The footer signs off with home time. Period separators, not
     colons — the Geograph trial cut carries digits and . but no : */
  (function clock() {
    var el = document.getElementById('footer-clock');
    if (!el) return;
    function tick() {
      var t = new Date().toLocaleTimeString('en-GB', {
        timeZone: 'America/Chicago', hour12: false
      });
      el.textContent = t.replace(/:/g, '.');
    }
    tick();
    setInterval(tick, 1000);
  })();

  /* ---------- Inertial scroll ----------
     The Lenis-style glide: wheel input feeds a target position and
     a rAF loop eases the real scroll toward it, so the page keeps
     drifting briefly after the wheel stops. Wheel-and-mouse only —
     touch scrolling already has native inertia and hijacking it
     always feels worse — and reduced-motion gets native scroll. */
  (function inertialScroll() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    var EASE = 0.09; // per-frame catch-up fraction: lower = floatier
    var target = window.scrollY;
    var current = target;
    var raf = null;

    function maxScroll() {
      return document.documentElement.scrollHeight - window.innerHeight;
    }

    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey) return; // pinch-zoom gesture
      e.preventDefault();
      var delta = e.deltaY * (e.deltaMode === 1 ? 16 : 1); // lines -> px
      target = Math.max(0, Math.min(target + delta, maxScroll()));
      if (raf === null) loop();
    }, { passive: false });

    function loop() {
      raf = requestAnimationFrame(function () {
        current += (target - current) * EASE;
        if (Math.abs(target - current) < 0.5) {
          current = target;
          window.scrollTo({ top: current, behavior: 'instant' });
          raf = null;
          return;
        }
        // 'instant', not default: html has scroll-behavior smooth, and
        // letting it animate each step would double-ease into mush.
        window.scrollTo({ top: current, behavior: 'instant' });
        loop();
      });
    }

    // Scrollbar drags, keyboard paging, anchors: while we are not
    // animating, adopt whatever position the browser moved to.
    window.addEventListener('scroll', function () {
      if (raf === null) target = current = window.scrollY;
    }, { passive: true });
  })();

  /* ---------- Diagram reveal ----------
     Anything marked [data-diagram-reveal] gets .is-in on entry; the
     CSS does the drawing (stroke-dashoffset on lines, fades on the
     marks). Same fail-open behaviour as .reveal. */
  (function diagrams() {
    var els = document.querySelectorAll('[data-diagram-reveal]');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(els, function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.25 });
    Array.prototype.forEach.call(els, function (el) { io.observe(el); });
  })();

  /* ---------- Reading progress ----------
     A terracotta hairline across the top of any long page. Injected
     rather than marked up, so no page has to carry the element. */
  (function progress() {
    if (!document.querySelector('main.cs, .about-band')) return;

    var bar = document.createElement('div');
    bar.className = 'cs-progress';
    document.body.appendChild(bar);

    var ticking = false;
    function update() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.setProperty('--p', p);
      ticking = false;
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
  })();
})();

/* ============================================================
   ACCESS — one password for the whole site.

   Session-only: closing the tab re-locks. This keeps casual
   readers out of NDA material; it is NOT security, because the
   gated HTML still ships to anyone who views source. For real
   protection put these pages behind server auth (Netlify password
   protection, Cloudflare Access, and so on).
   ============================================================ */
window.CH_AUTH = (function () {
  'use strict';

  var PASSWORD = 'cnh2027';
  var STORAGE_KEY = 'ch_unlock_session';
  // Legacy keys from earlier versions, swept on every load so no
  // stale long-lived unlock can linger.
  var LEGACY_KEYS = ['ch_work_unlocked', 'ch_work_unlocked_v2', 'ch_unlock_v3'];

  try {
    LEGACY_KEYS.forEach(function (k) {
      sessionStorage.removeItem(k);
      localStorage.removeItem(k);
    });
  } catch (e) { /* private mode */ }

  // ?lock force-clears the current unlock, for testing.
  try {
    if (new URLSearchParams(window.location.search).has('lock')) {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) { /* ignore */ }

  function isUnlocked() {
    try { return sessionStorage.getItem(STORAGE_KEY) === '1'; }
    catch (e) { return false; }
  }
  function unlock(pw) {
    if (pw !== PASSWORD) return false;
    try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (e) { /* ignore */ }
    return true;
  }
  function lock() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      LEGACY_KEYS.forEach(function (k) {
        sessionStorage.removeItem(k);
        localStorage.removeItem(k);
      });
    } catch (e) { /* ignore */ }
  }

  return { isUnlocked: isUnlocked, unlock: unlock, lock: lock };
})();

/* ---------- The gate ----------
   Gated material lives in .cs-details, which CSS hides by default,
   so a JS failure fails CLOSED and the NDA material never flashes. */
(function gate() {
  'use strict';

  var gates = document.querySelectorAll('[data-screens-gate]');

  function applyUnlocked() {
    document.body.classList.add('cs-unlocked');
    Array.prototype.forEach.call(gates, function (g) { g.classList.add('is-unlocked'); });
  }

  if (window.CH_AUTH.isUnlocked()) applyUnlocked();
  if (!gates.length) return;

  Array.prototype.forEach.call(gates, function (g) {
    var form = g.querySelector('.screens-gate__form');
    var input = g.querySelector('.screens-gate__input');
    var err = g.querySelector('.screens-gate__error');
    if (!form || !input) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (window.CH_AUTH.unlock(input.value.trim())) {
        if (err) err.classList.remove('is-visible');
        applyUnlocked();
        // Drop the reader straight into what they just unlocked.
        var details = document.querySelector('.cs-details');
        if (details) {
          requestAnimationFrame(function () {
            details.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        }
      } else {
        if (err) err.classList.add('is-visible');
        input.value = '';
        input.focus();
      }
    });
  });
})();
