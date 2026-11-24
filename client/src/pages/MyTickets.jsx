import { useApi } from "../hooks.js";
import { Link, FROM } from "../router.jsx";
import { parts } from "../format.js";
import { Loading, ErrorState, Empty } from "../components/States.jsx";

// Attendee's tickets, shown as ticket stubs.
export default function MyTickets() {
  const tickets = useApi("/registrations/mine");

  if (tickets.loading && !tickets.data) return <Loading label="Loading your tickets…" />;
  if (tickets.error) return <ErrorState error={tickets.error} onRetry={tickets.reload} />;

  const upcoming = tickets.data.filter((t) => !t.past);
  const past = tickets.data.filter((t) => t.past);

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">Attendee</p>
          <h1>My tickets</h1>
        </div>
      </div>

      {tickets.data.length === 0 ? (
        <Empty
          title="No tickets yet"
          action={
            <Link to="/" className="btn btn--primary">
              Browse events
            </Link>
          }
        >
          When you get a ticket, it shows up here.
        </Empty>
      ) : (
        <>
          <ul className="tickets">
            {upcoming.map((t) => (
              <Ticket key={t.id} ticket={t} />
            ))}
          </ul>
          {past.length > 0 && (
            <>
              <h2 className="tickets__past-title">Past</h2>
              <ul className="tickets tickets--past">
                {past.map((t) => (
                  <Ticket key={t.id} ticket={t} />
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </>
  );
}

function Ticket({ ticket }) {
  const d = parts(ticket.starts_at);
  return (
    <li>
      <Link to={`/events/${ticket.event_id}`} from={FROM.tickets} className="ticket">
        <span className="ticket__stub mono">
          <span>{d.month}</span>
          <strong>{d.day}</strong>
          <span>{d.time}</span>
        </span>
        <span className="ticket__body">
          <span className="ticket__title">{ticket.title}</span>
          <span className="muted">
            {ticket.venue_name} · {ticket.category_name}
          </span>
          <span className="ticket__no mono">
            No. {String(ticket.id).padStart(5, "0")}
            {ticket.quantity > 1 && ` · ${ticket.quantity} tickets`}
          </span>
        </span>
      </Link>
    </li>
  );
}
