import express from "express";
import { db } from "../db/index.mjs";
import { requireAuth, requireRole } from "../middlewares/auth.mjs";
import { badRequest, conflict, notFound, parseId } from "../utils/http.mjs";
import { notify } from "../utils/notify.mjs";

// Admin-only: review and manage organizer accounts.
const router = express.Router();
router.use(requireAuth, requireRole("admin"));

const SELECT = `
  SELECT u.id, u.name, u.email, u.organization, u.status, u.created_at,
         COUNT(e.id) AS events_count
  FROM users u
  LEFT JOIN events e ON e.organizer_id = u.id
  WHERE u.role = 'organizer'
`;

const findOrganizer = (id) => db.prepare(`${SELECT} AND u.id = ? GROUP BY u.id`).get(id);

// pending first, then active, then suspended; newest first inside each group
router.get("/", (req, res) => {
  const rows = db
    .prepare(`
      ${SELECT}
      GROUP BY u.id
      ORDER BY CASE u.status WHEN 'pending' THEN 0 WHEN 'active' THEN 1 ELSE 2 END, u.created_at DESC, u.id DESC
    `)
    .all();
  res.json(rows);
});

// Allowed changes: pending -> active (approve), active -> suspended, suspended -> active
const ALLOWED = {
  pending: ["active"],
  active: ["suspended"],
  suspended: ["active"],
};

router.patch("/:id", (req, res) => {
  const id = parseId(req.params.id);
  const organizer = findOrganizer(id);
  if (!organizer) throw notFound("Organizer not found");

  const status = req.body?.status;
  if (!["active", "suspended"].includes(status)) {
    throw badRequest({ status: "Status must be active or suspended" });
  }
  if (!ALLOWED[organizer.status].includes(status)) {
    throw conflict(`An organizer who is ${organizer.status} can't be set to ${status}`);
  }

  // suspending also ends the organizer's current session (token_version + 1)
  db.prepare(`
    UPDATE users
    SET status = ?, token_version = token_version + CASE WHEN ? = 'suspended' THEN 1 ELSE 0 END
    WHERE id = ?
  `).run(status, status, id);

  if (organizer.status === "pending" && status === "active") {
    notify([id], "You have been accepted as Organizer. Welcome to DoorList!", "/my/events");
  }
  res.json(findOrganizer(id));
});

// Reject a sign-up: only pending accounts (they have no events yet) can be removed.
router.delete("/:id", (req, res) => {
  const id = parseId(req.params.id);
  const organizer = findOrganizer(id);
  if (!organizer) throw notFound("Organizer not found");
  if (organizer.status !== "pending") {
    throw conflict("Only pending sign-ups can be rejected. Suspend an active organizer instead.");
  }
  db.prepare("DELETE FROM users WHERE id = ?").run(id);
  res.status(204).end();
});

export default router;
