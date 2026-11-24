import { useState } from "react";
import { api } from "../api.js";
import { useApi } from "../hooks.js";
import { Link, navigate } from "../router.jsx";
import { longDate, seatsLabel } from "../format.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import BookingBox from "../components/BookingBox.jsx";
import AttendeeList from "../components/AttendeeList.jsx";
import EventBadges from "../components/EventBadges.jsx";
import { Loading, ErrorState } from "../components/States.jsx";

export default function EventDetail({ id }) {
  const { data: event, error, loading, reload } = useApi(`/events/${id}`);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (loading && !event) return <Loading label="Loading event…" />;
  // opened from a "was cancelled" notification: the event no longer exists
  const cancelled = new URLSearchParams(window.location.search);
  if (error?.status === 404 && cancelled.get("cancelled")) return <CancelledEvent info={cancelled} />;
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
          <h1>
            {event.title}
            <EventBadges event={event} />
          </h1>
          <p className="detail__when mono">
            {longDate(event.starts_at)}
            {event.is_past && <span className="past-tag">Past event</span>}
          </p>
          {event.description ? (
            <p className="detail__text">{event.description}</p>
          ) : (
            <p className="detail__text muted">The organizer hasn't added a description.</p>
          )}

          {event.can_edit && (
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
              {/* the organization runs the event; the person is just its account */}
              <dd>{event.organizer_organization || event.organizer_name}</dd>
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
          <BookingBox event={event} onChange={reload} />
        </aside>
      </div>

      {/* key: reload the list when the booked count changes */}
      {event.can_manage && <AttendeeList key={event.booked} eventId={event.id} />}

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

// Greyed-out page for an event that was cancelled (deleted) by its organizer.
function CancelledEvent({ info }) {
  const title = info.get("title") || "This event";
  const when = info.get("when");
  const venue = info.get("venue");
  return (
    <>
      <Link to="/" className="back">
        ← All events
      </Link>
      <div className="cancelled">
        <p className="cancelled__banner" role="status">
          This event was cancelled by the organizer. Your booking was removed.
        </p>
        <div className="cancelled__body" aria-disabled="true">
          <p className="eyebrow">Cancelled</p>
          <h1>{title}</h1>
          {when && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(when) && <p className="detail__when mono">{longDate(when)}</p>}
          {venue && <p className="muted">{venue}</p>}
        </div>
        <Link to="/" className="btn">
          Browse other events
        </Link>
      </div>
    </>
  );
}
