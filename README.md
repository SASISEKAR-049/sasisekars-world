# Sasisekar R L — "Neural Editorial" portfolio

A cinematic, animated personal portfolio for an AI & Data Science developer. The style is a dark ROG-inspired poster: near-black, one ROG red accent, Orbitron display type. The landing page sets your name huge across the screen over your photo, and a live neural-network particle field forms behind the contact section.

Built with React 19, Tailwind CSS 4 and Vite 7. The page is pre-rendered at build time (so all content is readable without JavaScript) and React hydrates it. Every animation is a React component or hook built on Motion.

| Library | Version | Used for |
| --- | --- | --- |
| Motion (formerly Framer Motion) | 14.12.0 | Every animation: reveals, timelines, scroll-linked effects, springs, gestures |
| Lenis | 1.3.27 | Smooth scrolling (Motion's `useScroll` reads the native scroll it drives) |
| Three.js | 0.186.1 | The WebGL neural field (loaded lazily) |

---

## 1. Run it locally

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # dist/ (client build + server render injected into index.html)
npm run preview   # serve dist/
npm run check:colors   # contrast of every colour token pair (WCAG AA), both themes
```

---

## 2. Folder structure

```
index.html                 Head (SEO, fonts, pre-paint script) + #root placeholder
src/entry-client.jsx       Hydrates the pre-rendered page (renders it in dev)
src/entry-server.jsx       renderToString(<App />) for the build-time pre-render
src/App.jsx                Page composition (below-the-fold sections hydrate in
                           their own Suspense boundaries)
src/data/content.js        ALL text, links and placeholders
src/components/            Header (+ menu), Hero, About, Skills, Projects,
                           Experience, Education, Contact (+ footer), Preloader,
                           Theme, Toast, Layers (backdrop, hero photo, WebGL,
                           cursor, easter egg), ui (buttons, links, tags)
src/index.css              Tailwind entry, colour tokens, component + section styles
src/lib/color.js           Reads colour tokens from CSS for canvas / WebGL / meta
src/motion/MotionRoot.jsx  MotionConfig, motion mode, intro, Lenis, anchor links
src/motion/presets.js      Easings, durations, springs and shared variants
src/motion/SplitText.jsx   Splits text into chars / words / lines (accessible)
src/motion/primitives.jsx  Reveal, CountUp, DrawRect, Glare, Loop
src/motion/hooks.js        useMagnetic, useTilt, useScramble, useTypewriter
src/webgl/neural.js        Three.js particle network
scripts/prerender.mjs      Injects the server render into dist/index.html
scripts/contrast.mjs       `npm run check:colors`
public/assets/             Fonts and images
archive/                   Earlier versions of the site (v3 single file, v4 vanilla)
```

Each animation lives in the component it animates, so components can be edited freely.

---

## 3. Replace the placeholders

Search `src/data/content.js` for each token (`[SITE_URL]` is in `index.html`):

| Token | Replace with |
| --- | --- |
| `[GITHUB_PROJECT_URL]` | Smart Attendance System repository |
| `[DEMO_URL]` | Demo video or live demo of the project |
| `[CERT_LINK_1]` | GenLab IB internship certificate |
| `[CERT_LINK_2]` | Entudio Pvt Ltd internship certificate |
| `[SITE_URL]` | The live URL, without a trailing slash. It is used by the canonical link (**uncomment** that line) and the social preview image `[SITE_URL]/assets/img/og-image.jpg` |

Until a link is replaced it does nothing when clicked and logs a reminder in the browser console, so nobody lands on a broken URL.

### Images

- **Portrait**: `assets/img/portrait-600|1000.avif|webp|jpg` were generated from your photo `assets/img/myphotd.jpeg` as a 4:5 head-and-shoulders crop. The page serves AVIF, then WebP, then JPEG, depending on browser support. It is shown in greyscale and turns to colour on hover. To use a different photo, export a 4:5 crop in the same three formats and sizes. Then move the face-scan box (the `DrawRect`, corners path and tag in `Scan` in `src/components/About.jsx`, 400×500 coordinates) so it frames the new face.
- **Full-screen hero photo**: `assets/img/hero-color-720|1086.avif|webp|jpg` is the whole photo (`myphotd.jpeg` resized), in colour. It fills the landing page; a light gradient at the bottom keeps the name readable. With full motion it opens as an iris from the centre, then keeps "breathing" (a very slow push-in) and tilts slightly toward the mouse. Scrolling zooms it gently. Without motion it is one still image. To reframe it, change `object-position` on `.hero-bg__img` in `src/index.css`; phones use their own `top`/`height` values so the face sits above the name.
- **Social preview**: `assets/img/og-image.jpg` (1200×630) combines your name with the same photo.
- **Project card**: `assets/img/project-smart-attendance-720|1086.*` is your photo as a face-recognition "demo frame": bounding box, facial landmarks, match score and ESP32-CAM readouts baked into the image. When you have a real screenshot of the system, replace these files (16:10) and update the `alt` text.
- **"Coming soon" cards**: `soon-pixel.*` and `soon-blur.*` are pixelated and blurred versions of your photo, as if the next models are still learning. They are set in CSS (`.card__media--pixel`, `.card__media--blur`).
- **Menu previews**: `preview-skills|experience|education|contact.*` are crops of your photo in blue, greyscale, cyan and deep-blue treatments. About uses the portrait and Projects uses the project card image.

Every image on the site is generated from `assets/img/myphotd.jpeg`.

### Adding a project

Copy `FeaturedCard` in `src/components/Projects.jsx` (or edit `comingSoon` in `content.js`). The horizontal scroll length adapts automatically. Replace a "Coming soon" card when you have a second project.

---

## 4. Deploy

Run `npm run build` and publish `dist/`.

- **Netlify / Vercel:** build command `npm run build`, output directory `dist`.
- **GitHub Pages:** publish `dist/` (e.g. with a Pages workflow). URLs are relative (`base: './'`), so a sub-folder works.

---

## 5. How the motion is organised

- **One library.** Every animation uses Motion (`motion/react`): `motion.*` components with variants, `whileInView`, `whileHover` / `whileTap` / `whileFocus`, `AnimatePresence`, `useScroll` + `useTransform` + `useSpring` for scroll-linked effects, and `useAnimate` for the entry-screen timeline. There are no CSS transitions or keyframes.
- **Presets.** `src/motion/presets.js` holds the two house curves (`ease.io` = `cubic-bezier(0.76,0,0.24,1)`, `ease.outExpo` = `cubic-bezier(0.16,1,0.3,1)`), durations, springs and the shared variants (`fadeUp`, `staggerChildren`, `lineReveal`, `charReveal`, `clipReveal`, `magnetic`, `tilt`, …). Change a value there and the whole site follows.
- **Three modes** (`src/motion/MotionRoot.jsx`). *Pending* is the server render. *Full* is everything. *Calm* is used when the visitor prefers reduced motion: nothing travels, reveals become short fades, and there is no smooth scrolling, entry screen, custom cursor, spotlight, neural field or looping decoration. `<MotionConfig reducedMotion="user">` wraps the app as a second safety net.
- **No-JS safe.** Elements that animate in carry `data-m` and are pre-rendered in their start state. CSS forces them visible unless JavaScript is in control (`html.motion-pending` before React starts, `html.has-motion` after). A 5-second failsafe in `<head>` removes the pending class if React never starts.
- **Performance.** Only `transform`, `opacity`, `clip-path` and `filter` animate. Section colour changes cross-fade two fixed layers. Outlines "draw" with scaled bars, and pipeline colours cross-fade stacked layers. Hydration is split into Suspense boundaries and the motion-mode switch is a React transition, so start-up never blocks the main thread for long. The WebGL scene renders only while the contact section is on screen and the tab is visible: 2,000 particles on desktop, 650 on touch devices. Three.js is imported in idle time after the intro.
- **Pinned sections** use CSS `position: sticky` with scroll progress from `useScroll`: the About quote (desktop), the horizontal project gallery (≥1024px) and the stacking experience cards.
- **Calm by design.** One focal point per screen: no film grain, background grid or decorative section numbers.
- **Theme toggle.** A curtain in the incoming theme's page colour slides up, the theme switches underneath, then the curtain lifts away (a plain fade with reduced motion). The pre-paint script in `index.html` applies the saved theme before first paint.
- **Accessibility.** Includes a skip link, visible focus rings, and a keyboard-trapped menu (Escape closes it) with the page behind made `inert`. Split text exposes the whole string once (aria-label or a visually hidden copy), and toasts use `role="status"`. Scroll-scrubbed words rest at a per-theme opacity (`--scrub-rest`) that still meets WCAG AA.

---

## 6. Customising

- **Colours:** the palette is defined once, in OKLCH, at the top of `src/index.css` (`:root, [data-theme="dark"]` and `[data-theme="light"]`) and mapped to Tailwind classes in `@theme inline` (`bg-paper`, `bg-surface`, `bg-raised`, `bg-deep`, `text-ink`, `text-muted`, `text-dim`, `border-line`, `border-line-strong`, `text-accent`, `bg-accent-soft`, `text-signal`, `text-success` …). JavaScript reads the same tokens (`src/lib/color.js`). After changing a colour run `npm run check:colors`. It measures every text, border and state colour against every section background in both themes, and checks that the `theme-color` meta in `index.html` still equals the dark `--bg`.
- **Fonts and spacing:** the `@theme inline` block and `:root` in `src/index.css`. Three self-hosted fonts (SIL Open Font License): **Orbitron** (a free ROG-style face) for headings and the giant name, **Inter** for reading text, buttons and navigation, and **JetBrains Mono** for small labels and code-like text. Glyphs missing from the latin subsets (→ ↗ ← ✦ ·) fall back to JetBrains Mono.
- **Section background colours:** each section's `bg` prop (`bg`, `surface`, `deep`).
- **Animation feel:** `src/motion/presets.js`.
- **Neural field:** particle counts and link distance are constants at the top of `createNeural()` in `src/webgl/neural.js`; its colours are the `--neural-*` tokens.
- **Typewriter phrases:** `profile.typer` in `src/data/content.js`.
- **Entry screen and preloader:** every visit opens on a dark screen with a single "View Portfolio" button (focused, so Enter works). Clicking it runs the 000→100% boot sequence, then the screen wipes into the hero. Links straight to a section (e.g. `…/#projects`) skip it, as do visitors with reduced motion or without JavaScript. The timeline is in `src/components/Preloader.jsx`.
