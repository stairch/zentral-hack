CREATE TABLE IF NOT EXISTS newsletter_opt_in_tokens (
  token_hash  TEXT        PRIMARY KEY,
  email       TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_newsletter_opt_in_email ON newsletter_opt_in_tokens(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_opt_in_expires_at ON newsletter_opt_in_tokens(expires_at);
