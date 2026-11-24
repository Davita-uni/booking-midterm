import { db } from "../db/index.mjs";

// Creates notifications. Called from the routes right after the change they
// describe, e.g. an event edit or an admin reply.

const insert = db.prepare("INSERT INTO notifications (user_id, message, link) VALUES (?, ?, ?)");

export function notify(userIds, message, link = null) {
  for (const id of new Set(userIds)) insert.run(id, message, link);
}

export function notifyAdmins(message, link = null) {
  const admins = db.prepare("SELECT id FROM users WHERE role = 'admin' AND status = 'active'").all();
  notify(
    admins.map((a) => a.id),
    message,
    link
  );
}

// Everyone with a seat at the event, except `exceptId` (the person making the change).
export function bookersOf(eventId, exceptId = 0) {
  return db
    .prepare("SELECT user_id FROM registrations WHERE event_id = ? AND user_id != ?")
    .all(eventId, exceptId)
    .map((r) => r.user_id);
}
