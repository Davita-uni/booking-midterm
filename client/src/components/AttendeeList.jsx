import { useState } from "react";
import { useApi } from "../hooks.js";
import { bookedOn } from "../format.js";
import { Loading, ErrorState, Empty } from "./States.jsx";

// Sortable columns. "#" is not one of them: it always counts 1, 2, 3…
// from the top, whatever the order.
const COLUMNS = [
  ["name", "Name"],
  ["email", "Email"],
  ["quantity", "Tickets"],
  ["created_at", "Ticket from"],
];

const compare = (a, b, key) =>
  key === "quantity"
    ? a.quantity - b.quantity || a.id - b.id
    : key === "created_at"
    ? a.created_at.localeCompare(b.created_at) || a.id - b.id
    : a[key].localeCompare(b[key], "en", { sensitivity: "base" });

// Who is coming. Only rendered for the event's organizer or an admin;
// the server checks that again.
export default function AttendeeList({ eventId }) {
  const attendees = useApi(`/events/${eventId}/registrations`);
  const [sort, setSort] = useState({ key: "created_at", dir: "asc" });

  const sortBy = (key) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));

  const rows = attendees.data
    ? [...attendees.data].sort((a, b) => compare(a, b, sort.key) * (sort.dir === "asc" ? 1 : -1))
    : [];

  return (
    <section className="attendees">
      <h2>
        Attendees {attendees.data && <span className="mono muted">({attendees.data.length})</span>}
      </h2>
      {attendees.loading && !attendees.data ? (
        <Loading label="Loading attendees…" />
      ) : attendees.error ? (
        <ErrorState error={attendees.error} onRetry={attendees.reload} />
      ) : rows.length === 0 ? (
        <Empty title="No tickets sold yet">Share the event page to get your first attendees.</Empty>
      ) : (
        <table className="table table--sortable">
          <thead>
            <tr>
              <th className="num">#</th>
              {COLUMNS.map(([key, label]) => {
                const active = sort.key === key;
                return (
                  <th key={key} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
                    <button type="button" className={`sort${active ? " is-active" : ""}`} onClick={() => sortBy(key)}>
                      {label}
                      <span className="sort__arrow" aria-hidden="true">
                        {active ? (sort.dir === "asc" ? "▲" : "▼") : "↕"}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((a, i) => (
              <tr key={a.id}>
                <td className="num mono muted" data-label="#">
                  {i + 1}
                </td>
                <td>
                  <strong>{a.name}</strong>
                </td>
                <td className="break">{a.email}</td>
                <td className="num mono" data-label="Tickets">
                  {a.quantity}
                </td>
                <td className="mono muted">{bookedOn(a.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
