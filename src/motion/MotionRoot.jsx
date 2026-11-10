/* ==========================================================================
   MotionRoot: wraps the app once and owns everything global about motion.

   Mode      "pending"  server render + first client render (must match)
             "full"     every effect
             "calm"     the visitor prefers reduced motion (or the app started
                        after the 5 s failsafe): fades only, nothing travels,
                        no smooth scroll, no entry screen, no custom cursor
   Intro     false until the entry screen has lifted; the hero waits for it
   Scroll    Lenis smooth scrolling (full mode), anchor links, scroll lock
   Classes   html.has-motion   Motion is in control of the hidden start states
             html.motion-full  full mode (pinned layouts, custom cursor)

   No-JS safety: reveals are server-rendered in their hidden state (inline
   styles from Motion) and marked data-m. CSS shows every [data-m] element
   unless html has .motion-pending (set before first paint) or .has-motion,
   so content can never be stuck invisible. See index.html and index.css.
   ========================================================================== */

import { createContext, startTransition, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MotionConfig, cancelFrame, frame, useScroll, useTransform } from 'motion/react';
import Lenis from 'lenis';
import { duration, ease } from './presets.js';

export const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const QUERIES = {
  reduced: '(prefers-reduced-motion: reduce)',
  fine: '(hover: hover) and (pointer: fine)',
  desktop: '(min-width: 1024px)',
  phone: '(max-width: 767.98px)'
};

const ModeContext = createContext({ mode: 'pending', full: false, calm: false, fine: false, desktop: false, phone: false, intro: false });
const IntroContext = createContext({ preloading: false, reveal() {}, finish() {} });
const ScrollContext = createContext({ lenis: { current: null }, scrollTo() {}, lock() {} });
const LockContext = createContext(false);
const CalmContext = createContext(false);
const PointerFxContext = createContext(false);

/* { mode, full, calm, fine, desktop, phone, intro } */
export const useMotionMode = () => useContext(ModeContext);
/* { preloading, reveal(), finish() }: used by the entry screen only */
export const useIntro = () => useContext(IntroContext);
/* { lenis, scrollTo(target, options), lock(key, on) } */
export const useScroller = () => useContext(ScrollContext);
/* true while the entry screen or the menu covers the page (content behind is inert) */
export const useLocked = () => useContext(LockContext);
/* true when motion is reduced. Reveals only need this, and it does not change
   when the page switches from "pending" to "full", so they do not re-render then. */
export const useCalm = () => useContext(CalmContext);
/* true for pointer effects (magnetic, tilt): full motion with a mouse / trackpad */
export const usePointerFx = () => useContext(PointerFxContext);

/* Anchor targets stop below the fixed header. One source of truth: the CSS
   scroll-padding-top on <html> (header height + 8px). Lenis reads it itself;
   native scrolling adds it here. */
const scrollPadding = () => parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;

