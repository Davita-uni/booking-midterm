-- Doorlist database schema (SQLite)
--
-- users 1 ── * events          (an organizer owns many events)
-- venues 1 ── * events         (a venue hosts many events)
-- categories 1 ── * events     (a category groups many events)
-- events 1 ── * registrations  (an event has many bookings)
-- users 1 ── * registrations   (an attendee has many bookings)

CREATE TABLE IF NOT EXISTS users (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT    NOT NULL,
  email          TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password_hash  TEXT    NOT NULL,
  role           TEXT    NOT NULL DEFAULT 'attendee'
                         CHECK (role IN ('admin', 'organizer', 'attendee')),
  token_version  INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT    NOT NULL UNIQUE COLLATE NOCASE
);

CREATE TABLE IF NOT EXISTS venues (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  address   TEXT    NOT NULL,
  city      TEXT    NOT NULL DEFAULT 'Tbilisi',
  capacity  INTEGER NOT NULL CHECK (capacity > 0)
);

CREATE TABLE IF NOT EXISTS events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT    NOT NULL,
  description   TEXT    NOT NULL DEFAULT '',
  starts_at     TEXT    NOT NULL,              -- local time, "YYYY-MM-DDTHH:MM"
  capacity      INTEGER NOT NULL CHECK (capacity > 0),
  venue_id      INTEGER NOT NULL REFERENCES venues(id) ON DELETE RESTRICT,
  category_id   INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  organizer_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS registrations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id    INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (event_id, user_id)                  -- one seat per attendee per event
);

CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events(starts_at);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user ON registrations(user_id);
