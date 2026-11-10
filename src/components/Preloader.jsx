/* Entry screen + boot sequence (every visit, except deep links to a section
   and visitors who prefer reduced motion).
   1. A dark screen with one "View Portfolio" button (focused, so Enter works).
   2. Clicking it runs the boot sequence: a 000 → 100% counter while three
      terminal lines type out (about 2.1 s).
   3. The screen splits into two panels that wipe upward, and the hero intro
      starts while they are still leaving.
   The whole thing is one Motion timeline (useAnimate).

   It is server-rendered but only displayed when the script in index.html has
   added html.show-preloader. data-theme="dark" scopes the dark palette to
   this screen, so it is always dark, whichever theme the page is in. */
import { useEffect, useRef, useState } from 'react';
import { motion, stagger, useAnimate, useMotionValue, useTransform } from 'motion/react';
import { Button } from './ui.jsx';
import { useIntro, useMotionMode } from '../motion/MotionRoot.jsx';
import { ease } from '../motion/presets.js';

const LINES = ['> loading neural_modules...', '> initializing model...', '> SASISEKAR.exe ready'];
const START = 0.55;   // boot sequence begins once the entry screen has faded

export default function Preloader() {
  const { mode } = useMotionMode();
  const { preloading, reveal, finish } = useIntro();
  const [scope, animate] = useAnimate();
  const [booting, setBooting] = useState(false);
  const buttonRef = useRef(null);

  const count = useMotionValue(0);
  const digits = useTransform(count, (v) => String(Math.round(v)).padStart(3, '0'));
  const bar = useTransform(count, [0, 100], [0, 1]);
  const typed = [useMotionValue(0), useMotionValue(0), useMotionValue(0)];
  const text0 = useTransform(typed[0], (n) => LINES[0].slice(0, Math.round(n)));
  const text1 = useTransform(typed[1], (n) => LINES[1].slice(0, Math.round(n)));
  const text2 = useTransform(typed[2], (n) => LINES[2].slice(0, Math.round(n)));
  const texts = [text0, text1, text2];

  // 1. Entry screen
  useEffect(() => {
    if (!preloading) return;
    buttonRef.current?.focus({ preventScroll: true });
    animate('[data-gate] > *', { opacity: [0, 1], y: [28, 0] }, { duration: 1.1, ease: ease.outExpo, delay: stagger(0.12) });
  }, [preloading, animate]);

  // 2–3. Boot sequence and reveal
  async function boot() {
    if (booting) return;
    setBooting(true);
    const timeline = animate([
      ['[data-gate]', { opacity: 0, scale: 0.96 }, { duration: 0.5, ease: ease.in, at: 0 }],
      ['[data-boot]', { opacity: [0, 1] }, { duration: 0.4, ease: 'linear', at: START - 0.05 }],
      [count, 100, { duration: 2.1, ease: 'easeInOut', at: START }],
      ...typed.map((value, i) => [value, LINES[i].length, { duration: LINES[i].length * 0.022, ease: 'linear', at: START + 0.15 + i * 0.62 }]),
      ['[data-boot]', { opacity: 0, y: '-6%' }, { duration: 0.45, ease: ease.in, at: START + 2.2 }],
      ['[data-panel]', { clipPath: 'inset(0% 0% 100% 0%)' }, { duration: 1.05, ease: ease.io, delay: stagger(0.12), at: START + 2.4 }]
    ]);
    // The hero starts while the panels are still lifting
    const early = setTimeout(reveal, (START + 2.7) * 1000);
    await timeline;
    clearTimeout(early);
    reveal();
    finish();
    document.getElementById('main')?.focus({ preventScroll: true });
  }

  // Not needed (deep link, reduced motion) or already finished
  if (mode !== 'pending' && !preloading) return null;

  return (
    <div ref={scope} className="preloader fixed inset-0 z-[240] text-ink" data-theme="dark" role="dialog" aria-modal="true" aria-labelledby="gate-title">
      <div className="absolute inset-0 grid grid-cols-2" aria-hidden="true">
        <div className="bg-paper [clip-path:inset(0_0_0_0)]" data-panel="" />
        <div className="bg-paper [clip-path:inset(0_0_0_0)]" data-panel="" />
      </div>

      {/* 1. Entry screen */}
      <div className="preloader__gate absolute inset-0 grid place-content-center justify-items-center gap-7 p-(--pad) text-center" data-gate="">
        <p className="font-ui font-semibold text-[11px] leading-[1.6] tracking-[0.2em] uppercase text-muted" id="gate-title">
          Sasisekar R L — AI &amp; Data Science Portfolio
        </p>
        <Button
          as="button"
          ref={buttonRef}
          type="button"
          className="min-h-16 px-10 text-[14px] tracking-[0.16em]"
          magnet={0.25}
          data-cursor="ENTER"
          onClick={boot}
          disabled={booting}
        >
          View Portfolio
        </Button>
        <p className="font-ui font-semibold text-[10px] leading-none tracking-[0.2em] uppercase text-dim [@media(hover:none)]:hidden" aria-hidden="true">
          Press Enter ↵
        </p>
      </div>

      {/* 2. Boot sequence */}
      <div className="preloader__boot absolute inset-0 flex flex-col justify-between py-[clamp(20px,3vw,44px)] px-(--pad) font-mono pointer-events-none" data-boot="" aria-hidden="true">
        <div className="flex justify-between text-[12px] tracking-[0.1em] text-muted">
          <span>SASISEKAR.exe</span>
          <span>[ BOOT SEQUENCE ]</span>
        </div>
        <div className="text-[clamp(13px,1.3vw,18px)] leading-[2] min-h-[6em]">
          {texts.map((text, i) => (
            <motion.p key={i} className={`min-h-[2em]${i === 2 ? ' text-signal' : ''}`}>{text}</motion.p>
          ))}
        </div>
        <div className="grid gap-4">
          <div className="h-px bg-line">
            <motion.span className="block h-full bg-accent origin-left" style={{ scaleX: bar }} />
          </div>
          {/* Monospaced digits keep the counter's width constant (no layout shift) */}
          <p className="justify-self-end font-mono font-bold text-[clamp(72px,17vw,260px)] leading-[0.8] tracking-[-0.06em] tabular-nums">
            <motion.span>{digits}</motion.span>
            <span className="text-[0.3em] align-top ml-[0.1em] text-accent">%</span>
          </p>
        </div>
      </div>
    </div>
  );
}
