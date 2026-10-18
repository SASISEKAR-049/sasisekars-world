/* ==========================================================================
   Text effects used by the hero.
   scramble()  Decrypting effect: random glyphs settle into the final text,
               left to right with a little randomness.
   typeLoop()  Typewriter that types, holds, erases and moves to the next
               phrase forever. Returns { stop }.
   ========================================================================== */

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+<>/\\_=';

export function scramble(el, finalText, duration = 1.3) {
  return new Promise((resolve) => {
    const start = performance.now();
    const chars = Array.from(finalText);
    const settleAt = chars.map((_, i) => (i / chars.length) * duration * 0.7 + Math.random() * duration * 0.3);

    function frame(now) {
      const t = (now - start) / 1000;
      let done = true;
      el.textContent = chars.map((ch, i) => {
        if (ch === ' ' || t >= settleAt[i]) return ch;
        done = false;
        return GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }).join('');
      if (done) resolve();
      else requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
}

export function typeLoop(el, phrases, { typeMs = 65, eraseMs = 32, hold = 1700, gap = 320 } = {}) {
  let phrase = 0;
  let count = phrases[0].length;
  let erasing = true;
  let timer = 0;
  let alive = true;

  function tick() {
    if (!alive) return;
    const text = phrases[phrase];
    if (erasing) {
      count -= 1;
      el.textContent = text.slice(0, count);
      if (count <= 0) {
        erasing = false;
        phrase = (phrase + 1) % phrases.length;
        timer = setTimeout(tick, gap);
        return;
      }
      timer = setTimeout(tick, eraseMs);
    } else {
      count += 1;
      el.textContent = text.slice(0, count);
      if (count >= text.length) {
        erasing = true;
        timer = setTimeout(tick, hold);
        return;
      }
      timer = setTimeout(tick, typeMs);
    }
  }

  el.textContent = phrases[0];
  timer = setTimeout(tick, hold);
  return { stop() { alive = false; clearTimeout(timer); } };
}
