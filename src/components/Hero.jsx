/* Hero: scrambled kicker, giant split name, typewriter, CTAs, scroll cue.
   The full-screen photo behind it is <HeroBackground /> (page level). */
import { profile } from '../data/content.js';
import { Button } from './ui.jsx';

export default function Hero() {
  return (
    <section className="hero relative flex min-h-svh pt-[calc(var(--header-h)+20px)] pb-7" id="top" aria-labelledby="hero-title" data-bg="bg">
      <div className="wrap flex flex-col gap-[clamp(20px,2.6vw,36px)]">
        <div className="flex justify-between gap-4 pb-3.5 border-b border-line" data-hero-fade>
          <span className="label label-strong">[ 00 / INDEX ]</span>
          <span className="label hidden mdx:block">{profile.coords}</span>
          <span className="label">PORTFOLIO — 2026</span>
        </div>

        <p className="hero__kicker mt-auto font-mono font-medium text-[clamp(12px,1.05vw,15px)] leading-[1.4] tracking-[0.22em] text-accent min-h-[1.4em]">
          <span className="sr-only">AI &amp; Data Science Developer</span>
          <span aria-hidden="true" data-scramble>{profile.kicker}</span>
        </p>

        <h1 className="display hero__name text-hero leading-[0.82] origin-[50%_60%] will-change-[transform,filter]" id="hero-title" aria-label="Sasisekar R L">
          <span className="hero__line block overflow-hidden py-[0.07em] -my-[0.07em]" data-hero-line>{profile.first}</span>
          <span className="hero__line block overflow-hidden py-[0.07em] -my-[0.07em] md:text-right" data-hero-line>{profile.initials}</span>
        </h1>

        <div className="hero__grid grid gap-6 mdx:grid-cols-[minmax(0,5fr)_minmax(0,4fr)_auto] mdx:items-end mdx:gap-(--gutter)">
          <div>
            <p className="font-semibold text-lead leading-[1.3] tracking-[-0.015em] max-w-[30ch]">{profile.role}</p>
            <p className="mt-2.5 text-muted max-w-[46ch]">{profile.tagline}</p>
          </div>

          <div className="grid gap-3" data-hero-fade>
            <p className="font-mono font-medium text-[clamp(14px,1.2vw,17px)] leading-[1.4] min-h-[1.4em]">
              <span className="sr-only">{profile.typer.join(', ')}</span>
              <span aria-hidden="true">
                <span className="text-signal">&gt;</span> <span data-typer>{profile.typer[0]}</span>
                <span className="caret inline-block w-[0.55em] h-[1.05em] ml-[3px] align-[-0.15em] bg-accent" />
              </span>
            </p>
            <ul className="grid gap-1 font-mono font-medium text-[12px] leading-[1.6] tracking-[0.06em] uppercase text-muted" role="list">
              <li className="text-ink"><span className="pulse" aria-hidden="true" /> {profile.status}</li>
              <li>{profile.location}</li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-3" data-hero-fade>
            <Button href="#projects" solid arrow="↓" className="max-[560px]:flex-[1_1_100%]">View Projects</Button>
            <Button href="#contact" arrow="→" className="max-[560px]:flex-[1_1_100%]">Get in Touch</Button>
          </div>
        </div>

        <div className="scroll-cue flex items-center gap-3.5" data-hero-fade aria-hidden="true">
          <span className="scroll-cue__line relative w-16 h-px bg-line overflow-hidden"><span className="absolute inset-0 bg-accent" /></span>
          <span className="label">Scroll</span>
          <span className="label ml-auto text-ink tabular-nums" data-scroll-pct>00%</span>
        </div>
      </div>
    </section>
  );
}
