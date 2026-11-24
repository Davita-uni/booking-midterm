import { AuthProvider, useAuth, ROLE_LABEL, homeFor } from "./auth.jsx";
import { useEffect } from "react";
import { Link, NavLink, navigate, usePath, matchPath } from "./router.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Events from "./pages/Events.jsx";
import EventDetail from "./pages/EventDetail.jsx";
import EventForm from "./pages/EventForm.jsx";
import MyEvents from "./pages/MyEvents.jsx";
import MyTickets from "./pages/MyTickets.jsx";
import AdminVenues from "./pages/AdminVenues.jsx";
import AdminCategories from "./pages/AdminCategories.jsx";
import AdminOrganizers from "./pages/AdminOrganizers.jsx";
import AccountStatus from "./pages/AccountStatus.jsx";
import Profile from "./pages/Profile.jsx";
import ProfileEdit from "./pages/ProfileEdit.jsx";
import MyRequests from "./pages/MyRequests.jsx";
import NewRequest from "./pages/NewRequest.jsx";
import AdminRequests from "./pages/AdminRequests.jsx";
import AccountMenu from "./components/AccountMenu.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
import NotificationBell from "./components/NotificationBell.jsx";

function Header() {
  const { user } = useAuth();
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
          {user?.role === "attendee" && <NavLink to="/my/tickets">My tickets</NavLink>}
          {user?.role === "organizer" && user.status === "pending" && (
            <NavLink to="/account/status">Account status</NavLink>
          )}
          {user?.role === "admin" && (
            <>
              <NavLink to="/admin/organizers">Organizers</NavLink>
              <NavLink to="/admin/venues">Venues</NavLink>
              <NavLink to="/admin/categories">Categories</NavLink>
            </>
          )}
        </nav>
        <div className="session">
          <ThemeToggle />
          {user ? (
            <>
              <NotificationBell />
              <AccountMenu />
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

// [pattern, component, who can open it]
// "guest" = only when logged out, "user" = any logged-in user,
// a list of roles = only those roles. The server checks roles again.
const routes = [
  ["/", Events],
  ["/events/new", EventForm, ["organizer"]],
  ["/events/:id", EventDetail],
  ["/events/:id/edit", EventForm, ["organizer", "admin"]],
  ["/my/events", MyEvents, ["organizer"]],
  ["/my/tickets", MyTickets, ["attendee"]],
  ["/account/status", AccountStatus, ["organizer"]],
  ["/account", () => <Redirect to="/account/profile" />, "user"],
  ["/account/profile", Profile, "user"],
  ["/account/profile/edit", ProfileEdit, "user"],
  ["/login", Login, "guest"],
  ["/register", Register, "guest"],
  ["/admin/organizers", AdminOrganizers, ["admin"]],
  ["/admin/requests", AdminRequests, ["admin"]],
  ["/my/requests", MyRequests, ["organizer"]],
  ["/my/requests/new", NewRequest, ["organizer"]],
  ["/admin/venues", AdminVenues, ["admin"]],
  ["/admin/categories", AdminCategories, ["admin"]],
];

function Routes() {
  const path = usePath();
  const { user, checking } = useAuth();

  if (checking) return <p className="loader">Checking your session…</p>;

  for (const [pattern, Page, access] of routes) {
    const params = matchPath(pattern, path);
    if (!params) continue;

    if (access === "guest" && user) return <Redirect to={homeFor(user)} />;
    if (access && access !== "guest" && !user) return <Redirect to="/login" />;
    // organizers waiting for approval can browse public pages and their own account pages, nothing else
    if (access && access !== "guest" && user.status === "pending" && !pattern.startsWith("/account")) {
      return <Redirect to="/account/status" />;
    }
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
    // key: a new page instance per address, so forms never keep old state
    return <Page key={path} {...params} />;
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
