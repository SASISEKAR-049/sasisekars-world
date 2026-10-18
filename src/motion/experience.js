/* ==========================================================================
   Experience section.
   - The timeline rail (an SVG line) draws itself, scrubbed to scroll.
   - Cards are position: sticky (CSS), so each one pins and the next stacks
     on top. While the next card arrives, the previous one scales down and
     dims (scrubbed).
   - Each card's content slides in from alternating sides, and its year
     counts up quickly to the real value.
   ========================================================================== */

import { $, $$, libs } from './utils.js';

export function initExperience() {
  const { gsap, ScrollTrigger } = libs;
  const section = $('.xp');
  if (!section) return;

  gsap.fromTo('.xp__rail-draw', { strokeDashoffset: 1 }, {
    strokeDashoffset: 0,
    ease: 'none',
    scrollTrigger: { trigger: section, start: 'top 70%', end: 'bottom 60%', scrub: true }
  });

  const cards = $$('.xp-card', section);
  cards.forEach((card, i) => {
    const inner = $('.xp-card__inner', card);
    const fromLeft = i % 2 === 0;

    gsap.from(inner, {
      xPercent: fromLeft ? -18 : 18,
      rotationY: fromLeft ? 14 : -14,
      transformPerspective: 1200,
      opacity: 0,
      duration: 1.4,
      ease: 'expo.out',
      scrollTrigger: { trigger: card, start: 'top 88%', once: true }
    });

    const yearEl = $('[data-year]', card);
    if (yearEl) {
      const year = parseInt(yearEl.dataset.year, 10);
      const counter = { value: year - 26 };
      ScrollTrigger.create({
        trigger: card,
        start: 'top 80%',
        once: true,
        onEnter: () => gsap.to(counter, {
          value: year,
          duration: 1.6,
          ease: 'expo.out',
          onUpdate: () => { yearEl.textContent = Math.round(counter.value); }
        })
      });
    }

    // Dim with an opaque shade layer (not card opacity), so the card below
    // never shows through the one stacking on top of it.
    const next = cards[i + 1];
    if (next) {
      const shade = document.createElement('span');
      shade.className = 'xp-card__shade';
      shade.setAttribute('aria-hidden', 'true');
      inner.appendChild(shade);
      gsap.timeline({ scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 30%', scrub: true } })
        .to(card, { scale: 0.9, ease: 'none' }, 0)
        .to(shade, { opacity: 0.6, ease: 'none' }, 0);
    }
  });
}
