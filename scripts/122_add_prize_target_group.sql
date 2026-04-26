-- Add prize and target_group columns to categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS prize TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS target_group TEXT;
