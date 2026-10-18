/* ==========================================================================
   Entry screen + preloader (every visit, except deep links to a section).
   1. A blank black screen with a single "View Portfolio" button (focused, so
      Enter works). Everything behind it is inert.
   2. Clicking it runs the boot sequence: a 000 → 100% counter while three
      terminal lines type out (about 2.1 s).
   3. The screen splits into two panels that wipe upward with clip-path, and
      the hero intro starts while the panels are still leaving.
   Returns a Promise that resolves when the hero should start.
   ========================================================================== */

import { root, $, $$, libs, state } from './utils.js';

export function initPreloader() {
  const el = $('.preloader');
  if (!el || !root.classList.contains('show-preloader')) {
    el?.remove();
    root.classList.remove('show-preloader');
    return Promise.resolve();
  }

  const { gsap } = libs;
  state.lenis?.stop();

  const gate = $('.preloader__gate', el);
  const btn = $('.preloader__enter', el);
  const content = $('.preloader__content', el);
  const num = $('.preloader__num', el);
  const bar = $('.preloader__bar span', el);
  const lines = $$('.preloader__line', el);
  const panels = $$('.preloader__panel', el);
  const behind = [$('[data-header]'), $('main'), $('.footer')];
  behind.forEach((node) => node?.setAttribute('inert', ''));

  return new Promise((resolve) => {
    /* 1. Entry screen */
    el.classList.add('is-ready');
    gsap.from($$('.preloader__gate > *', el), { y: 28, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.12 });
    btn.focus({ preventScroll: true });
    btn.addEventListener('click', boot, { once: true });

    /* 2–3. Boot sequence and reveal */
    function boot() {
      btn.disabled = true;
      const counter = { value: 0 };
      const start = 0.55;   // after the entry screen has faded
      const tl = gsap.timeline();

      tl.to(gate, { opacity: 0, scale: 0.96, duration: 0.5, ease: 'power2.in' }, 0)
        .set(gate, { display: 'none' })
        .set(content, { visibility: 'visible' }, start - 0.05)
        .fromTo(content, { opacity: 0 }, { opacity: 1, duration: 0.4 }, start - 0.05)
        .to(counter, {
          value: 100,
          duration: 2.1,
          ease: 'power2.inOut',
          onUpdate: () => {
            num.textContent = String(Math.round(counter.value)).padStart(3, '0');
            bar.style.transform = `scaleX(${counter.value / 100})`;
          }
        }, start);

      lines.forEach((line, i) => tl.add(typeLine(line, line.dataset.text || ''), start + 0.15 + i * 0.62));

      tl.to(content, { opacity: 0, yPercent: -6, duration: 0.45, ease: 'power2.in' }, start + 2.2)
        .to(panels, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.05, ease: 'expo.inOut', stagger: 0.12 }, start + 2.4)
        .add(() => {
          behind.forEach((node) => node?.removeAttribute('inert'));
          resolve();
        }, start + 2.7)
        .add(() => {
          el.remove();
          root.classList.remove('show-preloader');
          state.lenis?.start();
          $('#main')?.focus({ preventScroll: true });
        }, start + 3.6);
    }
  });
}

function typeLine(el, text) {
  const { gsap } = libs;
  const progress = { n: 0 };
  return gsap.to(progress, {
    n: text.length,
    duration: text.length * 0.022,
    ease: 'none',
    onUpdate: () => { el.textContent = text.slice(0, Math.round(progress.n)); }
  });
}
