import express from "express";
import { db, transaction } from "../db/index.mjs";
import { requireAuth, requireRole } from "../middlewares/auth.mjs";
import { badRequest, notFound, parseId } from "../utils/http.mjs";
import * as v from "../utils/validate.mjs";
import { notify, notifyAdmins } from "../utils/notify.mjs";

// Requests from organizers to the admins, e.g. "please add a venue".
// Organizers send them and read the replies; admins add replies and set the status.
const router = express.Router();
router.use(requireAuth);

export const STATUSES = ["new", "in_progress", "completed", "cancelled"];
const STATUS_LABEL = { new: "New", in_progress: "Work in progress", completed: "Completed", cancelled: "Cancelled" };

const SELECT = `
  SELECT r.id, r.subject, r.body, r.status, r.created_at, r.updated_at,
         r.organizer_id, u.name AS organizer_name, u.email AS organizer_email, u.organization
  FROM requests r
  JOIN users u ON u.id = r.organizer_id
`;

// Adds each request's replies (oldest first).
function withReplies(requests) {
  if (requests.length === 0) return requests;
  const ids = requests.map((r) => r.id);
  const replies = db
    .prepare(`
      SELECT rr.id, rr.request_id, rr.body, rr.status, rr.created_at, a.name AS admin_name
      FROM request_replies rr
      LEFT JOIN users a ON a.id = rr.admin_id
      WHERE rr.request_id IN (${ids.map(() => "?").join(", ")})
      ORDER BY rr.created_at, rr.id
    `)
    .all(...ids);
  return requests.map((r) => ({ ...r, replies: replies.filter((x) => x.request_id === r.id) }));
}

const findRequest = (id) => withReplies([db.prepare(`${SELECT} WHERE r.id = ?`).get(id)].filter(Boolean))[0];

// Organizers see their own requests, admins see all of them. Newest first.
router.get("/", requireRole("organizer", "admin"), (req, res) => {
  const rows =
    req.user.role === "admin"
      ? db.prepare(`${SELECT} ORDER BY r.created_at DESC, r.id DESC`).all()
      : db.prepare(`${SELECT} WHERE r.organizer_id = ? ORDER BY r.created_at DESC, r.id DESC`).all(req.user.id);
  res.json(withReplies(rows));
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

// Admin adds a reply and/or changes the status. Every save can add a new reply.
router.patch("/:id", requireRole("admin"), (req, res) => {
  const id = parseId(req.params.id);
  const existing = findRequest(id);
  if (!existing) throw notFound("Request not found");

  const body = req.body ?? {};
  const errors = {};
  const status = body.status ?? existing.status;
  if (!STATUSES.includes(status)) errors.status = "Choose a valid status";
  const reply = v.text(errors, body, "reply", "Reply", { max: 4000, required: false });
  if (!errors.status && !reply && status === existing.status) {
    errors.reply = "Write a reply or change the status";
  }
  if (v.hasErrors(errors)) throw badRequest(errors);

  transaction(() => {
    db.prepare("UPDATE requests SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
    if (reply) {
      db.prepare("INSERT INTO request_replies (request_id, admin_id, body, status) VALUES (?, ?, ?, ?)").run(
        id, req.user.id, reply, status
      );
    }
  });

  const parts = [];
  if (reply) parts.push("the admin replied");
  if (status !== existing.status) parts.push(`status is now ${STATUS_LABEL[status]}`);
  notify([existing.organizer_id], `Your request “${existing.subject}”: ${parts.join(" and ")}.`, "/my/requests");

  res.json(findRequest(id));
});

export default router;
