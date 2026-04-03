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
  ('Platin', 1, 'Das Platin-Paket ist die engste Partnerschaft mit dem Zentral Hack und kombiniert maximale Sichtbarkeit mit aktiver Mitgestaltung.', '#530A5D', ARRAY[
    'Beteiligung an Organisation und Mitgestaltung der Eventplanung',
    'Lead-Partner einer Kategorie mit starker inhaltlicher Präsenz',
    'Prominentes Branding auf Website, Event-Plattform, Flyer, Give-aways und Social Media',
    'Sponsor-Porträt auf Social Media sowie zusätzliche Sichtbarkeit auf dem HSLU-Moodboard',
    'Grosse Präsenzfläche vor Ort inklusive Werbemittel, LED-Banner und Recruiting-Möglichkeiten',
    'Offizielle Erwähnung während des Events sowie Zugang zu Networking mit Jury, Departement und Talenten'
  ]),
  ('Gold', 2, 'Das Gold-Paket sorgt für eine starke Event-Präsenz mit hochwertigem Branding, Aktivierung vor Ort und direktem Austausch.', '#E6FF17', ARRAY[
    'Branding auf Website, Event-Plattform, Flyer und Social Media',
    'Sponsor-Porträt auf Social Media und zusätzliche Sichtbarkeit über ausgewählte Eventflächen',
    'LED-Banner-Präsenz und Einbindung in Give-away-Aktivierungen',
    'Präsenzfläche vor Ort für Austausch, Interaktion und Markeninszenierung',
    'Möglichkeit zur Platzierung eigener Werbemittel am Event',
    'Direkter Zugang zu Apéro, Networking und Recruiting im Eventumfeld'
  ]),
  ('Silber', 3, 'Das Silber-Paket bietet eine ausgewogene Mischung aus Sichtbarkeit, Event-Präsenz und wertvollen Kontaktpunkten.', '#C0C0C0', ARRAY[
    'Sichtbarkeit auf Website, Event-Plattform und ausgewählten Eventmedien',
    'Branding in Social-Media-Kommunikation und auf Sponsor-Übersichten',
    'Präsenz vor Ort mit kompakten Werbe- und Aktivierungsmöglichkeiten',
    'Einbindung in zentrale Eventmomente und Sponsorennennung',
    'Möglichkeit zur Platzierung eigener Werbemittel',
    'Zugang zu Networking mit Teilnehmenden und Partnern'
  ]),
  ('Bronze', 4, 'Das Bronze-Paket ist der kompakte Einstieg in das Sponsoring des Zentral Hack mit klarem, fokussiertem Auftritt.', '#CD7F32', ARRAY[
    'Branding auf Website und Event-Plattform',
    'Präsenz auf ausgewählten Kommunikations- und Übersichtsflächen',
    'Kompakte Sichtbarkeit vor Ort während des Events',
    'Möglichkeit zur Platzierung von Werbematerial im Rahmen des Events',
    'Einbindung in Sponsorennennung und Eventkommunikation',
    'Niederschwelliger Zugang zum Sponsoring-Netzwerk des Zentral Hack'
  ])
ON CONFLICT (name) DO UPDATE
SET display_order = EXCLUDED.display_order,
    description = EXCLUDED.description,
    color = EXCLUDED.color,
    benefits = EXCLUDED.benefits;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sponsor_contacts_created_at ON sponsor_contacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sponsor_contacts_status ON sponsor_contacts(status);
