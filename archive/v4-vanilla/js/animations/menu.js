/* ==========================================================================
   Fullscreen menu.
   Opens with a clip-path circle that expands from the menu button, then the
   links rise in one by one. Hovering or focusing a link shows its preview
   image. Focus is kept inside the menu while it is open; Escape closes it.
   ========================================================================== */

import { root, $, $$, libs, state } from '../utils.js';

export function initMenu() {
  const btn = $('[data-menu-toggle]');
  const menu = $('#menu');
  if (!btn || !menu) return;

  const { gsap } = libs;
  const label = $('.menu-btn__label', btn);
  const links = $$('.menu__link', menu);
  const texts = $$('.menu__text', menu);
  const previews = $$('.menu__preview', menu);
  const foot = $('.menu__foot', menu);
  const behind = [$('main'), $('.footer')];
  let open = false;
  let closingTween = null;

  function circleAt(radius) {
    const r = btn.getBoundingClientRect();
    return `circle(${radius}px at ${r.left + r.width / 2}px ${r.top + r.height / 2}px)`;
  }
  function fullRadius() {
    const r = btn.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    return Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  }

  function setOpen(next) {
    if (next === open) return;
    open = next;
    btn.setAttribute('aria-expanded', String(open));
    if (label) label.textContent = open ? 'Close' : 'Menu';
    root.classList.toggle('menu-open', open);
    behind.forEach((el) => el && (open ? el.setAttribute('inert', '') : el.removeAttribute('inert')));

    if (open) {
      closingTween?.kill();
      state.lenis?.stop();
      menu.hidden = false;
      if (state.motion) {
        gsap.set('[data-header]', { yPercent: 0 });
        gsap.fromTo(menu, { clipPath: circleAt(0) }, { clipPath: circleAt(fullRadius()), duration: 0.9, ease: 'expo.inOut' });
        gsap.fromTo(texts, { yPercent: 110 }, { yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.06, delay: 0.3 });
        gsap.fromTo(foot, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out', delay: 0.6 });
      }
      links[0]?.focus({ preventScroll: true });
    } else {
      state.lenis?.start();
      const done = () => { menu.hidden = true; previews.forEach((p) => p.classList.remove('is-active')); };
      if (state.motion) {
        closingTween = gsap.to(menu, { clipPath: circleAt(0), duration: 0.7, ease: 'expo.inOut', onComplete: done });
      } else {
        done();
      }
    }
  }

  btn.addEventListener('click', () => setOpen(!open));

  // Clicking a link closes the menu first; the anchor handler then scrolls
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });

  // Preview images
  const showPreview = (key) => previews.forEach((p) => p.classList.toggle('is-active', p.dataset.preview === key));
  links.forEach((link) => {
    link.addEventListener('pointerenter', () => showPreview(link.dataset.previewKey));
    link.addEventListener('focus', () => showPreview(link.dataset.previewKey));
  });

  // Keyboard: Escape closes, Tab cycles between the menu button and the menu
  document.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') {
      setOpen(false);
      btn.focus();
      return;
    }
    if (e.key === 'Tab') {
      const focusables = [btn, ...$$('a, button', menu)];
      const index = focusables.indexOf(document.activeElement);
      const last = focusables.length - 1;
      if (e.shiftKey && index <= 0) { e.preventDefault(); focusables[last].focus(); }
      else if (!e.shiftKey && index === last) { e.preventDefault(); focusables[0].focus(); }
      else if (index === -1) { e.preventDefault(); focusables[0].focus(); }
    }
  });
}
