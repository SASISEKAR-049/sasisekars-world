/* ==========================================================================
   Reusable motion hooks.
   useMagnetic   element is pulled toward the cursor, springs back on leave
   useTilt       card rotates in 3D toward the cursor, with a moving glare
   useScramble   text decodes from random glyphs
   useTypewriter types, holds, erases, next phrase, forever
   useInterval   setInterval that can be paused
   Pointer effects only run with full motion on a mouse / trackpad.
   ========================================================================== */

import { useEffect, useMemo, useRef } from 'react';
import { animate, motionValue, useMotionValue, useSpring } from 'motion/react';
import { usePointerFx } from './MotionRoot.jsx';
import { magnetic, tilt } from './presets.js';

/* Last known mouse position, shared by the cursor and the easter egg */
export const pointer = { x: motionValue(-100), y: motionValue(-100), seen: false };

/* Spread `bind` on a motion element and pass `style` (merge it with your own):
   const mag = useMagnetic(0.25);
   <motion.button {...mag.bind} style={mag.style} /> */
export function useMagnetic(strength = magnetic.strength) {
  const active = usePointerFx();
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const bind = useMemo(() => ({
    onPointerMove(e) {
      if (!active || e.pointerType !== 'mouse') return;
      const r = e.currentTarget.getBoundingClientRect();
      animate(x, (e.clientX - (r.left + r.width / 2)) * strength, magnetic.follow);
      animate(y, (e.clientY - (r.top + r.height / 2)) * strength, magnetic.follow);
    },
    onPointerLeave() {
      if (!active) return;
      animate(x, 0, magnetic.release);
      animate(y, 0, magnetic.release);
    }
  }), [active, strength, x, y]);

  return { bind, style: { x, y } };
}

/* const card = useTilt();
   <motion.article {...card.bind} style={card.style}> … <Glare glare={card.glare} /> </motion.article> */
export function useTilt() {
  const active = usePointerFx();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, tilt.spring);
  const rotateY = useSpring(ry, tilt.spring);
  const glareX = useMotionValue(0);
  const glareY = useMotionValue(0);
  const glareOpacity = useMotionValue(0);

  const bind = useMemo(() => ({
    onPointerMove(e) {
      if (!active || e.pointerType !== 'mouse') return;
      const r = e.currentTarget.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      ry.set((px - 0.5) * tilt.max);
      rx.set((0.5 - py) * tilt.max);
      glareX.set(e.clientX - r.left);
      glareY.set(e.clientY - r.top);
    },
    onPointerEnter(e) {
      if (!active || e.pointerType !== 'mouse') return;
      animate(glareOpacity, 1, { duration: 0.4, ease: 'easeOut' });
    },
    onPointerLeave() {
      if (!active) return;
      rx.set(0);
      ry.set(0);
      animate(glareOpacity, 0, { duration: 0.4, ease: 'easeOut' });
    }
  }), [active, rx, ry, glareX, glareY, glareOpacity]);

  return {
    bind,
    style: active ? { rotateX, rotateY, transformPerspective: tilt.perspective } : undefined,
    glare: { x: glareX, y: glareY, opacity: glareOpacity }
  };
}

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+<>/\\_=';

/* Returns a MotionValue<string>: render it as the child of a motion element.
   It holds the final text until `active`, then decodes left to right. */
export function useScramble(text, active, { delay = 0, duration = 1.3 } = {}) {
  const value = useMotionValue(text);
  useEffect(() => {
    if (!active) { value.set(text); return undefined; }
    const chars = Array.from(text);
    const settleAt = chars.map((_, i) => (i / chars.length) * duration * 0.7 + Math.random() * duration * 0.3);
    value.set(' ');
    const controls = animate(0, duration, {
      duration,
      delay,
      ease: 'linear',
      onUpdate: (t) => value.set(chars.map((ch, i) => (ch === ' ' || t >= settleAt[i] ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join('')),
      onComplete: () => value.set(text)
    });
    return () => controls.stop();
  }, [active, text, delay, duration, value]);
  return value;
}

/* Returns a MotionValue<string> that loops through `phrases` like a typewriter */
export function useTypewriter(phrases, active, { startDelay = 0, typeMs = 65, eraseMs = 32, hold = 1700, gap = 320 } = {}) {
  const value = useMotionValue(phrases[0]);
  useEffect(() => {
    if (!active) { value.set(phrases[0]); return undefined; }
    let alive = true;
    let controls = null;
    let timer = 0;
    const wait = (ms) => new Promise((resolve) => { timer = setTimeout(resolve, ms); });
    const run = (from, to, text, perChar) => new Promise((resolve) => {
      controls = animate(from, to, {
        duration: (Math.abs(to - from) * perChar) / 1000,
        ease: 'linear',
        onUpdate: (n) => value.set(text.slice(0, Math.round(n))),
        onComplete: resolve
      });
    });
    (async () => {
      let i = 0;
      await wait(startDelay * 1000 + hold);
      while (alive) {
        await run(phrases[i].length, 0, phrases[i], eraseMs);
        if (!alive) break;
        i = (i + 1) % phrases.length;
        await wait(gap);
        if (!alive) break;
        await run(0, phrases[i].length, phrases[i], typeMs);
        if (!alive) break;
        await wait(hold);
      }
    })();
    return () => { alive = false; clearTimeout(timer); controls?.stop(); };
  }, [active, phrases, startDelay, typeMs, eraseMs, hold, gap, value]);
  return value;
}

/* setInterval that always calls the latest callback; pass null to pause */
export function useInterval(callback, ms) {
  const saved = useRef(callback);
  saved.current = callback;
  useEffect(() => {
    if (ms === null) return undefined;
    const id = setInterval(() => saved.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
}
