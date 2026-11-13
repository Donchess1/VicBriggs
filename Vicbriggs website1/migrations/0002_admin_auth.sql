-- Apply after 0001_media.sql
CREATE TABLE IF NOT EXISTS cms_admins (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 email TEXT NOT NULL UNIQUE,
 password_hash TEXT NOT NULL,
 password_salt TEXT NOT NULL,
 iterations INTEGER NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS cms_sessions (
 token_hash TEXT PRIMARY KEY,
 admin_id INTEGER NOT NULL REFERENCES cms_admins(id),
 expires_at INTEGER NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS cms_sessions_expiry ON cms_sessions(expires_at);
CREATE TABLE IF NOT EXISTS cms_login_attempts (
 identity TEXT PRIMARY KEY,
 failures INTEGER NOT NULL DEFAULT 0,
 window_start INTEGER NOT NULL,
 blocked_until INTEGER NOT NULL DEFAULT 0
);
