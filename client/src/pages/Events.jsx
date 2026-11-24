import { useEffect, useState } from "react";
import { useApi } from "../hooks.js";
import { useAuth } from "../auth.jsx";
import { Link, FROM } from "../router.jsx";
import { useBrand } from "../brand.js";
import EventRow from "../components/EventRow.jsx";
import { Loading, ErrorState, Empty } from "../components/States.jsx";

// Read ?when=past from the address so the choice survives a reload or Back.
const initialWhen = () => (new URLSearchParams(window.location.search).get("when") === "past" ? "past" : "upcoming");

// The public list ("/") and the internal Ilia Uni list ("/iliauni", audience="iliauni")
// share this page; the server only returns internal meetings to @iliauni.edu.ge accounts.
const TEXT = {
  public: {
    base: "/",
    eyebrow: "Tbilisi · what's on",
    upcoming: "Upcoming events",
    past: "Past events",
    from: { upcoming: FROM.upcoming, past: FROM.past },
    newEvent: "/events/new",
  },
  iliauni: {
    base: "/iliauni",
    eyebrow: "Ilia State University · internal",
    upcoming: "Upcoming meetings",
    past: "Past meetings",
    from: { upcoming: FROM.iliauni, past: FROM.iliauniPast },
    newEvent: "/events/new?audience=iliauni",
  },
};

export default function Events({ audience = "public" }) {
  const { user } = useAuth();
  const text = TEXT[audience];
  useBrand(audience === "iliauni");
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
    window.history.replaceState(null, "", next === "past" ? `${text.base}?when=past` : text.base);
  };

  const params = new URLSearchParams();
  if (audience === "iliauni") params.set("audience", "iliauni");
  if (when === "past") params.set("when", "past");
  if (search) params.set("q", search);
  if (category) params.set("category", category);
  const events = useApi(`/events${params.size ? `?${params}` : ""}`);
  const filtered = Boolean(search || category);

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">{text.eyebrow}</p>
          {/* the chosen list is the big title; the other one is the small link after the slash */}
          <h1 className="when-switch">
            <button
              type="button"
              className={`when-switch__opt${when === "upcoming" ? " is-active" : ""}`}
              aria-pressed={when === "upcoming"}
              onClick={() => choose("upcoming")}
            >
              {text.upcoming}
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
              {text.past}
            </button>
          </h1>
        </div>
        {user?.role === "organizer" && user.status === "active" && when === "upcoming" && (
          <Link to={text.newEvent} from={text.from.upcoming} className="btn btn--primary">
            {audience === "iliauni" ? "New meeting" : "New event"}
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
            <Empty title={audience === "iliauni" ? "No past meetings yet" : "No past events yet"}>
              {audience === "iliauni" ? "Meetings" : "Events"} move here once they have taken place.
            </Empty>
          ) : (
            <Empty title="Nothing scheduled yet">
              New {audience === "iliauni" ? "meetings" : "events"} will show up here.
            </Empty>
          )
        )
      ) : (
        <ul className="event-list" aria-busy={events.loading}>
          {events.data.map((event) => (
            <EventRow key={event.id} event={event} from={text.from[when]} />
          ))}
        </ul>
      )}
    </>
  );
}
