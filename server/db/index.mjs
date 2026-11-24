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
