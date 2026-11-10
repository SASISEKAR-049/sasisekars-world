/* Skills: velocity-reactive marquees, tilt cards, draggable skill graph */
import { Fragment, Suspense, useEffect, useRef, useState } from 'react';
import { motion, useAnimationFrame, useInView, useMotionValue, useScroll, useSpring, useVelocity } from 'motion/react';
import { marquees, skills } from '../data/content.js';
import { Section, SectionHead, Tags } from './ui.jsx';
import { useTheme } from './Theme.jsx';
import { cssVar, tokenCss } from '../lib/color.js';
import { useMotionMode } from '../motion/MotionRoot.jsx';
import { useTilt } from '../motion/hooks.js';
import { Glare, Reveal } from '../motion/primitives.jsx';
import { fadeUp, spring } from '../motion/presets.js';

const total = skills.reduce((n, g) => n + g.items.length, 0);
const pad = (n) => String(n).padStart(2, '0');

export default function Skills() {
  return (
    <Section className="skills" id="skills" labelledBy="skills-title" bg="bg">
      <div className="wrap">
        <SectionHead index="02" label="SKILLS" meta={`${pad(skills.length)} GROUPS · ${total} SKILLS`} title="Skills" id="skills-title" />
      </div>

      <Marquees />

      {/* Separate boundaries keep each hydration task short */}
      <div className="wrap">
        <Suspense fallback={null}>
          <div className="skills__grid">
            {skills.map((g, i) => <SkillCard key={g.group} group={g} index={i} />)}
          </div>
        </Suspense>
        <Suspense fallback={null}><SkillGraph /></Suspense>
      </div>
    </Section>
  );
}

/* ---------- Marquees ----------
   Rows drift in alternating directions on Motion's frame loop. Scrolling
   speeds them up and skews them (scroll velocity). Each row repeats its group
   until it is wider than 2.4 screens. Decorative: the full list is in the cards. */
function Marquees() {
  const ref = useRef(null);
  const inView = useInView(ref);
  const { full } = useMotionMode();
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);                 // px per second
  const skewTarget = useMotionValue(0);
  const skewX = useSpring(skewTarget, spring.scrub);

  useAnimationFrame(() => {
    if (!full || !inView) return;
    const perFrame = velocity.get() / 60;                // same scale as the old Lenis velocity
    skewTarget.set(Math.max(-12, Math.min(12, -perFrame * 0.35)));
  });

  return (
    <div ref={ref} className="marquees" aria-hidden="true">
      {marquees.map((row, i) => (
        <MarqueeRow key={i} row={row} speed={0.55 + i * 0.12} active={full && inView} velocity={velocity} skewX={skewX} />
      ))}
    </div>
  );
}

