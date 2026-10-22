-- Unlock true global (no-category) documents.
ALTER TABLE category_documents ALTER COLUMN category_id DROP NOT NULL;

-- Enforce exactly one leader per team at the DB level too.
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_one_leader
  ON team_members (team_id) WHERE role = 'leader';

-- Shared team chat: one thread per team, members and scoped admins can post.
CREATE TABLE IF NOT EXISTS team_chat_messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  sender_id       UUID        REFERENCES users(id) ON DELETE SET NULL,
  content         TEXT,
  attachment_url  TEXT,
  attachment_name TEXT,
  attachment_mime TEXT,
  attachment_size INTEGER,
  edited_at       TIMESTAMPTZ,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (content IS NOT NULL OR attachment_url IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_team_chat_messages_team_id ON team_chat_messages(team_id);
