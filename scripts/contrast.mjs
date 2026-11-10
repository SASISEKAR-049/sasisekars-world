/* Colour-token check: `npm run check:colors`
   Reads the palette straight from src/index.css (the only place colours are
   defined), converts OKLCH to sRGB and measures WCAG 2 contrast for every
   text / border role on every section background, in both themes.
   Exits with code 1 if a pair misses its target or a token is out of gamut. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const css = readFileSync(`${root}src/index.css`, 'utf8').replace(/\r\n/g, '\n').replace(/\/\*[\s\S]*?\*\//g, '');
const quiet = process.argv.includes('--quiet');

/* ---------- Parse the token blocks ---------- */
function block(selector) {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`Token block "${selector}" not found in src/index.css`);
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('\n}', start));
  const out = {};
  for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}
const shared = block(':root,\n[data-theme]');             // tokens derived from the palette
const dark = { ...block(':root,\n[data-theme="dark"]'), ...shared };
const light = { ...dark, ...block('[data-theme="light"]') };

/* ---------- Colour maths ---------- */
const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

function oklabToLinear([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  ];
}

/* Every colour is kept as { lab: [L, a, b], alpha } so color-mix(in oklab) is exact */
function splitArgs(s) {
  const parts = [];
  let depth = 0;
  let cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { parts.push(cur.trim()); cur = ''; } else cur += ch;
  }
  parts.push(cur.trim());
  return parts;
}

function resolve(value, tokens, seen = []) {
  const v = value.trim();
  if (v === 'transparent') return { lab: [0, 0, 0], alpha: 0 };
  let m = v.match(/^var\((--[\w-]+)\)$/);
  if (m) {
    if (seen.includes(m[1])) throw new Error(`Circular token ${m[1]}`);
    if (!(m[1] in tokens)) throw new Error(`Unknown token ${m[1]}`);
    return resolve(tokens[m[1]], tokens, [...seen, m[1]]);
  }
  m = v.match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)$/);
  if (m) {
    const [L, C, H] = [m[1], m[2], m[3]].map(Number);
    const h = (H * Math.PI) / 180;
    return { lab: [L, C * Math.cos(h), C * Math.sin(h)], alpha: m[4] === undefined ? 1 : Number(m[4]) };
  }
  m = v.match(/^color-mix\(\s*in oklab\s*,(.+)\)$/s);
  if (m) {
    const [first, second] = splitArgs(m[1]).map((part) => {
      const pm = part.match(/^(.*?)(?:\s+([\d.]+)%)?$/s);
      return { color: resolve(pm[1], tokens, seen), pct: pm[2] === undefined ? null : Number(pm[2]) / 100 };
    });
    const p1 = first.pct ?? (second.pct === null ? 0.5 : 1 - second.pct);
    const p2 = 1 - p1;
    // Premultiplied interpolation, as CSS Color 5 specifies
    const alpha = first.color.alpha * p1 + second.color.alpha * p2;
    const lab = [0, 1, 2].map((i) => (alpha === 0 ? 0
      : (first.color.lab[i] * first.color.alpha * p1 + second.color.lab[i] * second.color.alpha * p2) / alpha));
    return { lab, alpha };
  }
  throw new Error(`Cannot parse colour "${v}" (use oklch(), var() or color-mix(in oklab, …))`);
}

