import express from "express";
import { db, transaction } from "../db/index.mjs";
import { requireAuth, requireRole, requireSession } from "../middlewares/auth.mjs";
import * as v from "../utils/validate.mjs";
import { badRequest } from "../utils/http.mjs";
import { conflict, forbidden, notFound, parseId } from "../utils/http.mjs";
import { nowLocal } from "../utils/time.mjs";
import { notify } from "../utils/notify.mjs";

const router = express.Router();

const findEvent = (id) =>
  db
    .prepare(`
      SELECT e.id, e.title, e.starts_at, e.capacity, e.organizer_id,
             (SELECT COALESCE(SUM(r.quantity), 0) FROM registrations r WHERE r.event_id = e.id) AS booked
      FROM events e WHERE e.id = ?
    `)
    .get(id);

// Attendees and organizers book seats (organizers only at other organizers'
// events). The check and the insert run in one transaction, so two people
// can't take the last seat at the same time.
// Organizers still waiting for approval may book too: booking only needs
// attendee rights, and attendee accounts never need approval.
const BOOKERS = ["attendee", "organizer"];

router.post("/events/:id/registrations", requireSession, requireRole(...BOOKERS), (req, res) => {
  const eventId = parseId(req.params.id);
  // how many tickets in one purchase (1–10)
  const errors = {};
  const quantity = req.body?.quantity === undefined ? 1 : v.integer(errors, req.body, "quantity", "Number of tickets", { min: 1, max: 10 });
  if (v.hasErrors(errors)) throw badRequest(errors);

  const registration = transaction(() => {
    const event = findEvent(eventId);
    if (!event) throw notFound("Event not found");
    if (event.organizer_id === req.user.id) throw forbidden("You organize this event, so you can't buy a ticket for it");
    if (event.starts_at <= nowLocal()) throw conflict("This event has already started");

    const already = db
      .prepare("SELECT 1 FROM registrations WHERE event_id = ? AND user_id = ?")
      .get(eventId, req.user.id);
    if (already) throw conflict("You already have a ticket for this event");
    if (event.booked >= event.capacity) throw conflict("Sorry, this event is sold out");
    const left = event.capacity - event.booked;
    if (quantity > left) throw conflict(`Only ${left} ticket(s) left`);

    const { lastInsertRowid } = db
      .prepare("INSERT INTO registrations (event_id, user_id, quantity) VALUES (?, ?, ?)")
      .run(eventId, req.user.id, quantity);
    // this purchase took the last tickets
    if (event.booked + quantity === event.capacity) {
      notify([event.organizer_id], `“${event.title}” is sold out: all ${event.capacity} tickets are gone.`, `/events/${event.id}`);
    }
    return db.prepare("SELECT id, event_id, user_id, quantity, created_at FROM registrations WHERE id = ?").get(lastInsertRowid);
  });

  res.status(201).json(registration);
});

// Cancel your own booking.
router.delete("/events/:id/registrations/me", requireSession, requireRole(...BOOKERS), (req, res) => {
  const eventId = parseId(req.params.id);
  const event = findEvent(eventId);
  if (event && event.starts_at <= nowLocal()) throw conflict("This event has already taken place");
  const { changes } = db
    .prepare("DELETE FROM registrations WHERE event_id = ? AND user_id = ?")
    .run(eventId, req.user.id);
  if (changes === 0) throw notFound("You don't have a ticket for this event");
  res.status(204).end();
});

// Attendee list: only the event's organizer or an admin may see it.
router.get("/events/:id/registrations", requireAuth, requireRole("organizer", "admin"), (req, res) => {
  const event = findEvent(parseId(req.params.id));
  if (!event) throw notFound("Event not found");
  if (req.user.role !== "admin" && event.organizer_id !== req.user.id) {
    throw forbidden("Only this event's organizer can see who is coming");
  }

  const attendees = db
    .prepare(`
      SELECT r.id, r.created_at, r.quantity, u.id AS user_id, u.name, u.email
      FROM registrations r
      JOIN users u ON u.id = r.user_id
      WHERE r.event_id = ?
      ORDER BY r.created_at, r.id
    `)
    .all(event.id);
  res.json(attendees);
});

// The logged-in user's own bookings.
router.get("/registrations/mine", requireSession, requireRole(...BOOKERS), (req, res) => {
  const rows = db
    .prepare(`
      SELECT r.id, r.created_at AS booked_at, r.quantity,
             e.id AS event_id, e.title, e.starts_at, ve.name AS venue_name, c.name AS category_name
      FROM registrations r
      JOIN events e ON e.id = r.event_id
      JOIN venues ve ON ve.id = e.venue_id
      JOIN categories c ON c.id = e.category_id
      WHERE r.user_id = ?
      ORDER BY e.starts_at
    `)
    .all(req.user.id);
  res.json(rows.map((r) => ({ ...r, past: r.starts_at < nowLocal() })));
});

export default router;
