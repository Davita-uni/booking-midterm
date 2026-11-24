import express from "express";
import { db } from "../db/index.mjs";
import { requireAuth, requireRole } from "../middlewares/auth.mjs";
import { badRequest, notFound, parseId } from "../utils/http.mjs";
import * as v from "../utils/validate.mjs";
import { notify, notifyAdmins } from "../utils/notify.mjs";

// Requests from organizers to the admins, e.g. "please add a venue".
// Organizers send them and read the reply; admins reply and set the status.
const router = express.Router();
router.use(requireAuth);

export const STATUSES = ["new", "in_progress", "completed"];

const SELECT = `
  SELECT r.id, r.subject, r.body, r.status, r.admin_reply, r.replied_at, r.created_at, r.updated_at,
         r.organizer_id, u.name AS organizer_name, u.email AS organizer_email, u.organization
  FROM requests r
  JOIN users u ON u.id = r.organizer_id
`;

const findRequest = (id) => db.prepare(`${SELECT} WHERE r.id = ?`).get(id);

// Organizers see their own requests, admins see all of them. Newest first.
router.get("/", requireRole("organizer", "admin"), (req, res) => {
  const rows =
    req.user.role === "admin"
      ? db.prepare(`${SELECT} ORDER BY r.created_at DESC, r.id DESC`).all()
      : db.prepare(`${SELECT} WHERE r.organizer_id = ? ORDER BY r.created_at DESC, r.id DESC`).all(req.user.id);
  res.json(rows);
});

router.post("/", requireRole("organizer"), (req, res) => {
  const errors = {};
  const subject = v.text(errors, req.body ?? {}, "subject", "Subject", { min: 3, max: 120 });
  const body = v.text(errors, req.body ?? {}, "body", "Request", { min: 10, max: 4000 });
  if (v.hasErrors(errors)) throw badRequest(errors);

  const { lastInsertRowid } = db
    .prepare("INSERT INTO requests (organizer_id, subject, body) VALUES (?, ?, ?)")
    .run(req.user.id, subject, body);
  notifyAdmins(`New request from ${req.user.name}: “${subject}”`, "/admin/requests");
  res.status(201).json(findRequest(lastInsertRowid));
});

// Admin replies and/or changes the status.
router.patch("/:id", requireRole("admin"), (req, res) => {
  const id = parseId(req.params.id);
  const existing = findRequest(id);
  if (!existing) throw notFound("Request not found");

  const body = req.body ?? {};
  const errors = {};
  const status = body.status ?? existing.status;
  if (!STATUSES.includes(status)) errors.status = "Choose a valid status";
  let reply = existing.admin_reply;
  if (body.admin_reply !== undefined) {
    reply = v.text(errors, body, "admin_reply", "Reply", { max: 4000, required: false }) || null;
  }
  if (v.hasErrors(errors)) throw badRequest(errors);

  const replyChanged = (reply ?? null) !== (existing.admin_reply ?? null);
  db.prepare(`
    UPDATE requests
    SET status = ?, admin_reply = ?,
        replied_at = CASE WHEN ? THEN datetime('now') ELSE replied_at END,
        updated_at = datetime('now')
    WHERE id = ?
  `).run(status, reply, replyChanged && reply ? 1 : 0, id);

  const updated = findRequest(id);
  const STATUS_LABEL = { new: "New", in_progress: "Work in progress", completed: "Completed" };
  const parts = [];
  if (replyChanged && reply) parts.push("the admin replied");
  if (status !== existing.status) parts.push(`status is now ${STATUS_LABEL[status]}`);
  if (parts.length) {
    notify([existing.organizer_id], `Your request “${existing.subject}”: ${parts.join(" and ")}.`, "/my/requests");
  }
  res.json(updated);
});

export default router;
