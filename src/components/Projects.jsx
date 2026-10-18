/* Projects: pinned horizontal gallery + featured case study
   (architecture diagram, pipeline sequence, highlights) */
import { comingSoon, project } from '../data/content.js';
import { Button, Picture, SectionHead, Tags } from './ui.jsx';

const pad = (n) => String(n).padStart(2, '0');

export default function Projects() {
  return (
    <section className="section projects" id="projects" aria-labelledby="projects-title" data-bg="surface">
      <div className="wrap">
        <SectionHead index="03" label="PROJECTS" meta="SELECTED WORK · PIPELINE GROWING" title="Projects" id="projects-title" />
      </div>

      {/* Horizontal gallery on desktop; stacked cards on smaller screens */}
      <div className="gallery" data-gallery="">
        <div className="gallery__track" data-gallery-track="">
          <div className="gallery__intro" aria-hidden="true">
            <span className="label">( SCROLL → )</span>
            <span className="display gallery__intro-text">Selected<br />Work</span>
          </div>

          <article className="card card--featured" data-tilt="">
            <div className="card__media" data-distort="">
              <div className="card__zoom">
                <Picture
                  name="project-smart-attendance"
                  widths={[720, 1086]}
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  alt="Smart Attendance System demo frame: a camera feed recognising Sasisekar's face with a bounding box, facial landmarks and a 0.98 match score"
                  width="1086"
                  height="679"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="card__body">
              <p className="label">{project.code} · {project.category} · FEATURED</p>
              <h3 className="display card__title"><a href="#case-study" data-cursor="VIEW">{project.title}</a></h3>
              <Tags items={project.tags} />
            </div>
          </article>

          {comingSoon.map((p) => (
            <article key={p.code} className="card card--soon">
              <div className={`card__media card__media--soon card__media--${p.variant}`} aria-hidden="true">
                <span className="label">{p.code} / {p.status}</span>
                <span className="soon__bar"><span /></span>
              </div>
              <div className="card__body">
                <p className="label">{p.code} · IN THE PIPELINE</p>
                <h3 className="display card__title">Coming soon</h3>
                <p className="card__note">{p.note}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <CaseStudy />
    </section>
  );
}

function CaseStudy() {
  return (
    <article className="wrap case" id="case-study" aria-labelledby="case-title" tabIndex={-1}>
      <header className="case__head">
        <p className="label label-strong">FEATURED PROJECT — {project.category}</p>
        <h3 className="display case__title" id="case-title" data-reveal="lines">{project.title}</h3>
        <p className="case__intro" data-reveal="fade">{project.intro}</p>
        <Tags items={project.tags} label="Technologies" />
      </header>

      <figure className="arch" data-arch="">
        <figcaption className="label">SYSTEM ARCHITECTURE</figcaption>
        <Architecture vertical={false} />
        <Architecture vertical />
      </figure>

      <div className="pipeline" data-pipeline="">
        <p className="label">PIPELINE</p>
        <ol className="pipeline__steps">
          {project.pipeline.map((s, i) => (
            <li key={s} className="step"><span className="step__num">{pad(i + 1)}</span><span className="display step__name">{s}</span></li>
          ))}
        </ol>
        <span className="pipeline__bar" aria-hidden="true" />
      </div>

      <ol className="highlights">
        {project.highlights.map((h, i) => (
          <li key={h} className="highlight" data-reveal="fade"><span className="label">{pad(i + 1)}</span><p>{h}</p></li>
        ))}
      </ol>

      <div className="case__links">
        <Button href={project.github} solid arrow="↗" target="_blank" rel="noopener noreferrer">View on GitHub</Button>
        <Button href={project.demo} arrow="↗" target="_blank" rel="noopener noreferrer">Live Demo / Video</Button>
      </div>
    </article>
  );
}

/* Five boxes joined by arrows: a row on tablet+ and a column on phones */
function Architecture({ vertical }) {
  const nodes = project.architecture;
  const W = vertical ? 240 : 168;
  const H = vertical ? 84 : 92;
  const STEP = vertical ? 136 : 244;
  const box = (i) => (vertical ? { x: 60, y: 20 + i * STEP } : { x: 20 + i * STEP, y: 82 });
  const edge = (i) => {
    const b = box(i);
    return vertical ? `M180 ${b.y + H}V${b.y + STEP}` : `M${b.x + W} 128H${b.x + STEP}`;
  };
  const edges = nodes.slice(1).map((_, i) => edge(i));
  const titleId = vertical ? 'arch-title-v' : 'arch-title';

  return (
    <svg
      className={`arch__svg arch__svg--${vertical ? 'v' : 'h'}`}
      viewBox={vertical ? '0 0 360 676' : '0 0 1184 230'}
      role="img"
      aria-labelledby={vertical ? titleId : `${titleId} arch-desc`}
    >
      <title id={titleId}>{`${project.title} architecture${vertical ? `: ${nodes.map((n) => n.name).join(', ')}.` : ''}`}</title>
      {!vertical && (
        <desc id="arch-desc">ESP32-CAM sends frames over Wi-Fi to a Python and OpenCV server, which runs face recognition and records attendance in a database.</desc>
      )}
      <g className="arch__edges">
        {edges.map((d) => <path key={d} className="arch-edge" d={d} pathLength="1" />)}
        {edges.map((d) => <path key={`f${d}`} className="arch-flow" d={d} />)}
      </g>
      {nodes.map((n, i) => {
        const b = box(i);
        const cx = vertical ? 180 : b.x + W / 2;
        return (
          <g key={n.name} className={`arch-node${n.hub ? ' arch-node--hub' : ''}`}>
            <text className="arch-num" x={vertical ? 40 : cx} y={vertical ? b.y + 42 : 60}>{pad(i + 1)}</text>
            <rect x={b.x} y={b.y} width={W} height={H} pathLength="1" />
            <text x={cx} y={b.y + (vertical ? 38 : 42)}>{n.name}</text>
            <text className="arch-sub" x={cx} y={b.y + (vertical ? 62 : 66)}>{n.sub}</text>
          </g>
        );
      })}
    </svg>
  );
}
