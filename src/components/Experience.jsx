/* Experience: a timeline rail that draws with the scroll, and sticky cards
   that stack. Each card slides in from alternating sides, its year counts up,
   and it shrinks and dims as the next card arrives on top of it. */
import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { experience } from '../data/content.js';
import { Section, SectionHead, ULink, linkProps } from './ui.jsx';
import { useGatedScroll, useMotionMode } from '../motion/MotionRoot.jsx';
import { CountUp, Reveal, view } from '../motion/primitives.jsx';
import { ease } from '../motion/presets.js';

const pad = (n) => String(n).padStart(2, '0');
const years = experience.map((x) => x.year);

const cardIn = {
  hidden: (i) => ({ opacity: 0, x: i % 2 === 0 ? '-18%' : '18%', rotateY: i % 2 === 0 ? 14 : -14 }),
  show: { opacity: 1, x: '0%', rotateY: 0, transition: { duration: 1.4, ease: ease.outExpo } }
};

export default function Experience() {
  const listRef = useRef(null);
  const { tops, vh } = useStaticTops(listRef);
  const { scrollY } = useScroll();
  const railRef = useRef(null);
  const rail = useGatedScroll({ target: railRef, offset: ['start 0.7', 'end 0.6'], rest: 1 });

  return (
    <Section className="experience" id="experience" labelledBy="experience-title" bg="bg">
      <div className="wrap">
        <SectionHead index="04" label="EXPERIENCE" meta={`(${Math.min(...years)} — ${Math.max(...years)})`} title="Experience" id="experience-title" />

        <div ref={railRef} className="xp">
          <div className="xp__rail" aria-hidden="true">
            <span className="xp__rail-track" />
            <motion.span className="xp__rail-draw" style={{ scaleY: rail }} />
          </div>
          <ol ref={listRef} className="xp__list">
            {experience.map((x, i) => (
              <Card
                key={x.role}
                item={x}
                index={i}
                scrollY={scrollY}
                // From the next card's top entering the screen until it is 30% from the top
                range={tops[i + 1] === undefined ? null : [tops[i + 1] - vh, tops[i + 1] - vh * 0.3]}
              />
            ))}
          </ol>
        </div>
      </div>
    </Section>
  );
}

/* Document position of each card as laid out before sticking. Sticky cards
   report their stuck position while pinned, so scroll ranges are computed
   from the list's own top plus the heights and gaps before each card. */
function useStaticTops(listRef) {
  const [layout, setLayout] = useState({ tops: [], vh: 0 });
  useEffect(() => {
    const list = listRef.current;
    const measure = () => {
      const gap = parseFloat(getComputedStyle(list).rowGap) || 0;
      let y = list.getBoundingClientRect().top + window.scrollY;
      const tops = [...list.children].map((li) => { const top = y; y += li.offsetHeight + gap; return top; });
      setLayout({ tops, vh: window.innerHeight });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    window.addEventListener('load', measure, { once: true });
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('load', measure); window.removeEventListener('resize', measure); };
  }, [listRef]);
  return layout;
}

function Card({ item, index, scrollY, range }) {
  const { full } = useMotionMode();
  // 0 → 1 while the next card arrives on top of this one
  const covered = useTransform(() => {
    const y = scrollY.get();
    if (!full || !range) return 0;
    return Math.min(1, Math.max(0, (y - range[0]) / (range[1] - range[0])));
  });
  const scale = useTransform(covered, [0, 1], [1, 0.9]);
  const shade = useTransform(covered, [0, 1], [0, 0.6]);

  return (
    <motion.li className="xp-card" style={{ '--i': index, scale }}>
      <Reveal className="xp-card__inner" variants={cardIn} index={index} stagger={0} viewport={view.text} style={{ transformPerspective: 1200 }}>
        <p className="xp-card__year">
          <CountUp value={item.year} from={item.year - 26} seconds={1.6} viewport={view.image} />
        </p>
        <div className="xp-card__body">
          <p className="label">{pad(index + 1)} / {pad(experience.length)} · {item.kind}</p>
          <h3 className="xp-card__role">{item.role}</h3>
          <p className="xp-card__org">{item.org}</p>
          {item.cert && <ULink className="link-mono" {...linkProps(item.cert)} target="_blank" rel="noopener noreferrer">View Certificate ↗</ULink>}
        </div>
        {/* Opaque shade (not card opacity), so the card below never shows through */}
        <motion.span className="xp-card__shade" style={{ opacity: shade }} aria-hidden="true" />
      </Reveal>
    </motion.li>
  );
}
