import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth.jsx";
import { Link, FROM } from "../router.jsx";
import { HELP_PHONE } from "../config.js";

const CHECK_EVERY_MS = 30000;

const time = (d) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

// Organizers land here after signing up or logging in while an admin hasn't
// approved them yet. The page checks the status by itself every 30 seconds,
// so there is no need to log in again.
export default function AccountStatus() {
  const { user, refresh } = useAuth();
  const [checkedAt, setCheckedAt] = useState(new Date());
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const check = useCallback(async () => {
    setChecking(true);
    setError("");
    try {
      await refresh();
      setCheckedAt(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setChecking(false);
    }
  }, [refresh]);

  const pending = user.status === "pending";
  // a rejected sign-up becomes a regular attendee account
  const denied = user.role === "attendee";

  useEffect(() => {
    if (!pending) return;
    const id = setInterval(check, CHECK_EVERY_MS);
    return () => clearInterval(id);
  }, [pending, check]);

  if (denied) {
    return (
      <div className="status-page">
        <p className="eyebrow">Organizer application</p>
        <h1>Application Denied</h1>
        <section className="panel status-card">
          <div className="notice notice--error">
            <p className="notice__title">Your organizer application was denied</p>
            <p>Please contact the administrator if you think this is a mistake.</p>
            <p>
              Help center: <strong className="mono">{HELP_PHONE}</strong>
            </p>
          </div>
          <p>Your account stays active as a regular attendee account, so you can keep browsing events and getting tickets.</p>
          <div className="form__actions">
            <Link to="/" className="btn btn--primary">
              Browse events
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="status-page">
      <p className="eyebrow">Organizer account</p>
      <h1>{pending ? "Waiting for Approval" : "You're Approved"}</h1>

      <section className={`panel status-card${pending ? "" : " status-card--ok"}`} aria-live="polite">
        <dl className="status-card__rows">
          <div>
            <dt>Status</dt>
            <dd>
              <span className={`status status--${user.status}`}>{pending ? "Pending approval" : "Active"}</span>
            </dd>
          </div>
          <div>
            <dt>Name</dt>
            <dd>{user.name}</dd>
          </div>
          <div>
            <dt>Organization</dt>
            <dd>{user.organization || "—"}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd className="break">{user.email}</dd>
          </div>
        </dl>

        {pending ? (
          <>
            <div className="notice">
              <p className="notice__title">An admin needs to approve your account</p>
              <p>
                Your account is created and you are logged in. Before you can publish events, an admin has to approve
                it. Please wait — this page checks your status automatically, so you don't need to log in again.
              </p>
              <p>
                Meanwhile you can browse events and get tickets like an attendee. Your tickets show up under My profile.
              </p>
              <p>
                If it takes too long, call our help center: <strong className="mono">{HELP_PHONE}</strong>
              </p>
            </div>
            {error && (
              <p className="alert" role="alert">
                {error}
              </p>
            )}
            <div className="form__actions">
              <button className="btn btn--primary" onClick={check} disabled={checking}>
                {checking ? "Checking…" : "Check status now"}
              </button>
              <Link to="/" className="btn">
                Browse events
              </Link>
            </div>
            <p className="status-card__checked mono">
              Last checked {time(checkedAt)} · checks again every 30 seconds
            </p>
          </>
        ) : (
          <>
            <p className="alert alert--success">An admin approved your account. You can now publish events.</p>
            <div className="form__actions">
              <Link to="/events/new" from={FROM.status} className="btn btn--primary">
                Create your first event
              </Link>
              <Link to="/my/events" className="btn">
                My events
              </Link>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
