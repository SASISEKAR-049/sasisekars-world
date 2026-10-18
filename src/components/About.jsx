/* About: pinned scrub quote, portrait with CV-scan overlay, bio, counters */
import { about } from '../data/content.js';
import { Picture, SectionHead } from './ui.jsx';

export default function About() {
  return (
    <section className="section about" id="about" aria-labelledby="about-title" data-bg="surface">
      <div className="wrap">
        <SectionHead index="01" label="ABOUT" meta="PROFILE · STELLA MARY’S COLLEGE OF ENGINEERING" title="About" id="about-title" />

        <div className="about__quote-wrap" data-pin-quote>
          <p className="about__quote" data-scrub-words>{about.quote}</p>
        </div>

        <div className="about__grid">
          <figure className="portrait" data-reveal="image">
            {/* Greyscale portrait that turns to colour on hover. If you change the
                photo, move the scan box below so it still frames the face. */}
            <div className="portrait__media reveal-media">
              <Picture
                name="portrait"
                widths={[600, 1000]}
                sizes="(min-width: 1100px) 32vw, (min-width: 768px) 40vw, 100vw"
                alt="Portrait of Sasisekar R L standing on a rooftop with arms crossed, hills and sky behind"
                width="1000"
                height="1250"
                loading="lazy"
              />
              <svg className="scan" viewBox="0 0 400 500" aria-hidden="true" focusable="false">
                <defs>
                  <linearGradient id="scan-trail" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="currentColor" stopOpacity="0" />
                    <stop offset="1" stopColor="currentColor" stopOpacity="0.55" />
                  </linearGradient>
                </defs>
                <g className="scan__line"><rect x="0" y="-60" width="400" height="60" fill="url(#scan-trail)" /><rect x="0" y="-2" width="400" height="2" /></g>
                <rect className="scan__box" x="150" y="92" width="120" height="134" pathLength="1" />
                <g className="scan__corners"><path d="M142 104V84H162M258 84H278V104M278 214V234H258M162 234H142V214" /></g>
                <g className="scan__tag">
                  <rect x="150" y="54" width="200" height="28" />
                  <text x="160" y="73" data-face-score="">FACE_DETECTED: 0.98</text>
                </g>
              </svg>
            </div>
            <figcaption className="figcap label"><span>FIG. 01 — SASISEKAR R L</span><span>CV_SCAN · LIVE</span></figcaption>
          </figure>

          <div className="about__bio">
            <p className="label">( BIO )</p>
            <p className="about__text" data-scrub-words>{about.bio}</p>
            <dl className="stats">
              {about.stats.map((s) => (
                <div key={s.label} className="stat">
                  <dt className="label">{s.label}</dt>
                  <dd><span data-count={s.value} data-decimals={s.decimals}>{s.value}</span></dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="about__aside">
            <List title="Areas of Interest" items={about.interests} />
            <List title="Hobbies" items={about.hobbies} />
          </div>
        </div>
      </div>
    </section>
  );
}

function List({ title, items }) {
  return (
    <div className="about__group" data-reveal="fade">
      <h3 className="label">{title}</h3>
      <ul className="stack-list" role="list">
        {items.map((t) => <li key={t}>{t}</li>)}
      </ul>
    </div>
  );
}
