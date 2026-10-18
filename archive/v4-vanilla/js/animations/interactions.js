/* ==========================================================================
   Pointer micro-interactions (fine pointers only).
   initMagnetic()  [data-magnetic] elements pull toward the cursor and spring
                   back with an elastic ease. data-magnetic="0.2" sets the pull.
   initTilt()      [data-tilt] cards rotate in 3D toward the cursor and feed
                   --mx / --my to a CSS glare gradient.
   ========================================================================== */

import { $$, libs, media } from '../utils.js';

export function initMagnetic() {
  if (!media.fine.matches) return;
  const { gsap } = libs;

  $$('[data-magnetic]').forEach((el) => {
    const pull = parseFloat(el.dataset.magnetic) || 0.35;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });

    el.addEventListener('pointerenter', () => gsap.killTweensOf(el, 'x,y'));
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * pull);
      yTo((e.clientY - (r.top + r.height / 2)) * pull);
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 1.2, ease: 'elastic.out(1, 0.35)', overwrite: true });
    });
  });
}

export function initTilt() {
  if (!media.fine.matches) return;
  const { gsap } = libs;

  $$('[data-tilt]').forEach((el) => {
    gsap.set(el, { transformPerspective: 1000 });
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.7, ease: 'power3' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.7, ease: 'power3' });

    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      ry((px - 0.5) * 9);
      rx((0.5 - py) * 9);
      el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    });
    el.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
}
