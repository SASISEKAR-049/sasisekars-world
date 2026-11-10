/* Page-level layers: section backdrop, hero photo (iris intro + living photo),
   WebGL canvas, custom cursor and the "ai" easter egg. */
import { useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from 'motion/react';
import { Picture } from './ui.jsx';
import { useTheme } from './Theme.jsx';
import { useToast } from './Toast.jsx';
import { useGatedScroll, useIsoLayoutEffect, useMotionMode } from '../motion/MotionRoot.jsx';
import { pointer } from '../motion/hooks.js';
import { Loop } from '../motion/primitives.jsx';
import { duration, ease, spring } from '../motion/presets.js';

/* ---------- Section backdrop ----------
   Each section names a colour token in data-bg. Instead of animating
   background-color, two fixed layers (surface, deep) cross-fade over the page
   colour as a section takes over the screen: opacity only, and theme changes
   need no JavaScript because the layers use the tokens directly. */
export function SectionBackdrop() {
  const [active, setActive] = useState('bg');
  useEffect(() => {
    const sections = document.querySelectorAll('[data-bg]');
    const inside = new Set();
    // A section is "active" while it covers the line 55% down the viewport
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? inside.add(entry.target) : inside.delete(entry.target)));
      const current = [...sections].filter((s) => inside.has(s)).pop();
      if (current) setActive(current.dataset.bg);
    }, { rootMargin: '-55% 0px -45% 0px' });
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const layer = (token, className) => (
    <motion.div
      className={`fixed inset-0 z-0 pointer-events-none ${className}`}
      initial={false}
      animate={{ opacity: active === token ? 1 : 0 }}
      transition={{ duration: 0.9, ease: 'easeOut' }}
    />
  );
  return (
    <div aria-hidden="true">
      {layer('surface', 'bg-surface')}
      {layer('deep', 'bg-deep')}
    </div>
  );
}

/* ---------- Hero photo ----------
   The photo fills the right part of the landing page (all of it on phones),
   toned down and faded into the page so the accent type reads over it.
   Server render and reduced motion: the still photo.
   Full motion:
   - Intro: the photo opens as an iris from the centre while it settles from 1.25×.
   - Living photo: it then keeps breathing (a very slow push-in) and tilts
     toward the mouse, like looking through a window.
   - Scroll: the photo zooms and drifts down. */
const heroPicture = {
  name: 'hero-color',
  widths: [720, 1086],
  sizes: '100vw',
  alt: '',
  width: '1086',
  height: '1448',
  className: 'hero-bg__img'
};

const iris = {
  hidden: { clipPath: 'circle(0% at 52% 42%)' },
  show: { clipPath: 'circle(150% at 52% 42%)', transition: { duration: 1.8, ease: ease.io, delay: 0.9 } }
};
const settle = {
  hidden: { scale: 1.25 },
  show: { scale: 1, transition: { duration: 2.6, ease: ease.outExpo, delay: 0.9 } }
};

export function HeroBackground({ heroRef }) {
  const { mode, full, fine, intro } = useMotionMode();
  const [height, setHeight] = useState(null);
  const progress = useGatedScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const zoom = useTransform(progress, [0, 1], [1, 1.15]);
  const drift = useTransform(progress, [0, 1], ['0%', '12%']);

  // Keep this page-level layer exactly as tall as the hero section
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return undefined;
    const observer = new ResizeObserver(() => setHeight(hero.offsetHeight));
    observer.observe(hero);
    return () => observer.disconnect();
  }, [heroRef]);

  return (
    <div className="hero-bg absolute top-0 left-0 w-full z-0 overflow-hidden pointer-events-none bg-paper" data-theme="dark" style={{ height: height ?? undefined }} aria-hidden="true">
      {/* key: switching between the still and the animated photo remounts it in its start state */}
      <motion.div className="hero-bg__frame" key={full ? 'motion' : 'still'} style={full ? { scale: zoom, y: drift } : undefined}>
        {full ? (
          <motion.div className="absolute inset-0 overflow-hidden" variants={iris} initial="hidden" animate={intro ? 'show' : 'hidden'}>
            <motion.div className="absolute inset-0" variants={settle}>
              <LivingPhoto fine={fine}>
                <Picture {...heroPicture} fetchPriority="high" />
              </LivingPhoto>
            </motion.div>
          </motion.div>
        ) : (
          <div className="absolute inset-0 overflow-hidden">
            <Picture {...heroPicture} fetchPriority="high" />
            {/* Hides the photo until the app has decided between the still and the animated version */}
            {mode === 'pending' && <span className="hero-bg__wait absolute inset-0 z-[2] bg-paper" />}
          </div>
        )}
      </motion.div>
      <div className="hero-bg__shade absolute inset-0 z-[3]" />
    </div>
  );
}

