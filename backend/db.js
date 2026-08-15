// db.js
// Sets up a local SQLite database file (booking.db) and creates the tables
// the app needs the first time it runs. SQLite needs no separate server —
// the whole database lives in one file next to this script.

const path = require("path");
const Database = require("better-sqlite3");

const db = new Database(path.join(__dirname, "booking.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer', -- 'customer' or 'admin'
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    price REAL NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    booking_date TEXT NOT NULL,   -- YYYY-MM-DD
    booking_time TEXT NOT NULL,   -- HH:MM (24h)
    status TEXT NOT NULL DEFAULT 'pending', -- pending | confirmed | cancelled | completed
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(service_id, booking_date, booking_time)
  );
`);

// Seed a few default services the first time the database is created,
// so the app isn't empty on first run.
const serviceCount = db.prepare("SELECT COUNT(*) AS c FROM services").get().c;
if (serviceCount === 0) {
  const insert = db.prepare(
    `INSERT INTO services (name, description, duration_minutes, price) VALUES (?, ?, ?, ?)`
  );
  insert.run("Initial Consultation", "A first meeting to understand your needs.", 30, 0);
  insert.run("Standard Appointment", "Our regular 45-minute session.", 45, 50);
  insert.run("Extended Session", "A longer, in-depth 90-minute session.", 90, 90);
}

module.exports = db;
