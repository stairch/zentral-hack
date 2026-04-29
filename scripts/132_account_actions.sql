-- Account action tokens for sensitive user profile operations
CREATE TABLE IF NOT EXISTS account_action_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('email_change', 'password_change', 'category_change', 'delete_account', 'password_reset')),
  token TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_account_action_tokens_user_id ON account_action_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_account_action_tokens_action ON account_action_tokens(action);