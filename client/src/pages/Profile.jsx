import { useApi } from "../hooks.js";
import { Link } from "../router.jsx";
import { ROLE_LABEL, STATUS_LABEL } from "../auth.jsx";
import { bookedOn, parts } from "../format.js";
import { Loading, ErrorState } from "../components/States.jsx";

// My profile: account overview plus the events the user organizes and the
// events they booked a seat at. "Edit profile" opens the edit form.
export default function Profile() {
  const account = useApi("/account");

  if (account.loading && !account.data) return <Loading label="Loading your profile…" />;
  if (account.error) return <ErrorState error={account.error} onRetry={account.reload} />;

  const a = account.data;
  const isOrganizer = a.role === "organizer";
  const canBook = a.role !== "admin";

  const rows = [
    ["Email", a.email],
    ["Account type", ROLE_LABEL[a.role]],
    ["Status", <span className={`status status--${a.status}`}>{STATUS_LABEL[a.status]}</span>],
    isOrganizer && ["Organization", a.organization || "—"],
    ["Member since", bookedOn(a.created_at)],
  ].filter(Boolean);

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">My profile</p>
          <h1>{a.name}</h1>
        </div>
        <Link to="/account/profile/edit" className="btn">
          Edit profile
        </Link>
      </div>

      <section className="panel profile-facts">
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
      </section>

      <div className="profile-lists">
        {isOrganizer && (
          <EventList
            title="Events organized"
            events={a.organized}
            empty="You haven't created any events yet."
            meta={(e) => `${e.booked} / ${e.capacity} booked`}
          />
        )}
        {canBook && (
          <EventList
            title="Events attended"
            events={a.attended}
            empty={
              isOrganizer
                ? "Seats you book at other organizers' events show up here. Your own events are not added."
                : "Seats you book show up here."
            }
            meta={(e) => `Booked ${bookedOn(e.booked_at)}`}
          />
        )}
      </div>
    </>
  );
}

function EventList({ title, events, empty, meta }) {
  return (
    <section className="profile-list">
      <h2>
        {title} <span className="mono muted">({events.length})</span>
      </h2>
      {events.length === 0 ? (
        <p className="state">{empty}</p>
      ) : (
        <ul className="mini-events">
          {events.map((e) => {
            const d = parts(e.starts_at);
            return (
              <li key={e.id}>
                <Link to={`/events/${e.id}`} className={`mini-event${e.past ? " is-past" : ""}`}>
                  <span className="mini-event__date mono">
                    {d.day} {d.month}
                    <small>{d.year}</small>
                  </span>
                  <span className="mini-event__main">
                    <span className="mini-event__title">{e.title}</span>
                    <span className="muted">
                      {e.venue_name} · {meta(e)}
                    </span>
                  </span>
                  {e.past && <span className="mini-event__tag mono">Past</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
