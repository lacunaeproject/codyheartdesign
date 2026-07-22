/* ============================================================
   Cody Heart — Portfolio JS
   - Intersection-observer reveal animations
   - Liquid-glass header on scroll
   - Password gate for /work and case studies
   ============================================================ */

/* ---------- Liquid-glass header ---------- */
(function initGlassHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const THRESHOLD = 12; // px of scroll before the glass kicks in
  let ticking = false;

  function update() {
    const y = window.scrollY || window.pageYOffset;
    header.classList.toggle('is-scrolled', y > THRESHOLD);
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }

  // Initial state (e.g. after a hash jump or anchor navigation)
  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
})();

/* ---------- Reveal on scroll ---------- */
(function initReveal() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });

  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
})();

/* ---------- Password gate ----------
   NOTE: This is client-side only. It keeps casual visitors out
   (recruiters, friends, etc.) but is NOT strong security — the
   case study HTML still ships to anyone who views source. For
   a production deploy, move case studies behind a simple server
   auth (Netlify password protection, Cloudflare Access, etc.).
   Password is set here; change it in ONE place.
*/
window.CH_AUTH = (function() {
  const PASSWORD = 'cnh2027';
  // Session-only storage — unlock is valid only for this browser tab.
  // Closing the tab, opening a new tab, or refreshing in a new session
  // all require the password again. No 7-day persistence.
  const STORAGE_KEY = 'ch_unlock_session';

  // Sweep away every legacy key from previous versions on every page load.
  // This guarantees no stale long-lived unlocks can linger.
  const LEGACY_KEYS = [
    'ch_work_unlocked',
    'ch_work_unlocked_v2',
    'ch_unlock_v3',
  ];
  try {
    LEGACY_KEYS.forEach(k => {
      sessionStorage.removeItem(k);
      localStorage.removeItem(k);
    });
  } catch (e) { /* ignore */ }

  // ?lock URL param force-clears the current unlock (useful for testing)
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has('lock')) {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) { /* ignore */ }

  function isUnlocked() {
    try {
      // ONLY sessionStorage — never localStorage. This is the critical change:
      // unlocks do not persist across tabs or sessions.
      return sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function unlock(pw) {
    if (pw === PASSWORD) {
      try {
        sessionStorage.setItem(STORAGE_KEY, '1');
      } catch (e) { /* ignore */ }
      return true;
    }
    return false;
  }

  function lock() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      LEGACY_KEYS.forEach(k => {
        sessionStorage.removeItem(k);
        localStorage.removeItem(k);
      });
    } catch (e) { /* ignore */ }
  }

  function requireAuth(redirectTo) {
    if (isUnlocked()) return true;
    const here = window.location.pathname.split('/').pop() || 'index.html';
    window.location.replace('work.html?return=' + encodeURIComponent(here));
    return false;
  }

  return { isUnlocked, unlock, lock, requireAuth, PASSWORD_HINT: 'Hint: ask me.' };
})();

/* ---------- Hero H1 word-by-word reveal ----------
   Splits any hero H1 (homepage .hero h1, case-study .cs-hero h1)
   into word spans that fade+lift in on a stagger. Skipped for H1s
   that contain HTML children (e.g. inline <em>), for reduced-motion,
   and if no such H1 exists. */
