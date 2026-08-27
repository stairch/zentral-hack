-- Add bilingual (DE/EN) title and short description fields to sponsor_challenges.
-- The existing challenge_title / short_description columns hold the German text,
-- the new *_en columns hold the English text.
ALTER TABLE sponsor_challenges
  ADD COLUMN IF NOT EXISTS challenge_title_en   TEXT,
  ADD COLUMN IF NOT EXISTS short_description_en TEXT;
