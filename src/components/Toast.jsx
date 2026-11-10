/* Toast: a short status message at the bottom of the screen.
   const toast = useToast();  toast('Copied', 'success' | 'error' | 'info')
   The region is always in the page with role="status", so screen readers
   announce each new message. */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ease } from '../motion/presets.js';

const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

const TONE = { info: 'bg-signal', success: 'bg-success', error: 'bg-error' };

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(0);

  const show = useCallback((message, tone = 'info') => {
    clearTimeout(timer.current);
    setToast({ id: Date.now(), message, tone });
    timer.current = setTimeout(() => setToast(null), 2200);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="fixed left-0 right-0 bottom-7 z-[230] grid justify-items-center px-4 pointer-events-none" role="status" aria-live="polite">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              className="toast col-start-1 row-start-1 flex items-center gap-3 max-w-full px-[18px] py-3 bg-raised text-ink border border-line-strong shadow-[0_12px_32px_-12px_var(--shadow)] font-mono text-[13px] leading-[1.3] tracking-[0.04em]"
              initial={{ y: 40, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1, transition: { duration: 0.7, ease: ease.outExpo } }}
              exit={{ y: 20, opacity: 0, transition: { duration: 0.4, ease: ease.in } }}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${TONE[toast.tone] || TONE.info}`} aria-hidden="true" />
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

/* Copy text to the clipboard; resolves to true when it worked */
export async function copyText(text) {
  const legacy = () => {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    field.remove();
    return ok;
  };
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return legacy();
  } catch (e) {
    return legacy();
  }
}