function MarqueeRow({ row, speed, active, velocity, skewX }) {
  const groupRef = useRef(null);
  const [copies, setCopies] = useState(1);
  const width = useRef(0);
  const x = useMotionValue(0);
  const dir = row.dir > 0 ? 1 : -1;

  // Measure the group and repeat it enough times (again once fonts have loaded)
  useEffect(() => {
    const measure = () => {
      const w = groupRef.current?.offsetWidth || 0;
      if (!w) return;
      width.current = w;
      setCopies(Math.min(10, Math.ceil((window.innerWidth * 2.4) / w) + 1));
      if (dir > 0 && x.get() === 0) x.set(-w);
    };
    measure();
    document.fonts?.ready.then(measure);
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [dir, x]);

  useAnimationFrame((_, delta) => {
    const w = width.current;
    if (!active || !w) return;
    const boost = 1 + Math.min(Math.abs(velocity.get() / 60), 60) * 0.12;
    let next = x.get() + dir * speed * boost * (delta / (1000 / 60));
    if (next <= -w) next += w;
    if (next > 0) next -= w;
    x.set(next);
  });

  const group = (key, ref) => (
    <div key={key} ref={ref} className="marquee__group">
      {row.items.map(([text, style]) => (
        <Fragment key={text}>
          <span className={`marquee__item${style ? ` marquee__item--${style}` : ''}`}>{text}</span>
          <span className="marquee__sep">✦</span>
        </Fragment>
      ))}
    </div>
  );

  return (
    <div className="marquee">
      <motion.div className="marquee__track" style={{ x, skewX }}>
        {group(0, groupRef)}
        {Array.from({ length: copies - 1 }, (_, i) => group(i + 1))}
      </motion.div>
    </div>
  );
}

/* ---------- Skill card: rises in, chips follow, tilts toward the cursor ---------- */
function SkillCard({ group, index }) {
  const tilt = useTilt();
  const column = index % 3;
  return (
    <Reveal as="article" className="skill-card" variants={fadeUp} index={column} {...tilt.bind} style={tilt.style}>
      <div className="skill-card__head"><h3>{group.group}</h3><span className="label">{pad(index + 1)}</span></div>
      <Tags items={group.items} reveal delay={0.25 + column * 0.1} />
      <Glare glare={tilt.glare} />
    </Reveal>
  );
}

/* ---------- Force-directed skill graph (canvas 2D) ----------
   Category hubs link to their skills; hubs are chained in a loop to keep the
   layout open. Nodes repel, links act as springs and a weak pull keeps it
   centred. Drag any node. The simulation steps on Motion's frame loop only
   while the canvas is on screen and stops once it settles. With reduced
   motion the layout is pre-computed and redraws only while dragging. */
function buildGraph() {
  const nodes = [];
  const links = [];
  const hubs = [];
  skills.forEach((g) => {
    const hub = nodes.push({ label: g.group, hub: true, r: 7 }) - 1;
    hubs.push(hub);
    g.items.forEach((item) => {
      const idx = nodes.push({ label: item, hub: false, r: 3.5 }) - 1;
      links.push({ a: hub, b: idx, len: 78, k: 0.03 });
    });
  });
  hubs.forEach((h, i) => links.push({ a: h, b: hubs[(i + 1) % hubs.length], len: 210, k: 0.005 }));
  return { nodes, links, hubs };
}

function SkillGraph() {
  const { mode, full } = useMotionMode();
  const { theme } = useTheme();
  const canvasRef = useRef(null);
  const inView = useInView(canvasRef);
  const sim = useRef(null);

  // Build once on the client
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return undefined;
    const { nodes, links, hubs } = buildGraph();
    const s = { canvas, ctx, nodes, links, hubs, W: 0, H: 0, heat: 1, running: false, drag: null, hover: -1, colors: null };
    sim.current = s;

    s.readColors = () => {
      s.colors = {
        text: tokenCss('--text'),
        muted: tokenCss('--muted'),
        line: tokenCss('--line'),
        accent: tokenCss('--accent'),
        font: cssVar('--font-mono') || 'monospace'
      };
    };
    s.seed = () => {
      const R = Math.min(s.W, s.H) * 0.32;
      hubs.forEach((h, i) => {
        const a = (i / hubs.length) * Math.PI * 2;
        Object.assign(nodes[h], { x: s.W / 2 + Math.cos(a) * R, y: s.H / 2 + Math.sin(a) * R, vx: 0, vy: 0 });
      });
      links.forEach((l) => {
        const n = nodes[l.b];
        if (n.hub || n.x !== undefined) return;
        const h = nodes[l.a];
        Object.assign(n, { x: h.x + (Math.random() - 0.5) * 60, y: h.y + (Math.random() - 0.5) * 60, vx: 0, vy: 0 });
      });
    };
    s.step = () => {
      const n = nodes.length;
      for (let i = 0; i < n; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < n; j++) {
          const b = nodes[j];
          let dx = a.x - b.x;
          let dy = a.y - b.y;
          const d2 = dx * dx + dy * dy || 0.01;
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
        p.vx += (s.W / 2 - p.x) * 0.0006;
        p.vy += (s.H / 2 - p.y) * 0.0014;
        if (p === s.drag) { p.vx = 0; p.vy = 0; return; }
        p.vx *= 0.82; p.vy *= 0.82;
        p.x = Math.min(s.W - 24, Math.max(24, p.x + p.vx));
        p.y = Math.min(s.H - 24, Math.max(40, p.y + p.vy));
        energy += Math.abs(p.vx) + Math.abs(p.vy);
      });
      return energy / n;
    };
    s.draw = () => {
      if (!s.W || !s.colors) return;
      const { colors } = s;
      ctx.clearRect(0, 0, s.W, s.H);
      const active = s.hover >= 0 ? s.hover : nodes.indexOf(s.drag);
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
        if (p.hub) {                         // hub labels sit centred above the node
          ctx.textAlign = 'center';
          ctx.fillText(p.label.toUpperCase(), p.x, p.y - p.r - 8);
        } else {                             // skill labels on the right side read leftwards
          const flip = p.x > s.W * 0.6;
          ctx.textAlign = flip ? 'right' : 'left';
          ctx.fillText(p.label, flip ? p.x - p.r - 6 : p.x + p.r + 6, p.y + 4);
        }
      });
    };
    s.resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      if (!rect.width) return;                 // hidden on phones
      const first = s.W === 0;
      s.W = rect.width;
      s.H = rect.height;
      canvas.width = Math.round(s.W * dpr);
      canvas.height = Math.round(s.H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (first) s.seed();
      s.draw();
    };

    s.readColors();
    const observer = new ResizeObserver(() => s.resize());
    observer.observe(canvas);
    return () => { observer.disconnect(); sim.current = null; };
  }, []);

  // Reduced motion: settle the layout once, without animating it
  useEffect(() => {
    const s = sim.current;
    if (!s || mode !== 'calm') return;
    s.resize();
    if (!s.W) return;
    for (let k = 0; k < 400; k++) s.step();
    s.draw();
  }, [mode]);

  // New palette: read the tokens again
  useEffect(() => {
    const s = sim.current;
    if (!s) return;
    s.readColors();
    s.draw();
  }, [theme]);

  // Wake the simulation when the graph comes on screen
  useEffect(() => {
    const s = sim.current;
    if (s && inView && full) { s.heat = 1; s.running = true; }
  }, [inView, full]);

  useAnimationFrame(() => {
    const s = sim.current;
    if (!s || !s.running || !s.W) return;
    if (!inView || !full) { s.running = false; return; }
    const energy = s.step();
    s.draw();
    s.heat = s.drag ? 1 : s.heat * 0.995;
    if (energy < 0.02 && s.heat < 0.4 && !s.drag) s.running = false;
  });

  /* ----- Pointer ----- */
  const local = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const nodeAt = (s, x, y) => {
    let best = -1;
    let bestD = 22 * 22;
    s.nodes.forEach((p, i) => {
      const d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  };
  const wake = (s) => { s.heat = 1; if (full) s.running = true; };

  return (
    <Reveal as="figure" className="graph" variants={fadeUp}>
      <canvas
        ref={canvasRef}
        className="graph__canvas"
        data-cursor="DRAG"
        role="img"
        aria-label="Interactive graph linking each skill to its category. The same skills are listed in the cards above."
        onPointerDown={(e) => {
          const s = sim.current;
          if (!s) return;
          const p = local(e);
          const i = nodeAt(s, p.x, p.y);
          if (i < 0) return;
          s.drag = s.nodes[i];
          e.currentTarget.setPointerCapture(e.pointerId);
          wake(s);
        }}
        onPointerMove={(e) => {
          const s = sim.current;
          if (!s) return;
          const p = local(e);
          if (s.drag) {
            s.drag.x = p.x;
            s.drag.y = p.y;
            if (!full) { for (let k = 0; k < 4; k++) s.step(); s.draw(); }
            return;
          }
          const i = nodeAt(s, p.x, p.y);
          if (i !== s.hover) { s.hover = i; s.draw(); }
        }}
        onPointerUp={() => { const s = sim.current; if (s) { s.drag = null; wake(s); } }}
        onPointerCancel={() => { const s = sim.current; if (s) { s.drag = null; wake(s); } }}
        onPointerLeave={() => { const s = sim.current; if (s && !s.drag && s.hover !== -1) { s.hover = -1; s.draw(); } }}
      />
      <figcaption className="graph__caption label">SKILL_GRAPH.py — drag the nodes</figcaption>
    </Reveal>
  );
}