export function MotionRoot({ children }) {
  const [mode, setMode] = useState('pending');
  const [media, setMedia] = useState({ fine: false, desktop: false, phone: false });
  const [intro, setIntro] = useState(false);
  const [preloading, setPreloading] = useState(false);
  const [locks, setLocks] = useState(() => new Set());
  const lenis = useRef(null);
  const locked = locks.size > 0;                                           // scrolling is paused
  const covered = [...locks].some((key) => !key.endsWith(':scroll'));      // page behind is inert

  const lock = useCallback((key, on) => {
    setLocks((prev) => {
      if (prev.has(key) === on) return prev;
      const next = new Set(prev);
      if (on) next.add(key); else next.delete(key);
      return next;
    });
  }, []);

  /* ---------- Decide the mode as soon as React has hydrated ----------
     The re-render this causes is a transition, so React splits it into short
     chunks instead of one long main-thread task. Until it commits,
     html.motion-pending keeps every animated element in its start state. */
  useIsoLayoutEffect(() => {
    window.__siteReady = true;                     // React is running: the 5 s failsafe stands down
    const root = document.documentElement;
    const mq = Object.fromEntries(Object.entries(QUERIES).map(([k, q]) => [k, window.matchMedia(q)]));
    const late = Boolean(window.__failsafe);       // the failsafe already made everything visible
    const read = () => (mq.reduced.matches || late ? 'calm' : 'full');
    const first = read();
    const preload = first === 'full' && root.classList.contains('show-preloader');

    startTransition(() => {
      setMode(first);
      setMedia({ fine: mq.fine.matches, desktop: mq.desktop.matches, phone: mq.phone.matches });
      if (preload) {
        setPreloading(true);
        lock('preloader', true);
        lock('preloader:scroll', true);
      } else {
        setIntro(true);
      }
    });

    const onMotion = () => startTransition(() => setMode(read()));
    const onMedia = () => setMedia({ fine: mq.fine.matches, desktop: mq.desktop.matches, phone: mq.phone.matches });
    mq.reduced.addEventListener('change', onMotion);
    [mq.fine, mq.desktop, mq.phone].forEach((m) => m.addEventListener('change', onMedia));
    return () => {
      mq.reduced.removeEventListener('change', onMotion);
      [mq.fine, mq.desktop, mq.phone].forEach((m) => m.removeEventListener('change', onMedia));
    };
  }, [lock]);

  /* ---------- Document classes follow the committed mode ---------- */
  useIsoLayoutEffect(() => {
    if (mode === 'pending') return;
    const root = document.documentElement;
    if (!window.__failsafe) root.classList.add('has-motion');
    root.classList.toggle('motion-full', mode === 'full');
    root.classList.remove('motion-pending');
    // preloading commits in the same render as the first mode, so it is current here
    if (!preloading) root.classList.remove('show-preloader');
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- Smooth scrolling (full mode), driven by Motion's frame loop ---------- */
  useEffect(() => {
    if (mode !== 'full') return undefined;
    const instance = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1, autoRaf: false });
    lenis.current = instance;
    const tick = ({ timestamp }) => instance.raf(timestamp);
    frame.update(tick, true);
    return () => {
      cancelFrame(tick);
      instance.destroy();
      lenis.current = null;
    };
  }, [mode]);

  /* ---------- Scroll lock while the entry screen or menu is open ---------- */
  useEffect(() => {
    document.documentElement.classList.toggle('scroll-locked', locked);
    if (locked) lenis.current?.stop(); else lenis.current?.start();
  }, [locked, mode]);

  const scrollTo = useCallback((target, options = {}) => {
    if (lenis.current) {
      lenis.current.scrollTo(target, { duration: 1.6, easing: (t) => 1 - (1 - t) ** 4, ...options });
      return;
    }
    const top = typeof target === 'number'
      ? target
      : target.getBoundingClientRect().top + window.scrollY - scrollPadding() + (options.offset || 0);
    const calm = window.matchMedia(QUERIES.reduced).matches;
    window.scrollTo({ top, behavior: calm || options.immediate ? 'auto' : 'smooth' });
  }, []);

  /* ---------- Anchor links + placeholder links ---------- */
  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented) return;
      const link = e.target.closest?.('a[href]');
      if (!link) return;
      const href = link.getAttribute('href');

      // Links still pointing at "[PLACEHOLDER]" do nothing and log a reminder
      if (href.startsWith('[')) {
        e.preventDefault();
        console.warn('[portfolio] Placeholder link not replaced yet:', href);
        return;
      }
      if (!href.startsWith('#') || href.length < 2) return;
      const target = document.getElementById(href.slice(1));
      if (!target) return;
      e.preventDefault();

      const isTop = href === '#top';
      scrollTo(isTop ? 0 : target, link.dataset.scrollDuration ? { duration: Number(link.dataset.scrollDuration) } : {});
      history.replaceState(null, '', href);

      // Move keyboard focus to the destination
      const focusTarget = isTop ? document.getElementById('main') : target;
      if (focusTarget && !focusTarget.hasAttribute('tabindex')) focusTarget.setAttribute('tabindex', '-1');
      focusTarget?.focus({ preventScroll: true });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [scrollTo]);

  /* ---------- Deep links: pinned layouts change the page height once motion is on,
     so jump to the hash again after they have been laid out ---------- */
  useEffect(() => {
    if (mode === 'pending' || !window.location.hash) return undefined;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => {
      const target = document.getElementById(window.location.hash.slice(1));
      if (target) scrollTo(target, { immediate: true });
    }));
    return () => cancelAnimationFrame(id);
  }, [mode, scrollTo]);

  const modeValue = useMemo(() => ({
    mode,
    full: mode === 'full',
    calm: mode === 'calm',
    ...media,
    intro
  }), [mode, media, intro]);

  const introValue = useMemo(() => ({
    preloading,
    // The page behind becomes usable as the panels start to lift…
    reveal: () => { setIntro(true); lock('preloader', false); },
    // …and scrolling resumes once they are gone
    finish: () => {
      setPreloading(false);
      lock('preloader:scroll', false);
      document.documentElement.classList.remove('show-preloader');
    }
  }), [preloading, lock]);

  const scrollValue = useMemo(() => ({ lenis, scrollTo, lock }), [scrollTo, lock]);

  return (
    <MotionConfig reducedMotion="user" transition={{ duration: duration.base, ease: ease.outExpo }}>
      <ModeContext.Provider value={modeValue}>
        <IntroContext.Provider value={introValue}>
          <ScrollContext.Provider value={scrollValue}>
            <LockContext.Provider value={covered}>
              <CalmContext.Provider value={mode === 'calm'}>
                <PointerFxContext.Provider value={mode === 'full' && media.fine}>
                  {children}
                </PointerFxContext.Provider>
              </CalmContext.Provider>
            </LockContext.Provider>
          </ScrollContext.Provider>
        </IntroContext.Provider>
      </ModeContext.Provider>
    </MotionConfig>
  );
}

/* Scroll progress of an element (0 → 1 between the two offsets). In calm or
   pending mode it holds still at `rest`, so nothing scroll-linked moves and
   the server render stays in its resting state.
   offset uses Motion's syntax: "<target edge> <viewport edge>", e.g.
   ['start end', 'end start'] = from entering at the bottom to leaving at the top. */
export function useGatedScroll({ target, offset, rest = 0 } = {}) {
  const { full } = useMotionMode();
  const { scrollYProgress } = useScroll({ target, offset });
  return useTransform(() => (full ? scrollYProgress.get() : rest));
}

/* Page scroll progress (0 → 1), not gated: the progress bar works in every mode */
export function usePageScroll() {
  return useScroll();
}
