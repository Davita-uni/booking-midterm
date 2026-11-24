import express from "express";
import { db } from "../db/index.mjs";
import { requireAuth, requireRole, optionalAuth } from "../middlewares/auth.mjs";
import { badRequest, conflict, notFound, parseId } from "../utils/http.mjs";
import * as v from "../utils/validate.mjs";

const router = express.Router();

const SELECT = `
  SELECT v.id, v.name, v.address, v.city, v.capacity, v.iliauni,
         COUNT(e.id) AS events_count,
         COALESCE(MAX(e.capacity), 0) AS largest_event
  FROM venues v
  LEFT JOIN events e ON e.venue_id = v.id
`;

const findVenue = (id) => db.prepare(`${SELECT} WHERE v.id = ? GROUP BY v.id`).get(id);

function readVenue(body = {}) {
  const errors = {};
  const venue = {
    name: v.text(errors, body, "name", "Name", { min: 2, max: 80 }),
    address: v.text(errors, body, "address", "Address", { min: 3, max: 120 }),
    city: v.text(errors, body, "city", "City", { max: 60, required: false }) || "Tbilisi",
    capacity: v.integer(errors, body, "capacity", "Capacity", { min: 50, max: 50000 }),
    iliauni: body.iliauni === true || body.iliauni === 1 ? 1 : 0,
  };
  return { venue, errors };
}

function assertUniqueName(name, exceptId = 0) {
  const clash = db.prepare("SELECT id FROM venues WHERE name = ? AND id != ?").get(name, exceptId);
  if (clash) throw conflict("A venue with this name already exists", { name: "A venue with this name already exists" });
}

// Ilia Uni venues (A–D Block) are listed only for @iliauni.edu.ge accounts and admins.
const seesIliauniVenues = (user) => Boolean(user && (user.is_iliauni || user.role === "admin"));

// Anyone can read venues (the event form needs them).
router.get("/", optionalAuth, (req, res) => {
  const where = seesIliauniVenues(req.user) ? "" : "WHERE v.iliauni = 0";
  res.json(db.prepare(`${SELECT} ${where} GROUP BY v.id ORDER BY v.iliauni, v.name`).all());
});

router.get("/:id", optionalAuth, (req, res) => {
  const venue = findVenue(parseId(req.params.id));
  if (!venue || (venue.iliauni && !seesIliauniVenues(req.user))) throw notFound("Venue not found");
  res.json(venue);
});

// Only admins can change venues.
router.post("/", requireAuth, requireRole("admin"), (req, res) => {
  const { venue, errors } = readVenue(req.body);
  if (v.hasErrors(errors)) throw badRequest(errors);
  assertUniqueName(venue.name);

  const { lastInsertRowid } = db
    .prepare("INSERT INTO venues (name, address, city, capacity, iliauni) VALUES (?, ?, ?, ?, ?)")
    .run(venue.name, venue.address, venue.city, venue.capacity, venue.iliauni);
  res.status(201).json(findVenue(lastInsertRowid));
});

router.put("/:id", requireAuth, requireRole("admin"), (req, res) => {
  const id = parseId(req.params.id);
  const existing = findVenue(id);
  if (!existing) throw notFound("Venue not found");

  const { venue, errors } = readVenue(req.body);
  // events already planned here must still fit
  if (!errors.capacity && venue.capacity < existing.largest_event) {
    errors.capacity = `An event here already has ${existing.largest_event} seats`;
  }
  // a venue with internal meetings must stay an Ilia Uni venue
  if (existing.iliauni && !venue.iliauni) {
    const internal = db.prepare("SELECT COUNT(*) AS n FROM events WHERE venue_id = ? AND audience = 'iliauni'").get(id).n;
    if (internal) errors.iliauni = `${internal} Iliauni meeting(s) take place here, so it must stay an Ilia State University venue`;
  }
  if (v.hasErrors(errors)) throw badRequest(errors);
  assertUniqueName(venue.name, id);

  db.prepare("UPDATE venues SET name = ?, address = ?, city = ?, capacity = ?, iliauni = ? WHERE id = ?").run(
    venue.name, venue.address, venue.city, venue.capacity, venue.iliauni, id
  );
  res.json(findVenue(id));
});

router.delete("/:id", requireAuth, requireRole("admin"), (req, res) => {
  const id = parseId(req.params.id);
  const venue = findVenue(id);
  if (!venue) throw notFound("Venue not found");
  if (venue.events_count > 0) {
    throw conflict(`This venue has ${venue.events_count} event(s). Move or delete them first.`);
  }
  db.prepare("DELETE FROM venues WHERE id = ?").run(id);
  res.status(204).end();
});

export default router;
