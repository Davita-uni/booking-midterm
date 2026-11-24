import { useState } from "react";
import { api } from "../api.js";
import { useApi } from "../hooks.js";
import { bookedOn } from "../format.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { Loading, ErrorState, Empty } from "../components/States.jsx";

// Left side: the regular lists. "Waiting for approval" sits on its own on the right.
const FILTERS = [
  ["active", "Active"],
  ["suspended", "Suspended"],
  ["all", "All"], // active + suspended, without pending sign-ups
];

const STATUS_LABEL = { pending: "Pending", active: "Active", suspended: "Suspended" };

// What the confirm dialog says for each action
const ACTIONS = {
  reject: {
    title: "Reject this sign-up?",
    label: "Reject sign-up",
    text: (o) => `${o.name} won't become an organizer. The account stays as a regular attendee account, and they get a notification that the application was denied.`,
  },
  suspend: {
    title: "Suspend this organizer?",
    label: "Suspend organizer",
    text: (o) =>
      `${o.name} will be logged out and can't log in until you reactivate the account. Their ${o.events_count} event(s) stay listed.`,
  },
};

export default function AdminOrganizers() {
  const organizers = useApi("/admin/organizers");
  const [filter, setFilter] = useState("pending");
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState(null);
  const [confirm, setConfirm] = useState(null); // { action, organizer }

  const setStatus = async (organizer, status) => {
    setBusyId(organizer.id);
    setMessage(null);
    try {
      await api(`/admin/organizers/${organizer.id}`, { method: "PATCH", body: { status } });
      const verb = organizer.status === "pending" ? "approved" : status === "active" ? "reactivated" : "suspended";
      setMessage({ type: "success", text: `${organizer.name} ${verb}.` });
      organizers.reload();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setBusyId(null);
    }
  };

  const runConfirmed = async () => {
    const { action, organizer } = confirm;
    if (action === "reject") {
      await api(`/admin/organizers/${organizer.id}/reject`, { method: "POST" });
      setMessage({ type: "success", text: `${organizer.name}'s sign-up rejected. They now have an attendee account.` });
    } else {
      await api(`/admin/organizers/${organizer.id}`, { method: "PATCH", body: { status: "suspended" } });
      setMessage({ type: "success", text: `${organizer.name} suspended.` });
    }
    organizers.reload();
  };

  const all = organizers.data ?? [];
  const count = (status) => all.filter((o) => o.status === status).length;
  // "All" means every approved organizer (active + suspended); sign-ups waiting
  // for approval only appear in their own tab
  const reviewed = all.filter((o) => o.status !== "pending");
  const list = filter === "all" ? reviewed : all.filter((o) => o.status === filter);

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Organizers</h1>
        </div>
      </div>

      <div className="tabs" role="tablist" aria-label="Filter organizers">
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={filter === key}
            className={`tab${filter === key ? " is-active" : ""}`}
            onClick={() => setFilter(key)}
          >
            {label}
            <span className="tab__count mono">{key === "all" ? reviewed.length : count(key)}</span>
          </button>
        ))}
        <button
          role="tab"
          aria-selected={filter === "pending"}
          className={`tab tab--pending${filter === "pending" ? " is-active" : ""}`}
          onClick={() => setFilter("pending")}
        >
          Waiting for approval
          {/* red while someone is waiting: it needs action */}
          <span
            className={`tab__count mono${count("pending") > 0 ? " tab__count--urgent" : ""}`}
            aria-label={`${count("pending")} waiting`}
          >
            {count("pending")}
          </span>
        </button>
      </div>

      {message && (
        <p className={`alert${message.type === "success" ? " alert--success" : ""} spaced`} role="status">
          {message.text}
        </p>
      )}

      {organizers.loading && !organizers.data ? (
        <Loading label="Loading organizers…" />
      ) : organizers.error ? (
        <ErrorState error={organizers.error} onRetry={organizers.reload} />
      ) : list.length === 0 ? (
        <Empty title={filter === "pending" ? "No one is waiting" : "Nobody here"}>
          {filter === "pending" ? "New organizer sign-ups will appear here for approval." : "No organizers with this status."}
        </Empty>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Organizer</th>
              <th>Organization</th>
              <th>Signed up</th>
              <th className="num">Events</th>
              <th>Status</th>
              <th>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id}>
                <td>
                  <strong>{o.name}</strong>
                  <span className="table__sub break">{o.email}</span>
                </td>
                <td>{o.organization || <span className="muted">—</span>}</td>
                <td className="mono muted">{bookedOn(o.created_at)}</td>
                <td className="num mono" data-label="Events">
                  {o.events_count}
                </td>
                <td>
                  <span className={`status status--${o.status}`}>{STATUS_LABEL[o.status]}</span>
                </td>
                <td className="table__actions">
                  {o.status === "pending" && (
                    <>
                      <button className="btn btn--small btn--success" disabled={busyId === o.id} onClick={() => setStatus(o, "active")}>
                        Approve
                      </button>
                      <button className="btn btn--small btn--danger" onClick={() => setConfirm({ action: "reject", organizer: o })}>
                        Reject
                      </button>
                    </>
                  )}
                  {o.status === "active" && (
                    <button className="btn btn--small btn--danger" onClick={() => setConfirm({ action: "suspend", organizer: o })}>
                      Suspend
                    </button>
                  )}
                  {o.status === "suspended" && (
                    <button className="btn btn--small" disabled={busyId === o.id} onClick={() => setStatus(o, "active")}>
                      Reactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm ? ACTIONS[confirm.action].title : ""}
        confirmLabel={confirm ? ACTIONS[confirm.action].label : ""}
        onConfirm={runConfirmed}
        onClose={() => setConfirm(null)}
      >
        <p>{confirm && ACTIONS[confirm.action].text(confirm.organizer)}</p>
      </ConfirmDialog>
    </>
  );
}
