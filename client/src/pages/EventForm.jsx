import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useApi } from "../hooks.js";
import { Link, navigate } from "../router.jsx";
import Field from "../components/Field.jsx";
import { Loading, ErrorState } from "../components/States.jsx";

const EMPTY = { title: "", description: "", starts_at: "", capacity: "", venue_id: "", category_id: "" };

// Used for both /events/new and /events/:id/edit
export default function EventForm({ id }) {
  const editing = Boolean(id);
  const existing = useApi(editing ? `/events/${id}` : null);
  const venues = useApi("/venues");
  const categories = useApi("/categories");

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

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
    });
  }, [existing.data]);

  if (existing.loading || venues.loading || categories.loading) return <Loading label="Loading form…" />;
  const loadError = existing.error || venues.error || categories.error;
  if (loadError) return <ErrorState error={loadError} />;
  if (editing && !existing.data.can_manage) {
    return <ErrorState error={{ status: 403, message: "You can only edit events that you organize." }} />;
  }

  const venue = venues.data.find((v) => String(v.id) === form.venue_id);

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const body = {
      ...form,
      capacity: form.capacity === "" ? "" : Number(form.capacity),
      venue_id: Number(form.venue_id),
      category_id: Number(form.category_id),
    };
    try {
      const saved = editing
        ? await api(`/events/${id}`, { method: "PUT", body })
        : await api("/events", { method: "POST", body });
      navigate(`/events/${saved.id}`);
    } catch (err) {
      setErrors(err.errors);
      setMessage(Object.keys(err.errors).length ? "Please fix the highlighted fields." : err.message);
      setBusy(false);
    }
  };

  return (
    <>
      <Link to={editing ? `/events/${id}` : "/"} className="back">
        ← {editing ? "Back to event" : "All events"}
      </Link>
      <div className="page-head">
        <div>
          <p className="eyebrow">{editing ? "Edit event" : "New event"}</p>
          <h1>{editing ? existing.data.title : "Plan an event"}</h1>
        </div>
      </div>

      <form className="form form--narrow panel" onSubmit={submit} noValidate>
        {message && (
          <p className="alert" role="alert">
            {message}
          </p>
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
          placeholder="What should people know before they book?"
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
          <Field
            label="Date and time"
            name="starts_at"
            type="datetime-local"
            value={form.starts_at}
            onChange={update}
            error={errors.starts_at}
          />
        </div>
        <div className="form-row">
          <Field as="select" label="Venue" name="venue_id" value={form.venue_id} onChange={update} error={errors.venue_id}>
            <option value="">Choose…</option>
            {venues.data.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.capacity} seats)
              </option>
            ))}
          </Field>
          <Field
            label="Seats"
            name="capacity"
            type="number"
            min="1"
            max={venue?.capacity}
            placeholder={venue ? `Up to ${venue.capacity}` : "e.g. 40"}
            hint={editing && existing.data.booked ? `${existing.data.booked} already booked` : undefined}
            value={form.capacity}
            onChange={update}
            error={errors.capacity}
          />
        </div>
        <div className="form__actions">
          <button className="btn btn--primary" disabled={busy}>
            {busy ? "Saving…" : editing ? "Save changes" : "Publish event"}
          </button>
          <Link to={editing ? `/events/${id}` : "/"} className="btn btn--ghost">
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
