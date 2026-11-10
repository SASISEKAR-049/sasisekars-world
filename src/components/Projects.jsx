/* Projects: horizontal gallery (pinned while you scroll, desktop) + featured
   case study (self-drawing architecture diagram, pipeline sequence, highlights). */
import { Suspense, useEffect, useRef, useState } from 'react';
import { animate, motion, useInView, useMotionValue, useMotionValueEvent, useSpring, useTransform } from 'motion/react';
import { comingSoon, project } from '../data/content.js';
import { Button, Picture, Section, SectionHead, Tags, linkProps } from './ui.jsx';
import { SplitText } from '../motion/SplitText.jsx';
import { useGatedScroll, useMotionMode } from '../motion/MotionRoot.jsx';
import { useTilt } from '../motion/hooks.js';
import { DrawRect, Glare, Loop, Reveal, view } from '../motion/primitives.jsx';
import { ease, fadeUp, lineReveal, pressSoft, spring } from '../motion/presets.js';

const pad = (n) => String(n).padStart(2, '0');

export default function Projects() {
  return (
    <Section className="projects" id="projects" labelledBy="projects-title" bg="surface">
      <div className="wrap">
        <SectionHead index="03" label="PROJECTS" meta="SELECTED WORK · PIPELINE GROWING" title="Projects" id="projects-title" />
      </div>
      <Gallery />
      {/* Hydrates separately from the gallery, to keep each start-up task short */}
      <Suspense fallback={null}><CaseStudy /></Suspense>
    </Section>
  );
}

/* ---------- Gallery ----------
   ≥1024px with full motion: the gallery is as tall as its sideways travel and
   its viewport is sticky, so scrolling down slides the track to the left.
   Card images drift inside their masks as they cross the screen. */
