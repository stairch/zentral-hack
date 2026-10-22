-- Internal documentation for category admins and above, never exposed to participants.
CREATE TABLE IF NOT EXISTS team_notes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    UUID        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  author_id  UUID        REFERENCES users(id) ON DELETE SET NULL,
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_team_notes_team_id ON team_notes(team_id);

-- Placement of a team within its category, with who set it last.
CREATE TABLE IF NOT EXISTS team_rankings (
  team_id    UUID        PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
  rank       INTEGER     NOT NULL CHECK (rank > 0),
  updated_by UUID        REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
