/* ==========================================================================
   Contact — the grand finale.
   - "LET'S BUILD SOMETHING." rises letter by letter, then every letter is
     pushed away from the cursor (and tilts) when it comes close. On touch
     devices the letters ripple in a wave instead.
   - The email copy button and its toast live in ui.js.
   - The particle ring forming behind the section is driven from main.js.
   ========================================================================== */

import { $, libs, media } from './utils.js';

export function initContact() {
  const { gsap, ScrollTrigger, SplitType } = libs;
  const title = $('[data-repel]');
  if (!title) return;

  const split = new SplitType(title, { types: 'words, chars' });
  const chars = split.chars || [];

  gsap.from(chars, {
    yPercent: 110,
    opacity: 0,
    duration: 1.3,
    ease: 'expo.out',
    stagger: 0.03,
    scrollTrigger: { trigger: title, start: 'top 85%', once: true }
  });

  if (!media.fine.matches) {
    ScrollTrigger.create({
      trigger: title,
      start: 'top 60%',
      once: true,
      onEnter: () => gsap.to(chars, { y: -18, duration: 0.4, ease: 'sine.out', yoyo: true, repeat: 1, stagger: 0.035, delay: 1.2 })
    });
    return;
  }

  const movers = chars.map((c) => ({
    x: gsap.quickTo(c, 'x', { duration: 0.8, ease: 'power3' }),
    y: gsap.quickTo(c, 'y', { duration: 0.8, ease: 'power3' }),
    r: gsap.quickTo(c, 'rotation', { duration: 0.8, ease: 'power3' })
  }));
  const RADIUS = 170;
  const PUSH = 56;

  // Untransformed centre of a character, measured with offset* (ignores transforms)
  function centre(el) {
    let x = el.offsetWidth / 2;
    let y = el.offsetHeight / 2;
    let node = el;
    while (node && node !== title) {
      x += node.offsetLeft;
      y += node.offsetTop;
      node = node.offsetParent;
    }
    return { x, y };
  }

  const section = title.closest('section');
  section.addEventListener('pointermove', (e) => {
    const box = title.getBoundingClientRect();
    chars.forEach((c, i) => {
      const p = centre(c);
      const dx = box.left + p.x - e.clientX;
      const dy = box.top + p.y - e.clientY;
      const d = Math.hypot(dx, dy) || 1;
      if (d < RADIUS) {
        const f = 1 - d / RADIUS;
        movers[i].x((dx / d) * f * PUSH);
        movers[i].y((dy / d) * f * PUSH);
        movers[i].r((dx / d) * f * 16);
      } else {
        movers[i].x(0); movers[i].y(0); movers[i].r(0);
      }
    });
  });
  section.addEventListener('pointerleave', () => movers.forEach((m) => { m.x(0); m.y(0); m.r(0); }));
}
