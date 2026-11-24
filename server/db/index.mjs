import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import "../config/env.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(here, "..");

export const DB_FILE = path.resolve(serverRoot, process.env.DB_FILE || "data/doorlist.db");
fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });

export const db = new DatabaseSync(DB_FILE);

// SQLite leaves foreign keys off unless asked, per connection.
db.exec("PRAGMA foreign_keys = ON;");
db.exec(fs.readFileSync(path.join(here, "schema.sql"), "utf8"));

// Databases created before v0.6.0 have no status/organization columns yet.
const userColumns = db.prepare("PRAGMA table_info(users)").all().map((c) => c.name);
if (!userColumns.includes("status")) {
  db.exec(`ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active'
           CHECK (status IN ('pending', 'active', 'suspended'))`);
}
if (!userColumns.includes("organization")) {
  db.exec("ALTER TABLE users ADD COLUMN organization TEXT");
}
if (!userColumns.includes("currency")) {
  db.exec(`ALTER TABLE users ADD COLUMN currency TEXT NOT NULL DEFAULT 'GEL'
           CHECK (currency IN ('GEL', 'USD', 'EUR'))`);
}

// Databases created before v0.16.0 have one ticket per registration.
const registrationColumns = db.prepare("PRAGMA table_info(registrations)").all().map((c) => c.name);
if (!registrationColumns.includes("quantity")) {
  db.exec(`ALTER TABLE registrations ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1
           CHECK (quantity BETWEEN 1 AND 10)`);
}

// Databases created before v0.17.2 have no Ilia Uni venues.
if (!db.prepare("PRAGMA table_info(venues)").all().some((c) => c.name === "iliauni")) {
  db.exec("ALTER TABLE venues ADD COLUMN iliauni INTEGER NOT NULL DEFAULT 0 CHECK (iliauni IN (0, 1))");
}

// Databases from before v0.17.3 that were not re-seeded have no A–D Block yet:
// add them once (user_version remembers it), keeping all other data. If an
// admin later deletes or renames them, they are not added again.
const BLOCKS_ADDED = 1703;
if (db.prepare("PRAGMA user_version").get().user_version < BLOCKS_ADDED) {
  const addBlock = db.prepare(
    "INSERT OR IGNORE INTO venues (name, address, capacity, iliauni) VALUES (?, 'Ilia State University, 3/5 Kakutsa Cholokashvili Ave', ?, 1)"
  );
  for (const [name, capacity] of [["A Block", 300], ["B Block", 200], ["C Block", 120], ["D Block", 80]]) {
    addBlock.run(name, capacity);
  }
  db.exec(`PRAGMA user_version = ${BLOCKS_ADDED}`);
}

// Databases created before v0.17.0 have no audience (all events are public).
if (!db.prepare("PRAGMA table_info(events)").all().some((c) => c.name === "audience")) {
  db.exec(`ALTER TABLE events ADD COLUMN audience TEXT NOT NULL DEFAULT 'public'
           CHECK (audience IN ('public', 'iliauni'))`);
}

// Databases created before v0.15.0 have no ticket price or entry rules yet.
const eventColumns = db.prepare("PRAGMA table_info(events)").all().map((c) => c.name);
if (!eventColumns.includes("price")) {
  db.exec(`
    ALTER TABLE events ADD COLUMN price REAL NOT NULL DEFAULT 0 CHECK (price >= 0);
    ALTER TABLE events ADD COLUMN face_control INTEGER CHECK (face_control IN (0, 1));
    ALTER TABLE events ADD COLUMN age_limit INTEGER CHECK (age_limit IN (16, 18, 21, 25));
    ALTER TABLE events ADD COLUMN dress_code TEXT;
  `);
}

// Databases from v0.11/v0.12 have one admin_reply per request and no
// "cancelled" status. Rebuild the table and move each reply into request_replies.
const requestsSql = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'requests'").get()?.sql ?? "";
if (requestsSql && !requestsSql.includes("cancelled")) {
  db.exec("PRAGMA foreign_keys = OFF;");
  db.exec(`
    BEGIN;
    CREATE TABLE requests_v2 (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      organizer_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject       TEXT    NOT NULL,
      body          TEXT    NOT NULL,
      status        TEXT    NOT NULL DEFAULT 'new'
                            CHECK (status IN ('new', 'in_progress', 'completed', 'cancelled')),
      created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO requests_v2 (id, organizer_id, subject, body, status, created_at, updated_at)
      SELECT id, organizer_id, subject, body, status, created_at, updated_at FROM requests;
    INSERT INTO request_replies (request_id, admin_id, body, status, created_at)
      SELECT id, (SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1), admin_reply, status,
             COALESCE(replied_at, updated_at)
      FROM requests WHERE admin_reply IS NOT NULL;
    DROP TABLE requests;
    ALTER TABLE requests_v2 RENAME TO requests;
    CREATE INDEX IF NOT EXISTS idx_requests_organizer ON requests(organizer_id);
    COMMIT;
  `);
  db.exec("PRAGMA foreign_keys = ON;");
}

// Runs fn inside one transaction: everything is saved, or nothing is.
export function transaction(fn) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}
