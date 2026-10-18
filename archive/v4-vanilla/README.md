# Sasisekar R L — "Neural Editorial" portfolio

A cinematic, animated personal portfolio for an AI & Data Science developer. The layout is editorial (oversized type, strict grid, hairlines), and a live neural-network particle field runs behind the hero and the contact section.

No build step: plain HTML, CSS and ES modules. The animation libraries load from CDNs at pinned versions.

| Library | Version | Used for |
| --- | --- | --- |
| GSAP + ScrollTrigger | 3.12.5 | Every timeline and scroll animation |
| Lenis | 1.1.13 | Smooth scrolling, synced with ScrollTrigger |
| SplitType | 0.3.4 | Splitting text into lines, words and characters |
| Three.js | 0.160.0 | The WebGL neural field (loaded lazily) |

---

## 1. Run it locally

ES modules do not load from `file://`, so serve the folder with any static server:

```bash
# Option A: Python (already on most machines)
python -m http.server 5173

# Option B: Node
npx serve .
```

Then open <http://localhost:5173>. The VS Code "Live Server" extension also works.

---

## 2. Folder structure

```
index.html                 All content (readable without JavaScript)
css/main.css               Design tokens, layout, components, motion preferences
js/main.js                 Entry: picks full-motion or static mode, starts modules
js/utils.js                Shared helpers and state
js/animations/
  preloader.js             000→100% counter, terminal lines, split clip-path wipe
  hero.js                  Character reveal, scroll-out (scale + blur + parallax)
  text-fx.js               Decrypting scramble and typewriter loop
  cursor.js                Dot + trailing ring with context labels
  interactions.js          Magnetic buttons, 3D tilt cards
  nav.js                   Hide on scroll down / show on scroll up, active link
  menu.js                  Fullscreen menu: circle reveal, previews, focus trap
  scroll.js                Lenis, anchor links, progress bar, section colours
  reveal.js                Line reveals, fades, clip-path images, parallax
  about.js                 Word scrub (pinned quote), face-scan, counters
  skills.js                Velocity-reactive marquees, tag stagger
  graph.js                 Draggable force-directed skills graph (canvas)
  projects.js              Horizontal pinned gallery, distortion hover,
                           architecture diagram draw, pipeline sequence
  experience.js            Timeline rail draw, stacking sticky cards, year count
  education.js             Row line-draw reveals, cursor-following preview label
  contact.js               Letters that repel from the cursor
  footer.js                Curtain footer, IST clock, back to top
  ui.js                    Toast + copy to clipboard
  easter-egg.js            Type "ai" for a particle burst
js/webgl/neural.js         Three.js particle network (links, signals, ring)
assets/                    Favicon and placeholder images (SVG)
archive/                   Earlier single-file versions of the site
```

---

## 3. Replace the placeholders

Search `index.html` for each token:

| Token | Replace with |
| --- | --- |
| `[LINKEDIN_URL]` | Your LinkedIn profile URL |
| `[GITHUB_URL]` | Your GitHub profile URL |
| `[RESUME_PDF_URL]` | Path to your résumé, e.g. `assets/resume.pdf` |
| `[GITHUB_PROJECT_URL]` | Smart Attendance System repository |
| `[DEMO_URL]` | Demo video or live demo of the project |
| `[CERT_LINK_1]` | GenLab IB internship certificate |
| `[CERT_LINK_2]` | Entudio Pvt Ltd internship certificate |
| `[SITE_URL]` | The live URL, without a trailing slash. It is used by the canonical link (**uncomment** that line) and the social preview image `[SITE_URL]/assets/img/og-image.jpg` |

Until a link is replaced it does nothing when clicked and logs a reminder in the browser console, so nobody lands on a broken URL.

### Images

Search `index.html` for `REPLACE:`.

