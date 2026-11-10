/* ==========================================================================
   <SplitText>: renders a string as animatable spans (replaces SplitType).

   by="chars"   every character is a unit; characters of a word stay together
   by="words"   every word is a unit
   by="lines"   every word is a unit, but units on the same visual line share
                one delay, so the text reveals line by line (lines are
                measured after layout and again when the width changes)

   <SplitText as="h2" text="Selected work" by="words" mask variants={lineReveal}
              stagger={0.07} initial="hidden" whileInView="show" />

   Accessibility: the pieces are aria-hidden and the whole text is exposed
   once. Headings, links and buttons get an aria-label; other elements (where
   ARIA does not allow aria-label) get a visually hidden copy instead.
   Pass label={false} when an ancestor already names the text.

   Custom units: pass a function as children to render each unit yourself,
   ({ unit, index, total, key }) => element. Used for scroll-scrubbed words
   and the letters that dodge the cursor.
   ========================================================================== */

import { Fragment, useCallback, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useCalm, useIsoLayoutEffect } from './MotionRoot.jsx';
import { calm as calmOf, charReveal, timed } from './presets.js';

const NAMEABLE = /^(h[1-6]|a|button)$/;   // roles that may carry aria-label

export function SplitText({
  as = 'span',
  text,
  by = 'chars',
  variants = charReveal,
  stagger = 0.045,
  delay = 0,
  mask = false,
  label = true,
  unitClassName = '',
  children,
  ref: outerRef,
  ...rest
}) {
  const calm = useCalm();
  const Tag = motion[as];
  const ref = useRef(null);
  // Keep our own ref (line measuring) and the caller's
  const setRef = useCallback((el) => {
    ref.current = el;
    if (typeof outerRef === 'function') outerRef(el);
    else if (outerRef) outerRef.current = el;
  }, [outerRef]);
  // Split on ordinary spaces only: a non-breaking space keeps its words together
  const words = useMemo(() => text.split(/[ \t\n\r]+/).filter(Boolean), [text]);
  const lineOf = useLines(ref, by === 'lines', words.length);

  const unitVariants = timed(calm ? calmOf(variants) : variants, stagger, delay);
  const total = by === 'chars' ? words.reduce((n, w) => n + Array.from(w).length, 0) : words.length;

  let index = 0;
  const unit = (content, order, key) => {
    const i = index++;
    if (typeof children === 'function') return children({ unit: content, index: i, total, key });
    const piece = (
      <motion.span key={key} className={`split-unit ${unitClassName}`} variants={unitVariants} custom={order ?? i} data-m="">
        {content}
      </motion.span>
    );
    return mask ? <span key={key} className="split-mask">{piece}</span> : piece;
  };

  const pieces = words.map((word, w) => {
    const body = by === 'chars'
      ? <span className="split-word">{Array.from(word).map((ch, c) => unit(ch, undefined, c))}</span>
      : unit(word, by === 'lines' ? lineOf[w] ?? 0 : undefined, 'unit');
    return <Fragment key={w}>{w > 0 && ' '}{body}</Fragment>;
  });

  const nameable = NAMEABLE.test(as);
  return (
    <Tag ref={setRef} aria-label={label && nameable ? text : undefined} {...rest}>
      {label && !nameable && <span className="sr-only">{text}</span>}
      <span aria-hidden="true" data-split={by}>{pieces}</span>
    </Tag>
  );
}

/* Which visual line each word sits on: [0, 0, 1, 1, 2…] */
function useLines(ref, enabled, count) {
  const [lines, setLines] = useState([]);
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return undefined;
    const measure = () => {
      const units = el.querySelectorAll('[data-split] > .split-unit, [data-split] > .split-mask');
      const next = [];
      let top = null;
      let line = -1;
      units.forEach((u) => {
        if (u.offsetTop !== top) { top = u.offsetTop; line += 1; }
        next.push(line);
      });
      setLines((prev) => (prev.length === next.length && prev.every((v, i) => v === next[i]) ? prev : next));
    };
    measure();
    let width = el.clientWidth;
    const observer = new ResizeObserver(() => {
      if (el.clientWidth === width) return;   // only a width change can re-wrap the text
      width = el.clientWidth;
      measure();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, count]);
  return lines;
}