/* "Living photo": the still photo made to feel alive without video.
   - Breathing: an endless, very slow push-in and sideways drift.
   - Depth: the photo plane tilts a couple of degrees toward the mouse; on
     touch screens it sways gently by itself.
   Both run only while the hero is on screen (Loop) and only with full motion.
   The scale never drops below 1.04, so tilting never shows an edge. */
function LivingPhoto({ fine, children }) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, spring.soft);
  const rotateY = useSpring(ry, spring.soft);

  useEffect(() => {
    if (!fine) return undefined;
    const tilt = () => {
      if (!pointer.seen) return;
      ry.set((pointer.x.get() / window.innerWidth - 0.5) * 3);     // ±1.5°
      rx.set((0.5 - pointer.y.get() / window.innerHeight) * 2);    // ±1°
    };
    const offs = [pointer.x.on('change', tilt), pointer.y.on('change', tilt)];
    return () => offs.forEach((off) => off());
  }, [fine, rx, ry]);

  const breathe = { scale: [1.04, 1.1, 1.04], x: ['0%', '-1%', '0%'] };
  return (
    <motion.div className="absolute inset-0" style={{ rotateX, rotateY, transformPerspective: 1400 }}>
      <Loop
        as="div"
        className="absolute inset-0"
        style={{ scale: 1.04 }}
        animate={fine ? breathe : { ...breathe, rotateY: [-1.2, 1.2, -1.2], rotateX: [0.6, -0.6, 0.6] }}
        transition={{ duration: 26, ease: ease.sine }}
      >
        {children}
      </Loop>
    </motion.div>
  );
}

/* ---------- WebGL neural field ----------
   Shown behind the contact section only (the finale). Three.js is imported in
   idle time after the intro. The camera pull-back and ring formation are
   Motion values derived from scroll; the canvas fade is a Motion value too.
   Colours are read from the CSS tokens. */
export const neuralHandle = { current: null };   // lets the easter egg reach the field

