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
})();
