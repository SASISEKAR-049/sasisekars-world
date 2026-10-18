/* Page-level layers: hero photo, WebGL canvas, grid lines, grain, cursor,
   toast, floating row preview and the SVG distortion filter. */
import { Picture } from './ui.jsx';

/* Full-screen hero photo. The motion layer clones the strip into 8 (desktop)
   or 5 (phone) slices for the "cut" intro and scroll effect. */
export function HeroBackground() {
  return (
    <div className="hero-bg absolute top-0 left-0 w-full z-0 overflow-hidden pointer-events-none" data-hero-bg aria-hidden="true">
      <div className="hero-bg__strips absolute inset-0">
        <div className="hero-bg__strip absolute top-0 bottom-0 overflow-hidden" style={{ '--i': 0 }}>
          <Picture
            name="hero-bg"
            widths={[720, 1086]}
            sizes="100vw"
            alt=""
            width="1086"
            height="1448"
            fetchPriority="high"
            className="absolute top-0 h-full object-cover"
          />
          <span className="hero-bg__cover absolute inset-0 z-[2] bg-paper" />
        </div>
      </div>
      <div className="hero-bg__shade absolute inset-0 z-[3]" />
    </div>
  );
}

export function NeuralCanvas() {
  return <canvas className="neural fixed inset-0 w-full h-full z-0 pointer-events-none" data-neural aria-hidden="true" />;
}

export function GridLines() {
  return (
    <div className="gridlines fixed inset-0 z-[1] pointer-events-none" aria-hidden="true">
      <div className="gridlines__inner grid h-full max-w-(--maxw) mx-auto px-(--pad) gap-x-(--gutter)">
        {Array.from({ length: 12 }, (_, i) => <span key={i} className="border-x border-line opacity-30" />)}
      </div>
    </div>
  );
}

export function Grain() {
  return <div className="grain fixed -inset-[10%] z-[95] pointer-events-none opacity-[0.07]" aria-hidden="true" />;
}

/* Dot + trailing ring (mix-blend-mode: difference); labels via data-cursor */
export function Cursor() {
  return (
    <div className="cursor fixed inset-0 z-[250] pointer-events-none mix-blend-difference" aria-hidden="true">
      <div className="cursor__ring fixed left-0 top-0 w-0 h-0 grid place-items-center">
        <span className="cursor__circle absolute left-0 top-0 w-10 h-10 -ml-5 -mt-5 rounded-full border border-white" />
        <span className="cursor__label absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 font-mono font-bold text-[11px] leading-none tracking-[0.1em] text-black whitespace-nowrap" />
      </div>
      <div className="cursor__dot fixed left-0 top-0 w-1.5 h-1.5 -ml-[3px] -mt-[3px] rounded-full bg-white" />
    </div>
  );
}

export function Toast() {
  return (
    <div
      className="toast fixed left-0 right-0 bottom-7 z-[230] w-max max-w-[calc(100%-32px)] mx-auto px-[18px] py-3 bg-ink text-paper font-mono text-[13px] leading-[1.3] tracking-[0.04em] pointer-events-none"
      role="status"
      aria-live="polite"
    />
  );
}

export function RowPreview() {
  return (
    <div
      className="row-preview fixed left-0 top-0 z-[120] mt-[18px] ml-[18px] px-3 py-2 bg-accent text-on-accent font-mono font-bold text-[12px] leading-none tracking-[0.08em] uppercase whitespace-nowrap pointer-events-none"
      aria-hidden="true"
    />
  );
}

/* Turbulence displacement + red/cyan split, animated on project-card hover */
export function SvgDefs() {
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
