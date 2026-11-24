import { Link } from "../router.jsx";
import { parts, seatsLabel } from "../format.js";
import EventBadges from "./EventBadges.jsx";

// One line in the event list: date block, title and venue, seats.
export default function EventRow({ event }) {
  const d = parts(event.starts_at);
  const soldOut = event.seats_left === 0;
  return (
    <li>
      <Link to={`/events/${event.id}`} className={`event-row${event.is_past ? " event-row--past" : ""}`}>
        <span className="date-block mono" aria-label={`${d.weekday} ${d.day} ${d.month}`}>
          <span className="date-block__month">{d.month}</span>
          <span className="date-block__day">{d.day}</span>
          <span className="date-block__weekday">{d.weekday}</span>
        </span>
        <span className="event-row__main">
          <span className="event-row__meta mono">
            {d.time} · {event.category_name}
          </span>
          <span className="event-row__title">
            {event.title}
            <EventBadges event={event} />
          </span>
          <span className="event-row__venue">{event.venue_name}</span>
        </span>
        {event.is_past ? (
          <span className="seats seats--past mono">{event.booked} attended</span>
        ) : (
          <span className={`seats mono${soldOut ? " seats--out" : ""}`}>{seatsLabel(event)}</span>
        )}
      </Link>
    </li>
  );
}
