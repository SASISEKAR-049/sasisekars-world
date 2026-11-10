/* ==========================================================================
   Small motion building blocks shared by the sections.
   <Reveal>    plays a "hidden → show" variant when scrolled into view
   <Parallax>  drifts against the scroll while its section crosses the screen
   <CountUp>   number counts up when it enters the screen
   <DrawRect>  SVG rectangle outline that draws itself (transforms only)
   <Glare>     soft light that follows the cursor on tilt cards
   <Loop>      endless decorative animation that only runs while on screen
   ========================================================================== */

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { animate, motion, useInView, useMotionValue, useTransform } from 'motion/react';
import { useCalm, useGatedScroll, useMotionMode } from './MotionRoot.jsx';
import { calm as calmOf, ease, fadeUp, timed } from './presets.js';

/* When an element counts as "in view": the same thresholds the site always used.
   A bottom margin of -10% means "its top edge has passed 90% of the viewport height". */
export const view = {
  block: { once: true, margin: '0px 0px -10% 0px' },
  text: { once: true, margin: '0px 0px -12% 0px' },
  image: { once: true, margin: '0px 0px -18% 0px' },
  deep: { once: true, margin: '0px 0px -25% 0px' }
};

/* The <section> a component sits in, so children can track its scroll position */
export const SectionContext = createContext(null);
export const useSection = () => useContext(SectionContext);

/* Reveal on scroll. `index` × `stagger` delays items that enter together.
   data-m marks the element for the no-JavaScript fallback in index.css. */
export function Reveal({ as = 'div', variants = fadeUp, viewport = view.block, index = 0, stagger = 0.09, delay = 0, children, ...rest }) {
  const calm = useCalm();
  const Tag = motion[as];
  return (
    <Tag
      data-m=""
      variants={timed(calm ? calmOf(variants) : variants, stagger, delay)}
      custom={index}
      initial="hidden"
      whileInView="show"
      viewport={viewport}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* Counts from `from` to `value` once visible. The server renders the final
   value, so it is correct without JavaScript and for screen readers. */
export function CountUp({ value, from = 0, decimals = 0, seconds = 2.2, format, viewport = view.text, ...rest }) {
  const { full } = useMotionMode();
  const ref = useRef(null);
  const inView = useInView(ref, viewport);
  const count = useMotionValue(value);
  const text = useTransform(count, (v) => (format ? format(v) : v.toFixed(decimals)));
  const started = useRef(false);

  useEffect(() => {
    if (!full) { count.set(value); return undefined; }
    if (!inView) { if (!started.current) count.set(from); return undefined; }
    started.current = true;
    const controls = animate(count, value, { duration: seconds, ease: ease.outExpo });
    return () => controls.stop();
  }, [full, inView, value, from, seconds, count]);

  return <motion.span ref={ref} {...rest}>{text}</motion.span>;
}

/* Rectangle outline drawn clockwise from the top-left corner as `progress`
   (a MotionValue) goes 0 → 1. Four bars scaled from their start point, so it
   only animates transform (no stroke-dashoffset). */
export function DrawRect({ x, y, width, height, weight = 2, progress, className }) {
  const perimeter = 2 * (width + height);
  const a = width / perimeter;
  const b = (width + height) / perimeter;
  const c = (2 * width + height) / perimeter;
  const top = useTransform(progress, [0, a], [0, 1]);
  const right = useTransform(progress, [a, b], [0, 1]);
  const bottom = useTransform(progress, [b, c], [0, 1]);
  const left = useTransform(progress, [c, 1], [0, 1]);
  const h = weight / 2;
  return (
    <g className={className}>
      <motion.rect x={x - h} y={y - h} width={width + weight} height={weight} style={{ scaleX: top, originX: 0, originY: 0.5 }} />
      <motion.rect x={x + width - h} y={y - h} width={weight} height={height + weight} style={{ scaleY: right, originX: 0.5, originY: 0 }} />
      <motion.rect x={x - h} y={y + height - h} width={width + weight} height={weight} style={{ scaleX: bottom, originX: 1, originY: 0.5 }} />
      <motion.rect x={x - h} y={y - h} width={weight} height={height + weight} style={{ scaleY: left, originX: 0.5, originY: 1 }} />
    </g>
  );
}

/* Light that follows the cursor. Place inside a positioned, clipped parent and
   pass the `glare` object returned by useTilt(). Moved with transforms. */
export function Glare({ glare, className = '' }) {
  return (
    <span className={`glare-clip ${className}`} aria-hidden="true">
      <motion.span className="glare" style={{ x: glare.x, y: glare.y, opacity: glare.opacity }} />
    </span>
  );
}

/* Endless decorative loop. Runs only with full motion and while on screen,
   so off-screen loops cost nothing. `animate` and `transition` are Motion props.
   Visibility is read from the parent, because the looping element itself may
   travel outside its own clipping box. */
export function Loop({ as = 'span', animate: target, transition, children, ...rest }) {
  const { full } = useMotionMode();
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent) return undefined;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);
  const Tag = motion[as];
  const on = full && inView;
  return (
    <Tag ref={ref} animate={on ? target : undefined} transition={on ? { repeat: Infinity, ...transition } : undefined} {...rest}>
      {children}
    </Tag>
  );
}
