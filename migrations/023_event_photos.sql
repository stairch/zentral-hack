CREATE TABLE IF NOT EXISTS event_photos (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url     TEXT        NOT NULL,
  caption       TEXT,
  display_order INTEGER     NOT NULL DEFAULT 0,
  uploaded_by   UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
