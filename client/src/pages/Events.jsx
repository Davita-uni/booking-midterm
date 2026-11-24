import { useEffect, useRef, useState } from "react";
import { useApi } from "../hooks.js";
import { useAuth } from "../auth.jsx";
import { Link, FROM } from "../router.jsx";
import { useBrand } from "../brand.js";
import EventRow from "../components/EventRow.jsx";
import Pagination from "../components/Pagination.jsx";
import NextEventTicket from "../components/NextEventTicket.jsx";
import { TAGLINE } from "./Login.jsx";
import { Loading, ErrorState, Empty } from "../components/States.jsx";

// Read ?when=past and ?page=N from the address, so the list survives a reload or Back.
const query = () => new URLSearchParams(window.location.search);
const initialWhen = () => (query().get("when") === "past" ? "past" : "upcoming");
const initialPage = () => Math.max(1, Number.parseInt(query().get("page"), 10) || 1);

// The public list ("/") and the internal Ilia Uni list ("/iliauni", audience="iliauni")
// share this page; the server only returns internal meetings to @iliauni.edu.ge accounts.
const TEXT = {
  public: {
    base: "/",
    eyebrow: "Tbilisi · what's on",
    upcoming: "Upcoming Events",
    past: "Past Events",
    from: { upcoming: FROM.upcoming, past: FROM.past },
    newEvent: "/events/new",
  },
  iliauni: {
    base: "/iliauni",
    eyebrow: "Ilia State University · internal",
    upcoming: "Upcoming Meetings",
    past: "Past Meetings",
    from: { upcoming: FROM.iliauni, past: FROM.iliauniPast },
    newEvent: "/events/new?audience=iliauni",
  },
};

export default function Events({ audience = "public" }) {
  const { user } = useAuth();
  const text = TEXT[audience];
  const HeadingTag = audience === "public" ? "h2" : "h1";
  useBrand(audience === "iliauni");
  const categories = useApi("/categories");
  const [when, setWhen] = useState(initialWhen);
  const [page, setPage] = useState(initialPage);
  const listTop = useRef(null);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  // wait until the user stops typing before asking the server
  useEffect(() => {
    const t = setTimeout(() => setSearch(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  // the address of this list as it is now, e.g. "/?when=past&page=2"
  const urlFor = (w, p) => {
    const qs = new URLSearchParams();
    if (w === "past") qs.set("when", "past");
    if (p > 1) qs.set("page", String(p));
    return qs.size ? `${text.base}?${qs}` : text.base;
  };
  const show = (w, p) => {
    setWhen(w);
    setPage(p);
    window.history.replaceState(null, "", urlFor(w, p));
  };
  const choose = (next) => show(next, 1);
  const goToPage = (p) => {
    show(when, p);
    listTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // a new search or category starts again at page 1. Compared with the last
  // values (not "skip the first render"), so ?page=2 in the address is kept on
  // load, also when React runs effects twice in development.
  const lastFilters = useRef({ search, category });
  useEffect(() => {
    const last = lastFilters.current;
    if (last.search === search && last.category === category) return;
    lastFilters.current = { search, category };
    show(when, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category]);

  const params = new URLSearchParams();
  if (audience === "iliauni") params.set("audience", "iliauni");
  if (when === "past") params.set("when", "past");
  if (search) params.set("q", search);
  if (category) params.set("category", category);
  params.set("page", String(page));
  const result = useApi(`/events?${params}`);
  // the server answers { events, page, pages, total } and may correct a page that is out of range
  const events = { ...result, data: result.data?.events };
  const paging = result.data;
  // ?page=99 in the address: show (and write) the last page the server returned
  useEffect(() => {
    if (paging?.page && paging.page !== page) show(when, paging.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paging?.page]);

  // the breadcrumb on an event page leads back to this exact list and page
  const from = { to: urlFor(when, paging?.page ?? page), label: text.from[when].label };
  const filtered = Boolean(search || category);

  return (
    <>
      {audience === "public" && (
        <section className="hero">
          <div className="hero__intro">
            <p className="eyebrow">Doorlist · Tbilisi</p>
            <h1 className="tagline">
              Your Name <span className="tagline__glow">on the Door</span>
            </h1>
            <p className="hero__lead">{TAGLINE}</p>
          </div>
          <NextEventTicket />
        </section>
      )}

      <div className="page-head" ref={listTop}>
        <div>
          <p className="eyebrow">{text.eyebrow}</p>
          {/* the chosen list is the big title; the other one is the small link after the slash */}
          {/* on the public page the hero has the h1, so the list title is an h2 */}
          <HeadingTag className="when-switch">
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
          </HeadingTag>
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
            <EventRow key={event.id} event={event} from={from} />
          ))}
        </ul>
      )}
      {paging && !events.error && (
        <Pagination
          page={paging.page}
          pages={paging.pages}
          total={paging.total}
          pageSize={paging.page_size}
          onChange={goToPage}
          noun={audience === "iliauni" ? "meetings" : "events"}
        />
      )}
    </>
  );
}
