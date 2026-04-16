-- Sponsor roles and challenge storage

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('user', 'category_partner', 'sponsor', 'admin'));

CREATE TABLE IF NOT EXISTS sponsor_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  company_name TEXT,
  branch TEXT,
  contact_name TEXT,
  contact_function TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  logo_note TEXT,
  challenge_title TEXT,
  short_description TEXT,
  difficulty TEXT,
  team_size TEXT,
  challenge_language TEXT,
  challenge_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sponsor_challenges_category_id ON sponsor_challenges(category_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_challenges_status ON sponsor_challenges(status);
