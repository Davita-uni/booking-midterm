import express from "express";
import { db } from "../db/index.mjs";
import { requireSession } from "../middlewares/auth.mjs";
import { notFound, parseId } from "../utils/http.mjs";

// The logged-in user's own notifications.
const router = express.Router();
router.use(requireSession);

router.get("/", (req, res) => {
  const items = db
    .prepare(`
      SELECT id, message, link, read_at, created_at
      FROM notifications WHERE user_id = ?
      ORDER BY created_at DESC, id DESC
      LIMIT 30
    `)
    .all(req.user.id);
  const { unread } = db
    .prepare("SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND read_at IS NULL")
    .get(req.user.id);
  res.json({ unread, items });
});

router.post("/read-all", (req, res) => {
  db.prepare("UPDATE notifications SET read_at = datetime('now') WHERE user_id = ? AND read_at IS NULL").run(req.user.id);
  res.status(204).end();
});

router.post("/:id/read", (req, res) => {
  const { changes } = db
    .prepare("UPDATE notifications SET read_at = COALESCE(read_at, datetime('now')) WHERE id = ? AND user_id = ?")
    .run(parseId(req.params.id), req.user.id);
  if (!changes) throw notFound("Notification not found");
  res.status(204).end();
});

export default router;
