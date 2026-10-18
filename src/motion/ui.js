/* ==========================================================================
   Small UI pieces shared across sections.
   toast()          Animated status message (role="status", so screen
                    readers announce it).
   initClipboard()  [data-copy] buttons copy their value and show "Copied ✓".
   ========================================================================== */

import { $, $$, libs, state } from './utils.js';

let hideTimer = 0;

export function toast(message) {
  const el = $('.toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('is-on');
  if (state.motion) {
    libs.gsap.fromTo(el, { y: 40, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: 'expo.out', overwrite: true });
  }
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    if (state.motion) {
      libs.gsap.to(el, { y: 20, opacity: 0, duration: 0.4, ease: 'power2.in', onComplete: () => el.classList.remove('is-on') });
    } else {
      el.classList.remove('is-on');
    }
  }, 2200);
}

function legacyCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  ta.remove();
  return ok;
}

export function initClipboard() {
  $$('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      let ok = false;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          ok = true;
        } else {
          ok = legacyCopy(text);
        }
      } catch (e) {
        ok = legacyCopy(text);
      }
      toast(ok ? 'Copied ✓  sasisekarsasi8@gmail.com' : 'Copy failed: please select the address and copy it');
    });
  });
}
