import { Link, NavLink, usePath } from "./router.jsx";

function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" className="wordmark">
          <span className="wordmark__dot" aria-hidden="true" />
          Doorlist
        </Link>
        <nav className="nav" aria-label="Main">
          <NavLink to="/" exact>
            Events
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  const path = usePath();

  return (
    <>
      <Header />
      <main className="page">
        {path === "/" ? (
          <div className="page-head">
            <div>
              <p className="eyebrow">Tbilisi · what's on</p>
              <h1>Upcoming events</h1>
            </div>
          </div>
        ) : (
          <div className="state">
            <h3>Page not found</h3>
            <p>There is nothing at this address.</p>
            <Link to="/" className="btn">
              Back to events
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
