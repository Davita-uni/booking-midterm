import { useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { Link } from "../router.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";
import { usePriceText } from "./Price.jsx";

// The ticket action at the bottom of the event's side panel. Attendees and
// organizers can get tickets (also while waiting for approval); organizers not at
// their own events.
export default function BookingBox({ event, onChange }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const priceText = usePriceText();
  // up to 10 tickets per purchase, never more than are left
  const maxQuantity = Math.max(1, Math.min(10, event.seats_left));

  const book = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await api(`/events/${event.id}/registrations`, { method: "POST", body: { quantity } });
      setMessage({ type: "success", text: `You have ${quantity === 1 ? "a ticket" : `${quantity} tickets`}. See you there!` });
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
    setMessage({ type: "info", text: "Your tickets were cancelled." });
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
        <p className="booked-badge">
          ✓ You have {event.my_tickets === 1 ? "a ticket" : `${event.my_tickets} tickets`}
        </p>
        <button className="btn btn--danger btn--block" onClick={() => setConfirmCancel(true)}>
          {event.my_tickets === 1 ? "Cancel ticket" : "Cancel tickets"}
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
      <div className="buy">
        <div className="qty" role="group" aria-label="Number of tickets">
          <button
            type="button"
            className="qty__btn"
            aria-label="One ticket less"
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <span className="qty__value mono" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            className="qty__btn"
            aria-label="One ticket more"
            disabled={quantity >= maxQuantity}
            onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
          >
            +
          </button>
        </div>
        <button className="btn btn--primary buy__btn" onClick={book} disabled={busy}>
          {busy
            ? "Getting tickets…"
            : event.price > 0
              ? `Buy Ticket · ${priceText(event.price, quantity)}`
              : quantity === 1
                ? "Get Free Ticket"
                : "Get Free Tickets"}
        </button>
      </div>
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
        title={event.my_tickets === 1 ? "Cancel your ticket?" : "Cancel your tickets?"}
        confirmLabel={event.my_tickets === 1 ? "Cancel ticket" : "Cancel tickets"}
        onConfirm={cancel}
        onClose={() => setConfirmCancel(false)}
      >
        <p>
          {event.my_tickets === 1 ? "Your ticket" : `Your ${event.my_tickets} tickets`} for <strong>{event.title}</strong> will go back on sale.
        </p>
      </ConfirmDialog>
    </div>
  );
}
