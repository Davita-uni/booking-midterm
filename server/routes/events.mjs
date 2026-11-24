import express from "express";
import { db } from "../db/index.mjs";
import { requireAuth, requireRole, optionalAuth } from "../middlewares/auth.mjs";
import { badRequest, conflict, forbidden, notFound, parseId } from "../utils/http.mjs";
import { nowLocal, isValidLocal } from "../utils/time.mjs";
import * as v from "../utils/validate.mjs";
import { notify, bookersOf } from "../utils/notify.mjs";

const router = express.Router();

// One query shape for every event response: the event plus its venue,
// category, organizer and how many seats are booked.
const SELECT = `
  SELECT e.id, e.title, e.description, e.starts_at, e.capacity, e.created_at,
         e.venue_id, ve.name AS venue_name, ve.address AS venue_address, ve.city AS venue_city,
         e.category_id, c.name AS category_name,
         e.organizer_id, u.name AS organizer_name,
         (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) AS booked
  FROM events e
  JOIN venues ve ON ve.id = e.venue_id
  JOIN categories c ON c.id = e.category_id
  JOIN users u ON u.id = e.organizer_id
`;

const withSeats = (event) => event && { ...event, seats_left: Math.max(event.capacity - event.booked, 0) };

const findEvent = (id) => withSeats(db.prepare(`${SELECT} WHERE e.id = ?`).get(id));

// Organizers may change only their own events; admins may change any event.
function assertCanManage(user, event) {
  if (user.role === "admin") return;
  if (user.role === "organizer" && event.organizer_id === user.id) return;
  throw forbidden("You can only change events that you organize");
}

function readEvent(body = {}, { existing } = {}) {
  const errors = {};
  const event = {
    title: v.text(errors, body, "title", "Title", { min: 3, max: 120 }),
    description: v.text(errors, body, "description", "Description", { max: 2000, required: false }),
    starts_at: body.starts_at,
    capacity: v.integer(errors, body, "capacity", "Seats", { min: 1, max: 50000 }),
    venue_id: Number(body.venue_id),
    category_id: Number(body.category_id),
  };

  if (!event.starts_at) errors.starts_at = "Date and time are required";
  else if (/^\d{4}-\d{2}-\d{2}T$/.test(event.starts_at)) errors.starts_at = "Choose a time";
  else if (!isValidLocal(event.starts_at)) errors.starts_at = "Enter a valid date and time";
  else if (Number(event.starts_at.slice(14, 16)) % 15 !== 0)
    errors.starts_at = "Choose a time in 15-minute steps (:00, :15, :30 or :45)";
  else if (event.starts_at <= nowLocal() && event.starts_at !== existing?.starts_at)
    errors.starts_at = "The event must start in the future";

  const venue = db.prepare("SELECT id, capacity FROM venues WHERE id = ?").get(event.venue_id || 0);
  if (!venue) errors.venue_id = "Choose a venue";
  else if (!errors.capacity && event.capacity > venue.capacity)
    errors.capacity = `This venue has ${venue.capacity} seats at most`;

  if (!db.prepare("SELECT 1 FROM categories WHERE id = ?").get(event.category_id || 0))
    errors.category_id = "Choose a category";

  if (existing && !errors.capacity && event.capacity < existing.booked)
    errors.capacity = `${existing.booked} seats are already booked`;

  return { event, errors };
}

// Public list of events. ?when=past lists events that already started
// (newest first); anything else lists upcoming ones (soonest first).
// Filters: ?q=text&category=id
router.get("/", optionalAuth, (req, res) => {
  const past = req.query.when === "past";
  const where = [past ? "e.starts_at < ?" : "e.starts_at >= ?"];
  const params = [nowLocal()];

  const q = String(req.query.q ?? "").trim();
  if (q) {
    where.push("(e.title LIKE ? OR ve.name LIKE ?)");
    params.push(`%${q}%`, `%${q}%`);
  }
  const category = Number(req.query.category);
  if (Number.isInteger(category) && category > 0) {
    where.push("e.category_id = ?");
    params.push(category);
  }

  const order = past ? "e.starts_at DESC" : "e.starts_at";
  const rows = db.prepare(`${SELECT} WHERE ${where.join(" AND ")} ORDER BY ${order}`).all(...params);

  // For a logged-in user: which of these events they booked or organize
  const booked = new Set(
    req.user
      ? db.prepare("SELECT event_id FROM registrations WHERE user_id = ?").all(req.user.id).map((r) => r.event_id)
      : []
  );
  res.json(
    rows.map((e) => ({
      ...withSeats(e),
      is_past: past,
      is_registered: booked.has(e.id),
      is_organizer: Boolean(req.user && e.organizer_id === req.user.id),
    }))
  );
});

