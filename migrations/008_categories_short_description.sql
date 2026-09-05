-- Short description shown directly on the category card on the landing page.
-- The existing (longer) description stays for the category detail dialog.
ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS short_description    TEXT,
    ADD COLUMN IF NOT EXISTS short_description_en TEXT;
