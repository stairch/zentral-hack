-- Insert default categories for Zentral Hack 2026
INSERT INTO categories (name, slug, description, partner_name, color, icon, is_active) VALUES
  (
    'Young Talents',
    'young-talents',
    'Für den Nachwuchs der ICT-Branche. Zeige dein Können und sammle erste echte Hackathon-Erfahrung.',
    'ICT Berufsbildung Zentralschweiz & UMB AG',
    '#E6FF17',
    'sparkles',
    true
  ),
  (
    'AI Agentic',
    'ai-agentic',
    'Entwickle agentische KI-Lösungen, intelligente Automationen und neue Formen der Zusammenarbeit mit AI.',
    'ICT Berufsbildung Zentralschweiz, Digital & AI Community & getAbstract',
    '#530A5D',
    'brain',
    true
  ),
  (
    'Campus Challenge',
    'campus-challenge',
    'Eine Challenge für Studierende, in der akademische Perspektiven auf praktische Probleme treffen.',
    'STAIR',
    '#D6C6FF',
    'graduation-cap',
    true
  ),
  (
    'Regional Impact',
    'regional-impact',
    'Arbeite an Lösungen mit direktem Nutzen für die Zentralschweiz und ihre Unternehmen, Institutionen und Menschen.',
    'SchwyzNext',
    '#7A1F83',
    'mountain',
    true
  )
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    partner_name = EXCLUDED.partner_name,
    color = EXCLUDED.color,
    icon = EXCLUDED.icon,
    is_active = EXCLUDED.is_active;
