/* Read palette tokens from CSS, so JavaScript never keeps its own copy of a
   colour. The palette lives in src/index.css as OKLCH custom properties;
   canvas and WebGL need plain sRGB numbers, so a 1×1 canvas does the
   conversion (it accepts any CSS colour the browser understands). */

let probe = null;

/* Raw value of a custom property on <html>, e.g. cssVar('--header-h') → "72px" */
export function cssVar(name, el = document.documentElement) {
  return getComputedStyle(el).getPropertyValue(name).trim();
}

/* Number stored in a custom property, e.g. cssNumber('--neural-line-alpha') → 0.32 */
export function cssNumber(name, fallback = 0, el) {
  const n = parseFloat(cssVar(name, el));
  return Number.isFinite(n) ? n : fallback;
}

/* Any CSS colour string → [r, g, b] in 0–255 (alpha ignored) */
export function toRgb(color) {
  if (!probe) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    probe = canvas.getContext('2d', { willReadFrequently: true });
  }
  if (!probe || !color) return [0, 0, 0];
  probe.globalCompositeOperation = 'copy';   // replace the pixel, never blend
  probe.fillStyle = 'black';                 // reset first: an invalid colour leaves fillStyle unchanged
  probe.fillStyle = color;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

/* Colour token → [r, g, b] in 0–255, e.g. tokenRgb('--accent') */
export function tokenRgb(name, el) {
  return toRgb(cssVar(name, el));
}

/* Colour token → "#RRGGBB" (for places that only take hex, like <meta name="theme-color">) */
export function tokenHex(name, el) {
  return `#${tokenRgb(name, el).map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/* Colour token → "rgb(r, g, b)" */
export function tokenCss(name, el) {
  return `rgb(${tokenRgb(name, el).join(', ')})`;
}
