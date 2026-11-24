import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useApi } from "../hooks.js";
import { bookedOn, REQUEST_STATUS } from "../format.js";
import RequestStatus from "../components/RequestStatus.jsx";
import { Loading, ErrorState, Empty } from "../components/States.jsx";

const FILTERS = ["new", "in_progress", "completed", "all"];

// Admin: requests from all organizers. Reply and change the status.
export default function AdminRequests() {
  const requests = useApi("/requests");
  const [filter, setFilter] = useState("new");
  // shown above the list: a saved request may move to another tab
  const [notice, setNotice] = useState("");

  const all = requests.data ?? [];
  const count = (s) => (s === "all" ? all.length : all.filter((r) => r.status === s).length);
  const list = filter === "all" ? all : all.filter((r) => r.status === filter);

  // replace one request in the list after saving, without reloading everything
  const replace = (saved) => {
    requests.setData(all.map((r) => (r.id === saved.id ? saved : r)));
    setNotice(`Saved “${saved.subject}” as ${REQUEST_STATUS[saved.status]}. The organizer can see it now.`);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Requests</h1>
        </div>
      </div>

      <div className="tabs" role="tablist" aria-label="Filter requests">
        {FILTERS.map((key) => (
          <button
            key={key}
            role="tab"
            aria-selected={filter === key}
            className={`tab${filter === key ? " is-active" : ""}`}
            onClick={() => {
              setFilter(key);
              setNotice("");
            }}
          >
            {key === "all" ? "All" : REQUEST_STATUS[key]}
            <span className={`tab__count mono${key === "new" && count("new") > 0 ? " tab__count--urgent" : ""}`}>
              {count(key)}
            </span>
          </button>
        ))}
      </div>

      {notice && (
        <p className="alert alert--success spaced" role="status">
          {notice}
        </p>
      )}

      {requests.loading && !requests.data ? (
        <Loading label="Loading requests…" />
      ) : requests.error ? (
        <ErrorState error={requests.error} onRetry={requests.reload} />
      ) : list.length === 0 ? (
        <Empty title={filter === "new" ? "No new requests" : "Nothing here"}>
          {filter === "new" ? "Requests from organizers will appear here." : "No requests with this status."}
        </Empty>
      ) : (
        <ul className="requests">
          {list.map((r) => (
            <AdminRequest key={r.id} request={r} onSaved={replace} />
          ))}
        </ul>
      )}
    </>
  );
}

function AdminRequest({ request: r, onSaved }) {
  const [reply, setReply] = useState(r.admin_reply ?? "");
  const [status, setStatus] = useState(r.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setReply(r.admin_reply ?? "");
    setStatus(r.status);
  }, [r]);

  const changed = reply.trim() !== (r.admin_reply ?? "") || status !== r.status;

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const saved = await api(`/requests/${r.id}`, { method: "PATCH", body: { status, admin_reply: reply } });
      onSaved(saved);
    } catch (err) {
      setError(err.errors?.admin_reply || err.errors?.status || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="request panel">
      <div className="request__head">
        <h2 className="request__subject">{r.subject}</h2>
        <RequestStatus status={r.status} />
      </div>
      <p className="request__meta">
        <strong>{r.organizer_name}</strong>
        {r.organization && <> · {r.organization}</>} · <span className="break">{r.organizer_email}</span>
        <span className="mono muted"> · {bookedOn(r.created_at)}</span>
      </p>
      <p className="request__body">{r.body}</p>

      <form className="request__answer" onSubmit={save}>
        <div className="field">
          <label htmlFor={`reply-${r.id}`}>Reply</label>
          <textarea
            id={`reply-${r.id}`}
            rows={3}
            placeholder="Write a reply to the organizer"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
        </div>
        <div className="request__controls">
          <div className="field">
            <label htmlFor={`status-${r.id}`}>Status</label>
            <select
              id={`status-${r.id}`}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {Object.entries(REQUEST_STATUS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn--primary" disabled={busy || !changed}>
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
        {error && <p className="field__error">{error}</p>}
      </form>
    </li>
  );
}
