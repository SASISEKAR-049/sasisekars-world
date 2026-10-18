/* ==========================================================================
   Skills section.
   - Infinite marquee rows in alternating directions. Each row is cloned until
     it is wider than two screens, then moved every frame on GSAP's ticker.
     Scroll velocity (from Lenis) speeds the rows up and skews them.
   - Skill tags stagger in when their card enters the screen.
   ========================================================================== */

import { $, $$, libs, state, clamp } from './utils.js';

export function initSkills() {
  const { gsap, ScrollTrigger } = libs;

  /* Marquees */
  const rows = $$('[data-marquee]').map((el, i) => {
    const track = $('.marquee__track', el);
    const group = $('.marquee__group', el);
    let guard = 0;
    while (track.scrollWidth < window.innerWidth * 2.4 && guard++ < 10) track.appendChild(group.cloneNode(true));
    const dir = parseFloat(el.dataset.dir) || -1;
    return {
      track,
      group,
      dir,
      speed: 0.55 + i * 0.12,
      width: group.offsetWidth,
      x: dir > 0 ? -group.offsetWidth : 0,
      skew: gsap.quickTo(track, 'skewX', { duration: 0.5, ease: 'power3' })
    };
  });

  const measure = () => rows.forEach((r) => { r.width = r.group.offsetWidth; });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  window.addEventListener('resize', measure);

  let visible = false;
  ScrollTrigger.create({
    trigger: '.marquees',
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => { visible = self.isActive; }
  });

  gsap.ticker.add(() => {
    if (!visible) return;
    const v = state.velocity || 0;
    const boost = 1 + Math.min(Math.abs(v), 60) * 0.12;
    rows.forEach((r) => {
      r.x += r.dir * r.speed * boost;
      if (r.x <= -r.width) r.x += r.width;
      if (r.x > 0) r.x -= r.width;
      gsap.set(r.track, { x: r.x });
      r.skew(clamp(-v * 0.35, -12, 12));
    });
  });

  /* Tags stagger in per card */
  const cards = $$('.skill-card');
  gsap.set($$('.skill-card .tag'), { opacity: 0, y: 14 });
  ScrollTrigger.batch(cards, {
    start: 'top 88%',
    once: true,
    onEnter: (batch) => batch.forEach((card, i) => {
      gsap.to($$('.tag', card), { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.06, delay: 0.25 + i * 0.1 });
    })
  });
}
