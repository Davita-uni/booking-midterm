import { useApi } from "../hooks.js";
import { bookedOn } from "../format.js";
import { Loading, ErrorState, Empty } from "./States.jsx";

// Who is coming. Only rendered for the event's organizer or an admin;
// the server checks that again.
export default function AttendeeList({ eventId }) {
  const attendees = useApi(`/events/${eventId}/registrations`);

  return (
    <section className="attendees">
      <h2>
        Attendees {attendees.data && <span className="mono muted">({attendees.data.length})</span>}
      </h2>
      {attendees.loading && !attendees.data ? (
        <Loading label="Loading attendees…" />
      ) : attendees.error ? (
        <ErrorState error={attendees.error} onRetry={attendees.reload} />
      ) : attendees.data.length === 0 ? (
        <Empty title="No bookings yet">Share the event page to get your first attendees.</Empty>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th className="num">#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Booked</th>
            </tr>
          </thead>
          <tbody>
            {attendees.data.map((a, i) => (
              <tr key={a.id}>
                <td className="num mono muted" data-label="#">
                  {i + 1}
                </td>
                <td>
                  <strong>{a.name}</strong>
                </td>
                <td className="break">{a.email}</td>
                <td className="mono muted">{bookedOn(a.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
