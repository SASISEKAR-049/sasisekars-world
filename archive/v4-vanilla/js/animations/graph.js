/* ==========================================================================
   Force-directed skills graph (canvas 2D, no library).
   Nodes are read from the skill cards in the HTML, so there is one source of
   truth. Category hubs link to their skills; hubs are chained in a loop to
   keep the layout open. Nodes repel each other, links act as springs and a
   weak pull keeps everything centred. Drag any node with mouse or touch.

   The simulation only runs while the canvas is on screen and cools down
   when it settles; dragging reheats it. With reduced motion the layout is
   pre-computed and only redraws while you drag.
   ========================================================================== */

import { $, $$, media, cssVar, onThemeChange } from '../utils.js';

export function initGraph() {
  const canvas = $('[data-graph]');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');

  /* ----- Data from the DOM ----- */
  const nodes = [];
  const links = [];
  const hubs = [];
  $$('.skill-card').forEach((card) => {
    const hub = { label: card.querySelector('h3').textContent.trim(), hub: true, r: 7 };
    const hubIndex = nodes.push(hub) - 1;
    hubs.push(hubIndex);
    $$('.tag', card).forEach((tag) => {
      const idx = nodes.push({ label: tag.textContent.trim(), hub: false, r: 3.5 }) - 1;
      links.push({ a: hubIndex, b: idx, len: 78, k: 0.03 });
    });
  });
  hubs.forEach((h, i) => links.push({ a: h, b: hubs[(i + 1) % hubs.length], len: 210, k: 0.005 }));

  let W = 0;
  let H = 0;
  let colors = readColors();
  let heat = 1;
  let running = false;
  let visible = false;
  let drag = null;
  let hover = -1;

  function readColors() {
    return {
      text: cssVar('--text'),
      muted: cssVar('--muted'),
      line: cssVar('--line'),
      accent: cssVar('--accent'),
      font: getComputedStyle(document.body).getPropertyValue('--font-mono') || 'monospace'
    };
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const firstLayout = W === 0;
    W = rect.width;
    H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (firstLayout) seed();
    draw();
  }

  function seed() {
    const R = Math.min(W, H) * 0.32;
    hubs.forEach((h, i) => {
      const a = (i / hubs.length) * Math.PI * 2;
      Object.assign(nodes[h], { x: W / 2 + Math.cos(a) * R, y: H / 2 + Math.sin(a) * R, vx: 0, vy: 0 });
    });
    links.forEach((l) => {
      const n = nodes[l.b];
      if (n.hub || n.x !== undefined) return;
      const h = nodes[l.a];
      Object.assign(n, { x: h.x + (Math.random() - 0.5) * 60, y: h.y + (Math.random() - 0.5) * 60, vx: 0, vy: 0 });
    });
  }

  function step() {
    const n = nodes.length;
    for (let i = 0; i < n; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < n; j++) {
        const b = nodes[j];
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let d2 = dx * dx + dy * dy || 0.01;
        if (d2 > 90000) continue;
        const f = ((a.hub && b.hub) ? 5200 : (a.hub || b.hub) ? 2000 : 1100) / d2;
        const d = Math.sqrt(d2);
        dx /= d; dy /= d;
        a.vx += dx * f; a.vy += dy * f;
        b.vx -= dx * f; b.vy -= dy * f;
      }
    }
    links.forEach((l) => {
      const a = nodes[l.a];
      const b = nodes[l.b];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 0.01;
      const f = (d - l.len) * l.k;
      a.vx += (dx / d) * f; a.vy += (dy / d) * f;
      b.vx -= (dx / d) * f; b.vy -= (dy / d) * f;
    });
    let energy = 0;
    nodes.forEach((p) => {
      // Weaker horizontal pull so the graph spreads across the wide canvas
      p.vx += (W / 2 - p.x) * 0.0006;
      p.vy += (H / 2 - p.y) * 0.0014;
      if (p === drag) { p.vx = 0; p.vy = 0; return; }
      p.vx *= 0.82; p.vy *= 0.82;
      p.x = Math.min(W - 24, Math.max(24, p.x + p.vx));
      p.y = Math.min(H - 24, Math.max(40, p.y + p.vy));
      energy += Math.abs(p.vx) + Math.abs(p.vy);
    });
    return energy / n;
  }

  function draw() {
    if (!W) return;
    ctx.clearRect(0, 0, W, H);
    const active = hover >= 0 ? hover : nodes.indexOf(drag);

    ctx.lineWidth = 1;
    links.forEach((l) => {
      const lit = active >= 0 && (l.a === active || l.b === active);
      ctx.strokeStyle = lit ? colors.accent : colors.line;
      ctx.globalAlpha = lit ? 1 : 0.9;
      ctx.beginPath();
      ctx.moveTo(nodes[l.a].x, nodes[l.a].y);
      ctx.lineTo(nodes[l.b].x, nodes[l.b].y);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    nodes.forEach((p, i) => {
      const lit = i === active;
      ctx.fillStyle = p.hub || lit ? colors.accent : colors.text;
      ctx.beginPath();
      ctx.arc(p.x, p.y, lit ? p.r + 2 : p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `${p.hub ? 600 : 500} ${p.hub ? 12 : 11}px ${colors.font}`;
      ctx.fillStyle = p.hub || lit ? colors.text : colors.muted;
      if (p.hub) {                             // hub labels sit centred above the node
        ctx.textAlign = 'center';
        ctx.fillText(p.label.toUpperCase(), p.x, p.y - p.r - 8);
      } else {                                 // skill labels on the right side read leftwards
        const flip = p.x > W * 0.6;
        ctx.textAlign = flip ? 'right' : 'left';
        ctx.fillText(p.label, flip ? p.x - p.r - 6 : p.x + p.r + 6, p.y + 4);
      }
    });
  }

  function loop() {
    if (!visible) { running = false; return; }
    const energy = step();
    draw();
    heat = drag ? 1 : heat * 0.995;
    if (energy < 0.02 && heat < 0.4 && !drag) { running = false; return; }
    requestAnimationFrame(loop);
  }
  function wake() {
    heat = 1;
    if (running || media.reduced.matches) return;
    running = true;
    requestAnimationFrame(loop);
  }

  /* ----- Pointer interaction ----- */
  function nodeAt(x, y) {
    let best = -1;
    let bestD = 22 * 22;
    nodes.forEach((p, i) => {
      const d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  }
  const local = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  canvas.addEventListener('pointerdown', (e) => {
    const p = local(e);
    const i = nodeAt(p.x, p.y);
    if (i < 0) return;
    drag = nodes[i];
    canvas.setPointerCapture(e.pointerId);
    wake();
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = local(e);
    if (drag) {
      drag.x = p.x;
      drag.y = p.y;
      if (media.reduced.matches) { for (let k = 0; k < 4; k++) step(); draw(); }
      return;
    }
    const i = nodeAt(p.x, p.y);
    if (i !== hover) { hover = i; draw(); }
  });
  const release = () => { drag = null; wake(); };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('pointerleave', () => { if (!drag && hover !== -1) { hover = -1; draw(); } });

  /* ----- Lifecycle ----- */
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible) wake();
  }).observe(canvas);
  onThemeChange(() => { colors = readColors(); draw(); });

  if (media.reduced.matches) {
    resize();
    for (let k = 0; k < 400; k++) step();
    draw();
  }
}
