-- Project register based on the four columns in the Vicbriggs executed-project schedule.
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  serial_number INTEGER NOT NULL UNIQUE,
  description TEXT NOT NULL,
  client TEXT NOT NULL,
  period TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS projects_public_idx
  ON projects(status, deleted_at, serial_number);
