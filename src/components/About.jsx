/* About: scroll-scrubbed quote (pinned on desktop), portrait with a
   computer-vision scan overlay, bio, counters. */
import { useEffect, useRef } from 'react';
import { animate, motion, useInView, useMotionValue, useMotionValueEvent, useTransform } from 'motion/react';
import { about } from '../data/content.js';
import { Picture, Section, SectionHead } from './ui.jsx';
import { SplitText } from '../motion/SplitText.jsx';
import { useCalm, useGatedScroll, useMotionMode } from '../motion/MotionRoot.jsx';
import { CountUp, DrawRect, Loop, Reveal, view } from '../motion/primitives.jsx';
import { calm as calmOf, clipReveal, ease, fadeUp, zoomSettle } from '../motion/presets.js';

export default function About() {
  const { full, desktop } = useMotionMode();
  const pin = full && desktop;
  const pinRef = useRef(null);
  const bioRef = useRef(null);

  // Quote: pinned for 110vh of scrolling on desktop, otherwise lit while it crosses the screen
  const quoteProgress = useGatedScroll({
    target: pinRef,
    offset: pin ? ['start start', 'end end'] : ['start 0.82', 'end 0.5'],
    rest: 1
  });
  const bioProgress = useGatedScroll({ target: bioRef, offset: ['start 0.82', 'end 0.5'], rest: 1 });

  return (
    <Section className="about" id="about" labelledBy="about-title" bg="surface">
      <div className="wrap">
        <SectionHead index="01" label="ABOUT" meta="PROFILE · STELLA MARY’S COLLEGE OF ENGINEERING" title="About" id="about-title" />

        <div ref={pinRef} className={`about__pin${pin ? ' about__pin--on' : ''}`}>
          <div className="about__quote-wrap">
            <ScrubText className="about__quote" text={about.quote} progress={quoteProgress} />
          </div>
        </div>

        <div className="about__grid">
          <Portrait />

          <div className="about__bio">
            <p className="label">( BIO )</p>
            <div ref={bioRef}>
              <ScrubText className="about__text" text={about.bio} progress={bioProgress} />
            </div>
            <dl className="stats">
              {about.stats.map((s) => (
                <div key={s.label} className="stat">
                  <dt className="label">{s.label}</dt>
                  <dd><CountUp value={s.value} decimals={s.decimals || 0} viewport={view.text} /></dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="about__aside">
            <List title="Areas of Interest" items={about.interests} />
            <List title="Hobbies" items={about.hobbies} />
          </div>
        </div>
      </div>
    </Section>
  );
}

/* Words light up one after another as `progress` goes 0 → 1. They rest at
   --scrub-rest opacity, a value per theme that keeps AA contrast (CSS turns
   --p into opacity). One subscription to the Motion value writes every word,
   instead of one motion component per word. */
function ScrubText({ text, progress, className }) {
  const ref = useRef(null);
  const paint = (v) => {
    const words = ref.current?.querySelectorAll('.scrub-word');
    if (!words) return;
    const span = 0.5 + 0.1 * (words.length - 1);   // same spacing as the old stagger: 0.5 per word, 0.1 apart
    words.forEach((word, i) => {
      const p = Math.min(1, Math.max(0, (v - (i * 0.1) / span) / (0.5 / span))).toFixed(3);
      if (word.style.getPropertyValue('--p') !== p) word.style.setProperty('--p', p);
    });
  };
  useMotionValueEvent(progress, 'change', paint);
  useEffect(() => paint(progress.get()));   // after every render (e.g. a mode change), match the current value
  return (
    <SplitText as="p" ref={ref} className={className} text={text} by="words">
      {({ unit, key }) => <span key={key} className="scrub-word">{unit}</span>}
    </SplitText>
  );
}

/* Portrait: unmasks from the bottom while the photo settles from 1.3×, greyscale
   turns to colour on hover. The scan overlay then frames the face. */
const portraitImg = {
  hidden: { ...zoomSettle.hidden, filter: 'grayscale(1) contrast(1.05)' },
  show: { ...zoomSettle.show, filter: 'grayscale(1) contrast(1.05)' },
  hover: { filter: 'grayscale(0) contrast(1)', transition: { duration: 0.8, ease: ease.outExpo } }
};

function Portrait() {
  const calm = useCalm();
  return (
    <motion.figure className="portrait" initial="hidden" whileInView="show" whileHover="hover" viewport={view.image}>
      {/* Greyscale portrait that turns to colour on hover. If you change the
          photo, move the scan box below so it still frames the face. */}
      <motion.div className="portrait__media" data-m="" variants={calm ? calmOf(clipReveal) : clipReveal}>
        <Picture
          name="portrait"
          widths={[600, 1000]}
          sizes="(min-width: 1100px) 32vw, (min-width: 768px) 40vw, 100vw"
          alt="Portrait of Sasisekar R L standing on a rooftop with arms crossed, hills and sky behind"
          width="1000"
          height="1250"
          loading="lazy"
          data-m=""
          motionProps={{ variants: calm ? { ...portraitImg, hidden: portraitImg.show } : portraitImg }}
        />
        <Scan />
      </motion.div>
      <figcaption className="figcap label"><span>FIG. 01 — SASISEKAR R L</span><span>CV_SCAN · LIVE</span></figcaption>
    </motion.figure>
  );
}

/* Face box draws itself, corners blink, the confidence score counts to 0.98 and a
   scan line sweeps the photo. Server and reduced-motion renders show the final frame. */
function Scan() {
  const { full } = useMotionMode();
  const ref = useRef(null);
  const inView = useInView(ref, view.deep);
  const draw = useMotionValue(1);
  const corners = useMotionValue(1);
  const tag = useMotionValue(1);
  const score = useMotionValue(0.98);
  const scoreText = useTransform(score, (v) => `FACE_DETECTED: ${v.toFixed(2)}`);
  const started = useRef(false);

  useEffect(() => {
    if (!full) { draw.set(1); corners.set(1); tag.set(1); score.set(0.98); return undefined; }
    if (!inView) {
      if (!started.current) { draw.set(0); corners.set(0); tag.set(0); score.set(0); }
      return undefined;
    }
    if (started.current) return undefined;
    started.current = true;
    const runs = [
      animate(draw, 1, { duration: 1.4, ease: ease.io, delay: 0.4 }),
      animate(corners, [0, 1, 0, 1, 0, 1], { duration: 1.4, ease: 'linear', delay: 0.9 }),
      animate(tag, 1, { duration: 0.3, delay: 1.5 }),
      animate(score, 0.98, { duration: 1.2, ease: 'easeOut', delay: 1.5 })
    ];
    return () => runs.forEach((r) => r.complete());
  }, [full, inView, draw, corners, tag, score]);

  return (
    <svg ref={ref} className="scan" viewBox="0 0 400 500" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="scan-trail" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <Loop as="g" className="scan__line" style={{ y: 0 }} animate={{ y: [0, 560] }} transition={{ duration: 2.8, ease: ease.sine, repeatDelay: 0.4 }}>
        <rect x="0" y="-60" width="400" height="60" fill="url(#scan-trail)" />
        <rect x="0" y="-2" width="400" height="2" />
      </Loop>
      <DrawRect className="scan__box" x={150} y={92} width={120} height={134} weight={2} progress={draw} />
      <motion.g className="scan__corners" style={{ opacity: corners }}><path d="M142 104V84H162M258 84H278V104M278 214V234H258M162 234H142V214" /></motion.g>
      <motion.g className="scan__tag" style={{ opacity: tag }}>
        <rect x="150" y="54" width="200" height="28" />
        <motion.text x="160" y="73">{scoreText}</motion.text>
      </motion.g>
    </svg>
  );
}

function List({ title, items }) {
  return (
    <Reveal className="about__group" variants={fadeUp}>
      <h3 className="label">{title}</h3>
      <ul className="stack-list" role="list">
        {items.map((t) => <li key={t}>{t}</li>)}
      </ul>
    </Reveal>
  );
}
