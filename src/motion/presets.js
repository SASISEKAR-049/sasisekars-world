/* ==========================================================================
   Motion presets: every easing, duration, spring and reusable variant.
   Components import from here instead of writing numbers inline, so the
   whole site moves with one voice.

   Variants use two states everywhere: "hidden" (before) and "show" (after).
   ========================================================================== */

/* ---------- Easing: the two house curves, plus helpers ---------- */
export const ease = {
  io: [0.76, 0, 0.24, 1],        // --ease-io: wipes, draws, anything that travels
  outExpo: [0.16, 1, 0.3, 1],    // --ease-out-expo: reveals that land softly
  in: [0.55, 0.06, 0.68, 0.19],  // exits
  sine: [0.37, 0, 0.63, 1],      // gentle loops
  linear: 'linear'
};

/* ---------- Durations (seconds) ---------- */
export const duration = {
  fast: 0.25,     // hover feedback, small fades
  base: 0.6,      // UI state changes
  slow: 1.1,      // block reveals
  reveal: 1.3,    // text reveals
  hero: 1.7,      // the name
  calm: 0.5       // opacity-only fade used when motion is reduced
};

/* ---------- Springs ---------- */
export const spring = {
  dot: { stiffness: 1400, damping: 70, mass: 0.4 },      // cursor dot: almost glued to the pointer
  ring: { stiffness: 170, damping: 24, mass: 0.7 },      // cursor ring: trails behind
  follow: { stiffness: 260, damping: 28, mass: 0.6 },    // labels and magnets following the pointer
  soft: { stiffness: 120, damping: 20, mass: 0.8 },      // tilt, repelled letters
  scrub: { stiffness: 140, damping: 30, mass: 0.6 },     // smooths scroll-linked progress
  elastic: { type: 'spring', stiffness: 170, damping: 9, mass: 0.9 },   // magnet release
  press: { type: 'spring', stiffness: 500, damping: 30 }                // tap feedback
};

/* ---------- Reveal variants ----------
   Every "hidden" state is also opacity 0 and every "show" restores it. With
   full motion that switch is instant (the movement is the effect); with
   reduced motion the movement is dropped and the fade is all that plays. */
const appear = { duration: 0.01 };

/* Block fades and rises in */
export const fadeUp = {
  hidden: { opacity: 0, y: 48 },
  show: { opacity: 1, y: 0, transition: { duration: duration.slow, ease: ease.outExpo } }
};

/* Smaller rise for items inside an already revealed block */
export const fadeUpSmall = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: ease.outExpo } }
};

/* Parent that plays its children one after another */
export const staggerChildren = (stagger = 0.09, delayChildren = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } }
});

/* A word slides up from behind its mask (headings) */
export const lineReveal = {
  hidden: { y: '120%', opacity: 0 },
  show: { y: '0%', opacity: 1, transition: { duration: duration.reveal, ease: ease.outExpo, opacity: appear } }
};

/* A character rises with a slight rotation (the hero name) */
export const charReveal = {
  hidden: { y: '118%', rotate: 10, opacity: 0 },
  show: { y: '0%', rotate: 0, opacity: 1, transition: { duration: duration.hero, ease: ease.outExpo, opacity: appear } }
};

/* A character rises and fades (contact title, footer wordmark) */
export const charRise = {
  hidden: { y: '110%', opacity: 0 },
  show: { y: '0%', opacity: 1, transition: { duration: duration.reveal, ease: ease.outExpo } }
};

/* Container unmasks from the bottom edge upward */
export const clipReveal = {
  hidden: { clipPath: 'inset(100% 0% 0% 0%)', opacity: 0 },
  show: { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1, transition: { duration: 1.5, ease: ease.io, opacity: appear } }
};

/* Image settles from a slight zoom inside a clipReveal */
export const zoomSettle = {
  hidden: { scale: 1.3 },
  show: { scale: 1, transition: { duration: 2, ease: ease.outExpo, delay: 0.2 } }
};

/* A rule draws from the left */
export const drawLine = {
  hidden: { scaleX: 0, opacity: 0 },
  show: { scaleX: 1, opacity: 1, transition: { duration: duration.slow, ease: ease.io, opacity: appear } }
};

/* ---------- Pointer behaviours (used by useMagnetic / useTilt) ---------- */
export const magnetic = {
  strength: 0.35,                                     // share of the pointer offset the element travels
  follow: { type: 'spring', ...spring.follow },
  release: spring.elastic
};

export const tilt = {
  max: 9,                                             // degrees
  perspective: 1000,
  spring: spring.soft
};

/* ---------- Hover / press states for links and buttons ---------- */
export const press = { scale: 0.97, transition: spring.press };
export const pressSoft = { scale: 0.985, transition: spring.press };
export const hoverTransition = { duration: 0.55, ease: ease.io };

/* ---------- Helpers ---------- */

/* Same variants, with each item's "show" delayed by its index (custom) */
const timedCache = new WeakMap();
export function timed(variants, stagger = 0, delay = 0) {
  const key = `${stagger}|${delay}`;
  let byKey = timedCache.get(variants);
  if (!byKey) timedCache.set(variants, (byKey = new Map()));
  if (!byKey.has(key)) {
    byKey.set(key, {
      ...variants,
      show: (i = 0) => {
        const show = typeof variants.show === 'function' ? variants.show(i) : variants.show;
        return { ...show, transition: { ...show.transition, delay: delay + i * stagger + (show.transition?.delay || 0) } };
      }
    });
  }
  return byKey.get(key);
}

/* Calm version of any reveal, for visitors who prefer reduced motion:
   nothing travels, the element just fades in where it belongs. */
const calmCache = new WeakMap();
export function calm(variants) {
  if (!calmCache.has(variants)) {
    calmCache.set(variants, {
      ...variants,
      show: (i) => {
        const show = typeof variants.show === 'function' ? variants.show(i) : variants.show;
        const { transition = {}, ...target } = show;
        return {
          ...target,
          opacity: 1,
          transition: {
            duration: 0,                                  // position, clip and filter snap to their end state
            delay: transition.delay || 0,
            opacity: { duration: duration.calm, ease: 'linear' }
          }
        };
      }
    });
  }
  return calmCache.get(variants);
}
