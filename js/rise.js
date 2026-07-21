/* ============================================================
   Expedition page transition
   A navy veil with a compass rose fades in to cover the page you
   leave, then fades away to reveal the page you land on — always
   below the nav bar (measured live) so the header stays consistent.
   Runs in the <head> so arrivals never flash. Theme-agnostic:
   a compass, not the deep-sea water motif.
   ============================================================ */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DUR_OUT = 460, DUR_IN = 540;

  var COMPASS =
    '<svg class="page-rise__compass" viewBox="0 0 100 100" fill="none" stroke="currentColor" ' +
    'stroke-width="1.4" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="50" cy="50" r="42" stroke-opacity="0.35"/>' +
    '<circle cx="50" cy="50" r="30"/>' +
    '<path d="M50 6 V15 M50 85 V94 M6 50 H15 M85 50 H94" stroke-opacity="0.65"/>' +
    '<path d="M50 14 L57 50 L50 86 L43 50 Z" fill="currentColor" stroke="none"/>' +
    '<path d="M14 50 L50 43 L86 50 L50 57 Z" fill="currentColor" fill-opacity="0.3" stroke="none"/>' +
    '<circle cx="50" cy="50" r="3.2" fill="currentColor" stroke="none"/></svg>';

  /* --- Arrival: were we sent here by a transition? Cover before first paint. --- */
  var arriving = false;
  try { arriving = sessionStorage.getItem('ch-rise') === '1'; } catch (e) {}
  if (arriving) {
    try { sessionStorage.removeItem('ch-rise'); } catch (e) {}
    if (!reduce) root.classList.add('rise-in'); /* html.rise-in::after paints the instant cover */
  }

  function navBottom() {
    var h = document.querySelector('.site-header');
    var b = h ? h.getBoundingClientRect().bottom : 80;
    return Math.max(0, Math.round(b));
  }
  function setNavH() { root.style.setProperty('--nav-h', navBottom() + 'px'); }

  function build() {
    var existing = document.querySelector('.page-rise');
    if (existing) return existing;
    var veil = document.createElement('div');
    veil.className = 'page-rise';
    veil.setAttribute('aria-hidden', 'true');
    veil.innerHTML = COMPASS;
    document.body.appendChild(veil); /* sibling of any .frame wrapper — avoids clipping */
    return veil;
  }

  function onReady() {
    setNavH();
    if (reduce) { root.classList.remove('rise-in'); return; }
    build();
    if (arriving) {
      root.classList.add('rise-cover');             /* veil covers instantly */
      /* Timeouts (not rAF) so the reveal always fires, even in a background tab */
      window.setTimeout(function () {
        root.classList.remove('rise-in');            /* drop the CSS ::after cover */
        window.setTimeout(function () {
          root.classList.add('rise-reveal');         /* fade the veil away */
        }, 24);
      }, 24);
      window.setTimeout(function () {
        root.classList.remove('rise-cover', 'rise-reveal');
      }, DUR_IN + 300);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
  window.addEventListener('resize', setNavH);
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) root.classList.remove('rise-in', 'rise-cover', 'rise-reveal', 'rise-out');
  });

  /* --- Departure: intercept in-site link clicks and cover before navigating. --- */
  document.addEventListener('click', function (e) {
    if (reduce || e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest ? e.target.closest('a') : null;
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#') return;
    if (/^(mailto:|tel:|javascript:)/i.test(href)) return;
    var url;
    try { url = new URL(href, window.location.href); } catch (err) { return; }
    if (url.origin !== window.location.origin) return;
    if (url.href === window.location.href) return;
    if (url.pathname === window.location.pathname && url.hash) return;

    e.preventDefault();
    setNavH();
    try { sessionStorage.setItem('ch-rise', '1'); } catch (err) {}
    var veil = build();
    void veil.offsetWidth;                          /* commit the hidden start state */
    root.classList.add('rise-out');

    var done = false;
    var go = function () { if (done) return; done = true; window.location.href = url.href; };
    veil.addEventListener('transitionend', function (ev) {
      if (ev.target === veil && ev.propertyName === 'opacity') go();
    });
    window.setTimeout(go, DUR_OUT + 160);
  }, false);
})();
