/* ============================================================
   site.js — nav, menus, carousel, scrollspy, highlights, gate.
   Everything fails closed: no JS still leaves a readable page
   (dropdowns become plain links via the mobile menu, gated
   material stays hidden).
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Nav: hide on scroll down, show on scroll up ---------- */
  (function navScroll() {
    var nav = document.querySelector('.nav');
    if (!nav) return;
    var title = nav.querySelector('.nav__scrolltitle');
    var last = 0;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (y < 60 || y < last) nav.classList.remove('is-hidden');
      else if (y > last + 5) nav.classList.add('is-hidden');
      last = y;
      if (title) title.classList.toggle('is-visible', y > 200);
    }, { passive: true });
    if (title) {
      title.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    }
  })();

  /* ---------- Dropdowns (Work, Contact) ---------- */
  (function dropdowns() {
    var drops = document.querySelectorAll('.nav__drop');
    if (!drops.length) return;

    Array.prototype.forEach.call(drops, function (drop) {
      var btn = drop.querySelector('button');
      var menu = drop.querySelector('.nav__menu');
      if (!btn || !menu) return;
      var closeTimer;

      function open() {
        clearTimeout(closeTimer);
        // Only one dropdown open at a time
        document.querySelectorAll('.nav__menu.is-open').forEach(function (m) {
          if (m !== menu) close.call({ menu: m });
        });
        menu.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        menu.setAttribute('aria-hidden', 'false');
      }
      function close() {
        var m = this && this.menu ? this.menu : menu;
        var b = m.parentElement.querySelector('button');
        m.classList.remove('is-open');
        if (b) b.setAttribute('aria-expanded', 'false');
        m.setAttribute('aria-hidden', 'true');
      }
      function delayedClose() {
        clearTimeout(closeTimer);
        closeTimer = setTimeout(close, 100);
      }

      btn.addEventListener('click', function () {
        menu.classList.contains('is-open') ? close() : open();
      });
      drop.addEventListener('mouseenter', function () {
        if (window.matchMedia('(hover: hover)').matches) open();
      });
      drop.addEventListener('mouseleave', function () {
        if (window.matchMedia('(hover: hover)').matches) delayedClose();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && menu.classList.contains('is-open')) { close(); btn.focus(); }
      });
      document.addEventListener('mousedown', function (e) {
        if (menu.classList.contains('is-open') && !drop.contains(e.target)) close();
      });
      window.addEventListener('scroll', function () {
        if (menu.classList.contains('is-open')) close();
      }, { passive: true });
    });
  })();

  /* ---------- Mobile menu ---------- */
  (function mobileMenu() {
    var burger = document.querySelector('.nav__burger');
    var menu = document.querySelector('.mobile-menu');
    if (!burger || !menu) return;

    function set(openState) {
      menu.classList.toggle('is-open', openState);
      burger.setAttribute('aria-expanded', String(openState));
      burger.setAttribute('aria-label', openState ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('menu-locked', openState);
    }
    burger.addEventListener('click', function () {
      set(!menu.classList.contains('is-open'));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) { set(false); burger.focus(); }
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) set(false);
    });
  })();

  /* ---------- Highlight wipe on view ---------- */
  (function highlights() {
    var marks = document.querySelectorAll('.highlight');
    if (!marks.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(marks, function (m) { m.classList.add('is-on'); });
      return;
    }
    var seen = 0;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);
        setTimeout(function () { el.classList.add('is-on'); }, 350 + (seen++ % 3) * 150);
      });
    }, { threshold: .6 });
    Array.prototype.forEach.call(marks, function (m) { io.observe(m); });
  })();

  /* ---------- Diagram reveal ---------- */
  (function diagrams() {
    var figs = document.querySelectorAll('[data-diagram-reveal]');
    if (!figs.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(figs, function (f) { f.classList.add('is-revealed'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: .35 });
    Array.prototype.forEach.call(figs, function (f) { io.observe(f); });
  })();

  /* ---------- Carousel: drag to scroll ---------- */
  (function carousel() {
    var el = document.querySelector('.carousel');
    if (!el) return;
    var down = false, startX = 0, startLeft = 0, moved = false;

    el.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return; // touch scrolls natively
      down = true; moved = false;
      startX = e.clientX;
      startLeft = el.scrollLeft;
      el.classList.add('is-dragging');
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      el.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', function () {
      down = false;
      el.classList.remove('is-dragging');
    });
    // Swallow the click that ends a drag so plates don't navigate
    el.addEventListener('click', function (e) {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
    }, true);
  })();

  /* ---------- TOC scrollspy ---------- */
  (function toc() {
    var rail = document.querySelector('.toc');
    if (!rail) return;
    var links = rail.querySelectorAll('a[href^="#"]');
    var thumb = rail.querySelector('.toc__thumb');
    if (!links.length) return;

    var sections = Array.prototype.map.call(links, function (a) {
      return document.getElementById(a.getAttribute('href').slice(1));
    });

    function update() {
      var pos = window.scrollY + 160;
      var idx = 0;
      sections.forEach(function (s, i) {
        if (s && s.offsetTop <= pos) idx = i;
      });
      Array.prototype.forEach.call(links, function (a, i) {
        a.classList.toggle('is-active', i === idx);
      });
      if (thumb) {
        var link = links[idx];
        thumb.style.transform = 'translateY(' + link.offsetTop + 'px)';
        thumb.style.height = link.offsetHeight + 'px';
      }
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  })();

  /* ============================================================
     ACCESS — one password for the whole site. Session-only:
     closing the tab re-locks. Keeps casual readers out of NDA
     material; NOT security (the HTML still ships to view-source).
     ============================================================ */
  window.CH_AUTH = (function () {
    var PASSWORD = 'cnh2027';
    var STORAGE_KEY = 'ch_unlock_session';
    var LEGACY_KEYS = ['ch_work_unlocked', 'ch_work_unlocked_v2', 'ch_unlock_v3'];

    try {
      LEGACY_KEYS.forEach(function (k) {
        sessionStorage.removeItem(k);
        localStorage.removeItem(k);
      });
    } catch (e) { /* private mode */ }

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
    return { isUnlocked: isUnlocked, unlock: unlock };
  })();

  (function gate() {
    var gates = document.querySelectorAll('[data-screens-gate]');

    function applyUnlocked() {
      document.body.classList.add('cs-unlocked');
    }
    if (window.CH_AUTH.isUnlocked()) applyUnlocked();
    if (!gates.length) return;

    Array.prototype.forEach.call(gates, function (g) {
      var form = g.querySelector('.gate__form');
      var input = g.querySelector('.gate__input');
      var err = g.querySelector('.gate__error');
      if (!form || !input) return;

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (window.CH_AUTH.unlock(input.value.trim())) {
          if (err) err.classList.remove('is-visible');
          applyUnlocked();
          var details = document.querySelector('.cs-details');
          if (details) {
            requestAnimationFrame(function () {
              details.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
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
})();
