CREATE TABLE IF NOT EXISTS newsletter_participant_sends (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name             TEXT        NOT NULL,
    category_id      UUID        REFERENCES categories(id) ON DELETE SET NULL,
    recipient_count  INTEGER     NOT NULL,
    scheduled_at     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