// Past events are read-only for everyone, admins included.
function assertNotPast(event) {
  if (event.starts_at <= nowLocal()) throw conflict("This event has already taken place and can't be changed");
}

// The logged-in organizer's own events, past ones included.
router.get("/mine", requireAuth, requireRole("organizer"), (req, res) => {
  const rows = db.prepare(`${SELECT} WHERE e.organizer_id = ? ORDER BY e.starts_at`).all(req.user.id);
  res.json(rows.map(withSeats));
});

router.get("/:id", optionalAuth, (req, res) => {
  const event = findEvent(parseId(req.params.id));
  if (!event) throw notFound("Event not found");

  const user = req.user;
  event.can_manage = Boolean(
    user && (user.role === "admin" || (user.role === "organizer" && user.id === event.organizer_id))
  );
  event.is_registered = Boolean(
    user && db.prepare("SELECT 1 FROM registrations WHERE event_id = ? AND user_id = ?").get(event.id, user.id)
  );
  event.is_organizer = Boolean(user && user.id === event.organizer_id);
  event.is_past = event.starts_at <= nowLocal();
  // past events are read-only: the organizer still sees who came, but can't edit
  event.can_edit = event.can_manage && !event.is_past;
  res.json(event);
});

router.post("/", requireAuth, requireRole("organizer"), (req, res) => {
  const { event, errors } = readEvent(req.body);
  if (v.hasErrors(errors)) throw badRequest(errors);

  const { lastInsertRowid } = db
    .prepare(`
      INSERT INTO events (title, description, starts_at, capacity, venue_id, category_id, organizer_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(event.title, event.description, event.starts_at, event.capacity, event.venue_id, event.category_id, req.user.id);

  res.status(201).json(findEvent(lastInsertRowid));
});

router.put("/:id", requireAuth, requireRole("organizer", "admin"), (req, res) => {
  const id = parseId(req.params.id);
  const existing = findEvent(id);
  if (!existing) throw notFound("Event not found");
  assertCanManage(req.user, existing);
  assertNotPast(existing);

  const { event, errors } = readEvent(req.body, { existing });
  if (v.hasErrors(errors)) throw badRequest(errors);

  db.prepare(`
    UPDATE events
    SET title = ?, description = ?, starts_at = ?, capacity = ?, venue_id = ?, category_id = ?
    WHERE id = ?
  `).run(event.title, event.description, event.starts_at, event.capacity, event.venue_id, event.category_id, id);

  // tell everyone with a seat what changed
  const changes = [];
  if (event.starts_at !== existing.starts_at) changes.push("new date or time");
  if (event.venue_id !== existing.venue_id) changes.push("new venue");
  if (event.title !== existing.title) changes.push("new title");
  if (event.description !== existing.description) changes.push("updated description");
  if (event.category_id !== existing.category_id) changes.push("new category");
  if (changes.length) {
    notify(bookersOf(id, req.user.id), `“${event.title}”, which you booked, was updated: ${changes.join(", ")}.`, `/events/${id}`);
  }

  res.json(findEvent(id));
});

router.delete("/:id", requireAuth, requireRole("organizer", "admin"), (req, res) => {
  const id = parseId(req.params.id);
  const event = findEvent(id);
  if (!event) throw notFound("Event not found");
  assertCanManage(req.user, event);
  assertNotPast(event);

  // tell people with a seat before their bookings disappear with it
  notify(bookersOf(id, req.user.id), `“${event.title}”, which you booked, was cancelled by the organizer.`, "/");

  // registrations are removed with it (ON DELETE CASCADE)
  db.prepare("DELETE FROM events WHERE id = ?").run(id);
  res.status(204).end();
});

export default router;
