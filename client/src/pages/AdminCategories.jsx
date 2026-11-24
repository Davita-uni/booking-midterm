import { useState } from "react";
import { api } from "../api.js";
import { useApi } from "../hooks.js";
import Field from "../components/Field.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { Loading, ErrorState, Empty } from "../components/States.jsx";

export default function AdminCategories() {
  const categories = useApi("/categories");
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const startEdit = (category) => {
    setEditing(category);
    setName(category.name);
    setError("");
    setMessage(null);
  };

  const reset = () => {
    setEditing(null);
    setName("");
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const saved = editing
        ? await api(`/categories/${editing.id}`, { method: "PUT", body: { name } })
        : await api("/categories", { method: "POST", body: { name } });
      setMessage({ type: "success", text: `${saved.name} ${editing ? "updated" : "added"}.` });
      reset();
      categories.reload();
    } catch (err) {
      if (err.errors.name) setError(err.errors.name);
      else setMessage({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    await api(`/categories/${toDelete.id}`, { method: "DELETE" });
    if (editing?.id === toDelete.id) reset();
    setMessage({ type: "success", text: `${toDelete.name} deleted.` });
    categories.reload();
  };

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Categories</h1>
        </div>
      </div>

      <div className="manage">
        <section>
          {categories.loading && !categories.data ? (
            <Loading label="Loading categories…" />
          ) : categories.error ? (
            <ErrorState error={categories.error} onRetry={categories.reload} />
          ) : categories.data.length === 0 ? (
            <Empty title="No categories yet">Add one with the form.</Empty>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th className="num">Events</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.data.map((category) => (
                  <tr key={category.id} className={editing?.id === category.id ? "is-editing" : undefined}>
                    <td>
                      <strong>{category.name}</strong>
                    </td>
                    <td className="num mono" data-label="Events">{category.events_count}</td>
                    <td className="table__actions">
                      <button className="btn btn--small" onClick={() => startEdit(category)}>
                        Rename
                      </button>
                      <button className="btn btn--small btn--danger" onClick={() => setToDelete(category)}>
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
          <h2>{editing ? "Rename category" : "Add a category"}</h2>
          <form className="form" onSubmit={submit} noValidate>
            {message && (
              <p className={`alert${message.type === "success" ? " alert--success" : ""}`} role="status">
                {message.text}
              </p>
            )}
            <Field
              label="Name"
              name="name"
              placeholder="Stand-up comedy"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              error={error}
            />
            <div className="form__actions">
              <button className="btn btn--primary" disabled={busy}>
                {busy ? "Saving…" : editing ? "Save" : "Add category"}
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
        title="Delete this category?"
        confirmLabel="Delete category"
        onConfirm={remove}
        onClose={() => setToDelete(null)}
      >
        <p>
          <strong>{toDelete?.name}</strong> will be removed. Categories that events still use can't be deleted.
        </p>
      </ConfirmDialog>
    </>
  );
}
