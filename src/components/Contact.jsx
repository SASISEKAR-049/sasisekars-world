/* Contact (letters repel from the cursor, click-to-copy email) + curtain footer */
import { profile } from '../data/content.js';
import { Button, Roll } from './ui.jsx';

export function Contact() {
  return (
    <section className="section contact" id="contact" aria-labelledby="contact-title" data-bg="deep">
      <div className="wrap">
        <div className="section-head__top">
          <span className="label label-strong">[ 06 / CONTACT ]</span>
          <span className="label"><span className="pulse" aria-hidden="true" /> {profile.status}</span>
        </div>

        <h2 className="display contact__title" id="contact-title" aria-label="Let’s build something." data-repel="">LET’S BUILD SOMETHING.</h2>

        <p className="contact__sub" data-reveal="fade">Open to internships and entry-level opportunities in AI, ML and backend development.</p>

        <div className="contact__email-row" data-reveal="fade">
          <button
            className="contact__email u"
            type="button"
            data-copy={profile.email}
            data-cursor="COPY"
            data-magnetic="0.15"
            aria-label={`Copy email address ${profile.email}`}
          >
            {profile.email}
          </button>
          <span className="label contact__hint">Click to copy · or <a className="u" href={`mailto:${profile.email}`}>open your mail app ↗</a></span>
        </div>

        <ul className="contact__links" role="list" data-reveal="fade">
          <li><span className="label">Phone</span><Roll className="contact__link" href={profile.phoneHref}>{profile.phone}</Roll></li>
          <li><span className="label">LinkedIn</span><Roll className="contact__link" href={profile.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</Roll></li>
          <li><span className="label">GitHub</span><Roll className="contact__link" href={profile.github} target="_blank" rel="noopener noreferrer">GitHub ↗</Roll></li>
          <li><span className="label">Résumé</span><Button href={profile.resume} solid arrow="↓" download="Sasisekar-RL-Resume.pdf">Download Résumé</Button></li>
        </ul>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer" data-footer="">
      <div className="footer__inner" data-footer-inner="">
        <div className="wrap footer__row">
          <p className="label footer__clock">IST <time data-clock="">--:--:--</time> · TAMIL NADU, IN</p>
          <a className="footer__top" href="#top" data-top="" data-magnetic="">
            <span className="footer__top-arrow" aria-hidden="true">↑</span>
            <span>Back to top</span>
          </a>
          <p className="label">© 2026 {profile.name}</p>
        </div>
        <p className="display footer__mark" aria-hidden="true">{profile.first}</p>
      </div>
    </footer>
  );
}
