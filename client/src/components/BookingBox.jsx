import { useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { Link } from "../router.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";

// The booking action at the bottom of the event's side panel. Attendees and
// organizers can book (also while waiting for approval); organizers not at
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
      setMessage({ type: "success", text: "You're on the list. See you there!" });
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
    setMessage({ type: "info", text: "Your booking was cancelled." });
    onChange();
  };

  let action;
  if (event.is_past) {
    action = <p className="muted">This event has already taken place.</p>;
  } else if (!user) {
    action = (
      <Link to="/login" className="btn btn--primary btn--block">
        Log in to book a seat
      </Link>
    );
  } else if (user.role === "admin") {
    action = <p className="muted">Admin accounts can't book seats.</p>;
  } else if (event.organizer_id === user.id) {
    action = <p className="muted">You organize this event, so you can't book a seat at it.</p>;
  } else if (event.is_registered) {
    action = (
      <>
        <p className="booked-badge">✓ You have a seat</p>
        <button className="btn btn--danger btn--block" onClick={() => setConfirmCancel(true)}>
          Cancel booking
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
        {busy ? "Booking…" : "Book a seat"}
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
        title="Cancel your booking?"
        confirmLabel="Cancel booking"
        onConfirm={cancel}
        onClose={() => setConfirmCancel(false)}
      >
        <p>
          Your seat at <strong>{event.title}</strong> will go back on sale.
        </p>
      </ConfirmDialog>
    </div>
  );
}
