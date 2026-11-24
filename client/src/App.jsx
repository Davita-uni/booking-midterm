import { AuthProvider, useAuth, ROLE_LABEL } from "./auth.jsx";
import { useEffect } from "react";
import { Link, NavLink, navigate, usePath, matchPath } from "./router.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

function Header() {
  const { user, logout } = useAuth();
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
        <div className="session">
          {user ? (
            <>
              <span className="session__name">
                {user.name} <span className={`chip chip--${user.role}`}>{ROLE_LABEL[user.role]}</span>
              </span>
              <button className="btn btn--danger btn--small" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn--ghost btn--small">
                Log in
              </Link>
              <Link to="/register" className="btn btn--primary btn--small">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function Redirect({ to }) {
  useEffect(() => navigate(to, { replace: true }), [to]);
  return null;
}

function NotFound() {
  return (
    <div className="state">
      <h3>Page not found</h3>
      <p>There is nothing at this address.</p>
      <Link to="/" className="btn">
        Back to events
      </Link>
    </div>
  );
}

function Home() {
  return (
    <div className="page-head">
      <div>
        <p className="eyebrow">Tbilisi · what's on</p>
        <h1>Upcoming events</h1>
      </div>
    </div>
  );
}

// [pattern, component, who can open it]
// "guest" = only when logged out, "user" = any logged-in user,
// a list of roles = only those roles. The server checks roles again.
const routes = [
  ["/", Home],
  ["/login", Login, "guest"],
  ["/register", Register, "guest"],
];

function Routes() {
  const path = usePath();
  const { user, checking } = useAuth();

  if (checking) return <p className="loader">Checking your session…</p>;

  for (const [pattern, Page, access] of routes) {
    const params = matchPath(pattern, path);
    if (!params) continue;

    if (access === "guest" && user) return <Redirect to="/" />;
    if (access && access !== "guest" && !user) return <Redirect to="/login" />;
    if (Array.isArray(access) && !access.includes(user.role)) {
      return (
        <div className="state state--error">
          <h3>Not available for your account</h3>
          <p>This page is for {access.map((r) => ROLE_LABEL[r]).join(" and ")} accounts.</p>
          <Link to="/" className="btn">
            Back to events
          </Link>
        </div>
      );
    }
    return <Page {...params} />;
  }
  return <NotFound />;
}

export default function App() {
  return (
    <AuthProvider>
      <Header />
      <main className="page">
        <Routes />
      </main>
    </AuthProvider>
  );
}
