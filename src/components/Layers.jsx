/* Page-level layers: section backdrop, hero photo, WebGL canvas, grid lines,
   grain, custom cursor and the "ai" easter egg. */
import { useEffect, useRef, useState } from 'react';
import { animate, motion, steps, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from 'motion/react';
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
   One still image by default (server render, reduced motion). With full
   motion it is cut into vertical strips (8, or 5 on phones) that open from
   the centre in the intro and slide apart as the hero scrolls away. */
const stripPhoto = {
  hidden: ({ up }) => ({ y: up ? '-10%' : '10%', scale: 1.12 }),
  show: ({ order }) => ({ y: '0%', scale: 1, transition: { duration: 2.1, ease: ease.outExpo, delay: 1.3 + order * 0.08 } })
};
const stripCover = {
  hidden: { scaleY: 1 },
  show: ({ order }) => ({ scaleY: 0, transition: { duration: 1.4, ease: ease.io, delay: 1.2 + order * 0.08 } })
};

const heroPicture = {
  name: 'hero-bg',
  widths: [720, 1086],
  sizes: '100vw',
  alt: '',
  width: '1086',
  height: '1448',
  className: 'absolute top-0 h-full object-cover'
};

function Strip({ i, n, show, progress }) {
  const up = i % 2 === 0;                                             // even strips travel up, odd ones down
  const order = Math.abs(i - (n - 1) / 2) - (n % 2 === 0 ? 0.5 : 0);  // 0 at the centre, growing outward
  const y = useTransform(progress, [0, 1], ['0%', up ? '-24%' : '24%']);
  const custom = { up, order };
  return (
    <motion.div className="hero-bg__strip absolute top-0 bottom-0 overflow-hidden" style={{ '--i': i, y }} initial="hidden" animate={show ? 'show' : 'hidden'}>
      <Picture {...heroPicture} fetchPriority={i === 0 ? 'high' : undefined} motionProps={{ variants: stripPhoto, custom }} />
      <motion.span className="absolute inset-0 z-[2] bg-paper" variants={stripCover} custom={custom} style={{ originY: up ? 0 : 1 }} />
    </motion.div>
  );
}

export function HeroBackground({ heroRef }) {
  const { mode, full, phone, intro } = useMotionMode();
  const [height, setHeight] = useState(null);
  const progress = useGatedScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const n = full ? (phone ? 5 : 8) : 1;

  // Keep this page-level layer exactly as tall as the hero section
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return undefined;
    const observer = new ResizeObserver(() => setHeight(hero.offsetHeight));
    observer.observe(hero);
    return () => observer.disconnect();
  }, [heroRef]);

  return (
    <div className="hero-bg absolute top-0 left-0 w-full z-0 overflow-hidden pointer-events-none" style={{ '--n': n, height: height ?? undefined }} aria-hidden="true">
      {/* key: switching between the still and the strips remounts them in their start state */}
      <div className="absolute inset-0" key={n}>
        {full
          ? Array.from({ length: n }, (_, i) => <Strip key={i} i={i} n={n} show={intro} progress={progress} />)
          : (
            <div className="hero-bg__strip absolute top-0 bottom-0 overflow-hidden" style={{ '--i': 0 }}>
              <Picture {...heroPicture} fetchPriority="high" />
              {/* Hides the photo until the app has decided between still and strips */}
              {mode === 'pending' && <span className="hero-bg__wait absolute inset-0 z-[2] bg-paper" />}
            </div>
          )}
      </div>
      <div className="hero-bg__shade absolute inset-0 z-[3]" />
    </div>
  );
}

/* ---------- WebGL neural field ----------
   Three.js is imported in idle time after the intro. Its camera fly-through
   and ring formation are Motion values derived from scroll; the canvas fade
   is a Motion value too. Colours are read from the CSS tokens. */
export const neuralHandle = { current: null };   // lets the easter egg reach the field

export function NeuralCanvas() {
  const { mode, full, intro, phone, fine } = useMotionMode();
  // The sections are found by id: they exist as server-rendered markup even
  // before their Suspense boundaries hydrate. Declared before useScroll, so it runs first.
  const heroRef = useRef(null);
  const contactRef = useRef(null);
  useIsoLayoutEffect(() => {
    heroRef.current = document.getElementById('top');
    contactRef.current = document.getElementById('contact');
  }, []);
  const { theme } = useTheme();
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(true);
  const opacity = useMotionValue(0);

  // 0 → 1 while the hero scrolls away; 0 → 1 while the contact section arrives
  const hero = useScroll({ target: heroRef, offset: ['start start', 'end start'] }).scrollYProgress;
  const contact = useScroll({ target: contactRef, offset: ['start end', 'center center'] }).scrollYProgress;
  // Camera flies through the field, then pulls back for the contact section.
  // (Both values are read every time so Motion tracks both as dependencies.)
  const fly = useTransform(() => { const c = contact.get(); const h = hero.get(); return c > 0 ? 1 - c : h; });
  const converge = contact;                                                               // particles gather into a ring

  useMotionValueEvent(fly, 'change', (v) => neuralHandle.current?.setFly(v));
  useMotionValueEvent(converge, 'change', (v) => neuralHandle.current?.setConverge(v));
  const syncVisible = () => setVisible(hero.get() < 1 || contact.get() > 0);
  useMotionValueEvent(hero, 'change', syncVisible);
  useMotionValueEvent(contact, 'change', syncVisible);

  // Create the scene once the intro has started and the browser is idle
  useEffect(() => {
    if (mode === 'pending' || !intro || failed) return undefined;
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

  // Fade in and out; rendering pauses while hidden. A reduced-motion still stays on.
  const shown = ready && (visible || !full);
  useEffect(() => {
    if (!ready) return undefined;
    neuralHandle.current?.setVisible(shown);
    const controls = animate(opacity, shown ? 1 : 0, { duration: 0.9, ease: 'easeOut' });
    return () => controls.stop();
  }, [ready, shown, opacity]);

  // New palette: read the tokens again
  useEffect(() => { neuralHandle.current?.syncColors(); }, [theme, ready]);

  if (failed) return null;
  return (
    <motion.canvas
      ref={canvasRef}
      className={`neural inset-0 w-full z-0 pointer-events-none ${mode === 'calm' ? 'absolute h-screen' : 'fixed h-full'}`}
      style={{ opacity }}
      aria-hidden="true"
    />
  );
}

export function GridLines() {
  return (
    <div className="gridlines fixed inset-0 z-[1] pointer-events-none" aria-hidden="true">
      <div className="gridlines__inner grid h-full max-w-(--maxw) mx-auto px-(--pad) gap-x-(--gutter)">
        {Array.from({ length: 12 }, (_, i) => <span key={i} className="border-x border-line opacity-30" />)}
      </div>
    </div>
  );
}

/* Film grain: the texture jumps between six offsets (hidden for reduced motion) */
export function Grain() {
  return (
    <div className="fixed inset-0 z-[95] pointer-events-none overflow-hidden" aria-hidden="true">
      <Loop
        as="div"
        className="grain absolute -inset-[10%] opacity-(--grain)"
        animate={{ x: ['0%', '-3%', '2%', '-2%', '3%', '0%'], y: ['0%', '2%', '-3%', '-1%', '3%', '0%'] }}
        transition={{ duration: 0.9, ease: steps(6) }}
      />
    </div>
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
