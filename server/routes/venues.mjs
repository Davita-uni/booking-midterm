import express from "express";
import { db } from "../db/index.mjs";
import { requireAuth, requireRole } from "../middlewares/auth.mjs";
import { badRequest, conflict, notFound, parseId } from "../utils/http.mjs";
import * as v from "../utils/validate.mjs";

const router = express.Router();

const SELECT = `
  SELECT v.id, v.name, v.address, v.city, v.capacity,
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
  };
  return { venue, errors };
}

function assertUniqueName(name, exceptId = 0) {
  const clash = db.prepare("SELECT id FROM venues WHERE name = ? AND id != ?").get(name, exceptId);
  if (clash) throw conflict("A venue with this name already exists", { name: "A venue with this name already exists" });
}

// Anyone can read venues (the event form needs them).
router.get("/", (req, res) => {
  res.json(db.prepare(`${SELECT} GROUP BY v.id ORDER BY v.name`).all());
});

router.get("/:id", (req, res) => {
  const venue = findVenue(parseId(req.params.id));
  if (!venue) throw notFound("Venue not found");
  res.json(venue);
});

// Only admins can change venues.
router.post("/", requireAuth, requireRole("admin"), (req, res) => {
  const { venue, errors } = readVenue(req.body);
  if (v.hasErrors(errors)) throw badRequest(errors);
  assertUniqueName(venue.name);

  const { lastInsertRowid } = db
    .prepare("INSERT INTO venues (name, address, city, capacity) VALUES (?, ?, ?, ?)")
    .run(venue.name, venue.address, venue.city, venue.capacity);
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
  if (v.hasErrors(errors)) throw badRequest(errors);
  assertUniqueName(venue.name, id);

  db.prepare("UPDATE venues SET name = ?, address = ?, city = ?, capacity = ? WHERE id = ?").run(
    venue.name, venue.address, venue.city, venue.capacity, id
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
