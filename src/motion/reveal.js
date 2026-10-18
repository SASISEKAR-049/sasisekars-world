/* ==========================================================================
   Generic scroll reveals, driven by data attributes in the HTML:

   data-reveal="lines"  Heading splits into lines; words slide up from behind
                        a mask, line by line. The split is reverted when done
                        so the heading is plain text again.
   data-reveal="fade"   Block fades and rises in (batched for staggering).
   data-reveal="image"  Container unmasks with a clip-path wipe while the
                        image scales from 1.3 to 1.
   data-speed="-0.2"    Parallax: moves by speed × its height while the
                        section crosses the screen.
   ========================================================================== */

import { $$, libs } from './utils.js';

export function initReveals() {
  const { gsap, ScrollTrigger, SplitType } = libs;

  // Masked line reveals
  $$('[data-reveal="lines"]').forEach((el) => {
    const split = new SplitType(el, { types: 'lines, words' });
    el.classList.add('split-lines');
    gsap.set(split.words, { yPercent: 120 });
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => {
        gsap.to(split.words, {
          yPercent: 0,
          duration: 1.3,
          ease: 'expo.out',
          stagger: 0.07,
          onComplete: () => { split.revert(); el.classList.remove('split-lines'); }
        });
      }
    });
  });

  // Fade + rise
  const fades = $$('[data-reveal="fade"]');
  gsap.set(fades, { opacity: 0, y: 48 });
  ScrollTrigger.batch(fades, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.09, overwrite: true })
  });

  // Clip-path image reveals
  $$('[data-reveal="image"]').forEach((fig) => {
    const mask = fig.querySelector('.reveal-media') || fig;
    const img = fig.querySelector('img');
    gsap.set(mask, { clipPath: 'inset(100% 0% 0% 0%)' });
    if (img) gsap.set(img, { scale: 1.3 });
    ScrollTrigger.create({
      trigger: fig,
      start: 'top 82%',
      once: true,
      onEnter: () => {
        gsap.to(mask, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut' });
        if (img) gsap.to(img, { scale: 1, duration: 2, ease: 'expo.out', delay: 0.2 });
      }
    });
  });

  // Parallax layers
  $$('[data-speed]').forEach((el) => {
    const speed = parseFloat(el.dataset.speed) || 0;
    gsap.to(el, {
      yPercent: speed * 100,
      ease: 'none',
      scrollTrigger: {
        trigger: el.closest('section') || el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    });
  });
}
