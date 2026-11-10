/* Small shared building blocks used across sections.
   Every link and button here has a hover state and a press state. */
import { useRef } from 'react';
import { motion } from 'motion/react';
import { SplitText } from '../motion/SplitText.jsx';
import { useMagnetic } from '../motion/hooks.js';
import { Loop, Parallax, SectionContext, view } from '../motion/primitives.jsx';
import { calm as calmOf, ease, fadeUpSmall, hoverTransition, lineReveal, press, pressSoft, timed } from '../motion/presets.js';
import { useCalm } from '../motion/MotionRoot.jsx';

/* Interactive elements share three variant states: rest → hover → press */
const pressable = { press };
const pressableSoft = { press: pressSoft };
const fillWipe = {
  rest: { clipPath: 'inset(100% 0% 0% 0%)', transition: hoverTransition },
  hover: { clipPath: 'inset(0% 0% 0% 0%)', transition: hoverTransition }
};
const arrowOut = {
  rest: { x: '0%', y: '0%', transition: hoverTransition },
  hover: { x: '120%', y: '-120%', transition: hoverTransition }
};
const arrowIn = {
  rest: { x: '-120%', y: '120%', transition: hoverTransition },
  hover: { x: '0%', y: '0%', transition: hoverTransition }
};
const rollText = {
  rest: { y: '0%', transition: hoverTransition },
  hover: { y: '-100%', transition: hoverTransition }
};
/* Underline draws in from the left, retracts to the right */
const underline = {
  rest: { scaleX: 0, originX: 1, transition: { duration: 0.5, ease: ease.io, originX: { duration: 0 } } },
  hover: { scaleX: 1, originX: 0, transition: { duration: 0.5, ease: ease.io, originX: { duration: 0 } } }
};
const ring = { hover: { opacity: 1, transition: { duration: 0.3 } } };

/* Arrow that slides out to the top right while a copy slides in */
export function Arrow({ char = '→' }) {
  return (
    <span className="btn__arrow" aria-hidden="true">
      <motion.i variants={arrowOut}>{char}</motion.i>
      <motion.i variants={arrowIn}>{char}</motion.i>
    </span>
  );
}

/* Primary button: an accent fill wipes up (carrying its own copy of the label,
   so the text changes colour exactly at the wipe edge), the arrow swaps, and
   the whole button is magnetic on fine pointers. Renders <a> or <button>. */
export function Button({ as = 'a', children, arrow = '→', solid = false, magnet, className = '', ...rest }) {
  const Tag = motion[as];
  const mag = useMagnetic(magnet);
  return (
    <Tag
      className={`btn ${solid ? 'btn--solid' : ''} ${className}`}
      variants={pressable}
      initial="rest"
      whileHover="hover"
      whileFocus="hover"
      whileTap="press"
      {...mag.bind}
      style={mag.style}
      {...rest}
    >
      <span className="btn__face">{children} <Arrow char={arrow} /></span>
      <motion.span className="btn__fill" variants={fillWipe} aria-hidden="true">
        <span className="btn__face">{children} <Arrow char={arrow} /></span>
      </motion.span>
    </Tag>
  );
}

/* Rolling-text link: the label slides up and an accent copy rolls in from below */
export function Roll({ href, children, className = '', ...rest }) {
  return (
    <motion.a href={href} className={`roll ${className}`} variants={pressableSoft} initial="rest" whileHover="hover" whileFocus="hover" whileTap="press" {...rest}>
      <motion.span className="roll__inner" variants={rollText}>
        <span>{children}</span>
        <span aria-hidden="true">{children}</span>
      </motion.span>
    </motion.a>
  );
}

/* Text link or button with an underline that draws in on hover */
export function ULink({ as = 'a', children, className = '', ...rest }) {
  const Tag = motion[as];
  return (
    <Tag className={`u ${className}`} variants={pressableSoft} initial="rest" whileHover="hover" whileFocus="hover" whileTap="press" {...rest}>
      {children}
      <motion.span className="u__line" variants={underline} aria-hidden="true" />
    </Tag>
  );
}

/* Square outlined button (theme toggle, menu): fills softly on hover, magnetic */
export function IconButton({ children, className = '', ...rest }) {
  const mag = useMagnetic();
  return (
    <motion.button
      className={`icon-btn ${className}`}
      type="button"
      variants={pressable}
      initial="rest"
      whileHover="hover"
      whileFocus="hover"
      whileTap="press"
      {...mag.bind}
      style={mag.style}
      {...rest}
    >
      <motion.span className="icon-btn__fill" style={{ opacity: 0 }} variants={ring} aria-hidden="true" />
      {children}
    </motion.button>
  );
}

