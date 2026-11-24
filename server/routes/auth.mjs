import express from "express";
import bcrypt from "bcryptjs";
import { db } from "../db/index.mjs";
import { requireAuth, signToken } from "../middlewares/auth.mjs";
import { badRequest, conflict, forbidden, unauthorized } from "../utils/http.mjs";
import { PENDING_MESSAGE, SUSPENDED_MESSAGE } from "../config/app.mjs";
import * as v from "../utils/validate.mjs";

const router = express.Router();

// People can sign up as attendees or organizers. Admin accounts are only
// created by the seed script. Organizers start as "pending" and can't log in
// until an admin approves them.
const SIGNUP_ROLES = ["attendee", "organizer"];

const publicUser = (u) => ({
  id: u.id, name: u.name, email: u.email, role: u.role, status: u.status, organization: u.organization,
});

router.post("/register", async (req, res) => {
  const body = req.body ?? {};
  const errors = {};
  const name = v.text(errors, body, "name", "Name", { min: 2, max: 60 });
  const email = v.email(errors, body);
  const password = v.password(errors, body);
  const role = body.role ?? "attendee";
  if (!SIGNUP_ROLES.includes(role)) errors.role = "You can sign up as an attendee or an organizer";
  const organization =
    role === "organizer"
      ? v.text(errors, body, "organization", "Organization or project name", { min: 2, max: 80 })
      : null;
  if (v.hasErrors(errors)) throw badRequest(errors);

  const taken = db.prepare("SELECT 1 FROM users WHERE email = ?").get(email);
  if (taken) throw conflict("This email is already registered", { email: "This email is already registered" });

  const hash = await bcrypt.hash(password, 10);
  const status = role === "organizer" ? "pending" : "active";
  const { lastInsertRowid } = db
    .prepare("INSERT INTO users (name, email, password_hash, role, status, organization) VALUES (?, ?, ?, ?, ?, ?)")
    .run(name, email, hash, role, status, organization);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(lastInsertRowid);
  if (status === "pending") {
    // no token: the account can't be used until it is approved
    return res.status(201).json({ pending: true, message: PENDING_MESSAGE, user: publicUser(user) });
  }
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

router.post("/login", async (req, res) => {
  const body = req.body ?? {};
  const errors = {};
  const email = v.email(errors, body);
  if (!body.password) errors.password = "Password is required";
  if (v.hasErrors(errors)) throw badRequest(errors);

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  const ok = user && (await bcrypt.compare(String(body.password), user.password_hash));
  // same message for both cases, so nobody can probe which emails exist
  if (!ok) throw unauthorized("Email or password is incorrect");
  if (user.status === "pending") throw forbidden(PENDING_MESSAGE, "account_pending");
  if (user.status === "suspended") throw forbidden(SUSPENDED_MESSAGE, "account_suspended");

  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Logging out bumps token_version, so the old token stops working on the server too.
router.post("/logout", requireAuth, (req, res) => {
  db.prepare("UPDATE users SET token_version = token_version + 1 WHERE id = ?").run(req.user.id);
  res.status(204).end();
});

export default router;