- **Portrait**: `assets/img/portrait-600|1000.avif|webp|jpg` were generated from your photo `assets/img/myphotd.jpeg` as a 4:5 head-and-shoulders crop. The page serves AVIF, then WebP, then JPEG, depending on browser support. It is shown in greyscale and turns to colour on hover. To use a different photo, export a 4:5 crop in the same three formats and sizes. Then move the face-scan box (`.scan__box`, `.scan__corners`, `.scan__tag` in the About section's SVG, 400×500 coordinates) so it frames the new face.
- **Full-screen hero photo**: `assets/img/hero-bg-720|1086.avif|webp|jpg` is the whole photo in greyscale. It fills the hero behind the name, under a gradient that keeps the text readable. With motion on, JS cuts it into vertical strips (8 on desktop, 5 on phones) that open from the centre in the intro and split apart as you scroll. Without motion it is one still image. To reframe it, change `object-position` on `.hero-bg__strip img` in `css/main.css`; phones use their own `top`/`height` values so the face sits above the name.
- **Social preview**: `assets/img/og-image.jpg` (1200×630) combines your name with the same photo.
- **Project card**: `assets/img/project-smart-attendance-720|1086.*` is your photo as a face-recognition "demo frame": bounding box, facial landmarks, match score and ESP32-CAM readouts baked into the image. When you have a real screenshot of the system, replace these files (16:10) and update the `alt` text.
- **"Coming soon" cards**: `soon-pixel.*` and `soon-blur.*` are pixelated and blurred versions of your photo, as if the next models are still learning. They are set in CSS (`.card__media--pixel`, `.card__media--blur`).
- **Menu previews**: `preview-skills|experience|education|contact.*` are crops of your photo in blue, greyscale, cyan and deep-blue treatments. About uses the portrait and Projects uses the project card image.

Every image on the site is generated from `assets/img/myphotd.jpeg`.

### Adding a project

Copy the `<article class="card …">` block in the Projects gallery. The horizontal scroll length adapts automatically. Replace a "Coming soon" card when you have a second project.

---

## 4. Deploy

**Netlify:** drag the folder onto <https://app.netlify.com/drop>, or connect the Git repository with build command *(empty)* and publish directory `.`.

**Vercel:** `npx vercel` in the folder, or import the repository with framework preset "Other" and no build command.

**GitHub Pages:** push to a repository, open *Settings → Pages* and choose *Deploy from a branch* (`main`, `/root`). The site appears at `https://<user>.github.io/<repo>/`.

All paths are relative, so the site works from a sub-folder too.

---

## 5. How the motion is organised

- **Two modes.** `js/main.js` enables full motion only when GSAP, ScrollTrigger and SplitType loaded **and** the visitor has not asked for reduced motion. Otherwise the page stays static: no preloader, smooth scroll, scramble, marquee movement or parallax, and the WebGL field renders one still frame.
- **No-JS safe.** Nothing in the CSS hides content unless JavaScript is running, and a 5-second failsafe in `<head>` removes the motion classes if the scripts never finish (for example if a CDN is down).
- **Performance.** Animations use transform and opacity (the hero blur-out is the one filter). The WebGL scene renders only while the hero or contact section is on screen and the tab is visible. It uses 2,000 particles on desktop and 650 on touch devices. Three.js is imported only after the preloader, and the distortion shader is skipped on touch.
- **Theme toggle.** Uses the View Transitions API for the circular reveal, and falls back to an instant switch.
- **Accessibility.** Includes a skip link, visible focus, a keyboard-trapped menu (Escape closes it), screen-reader copies of all split or scrambled text, `aria-live` toasts, and alt text. The scroll-scrubbed words go from a dim tone to full colour (not 15% opacity), so even the un-lit state keeps WCAG AA contrast. For the same reason the light theme's muted grey is `#5F5F5F` instead of `#6B6B6B`.

---

## 6. Customising

- **Colours, fonts and spacing:** CSS variables at the top of `css/main.css` (`:root` for dark, `[data-theme="light"]` for light).
- **Section background colours:** each section's `data-bg` attribute (`bg`, `surface`, `deep`).
- **Neural field:** particle counts, link distance and colours are constants at the top of `createNeural()` in `js/webgl/neural.js`.
- **Typewriter phrases:** `ROLES` in `js/animations/hero.js`.
- **Entry screen and preloader:** every visit opens on a blank screen with a single "View Portfolio" button (focused, so Enter works). Clicking it runs the 000→100% boot sequence, then the screen wipes into the hero. Links straight to a section (e.g. `…/#projects`) skip it, as do visitors with reduced motion or without JavaScript. The logic is in `js/animations/preloader.js`. To go back to an automatic preloader, call `boot()` immediately instead of waiting for the click.
