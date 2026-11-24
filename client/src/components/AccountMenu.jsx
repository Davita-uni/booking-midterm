import { useEffect, useRef, useState } from "react";
import { useAuth, ROLE_LABEL } from "../auth.jsx";
import { Link, usePath } from "../router.jsx";

// "Hi, Nino!" button in the header with a small dropdown:
// name (+ Admin / Organizer / Pending tag), My profile, My events and
// My requests (approved organizers) or Requests (admins), Log out.
export default function AccountMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const path = usePath();

  // close when the page changes, on a click outside, or with Escape
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        ref.current?.querySelector(".account__button")?.focus();
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  let tag = null;
  if (user.status === "pending") tag = <span className="chip chip--pending">Pending</span>;
  else if (user.role !== "attendee") tag = <span className={`chip chip--${user.role}`}>{ROLE_LABEL[user.role]}</span>;

  return (
    <div className="account" ref={ref}>
      <button
        type="button"
        className="btn btn--small account__button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="account-menu"
        onClick={() => setOpen((o) => !o)}
      >
        Hi, {user.name.split(" ")[0]}!
        <span className={`account__caret${open ? " is-open" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="account__menu" id="account-menu">
          <div className="account__who">
            <span className="account__name">{user.name}</span>
            {tag}
          </div>
          <Link to="/account/profile" className="account__item">
            My profile
          </Link>
          {user.role === "organizer" && user.status === "active" && (
            <Link to="/my/events" className="account__item">
              My events
            </Link>
          )}
          {user.role === "organizer" && user.status === "active" && (
            <Link to="/my/requests" className="account__item">
              My requests
            </Link>
          )}
          {user.role === "admin" && (
            <Link to="/admin/requests" className="account__item">
              Requests
            </Link>
          )}
          <button type="button" className="account__item account__item--danger" onClick={logout}>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
