import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useApi } from "../hooks.js";
import { Link, navigate, backTo, FROM } from "../router.jsx";
import { useAuth } from "../auth.jsx";
import { useBrand } from "../brand.js";
import Field from "../components/Field.jsx";
import DateTimeField from "../components/DateTimeField.jsx";
import ChoiceGroup from "../components/ChoiceGroup.jsx";
import { Loading, ErrorState } from "../components/States.jsx";

const EMPTY = {
  title: "",
  description: "",
  starts_at: "",
  capacity: "",
  venue_id: "",
  category_id: "",
  price: "",
  face_control: null, // true / false / null (not set)
  age_limit: null, // 16 / 18 / 21 / 25 / null
  dress: null, // "Formal" / "other" / null
  dress_other: "",
  audience: "public", // "public" or "iliauni" (Ilia Uni organizers only)
};

const AUDIENCE_OPTIONS = [
  { value: "public", label: "Everyone" },
  { value: "iliauni", label: "Iliauni only" },
];

const FACE_OPTIONS = [
  { value: true, label: "Yes" },
  { value: false, label: "No" },
];
const AGE_OPTIONS = [16, 18, 21, 25].map((age) => ({ value: age, label: `${age}+` }));
const DRESS_OPTIONS = [
  { value: "Formal", label: "Formal" },
  { value: "other", label: "Other" },
];

