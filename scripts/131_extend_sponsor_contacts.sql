-- Add columns for publishing sponsors via admin panel
ALTER TABLE sponsor_contacts
    ADD COLUMN IF NOT EXISTS logo_url VARCHAR(255),
    ADD COLUMN IF NOT EXISTS website_url VARCHAR(255),
    ADD COLUMN IF NOT EXISTS logo_bg_color VARCHAR(20),
    ADD COLUMN IF NOT EXISTS logo_size VARCHAR(20),
    ADD COLUMN IF NOT EXISTS tier VARCHAR(20);
