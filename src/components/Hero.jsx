/* Hero: a dark ROG-style poster with only a few pieces.
   - your name, huge and in the accent red: SASI top left, SEKAR bottom right
     (one row on phones)
   - a 3-line headline top right (your About quote), first line in red, with
     your name and title under a red bar
   - bottom left: availability and two buttons
   The photo is <HeroBackground /> (page level), on the right.

   Intro   the giant rows rise letter by letter; headline, name and actions slide in.
   Scroll  the two rows drift apart and everything fades. */
import { motion, useTransform } from 'motion/react';
import { about, profile } from '../data/content.js';
import { Button, Pulse, Section } from './ui.jsx';
import { SplitText } from '../motion/SplitText.jsx';
import { useCalm, useGatedScroll, useMotionMode } from '../motion/MotionRoot.jsx';
import { calm as calmOf, charReveal, ease, timed } from '../motion/presets.js';

/* Giant name: "SASISEKAR" as SASI / SEKAR */
const FIRST = profile.first.toUpperCase();
const ROWS = [FIRST.slice(0, 4), FIRST.slice(4)];

/* Headline: the About quote without its quotation marks, three words per line */
const QUOTE_WORDS = about.quote.replace(/[“”"]/g, '').trim().split(/\s+/);
const HEADLINE = [0, 1, 2].map((i) => QUOTE_WORDS.slice(i * 3, i === 2 ? undefined : i * 3 + 3).join(' '));

const slideIn = {
  hidden: { opacity: 0, x: 40 },
  show: { opacity: 1, x: 0, transition: { duration: 1.1, ease: ease.outExpo } }
};
const riseIn = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 1, ease: ease.outExpo } }
};

export default function Hero({ sectionRef }) {
  const { intro } = useMotionMode();
  const calm = useCalm();
  const state = intro ? 'show' : 'hidden';
  const play = (variants, i = 0, stagger = 0.08, delay = 0) => ({
    'data-m': '',
    variants: timed(calm ? calmOf(variants) : variants, stagger, delay),
    custom: i,
    initial: 'hidden',
    animate: state
  });

  /* Scroll: the two rows drift apart, everything fades */
  const progress = useGatedScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const driftLeft = useTransform(progress, [0, 1], ['0%', '-12%']);
  const driftRight = useTransform(progress, [0, 1], ['0%', '12%']);
  const fadeOut = useTransform(progress, [0, 0.65], [1, 0]);

  const giant = (text, delay) => (
    <SplitText as="span" className="block" text={text} by="chars" mask label={false} variants={charReveal} stagger={0.05} delay={delay} initial="hidden" animate={state} />
  );

  return (
    <Section plain sectionRef={sectionRef} className="hero" id="top" labelledBy="hero-title" bg="bg">
      {/* data-theme="dark": the landing page is always the dark poster, in either theme */}
      <motion.div className="hero__stage" data-theme="dark" style={{ opacity: fadeOut }}>
        {/* Giant name (decorative: the real heading is the h1 below) */}
        <div className="hero__word" aria-hidden="true">
          <motion.div className="hero__row hero__row--0" style={{ x: driftLeft }}>{giant(ROWS[0], 0.15)}</motion.div>
          <motion.div className="hero__row hero__row--1" style={{ x: driftRight }}>{giant(ROWS[1], 0.4)}</motion.div>
          <div className="hero__row hero__row--single">{giant(FIRST, 0.3)}</div>
        </div>

        {/* Headline + name, top right */}
        <div className="hero__intro">
          <p className="hero__headline">
            <span className="sr-only">{about.quote}</span>
            {HEADLINE.map((line, i) => (
              <motion.span key={line} className={`block${i === 0 ? ' text-accent' : ''}`} aria-hidden="true" {...play(slideIn, i, 0.1, 0.5)}>
                {line}
              </motion.span>
            ))}
          </p>
          <motion.div className="hero__id" {...play(riseIn, 0, 0, 0.9)}>
            <h1 id="hero-title" className="hero__name">{profile.name}</h1>
            <p className="hero__title">{profile.kicker}</p>
          </motion.div>
        </div>

        {/* Availability + actions, bottom left */}
        <div className="hero__actions">
          <motion.p className="hero__status" {...play(riseIn, 0, 0.08, 1.1)}><Pulse /> {profile.status}</motion.p>
          <motion.div className="flex flex-wrap gap-3" {...play(riseIn, 1, 0.08, 1.1)}>
            <Button href="#projects" solid arrow="↓" className="max-sm:flex-[1_1_100%]">View Projects</Button>
            <Button href="#contact" arrow="→" className="max-sm:flex-[1_1_100%]">Get in Touch</Button>
          </motion.div>
        </div>
      </motion.div>
    </Section>
  );
}