// Used for both /events/new and /events/:id/edit
export default function EventForm({ id }) {
  const editing = Boolean(id);
  const { user } = useAuth();
  const existing = useApi(editing ? `/events/${id}` : null);
  const venues = useApi("/venues");
  const categories = useApi("/categories");

  // "New event" on the Iliauni page opens the form with "Iliauni only" chosen
  const [form, setForm] = useState(() => ({
    ...EMPTY,
    audience: new URLSearchParams(window.location.search).get("audience") === "iliauni" ? "iliauni" : "public",
  }));
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  // Breadcrumb and Cancel go back to where the form was opened from. The event
  // page keeps its own breadcrumb (`eventFrom`), so after saving or going back
  // to it the user still returns to the list they started from.
  const eventPage = editing ? `/events/${id}` : null;
  const back = backTo(editing ? { to: eventPage, label: "Back to Event" } : FROM.upcoming);
  const eventFrom = window.history.state?.eventFrom ?? (back.to === eventPage ? null : back);
  const backLinkFrom = back.to === eventPage ? eventFrom : undefined;

  useEffect(() => {
    const e = existing.data;
    if (!e) return;
    setForm({
      title: e.title,
      description: e.description,
      starts_at: e.starts_at,
      capacity: String(e.capacity),
      venue_id: String(e.venue_id),
      category_id: String(e.category_id),
      price: String(e.price),
      face_control: e.face_control === null ? null : e.face_control === 1,
      age_limit: e.age_limit,
      dress: e.dress_code === null ? null : e.dress_code === "Formal" ? "Formal" : "other",
      dress_other: e.dress_code && e.dress_code !== "Formal" ? e.dress_code : "",
      audience: e.audience,
    });
  }, [existing.data]);

  // the form takes the Iliauni colours while "Iliauni only" is chosen
  useBrand(form.audience === "iliauni");

  if (existing.loading || venues.loading || categories.loading) return <Loading label="Loading form…" />;
  const loadError = existing.error || venues.error || categories.error;
  if (loadError) return <ErrorState error={loadError} />;
  if (editing && existing.data.is_past) {
    return <ErrorState error={{ status: 403, message: "This event has already taken place, so it can't be edited." }} />;
  }
  if (editing && !existing.data.can_manage) {
    return <ErrorState error={{ status: 403, message: "You can only edit events that you organize." }} />;
  }

  const venue = venues.data.find((v) => String(v.id) === form.venue_id);
  // Iliauni meetings take place in A–D Block only; the server sends those blocks
  // to Ilia Uni accounts only, so other organizers never see them
  const internal = form.audience === "iliauni";
  const cityVenues = venues.data.filter((v) => !v.iliauni);
  const blockVenues = venues.data.filter((v) => v.iliauni);
  const venueOption = (v) => (
    <option key={v.id} value={v.id}>
      {v.name} (up to {v.capacity})
    </option>
  );

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  // for the Yes/No and 16+… choices, which can also be unselected
  const choose = (name) => (value) => {
    const next = { ...form, [name]: value };
    // switching to "Iliauni only" clears a venue that isn't one of the blocks
    if (name === "audience" && value === "iliauni" && venue && !venue.iliauni) next.venue_id = "";
    setForm(next);
    setErrors({ ...errors, [name]: undefined, dress_code: name === "dress" ? undefined : errors.dress_code });
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const { dress, dress_other, ...rest } = form;
    const body = {
      ...rest,
      capacity: form.capacity === "" ? "" : Number(form.capacity),
      price: form.price === "" ? "" : Number(form.price),
      venue_id: Number(form.venue_id),
      category_id: Number(form.category_id),
      dress_code: dress === "Formal" ? "Formal" : dress === "other" ? dress_other : null,
    };
    try {
      const saved = editing
        ? await api(`/events/${id}`, { method: "PUT", body })
        : await api("/events", { method: "POST", body });
      navigate(`/events/${saved.id}`, { state: eventFrom ? { from: eventFrom } : null });
    } catch (err) {
      setErrors(err.errors);
      setMessage(Object.keys(err.errors).length ? "Please fix the highlighted fields." : err.message);
      setBusy(false);
    }
  };

  return (
    <>
      <Link to={back.to} from={backLinkFrom} className="back">
        ← {back.label}
      </Link>
      <div className="page-head">
        <div>
          <p className="eyebrow">{editing ? "Edit event" : "New event"}</p>
          <h1>{editing ? existing.data.title : "Plan an Event"}</h1>
        </div>
      </div>

      <form className="form form--narrow panel" onSubmit={submit} noValidate>
        {message && (
          <p className="alert" role="alert">
            {message}
          </p>
        )}
        {/* only Ilia Uni organizers can make an event visible to @iliauni.edu.ge accounts only */}
        {user?.is_iliauni && (
          <ChoiceGroup
            label="Who can see this event"
            name="audience"
            options={AUDIENCE_OPTIONS}
            value={form.audience}
            onChange={choose("audience")}
            error={errors.audience}
            hint={
              form.audience === "iliauni"
                ? "Only people with an @iliauni.edu.ge email can see it and get a ticket"
                : "Listed on the public events page"
            }
            required
          />
        )}
        <Field
          label="Title"
          name="title"
          placeholder="Late Jazz at the Courtyard"
          value={form.title}
          onChange={update}
          error={errors.title}
        />
        <Field
          as="textarea"
          label="Description"
          name="description"
          placeholder="What should people know before they get a ticket?"
          value={form.description}
          onChange={update}
          error={errors.description}
        />
        <div className="form-row">
          <Field as="select" label="Category" name="category_id" value={form.category_id} onChange={update} error={errors.category_id}>
            <option value="">Choose…</option>
            {categories.data.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Field>
          <DateTimeField
            label="Date and time"
            name="starts_at"
            value={form.starts_at}
            onChange={update}
            error={errors.starts_at}
          />
        </div>
        <div className="form-row">
          <Field
            as="select"
            label="Venue"
            name="venue_id"
            value={form.venue_id}
            onChange={update}
            error={errors.venue_id}
            hint={
              internal
                ? blockVenues.length
                  ? "Iliauni meetings take place in A, B, C or D Block"
                  : "No Ilia State University venues yet. Ask an admin to add one under Venues"
                : undefined
            }
          >
            <option value="">Choose…</option>
            {internal ? (
              blockVenues.map(venueOption)
            ) : blockVenues.length ? (
              <>
                <optgroup label="Tbilisi venues">{cityVenues.map(venueOption)}</optgroup>
                <optgroup label="Ilia State University">{blockVenues.map(venueOption)}</optgroup>
              </>
            ) : (
              cityVenues.map(venueOption)
            )}
          </Field>
          <Field
            label="Tickets"
            name="capacity"
            type="number"
            min="50"
            max={venue?.capacity}
            placeholder={venue ? `50 to ${venue.capacity}` : "At least 50"}
            hint={editing && existing.data.booked ? `${existing.data.booked} already sold` : undefined}
            value={form.capacity}
            onChange={update}
            error={errors.capacity}
          />
        </div>
        <div className="form-row">
          <Field
            label="Ticket price (₾)"
            name="price"
            type="number"
            min="0"
            step="0.5"
            placeholder="0 for a free event"
            hint="In Georgian lari, 0 means free"
            value={form.price}
            onChange={update}
            error={errors.price}
          />
        </div>

        <div className="rules">
          <p className="rules__title">Entry rules</p>
          <p className="field__hint">Optional, click a selected option again to clear it</p>
          <ChoiceGroup
            label="Face control"
            name="face_control"
            options={FACE_OPTIONS}
            value={form.face_control}
            onChange={choose("face_control")}
            error={errors.face_control}
          />
          <ChoiceGroup
            label="Age limit"
            name="age_limit"
            options={AGE_OPTIONS}
            value={form.age_limit}
            onChange={choose("age_limit")}
            error={errors.age_limit}
          />
          <ChoiceGroup
            label="Dress code"
            name="dress"
            options={DRESS_OPTIONS}
            value={form.dress}
            onChange={choose("dress")}
            error={form.dress === "other" ? undefined : errors.dress_code}
          />
          {form.dress === "other" && (
            <Field
              label="Describe the dress code"
              name="dress_other"
              placeholder="Black, no sportswear"
              value={form.dress_other}
              onChange={(e) => {
                setForm({ ...form, dress_other: e.target.value });
                setErrors({ ...errors, dress_code: undefined });
              }}
              error={errors.dress_code}
            />
          )}
        </div>

        <div className="form__actions">
          <button className="btn btn--primary" disabled={busy}>
            {busy ? "Saving…" : editing ? "Save changes" : "Publish event"}
          </button>
          <Link to={back.to} from={backLinkFrom} className="btn btn--ghost">
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
