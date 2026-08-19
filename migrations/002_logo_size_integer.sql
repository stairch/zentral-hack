-- Migrate logo_size from text enum to integer (5–100, step 5)

-- partner_logos: drop CHECK constraint and text default, cast column to INTEGER
ALTER TABLE partner_logos DROP CONSTRAINT IF EXISTS partner_logos_logo_size_check;
ALTER TABLE partner_logos ALTER COLUMN logo_size DROP DEFAULT;

ALTER TABLE partner_logos
  ALTER COLUMN logo_size TYPE INTEGER
  USING CASE
    WHEN logo_size = 'small'  THEN 40
    WHEN logo_size = 'large'  THEN 70
    ELSE 50  -- medium and anything else
  END;

ALTER TABLE partner_logos ALTER COLUMN logo_size SET DEFAULT 50;

ALTER TABLE partner_logos
  ADD CONSTRAINT partner_logos_logo_size_check CHECK (logo_size BETWEEN 5 AND 100);

-- sponsor_contacts
ALTER TABLE sponsor_contacts
  ALTER COLUMN logo_size TYPE INTEGER
  USING CASE
    WHEN logo_size = 'small'  THEN 40
    WHEN logo_size = 'large'  THEN 70
    WHEN logo_size IS NULL    THEN NULL
    ELSE 50  -- medium and anything else
  END;

ALTER TABLE sponsor_contacts
  ADD CONSTRAINT sponsor_contacts_logo_size_check CHECK (logo_size IS NULL OR logo_size BETWEEN 5 AND 100);
