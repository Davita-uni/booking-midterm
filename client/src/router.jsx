import { useEffect, useState } from "react";

// A very small client-side router based on the History API.
// Patterns look like "/events/:id/edit".

// `state` is kept with the history entry, so it survives Back/Forward and a reload.
// Pages use it to remember where the user came from (see backTo below).
export function navigate(to, { replace = false, state = null } = {}) {
  if (replace) window.history.replaceState(state, "", to);
  else window.history.pushState(state, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo(0, 0);
}

export function usePath() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onChange = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onChange);
    return () => window.removeEventListener("popstate", onChange);
  }, []);
  return path;
}

export function matchPath(pattern, path) {
  const p = pattern.split("/").filter(Boolean);
  const a = path.split("/").filter(Boolean);
  if (p.length !== a.length) return null;
  const params = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(":")) params[p[i].slice(1)] = decodeURIComponent(a[i]);
    else if (p[i] !== a[i]) return null;
  }
  return params;
}

// `from` = { to, label } of the page this link is on; the target page shows it
// as its "← label" breadcrumb instead of a fixed one.
export function Link({ to, from, state, className, children, ...rest }) {
  const onClick = (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(to, { state: from ? { ...state, from } : state ?? null });
  };
  return (
    <a href={to} className={className} onClick={onClick} {...rest}>
      {children}
    </a>
  );
}

export function NavLink({ to, children, exact = false }) {
  const path = usePath();
  const active = exact ? path === to : path === to || path.startsWith(to + "/");
  return (
    <Link to={to} className={active ? "active" : undefined}>
      {children}
    </Link>
  );
}

// Where the "← back" breadcrumb should point: the page the user came from,
// or `fallback` when the page was opened directly (address bar, notification).
export function backTo(fallback) {
  const from = window.history.state?.from;
  return from?.to && from?.label ? from : fallback;
}

// The places a link can come from, so every page names them the same way.
export const FROM = {
  upcoming: { to: "/", label: "All Events" },
  past: { to: "/?when=past", label: "Past Events" },
  tickets: { to: "/my/tickets", label: "My Tickets" },
  myEvents: { to: "/my/events", label: "My Events" },
  profile: { to: "/account/profile", label: "My Profile" },
  status: { to: "/account/status", label: "Account Status" },
  iliauni: { to: "/iliauni", label: "Iliauni Meetings" },
  iliauniPast: { to: "/iliauni?when=past", label: "Past Iliauni Meetings" },
};
