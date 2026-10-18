/* ==========================================================================
   Scrolling.
   - Lenis smooth scroll, driven by GSAP's ticker and synced to ScrollTrigger
   - Anchor links scroll smoothly (Lenis, or native when motion is off)
   - Scroll progress bar + the hero's live "00%" readout
   - Section colour transitions: each section's data-bg names a CSS colour
     token and the page background eases to it as the section takes over
   ========================================================================== */

import { $, $$, libs, media, state, cssVar, onThemeChange } from './utils.js';

export function initSmoothScroll() {
  const { Lenis, gsap, ScrollTrigger } = libs;
  if (!Lenis) return;

  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
  state.lenis = lenis;
  window.__lenis = lenis; // handy for debugging in the console

  lenis.on('scroll', (e) => {
    state.velocity = e.velocity || 0;
    ScrollTrigger.update();
  });
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

export function scrollToTarget(target, options = {}) {
  if (state.lenis) {
    state.lenis.scrollTo(target, {
      duration: 1.6,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      ...options
    });
    return;
  }
  const y = typeof target === 'number'
    ? target
    : target.getBoundingClientRect().top + window.scrollY - parseFloat(cssVar('--header-h') || '72');
  window.scrollTo({ top: y, behavior: media.reduced.matches ? 'auto' : 'smooth' });
}

export function initAnchors() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented) return;
    const hash = a.getAttribute('href');
    if (hash.length < 2) return;
    const target = $(hash);
    if (!target) return;
    e.preventDefault();

    const isTop = hash === '#top';
    scrollToTarget(isTop ? 0 : target, { offset: isTop ? 0 : -parseFloat(cssVar('--header-h') || '72') });
    history.replaceState(null, '', hash);

    // Move keyboard focus to the destination
    const focusTarget = isTop ? $('#main') : target;
    if (!focusTarget.hasAttribute('tabindex')) focusTarget.setAttribute('tabindex', '-1');
    focusTarget.focus({ preventScroll: true });
  });
}

export function initProgress() {
  const { gsap } = libs;
  const bar = $('.progress span');
  const pct = $('[data-scroll-pct]');
  gsap.to(bar, {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: {
      start: 0,
      end: 'max',
      scrub: 0.3,
      onUpdate: (self) => {
        if (pct) pct.textContent = `${String(Math.round(self.progress * 100)).padStart(2, '0')}%`;
      }
    }
  });
}

export function initSectionColors() {
  const { gsap, ScrollTrigger } = libs;
  let current = 'bg';

  const tweenTo = (key, duration = 0.9) => {
    current = key;
    gsap.to(document.body, { backgroundColor: cssVar(`--${key}`), duration, ease: 'power2.out', overwrite: true });
  };

  $$('[data-bg]').forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => { if (self.isActive) tweenTo(section.dataset.bg); }
    });
  });

  // The token values change with the theme, so re-apply instantly
  onThemeChange(() => tweenTo(current, 0));
}
