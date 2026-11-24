import { useApi } from "../hooks.js";
import { Link } from "../router.jsx";
import { ROLE_LABEL, STATUS_LABEL } from "../auth.jsx";
import { bookedOn } from "../format.js";
import { Loading, ErrorState } from "../components/States.jsx";

// Account details: read-only overview of the account.
export default function AccountDetails() {
  const account = useApi("/account");

  if (account.loading && !account.data) return <Loading label="Loading account…" />;
  if (account.error) return <ErrorState error={account.error} onRetry={account.reload} />;

  const a = account.data;
  const rows = [
    ["Name", a.name],
    ["Email", a.email],
    ["Account type", ROLE_LABEL[a.role]],
    ["Status", <span className={`status status--${a.status}`}>{STATUS_LABEL[a.status]}</span>],
    a.role === "organizer" && ["Organization", a.organization || "—"],
    ["Member since", bookedOn(a.created_at)],
    a.role === "attendee" && ["Bookings", `${a.stats.bookings}`],
    a.role === "organizer" && ["Events organized", `${a.stats.events}`],
  ].filter(Boolean);

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">My account</p>
          <h1>Account details</h1>
        </div>
        <Link to="/account/profile" className="btn">
          Edit profile
        </Link>
      </div>

      <section className="panel details-card">
        <dl className="details">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd className={label === "Email" ? "break" : undefined}>{value}</dd>
            </div>
          ))}
        </dl>
        {a.status === "pending" && (
          <p className="alert alert--info">
            Your organizer account is waiting for approval. <Link to="/account/status">See the status page</Link>.
          </p>
        )}
        <div className="form__actions">
          {a.role === "attendee" && (
            <Link to="/my/tickets" className="btn btn--small">
              My tickets
            </Link>
          )}
          {a.role === "organizer" && a.status === "active" && (
            <Link to="/my/events" className="btn btn--small">
              My events
            </Link>
          )}
        </div>
      </section>
    </>
  );
}
