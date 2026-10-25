-- A challenge can be linked to several sponsors. The array keeps the order chosen in the admin panel.
ALTER TABLE sponsor_challenges
  ADD COLUMN IF NOT EXISTS sponsor_ids UUID[] NOT NULL DEFAULT '{}';

UPDATE sponsor_challenges
SET sponsor_ids = ARRAY[sponsor_id]
WHERE sponsor_id IS NOT NULL;

DROP INDEX IF EXISTS idx_sponsor_challenges_sponsor_id;
ALTER TABLE sponsor_challenges DROP COLUMN IF EXISTS sponsor_id;
