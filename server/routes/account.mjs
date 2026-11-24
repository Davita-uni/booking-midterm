import express from "express";
import bcrypt from "bcryptjs";
import { db } from "../db/index.mjs";
import { requireSession } from "../middlewares/auth.mjs";
import { badRequest } from "../utils/http.mjs";
import * as v from "../utils/validate.mjs";
import { nowLocal } from "../utils/time.mjs";

// The logged-in user's own account. Organizers waiting for approval may use
// these too (requireSession), so they can fix a typo in their details.
const router = express.Router();
router.use(requireSession);

function accountOf(id) {
  const user = db
    .prepare("SELECT id, name, email, role, status, organization, created_at FROM users WHERE id = ?")
    .get(id);
  // Events this user organizes (organizers only)
  const organized =
    user.role === "organizer"
      ? db
          .prepare(`
            SELECT e.id, e.title, e.starts_at, e.capacity, ve.name AS venue_name,
                   (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) AS booked
            FROM events e JOIN venues ve ON ve.id = e.venue_id
            WHERE e.organizer_id = ?
            ORDER BY e.starts_at
          `)
          .all(id)
      : [];
  // Events this user booked a seat at. Organizing an event never adds it here.
  const attended = db
    .prepare(`
      SELECT e.id, e.title, e.starts_at, ve.name AS venue_name, r.created_at AS booked_at
      FROM registrations r
      JOIN events e ON e.id = r.event_id
      JOIN venues ve ON ve.id = e.venue_id
      WHERE r.user_id = ?
      ORDER BY e.starts_at
    `)
    .all(id);
  const now = nowLocal();
  const mark = (list) => list.map((e) => ({ ...e, past: e.starts_at < now }));
  return { ...user, organized: mark(organized), attended: mark(attended) };
}

router.get("/", (req, res) => {
  res.json(accountOf(req.user.id));
});

// Name and (for organizers) organization. The email is the login and is
// read-only; the database also refuses to change it (users_email_readonly trigger).
router.put("/profile", (req, res) => {
  const body = req.body ?? {};
  const errors = {};
  const name = v.text(errors, body, "name", "Name", { min: 2, max: 60 });
  if (body.email !== undefined && String(body.email).trim().toLowerCase() !== req.user.email.toLowerCase()) {
    errors.email = "Email can't be changed";
  }
  const organization =
    req.user.role === "organizer"
      ? v.text(errors, body, "organization", "Organization or project name", { min: 2, max: 80 })
      : null;
  if (v.hasErrors(errors)) throw badRequest(errors);

  db.prepare("UPDATE users SET name = ?, organization = ? WHERE id = ?").run(name, organization, req.user.id);
  res.json(accountOf(req.user.id));
});

// Changing the password ends every session (token_version + 1), so the user
// logs in again with the new password.
router.put("/password", async (req, res) => {
  const body = req.body ?? {};
  const errors = {};
  if (!body.current_password) errors.current_password = "Enter your current password";
  const next = v.password(errors, body, "new_password");
  if (!errors.new_password && body.new_password === body.current_password) {
    errors.new_password = "The new password must be different";
  }
  if (v.hasErrors(errors)) throw badRequest(errors);

  const { password_hash } = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(req.user.id);
  if (!(await bcrypt.compare(String(body.current_password), password_hash))) {
    throw badRequest({ current_password: "Current password is incorrect" });
  }

  db.prepare("UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?").run(
    await bcrypt.hash(next, 10), req.user.id
  );
  res.status(204).end();
});

export default router;
