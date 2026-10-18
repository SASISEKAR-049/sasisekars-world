/* ==========================================================================
   Hero — the signature moment.
   prepareHero()    Splits "SASISEKAR" / "R L" into characters and hides them
                    below their line masks (runs behind the preloader). The
                    full-screen photo is cut into strips, each under a cover.
   syncHeroBg()     Keeps the page-level photo layer as tall as the hero.
   playHero()       Characters rise with stagger and a slight rotation
                    (expo.out), the kicker decodes from random glyphs, the
                    rest fades up and the typewriter loop starts.
   initHeroScroll() Scrolling away scales and blurs the name out, pushes the
                    two lines apart and fades the supporting text.
   ========================================================================== */

import { $, $$, libs } from '../utils.js';
import { scramble, typeLoop } from './text-fx.js';

const ROLES = ['Python Developer', 'Django Backend Engineer', 'ML Enthusiast', 'Computer Vision Builder'];

let chars = [];
let strips = [];
let kicker = null;
let kickerText = '';

export function prepareHero() {
  const { gsap, SplitType } = libs;
  const split = new SplitType('[data-hero-line]', { types: 'chars' });
  chars = split.chars || [];
  gsap.set(chars, { yPercent: 118, rotate: 10, transformOrigin: '0% 100%' });
  gsap.set('[data-hero-fade]', { opacity: 0, y: 32 });
  cutHeroPhoto();

  kicker = $('[data-scramble]');
  if (kicker) {
    kickerText = kicker.textContent;
    kicker.textContent = ' ';
  }
}

export function playHero() {
  const { gsap } = libs;
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

  if (strips.length) {
    // Photo strips open from the centre outwards (alternate up / down) while
    // each slice slides back into line and the image settles from 1.12×
    const order = { each: 0.08, from: 'center' };
    tl.to(strips.map((s) => $('.hero-bg__cover', s)), { scaleY: 0, duration: 1.4, ease: 'expo.inOut', stagger: order }, 0)
      .to(strips.map((s) => $('img', s)), { yPercent: 0, scale: 1, duration: 2.1, stagger: order }, 0.1);
  }

  tl.to(chars, { yPercent: 0, rotate: 0, duration: 1.7, stagger: 0.045 }, 0.15)
    .add(() => { if (kicker) scramble(kicker, kickerText, 1.4); }, 0.15)
    .to('[data-hero-fade]', { opacity: 1, y: 0, duration: 1.3, stagger: 0.09 }, 0.55)
    .add(() => {
      const typer = $('[data-typer]');
      if (typer) typeLoop(typer, ROLES);
    }, 1.6);

  return tl;
}

/* Cut the full-screen photo into vertical strips (motion mode only) */
function cutHeroPhoto() {
  const { gsap } = libs;
  const bg = $('[data-hero-bg]');
  if (!bg) return;
  const wrap = $('.hero-bg__strips', bg);
  const first = $('.hero-bg__strip', wrap);
  const n = window.innerWidth < 768 ? 5 : 8;
  bg.style.setProperty('--n', n);
  for (let i = 1; i < n; i++) {
    const strip = first.cloneNode(true);
    strip.style.setProperty('--i', i);
    wrap.appendChild(strip);
  }
  strips = $$('.hero-bg__strip', wrap);
  gsap.set(strips.map((s) => $('.hero-bg__cover', s)), { transformOrigin: (i) => (i % 2 ? '50% 100%' : '50% 0%') });
  gsap.set(strips.map((s) => $('img', s)), { yPercent: (i) => (i % 2 ? 10 : -10), scale: 1.12 });
}

/* Keep the page-level photo layer exactly as tall as the hero (all modes) */
export function syncHeroBg() {
  const bg = $('[data-hero-bg]');
  const hero = $('.hero');
  if (!bg || !hero) return;
  const set = () => { bg.style.height = `${hero.offsetHeight}px`; };
  set();
  if ('ResizeObserver' in window) new ResizeObserver(set).observe(hero);
  else window.addEventListener('resize', set);
}

export function initHeroScroll() {
  const { gsap } = libs;
  const hero = $('.hero');
  if (!hero) return;
  const lines = $$('.hero__line', hero);

  const tl = gsap.timeline({
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
  });

  // Photo strips split apart, alternately up and down
  if (strips.length) tl.to(strips, { yPercent: (i) => (i % 2 ? 24 : -24), ease: 'none' }, 0);

  tl
    .fromTo('.hero__name',
      { scale: 1, yPercent: 0, filter: 'blur(0px)', opacity: 1 },
      { scale: 1.14, yPercent: -16, filter: 'blur(16px)', opacity: 0, ease: 'none' }, 0)
    .to(lines[0], { xPercent: -7, ease: 'none' }, 0)
    .to(lines[1], { xPercent: 9, ease: 'none' }, 0)
    // Explicit start values, and only elements the intro does not animate,
    // so this scrubbed timeline never captures the hidden pre-intro state.
    .fromTo(['.hero__kicker', '.hero__grid', '.scroll-cue > *'],
      { yPercent: 0, opacity: 1 },
      { yPercent: -60, opacity: 0, ease: 'none', stagger: 0.02 }, 0);
}
