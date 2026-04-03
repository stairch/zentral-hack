-- Sponsorship Packages und Kontakte Table
-- Für die Verwaltung von Sponsorship-Anfragen

CREATE TABLE IF NOT EXISTS sponsor_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_order INT NOT NULL,
  description TEXT,
  color VARCHAR(7),
  benefits TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sponsor_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  interested_in VARCHAR(50),
  message TEXT,
  status VARCHAR(20) DEFAULT 'new',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert Sponsorship Packages (ohne Preise)
INSERT INTO sponsor_packages (name, display_order, description, color, benefits) VALUES
  ('Platin', 1, 'Premium Partnership Package', '#530A5D', ARRAY[
    'Individuell',
    'Projektkosten inkl.',
    'Mitwerbschaft/ Präsentation',
    'Verpflegung',
    'Exklusive Networking Events'
  ]),
  ('Gold', 2, 'Gold Partnership Package', '#E6FF17', ARRAY[
    'Logo auf Website und Event Plattform',
    'Logo auf Flyer und Signalétik-Plakaten',
    'Logo auf Social Media Beiträgen',
    'Porträt Sponsor auf Social Media',
    'LED-Banner (0.85m)',
    'Mitwerbung Aussenbereich'
  ]),
  ('Silber', 3, 'Silver Partnership Package', '#C0C0C0', ARRAY[
    'Logo auf Website',
    'Logo auf Event Plattform',
    'Logo auf Social Media Beiträgen',
    'Porträt Sponsor auf Social Media',
    'Mitwerbung Aussenbereich'
  ]),
  ('Bronze', 4, 'Bronze Partnership Package', '#CD7F32', ARRAY[
    'Logo auf Website',
    'Präsenz auf Event Plattform',
    'Mitwerbung Aussenbereich'
  ])
ON CONFLICT (name) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sponsor_contacts_created_at ON sponsor_contacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sponsor_contacts_status ON sponsor_contacts(status);
