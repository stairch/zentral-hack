-- Migration: Add multilingual columns for database-managed content
-- Safe to run multiple times.

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS partner_name_en TEXT,
  ADD COLUMN IF NOT EXISTS challenge_description_en TEXT;

ALTER TABLE faqs
  ADD COLUMN IF NOT EXISTS question_en TEXT,
  ADD COLUMN IF NOT EXISTS answer_en TEXT;