const outOfGamut = [];
function srgb(token, tokens) {
  const c = resolve(tokens[token], tokens);
  const lin = oklabToLinear(c.lab);
  if (lin.some((x) => x < -0.0005 || x > 1.0005)) outOfGamut.push(`${tokens === dark ? "dark" : "light"} ${token}`);
  return { rgb: lin.map((x) => toGamma(Math.min(1, Math.max(0, x)))), alpha: c.alpha };
}
/* Composite a (possibly translucent) colour over an opaque one, in sRGB like a browser */
const over = (fg, bg, opacity = 1) => fg.rgb.map((c, i) => c * fg.alpha * opacity + bg.rgb[i] * (1 - fg.alpha * opacity));
const luminance = (rgb) => { const [r, g, b] = rgb.map(toLinear); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
export const hex = (rgb) => `#${rgb.map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('')}`.toUpperCase();

/* ---------- What must pass ---------- */
const SECTION_BGS = ['--bg', '--surface', '--deep'];                 // data-bg values + page background
const ALL_BGS = [...SECTION_BGS, '--surface-raised'];
const CHECKS = [
  // [foreground, backgrounds, minimum, what it is]
  ['--text', [...ALL_BGS, '--accent-soft', '--accent-2-soft'], 4.5, 'body text'],
  ['--muted', [...ALL_BGS, '--accent-soft'], 4.5, 'muted text'],
  ['--dim', ALL_BGS, 4.5, 'tertiary text'],
  ['--accent', ALL_BGS, 4.5, 'accent text, links'],
  ['--accent-hover', ALL_BGS, 4.5, 'accent hover text'],
  ['--accent-2', ALL_BGS, 4.5, 'signal text'],
  ['--success', ALL_BGS, 4.5, 'success state'],
  ['--warning', ALL_BGS, 4.5, 'warning state'],
  ['--error', ALL_BGS, 4.5, 'error state'],
  ['--on-accent', ['--accent', '--accent-hover'], 4.5, 'text on accent fill'],
  ['--on-selection', ['--selection'], 4.5, 'selected text'],
  ['--bg', ['--text'], 4.5, 'text on inverse (solid button)'],
  ['--line-strong', ALL_BGS, 3, 'control borders'],
  ['--focus-ring', ALL_BGS, 3, 'focus ring'],
  ['--accent', ['--accent-soft'], 4.5, 'accent text on soft tint (row hover)']
];
/* Reported only: hairlines are decorative dividers, exempt from WCAG 1.4.11 */
const INFO = [['--line', ALL_BGS, 'decorative hairline']];

let failed = 0;
const rows = [];
for (const [name, tokens] of [['dark', dark], ['light', light]]) {
  for (const [fg, bgs, min, what] of CHECKS) {
    for (const bg of bgs) {
      const b = srgb(bg, tokens);
      const r = ratio(over(srgb(fg, tokens), b), b.rgb);
      const ok = r >= min;
      if (!ok) failed++;
      rows.push({ theme: name, pair: `${fg.slice(2)} on ${bg.slice(2)}`, ratio: r.toFixed(2), min, ok, what });
    }
  }
  // Scroll-scrubbed words rest at --scrub-rest opacity; they must still read as body text
  const rest = Number(tokens['--scrub-rest']);
  for (const bg of SECTION_BGS) {
    const b = srgb(bg, tokens);
    const r = ratio(over(srgb('--text', tokens), b, rest), b.rgb);
    if (r < 4.5) failed++;
    rows.push({ theme: name, pair: `text @ ${rest} opacity on ${bg.slice(2)}`, ratio: r.toFixed(2), min: 4.5, ok: r >= 4.5, what: 'un-lit scrub words' });
  }
  for (const [fg, bgs, what] of INFO) {
    for (const bg of bgs) {
      const b = srgb(bg, tokens);
      rows.push({ theme: name, pair: `${fg.slice(2)} on ${bg.slice(2)}`, ratio: ratio(over(srgb(fg, tokens), b), b.rgb).toFixed(2), min: '—', ok: true, what });
    }
  }
}

/* index.html carries the one colour that cannot come from CSS: the initial theme-color meta */
const html = readFileSync(`${root}index.html`, 'utf8');
const meta = (html.match(/<meta name="theme-color" content="([^"]+)"/) || [])[1];
const darkBg = hex(srgb('--bg', dark).rgb);
const metaOk = meta && meta.toUpperCase() === darkBg;
if (!metaOk) failed++;

if (!quiet) {
  for (const [name, tokens] of [['dark', dark], ['light', light]]) {
    console.log(`\n${name.toUpperCase()} palette (sRGB)`);
    for (const t of Object.keys(tokens)) {
      if (!/^(oklch|var|color-mix)/.test(tokens[t])) continue;
      const c = srgb(t, tokens);
      console.log(`  ${t.padEnd(20)} ${hex(c.rgb)}${c.alpha < 1 ? ` @ ${Math.round(c.alpha * 100)}%` : ''}`.padEnd(46) + tokens[t]);
    }
  }
  console.log('\nContrast');
  for (const r of rows) console.log(`  ${r.ok ? 'ok  ' : 'FAIL'} ${r.theme.padEnd(5)} ${r.pair.padEnd(34)} ${String(r.ratio).padStart(6)}:1  (min ${r.min})  ${r.what}`);
}
console.log(`\ntheme-color meta in index.html: ${meta} ${metaOk ? '= --bg (dark) ok' : `FAIL, expected ${darkBg}`}`);
if (outOfGamut.length) { failed++; console.log(`Out of sRGB gamut: ${[...new Set(outOfGamut)].join(', ')}`); }
console.log(failed ? `\n${failed} check(s) failed` : `\nAll ${rows.filter((r) => r.min !== '—').length} contrast checks pass, every token is inside sRGB`);
process.exit(failed ? 1 : 0);
