/* ==========================================================================
   Education, certifications and achievements rows.
   - Each row's bottom line draws left → right, then its cells slide in.
   - On hover, the row fills left → right (CSS) and a small label with the
     row's data-preview text follows the cursor (fine pointers only).
   ========================================================================== */

import { $, $$, libs, media } from './utils.js';

export function initEducation() {
  const { gsap, ScrollTrigger } = libs;

  $$('.row').forEach((row) => {
    const line = $('.row__line', row);
    const cells = $$('.row__cell', row);
    gsap.set(line, { scaleX: 0 });
    gsap.set(cells, { opacity: 0, y: 28 });
    ScrollTrigger.create({
      trigger: row,
      start: 'top 90%',
      once: true,
      onEnter: () => gsap.timeline()
        .to(line, { scaleX: 1, duration: 1.1, ease: 'expo.inOut' })
        .to(cells, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.07 }, '-=0.6')
    });
  });

  const tip = $('.row-preview');
  if (!tip || !media.fine.matches) return;
  const xTo = gsap.quickTo(tip, 'x', { duration: 0.45, ease: 'power3' });
  const yTo = gsap.quickTo(tip, 'y', { duration: 0.45, ease: 'power3' });

  $$('.row[data-preview]').forEach((row) => {
    row.addEventListener('pointerenter', (e) => {
      tip.textContent = row.dataset.preview;
      gsap.set(tip, { x: e.clientX, y: e.clientY });
      tip.classList.add('is-on');
    });
    row.addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); });
    row.addEventListener('pointerleave', () => tip.classList.remove('is-on'));
  });
}
