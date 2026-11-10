/* Theme (light / dark).
   The saved choice is applied before first paint by the script in index.html,
   so there is never a flash of the wrong theme. Toggling plays a curtain:
   a panel painted in the incoming theme's page colour slides up over the
   screen, the theme switches underneath, then the panel fades and lifts away.
   With reduced motion the curtain only fades. */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { tokenHex } from '../lib/color.js';
import { useCalm, useIsoLayoutEffect } from '../motion/MotionRoot.jsx';
import { ease } from '../motion/presets.js';

const ThemeContext = createContext({ theme: 'dark', toggle() {} });
export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  const calm = useCalm();
  const [theme, setTheme] = useState('dark');       // what the server rendered; corrected below before paint
  const [incoming, setIncoming] = useState(null);   // theme the curtain is bringing in

  useIsoLayoutEffect(() => {
    setTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
  }, []);

  // The browser UI colour follows the page colour token. Reading it costs a
  // style calculation, so it waits for an idle moment instead of start-up.
  useEffect(() => {
    const sync = () => document.querySelector('meta[name="theme-color"]')?.setAttribute('content', tokenHex('--bg'));
    if (!('requestIdleCallback' in window)) { const t = setTimeout(sync, 200); return () => clearTimeout(t); }
    const id = window.requestIdleCallback(sync, { timeout: 1000 });
    return () => window.cancelIdleCallback(id);
  }, [theme]);

  const apply = useCallback((next) => {
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) { /* storage blocked */ }
    setTheme(next);
    setIncoming(null);
  }, []);

  const toggle = useCallback(() => {
    setIncoming((current) => current || (theme === 'dark' ? 'light' : 'dark'));
  }, [theme]);

  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {incoming && <Curtain key={incoming} theme={incoming} calm={calm} onCovered={() => apply(incoming)} />}
      </AnimatePresence>
    </ThemeContext.Provider>
  );
}

function Curtain({ theme, calm, onCovered }) {
  const covered = useRef(false);
  return (
    <motion.div
      className="fixed inset-0 z-[260] bg-paper pointer-events-none"
      data-theme={theme}
      aria-hidden="true"
      initial={calm ? { opacity: 0 } : { y: '100%', opacity: 1 }}
      animate={calm ? { opacity: 1 } : { y: '0%', opacity: 1 }}
      exit={calm ? { opacity: 0 } : { y: '-6%', opacity: 0 }}
      transition={calm ? { duration: 0.25, ease: 'linear' } : { duration: 0.55, ease: ease.io }}
      onAnimationComplete={() => {
        if (covered.current) return;   // also fires after the exit
        covered.current = true;
        onCovered();
      }}
    />
  );
}
