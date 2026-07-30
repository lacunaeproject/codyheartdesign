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

  /* ---------- Hero load-in ----------
     The old hero's rise, rebuilt for a naturally-wrapping title:
     split the rendered h1 into its visual lines, wrap each in a
     clipping row, rise them one after the next, spin the spikes
     in after their line lands, unskew the stars last, fade the
     lede up at the end — then put the original markup back so
     the title wraps naturally again on resize.

     html.js-rise is armed by an inline script in the page head so
     the type is never seen in place and then dropped behind its
     mask; its own failsafe clears it if this never runs. */
  (function heroRise() {
    var html = document.documentElement;
    var hero = document.querySelector('.hero');
    var title = document.querySelector('.hero__title');
    if (!hero || !title) { html.classList.remove('js-rise'); return; }
    if (reduceMotion || !html.classList.contains('js-rise')) {
      html.classList.remove('js-rise');
      return;
    }

    var STAGGER = 280, RISE = 520;
    var lede = document.querySelector('.hero__lede');
    var originalHTML = title.innerHTML;

    // Hold the lede's highlight until the lede itself has risen.
    if (lede) {
      Array.prototype.forEach.call(lede.querySelectorAll('.highlight'), function (m) {
        m.setAttribute('data-hl-defer', '');
      });
    }

    function split() {
      // Pass 1 — wrap every word in a span so it can be measured.
      // Plain spaces become their own tokens; the spark spans stay
      // whole; hair spaces and entities stay inside their word.
      var items = [];
      var frag = document.createDocumentFragment();
      function splitWords(text, wrap, parent) {
        text.split(/( )/).forEach(function (part) {
          if (part === '') return;
          if (part === ' ') {
            items.push({ space: true, wrap: wrap });
            parent.appendChild(document.createTextNode(' '));
          } else {
            var s = document.createElement('span');
            s.textContent = part;
            items.push({ el: s, word: true, wrap: wrap });
            parent.appendChild(s);
          }
        });
      }
      Array.prototype.slice.call(title.childNodes).forEach(function (node) {
        if (node.nodeType === 3) {
          splitWords(node.textContent, null, frag);
        } else if (node.nodeType === 1 && node.tagName === 'BR') {
          // Manual breaks shape the measured wrap but aren't tokens:
          // the per-line rows carry the break from here on.
          frag.appendChild(node);
        } else if (node.nodeType === 1 && node.classList.contains('hero-em')) {
          // A styled phrase (a gradient em): split its words too so
          // the phrase can break across lines, measured inside a
          // clone so the bold-italic metrics are right.
          var shell = node.cloneNode(false);
          splitWords(node.textContent, node, shell);
          frag.appendChild(shell);
        } else if (node.nodeType === 1) {
          // Atomic marks: the heart, the sparks.
          items.push({ el: node });
          frag.appendChild(node);
        }
      });
      title.textContent = '';
      title.appendChild(frag);

      // Pass 2 — group tokens into rendered lines. The threshold is
      // generous because the sparks ride .25em high on their line.
      var threshold = parseFloat(getComputedStyle(title).fontSize) * .6;
      var lines = [];
      var lastTop = null;
      items.forEach(function (it) {
        if (it.space) { if (lines.length) lines[lines.length - 1].push(it); return; }
        var top = it.el.offsetTop;
        if (lastTop === null || Math.abs(top - lastTop) > threshold) {
          lines.push([it]);
          lastTop = top;
        } else {
          lines[lines.length - 1].push(it);
        }
      });

      // Pass 3 — rebuild: one clipping row per line, words restored
      // to plain text, sparks kept as elements with their own beats.
      var starDelay = (lines.length - 1) * STAGGER + 850;
      title.textContent = '';
      lines.forEach(function (line, i) {
        while (line.length && line[0].space) line.shift();
        while (line.length && line[line.length - 1].space) line.pop();
        var row = document.createElement('span');
        row.className = 'hero__line';
        var inner = document.createElement('span');
        inner.className = 'hero__line-inner';
        inner.style.setProperty('--d', (i * STAGGER) + 'ms');
        // Words that belong to a gradient em are regrouped into a
        // fresh clone of it per line, so a phrase that breaks across
        // rows keeps its color on both.
        var container = inner;
        var currentWrap = null;
        line.forEach(function (it) {
          var wrap = it.wrap || null;
          if (wrap !== currentWrap) {
            container = wrap ? wrap.cloneNode(false) : inner;
            if (wrap) inner.appendChild(container);
            currentWrap = wrap;
          }
          if (it.space) container.appendChild(document.createTextNode(' '));
          else if (it.word) container.appendChild(document.createTextNode(it.el.textContent));
          else if (it.el.classList.contains('hero-heart')) {
            it.el.style.setProperty('--hd', (i * STAGGER + 320) + 'ms');
            container.appendChild(it.el);
          } else if (it.el.classList.contains('spark')) {
            var isSpike = it.el.textContent.charCodeAt(0) === 0x2739;
            it.el.classList.add(isSpike ? 'spark--spike' : 'spark--star');
            it.el.style.setProperty('--sd', (isSpike ? i * STAGGER + 380 : starDelay) + 'ms');
            container.appendChild(it.el);
          } else {
            // Other atomic pieces (the city + its flag) ride their
            // line with no extra choreography.
            container.appendChild(it.el);
          }
        });
        row.appendChild(inner);
        title.appendChild(row);
      });

      var ledeDelay = (lines.length - 1) * STAGGER + 420;
      if (lede) lede.style.setProperty('--ld', ledeDelay + 'ms');

      // Show the prepared, masked state, then flip the switch on
      // the frame after it has painted.
      hero.classList.add('is-split');
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { hero.classList.add('is-lit'); });
      });

      // The lede's highlight wipes once the lede is readable.
      if (lede) {
        setTimeout(function () {
          Array.prototype.forEach.call(lede.querySelectorAll('.highlight'), function (m) {
            m.classList.add('is-on');
          });
        }, ledeDelay + 800);
      }

      // Sequence done: restore the natural markup so the title
      // wraps freely again. Same words, same width — an invisible
      // swap.
      setTimeout(function () {
        title.innerHTML = originalHTML;
        html.classList.remove('js-rise');
      }, starDelay + RISE + 400);
    }

    // Measure against the real serif, not the fallback — but never
    // hold the page hostage to a slow font.
    var ready = (document.fonts && document.fonts.ready) || Promise.resolve();
    Promise.race([
      ready,
      new Promise(function (r) { setTimeout(r, 900); })
    ]).then(split);
  })();

  /* ---------- Hero pop-ups ----------
     Hover the name: a photo springs up beside the cursor and
     rides along with it. Hover the city: the W flies there.
     Delegated, because the load-in rebuilds the headline's DOM
     and listeners pinned to the spans would be lost with it. */
  (function heroPops() {
    var hero = document.querySelector('.hero');
    if (!hero) return;
    var pairs = [
      { sel: '.hero-em--name, .hero-heart', pop: document.querySelector('.me-pop') },
      { sel: '.city-pop', pop: document.querySelector('.chi-flag') },
      { sel: '.more-pop', pop: document.querySelector('.hudson-pop'), fixed: true },
      { sel: '.more-pop', pop: document.querySelector('.bean-pop'), fixed: true },
      { sel: '.more-pop', pop: document.querySelector('.us-pop'), fixed: true }
    ];
    var active = null;

    function place(p, e) {
      if (p.fixed) return; // stickers with a home of their own
      var wrap = p.pop.parentElement;
      var cs = getComputedStyle(p.pop);
      var w = parseFloat(cs.width) || 200;
      var h = parseFloat(cs.height) || 140;
      var x = e.clientX + 26;
      if (x + w > window.innerWidth - 12) x = e.clientX - w - 26;
      var y = e.clientY - h / 2;
      y = Math.max(12, Math.min(y, window.innerHeight - h - 12));
      wrap.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    }

    pairs.forEach(function (p) {
      if (!p.pop) return;
      hero.addEventListener('mouseover', function (e) {
        if (e.target.closest && e.target.closest(p.sel)) {
          active = p;
          place(p, e);
          p.pop.classList.add('is-up');
        }
      });
      hero.addEventListener('mouseout', function (e) {
        if (!e.target.closest || !e.target.closest(p.sel)) return;
        if (e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(p.sel)) return;
        p.pop.classList.remove('is-up');
        if (active === p) active = null;
      });
    });

    hero.addEventListener('mousemove', function (e) {
      if (active) place(active, e);
    }, { passive: true });
  })();

  /* ---------- Highlight wipe on view ---------- */
  (function highlights() {
    var marks = document.querySelectorAll('.highlight:not([data-hl-defer])');
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
