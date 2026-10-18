/* ==========================================================================
   Custom cursor: a dot that follows the pointer closely and a ring that
   trails it with easing (gsap.quickTo). Both use mix-blend-mode: difference.
   Hovering something with data-cursor="LABEL" grows the ring and shows the
   label; plain links show "OPEN", buttons just grow the ring.
   Only enabled for fine pointers (mouse / trackpad).
   ========================================================================== */

import { root, $, libs, media, state } from '../utils.js';

export function initCursor() {
  const el = $('.cursor');
  if (!el || !media.fine.matches) return;

  const { gsap } = libs;
  const dot = $('.cursor__dot', el);
  const ring = $('.cursor__ring', el);
  const label = $('.cursor__label', el);
  root.classList.add('has-cursor');

  const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
  const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
  const ringX = gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3' });
  const ringY = gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3' });

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    state.pointer.x = e.clientX;
    state.pointer.y = e.clientY;
    dotX(e.clientX); dotY(e.clientY);
    ringX(e.clientX); ringY(e.clientY);
    el.classList.add('is-visible');
  }, { passive: true });

  document.documentElement.addEventListener('mouseleave', () => el.classList.remove('is-visible'));
  window.addEventListener('pointerdown', () => el.classList.add('is-down'));
  window.addEventListener('pointerup', () => el.classList.remove('is-down'));

  document.addEventListener('pointerover', (e) => {
    const target = e.target.closest('[data-cursor], a, button, [role="button"]');
    if (!target) return set('', false);
    const text = target.dataset.cursor ?? (target.tagName === 'A' ? 'OPEN' : '');
    set(text, true);
  });

  function set(text, hover) {
    el.classList.toggle('is-hover', hover);
    el.classList.toggle('is-label', Boolean(text));
    label.textContent = text;
  }
}
