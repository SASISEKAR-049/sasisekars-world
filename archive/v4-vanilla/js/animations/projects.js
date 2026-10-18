/* ==========================================================================
   Projects section.
   - Horizontal gallery (≥1024px): the gallery pins and its track scrolls
     sideways while you scroll down; card images drift inside their masks.
     Smaller screens keep the stacked card layout from the CSS.
   - Distortion hover: on fine pointers the card image runs through the SVG
     filter #fx-distort (turbulence displacement + red/cyan channel split),
     which spikes on enter and settles like a liquid ripple.
   - Architecture diagram draws itself with stroke-dashoffset as you scroll,
     then animated "data packets" flow along the connections.
   - Pipeline steps light up in sequence while on screen.
   ========================================================================== */

import { $, $$, libs, media } from '../utils.js';

export function initProjects() {
  const { gsap, ScrollTrigger } = libs;

  /* Horizontal gallery */
  const gallery = $('[data-gallery]');
  const track = $('[data-gallery-track]');
  if (gallery && track) {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1024px)', () => {
      gallery.classList.add('gallery--horizontal');
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const slide = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: gallery,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1
        }
      });
      $$('.card__zoom img', track).forEach((img) => {
        gsap.fromTo(img, { xPercent: -3.5 }, {
          xPercent: 3.5,
          ease: 'none',
          scrollTrigger: { trigger: img.closest('.card'), containerAnimation: slide, start: 'left right', end: 'right left', scrub: true }
        });
      });
      return () => gallery.classList.remove('gallery--horizontal');
    });
  }

  /* Distortion hover */
  const filter = $('#fx-distort');
  if (filter && media.fine.matches) {
    const displace = $('feDisplacementMap', filter);
    const shift = $('feOffset', filter);
    const fx = { scale: 0, dx: 0 };
    const apply = () => {
      displace.setAttribute('scale', fx.scale.toFixed(2));
      shift.setAttribute('dx', fx.dx.toFixed(2));
    };
    $$('[data-distort]').forEach((m) => {
      m.addEventListener('pointerenter', () => {
        m.classList.add('is-distorting');
        gsap.fromTo(fx, { scale: 70, dx: 12 }, { scale: 0, dx: 0, duration: 1.3, ease: 'expo.out', onUpdate: apply, overwrite: true });
      });
      m.addEventListener('pointerleave', () => {
        gsap.timeline({ onUpdate: apply, onComplete: () => m.classList.remove('is-distorting') })
          .to(fx, { scale: 36, dx: 7, duration: 0.2, ease: 'power2.out', overwrite: true })
          .to(fx, { scale: 0, dx: 0, duration: 0.6, ease: 'power3.out' });
      });
    });
  }

  /* Architecture diagram */
  $$('[data-arch]').forEach((fig) => {
    $$('.arch__svg', fig).forEach((svg) => {
      const nodes = $$('.arch-node', svg);
      const edges = $$('.arch-edge', svg);
      gsap.set($$('rect', svg), { strokeDashoffset: 1 });
      gsap.set(edges, { strokeDashoffset: 1 });
      gsap.set($$('text', svg), { opacity: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: fig,
          start: 'top 78%',
          end: 'bottom 55%',
          scrub: 1,
          onLeave: () => fig.classList.add('is-live'),
          onEnterBack: () => fig.classList.add('is-live'),
          onLeaveBack: () => fig.classList.remove('is-live')
        }
      });
      nodes.forEach((node, i) => {
        tl.to($('rect', node), { strokeDashoffset: 0, duration: 1, ease: 'none' })
          .to($$('text', node), { opacity: 1, duration: 0.4, stagger: 0.1 }, '<0.5');
        if (edges[i]) tl.to(edges[i], { strokeDashoffset: 0, duration: 0.7, ease: 'none' });
      });
      tl.add(() => fig.classList.add('is-live'));
    });
  });

  /* Pipeline sequence */
  const pipeline = $('[data-pipeline]');
  if (pipeline) {
    const steps = $$('.step', pipeline);
    const bar = $('.pipeline__bar', pipeline);
    const seq = gsap.timeline({ repeat: -1, paused: true, repeatDelay: 0.6 });
    steps.forEach((step, i) => {
      seq.add(() => {
        steps.forEach((s, j) => {
          s.classList.toggle('is-active', j === i);
          s.classList.toggle('is-done', j < i);
        });
        bar.style.transform = `scaleX(${(i + 1) / steps.length})`;
      }, i * 1.1);
    });
    seq.add(() => {}, steps.length * 1.1);
    ScrollTrigger.create({
      trigger: pipeline,
      start: 'top 85%',
      end: 'bottom 15%',
      onToggle: (self) => (self.isActive ? seq.play() : seq.pause())
    });
  }
}
