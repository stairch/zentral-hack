ALTER TABLE sponsor_challenges
    ADD COLUMN IF NOT EXISTS submission_enabled BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS submission_description_required BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS challenge_submissions (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    category_id       UUID        NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    challenge_id      UUID        NOT NULL REFERENCES sponsor_challenges(id) ON DELETE CASCADE,
    description       TEXT,
    status            TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    review_comment    TEXT,
    reviewed_by       UUID        REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at       TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenge_submissions_category_id  ON challenge_submissions(category_id);
CREATE INDEX IF NOT EXISTS idx_challenge_submissions_challenge_id ON challenge_submissions(challenge_id);
