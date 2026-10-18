/* Entry screen ("View Portfolio") + boot sequence. Shown only when the head
   script adds html.show-preloader; driven by src/motion/preloader.js. */
import { Arrow } from './ui.jsx';

export default function Preloader() {
  return (
    <div className="preloader fixed inset-0 z-[240] text-[#EDEDED]" role="dialog" aria-modal="true" aria-labelledby="gate-title">
      <div className="absolute inset-0 grid grid-cols-2" aria-hidden="true">
        <div className="preloader__panel bg-black [clip-path:inset(0_0_0_0)]" />
        <div className="preloader__panel bg-black [clip-path:inset(0_0_0_0)]" />
      </div>

      {/* 1. Entry screen */}
      <div className="preloader__gate absolute inset-0 grid place-content-center justify-items-center gap-7 p-(--pad) text-center">
        <p className="font-mono text-[12px] leading-[1.6] tracking-[0.2em] uppercase text-[#8A8F98]" id="gate-title">
          Sasisekar R L — AI &amp; Data Science Portfolio
        </p>
        <button className="btn preloader__enter min-h-16 px-10 text-[14px] tracking-[0.16em]" type="button" data-cursor="ENTER" data-magnetic="0.25">
          View Portfolio <Arrow />
        </button>
        <p className="font-mono text-[11px] leading-none tracking-[0.2em] uppercase text-[#6B7079] [@media(hover:none)]:hidden" aria-hidden="true">
          Press Enter ↵
        </p>
      </div>

      {/* 2. Boot sequence */}
      <div className="preloader__content absolute inset-0 flex flex-col justify-between py-[clamp(20px,3vw,44px)] px-(--pad) font-mono" aria-hidden="true">
        <div className="flex justify-between text-[12px] tracking-[0.1em] text-[#8A8F98]">
          <span>SASISEKAR.exe</span>
          <span>[ BOOT SEQUENCE ]</span>
        </div>
        <div className="text-[clamp(13px,1.3vw,18px)] leading-[2] min-h-[6em]">
          <p className="preloader__line min-h-[2em]" data-text="> loading neural_modules..." />
          <p className="preloader__line min-h-[2em]" data-text="> initializing model..." />
          <p className="preloader__line min-h-[2em] text-[#00E0C6]" data-text="> SASISEKAR.exe ready" />
        </div>
        <div className="grid gap-4">
          <div className="preloader__bar h-px bg-[#1E2128]">
            <span className="block h-full bg-[#3D6BFF] origin-left [transform:scaleX(0)]" />
          </div>
          {/* Monospaced digits keep the counter's width constant (no layout shift) */}
          <p className="justify-self-end font-mono font-bold text-[clamp(72px,17vw,260px)] leading-[0.8] tracking-[-0.06em] tabular-nums">
            <span className="preloader__num">000</span>
            <span className="text-[0.3em] align-top ml-[0.1em] text-[#3D6BFF]">%</span>
          </p>
        </div>
      </div>
    </div>
  );
}
