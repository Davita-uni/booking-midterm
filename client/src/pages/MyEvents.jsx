import { useApi } from "../hooks.js";
import { Link, FROM } from "../router.jsx";
import { parts, longDate } from "../format.js";
import { Loading, ErrorState, Empty } from "../components/States.jsx";

// Organizer dashboard: own events with how full each one is.
export default function MyEvents() {
  const events = useApi("/events/mine");

  if (events.loading && !events.data) return <Loading label="Loading your events…" />;
  if (events.error) return <ErrorState error={events.error} onRetry={events.reload} />;

  const list = events.data;
  const totalBooked = list.reduce((sum, e) => sum + e.booked, 0);
  const now = new Date();
  const upcoming = list.filter((e) => new Date(e.starts_at) >= now).length;

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">Organizer</p>
          <h1>My events</h1>
        </div>
        <Link to="/events/new" from={FROM.myEvents} className="btn btn--primary">
          New event
        </Link>
      </div>

      {list.length === 0 ? (
        <Empty
          title="You haven't created any events"
          action={
            <Link to="/events/new" from={FROM.myEvents} className="btn btn--primary">
              Create your first event
            </Link>
          }
        >
          Pick a venue, a date, a price and how many tickets you have.
        </Empty>
      ) : (
        <>
          <p className="summary mono">
            {list.length} event(s) · {upcoming} upcoming · {totalBooked} ticket(s) sold
          </p>
          <table className="table">
            <thead>
              <tr>
                <th>Event</th>
                <th>When</th>
                <th className="num">Sold</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((event) => {
                // past events are read-only: greyed out, no Edit button
                const past = new Date(event.starts_at) < now;
                return (
                <tr key={event.id} className={past ? "is-past" : undefined}>
                  <td>
                    <Link to={`/events/${event.id}`} from={FROM.myEvents}>
                      <strong>{event.title}</strong>
                    </Link>
                    {past && <span className="past-chip mono">Past</span>}
                    <span className="table__sub">{event.venue_name}</span>
                  </td>
                  <td className="mono" title={longDate(event.starts_at)}>
                    {parts(event.starts_at).day} {parts(event.starts_at).month} {parts(event.starts_at).year}
                  </td>
                  <td className="num mono" data-label="Sold">
                    {event.booked} / {event.capacity}
                  </td>
                  <td className="table__actions">
                    <Link to={`/events/${event.id}`} from={FROM.myEvents} className="btn btn--small">
                      {past ? "View" : "Attendees"}
                    </Link>
                    {!past && (
                      <Link to={`/events/${event.id}/edit`} from={FROM.myEvents} className="btn btn--small">
                        Edit
                      </Link>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}
