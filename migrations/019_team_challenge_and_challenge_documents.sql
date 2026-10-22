ALTER TABLE teams
    ADD COLUMN IF NOT EXISTS challenge_id UUID REFERENCES sponsor_challenges(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_teams_challenge_id ON teams(challenge_id);

CREATE TABLE IF NOT EXISTS challenge_documents (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID        NOT NULL REFERENCES sponsor_challenges(id) ON DELETE CASCADE,
    name         TEXT        NOT NULL,
    description  TEXT,
    file_path    TEXT        NOT NULL,
    file_size    INTEGER,
    uploaded_by  UUID        REFERENCES users(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_challenge_documents_challenge_id ON challenge_documents(challenge_id);
