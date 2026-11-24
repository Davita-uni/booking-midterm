import { useApi } from "../hooks.js";
import { Link } from "../router.jsx";
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
        <Link to="/events/new" className="btn btn--primary">
          New event
        </Link>
      </div>

      {list.length === 0 ? (
        <Empty
          title="You haven't created any events"
          action={
            <Link to="/events/new" className="btn btn--primary">
              Create your first event
            </Link>
          }
        >
          Pick a venue, a date and how many seats you have.
        </Empty>
      ) : (
        <>
          <p className="summary mono">
            {list.length} event(s) · {upcoming} upcoming · {totalBooked} seat(s) booked
          </p>
          <table className="table">
            <thead>
              <tr>
                <th>Event</th>
                <th>When</th>
                <th className="num">Booked</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((event) => (
                <tr key={event.id}>
                  <td>
                    <Link to={`/events/${event.id}`}>
                      <strong>{event.title}</strong>
                    </Link>
                    <span className="table__sub">{event.venue_name}</span>
                  </td>
                  <td className="mono" title={longDate(event.starts_at)}>
                    {parts(event.starts_at).day} {parts(event.starts_at).month} {parts(event.starts_at).year}
                  </td>
                  <td className="num mono" data-label="Booked">
                    {event.booked} / {event.capacity}
                  </td>
                  <td className="table__actions">
                    <Link to={`/events/${event.id}`} className="btn btn--small">
                      Attendees
                    </Link>
                    {new Date(event.starts_at) >= now && (
                      <Link to={`/events/${event.id}/edit`} className="btn btn--small">
                        Edit
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}
