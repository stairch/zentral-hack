-- Insert default categories for Zentral Hack 2026
INSERT INTO categories (name, slug, description, is_active) VALUES
  ('Young Talents', 'young-talents', 'Für Schüler:innen und junge Talente, die erste Erfahrungen im Programmieren sammeln möchten.', true),
  ('AI Agentic', 'ai-agentic', 'Entwickle innovative KI-Agenten und automatisierte Lösungen mit modernsten AI-Technologien.', true),
  ('Campus Challenge', 'campus-challenge', 'Exklusiv für Studierende der HSLU und Partner-Hochschulen.', true),
  ('Regional Impact', 'regional-impact', 'Löse reale Herausforderungen von Unternehmen und Organisationen der Zentralschweiz.', true)
ON CONFLICT (name) DO NOTHING;
