-- Fix users role constraint to include sponsor role reliably.
-- This migration is intentionally separate from 118 so it runs even if 118 was already marked as applied.

DO $$
DECLARE
  constraint_row RECORD;
BEGIN
  FOR constraint_row IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'users'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%role%'
  LOOP
    EXECUTE format('ALTER TABLE users DROP CONSTRAINT %I', constraint_row.conname);
  END LOOP;
END
$$;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('user', 'category_partner', 'sponsor', 'admin'));

-- Ensure sponsor challenges table exists even when 118 did not run successfully.
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

DO $$
DECLARE
  constraint_row RECORD;
BEGIN
  FOR constraint_row IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'sponsor_challenges'::regclass
      AND contype = 'u'
      AND pg_get_constraintdef(oid) ILIKE '%(user_id)%'
  LOOP
    EXECUTE format('ALTER TABLE sponsor_challenges DROP CONSTRAINT %I', constraint_row.conname);
  END LOOP;
END
$$;