/* Chips. Hovering one lights an accent ring. With `reveal`, the chips rise in
   one by one when the card around them is revealed (they follow its variants). */
export function Tags({ items, label, reveal = false, delay = 0 }) {
  const calm = useCalm();
  const variants = reveal ? timed(calm ? calmOf(fadeUpSmall) : fadeUpSmall, 0.06, delay) : undefined;
  return (
    <ul className="flex flex-wrap gap-2" role="list" aria-label={label}>
      {items.map((t, i) => {
        // The chip owns its hover state (an element with its own hover variant
        // stops following its parent); a revealed <li> follows the card instead
        const chip = (
          <motion.span className="tag" initial="rest" whileHover="hover">
            <motion.span className="tag__ring" style={{ opacity: 0 }} variants={ring} aria-hidden="true" />
            {t}
          </motion.span>
        );
        return reveal
          ? <motion.li key={t} variants={variants} custom={i} data-m="">{chip}</motion.li>
          : <li key={t}>{chip}</li>;
      })}
    </ul>
  );
}

/* Status dot with a ring that pulses outward */
export function Pulse() {
  return (
    <span className="pulse" aria-hidden="true">
      <Loop className="pulse__ring" animate={{ scale: [1, 3.5], opacity: [0.6, 0] }} transition={{ duration: 2.2, ease: 'easeOut' }} />
    </span>
  );
}

/* A page section. Publishes its element so children (parallax, scroll-linked
   pieces) can follow its position; data-bg names the backdrop colour token. */
export function Section({ id, bg, className = '', labelledBy, sectionRef, plain = false, children }) {
  const own = useRef(null);
  const ref = sectionRef || own;
  return (
    <section ref={ref} className={`${plain ? '' : 'section '}${className}`} id={id} aria-labelledby={labelledBy} data-bg={bg}>
      <SectionContext.Provider value={ref}>{children}</SectionContext.Provider>
    </section>
  );
}

/* "[ 01 / ABOUT ]  meta" row + giant title + outlined parallax index */
export function SectionHead({ index, label, meta, title, id }) {
  return (
    <header className="relative grid gap-[clamp(20px,3vw,40px)] mb-[clamp(56px,7vw,120px)]">
      <div className="flex flex-wrap justify-between gap-x-6 gap-y-2 pb-3.5 border-b border-line">
        <span className="label label-strong">[ {index} / {label} ]</span>
        <span className="label">{meta}</span>
      </div>
      <SplitText
        as="h2"
        className="display text-h2"
        id={id}
        text={title}
        by="words"
        mask
        variants={lineReveal}
        stagger={0.07}
        initial="hidden"
        whileInView="show"
        viewport={view.text}
      />
      <Parallax
        speed={-0.25}
        className="section-index absolute right-0 top-[30%] -z-10 text-[clamp(70px,13vw,230px)] leading-[0.9] pointer-events-none select-none"
        aria-hidden="true"
      >
        {index}
      </Parallax>
    </header>
  );
}

/* <picture> with AVIF → WebP → JPEG sources at two widths.
   Pass `motionProps` to make the <img> a motion element. */
export function Picture({ name, widths, sizes, alt, width, height, className = '', jpg = true, motionProps, ...rest }) {
  const src = (ext) => widths.map((w) => `${import.meta.env.BASE_URL}assets/img/${name}-${w}.${ext} ${w}w`).join(', ');
  const fallback = `${import.meta.env.BASE_URL}assets/img/${name}-${widths[widths.length - 1]}.${jpg ? 'jpg' : 'webp'}`;
  const Img = motionProps ? motion.img : 'img';
  return (
    <picture>
      <source type="image/avif" srcSet={src('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={src('webp')} sizes={sizes} />
      <Img
        className={className}
        src={fallback}
        srcSet={jpg ? src('jpg') : undefined}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        decoding="async"
        {...motionProps}
        {...rest}
      />
    </picture>
  );
}

/* Links still pointing at "[PLACEHOLDER]" get a tooltip; MotionRoot blocks the click */
export function linkProps(href) {
  return href.startsWith('[')
    ? { href, title: `Placeholder: replace ${href} in src/data/content.js` }
    : { href };
}
