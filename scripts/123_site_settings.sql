-- Site settings key-value store (about stats, etc.)
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO site_settings (key, value) VALUES (
  'about_stats',
  '[
    {"value": 24, "suffix": "", "label_de": "Stunden", "label_en": "Hours"},
    {"value": 4, "suffix": "", "label_de": "Kategorien", "label_en": "Categories"},
    {"value": 200, "suffix": "+", "label_de": "Teilnehmende", "label_en": "Participants"},
    {"value": 1, "suffix": "", "label_de": "Ziel", "label_en": "Goal"}
  ]'::jsonb
) ON CONFLICT (key) DO NOTHING;
