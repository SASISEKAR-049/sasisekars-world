/* ==========================================================================
   Navigation.
   - Slides in after the preloader (showNav)
   - Hides when scrolling down, comes back when scrolling up or at the top
   - Highlights the link of the section currently in view
   ========================================================================== */

import { root, $, $$, libs } from './utils.js';

let header = null;

export function initNav() {
  const { gsap, ScrollTrigger } = libs;
  header = $('[data-header]');
  if (!header) return;
  gsap.set(header, { yPercent: -100, opacity: 0 });

  let hidden = false;
  const show = () => { hidden = false; gsap.to(header, { yPercent: 0, duration: 0.6, ease: 'power3.out', overwrite: 'auto' }); };
  const hide = () => { hidden = true; gsap.to(header, { yPercent: -110, duration: 0.6, ease: 'power3.out', overwrite: 'auto' }); };

  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      if (root.classList.contains('menu-open')) return;
      const y = self.scroll();
      if (self.direction === 1 && y > 140 && !hidden) hide();
      else if ((self.direction === -1 || y <= 140) && hidden) show();
    }
  });

  // Keyboard users tabbing into the header always see it
  header.addEventListener('focusin', () => { if (hidden) show(); });

  // Active link
  const links = $$('.nav__link');
  $$('main section[id]').forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: (self) => {
        if (!self.isActive) return;
        links.forEach((a) => {
          const on = a.getAttribute('href') === `#${section.id}`;
          a.classList.toggle('is-active', on);
          if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
        });
      }
    });
  });
}

export function showNav() {
  if (!header) return;
  libs.gsap.to(header, { yPercent: 0, opacity: 1, duration: 1.1, ease: 'expo.out' });
}
