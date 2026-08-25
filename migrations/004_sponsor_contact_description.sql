-- Add bilingual description fields to sponsor_contacts
ALTER TABLE sponsor_contacts
  ADD COLUMN IF NOT EXISTS description    TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT;
