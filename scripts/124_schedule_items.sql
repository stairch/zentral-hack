-- Schedule items table
CREATE TABLE IF NOT EXISTS schedule_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day INTEGER NOT NULL CHECK (day IN (1, 2)),
  time TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'clock',
  title_de TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  description_de TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedule_items_day ON schedule_items(day, sort_order);

INSERT INTO schedule_items (day, time, icon, title_de, title_en, description_de, description_en, sort_order)
VALUES
  (1, '17:00', 'clock',         'Check-in',               'Check-in',             'Empfang und Registrierung',          'Welcome and registration',             10),
  (1, '18:00', 'presentation',  'Begrüssung',             'Welcome',              'Willkommen zum Zentral Hack',        'Welcome to Zentral Hack',              20),
  (1, '18:30', 'presentation',  'Challenge Pitches',      'Challenge Pitches',    'Vorstellung der Challenges',         'Introduction to all challenges',       30),
  (1, '19:00', 'coffee',        'Teambildung & Apéro',    'Team Matching & Apéro','Finde dein Team bei Sponsoren-Apéro','Find your team during the sponsor apéro', 40),
  (1, '19:30', 'code',          'Start des Hacks',        'Hack Starts',          'Los geht''s!',                       'Let''s go!',                           50),
  (1, '20:00', 'utensils',      'Dinner Buffet',          'Dinner Buffet',        'Stärkung für die Nacht',             'Fuel up for the night',                60),
  (1, '23:00', 'party-popper',  'Night Special',          'Night Special',        'Überraschung!',                      'Surprise!',                            70),
  (2, '08:00', 'coffee',        'Frühstücksbuffet',       'Breakfast Buffet',     'Energie für den Tag',                'Energy for the day',                   10),
  (2, '10:00', 'presentation',  'Referate & Speeches',   'Talks & Speeches',     'Inspirierende Vorträge',             'Inspiring talks',                      20),
  (2, '12:00', 'utensils',      'Lunchbuffet',            'Lunch Buffet',         'Mittagspause',                       'Lunch break',                          30),
  (2, '16:00', 'coffee',        'Nachmittagssnack',       'Afternoon Snack',      'Letzte Energie',                     'Final energy boost',                   40),
  (2, '19:00', 'presentation',  'Abschlusspräsentationen','Final Presentations',  'Zeigt was ihr geschafft habt',       'Show what you have built',             50),
  (2, '22:00', 'party-popper',  'Ende & Preisverleihung', 'Closing & Awards',     'Feier mit uns!',                     'Celebrate with us!',                   60)
ON CONFLICT DO NOTHING;
