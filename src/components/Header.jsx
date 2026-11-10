/* Sticky header (hides on scroll down, returns on scroll up), scroll progress
   bar, theme toggle and the fullscreen menu with image previews. */
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from 'motion/react';
import { nav, profile } from '../data/content.js';
import { IconButton, Pulse, Roll, ULink } from './ui.jsx';
import { useTheme } from './Theme.jsx';
import { useIntro, useMotionMode, useScroller } from '../motion/MotionRoot.jsx';
import { calm as calmOf, ease, hoverTransition, press, spring } from '../motion/presets.js';

/* ---------- Menu state, shared by the button (header) and the panel ---------- */
const MenuContext = createContext({ open: false, setOpen() {}, buttonRef: { current: null } });
const useMenu = () => useContext(MenuContext);

export function MenuProvider({ children }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const { lock } = useScroller();

  // While open: the page behind is inert and does not scroll
  useEffect(() => {
    lock('menu', open);
    document.documentElement.classList.toggle('menu-open', open);
  }, [open, lock]);

  const value = useMemo(() => ({ open, setOpen, buttonRef }), [open]);
  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

/* Section whose middle is crossing the centre of the screen */
function useActiveSection() {
  const [id, setId] = useState(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => { if (entry.isIntersecting) setId(entry.target.id); }),
      { rootMargin: '-50% 0px -50% 0px' }
    );
    document.querySelectorAll('main section[id]').forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  return id;
}

const headerVariants = {
  hidden: { y: '-100%', opacity: 0 },
  // First appearance is slow (after the intro); later returns are quick
  show: (settled) => ({ y: '0%', opacity: 1, transition: { duration: settled ? 0.6 : 1.1, ease: ease.outExpo } }),
  away: { y: '-110%', opacity: 1, transition: { duration: 0.6, ease: ease.outExpo } }
};

