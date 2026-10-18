/* Small shared building blocks used across sections */

export function Arrow({ char = '→' }) {
  return (
    <span className="btn__arrow" aria-hidden="true"><i>{char}</i><i>{char}</i></span>
  );
}

/* Primary button: fill wipe + arrow swap on hover, magnetic on fine pointers */
export function Button({ href, children, arrow = '→', solid = false, className = '', ...rest }) {
  return (
    <a href={href} className={`btn ${solid ? 'btn--solid' : ''} ${className}`} data-magnetic="" {...rest}>
      {children} <Arrow char={arrow} />
    </a>
  );
}

/* Rolling-text link: the label slides up and a copy rolls in from below */
export function Roll({ href, children, className = '', ...rest }) {
  return (
    <a href={href} className={`roll ${className}`} {...rest}>
      <span className="roll__inner">
        <span>{children}</span>
        <span aria-hidden="true">{children}</span>
      </span>
    </a>
  );
}

export function Tags({ items, label }) {
  return (
    <ul className="flex flex-wrap gap-2" role="list" aria-label={label}>
      {items.map((t) => <li key={t} className="tag">{t}</li>)}
    </ul>
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
      <h2 className="display text-h2" id={id} data-reveal="lines">{title}</h2>
      <span
        className="section-index absolute right-0 top-[30%] -z-10 text-[clamp(120px,24vw,420px)] leading-[0.8] pointer-events-none select-none"
        aria-hidden="true"
        data-speed="-0.25"
      >
        {index}
      </span>
    </header>
  );
}

/* <picture> with AVIF → WebP → JPEG sources at two widths */
export function Picture({ name, widths, sizes, alt, width, height, className = '', jpg = true, ...rest }) {
  const src = (ext) => widths.map((w) => `${import.meta.env.BASE_URL}assets/img/${name}-${w}.${ext} ${w}w`).join(', ');
  const fallback = `${import.meta.env.BASE_URL}assets/img/${name}-${widths[widths.length - 1]}.${jpg ? 'jpg' : 'webp'}`;
  return (
    <picture>
      <source type="image/avif" srcSet={src('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={src('webp')} sizes={sizes} />
      <img
        className={className}
        src={fallback}
        srcSet={jpg ? src('jpg') : undefined}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        decoding="async"
        {...rest}
      />
    </picture>
  );
}