function Gallery() {
  const { full, desktop } = useMotionMode();
  const horizontal = full && desktop;
  const outerRef = useRef(null);
  const trackRef = useRef(null);
  const [size, setSize] = useState({ distance: 0, vw: 0, vh: 0 });

  useEffect(() => {
    if (!horizontal) return undefined;
    const measure = () => setSize({
      distance: Math.max(0, trackRef.current.scrollWidth - window.innerWidth),
      vw: window.innerWidth,
      vh: window.innerHeight
    });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(trackRef.current);
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, [horizontal]);

  const progress = useGatedScroll({ target: outerRef, offset: ['start start', 'end end'] });
  const smooth = useSpring(progress, spring.scrub);
  const x = useTransform(() => (horizontal ? -smooth.get() * size.distance : 0));

  return (
    <div
      ref={outerRef}
      className={`gallery${horizontal ? ' gallery--horizontal' : ''}`}
      style={horizontal && size.vh ? { height: size.distance + size.vh } : undefined}
    >
      <div className="gallery__viewport">
        <motion.div ref={trackRef} className="gallery__track" style={{ x }}>
          <div className="gallery__intro" aria-hidden="true">
            <span className="label">( SCROLL → )</span>
            <span className="display gallery__intro-text">Selected<br />Work</span>
          </div>
          <FeaturedCard trackX={x} vw={size.vw} horizontal={horizontal} />
          {comingSoon.map((p, i) => <SoonCard key={p.code} p={p} index={i + 1} />)}
        </motion.div>
      </div>
    </div>
  );
}

const zoomRest = { scale: 1, transition: { duration: 1.1, ease: ease.outExpo } };
const zoom = {
  hidden: zoomRest,
  show: zoomRest,
  rest: zoomRest,
  hover: { scale: 1.07, transition: { duration: 1.1, ease: ease.outExpo } }
};

function FeaturedCard({ trackX, vw, horizontal }) {
  const { full, fine } = useMotionMode();
  const tilt = useTilt();
  const cardRef = useRef(null);
  const [box, setBox] = useState({ left: 0, width: 1 });

  useEffect(() => {
    if (!horizontal) return undefined;
    const measure = () => setBox({ left: cardRef.current.offsetLeft, width: cardRef.current.offsetWidth });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [horizontal]);

  // From the card's left edge entering on the right to its right edge leaving on the left
  const drift = useTransform(() => {
    if (!horizontal) return '0%';
    const left = box.left + trackX.get();
    const p = Math.min(1, Math.max(0, (vw - left) / (vw + box.width)));
    return `${(-3.5 + p * 7).toFixed(3)}%`;
  });

  const distort = useDistortion(full && fine);

  return (
    <Reveal
      as="article"
      ref={cardRef}
      className="card card--featured"
      variants={fadeUp}
      viewport={view.block}
      whileHover="hover"
      {...tilt.bind}
      style={tilt.style}
    >
      <motion.div className={`card__media${distort.on ? ' is-distorting' : ''}`} {...distort.bind}>
        <motion.div className="card__zoom" variants={zoom}>
          <Picture
            name="project-smart-attendance"
            widths={[720, 1086]}
            sizes="(min-width: 1024px) 60vw, 100vw"
            alt="Smart Attendance System demo frame: a camera feed recognising Sasisekar's face with a bounding box, facial landmarks and a 0.98 match score"
            width="1086"
            height="679"
            loading="lazy"
            motionProps={{ style: { x: drift } }}
          />
        </motion.div>
      </motion.div>
      <div className="card__body">
        <p className="label">{project.code} · {project.category} · FEATURED</p>
        <h3 className="display card__title">
          <motion.a className="inline-block origin-left" href="#case-study" data-cursor="VIEW" whileTap={pressSoft}>{project.title}</motion.a>
        </h3>
        <Tags items={project.tags} />
      </div>
      <Glare glare={tilt.glare} />
    </Reveal>
  );
}

/* Card image runs through the SVG turbulence filter on hover: the warp and
   the red/cyan split spike on enter and settle like a liquid ripple. */
function useDistortion(enabled) {
  const [on, setOn] = useState(false);
  const amount = useMotionValue(0);    // 0 → 1, mapped to displacement scale 70 and channel offset 12
  useMotionValueEvent(amount, 'change', (v) => {
    document.querySelector('#fx-distort feDisplacementMap')?.setAttribute('scale', (v * 70).toFixed(2));
    document.querySelector('#fx-distort feOffset')?.setAttribute('dx', (v * 12).toFixed(2));
  });
  const bind = enabled ? {
    onPointerEnter: () => {
      setOn(true);
      animate(amount, [1, 0], { duration: 1.3, ease: ease.outExpo });
    },
    onPointerLeave: () => {
      animate(amount, [amount.get(), 0.52, 0], { duration: 0.8, times: [0, 0.25, 1], ease: ['easeOut', 'easeOut'], onComplete: () => setOn(false) });
    }
  } : {};
  return { on, bind };
}

function SoonCard({ p, index }) {
  return (
    <Reveal as="article" className="card card--soon" variants={fadeUp} index={index}>
      <div className={`card__media card__media--soon card__media--${p.variant}`} aria-hidden="true">
        <span className="label">{p.code} / {p.status}</span>
        <span className="soon__bar">
          <Loop className="soon__fill" animate={{ x: ['-100%', '250%'] }} transition={{ duration: 1.6, ease: ease.io }} />
        </span>
      </div>
      <div className="card__body">
        <p className="label">{p.code} · IN THE PIPELINE</p>
        <h3 className="display card__title">Coming soon</h3>
        <p className="card__note">{p.note}</p>
      </div>
    </Reveal>
  );
}

/* ---------- Case study ---------- */
function CaseStudy() {
  return (
    <article className="wrap case" id="case-study" aria-labelledby="case-title" tabIndex={-1}>
      <header className="case__head">
        <p className="label label-strong">FEATURED PROJECT — {project.category}</p>
        <SplitText
          as="h3"
          className="display case__title"
          id="case-title"
          text={project.title}
          by="lines"
          mask
          variants={lineReveal}
          stagger={0.1}
          initial="hidden"
          whileInView="show"
          viewport={view.text}
        />
        <Reveal as="p" className="case__intro" variants={fadeUp}>{project.intro}</Reveal>
        <Tags items={project.tags} label="Technologies" />
      </header>

      <Architecture />
      <Pipeline />

      <ol className="highlights">
        {project.highlights.map((h, i) => (
          <Reveal as="li" key={h} className="highlight" variants={fadeUp} index={i % 2}>
            <span className="label">{pad(i + 1)}</span><p>{h}</p>
          </Reveal>
        ))}
      </ol>

      <div className="case__links">
        <Button {...linkProps(project.github)} solid arrow="↗" target="_blank" rel="noopener noreferrer">View on GitHub</Button>
        <Button {...linkProps(project.demo)} arrow="↗" target="_blank" rel="noopener noreferrer">Live Demo / Video</Button>
      </div>

      <SvgDefs />
    </article>
  );
}

/* ---------- Architecture diagram ----------
   Boxes and arrows draw themselves in order as you scroll (each box, then its
   labels, then the arrow to the next box). Once complete, data packets flow
   along the arrows. Everything is transform / opacity.
   Without full motion (server render, no JavaScript, reduced motion) both
   layouts are plain, fully drawn SVG and CSS shows the one that fits. With
   full motion only the layout for this screen is rendered, and animated. */
function Architecture() {
  const { full, phone } = useMotionMode();
  const ref = useRef(null);
  const progress = useGatedScroll({ target: ref, offset: ['start 0.78', 'end 0.55'], rest: 1 });
  const smooth = useSpring(progress, spring.scrub);
  const [live, setLive] = useState(true);
  useMotionValueEvent(smooth, 'change', (v) => setLive(v > 0.995));

  return (
    <figure ref={ref} className="arch">
      <figcaption className="label">SYSTEM ARCHITECTURE</figcaption>
      {full
        ? <ArchSvg vertical={phone} progress={smooth} live={live} />
        : <><ArchSvg vertical={false} /><ArchSvg vertical /></>}
    </figure>
  );
}

/* Five boxes joined by arrows: a row on tablet+ and a column on phones */
function ArchSvg({ vertical, progress, live }) {
  const nodes = project.architecture;
  const W = vertical ? 240 : 168;
  const H = vertical ? 84 : 92;
  const STEP = vertical ? 136 : 244;
  const GAP = STEP - (vertical ? H : W);
  const box = (i) => (vertical ? { x: 60, y: 20 + i * STEP } : { x: 20 + i * STEP, y: 82 });
  const titleId = vertical ? 'arch-title-v' : 'arch-title';

  // Timeline: box 1 unit, arrow 0.7 unit; labels fade in from halfway through their box
  const totalUnits = nodes.length + (nodes.length - 1) * 0.7;
  const at = (units) => units / totalUnits;
  const boxStart = (i) => i * 1.7;

  return (
    <svg
      className={`arch__svg arch__svg--${vertical ? 'v' : 'h'}`}
      viewBox={vertical ? '0 0 360 676' : '0 0 1184 230'}
      role="img"
      aria-labelledby={vertical ? titleId : `${titleId} arch-desc`}
    >
      <title id={titleId}>{`${project.title} architecture${vertical ? `: ${nodes.map((n) => n.name).join(', ')}.` : ''}`}</title>
      {!vertical && (
        <desc id="arch-desc">ESP32-CAM sends frames over Wi-Fi to a Python and OpenCV server, which runs face recognition and records attendance in a database.</desc>
      )}
      {nodes.slice(1).map((n, i) => {
        const b = box(i);
        const start = at(boxStart(i) + 1);
        const end = at(boxStart(i) + 1.7);
        const Edge = progress ? ArchEdge : StaticEdge;
        return vertical
          ? <Edge key={n.name} x={179} y={b.y + H} length={GAP} vertical progress={progress} range={[start, end]} live={live} />
          : <Edge key={n.name} x={b.x + W} y={127} length={GAP} progress={progress} range={[start, end]} live={live} />;
      })}
      {nodes.map((n, i) => {
        const b = box(i);
        const cx = vertical ? 180 : b.x + W / 2;
        const s = boxStart(i);
        const Node = progress ? ArchNode : StaticNode;
        return (
          <Node
            key={n.name}
            node={n}
            index={i}
            box={b}
            W={W}
            H={H}
            cx={cx}
            vertical={vertical}
            progress={progress}
            drawRange={[at(s), at(s + 1)]}
            textAt={[at(s + 0.5), at(s + 0.9), at(s + 1)]}
          />
        );
      })}
    </svg>
  );
}

function ArchNode({ node, index, box, W, H, cx, vertical, progress, drawRange, textAt }) {
  const draw = useTransform(progress, drawRange, [0, 1]);
  const text = [0, 1, 2].map((k) => textAt[0] + (textAt[1] - textAt[0]) * (k / 2));
  const num = useTransform(progress, [text[0], text[0] + (textAt[2] - textAt[0]) * 0.5], [0, 1]);
  const name = useTransform(progress, [text[1], text[1] + (textAt[2] - textAt[0]) * 0.5], [0, 1]);
  const sub = useTransform(progress, [text[2], text[2] + (textAt[2] - textAt[0]) * 0.5], [0, 1]);
  return (
    <g className={`arch-node${node.hub ? ' arch-node--hub' : ''}`}>
      <motion.text className="arch-num" x={vertical ? 40 : cx} y={vertical ? box.y + 42 : 60} style={{ opacity: num }}>{pad(index + 1)}</motion.text>
      <rect className="arch-bg" x={box.x} y={box.y} width={W} height={H} />
      <DrawRect className="arch-box" x={box.x} y={box.y} width={W} height={H} weight={node.hub ? 2.5 : 1.5} progress={draw} />
      <motion.text x={cx} y={box.y + (vertical ? 38 : 42)} style={{ opacity: name }}>{node.name}</motion.text>
      <motion.text className="arch-sub" x={cx} y={box.y + (vertical ? 62 : 66)} style={{ opacity: sub }}>{node.sub}</motion.text>
    </g>
  );
}

/* The same node, fully drawn and without motion components */
function StaticNode({ node, index, box, W, H, cx, vertical }) {
  const w = node.hub ? 2.5 : 1.5;
  const h = w / 2;
  return (
    <g className={`arch-node${node.hub ? ' arch-node--hub' : ''}`}>
      <text className="arch-num" x={vertical ? 40 : cx} y={vertical ? box.y + 42 : 60}>{pad(index + 1)}</text>
      <rect className="arch-bg" x={box.x} y={box.y} width={W} height={H} />
      <g className="arch-box">
        <rect x={box.x - h} y={box.y - h} width={W + w} height={w} />
        <rect x={box.x + W - h} y={box.y - h} width={w} height={H + w} />
        <rect x={box.x - h} y={box.y + H - h} width={W + w} height={w} />
        <rect x={box.x - h} y={box.y - h} width={w} height={H + w} />
      </g>
      <text x={cx} y={box.y + (vertical ? 38 : 42)}>{node.name}</text>
      <text className="arch-sub" x={cx} y={box.y + (vertical ? 62 : 66)}>{node.sub}</text>
    </g>
  );
}

function StaticEdge({ x, y, length, vertical }) {
  return <rect className="arch-edge" x={x} y={y} width={vertical ? 2 : length} height={vertical ? length : 2} />;
}

/* Arrow drawn as a bar scaled from its start; once live, dashes travel along it */
function ArchEdge({ x, y, length, vertical, progress, range, live }) {
  const grow = useTransform(progress, range, [0, 1]);
  const PERIOD = 18;   // dash 4 + gap 14
  return (
    <g>
      <motion.rect
        className="arch-edge"
        x={x}
        y={y}
        width={vertical ? 2 : length}
        height={vertical ? length : 2}
        style={vertical ? { scaleY: grow, originY: 0 } : { scaleX: grow, originX: 0 }}
      />
      {live && (
        <svg x={vertical ? x - 2 : x} y={vertical ? y : y - 2} width={vertical ? 6 : length} height={vertical ? length : 6} overflow="hidden">
          <Loop
            as="line"
            className="arch-flow"
            x1={vertical ? 3 : -PERIOD}
            y1={vertical ? -PERIOD : 3}
            x2={vertical ? 3 : length}
            y2={vertical ? length : 3}
            animate={vertical ? { y: [0, PERIOD] } : { x: [0, PERIOD] }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </svg>
      )}
    </g>
  );
}

/* ---------- Pipeline ----------
   While on screen, the steps light up one after another (active step in the
   accent colour, finished steps in full text colour) and the bar grows. The
   colours cross-fade as stacked layers, so only opacity animates. */
function Pipeline() {
  const { full } = useMotionMode();
  const ref = useRef(null);
  const inView = useInView(ref, { margin: '-15% 0px -15% 0px' });
  const [step, setStep] = useState(-1);
  const count = project.pipeline.length;
  const cycle = count * 1.1 + 0.6;

  useEffect(() => {
    if (!full || !inView) return undefined;
    const controls = animate(0, cycle, {
      duration: cycle,
      ease: 'linear',
      repeat: Infinity,
      onUpdate: (t) => setStep(Math.min(count - 1, Math.floor(t / 1.1)))
    });
    return () => controls.stop();
  }, [full, inView, cycle, count]);

  const running = full && step >= 0;
  return (
    <div ref={ref} className="pipeline">
      <p className="label">PIPELINE</p>
      <ol className="pipeline__steps">
        {project.pipeline.map((s, i) => {
          const state = !running ? 'done' : i === step ? 'active' : i < step ? 'done' : 'waiting';
          return (
            <li key={s} className="step">
              <span className="step__layers step__num">
                <Layer on={state !== 'active'} className="text-muted" readable>{pad(i + 1)}</Layer>
                <Layer on={state === 'active'} className="text-signal">{pad(i + 1)}</Layer>
              </span>
              <span className="step__layers display step__name">
                <Layer on={state === 'done'} className="text-ink" readable>{s}</Layer>
                <Layer on={state === 'waiting'} className="text-dim">{s}</Layer>
                <Layer on={state === 'active'} className="text-accent">{s}</Layer>
              </span>
            </li>
          );
        })}
      </ol>
      <motion.span
        className="pipeline__bar"
        aria-hidden="true"
        initial={false}
        animate={{ scaleX: running ? (step + 1) / count : 1 }}
        transition={{ duration: 0.9, ease: ease.io }}
      />
    </div>
  );
}

/* One colour of a step. The "readable" layer is the one screen readers get */
function Layer({ on, className, readable = false, children }) {
  return (
    <motion.span
      className={className}
      aria-hidden={readable ? undefined : 'true'}
      initial={false}
      animate={{ opacity: on ? 1 : 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {children}
    </motion.span>
  );
}

/* Turbulence displacement + red/cyan split used by the card hover.
   Colour-matrix numbers are channel selectors, not colours. */
function SvgDefs() {
  return (
    <svg className="absolute w-0 h-0 overflow-hidden" width="0" height="0" aria-hidden="true" focusable="false">
      <filter id="fx-distort" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.008 0.018" numOctaves="2" seed="7" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" result="warp" />
        <feColorMatrix in="warp" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
        <feOffset in="red" dx="0" dy="0" result="redShift" />
        <feColorMatrix in="warp" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="cyan" />
        <feBlend in="redShift" in2="cyan" mode="screen" />
      </filter>
    </svg>
  );
}
