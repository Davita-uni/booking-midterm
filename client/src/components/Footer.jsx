import { Link } from "../router.jsx";
import { HELP_EMAIL, HELP_PHONE } from "../config.js";
import { LEGAL_PAGES } from "../pages/Legal.jsx";

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M6.6 3.5h2.6l1.4 4.1-1.9 1.3a11 11 0 0 0 6.4 6.4l1.3-1.9 4.1 1.4v2.6a2.1 2.1 0 0 1-2.3 2.1A16.5 16.5 0 0 1 4.5 5.8 2.1 2.1 0 0 1 6.6 3.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// The phone number is still a placeholder (with X's), so it isn't a call link yet.
const phoneIsReal = !/x/i.test(HELP_PHONE);

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <Link to="/" className="wordmark">
            <span className="wordmark__dot" aria-hidden="true" />
            Doorlist
          </Link>
          <p>Tickets for concerts, talks and workshops around Tbilisi.</p>
          <p className="site-footer__bottom">© {new Date().getFullYear()} Doorlist · Made in Tbilisi</p>
        </div>

        <nav className="site-footer__col" aria-label="Policies">
          <h2>Legal</h2>
          <ul>
            {LEGAL_PAGES.map((page) => (
              <li key={page.path}>
                <Link to={page.path}>{page.title}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-footer__col">
          <h2>Contact</h2>
          <ul>
            <li>
              <a href={`mailto:${HELP_EMAIL}`} className="contact">
                <MailIcon />
                <span>{HELP_EMAIL}</span>
              </a>
            </li>
            <li>
              {phoneIsReal ? (
                <a href={`tel:${HELP_PHONE.replace(/\s/g, "")}`} className="contact">
                  <PhoneIcon />
                  <span>{HELP_PHONE}</span>
                </a>
              ) : (
                <span className="contact">
                  <PhoneIcon />
                  <span>{HELP_PHONE}</span>
                </span>
              )}
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
