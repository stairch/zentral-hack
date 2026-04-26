-- Co-organiser / partner logos table
CREATE TABLE IF NOT EXISTS partner_logos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  website_url TEXT,
  logo_size TEXT NOT NULL DEFAULT 'medium' CHECK (logo_size IN ('small', 'medium', 'large')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO partner_logos (name, logo_url, website_url, logo_size, sort_order) VALUES
  ('HSLU',                        '/partners/hslu-logo.png',          'https://hslu.ch/informatik',   'large',  10),
  ('ICT Berufsbildung Zentralschweiz', '/partners/ict-bz-logo.png',  'https://ict-bz.ch',            'medium', 20),
  ('UMB AG',                      '/partners/umb-logo.png',           'https://umb.ch',               'medium', 30),
  ('Digital & AI Community',      '/partners/ai-community-logo.png',  'https://ai-community.ch',      'medium', 40),
  ('getAbstract',                 '/partners/getabstract-logo.png',   'https://getabstract.com',      'medium', 50),
  ('STAIR',                       '/partners/stair-logo.png',         'https://stair.ch',             'medium', 60),
  ('SchwyzNext',                  '/partners/schwyznext-logo.png',    'https://schwyz-next.ch',       'small',  70)
ON CONFLICT DO NOTHING;
