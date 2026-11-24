import { useState } from "react";
import { api } from "../api.js";
import { useApi } from "../hooks.js";
import { Link, navigate } from "../router.jsx";
import { longDate, seatsLabel } from "../format.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { Loading, ErrorState } from "../components/States.jsx";

export default function EventDetail({ id }) {
  const { data: event, error, loading, reload } = useApi(`/events/${id}`);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (loading && !event) return <Loading label="Loading event…" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const percent = Math.round((event.booked / event.capacity) * 100);

  const remove = async () => {
    await api(`/events/${event.id}`, { method: "DELETE" });
    navigate("/");
  };

  return (
    <>
      <Link to="/" className="back">
        ← All events
      </Link>

      <div className="detail">
        <article className="detail__main">
          <p className="eyebrow">{event.category_name}</p>
          <h1>{event.title}</h1>
          <p className="detail__when mono">{longDate(event.starts_at)}</p>
          {event.description ? (
            <p className="detail__text">{event.description}</p>
          ) : (
            <p className="detail__text muted">The organizer hasn't added a description.</p>
          )}

          {event.can_manage && (
            <div className="detail__owner">
              <Link to={`/events/${event.id}/edit`} className="btn">
                Edit event
              </Link>
              <button className="btn btn--danger" onClick={() => setConfirmDelete(true)}>
                Delete event
              </button>
            </div>
          )}
        </article>

        <aside className="detail__side panel">
          <dl className="facts">
            <div>
              <dt>Venue</dt>
              <dd>
                {event.venue_name}
                <span className="muted">
                  {event.venue_address}, {event.venue_city}
                </span>
              </dd>
            </div>
            <div>
              <dt>Organizer</dt>
              <dd>{event.organizer_name}</dd>
            </div>
            <div>
              <dt>Seats</dt>
              <dd className="mono">
                {event.booked} / {event.capacity} booked
              </dd>
            </div>
          </dl>
          <div
            className="meter"
            role="meter"
            aria-label="Seats booked"
            aria-valuemin={0}
            aria-valuemax={event.capacity}
            aria-valuenow={event.booked}
          >
            <span style={{ width: `${percent}%` }} />
          </div>
          <p className={`seats mono${event.seats_left === 0 ? " seats--out" : ""}`}>{seatsLabel(event)}</p>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this event?"
        confirmLabel="Delete event"
        onConfirm={remove}
        onClose={() => setConfirmDelete(false)}
      >
        <p>
          <strong>{event.title}</strong> and its {event.booked} booking(s) will be removed. This can't be undone.
        </p>
      </ConfirmDialog>
    </>
  );
}
