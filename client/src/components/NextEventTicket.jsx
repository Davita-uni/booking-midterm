import { useApi } from "../hooks.js";
import { Link, FROM } from "../router.jsx";
import { parts } from "../format.js";
import Price from "./Price.jsx";

// A real ticket for the next upcoming event that still has tickets left,
// shown next to the "Your Name on the Door" intro. Clicking it opens the event.
export default function NextEventTicket() {
  const events = useApi("/events");
  const next = events.data?.find((e) => e.seats_left > 0);
  if (!next) return null;
  const d = parts(next.starts_at);
  return (
    <Link to={`/events/${next.id}`} from={FROM.upcoming} className="ticket next-ticket">
      <span className="ticket__stub mono">
        <span>{d.month}</span>
        <strong>{d.day}</strong>
        <span>{d.time}</span>
      </span>
      <span className="ticket__body">
        <span className="next-ticket__label">Next up</span>
        <span className="ticket__title">{next.title}</span>
        <span className="muted">
          {next.venue_name} · {next.category_name}
        </span>
        <span className="next-ticket__foot">
          <Price value={next.price} />
          <span className="next-ticket__go">Get Tickets →</span>
        </span>
      </span>
    </Link>
  );
}
