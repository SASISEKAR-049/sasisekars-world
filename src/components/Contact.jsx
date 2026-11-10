/* Contact (letters dodge the cursor, click-to-copy email) + curtain footer */
import { useEffect, useRef, useState } from 'react';
import { animate, motion, useAnimate, useInView, useMotionValue, useSpring, useTransform } from 'motion/react';
import { profile } from '../data/content.js';
import { Button, Pulse, Roll, Section, ULink } from './ui.jsx';
import { copyText, useToast } from './Toast.jsx';
import { SplitText } from '../motion/SplitText.jsx';
import { useGatedScroll, useMotionMode } from '../motion/MotionRoot.jsx';
import { useInterval, useMagnetic } from '../motion/hooks.js';
import { Reveal, useSection, view } from '../motion/primitives.jsx';
import { calm as calmOf, charRise, ease, fadeUp, spring, timed } from '../motion/presets.js';

const TITLE = 'LET’S BUILD SOMETHING.';
const RADIUS = 170;
const PUSH = 56;

export function Contact() {
  const toast = useToast();
  const magnet = useMagnetic(0.15);

  async function copyEmail() {
    const ok = await copyText(profile.email);
    toast(ok ? `Copied ✓  ${profile.email}` : 'Copy failed: please select the address and copy it', ok ? 'success' : 'error');
  }

  return (
    <Section className="contact" id="contact" labelledBy="contact-title" bg="deep">
      <div className="wrap">
        <div className="section-head__top">
          <span className="label label-strong">[ 06 / CONTACT ]</span>
          <span className="label"><Pulse /> {profile.status}</span>
        </div>

        <RepelTitle />

        <Reveal as="p" className="contact__sub" variants={fadeUp}>Open to internships and entry-level opportunities in AI, ML and backend development.</Reveal>

        <Reveal className="contact__email-row" variants={fadeUp}>
          <ULink
            as="button"
            className="contact__email"
            type="button"
            data-cursor="COPY"
            aria-label={`Copy email address ${profile.email}`}
            onClick={copyEmail}
            {...magnet.bind}
            style={magnet.style}
          >
            {profile.email}
          </ULink>
          <span className="label contact__hint">Click to copy · or <ULink href={`mailto:${profile.email}`}>open your mail app ↗</ULink></span>
        </Reveal>

        <Reveal as="ul" className="contact__links" role="list" variants={fadeUp}>
          <li><span className="label">Phone</span><Roll className="contact__link" href={profile.phoneHref}>{profile.phone}</Roll></li>
          <li><span className="label">LinkedIn</span><Roll className="contact__link" href={profile.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</Roll></li>
          <li><span className="label">GitHub</span><Roll className="contact__link" href={profile.github} target="_blank" rel="noopener noreferrer">GitHub ↗</Roll></li>
          <li><span className="label">Résumé</span><Button href={profile.resume} solid arrow="↓" download="Sasisekar-RL-Resume.pdf">Download Résumé</Button></li>
        </Reveal>
      </div>
    </Section>
  );
}

/* "LET'S BUILD SOMETHING." rises letter by letter. Then, with a mouse, each
   letter is pushed away from the cursor (and tilts) when it comes close; on
   touch screens the letters ripple once instead. */
function RepelTitle() {
  const { full, fine } = useMotionMode();
  const section = useSection();
  const titleRef = useRef(null);
  const letters = useRef([]);
  const rippleIn = useInView(titleRef, { once: true, margin: '0px 0px -40% 0px' });

  // Mouse: push letters inside RADIUS away from the cursor
  useEffect(() => {
    const area = section?.current;
    const title = titleRef.current;
    if (!full || !fine || !area || !title) return undefined;
    const centre = (el) => {   // untransformed centre, from offsets (ignores transforms)
      let x = el.offsetWidth / 2;
      let y = el.offsetHeight / 2;
      let node = el;
      while (node && node !== title) { x += node.offsetLeft; y += node.offsetTop; node = node.offsetParent; }
      return { x, y };
    };
    const onMove = (e) => {
      const box = title.getBoundingClientRect();
      letters.current.forEach((l) => {
        if (!l?.el) return;
        const p = centre(l.el);
        const dx = box.left + p.x - e.clientX;
        const dy = box.top + p.y - e.clientY;
        const d = Math.hypot(dx, dy) || 1;
        const f = d < RADIUS ? 1 - d / RADIUS : 0;
        l.x.set((dx / d) * f * PUSH);
        l.y.set((dy / d) * f * PUSH);
        l.r.set((dx / d) * f * 16);
      });
    };
    const onLeave = () => letters.current.forEach((l) => { l?.x.set(0); l?.y.set(0); l?.r.set(0); });
    area.addEventListener('pointermove', onMove);
    area.addEventListener('pointerleave', onLeave);
    return () => { area.removeEventListener('pointermove', onMove); area.removeEventListener('pointerleave', onLeave); };
  }, [full, fine, section]);

  // Touch: one ripple after the letters have landed
  useEffect(() => {
    if (!full || fine || !rippleIn) return undefined;
    const runs = letters.current.map((l, i) => l && animate(l.y, [0, -18, 0], { duration: 0.8, ease: ease.sine, delay: 1.2 + i * 0.035 }));
    return () => runs.forEach((r) => r?.stop());
  }, [full, fine, rippleIn]);

  return (
    <SplitText
      as="h2"
      ref={titleRef}
      className="display contact__title"
      id="contact-title"
      text={TITLE}
      by="chars"
      initial="hidden"
      whileInView="show"
      viewport={view.block}
    >
      {({ unit, index, key }) => <Letter key={key} char={unit} index={index} register={(l) => { letters.current[index] = l; }} />}
    </SplitText>
  );
}

function Letter({ char, index, register }) {
  const { calm, full } = useMotionMode();
  return (
    // Outer span plays the reveal; the inner one dodges the cursor (full motion only)
    <motion.span className="split-unit" data-m="" variants={timed(calm ? calmOf(charRise) : charRise, 0.03)} custom={index}>
      {full ? <Dodge register={register}>{char}</Dodge> : char}
    </motion.span>
  );
}

function Dodge({ register, children }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const r = useMotionValue(0);
  const sx = useSpring(x, spring.soft);
  const sy = useSpring(y, spring.soft);
  const sr = useSpring(r, spring.soft);
  useEffect(() => { register({ el: ref.current, x, y, r }); }, [register, x, y, r]);
  return <motion.span ref={ref} className="inline-block" style={{ x: sx, y: sy, rotate: sr }}>{children}</motion.span>;
}

/* ---------- Footer ----------
   Curtain: the content starts shifted up and settles as the page reaches the
   bottom, as if uncovered from beneath. The giant wordmark rises letter by
   letter. Live IST clock. Back to top: the arrow launches, the page glides home. */
export function Footer({ inert }) {
  const { full } = useMotionMode();
  const ref = useRef(null);
  const curtain = useGatedScroll({ target: ref, offset: ['start end', 'end end'], rest: 1 });
  const y = useTransform(curtain, [0, 1], ['-40%', '0%']);
  const markIn = useInView(ref, view.deep);

  return (
    <footer ref={ref} className="footer" inert={inert}>
      <motion.div className="footer__inner" style={{ y }}>
        <div className="wrap footer__row">
          <p className="label footer__clock">IST <Clock /> · TAMIL NADU, IN</p>
          <BackToTop animated={full} />
          <p className="label">© 2026 {profile.name}</p>
        </div>
        <SplitText
          as="p"
          className="display footer__mark"
          text={profile.first}
          by="chars"
          label={false}
          aria-hidden="true"
          variants={charRise}
          stagger={0.05}
          initial="hidden"
          animate={markIn ? 'show' : 'hidden'}
        />
      </motion.div>
    </footer>
  );
}

let istFormat;   // created on the first tick (it is slow to build), shared afterwards
function formatIST(now) {
  if (istFormat === undefined) {
    try {
      istFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
    } catch (e) { istFormat = null; }   // very old browser: offset by hand
  }
  return istFormat ? istFormat.format(now) : new Date(now.getTime() + (330 + now.getTimezoneOffset()) * 60000).toTimeString().slice(0, 8);
}

function Clock() {
  const [now, setNow] = useState(null);   // the server renders "--:--:--"
  useInterval(() => setNow(new Date()), 1000);
  return <time dateTime={now ? now.toISOString() : undefined}>{now ? formatIST(now) : '--:--:--'}</time>;
}

const ringHover = { rest: { opacity: 0, transition: { duration: 0.3 } }, hover: { opacity: 1, transition: { duration: 0.3 } } };

function BackToTop({ animated }) {
  const [scope, run] = useAnimate();
  const magnet = useMagnetic();
  const launch = () => {
    if (!animated) return;
    run([
      ['[data-arrow]', { y: -48, opacity: 0 }, { duration: 0.35, ease: ease.in }],
      ['[data-arrow]', { y: 48 }, { duration: 0 }],
      ['[data-arrow]', { y: 0, opacity: 1 }, { duration: 0.6, ease: ease.outExpo, at: '+0.5' }]
    ]);
  };
  return (
    <motion.a
      ref={scope}
      className="footer__top"
      href="#top"
      data-scroll-duration="2.2"
      initial="rest"
      whileHover="hover"
      whileFocus="hover"
      whileTap={{ scale: 0.97 }}
      onClick={launch}
      {...magnet.bind}
      style={magnet.style}
    >
      <span className="footer__top-arrow" aria-hidden="true">
        <motion.span className="footer__top-ring" variants={ringHover} />
        <motion.span className="inline-block" data-arrow="">↑</motion.span>
      </span>
      <span>Back to top</span>
    </motion.a>
  );
}
