/* ==========================================================================
   Entry point. Decides between the full motion experience and a static,
   fully readable fallback, then starts each module.

   Motion runs only when GSAP, ScrollTrigger and SplitType loaded AND the
   visitor has not asked for reduced motion. Everything else (theme, menu,
   copy, clock, graph) works in every mode.
   ========================================================================== */

import { root, $, $$, libs, media, state, safe } from './utils.js';
import { initTheme } from './animations/theme.js';
import { initMenu } from './animations/menu.js';
import { initSmoothScroll, initAnchors, initProgress, initSectionColors } from './animations/scroll.js';
import { initReveals } from './animations/reveal.js';
import { initPreloader } from './animations/preloader.js';
import { prepareHero, playHero, initHeroScroll, syncHeroBg } from './animations/hero.js';
import { initCursor } from './animations/cursor.js';
import { initMagnetic, initTilt } from './animations/interactions.js';
import { initNav, showNav } from './animations/nav.js';
import { initAbout } from './animations/about.js';
import { initSkills } from './animations/skills.js';
import { initGraph } from './animations/graph.js';
import { initProjects } from './animations/projects.js';
import { initExperience } from './animations/experience.js';
import { initEducation } from './animations/education.js';
import { initContact } from './animations/contact.js';
import { initFooter, initClock, initBackToTop } from './animations/footer.js';
import { initClipboard } from './animations/ui.js';
import { initEasterEgg } from './animations/easter-egg.js';

const { gsap, ScrollTrigger } = libs;

state.motion = Boolean(gsap && ScrollTrigger && libs.SplitType) && !media.reduced.matches && !window.__failsafe;
root.classList.toggle('has-motion', state.motion);

if (gsap && ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
}

/* ---------- Features that work in every mode ---------- */
safe('hero photo height', syncHeroBg);
safe('theme', initTheme);
safe('menu', initMenu);
safe('anchors', initAnchors);
safe('clipboard', initClipboard);
safe('clock', initClock);
safe('back to top', initBackToTop);
safe('graph', initGraph);
safe('easter egg', initEasterEgg);
guardPlaceholderLinks();

/* ---------- Motion: what the first screen needs, right away ---------- */
if (state.motion) {
  safe('smooth scroll', initSmoothScroll);
  safe('hero prep', prepareHero);
  safe('nav', initNav);
  safe('progress', initProgress);
  safe('cursor', initCursor);
} else {
  root.classList.remove('show-preloader');
  $('.preloader')?.remove();
}
root.classList.remove('motion-pending');

/* ---------- Motion: everything below the fold ----------
   Each module runs in its own task (yielding to the browser in between), so
   start-up never blocks the main thread for long. They finish while the
   preloader is still on screen. */
const sectionsReady = runInChunks(state.motion ? [
  ['magnetic', initMagnetic],
  ['tilt', initTilt],
  ['section colours', initSectionColors],
  ['hero scroll', initHeroScroll],
  ['reveals', initReveals],
  ['about', initAbout],
  ['skills', initSkills],
  ['projects', initProjects],
  ['experience', initExperience],
  ['education', initEducation],
  ['contact', initContact],
  ['footer', initFooter]
] : []).then(() => {
  if (!state.motion) return;
  // Triggers below a pinned section must be measured after its pin spacing
  // exists, so sort every trigger into page order and re-measure. Repeat
  // once web fonts and images have changed the layout.
  const remeasure = () => { ScrollTrigger.sort(); ScrollTrigger.refresh(); };
  remeasure();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
  if (document.readyState !== 'complete') window.addEventListener('load', remeasure, { once: true });
});

/* ---------- Preloader → hero intro ---------- */
const introDone = Promise.resolve(state.motion ? safe('preloader', initPreloader) : null);
introDone.then(() => {
  if (!state.motion) return;
  safe('hero intro', playHero);
  safe('nav intro', showNav);
});
Promise.all([introDone, sectionsReady]).then(() => {
  if (!location.hash || !state.lenis) return;
  const target = $(location.hash);
  if (target) state.lenis.scrollTo(target, { immediate: true });
});

/* ---------- WebGL neural field ----------
   Three.js (~170 KB gzipped) is imported in idle time after the intro, so
   parsing it and rendering particles never stall the preloader or hero. */
Promise.all([introDone, sectionsReady]).then(() => whenIdle(loadNeural));

function runInChunks(tasks) {
  return new Promise((resolve) => {
    let i = 0;
    const next = () => {
      if (i >= tasks.length) { resolve(); return; }
      const [name, fn] = tasks[i++];
      safe(name, fn);
      setTimeout(next, 0);
    };
    setTimeout(next, 0);
  });
}

function whenIdle(fn) {
  if ('requestIdleCallback' in window) window.requestIdleCallback(() => fn(), { timeout: 1200 });
  else setTimeout(fn, 300);
}

async function loadNeural() {
  const canvas = $('[data-neural]');
  if (!canvas) return;
  try {
    const { createNeural } = await import('./webgl/neural.js');
    const neural = createNeural(canvas, {
      mobile: media.mobile.matches || !media.fine.matches,
      reduced: !state.motion,
      theme: state.theme
    });
    if (!neural) { canvas.remove(); return; }
    state.neural = neural;
    safe('neural triggers', () => bindNeural(neural));
  } catch (err) {
    console.warn('[portfolio] WebGL scene unavailable:', err);
    canvas.remove();
  }
}

/* Hero: visible, camera flies through as you scroll away.
   Contact: visible again, camera pulls back and particles form a ring. */
function bindNeural(neural) {
  if (!state.motion) {
    $('[data-neural]').classList.add('neural--static');
    neural.setVisible(true);
    return;
  }
  // Visibility comes from progress (updated on every scroll, even big jumps),
  // not onToggle: at scrollY = 0 the hero trigger is not "active" yet, so a
  // toggle would never fire when you leave it.
  let heroOn = true;
  let contactOn = false;
  const sync = () => neural.setVisible(heroOn || contactOn);

  ScrollTrigger.create({
    trigger: '.hero',
    start: 'top top',
    end: 'bottom top',
    onUpdate: (self) => {
      neural.setFly(self.progress);
      if (heroOn !== self.progress < 1) { heroOn = self.progress < 1; sync(); }
    }
  });
  ScrollTrigger.create({
    trigger: '#contact',
    start: 'top bottom',
    end: 'center center',
    onUpdate: (self) => { neural.setFly(1 - self.progress); neural.setConverge(self.progress); }
  });
  ScrollTrigger.create({
    trigger: '#contact',
    start: 'top bottom',
    endTrigger: '.footer',
    end: 'bottom bottom',
    onUpdate: (self) => {
      if (contactOn !== self.progress > 0) { contactOn = self.progress > 0; sync(); }
    }
  });
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
  sync();
}

/* Links still pointing at "[PLACEHOLDER]" do nothing and log a reminder */
function guardPlaceholderLinks() {
  $$('a[href^="["]').forEach((a) => {
    const token = a.getAttribute('href');
    a.title = `Placeholder: replace ${token} in index.html`;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      console.warn('[portfolio] Placeholder link not replaced yet:', token);
    });
  });
}

window.__siteReady = true;
