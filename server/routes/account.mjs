import express from "express";
import bcrypt from "bcryptjs";
import { db } from "../db/index.mjs";
import { requireSession } from "../middlewares/auth.mjs";
import { badRequest, conflict, unauthorized } from "../utils/http.mjs";
import * as v from "../utils/validate.mjs";

// The logged-in user's own account. Organizers waiting for approval may use
// these too (requireSession), so they can fix a typo in their details.
const router = express.Router();
router.use(requireSession);

function accountOf(id) {
  const user = db
    .prepare("SELECT id, name, email, role, status, organization, created_at FROM users WHERE id = ?")
    .get(id);
  const stats = {
    bookings: db.prepare("SELECT COUNT(*) AS n FROM registrations WHERE user_id = ?").get(id).n,
    events: db.prepare("SELECT COUNT(*) AS n FROM events WHERE organizer_id = ?").get(id).n,
  };
  return { ...user, stats };
}

router.get("/", (req, res) => {
  res.json(accountOf(req.user.id));
});

// Name, email and (for organizers) organization.
router.put("/profile", (req, res) => {
  const body = req.body ?? {};
  const errors = {};
  const name = v.text(errors, body, "name", "Name", { min: 2, max: 60 });
  const email = v.email(errors, body);
  const organization =
    req.user.role === "organizer"
      ? v.text(errors, body, "organization", "Organization or project name", { min: 2, max: 80 })
      : null;
  if (v.hasErrors(errors)) throw badRequest(errors);

  const taken = db.prepare("SELECT 1 FROM users WHERE email = ? AND id != ?").get(email, req.user.id);
  if (taken) throw conflict("This email is already registered", { email: "This email is already registered" });

  db.prepare("UPDATE users SET name = ?, email = ?, organization = ? WHERE id = ?").run(
    name, email, organization, req.user.id
  );
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
