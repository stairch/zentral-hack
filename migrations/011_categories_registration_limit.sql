-- Admin-controlled registration limit and hard close switch per category.
ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS max_registrations INTEGER,
    ADD COLUMN IF NOT EXISTS registration_closed BOOLEAN NOT NULL DEFAULT false;
