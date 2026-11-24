import { useState } from "react";
import { api } from "../api.js";
import { useApi } from "../hooks.js";
import Field from "../components/Field.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { Loading, ErrorState, Empty } from "../components/States.jsx";

const EMPTY = { name: "", address: "", city: "Tbilisi", capacity: "" };

export default function AdminVenues() {
  const venues = useApi("/venues");
  const [editing, setEditing] = useState(null); // null = adding a new venue
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const startEdit = (venue) => {
    setEditing(venue);
    setForm({ name: venue.name, address: venue.address, city: venue.city, capacity: String(venue.capacity) });
    setErrors({});
    setMessage(null);
  };

  const reset = () => {
    setEditing(null);
    setForm(EMPTY);
    setErrors({});
  };

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const body = { ...form, capacity: form.capacity === "" ? "" : Number(form.capacity) };
      const saved = editing
        ? await api(`/venues/${editing.id}`, { method: "PUT", body })
        : await api("/venues", { method: "POST", body });
      setMessage({ type: "success", text: `${saved.name} ${editing ? "updated" : "added"}.` });
      reset();
      venues.reload();
    } catch (err) {
      setErrors(err.errors);
      if (!Object.keys(err.errors).length) setMessage({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    await api(`/venues/${toDelete.id}`, { method: "DELETE" });
    if (editing?.id === toDelete.id) reset();
    setMessage({ type: "success", text: `${toDelete.name} deleted.` });
    venues.reload();
  };

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Venues</h1>
        </div>
      </div>

      <div className="manage">
        <section>
          {venues.loading && !venues.data ? (
            <Loading label="Loading venues…" />
          ) : venues.error ? (
            <ErrorState error={venues.error} onRetry={venues.reload} />
          ) : venues.data.length === 0 ? (
            <Empty title="No venues yet">Add the first venue with the form.</Empty>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Venue</th>
                  <th className="num">Seats</th>
                  <th className="num">Events</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {venues.data.map((venue) => (
                  <tr key={venue.id} className={editing?.id === venue.id ? "is-editing" : undefined}>
                    <td>
                      <strong>{venue.name}</strong>
                      <span className="table__sub">
                        {venue.address}, {venue.city}
                      </span>
                    </td>
                    <td className="num mono" data-label="Seats">{venue.capacity}</td>
                    <td className="num mono" data-label="Events">{venue.events_count}</td>
                    <td className="table__actions">
                      <button className="btn btn--small" onClick={() => startEdit(venue)}>
                        Edit
                      </button>
                      <button className="btn btn--small btn--danger" onClick={() => setToDelete(venue)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="panel manage__form">
          <h2>{editing ? "Edit venue" : "Add a venue"}</h2>
          <form className="form" onSubmit={submit} noValidate>
            {message && (
              <p className={`alert${message.type === "success" ? " alert--success" : ""}`} role="status">
                {message.text}
              </p>
            )}
            <Field label="Name" name="name" placeholder="Fabrika Courtyard" value={form.name} onChange={update} error={errors.name} />
            <Field label="Address" name="address" placeholder="8 Egnate Ninoshvili St" value={form.address} onChange={update} error={errors.address} />
            <div className="form-row">
              <Field label="City" name="city" value={form.city} onChange={update} error={errors.city} />
              <Field label="Seats" name="capacity" type="number" min="1" placeholder="120" value={form.capacity} onChange={update} error={errors.capacity} />
            </div>
            <div className="form__actions">
              <button className="btn btn--primary" disabled={busy}>
                {busy ? "Saving…" : editing ? "Save changes" : "Add venue"}
              </button>
              {editing && (
                <button type="button" className="btn btn--ghost" onClick={reset}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this venue?"
        confirmLabel="Delete venue"
        onConfirm={remove}
        onClose={() => setToDelete(null)}
      >
        <p>
          <strong>{toDelete?.name}</strong> will be removed. Venues that still have events can't be deleted.
        </p>
      </ConfirmDialog>
    </>
  );
}
