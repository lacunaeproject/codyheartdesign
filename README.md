# Cody Heart — Portfolio Site · v2

A static site. Ten files — six HTML pages, one stylesheet, one JS file, this README, and the zip.

## Structure

```
portfolio/
├─ index.html                     ← homepage (hero, metrics marquee, case grid, experience)
├─ work.html                      ← password gate + case study index (LOCKED)
├─ about.html                     ← about page (unlocked)
├─ case-studies/
│  ├─ matching-logic.html        ← № 01 · Care Routing (LOCKED)
│  ├─ matching-tool.html         ← № 02 · Booking Tool (LOCKED)
│  ├─ claims.html                ← № 03 · Claims Infrastructure (LOCKED)
│  ├─ billing.html               ← № 04 · Billing Systems (LOCKED)
│  └─ design-roi.html            ← № 05 · Design ROI (LOCKED)
├─ css/main.css                   ← all styles (single file, CSS variables up top)
└─ js/main.js                     ← reveal animations + password gate
```

## What changed in v2

- **Palette rebuilt from the Chicago print.** Portillo's red as the primary accent, Chicago River navy-teal, Frank Lloyd Wright ochre, Grant Park green, Drawbridge mulberry — each case study card now has its own accent color drawn from that palette. LifeStance flag-red and flag-blue are in there too for specific moments. Paper is cleaner (`#FBFAF6`), less beige.
- **More weight variety in the type.** Hero headline now mixes Fraunces light italic, Fraunces bold, an animated highlighter swipe on a key word, and a secondary color for the second clause. Inter Tight (sans) was added as a fourth family for buttons, nav, meta copy — gives the pages more tonal range against the two serifs.
- **More playful ornaments.** A pulsing dot in the wordmark, a slow orbiting circle + floating dot on the hero, a giant "HELLO" watermark in the about section, tricolor top-borders on the metrics strips, colored hover-offset shadows on the case cards. None of it is load-bearing — strip any of it out without hurting the layout.
- **Case studies renamed and reframed.** `№ 01 Matching Logic` is the framework/routing story; `№ 02 Matching Tool` is reframed around escaping the spreadsheet + external tools (the truer narrative); `№ 03 Claims`; `№ 04 Billing`; `№ 05 Design ROI` is new — the 9–11× realized / 40–100× scoped modeling work.

## Passwords & search-engine blocking

Current password: **`cnh2027`**

Change it in **one place** — `js/main.js`:

```js
const PASSWORD = 'cnh2027';   // ← change this
```

**Search engine protection.** The protected pages are hardened against indexing three ways:

1. `robots.txt` at the site root disallows `/work.html` and `/case-studies/` for all major crawlers (Googlebot, Bingbot, GPTBot, ClaudeBot, CCBot, PerplexityBot).
2. Every gated page includes `<meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex">` plus explicit `googlebot` and `bingbot` variants.
3. Case study bodies are hidden via CSS (`visibility: hidden` on `main` + `footer`) until the client-side unlock flips a `body.is-unlocked` class. A `<noscript>` refresh-redirect sends no-JS crawlers back to `/work.html` before they can read anything.

Belt-and-suspenders — any ONE of those layers would stop indexing. All three together means the password and the case study URLs should never surface in search results.

**Important caveat.** Client-side password protection is UX, not security. Anyone who views page source can still read the case study HTML. For true access control, deploy to Netlify (their paid plans include password-protected routes) or Cloudflare Pages + Cloudflare Access.

Unlock persists **7 days** on the visitor's device (sessionStorage + localStorage fallback). Adjust `SESSION_MAX_MS` in `js/main.js` for longer/shorter.

## Deploying

Any static host works:

- **Netlify** (recommended) — drag the folder onto netlify.com/drop. Free. Paid plans include built-in password protection.
- **Cloudflare Pages** — connect a Git repo or drag-drop. Free. Cloudflare Access adds real auth.
- **GitHub Pages** — push to a repo named `codyheart.design` under your username.

Point the `codyheart.design` DNS at whichever host you pick.

## Customizing

**Hero tagline.** `index.html`, inside `<h1 class="reveal reveal--d1">`. Currently:

> I design **internal tools** that move the <u>numbers</u> — and the *people* behind them.

Each visual treatment is a span — swap `<span class="em-bold">`, `<span class="em-underline">`, `<span class="em-red">`, or `<span class="em-blue">` around any words to retune the emphasis.

**Colors.** `css/main.css`, `:root` block at the top. Every color from the Chicago print is a named CSS variable (`--portillos`, `--river`, `--flw`, `--grant`, `--drawbridge`, etc.). The functional aliases (`--accent`, `--secondary`, `--tertiary`) let you swap the whole site's primary accent by changing one line.

To retune per-card accents, see the `.case-card--01` through `.case-card--05` selectors in `main.css`. Each one sets a `--card-accent` variable, which drives the title italic color, the number eyebrow, the lock badge, and the hover-offset shadow.

**Fonts.** Fraunces (display variable serif) + Source Serif 4 (body) + JetBrains Mono (eyebrows) + Inter Tight (sans). All Google Fonts, imported in `main.css`.

**Case study content.** Each case study lives in its own file under `case-studies/`. Same template: hero → metrics strip → body with chapters → next-case footer. Copy is a working draft pulled from your bullets and docs — edit freely. The `design-roi.html` file is the one most worth you rewriting in your own voice, since the specific numbers and framing will be tighter than my draft.

**Résumé link.** `https://drive.google.com/file/d/1DNg6jHae1uTtqSoy8dUVyaRoVnSJ9kkv/view?usp=sharing` — appears in `index.html` hero, `about.html`, and all footers.

## What's NOT in here yet

- Case study hero images — template has space, just drop images into a new `case-studies/images/` folder and add an `<img>` inside the `cs-hero` section.
- Analytics — no tracker installed.
- Favicon — add `favicon.svg` to root and reference in each `<head>`.
- A `robots.txt` blocking indexing of the locked case study pages. Recommended before deploy.

## Accessibility notes

Password gate is keyboard-navigable and announces errors via `role="alert"`. Reveal animations, the orbiting hero ornament, the marquee, and the highlighter swipe all respect `prefers-reduced-motion`. Focus states use the browser default plus a `box-shadow` halo on the password input — happy to tighten further if you want.

---

Designed to match your new site's voice, amplified toward the reference portfolios you shared. Coded to be maintainable by hand — no build step, no framework, no dependencies.
