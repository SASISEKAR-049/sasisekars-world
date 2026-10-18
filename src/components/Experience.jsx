/* Experience: timeline rail that draws on scroll + sticky stacking cards */
import { experience } from '../data/content.js';
import { SectionHead } from './ui.jsx';

const pad = (n) => String(n).padStart(2, '0');
const years = experience.map((x) => x.year);

export default function Experience() {
  return (
    <section className="section experience" id="experience" aria-labelledby="experience-title" data-bg="bg">
      <div className="wrap">
        <SectionHead index="04" label="EXPERIENCE" meta={`(${Math.min(...years)} — ${Math.max(...years)})`} title="Experience" id="experience-title" />

        <div className="xp">
          <div className="xp__rail" aria-hidden="true">
            <svg viewBox="0 0 2 100" preserveAspectRatio="none" focusable="false">
              <line className="xp__rail-track" x1="1" y1="0" x2="1" y2="100" />
              <line className="xp__rail-draw" x1="1" y1="0" x2="1" y2="100" pathLength="1" />
            </svg>
          </div>
          <ol className="xp__list">
            {experience.map((x, i) => (
              <li key={x.role} className="xp-card" style={{ '--i': i }}>
                <div className="xp-card__inner">
                  <p className="xp-card__year" data-year={x.year}>{x.year}</p>
                  <div className="xp-card__body">
                    <p className="label">{pad(i + 1)} / {pad(experience.length)} · {x.kind}</p>
                    <h3 className="xp-card__role">{x.role}</h3>
                    <p className="xp-card__org">{x.org}</p>
                    {x.cert && <a className="link-mono u" href={x.cert} target="_blank" rel="noopener noreferrer">View Certificate ↗</a>}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
