CREATE TABLE IF NOT EXISTS media (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', category TEXT NOT NULL DEFAULT 'Projects',
 media_type TEXT NOT NULL CHECK(media_type IN ('image','video')),
 public_id TEXT NOT NULL UNIQUE, asset_url TEXT NOT NULL, poster_url TEXT,
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')),
 display_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS media_public ON media(status,deleted_at,display_order);
