CREATE TABLE IF NOT EXISTS leadership_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 150),
  designation TEXT NOT NULL CHECK(length(designation) BETWEEN 1 AND 150),
  "group" TEXT NOT NULL CHECK("group" IN ('board', 'management')),
  biography TEXT NOT NULL DEFAULT '',
  photo_public_id TEXT NOT NULL UNIQUE,
  photo_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS leadership_public_idx
  ON leadership_profiles(status, deleted_at, "group", display_order);
