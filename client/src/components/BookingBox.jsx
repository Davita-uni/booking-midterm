import { useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { Link } from "../router.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";
import { gel } from "../format.js";

// The ticket action at the bottom of the event's side panel. Attendees and
// organizers can get tickets (also while waiting for approval); organizers not at
// their own events.
export default function BookingBox({ event, onChange }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const book = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await api(`/events/${event.id}/registrations`, { method: "POST" });
      setMessage({ type: "success", text: "You have a ticket. See you there!" });
      onChange();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
      onChange();
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    await api(`/events/${event.id}/registrations/me`, { method: "DELETE" });
    setMessage({ type: "info", text: "Your ticket was cancelled." });
    onChange();
  };

  let action;
  if (event.is_past) {
    action = <p className="muted">This event has already taken place.</p>;
  } else if (!user) {
    action = (
      <Link to="/login" className="btn btn--primary btn--block">
        Log in to get a ticket
      </Link>
    );
  } else if (user.role === "admin") {
    action = <p className="muted">Admin accounts can't get tickets.</p>;
  } else if (event.organizer_id === user.id) {
    action = <p className="muted">You organize this event, so you can't get a ticket for it.</p>;
  } else if (event.is_registered) {
    action = (
      <>
        <p className="booked-badge">✓ You have a ticket</p>
        <button className="btn btn--danger btn--block" onClick={() => setConfirmCancel(true)}>
          Cancel ticket
        </button>
      </>
    );
  } else if (event.seats_left === 0) {
    action = (
      <button className="btn btn--block" disabled>
        Sold out
      </button>
    );
  } else {
    action = (
      <button className="btn btn--primary btn--block" onClick={book} disabled={busy}>
        {busy ? "Getting ticket…" : event.price > 0 ? `Buy ticket · ${gel(event.price)}` : "Get free ticket"}
      </button>
    );
  }

  return (
    <div className="booking">
      {message && (
        <p
          className={`alert${message.type === "success" ? " alert--success" : message.type === "info" ? " alert--info" : ""}`}
          role="status"
        >
          {message.text}
        </p>
      )}
      {action}
      <ConfirmDialog
        open={confirmCancel}
        title="Cancel your ticket?"
        confirmLabel="Cancel ticket"
        onConfirm={cancel}
        onClose={() => setConfirmCancel(false)}
      >
        <p>
          Your ticket for <strong>{event.title}</strong> will go back on sale.
        </p>
      </ConfirmDialog>
    </div>
  );
}
