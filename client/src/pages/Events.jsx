import { useEffect, useState } from "react";
import { useApi } from "../hooks.js";
import { useAuth } from "../auth.jsx";
import { Link } from "../router.jsx";
import EventRow from "../components/EventRow.jsx";
import { Loading, ErrorState, Empty } from "../components/States.jsx";

// Read ?when=past from the address so the choice survives a reload or Back.
const initialWhen = () => (new URLSearchParams(window.location.search).get("when") === "past" ? "past" : "upcoming");

export default function Events() {
  const { user } = useAuth();
  const categories = useApi("/categories");
  const [when, setWhen] = useState(initialWhen);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  // wait until the user stops typing before asking the server
  useEffect(() => {
    const t = setTimeout(() => setSearch(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const choose = (next) => {
    setWhen(next);
    window.history.replaceState(null, "", next === "past" ? "/?when=past" : "/");
  };

  const params = new URLSearchParams();
  if (when === "past") params.set("when", "past");
  if (search) params.set("q", search);
  if (category) params.set("category", category);
  const events = useApi(`/events${params.size ? `?${params}` : ""}`);
  const filtered = Boolean(search || category);

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">Tbilisi · what's on</p>
          {/* the chosen list is the big title; the other one is the small link after the slash */}
          <h1 className="when-switch">
            <button
              type="button"
              className={`when-switch__opt${when === "upcoming" ? " is-active" : ""}`}
              aria-pressed={when === "upcoming"}
              onClick={() => choose("upcoming")}
            >
              Upcoming events
            </button>
            <span className="when-switch__slash" aria-hidden="true">
              /
            </span>
            <button
              type="button"
              className={`when-switch__opt${when === "past" ? " is-active" : ""}`}
              aria-pressed={when === "past"}
              onClick={() => choose("past")}
            >
              Past events
            </button>
          </h1>
        </div>
        {user?.role === "organizer" && user.status === "active" && when === "upcoming" && (
          <Link to="/events/new" className="btn btn--primary">
            New event
          </Link>
        )}
      </div>

      <form className="filters" role="search" onSubmit={(e) => e.preventDefault()}>
        <label className="sr-only" htmlFor="q">
          Search events
        </label>
        <input
          id="q"
          type="search"
          placeholder="Search by event or venue"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <label className="sr-only" htmlFor="category">
          Category
        </label>
        <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </form>

      {events.loading && !events.data ? (
        <Loading label="Loading events…" />
      ) : events.error ? (
        <ErrorState error={events.error} onRetry={events.reload} />
      ) : events.data.length === 0 ? (
        filtered ? (
          <Empty
            title="No events match"
            action={
              <button
                className="btn"
                onClick={() => {
                  setQ("");
                  setCategory("");
                }}
              >
                Clear filters
              </button>
            }
          >
            Try another word or category.
          </Empty>
        ) : (
          when === "past" ? (
            <Empty title="No past events yet">Events move here once they have taken place.</Empty>
          ) : (
            <Empty title="Nothing scheduled yet">New events will show up here.</Empty>
          )
        )
      ) : (
        <ul className="event-list" aria-busy={events.loading}>
          {events.data.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </ul>
      )}
    </>
  );
}