export function NeuralCanvas() {
  const { mode, full, intro, phone, fine } = useMotionMode();
  // The sections are found by id: they exist as server-rendered markup even
  // before their Suspense boundaries hydrate. Declared before useScroll, so it runs first.
  const contactRef = useRef(null);
  useIsoLayoutEffect(() => {
    contactRef.current = document.getElementById('contact');
  }, []);
  const { theme } = useTheme();
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(false);
  const opacity = useMotionValue(0);

  // 0 → 1 while the contact section arrives: the camera pulls back out of the
  // field and the particles gather into a ring
  const contact = useScroll({ target: contactRef, offset: ['start end', 'center center'] }).scrollYProgress;
  const fly = useTransform(contact, (c) => 1 - c);
  const converge = contact;

  useMotionValueEvent(fly, 'change', (v) => neuralHandle.current?.setFly(v));
  useMotionValueEvent(converge, 'change', (v) => neuralHandle.current?.setConverge(v));
  useMotionValueEvent(contact, 'change', (c) => setVisible(c > 0));

  // Create the scene once the intro has started and the browser is idle
  useEffect(() => {
    if (!full || !intro || failed) return undefined;
    let neural = null;
    let cancelled = false;
    const load = async () => {
      try {
        const { createNeural } = await import('../webgl/neural.js');
        if (cancelled || !canvasRef.current) return;
        neural = createNeural(canvasRef.current, { mobile: phone || !fine, reduced: !full });
        if (!neural) { setFailed(true); return; }
        neuralHandle.current = neural;
        neural.setFly(fly.get());
        neural.setConverge(converge.get());
        setReady(true);
      } catch (err) {
        console.warn('[portfolio] WebGL scene unavailable:', err);
        setFailed(true);
      }
    };
    const idle = 'requestIdleCallback' in window
      ? window.requestIdleCallback(load, { timeout: 1200 })
      : setTimeout(load, 300);
    return () => {
      cancelled = true;
      if ('cancelIdleCallback' in window) window.cancelIdleCallback(idle); else clearTimeout(idle);
      neural?.destroy();
      neuralHandle.current = null;
      setReady(false);
    };
    // phone / fine only pick the particle budget at creation; they do not rebuild the scene
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, intro, failed, full]);

  // Fade in and out; rendering pauses while hidden
  const shown = ready && visible;
  useEffect(() => {
    if (!ready) return undefined;
    neuralHandle.current?.setVisible(shown);
    const controls = animate(opacity, shown ? 1 : 0, { duration: 0.9, ease: 'easeOut' });
    return () => controls.stop();
  }, [ready, shown, opacity]);

  // New palette: read the tokens again
  useEffect(() => { neuralHandle.current?.syncColors(); }, [theme, ready]);

  // Decorative and animated: not rendered with reduced motion
  if (failed || mode === 'calm') return null;
  return (
    <motion.canvas
      ref={canvasRef}
      className="neural fixed inset-0 w-full h-full z-0 pointer-events-none"
      style={{ opacity }}
      aria-hidden="true"
    />
  );
}

/* ---------- Custom cursor ----------
   A dot that sticks to the pointer and a ring that trails it (two springs).
   data-cursor="LABEL" on any element grows the ring and shows the label;
   plain links show "OPEN", buttons just grow the ring. Mouse / trackpad only. */
