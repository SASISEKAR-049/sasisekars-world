/* Education, certifications and achievements as hover-fill rows with a
   cursor-following preview label */
import { achievements, certifications, education } from '../data/content.js';
import { SectionHead } from './ui.jsx';

const pad = (n) => String(n).padStart(2, '0');

/* "—" is a placeholder for missing data, so screen readers skip it */
function End({ children }) {
  return <span className="row__cell row__end" aria-hidden={children === '—' ? 'true' : undefined}>{children}</span>;
}

function Row({ preview, children }) {
  return (
    <li className="row" data-preview={preview}>
      {children}
      <span className="row__line" aria-hidden="true" />
    </li>
  );
}

export default function Education() {
  return (
    <section className="section education" id="education" aria-labelledby="education-title" data-bg="surface">
      <div className="wrap">
        <SectionHead index="05" label="EDUCATION" meta="(2021 — 2027)" title="Education" id="education-title" />

        <div className="rows-block">
          <h3 className="rows-block__title label label-strong">Academic record</h3>
          <ul className="rows rows--4" role="list">
            {education.map((e) => (
              <Row key={e.degree} preview={e.preview}>
                <span className="row__cell row__year">{e.years}</span>
                <span className="row__cell row__main">{e.school}</span>
                <span className="row__cell row__sub">{e.degree}</span>
                <End>{e.score}</End>
              </Row>
            ))}
          </ul>
        </div>

        <div className="rows-block" id="certifications">
          <h3 className="rows-block__title label label-strong">Certifications</h3>
          <ul className="rows rows--3" role="list">
            {certifications.map((c) => (
              <Row key={c.name} preview={c.issuer}>
                <span className="row__cell row__main">{c.name}</span>
                <span className="row__cell row__sub">{c.issuer}</span>
                <End>{c.year}</End>
              </Row>
            ))}
          </ul>
        </div>

        <div className="rows-block" id="achievements">
          <h3 className="rows-block__title label label-strong">Achievements</h3>
          <ul className="rows rows--2" role="list">
            {achievements.map((a, i) => (
              <Row key={a.text} preview={a.preview}>
                <span className="row__cell row__num">A—{pad(i + 1)}</span>
                <span className="row__cell row__main row__main--text">{a.text}</span>
              </Row>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
