/* ==========================================================================
   Footer.
   - Curtain effect: the footer content starts shifted up and settles as the
     page reaches the bottom, so it looks uncovered from beneath the content;
     the giant SASISEKAR wordmark rises letter by letter.
   - Live IST clock (works without motion).
   - Back to top: the arrow launches upward, then the page scrolls home.
   ========================================================================== */

import { $, $$, libs, state } from './utils.js';
import { scrollToTarget } from './scroll.js';

export function initFooter() {
  const { gsap, SplitType } = libs;
  const footer = $('[data-footer]');
  if (!footer) return;

  gsap.fromTo('[data-footer-inner]', { yPercent: -40 }, {
    yPercent: 0,
    ease: 'none',
    scrollTrigger: { trigger: footer, start: 'top bottom', end: 'bottom bottom', scrub: true }
  });

  const mark = $('.footer__mark', footer);
  if (mark) {
    const split = new SplitType(mark, { types: 'chars' });
    gsap.from(split.chars, {
      yPercent: 100,
      opacity: 0,
      duration: 1.4,
      ease: 'expo.out',
      stagger: 0.05,
      scrollTrigger: { trigger: footer, start: 'top 75%', once: true }
    });
  }
}

export function initClock() {
  const el = $('[data-clock]');
  if (!el) return;
  let fmt = null;
  try {
    fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  } catch (e) { /* very old browser */ }

  const tick = () => {
    const now = new Date();
    if (fmt) {
      el.textContent = fmt.format(now);
    } else {
      const ist = new Date(now.getTime() + (330 + now.getTimezoneOffset()) * 60000);
      el.textContent = ist.toTimeString().slice(0, 8);
    }
    el.setAttribute('datetime', now.toISOString());
  };
  tick();
  setInterval(tick, 1000);
}

export function initBackToTop() {
  $$('[data-top]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const arrow = $('.footer__top-arrow', link);
      if (state.motion && arrow) {
        libs.gsap.timeline()
          .to(arrow, { y: -48, opacity: 0, duration: 0.35, ease: 'power2.in' })
          .set(arrow, { y: 48 })
          .to(arrow, { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out' }, '+=0.5');
      }
      scrollToTarget(0, { duration: 2.2 });
      $('#main')?.focus({ preventScroll: true });
    });
  });
}
