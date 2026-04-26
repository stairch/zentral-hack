-- Dedicated prize column for sponsor challenges (simpler admin management)
ALTER TABLE sponsor_challenges ADD COLUMN IF NOT EXISTS prize TEXT;
