import { Link } from "../router.jsx";
import { parts, seatsLabel, seatsTone } from "../format.js";
import EventBadges from "./EventBadges.jsx";
import Price from "./Price.jsx";

// One line in the event list: date block, title and venue, seats.
export default function EventRow({ event, from }) {
  const d = parts(event.starts_at);
  return (
    <li>
      <Link to={`/events/${event.id}`} from={from} className={`event-row${event.is_past ? " event-row--past" : ""}`}>
        <span className="date-block mono" aria-label={`${d.weekday} ${d.day} ${d.month}`}>
          <span className="date-block__month">{d.month}</span>
          <span className="date-block__day">{d.day}</span>
          <span className="date-block__weekday">{d.weekday}</span>
        </span>
        <span className="event-row__main">
          <span className="event-row__meta mono">
            {d.time} · {event.category_name}
            {event.age_limit ? ` · ${event.age_limit}+` : ""}
          </span>
          <span className="event-row__title">
            {event.title}
            <EventBadges event={event} />
          </span>
          <span className="event-row__venue">{event.venue_name}</span>
        </span>
        <span className="event-row__side">
          <Price value={event.price} />
          {event.is_past ? (
            <span className="seats seats--past mono">{event.booked} attended</span>
          ) : (
            <span className={`seats mono seats--${seatsTone(event)}`}>{seatsLabel(event)}</span>
          )}
        </span>
      </Link>
    </li>
  );
}