export function Cursor() {
  const { full, fine } = useMotionMode();
  const active = full && fine;
  const [state, setState] = useState({ visible: false, hover: false, label: '', down: false });
  const [text, setText] = useState('');   // keeps the last label readable while it fades out
  const dotX = useSpring(pointer.x, spring.dot);
  const dotY = useSpring(pointer.y, spring.dot);
  const ringX = useSpring(pointer.x, spring.ring);
  const ringY = useSpring(pointer.y, spring.ring);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('has-cursor', active);
    if (!active) return undefined;
    const patch = (next) => setState((prev) => (Object.keys(next).every((k) => prev[k] === next[k]) ? prev : { ...prev, ...next }));

    const onMove = (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      pointer.x.set(e.clientX);
      pointer.y.set(e.clientY);
      if (!pointer.seen) {   // first sighting: appear at the pointer instead of flying in from a corner
        pointer.seen = true;
        [dotX, ringX].forEach((v) => v.jump(e.clientX));
        [dotY, ringY].forEach((v) => v.jump(e.clientY));
      }
      patch({ visible: true });
    };
    const onLeave = () => patch({ visible: false });
    const onDown = () => patch({ down: true });
    const onUp = () => patch({ down: false });
    const onOver = (e) => {
      const target = e.target.closest?.('[data-cursor], a, button, [role="button"]');
      if (!target) { patch({ hover: false, label: '' }); return; }
      const label = target.dataset.cursor ?? (target.tagName === 'A' ? 'OPEN' : '');
      if (label) setText(label);
      patch({ hover: true, label });
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    root.addEventListener('mouseleave', onLeave);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    document.addEventListener('pointerover', onOver);
    return () => {
      window.removeEventListener('pointermove', onMove);
      root.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointerover', onOver);
      root.classList.remove('has-cursor');
    };
  }, [active, dotX, dotY, ringX, ringY]);

  if (!active) return null;
  const { visible, hover, label, down } = state;
  const labelled = Boolean(label);
  return (
    <motion.div
      className="fixed inset-0 z-[250] pointer-events-none mix-blend-difference"
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      aria-hidden="true"
    >
      <motion.div className="fixed left-0 top-0 w-0 h-0 grid place-items-center" style={{ x: ringX, y: ringY }}>
        <motion.span
          className="absolute left-0 top-0 w-10 h-10 -ml-5 -mt-5 rounded-full border border-cursor"
          initial={false}
          animate={{ scale: down ? 0.8 : labelled ? 2.3 : hover ? 1.6 : 1 }}
          transition={{ duration: 0.45, ease: ease.outExpo }}
        >
          <motion.span className="absolute inset-0 rounded-full bg-cursor" initial={false} animate={{ opacity: labelled ? 1 : 0 }} transition={{ duration: 0.3 }} />
        </motion.span>
        <motion.span
          className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 font-ui font-bold text-[10px] leading-none tracking-[0.1em] text-on-cursor whitespace-nowrap"
          initial={false}
          animate={{ opacity: labelled ? 1 : 0 }}
          transition={{ duration: duration.fast }}
        >
          {text}
        </motion.span>
      </motion.div>
      <motion.div
        className="fixed left-0 top-0 w-1.5 h-1.5 -ml-[3px] -mt-[3px] rounded-full bg-cursor"
        style={{ x: dotX, y: dotY }}
        initial={false}
        animate={{ opacity: labelled ? 0 : 1 }}
        transition={{ duration: duration.fast }}
      />
    </motion.div>
  );
}

/* ---------- Easter egg ----------
   Type "ai" anywhere (outside form fields): sparks fly from the cursor, the
   neural field bursts outward and a toast says hello. */
const SPARK_COLORS = ['bg-accent', 'bg-signal', 'bg-ink'];

export function EasterEgg() {
  const { full } = useMotionMode();
  const toast = useToast();
  const [bursts, setBursts] = useState([]);

  useEffect(() => {
    let buffer = '';
    const timers = new Set();
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
      if (e.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      buffer = (buffer + e.key.toLowerCase()).slice(-2);
      if (buffer !== 'ai') return;
      buffer = '';
      toast('✦ Neural burst: hello, fellow AI enthusiast');
      neuralHandle.current?.burst();
      if (!full) return;

      const id = Date.now();
      const x = pointer.seen ? pointer.x.get() : window.innerWidth / 2;
      const y = pointer.seen ? pointer.y.get() : window.innerHeight / 2;
      const sparks = Array.from({ length: 42 }, (_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const dist = 80 + Math.random() * 260;
        return {
          color: SPARK_COLORS[i % SPARK_COLORS.length],
          from: { x, y, scale: 0.6 + Math.random() * 1.4, opacity: 1, rotate: 0 },
          to: { x: x + Math.cos(angle) * dist, y: y + Math.sin(angle) * dist, rotate: Math.random() * 360, opacity: 0 },
          seconds: 0.9 + Math.random() * 0.8
        };
      });
      setBursts((all) => [...all, { id, sparks }]);
      const timer = setTimeout(() => { timers.delete(timer); setBursts((all) => all.filter((b) => b.id !== id)); }, 1900);
      timers.add(timer);
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); timers.forEach(clearTimeout); };
  }, [full, toast]);

  return bursts.map((burst) => (
    <div key={burst.id} aria-hidden="true">
      {burst.sparks.map((s, i) => (
        <motion.span
          key={i}
          className={`spark ${s.color}`}
          initial={s.from}
          animate={s.to}
          transition={{ duration: s.seconds, ease: ease.outExpo }}
        />
      ))}
    </div>
  ));
}
