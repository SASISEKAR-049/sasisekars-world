/* Education, certifications and achievements as rows.
   On entry each row's rule draws left → right, then its cells rise in.
   On hover the row fills left → right and a small label with the row's
   preview text follows the cursor (mouse / trackpad only). */
import { createContext, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react';
import { achievements, certifications, education } from '../data/content.js';
import { Section, SectionHead } from './ui.jsx';
import { useCalm, useMotionMode } from '../motion/MotionRoot.jsx';
import { view } from '../motion/primitives.jsx';
import { calm as calmOf, drawLine, ease, spring, timed } from '../motion/presets.js';

const pad = (n) => String(n).padStart(2, '0');

const cellIn = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: ease.outExpo } }
};
const fillRest = { scaleX: 0, originX: 1, transition: { duration: 0.6, ease: ease.io, originX: { duration: 0 } } };
const fill = {
  hidden: fillRest,
  show: fillRest,
  hover: { scaleX: 1, originX: 0, transition: { duration: 0.6, ease: ease.io, originX: { duration: 0 } } }
};

const PreviewContext = createContext(() => {});

export default function Education() {
  const { full, fine } = useMotionMode();
  const [tip, setTip] = useState(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const tipX = useSpring(x, spring.follow);
  const tipY = useSpring(y, spring.follow);
  const followOn = full && fine;

  const preview = followOn ? {
    enter: (text, e) => { x.jump(e.clientX); y.jump(e.clientY); tipX.jump(e.clientX); tipY.jump(e.clientY); setTip(text); },
    move: (e) => { x.set(e.clientX); y.set(e.clientY); },
    leave: () => setTip(null)
  } : null;

  return (
    <Section className="education" id="education" labelledBy="education-title" bg="surface">
      <PreviewContext.Provider value={preview}>
        <div className="wrap">
          <SectionHead index="05" label="EDUCATION" meta="(2021 — 2027)" title="Education" id="education-title" />

          <div className="rows-block">
            <h3 className="rows-block__title label label-strong">Academic record</h3>
            <ul className="rows rows--4" role="list">
              {education.map((e) => (
                <Row key={e.degree} preview={e.preview}>
                  <Cell i={0} className="row__year">{e.years}</Cell>
                  <Cell i={1} className="row__main">{e.school}</Cell>
                  <Cell i={2} className="row__sub">{e.degree}</Cell>
                  <End i={3}>{e.score}</End>
                </Row>
              ))}
            </ul>
          </div>

          <div className="rows-block" id="certifications">
            <h3 className="rows-block__title label label-strong">Certifications</h3>
            <ul className="rows rows--3" role="list">
              {certifications.map((c) => (
                <Row key={c.name} preview={c.issuer}>
                  <Cell i={0} className="row__main">{c.name}</Cell>
                  <Cell i={1} className="row__sub">{c.issuer}</Cell>
                  <End i={2}>{c.year}</End>
                </Row>
              ))}
            </ul>
          </div>

          <div className="rows-block" id="achievements">
            <h3 className="rows-block__title label label-strong">Achievements</h3>
            <ul className="rows rows--2" role="list">
              {achievements.map((a, i) => (
                <Row key={a.text} preview={a.preview}>
                  <Cell i={0} className="row__num">A—{pad(i + 1)}</Cell>
                  <Cell i={1} className="row__main row__main--text">{a.text}</Cell>
                </Row>
              ))}
            </ul>
          </div>
        </div>
      </PreviewContext.Provider>

      {/* Floating label (portalled to <body> so no transformed ancestor can offset it) */}
      {followOn && createPortal(
        <motion.div className="fixed left-0 top-0 z-[120] pointer-events-none" style={{ x: tipX, y: tipY }} aria-hidden="true">
          <AnimatePresence>
            {tip && (
              <motion.div
                key={tip}
                className="absolute left-0 top-0 mt-[18px] ml-[18px] px-3 py-2 bg-accent text-on-accent font-ui font-bold text-[11px] leading-none tracking-[0.1em] uppercase whitespace-nowrap"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                {tip}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>,
        document.body
      )}
    </Section>
  );
}

function Row({ preview, children }) {
  const calm = useCalm();
  const follow = useContext(PreviewContext);
  return (
    <motion.li
      className="row"
      initial="hidden"
      whileInView="show"
      whileHover="hover"
      viewport={view.block}
      onPointerEnter={follow && ((e) => e.pointerType === 'mouse' && follow.enter(preview, e))}
      onPointerMove={follow && ((e) => e.pointerType === 'mouse' && follow.move(e))}
      onPointerLeave={follow && (() => follow.leave())}
    >
      <motion.span className="row__fill" variants={fill} aria-hidden="true" />
      {children}
      <motion.span className="row__line" data-m="" variants={calm ? calmOf(drawLine) : drawLine} aria-hidden="true" />
    </motion.li>
  );
}

/* Cells rise in after the rule has started drawing */
function Cell({ i, className, children, ...rest }) {
  const calm = useCalm();
  return (
    <motion.span className={`row__cell ${className}`} data-m="" variants={timed(calm ? calmOf(cellIn) : cellIn, 0.07, 0.5)} custom={i} {...rest}>
      {children}
    </motion.span>
  );
}

/* "—" is a placeholder for missing data, so screen readers skip it */
function End({ i, children }) {
  return <Cell i={i} className="row__end" aria-hidden={children === '—' ? 'true' : undefined}>{children}</Cell>;
}
