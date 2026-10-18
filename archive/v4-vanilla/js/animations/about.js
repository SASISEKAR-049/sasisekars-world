/* ==========================================================================
   About section.
   - Word scrub: [data-scrub-words] text is split into words that light up one
     by one as you scroll. On desktop the quote is pinned while it fills in.
     Words go from a dim tone to full text colour (animating a --p variable
     into color-mix) so even the un-lit state keeps AA contrast.
   - Computer-vision scan over the portrait: the face box draws itself, the
     confidence score counts to 0.98 and a scan line sweeps the photo.
   - Stat counters count up when they enter the screen.
   ========================================================================== */

import { $, $$, libs, media } from '../utils.js';

export function initAbout() {
  const { gsap, ScrollTrigger, SplitType } = libs;

  /* Word scrub */
  $$('[data-scrub-words]').forEach((el) => {
    const split = new SplitType(el, { types: 'words' });
    split.words.forEach((w) => w.classList.add('scrub-word'));
    gsap.set(split.words, { '--p': 0 });

    const pinWrap = el.closest('[data-pin-quote]');
    const pin = Boolean(pinWrap) && media.desktop.matches;
    gsap.to(split.words, {
      '--p': 1,
      ease: 'none',
      stagger: 0.1,
      scrollTrigger: {
        trigger: pinWrap || el,
        start: pin ? 'top top' : 'top 82%',
        end: pin ? '+=110%' : 'bottom 50%',
        scrub: true,
        pin: pin ? pinWrap : false
      }
    });
  });

  /* Portrait scan */
  const scan = $('.scan');
  if (scan) {
    const box = $('.scan__box', scan);
    const corners = $('.scan__corners', scan);
    const tag = $('.scan__tag', scan);
    const score = $('[data-face-score]', scan);
    const line = $('.scan__line', scan);

    gsap.set(box, { strokeDashoffset: 1 });
    gsap.set([corners, tag], { opacity: 0 });
    gsap.set(line, { y: 0 });

    const sweep = gsap.fromTo(line, { y: 0 }, { y: 560, duration: 2.8, ease: 'sine.inOut', repeat: -1, repeatDelay: 0.4, paused: true });
    const shown = gsap.timeline({ paused: true })
      .to(box, { strokeDashoffset: 0, duration: 1.4, ease: 'expo.inOut' }, 0.4)
      .to(corners, { opacity: 1, duration: 0.3, repeat: 3, yoyo: true }, 0.9)
      .to(corners, { opacity: 1, duration: 0.2 })
      .to(tag, { opacity: 1, duration: 0.3 }, 1.5)
      .add(() => countScore(score), 1.5);

    ScrollTrigger.create({
      trigger: scan,
      start: 'top 75%',
      end: 'bottom top',
      onEnter: () => { shown.play(); sweep.play(); },
      onEnterBack: () => sweep.play(),
      onLeave: () => sweep.pause(),
      onLeaveBack: () => sweep.pause()
    });
  }

  /* Counters */
  $$('[data-count]').forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const counter = { value: 0 };
    el.textContent = (0).toFixed(decimals);
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => gsap.to(counter, {
        value: target,
        duration: 2.2,
        ease: 'expo.out',
        onUpdate: () => { el.textContent = counter.value.toFixed(decimals); }
      })
    });
  });
}

function countScore(el) {
  if (!el) return;
  const o = { v: 0 };
  libs.gsap.to(o, {
    v: 0.98,
    duration: 1.2,
    ease: 'power2.out',
    onUpdate: () => { el.textContent = `FACE_DETECTED: ${o.v.toFixed(2)}`; }
  });
}
