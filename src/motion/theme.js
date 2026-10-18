/* ==========================================================================
   Theme toggle — light / dark.
   With the View Transitions API, the new theme is revealed by a circle that
   grows out of the toggle button. Without it (or with reduced motion) the
   theme switches instantly. The choice is saved in localStorage.
   ========================================================================== */

import { root, $, media, state } from './utils.js';

const THEME_COLORS = { dark: '#07080A', light: '#F3F3F0' };

export function initTheme() {
  const btn = $('[data-theme-toggle]');
  state.theme = root.dataset.theme === 'light' ? 'light' : 'dark';
  sync(btn);
  if (!btn) return;

  btn.addEventListener('click', (event) => {
    const next = state.theme === 'dark' ? 'light' : 'dark';
    const rect = btn.getBoundingClientRect();
    // Keyboard clicks report 0,0, so fall back to the button centre
    const x = event.detail ? event.clientX : rect.left + rect.width / 2;
    const y = event.detail ? event.clientY : rect.top + rect.height / 2;

    const apply = () => {
      root.dataset.theme = next;
      state.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) { /* storage blocked */ }
      sync(btn);
      document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: next } }));
    };

    if (!document.startViewTransition || media.reduced.matches) {
      apply();
      return;
    }

    const transition = document.startViewTransition(apply);
    transition.ready.then(() => {
      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 850, easing: 'cubic-bezier(0.76, 0, 0.24, 1)', pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(() => {});
  });
}

function sync(btn) {
  const next = state.theme === 'dark' ? 'light' : 'dark';
  btn?.setAttribute('aria-label', `Switch to ${next} theme`);
  const meta = $('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_COLORS[state.theme]);
}
