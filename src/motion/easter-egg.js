/* ==========================================================================
   Easter egg: type "ai" anywhere (outside form fields) to fire a burst of
   particles from the cursor, kick the WebGL neural field and show a toast.
   ========================================================================== */

import { libs, state } from './utils.js';
import { toast } from './ui.js';

export function initEasterEgg() {
  let buffer = '';
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
    if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    buffer = (buffer + e.key.toLowerCase()).slice(-2);
    if (buffer === 'ai') {
      buffer = '';
      burst();
    }
  });
}

function burst() {
  toast('✦ Neural burst: hello, fellow AI enthusiast');
  state.neural?.burst();
  if (!state.motion) return;

  const { gsap } = libs;
  const x = state.pointer.x;
  const y = state.pointer.y;
  const colors = ['var(--accent)', 'var(--accent-2)', 'var(--text)'];

  for (let i = 0; i < 42; i++) {
    const spark = document.createElement('span');
    spark.className = 'spark';
    spark.setAttribute('aria-hidden', 'true');
    spark.style.background = colors[i % colors.length];
    document.body.appendChild(spark);

    const angle = Math.random() * Math.PI * 2;
    const dist = 80 + Math.random() * 260;
    gsap.set(spark, { x, y, scale: 0.6 + Math.random() * 1.4 });
    gsap.to(spark, {
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      rotation: Math.random() * 360,
      opacity: 0,
      duration: 0.9 + Math.random() * 0.8,
      ease: 'expo.out',
      onComplete: () => spark.remove()
    });
  }
}
