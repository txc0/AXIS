-- AXIS database schema. Runs on every start (CREATE IF NOT EXISTS is safe to repeat).
-- To change a table later, add an ALTER TABLE line at the bottom (see README, "Changing the database").

-- ===== Content: synced from seed-data.js =====
CREATE TABLE IF NOT EXISTS products (
  slug TEXT PRIMARY KEY, name TEXT NOT NULL, price INTEGER NOT NULL, image TEXT NOT NULL,
  category TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
  sort INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS builder_options (
  grp TEXT NOT NULL, key TEXT NOT NULL, name TEXT NOT NULL, price INTEGER NOT NULL,
  wet INTEGER NOT NULL DEFAULT 0, meta TEXT NOT NULL DEFAULT '{}',
  sort INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (grp, key)
);
CREATE TABLE IF NOT EXISTS projects (
  slug TEXT PRIMARY KEY, name TEXT NOT NULL, location TEXT, year TEXT, type TEXT, area TEXT,
  status TEXT, art TEXT, bg TEXT, summary TEXT, body TEXT NOT NULL DEFAULT '[]',
  sort INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS articles (
  slug TEXT PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL, published_at TEXT NOT NULL,
  minutes INTEGER, image TEXT, excerpt TEXT, body TEXT NOT NULL DEFAULT '[]',
  featured INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS events (
  slug TEXT PRIMARY KEY, starts_at TEXT NOT NULL, title TEXT NOT NULL, details TEXT,
  seats INTEGER NOT NULL, active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS team (
  slug TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT, initials TEXT, color TEXT,
  image TEXT, sort INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS builds (
  slug TEXT PRIMARY KEY, image TEXT, author TEXT, title TEXT, likes INTEGER NOT NULL DEFAULT 0,
  sort INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS threads (
  slug TEXT PRIMARY KEY, initials TEXT, title TEXT NOT NULL, category TEXT,
  replies INTEGER NOT NULL DEFAULT 0, posted_at TEXT, active INTEGER NOT NULL DEFAULT 1
);

-- ===== Customer data: never touched by the seed script =====
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT UNIQUE,
  name TEXT NOT NULL, phone TEXT NOT NULL, address TEXT NOT NULL, payment TEXT NOT NULL,
  items TEXT NOT NULL, total INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE TABLE IF NOT EXISTS rsvps (
  id INTEGER PRIMARY KEY AUTOINCREMENT, event_slug TEXT NOT NULL REFERENCES events(slug),
  name TEXT NOT NULL, phone TEXT NOT NULL, seats INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE TABLE IF NOT EXISTS subscribers (
  email TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE TABLE IF NOT EXISTS members (
  email TEXT PRIMARY KEY, name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, data TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_submissions_type ON submissions(type, status);
CREATE INDEX IF NOT EXISTS idx_rsvps_event ON rsvps(event_slug);