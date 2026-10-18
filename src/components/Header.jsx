/* Sticky header (hides on scroll down, shows on scroll up) + fullscreen menu */
import { nav, profile } from '../data/content.js';
import { Roll } from './ui.jsx';

export function Header() {
  return (
    <header className="site-header fixed top-0 left-0 right-0 z-[70] h-(--header-h)" data-header>
      <div className="wrap site-header__inner relative h-full flex items-center gap-[clamp(16px,2vw,32px)]">
        <a className="inline-flex items-center gap-2.5 mr-auto" href="#top" data-cursor="TOP">
          <span className="font-mono font-bold text-[11px] leading-none text-accent border border-accent px-1.5 py-[5px]" aria-hidden="true">S/</span>
          <span className="font-display text-[22px] tracking-[0.02em] leading-none">{profile.name}</span>
        </a>

        <nav className="nav hidden wide:block" aria-label="Primary">
          <ul className="nav__list flex gap-[clamp(14px,1.8vw,30px)]" role="list">
            {nav.map((n) => (
              <li key={n.id}>
                <Roll href={`#${n.id}`} className="nav__link font-mono text-[12px] font-medium tracking-[0.08em] uppercase">{n.label}</Roll>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex gap-2">
          <button className="icon-btn theme-toggle" type="button" data-theme-toggle data-magnetic="" aria-label="Switch to light theme">
            <span className="theme-toggle__icon w-3.5 h-3.5 rounded-full border border-current bg-[linear-gradient(90deg,currentColor_50%,transparent_50%)] transition-transform duration-700" aria-hidden="true" />
          </button>
          <button className="icon-btn menu-btn" type="button" data-menu-toggle data-magnetic="" aria-expanded="false" aria-controls="menu">
            <span className="menu-btn__label">Menu</span>
            <span className="menu-btn__lines grid gap-[5px] w-[18px]" aria-hidden="true">
              <span className="h-px bg-current transition-transform duration-500" />
              <span className="h-px bg-current transition-transform duration-500" />
            </span>
          </button>
        </div>
      </div>
      <div className="progress absolute left-0 right-0 -bottom-px h-0.5 pointer-events-none" aria-hidden="true">
        <span className="block h-full bg-accent origin-left [transform:scaleX(0)]" />
      </div>
    </header>
  );
}

export function Menu() {
  return (
    <div className="menu fixed inset-0 z-[60] overflow-y-auto bg-paper pt-[calc(var(--header-h)+16px)]" id="menu" role="dialog" aria-modal="true" aria-label="Site menu" hidden>
      {/* Preview image per link (crops of the photo), shown on hover / focus */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden hidden lg:block" aria-hidden="true">
        {nav.map((n) => (
          <div
            key={n.id}
            className="menu__preview absolute right-(--pad) top-1/2 w-[min(34vw,560px)] aspect-[4/3] bg-center bg-cover bg-no-repeat border border-line opacity-0"
            data-preview={n.id}
            style={{ backgroundImage: `url(${n.preview})` }}
          />
        ))}
      </div>

      <div className="wrap relative min-h-[calc(100%-16px)] flex flex-col justify-between gap-8 pb-7">
        <p className="label">[ NAVIGATION ]</p>
        <ol>
          {nav.map((n, i) => (
            <li key={n.id} className="border-t border-line last:border-b">
              <a className="menu__link flex items-baseline gap-5 py-1.5" href={`#${n.id}`} data-preview-key={n.id}>
                <span className="font-mono text-[12px] leading-none text-muted min-w-[2ch]">{String(i + 1).padStart(2, '0')}</span>
                <span className="block overflow-hidden py-[0.08em]">
                  <span className="menu__text block font-display text-[clamp(44px,min(9vw,10.5vh),132px)] leading-[0.95] uppercase transition-[color,transform] duration-500">{n.label}</span>
                </span>
              </a>
            </li>
          ))}
        </ol>
        <div className="menu__foot flex flex-wrap justify-between gap-x-8 gap-y-3">
          <p className="label"><span className="pulse" aria-hidden="true" /> {profile.status}</p>
          <a className="u" href={`mailto:${profile.email}`}>{profile.email}</a>
        </div>
      </div>
    </div>
  );
}
