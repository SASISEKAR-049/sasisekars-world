/* Skills: velocity-reactive marquees, tilt cards, draggable skill graph */
import { Fragment } from 'react';
import { marquees, skills } from '../data/content.js';
import { SectionHead, Tags } from './ui.jsx';

const total = skills.reduce((n, g) => n + g.items.length, 0);
const pad = (n) => String(n).padStart(2, '0');

export default function Skills() {
  return (
    <section className="section skills" id="skills" aria-labelledby="skills-title" data-bg="bg">
      <div className="wrap">
        <SectionHead index="02" label="SKILLS" meta={`${pad(skills.length)} GROUPS · ${total} SKILLS`} title="Skills" id="skills-title" />
      </div>

      {/* Decorative; the full list is in the grid below */}
      <div className="marquees" aria-hidden="true">
        {marquees.map((row, i) => (
          <div key={i} className="marquee" data-marquee="" data-dir={row.dir}>
            <div className="marquee__track">
              <div className="marquee__group">
                {row.items.map(([text, style]) => (
                  <Fragment key={text}>
                    <span className={`marquee__item${style ? ` marquee__item--${style}` : ''}`}>{text}</span>
                    <span className="marquee__sep">✦</span>
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="wrap">
        <div className="skills__grid">
          {skills.map((g, i) => (
            <article key={g.group} className="skill-card" data-tilt="" data-reveal="fade">
              <div className="skill-card__head"><h3>{g.group}</h3><span className="label">{pad(i + 1)}</span></div>
              <Tags items={g.items} />
            </article>
          ))}
        </div>

        {/* Force-directed graph, built at runtime from the cards above */}
        <figure className="graph" data-reveal="fade">
          <canvas
            className="graph__canvas"
            data-graph=""
            data-cursor="DRAG"
            role="img"
            aria-label="Interactive graph linking each skill to its category. The same skills are listed in the cards above."
          />
          <figcaption className="graph__caption label">SKILL_GRAPH.py — drag the nodes</figcaption>
        </figure>
      </div>
    </section>
  );
}
