-- System-wide announcements, written only by super admins via the admin panel,
-- read-only for everyone else (a second, non-writable "chat").
CREATE TABLE IF NOT EXISTS announcements (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT,
  content     TEXT        NOT NULL,
  created_by  UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at);
