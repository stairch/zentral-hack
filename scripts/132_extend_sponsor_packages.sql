ALTER TABLE sponsor_packages
  ADD COLUMN IF NOT EXISTS name_en VARCHAR(50),
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS benefits_en TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS price INTEGER,
  
  ADD COLUMN IF NOT EXISTS price_status TEXT NOT NULL DEFAULT 'hidden',
  ADD CONSTRAINT price_status_check CHECK (price_status IN ('hidden', 'show', 'on_request')),

  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS short_description_en TEXT;