(function initHeroH1Reveal() {
  const h1s = document.querySelectorAll('.hero h1, .cs-hero h1');
  if (!h1s.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  h1s.forEach(h1 => {
    // Preserve any inline markup: only split H1s that are pure text.
    if (h1.children.length > 0) return;

    const text = h1.textContent.trim();
    if (!text) return;
    const words = text.split(/\s+/);

    // Drop the block-level .reveal so we don't double-animate the parent.
    h1.classList.remove('reveal', 'reveal--d1', 'reveal--d2', 'reveal--d3');
    h1.innerHTML = words.map((w, i) => {
      const delay = 120 + i * 55; // 120ms base + 55ms per word
      return '<span class="h1-word" style="transition-delay:' + delay + 'ms">' + w + '</span>';
    }).join(' ');

    requestAnimationFrame(() => {
      h1.querySelectorAll('.h1-word').forEach(w => w.classList.add('is-in'));
    });
  });
})();

/* ---------- Case-study byline card ----------
   Inject an NYT-style byline at the end of the hero: bold "By Cody
   Heart" on top, small meta line (role from .cs-meta + timeline +
   reading time from body word count at 220 wpm) underneath. */
(function initHeroByline() {
  const hero = document.querySelector('.cs-hero');
  if (!hero) return;
  if (hero.querySelector('.cs-hero__byline')) return;

  const body = document.querySelector('main.cs .cs-body:not(.cs-body--overview)');
  if (!body) return;
  const wordCount = body.innerText.trim().split(/\s+/).length;
  const readMin = Math.max(2, Math.round(wordCount / 220));

  const getMeta = (label) => {
    const el = [...hero.querySelectorAll('.cs-meta__label')].find(x => x.textContent.trim() === label);
    return el && el.nextElementSibling ? el.nextElementSibling.textContent.trim() : '';
  };
  const role = getMeta('Role');
  const timeline = getMeta('Timeline');

  const metaParts = [];
  if (role) metaParts.push(role);
  if (timeline) metaParts.push(timeline);
  metaParts.push(readMin + ' min read');

  const byline = document.createElement('div');
  byline.className = 'cs-hero__byline';

  const name = document.createElement('div');
  name.className = 'cs-hero__byline-name';
  name.textContent = 'By Cody Heart';
  byline.appendChild(name);

  const meta = document.createElement('div');
  meta.className = 'cs-hero__byline-meta';
  meta.textContent = metaParts.join(' · ');
  byline.appendChild(meta);

  // If there's a lead illustration in the hero, place byline just before it
  // so the order reads: eyebrow → H1 → lede → byline card → illustration.
  const illustration = hero.querySelector('.cs-hero-illustration');
  if (illustration) hero.insertBefore(byline, illustration);
  else hero.appendChild(byline);
})();

/* ---------- Reading progress bar ----------
   Fixed top-of-viewport bar that fills as the reader scrolls the page.
   Only injected on case-study pages (identified by main.cs). Scroll
   handler is rAF-throttled and passive so it stays cheap. */
(function initReadingProgress() {
  if (!document.querySelector('main.cs')) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const bar = document.createElement('div');
  bar.className = 'reading-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.prepend(bar);

  let ticking = false;
  function update() {
    const doc = document.documentElement;
    const scrollTop = window.scrollY || doc.scrollTop || 0;
    const height = (doc.scrollHeight - window.innerHeight) || 1;
    const progress = Math.max(0, Math.min(scrollTop / height, 1));
    bar.style.width = (progress * 100).toFixed(2) + '%';
    ticking = false;
  }
  function onScroll() {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
})();

/* ---------- Count-up on scroll ----------
   Any element with [data-countup] gets its numeric content animated
   from 0 → the parsed target value when it scrolls into view.
   Preserves any prefix/suffix (e.g. "3.3%", "-24.1%", "10×", "$117K").
   Respects prefers-reduced-motion by rendering the final value immediately.
*/
(function initCountUp() {
  const els = document.querySelectorAll('[data-countup]');
  if (!els.length) return;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function parse(text) {
    const m = text.match(/(-?\d+(?:\.\d+)?)/);
    if (!m) return null;
    const raw = m[1];
    const idx = text.indexOf(raw);
    return {
      num: parseFloat(raw),
      prefix: text.slice(0, idx),
      suffix: text.slice(idx + raw.length),
      decimals: raw.includes('.') ? raw.split('.')[1].length : 0
    };
  }

  function format(n, decimals) {
    return decimals > 0 ? n.toFixed(decimals) : String(Math.round(n));
  }

  function animate(el, parsed) {
    const duration = 1400;
    const start = performance.now();
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      const value = parsed.num * easeOut(t);
      el.textContent = parsed.prefix + format(value, parsed.decimals) + parsed.suffix;
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = parsed.prefix + format(parsed.num, parsed.decimals) + parsed.suffix;
    }
    requestAnimationFrame(step);
  }

  els.forEach(el => {
    const parsed = parse(el.textContent);
    if (!parsed) return;
    if (prefersReduced || !('IntersectionObserver' in window)) return;

    // Zero out the number, preserve prefix/suffix
    el.textContent = parsed.prefix + format(0, parsed.decimals) + parsed.suffix;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animate(el, parsed);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.4 });
    io.observe(el);
  });
})();

/* ---------- Diagram reveal ----------
   Elements with [data-diagram-reveal] get an 'is-in' class when they
   scroll into view. CSS drives the actual animation (stroke-dashoffset,
   scaleX on bars, opacity fades). Reduced-motion is handled in CSS.
*/
(function initDiagramReveal() {
  const els = document.querySelectorAll('[data-diagram-reveal]');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.25 });
  els.forEach(el => io.observe(el));
})();

/* ---------- Access gate ----------
   ONE password for the whole site (CH_AUTH.PASSWORD), one gate component.
   Unlocking any case study unlocks every gated section for the rest of the
   browser-tab session.

   Gated content lives in .cs-details, which is display:none by default in
   CSS and revealed by the .cs-unlocked class on <body>. Defaulting to hidden
   means a JS failure fails CLOSED — the NDA material never flashes.

   NOTE: still client-side only. The gated HTML ships to anyone who views
   source. For real protection put these pages behind server auth
   (Netlify password protection, Cloudflare Access, etc.).
*/
(function initAccessGate() {
  const gates = document.querySelectorAll('[data-screens-gate]');
  const body = document.body;

  function applyUnlocked() {
    body.classList.add('cs-unlocked');
    gates.forEach(g => g.classList.add('is-unlocked'));
  }

  if (window.CH_AUTH && window.CH_AUTH.isUnlocked()) applyUnlocked();
  if (!gates.length) return;

  gates.forEach(gate => {
    const form = gate.querySelector('.screens-gate__form');
    const input = gate.querySelector('.screens-gate__input');
    const err = gate.querySelector('.screens-gate__error');
    if (!form || !input) return;

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const value = input.value.trim();
      if (window.CH_AUTH && window.CH_AUTH.unlock(value)) {
        if (err) err.classList.remove('is-visible');
        applyUnlocked();
        // Drop the reader straight into the material they just unlocked.
        const details = document.querySelector('.cs-details');
        if (details) {
          requestAnimationFrame(() => {
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
