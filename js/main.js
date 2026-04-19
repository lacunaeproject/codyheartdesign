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
