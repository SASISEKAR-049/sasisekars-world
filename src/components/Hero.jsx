/* Hero: the signature moment.
   Intro   the name rises character by character, the kicker decodes from
           random glyphs, the supporting blocks fade up, the typewriter starts.
   Scroll  the name scales, blurs and fades out, its two lines drift apart and
           the supporting text lifts away.
   The full-screen photo behind it is <HeroBackground /> (page level). */
import { motion, steps, useScroll, useTransform } from 'motion/react';
import { profile } from '../data/content.js';
import { Button, Pulse, Section } from './ui.jsx';
import { SplitText } from '../motion/SplitText.jsx';
import { useGatedScroll, useMotionMode } from '../motion/MotionRoot.jsx';
import { useScramble, useTypewriter } from '../motion/hooks.js';
import { Loop } from '../motion/primitives.jsx';
import { calm as calmOf, charReveal, ease, timed } from '../motion/presets.js';

const NAME_AT = 0.15;      // seconds after the entry screen lifts
const NAME_STAGGER = 0.045;
const FADE_AT = 0.55;

const heroFade = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 1.3, ease: ease.outExpo } }
};
const kickerIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.01, delay: NAME_AT } }
};

export default function Hero({ sectionRef }) {
  const { full, calm, intro } = useMotionMode();
  const state = intro ? 'show' : 'hidden';

  /* ---------- Intro pieces ---------- */
  const kicker = useScramble(profile.kicker, full && intro, { delay: NAME_AT, duration: 1.4 });
  const typer = useTypewriter(profile.typer, full && intro, { startDelay: 1.6 });
  const fade = (i) => ({
    'data-m': '',
    variants: timed(calm ? calmOf(heroFade) : heroFade, 0.09, FADE_AT),
    custom: i,
    initial: 'hidden',
    animate: state
  });

  /* ---------- Scroll-out ---------- */
  const progress = useGatedScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const nameScale = useTransform(progress, [0, 1], [1, 1.14]);
  const nameY = useTransform(progress, [0, 1], ['0%', '-16%']);
  const nameOpacity = useTransform(progress, [0, 1], [1, 0]);
  const nameBlur = useTransform(progress, (p) => (p > 0.001 ? `blur(${(p * 16).toFixed(2)}px)` : 'none'));
  const lineLeft = useTransform(progress, [0, 1], ['0%', '-7%']);
  const lineRight = useTransform(progress, [0, 1], ['0%', '9%']);
  // Supporting pieces leave one just after another
  const leave = (i) => [i * 0.034, 0.862 + i * 0.034];
  const out = [0, 1, 2, 3, 4].map((i) => ({
    y: useTransform(progress, leave(i), ['0%', '-60%']),
    opacity: useTransform(progress, leave(i), [1, 0])
  }));

  /* Live scroll percentage of the whole page */
  const { scrollYProgress } = useScroll();
  const percent = useTransform(scrollYProgress, (v) => `${String(Math.round(v * 100)).padStart(2, '0')}%`);

  return (
    <Section plain sectionRef={sectionRef} className="hero relative flex min-h-svh pt-[calc(var(--header-h)+20px)] pb-7" id="top" labelledBy="hero-title" bg="bg">
      <div className="wrap flex flex-col gap-[clamp(20px,2.6vw,36px)]">
        <motion.div className="flex justify-between gap-4 pb-3.5 border-b border-line" {...fade(0)}>
          <span className="label label-strong">[ 00 / INDEX ]</span>
          <span className="label hidden mdx:block">{profile.coords}</span>
          <span className="label">PORTFOLIO — 2026</span>
        </motion.div>

        <motion.p className="hero__kicker mt-auto font-ui font-semibold text-[clamp(11px,1vw,14px)] leading-[1.4] tracking-[0.22em] text-accent min-h-[1.4em]" style={out[0]}>
          <span className="sr-only">AI &amp; Data Science Developer</span>
          <motion.span aria-hidden="true" data-m="" variants={calm ? calmOf(kickerIn) : kickerIn} initial="hidden" animate={state}>{kicker}</motion.span>
        </motion.p>

        <motion.h1
          className="display hero__name text-hero leading-[0.9] origin-[50%_60%] will-change-[transform,filter]"
          id="hero-title"
          aria-label="Sasisekar R L"
          style={{ scale: nameScale, y: nameY, opacity: nameOpacity, filter: nameBlur }}
          initial="hidden"
          animate={state}
        >
          <SplitText
            as="span"
            className="block overflow-hidden py-[0.07em] -my-[0.07em]"
            text={profile.first}
            by="chars"
            label={false}
            variants={charReveal}
            stagger={NAME_STAGGER}
            delay={NAME_AT}
            unitClassName="origin-bottom-left"
            style={{ x: lineLeft }}
          />
          <SplitText
            as="span"
            className="block overflow-hidden py-[0.07em] -my-[0.07em] md:text-right"
            text={profile.initials}
            by="chars"
            label={false}
            variants={charReveal}
            stagger={NAME_STAGGER}
            delay={NAME_AT + profile.first.length * NAME_STAGGER}
            unitClassName="origin-bottom-left"
            style={{ x: lineRight }}
          />
        </motion.h1>

        <motion.div className="grid gap-6 mdx:grid-cols-[minmax(0,5fr)_minmax(0,4fr)_auto] mdx:items-end mdx:gap-(--gutter)" style={out[1]}>
          <div>
            <p className="font-semibold text-lead leading-[1.3] tracking-[-0.015em] max-w-[30ch]">{profile.role}</p>
            <p className="mt-2.5 text-muted max-w-[46ch]">{profile.tagline}</p>
          </div>

          <motion.div className="grid gap-3" {...fade(1)}>
            <p className="font-mono font-medium text-[clamp(14px,1.2vw,17px)] leading-[1.4] min-h-[1.4em]">
              <span className="sr-only">{profile.typer.join(', ')}</span>
              <span aria-hidden="true">
                <span className="text-signal">&gt;</span> <motion.span>{typer}</motion.span>
                <span className="inline-block w-[0.55em] h-[1.05em] ml-[3px] align-[-0.15em]">
                  <Loop className="block w-full h-full bg-accent" animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, times: [0, 0.5, 1], ease: steps(1) }} />
                </span>
              </span>
            </p>
            <ul className="grid gap-1 font-ui font-semibold text-[11px] leading-[1.7] tracking-[0.08em] uppercase text-muted" role="list">
              <li className="text-ink"><Pulse /> {profile.status}</li>
              <li>{profile.location}</li>
            </ul>
          </motion.div>

          <motion.div className="flex flex-wrap gap-3" {...fade(2)}>
            <Button href="#projects" solid arrow="↓" className="max-[560px]:flex-[1_1_100%]">View Projects</Button>
            <Button href="#contact" arrow="→" className="max-[560px]:flex-[1_1_100%]">Get in Touch</Button>
          </motion.div>
        </motion.div>

        <motion.div className="flex items-center gap-3.5" aria-hidden="true" {...fade(3)}>
          <motion.span className="relative w-16 h-px bg-line overflow-hidden" style={out[2]}>
            <Loop className="absolute inset-0 bg-accent" animate={{ x: ['-100%', '100%', '100%'] }} transition={{ duration: 1.8, times: [0, 0.6, 1], ease: ease.io }} />
          </motion.span>
          <motion.span className="label" style={out[3]}>Scroll</motion.span>
          <motion.span className="label ml-auto text-ink tabular-nums" style={out[4]}>{percent}</motion.span>
        </motion.div>
      </div>
    </Section>
  );
}