export function Header() {
  const { full, calm, intro } = useMotionMode();
  const { preloading } = useIntro();
  const { open, setOpen, buttonRef } = useMenu();
  const { theme, toggle } = useTheme();
  const { scrollY, scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, spring.scrub);
  const [away, setAway] = useState(false);
  const [settled, setSettled] = useState(false);
  const active = useActiveSection();

  useMotionValueEvent(scrollY, 'change', (y) => {
    if (!full || open) return;
    const previous = scrollY.getPrevious() ?? 0;
    if (y > previous && y > 140) setAway(true);
    else if (y < previous || y <= 140) setAway(false);
  });

  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  const turn = theme === 'light' ? 180 : 0;
  const state = !intro ? 'hidden' : away && !open ? 'away' : 'show';

  return (
    <motion.header
      className="site-header fixed top-0 left-0 right-0 z-[70] h-(--header-h)"
      data-m=""
      variants={calm ? calmOf(headerVariants) : headerVariants}
      custom={settled}
      initial="hidden"
      animate={state}
      onAnimationComplete={(definition) => { if (definition === 'show') setSettled(true); }}
      onFocus={() => setAway(false)}   // keyboard users tabbing into the header always see it
      inert={preloading && !intro}
    >
      <div className="wrap site-header__inner relative h-full flex items-center gap-[clamp(16px,2vw,32px)]">
        <motion.a className="logo inline-flex items-center gap-2.5 mr-auto" href="#top" data-cursor="TOP" initial="rest" whileHover="hover" whileFocus="hover" whileTap="press" variants={{ press }}>
          <span className="logo__mark relative font-mono font-bold text-[11px] leading-none text-accent border border-accent px-1.5 py-[5px]" aria-hidden="true">
            S/
            <motion.span
              className="absolute -inset-px grid place-items-center bg-accent text-on-accent"
              variants={{
                rest: { clipPath: 'inset(100% 0% 0% 0%)', transition: hoverTransition },
                hover: { clipPath: 'inset(0% 0% 0% 0%)', transition: hoverTransition }
              }}
            >
              S/
            </motion.span>
          </span>
          <span className="font-display font-extrabold text-[13px] min-[400px]:text-[15px] tracking-[0.04em] leading-none whitespace-nowrap">{profile.name}</span>
        </motion.a>

        <nav className="nav hidden wide:block" aria-label="Primary">
          <ul className="nav__list flex gap-[clamp(14px,1.8vw,30px)]" role="list">
            {nav.map((n) => (
              <li key={n.id}>
                <Roll
                  href={`#${n.id}`}
                  className={`nav__link font-ui text-[11px] font-semibold tracking-[0.1em] uppercase${active === n.id ? ' is-active' : ''}`}
                  aria-current={active === n.id ? 'location' : undefined}
                >
                  {n.label}
                </Roll>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex gap-2">
          <IconButton className="theme-toggle" onClick={toggle} aria-label={`Switch to ${nextTheme} theme`}>
            <motion.span
              className="relative w-3.5 h-3.5 rounded-full border border-current bg-[linear-gradient(90deg,currentColor_50%,transparent_50%)]"
              variants={{
                rest: { rotate: turn, transition: { duration: 0.7, ease: ease.outExpo } },
                hover: { rotate: turn + 180, transition: { duration: 0.7, ease: ease.outExpo } }
              }}
              aria-hidden="true"
            />
          </IconButton>
          <IconButton
            ref={buttonRef}
            className="menu-btn"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls={open ? 'menu' : undefined}
          >
            <span className="relative">{open ? 'Close' : 'Menu'}</span>
            <span className="relative grid gap-[5px] w-[18px]" aria-hidden="true">
              <motion.span className="h-px bg-current" initial={false} animate={open ? { y: 3, rotate: 45 } : { y: 0, rotate: 0 }} transition={{ duration: 0.5, ease: ease.io }} />
              <motion.span className="h-px bg-current" initial={false} animate={open ? { y: -3, rotate: -45 } : { y: 0, rotate: 0 }} transition={{ duration: 0.5, ease: ease.io }} />
            </span>
          </IconButton>
        </div>
      </div>

      {/* Scroll progress */}
      <div className="absolute left-0 right-0 -bottom-px h-0.5 pointer-events-none" aria-hidden="true">
        <motion.span className="block h-full bg-accent origin-left" style={{ scaleX: full ? smoothProgress : scrollYProgress }} />
      </div>
    </motion.header>
  );
}

/* ---------- Fullscreen menu ---------- */
export function Menu() {
  const { open } = useMenu();
  return <AnimatePresence>{open && <MenuPanel key="menu" />}</AnimatePresence>;
}

function MenuPanel() {
  const { calm, desktop } = useMotionMode();
  const { setOpen, buttonRef } = useMenu();
  const { lenis } = useScroller();
  const panelRef = useRef(null);
  const [preview, setPreview] = useState(null);

  // The panel opens as a circle growing out of the menu button
  const variants = useMemo(() => {
    if (calm) {
      return {
        closed: { opacity: 0, transition: { duration: 0.25, ease: 'linear' } },
        open: { opacity: 1, transition: { duration: 0.25, ease: 'linear' } }
      };
    }
    const r = buttonRef.current?.getBoundingClientRect() || { left: window.innerWidth, top: 0, width: 0, height: 0 };
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    return {
      closed: { clipPath: `circle(0px at ${x}px ${y}px)`, transition: { duration: 0.7, ease: ease.io } },
      open: { clipPath: `circle(${radius}px at ${x}px ${y}px)`, transition: { duration: 0.9, ease: ease.io } }
    };
  }, [calm, buttonRef]);

  // Keyboard: focus the first link, Escape closes, Tab cycles between the button and the menu
  useEffect(() => {
    const panel = panelRef.current;
    const button = buttonRef.current;
    panel.querySelector('a')?.focus({ preventScroll: true });
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        button?.focus();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = [button, ...panel.querySelectorAll('a, button')].filter(Boolean);
      const index = focusables.indexOf(document.activeElement);
      const last = focusables.length - 1;
      if (e.shiftKey && index <= 0) { e.preventDefault(); focusables[last].focus(); }
      else if (!e.shiftKey && (index === last || index === -1)) { e.preventDefault(); focusables[0].focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [setOpen, buttonRef]);

  const rise = (delay) => (calm
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.4, ease: 'linear' } }
    : { initial: { y: '110%' }, animate: { y: '0%' }, transition: { duration: 1, ease: ease.outExpo, delay } });

  return (
    <motion.div
      ref={panelRef}
      className="menu fixed inset-0 z-[60] overflow-y-auto bg-paper pt-[calc(var(--header-h)+16px)]"
      id="menu"
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      variants={variants}
      initial="closed"
      animate="open"
      exit="closed"
      onClick={(e) => {
        // A link closes the menu; scrolling is released first so the jump can start
        if (!e.target.closest('a')) return;
        lenis.current?.start();
        setOpen(false);
      }}
    >
      {/* Preview image per link (crops of the photo), shown on hover / focus */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden hidden lg:block" aria-hidden="true">
        {nav.map((n) => (
          <motion.div
            key={n.id}
            className="absolute right-(--pad) top-1/2 -translate-y-1/2 w-[min(34vw,560px)] aspect-[4/3] bg-center bg-cover bg-no-repeat border border-line"
            style={{ backgroundImage: `url(${n.preview})`, opacity: 0 }}
            initial={false}
            animate={preview === n.id ? { opacity: 0.9, scale: 1 } : { opacity: 0, scale: 1.08 }}
            transition={{ opacity: { duration: 0.5, ease: 'easeOut' }, scale: { duration: 0.9, ease: ease.outExpo } }}
          />
        ))}
      </div>

      <div className="wrap relative z-[2] min-h-[calc(100%-16px)] flex flex-col justify-between gap-8 pb-7">
        <p className="label">[ NAVIGATION ]</p>
        <ol>
          {nav.map((n, i) => (
            <li key={n.id} className="border-t border-line last:border-b">
              <motion.a
                className="menu__link flex items-baseline gap-5 py-1.5"
                href={`#${n.id}`}
                initial="rest"
                whileHover="hover"
                whileFocus="hover"
                whileTap="press"
                onPointerEnter={() => setPreview(n.id)}
                onFocus={() => setPreview(n.id)}
              >
                <span className="font-ui font-semibold text-[11px] leading-none text-muted min-w-[2ch]">{String(i + 1).padStart(2, '0')}</span>
                <span className="block overflow-hidden py-[0.08em]">
                  {/* Outer span rises when the menu opens; inner span shifts on hover */}
                  <motion.span className="block" {...rise(0.3 + i * 0.06)}>
                    <motion.span
                      className="menu__text block font-display font-extrabold text-[clamp(26px,min(5vw,7vh),76px)] leading-[1.05] uppercase"
                      variants={{
                        rest: { x: 0, transition: hoverTransition },
                        hover: { x: desktop ? 16 : 0, transition: hoverTransition },
                        press: { x: desktop ? 24 : 6, transition: spring.press }
                      }}
                    >
                      {n.label}
                    </motion.span>
                  </motion.span>
                </span>
              </motion.a>
            </li>
          ))}
        </ol>
        <motion.div
          className="flex flex-wrap justify-between gap-x-8 gap-y-3"
          initial={calm ? { opacity: 0 } : { opacity: 0, y: 20 }}
          animate={calm ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: ease.outExpo, delay: calm ? 0 : 0.6 }}
        >
          <p className="label"><Pulse /> {profile.status}</p>
          <ULink href={`mailto:${profile.email}`}>{profile.email}</ULink>
        </motion.div>
      </div>
    </motion.div>
  );
}
