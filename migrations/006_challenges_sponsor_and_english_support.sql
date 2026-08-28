-- Add english title and short description fields to sponsor_challenges.
ALTER TABLE sponsor_challenges
  ADD COLUMN IF NOT EXISTS challenge_title_en   TEXT,
  ADD COLUMN IF NOT EXISTS short_description_en TEXT;

-- Add sponsor and link it to challenge
ALTER TABLE sponsor_challenges
  ADD COLUMN IF NOT EXISTS sponsor_id UUID REFERENCES sponsor_contacts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sponsor_challenges_sponsor_id ON sponsor_challenges(sponsor_id);
