-- =============================================================================
-- Zentral Hack — Complete Database Schema
-- PostgreSQL — Consolidated from all migrations up to 151
-- =============================================================================


-- =============================================================================
-- TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email               TEXT        NOT NULL UNIQUE,
  password_hash       TEXT        NOT NULL,
  first_name          TEXT,
  last_name           TEXT,
  role                TEXT        NOT NULL DEFAULT 'user'
                                  CHECK (role IN ('user', 'category_partner', 'sponsor', 'admin')),
  category_id         UUID,
  is_active           BOOLEAN     NOT NULL DEFAULT true,
  email_verified      BOOLEAN     NOT NULL DEFAULT false,
  email_verified_at   TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                        TEXT        NOT NULL UNIQUE,
  name_en                     TEXT,
  slug                        TEXT        NOT NULL UNIQUE,
  description                 TEXT,
  description_en              TEXT,
  partner_name                TEXT,
  partner_name_en             TEXT,
  color                       VARCHAR(7),
  text_color                  TEXT,
  icon                        VARCHAR(50),
  challenge_description       TEXT,
  challenge_description_en    TEXT,
  show_challenge_description  BOOLEAN     NOT NULL DEFAULT false,
  prize                       TEXT,
  target_group                TEXT,
  is_active                   BOOLEAN     NOT NULL DEFAULT true,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users
  ADD CONSTRAINT fk_users_category_id
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS profiles (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  university              TEXT,
  study_program           TEXT,
  semester                INTEGER,
  linkedin_url            TEXT,
  newsletter_subscribed   BOOLEAN     NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS registrations (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id           UUID        NOT NULL REFERENCES categories(id),
  dietary_restrictions  TEXT,
  allergies             TEXT,
  intolerances          TEXT,
  status                TEXT        NOT NULL DEFAULT 'pending'
                                    CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  confirmation_sent     BOOLEAN     NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, category_id)
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email                       TEXT        NOT NULL UNIQUE,
  subscribed                  BOOLEAN     NOT NULL DEFAULT true,
  weekly_updates_subscribed   BOOLEAN     NOT NULL DEFAULT true,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teams (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  category_id UUID        NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  description TEXT,
  created_by  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id   UUID        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role      TEXT        NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'leader')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS category_documents (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  description TEXT,
  file_path   TEXT        NOT NULL,
  file_size   INTEGER,
  category_id UUID        NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  uploaded_by UUID        NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_documents (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  description TEXT,
  file_path   TEXT,
  github_link TEXT,
  file_size   INTEGER,
  team_id     UUID        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  uploaded_by UUID        NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_files (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       UUID        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  original_name TEXT        NOT NULL,
  file_path     TEXT        NOT NULL,
  file_size     INTEGER,
  mime_type     TEXT,
  uploaded_by   UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_github_repos (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  repository_url  TEXT        NOT NULL,
  title           TEXT,
  description     TEXT,
  added_by        UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS two_fa_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT        NOT NULL UNIQUE,
  code        TEXT        NOT NULL,
  verified    BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS account_action_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action      TEXT        NOT NULL
                          CHECK (action IN ('email_change', 'password_change', 'category_change', 'delete_account', 'password_reset')),
  token       TEXT        NOT NULL UNIQUE,
  code        TEXT        NOT NULL,
  payload     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  verified    BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS email_campaigns (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  subject         TEXT        NOT NULL,
  content         TEXT        NOT NULL,
  html_content    TEXT        NOT NULL,
  campaign_type   TEXT        NOT NULL DEFAULT 'participants'
                              CHECK (campaign_type IN ('participants', 'central_updates', 'newsletter_subscribers')),
  category_id     UUID        REFERENCES categories(id),
  sent_at         TIMESTAMPTZ,
  created_by      UUID        NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID        REFERENCES email_campaigns(id) ON DELETE CASCADE,
  recipient_email TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  sent_at         TIMESTAMPTZ,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_templates (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT        NOT NULL,
  description       TEXT,
  base_template_id  TEXT        NOT NULL DEFAULT 'standard',
  subject           TEXT        NOT NULL,
  content           TEXT        NOT NULL,
  cta_text          TEXT,
  cta_url           TEXT,
  footer_note       TEXT,
  created_by        UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faqs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  question        TEXT        NOT NULL,
  question_en     TEXT,
  answer          TEXT        NOT NULL,
  answer_en       TEXT,
  order_position  INTEGER     NOT NULL DEFAULT 0,
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_by      UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schedule_items (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  day             INTEGER     NOT NULL CHECK (day IN (1, 2)),
  time            TEXT        NOT NULL DEFAULT '',
  icon            TEXT        NOT NULL DEFAULT 'clock',
  title_de        TEXT        NOT NULL DEFAULT '',
  title_en        TEXT        NOT NULL DEFAULT '',
  description_de  TEXT        NOT NULL DEFAULT '',
  description_en  TEXT        NOT NULL DEFAULT '',
  sort_order      INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_settings (
  key         TEXT    PRIMARY KEY,
  value       JSONB   NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS partner_logos (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  logo_url    TEXT        NOT NULL,
  website_url TEXT,
  logo_size   TEXT        NOT NULL DEFAULT 'medium' CHECK (logo_size IN ('small', 'medium', 'large')),
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sponsor_packages (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  VARCHAR(50) NOT NULL UNIQUE,
  name_en               VARCHAR(50),
  display_order         INT         NOT NULL,
  description           TEXT,
  description_en        TEXT,
  short_description     TEXT,
  short_description_en  TEXT,
  color                 VARCHAR(7),
  benefits              TEXT[]      NOT NULL DEFAULT ARRAY[]::TEXT[],
  benefits_en           TEXT[]      NOT NULL DEFAULT ARRAY[]::TEXT[],
  price                 INTEGER,
  price_status          TEXT        NOT NULL DEFAULT 'hidden'
                                    CHECK (price_status IN ('hidden', 'show', 'on_request')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sponsor_contacts (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name    VARCHAR(255)  NOT NULL,
  contact_name    VARCHAR(255)  NOT NULL,
  email           VARCHAR(255)  NOT NULL,
  phone           VARCHAR(20),
  interested_in   UUID          REFERENCES sponsor_packages(id) ON DELETE SET NULL,
  tier            UUID          REFERENCES sponsor_packages(id) ON DELETE SET NULL,
  message         TEXT,
  status          VARCHAR(20)   NOT NULL DEFAULT 'new',
  logo_url        VARCHAR(255),
  website_url     VARCHAR(255),
  logo_bg_color   VARCHAR(20),
  logo_size       VARCHAR(20),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sponsor_challenges (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id         UUID        NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  status              TEXT        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  company_name        TEXT,
  branch              TEXT,
  contact_name        TEXT,
  contact_function    TEXT,
  contact_email       TEXT,
  contact_phone       TEXT,
  website             TEXT,
  logo_note           TEXT,
  challenge_title     TEXT,
  short_description   TEXT,
  difficulty          TEXT,
  team_size           TEXT,
  challenge_language  TEXT,
  challenge_data      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  prize               TEXT,
  published_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email                    ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role                     ON users(role);
CREATE INDEX IF NOT EXISTS idx_categories_slug                ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_registrations_user_id          ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_category_id      ON registrations(category_id);
CREATE INDEX IF NOT EXISTS idx_teams_category_id              ON teams(category_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id           ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id           ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_files_team_id             ON team_files(team_id);
CREATE INDEX IF NOT EXISTS idx_team_files_uploaded_by         ON team_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_team_github_repos_team_id      ON team_github_repos(team_id);
CREATE INDEX IF NOT EXISTS idx_two_fa_tokens_user_id          ON two_fa_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_account_action_tokens_user_id  ON account_action_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_account_action_tokens_action   ON account_action_tokens(action);
CREATE INDEX IF NOT EXISTS idx_email_logs_campaign_id         ON email_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_created_by     ON email_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_faqs_order                     ON faqs(order_position);
CREATE INDEX IF NOT EXISTS idx_schedule_items_day             ON schedule_items(day, sort_order);
CREATE INDEX IF NOT EXISTS idx_sponsor_challenges_user_id     ON sponsor_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_challenges_category_id ON sponsor_challenges(category_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_challenges_status      ON sponsor_challenges(status);
CREATE INDEX IF NOT EXISTS idx_sponsor_contacts_created_at    ON sponsor_contacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sponsor_contacts_status        ON sponsor_contacts(status);


-- =============================================================================
-- SEED DATA
-- =============================================================================

INSERT INTO categories (name, name_en, slug, description, description_en, partner_name, partner_name_en, color, icon, is_active) VALUES
  (
    'Young Talents', 'Young Talents',
    'young-talents',
    'Für den Nachwuchs der ICT-Branche. Zeige dein Können und sammle erste echte Hackathon-Erfahrung.',
    'For the next generation of ICT. Show what you can do and gain your first real hackathon experience.',
    'ICT Berufsbildung Zentralschweiz & UMB AG', 'ICT Berufsbildung Zentralschweiz & UMB AG',
    '#E6FF17', 'sparkles', true
  ),
  (
    'AI Agentic', 'AI Agentic',
    'ai-agentic',
    'Entwickle agentische KI-Lösungen, intelligente Automationen und neue Formen der Zusammenarbeit mit AI.',
    'Build agentic AI solutions, intelligent automations, and new ways of collaborating with AI.',
    'ICT Berufsbildung Zentralschweiz, Digital & AI Community & getAbstract',
    'ICT Berufsbildung Zentralschweiz, Digital & AI Community & getAbstract',
    '#530A5D', 'brain', true
  ),
  (
    'Campus Challenge', 'Campus Challenge',
    'campus-challenge',
    'Eine Challenge für Studierende, in der akademische Perspektiven auf praktische Probleme treffen.',
    'A challenge for students where academic perspectives meet real-world problems.',
    'STAIR', 'STAIR',
    '#D6C6FF', 'graduation-cap', true
  ),
  (
    'Regional Impact', 'Regional Impact',
    'regional-impact',
    'Arbeite an Lösungen mit direktem Nutzen für die Zentralschweiz und ihre Unternehmen, Institutionen und Menschen.',
    'Work on solutions with direct impact for Central Switzerland and its businesses, institutions, and people.',
    'SchwyzNext', 'SchwyzNext',
    '#7A1F83', 'mountain', true
  )
ON CONFLICT (slug) DO UPDATE
  SET name             = EXCLUDED.name,
      name_en          = EXCLUDED.name_en,
      description      = EXCLUDED.description,
      description_en   = EXCLUDED.description_en,
      partner_name     = EXCLUDED.partner_name,
      partner_name_en  = EXCLUDED.partner_name_en,
      color            = EXCLUDED.color,
      icon             = EXCLUDED.icon,
      is_active        = EXCLUDED.is_active;

INSERT INTO schedule_items (day, time, icon, title_de, title_en, description_de, description_en, sort_order) VALUES
  (1, '17:00', 'clock',        'Check-in',               'Check-in',              'Empfang und Registrierung',             'Welcome and registration',                10),
  (1, '18:00', 'presentation', 'Begrüssung',             'Welcome',               'Willkommen zum Zentral Hack',           'Welcome to Zentral Hack',                 20),
  (1, '18:30', 'presentation', 'Challenge Pitches',      'Challenge Pitches',     'Vorstellung der Challenges',            'Introduction to all challenges',          30),
  (1, '19:00', 'coffee',       'Teambildung & Apéro',    'Team Matching & Apéro', 'Finde dein Team bei Sponsoren-Apéro',  'Find your team during the sponsor apéro', 40),
  (1, '19:30', 'code',         'Start des Hacks',        'Hack Starts',           'Los geht''s!',                          'Let''s go!',                              50),
  (1, '20:00', 'utensils',     'Dinner Buffet',          'Dinner Buffet',         'Stärkung für die Nacht',               'Fuel up for the night',                   60),
  (1, '23:00', 'party-popper', 'Night Special',          'Night Special',         'Überraschung!',                        'Surprise!',                               70),
  (2, '08:00', 'coffee',       'Frühstücksbuffet',       'Breakfast Buffet',      'Energie für den Tag',                  'Energy for the day',                      10),
  (2, '10:00', 'presentation', 'Referate & Speeches',    'Talks & Speeches',      'Inspirierende Vorträge',               'Inspiring talks',                         20),
  (2, '12:00', 'utensils',     'Lunchbuffet',            'Lunch Buffet',          'Mittagspause',                         'Lunch break',                             30),
  (2, '16:00', 'coffee',       'Nachmittagssnack',       'Afternoon Snack',       'Letzte Energie',                       'Final energy boost',                      40),
  (2, '19:00', 'presentation', 'Abschlusspräsentationen','Final Presentations',   'Zeigt was ihr geschafft habt',         'Show what you have built',                50),
  (2, '22:00', 'party-popper', 'Ende & Preisverleihung', 'Closing & Awards',      'Feier mit uns!',                       'Celebrate with us!',                      60)
ON CONFLICT DO NOTHING;

INSERT INTO site_settings (key, value) VALUES (
  'about_stats',
  '[
    {"value": 24,  "suffix": "",  "label_de": "Stunden",        "label_en": "Hours"},
    {"value": 4,   "suffix": "",  "label_de": "Kategorien",     "label_en": "Categories"},
    {"value": 200, "suffix": "+", "label_de": "Teilnehmende",   "label_en": "Participants"},
    {"value": 1,   "suffix": "",  "label_de": "Ziel",           "label_en": "Goal"}
  ]'::jsonb
) ON CONFLICT (key) DO NOTHING;

INSERT INTO partner_logos (name, logo_url, website_url, logo_size, sort_order) VALUES
  ('HSLU',                         '/partners/hslu-logo.png',         'https://hslu.ch/informatik', 'large',  10),
  ('ICT Berufsbildung Zentralschweiz', '/partners/ict-bz-logo.png',  'https://ict-bz.ch',          'medium', 20),
  ('UMB AG',                       '/partners/umb-logo.png',          'https://umb.ch',             'medium', 30),
  ('Digital & AI Community',       '/partners/ai-community-logo.png', 'https://ai-community.ch',   'medium', 40),
  ('getAbstract',                  '/partners/getabstract-logo.png',  'https://getabstract.com',   'medium', 50),
  ('STAIR',                        '/partners/stair-logo.png',        'https://stair.ch',           'medium', 60),
  ('SchwyzNext',                   '/partners/schwyznext-logo.png',   'https://schwyz-next.ch',    'small',  70)
ON CONFLICT DO NOTHING;

INSERT INTO sponsor_packages (name, display_order, description, color, benefits) VALUES
  ('Platin', 1,
    'Das Platin-Paket ist die engste Partnerschaft mit dem Zentral Hack und kombiniert maximale Sichtbarkeit mit aktiver Mitgestaltung.',
    '#530A5D', ARRAY[
      'Beteiligung an Organisation und Mitgestaltung der Eventplanung',
      'Lead-Partner einer Kategorie mit starker inhaltlicher Präsenz',
      'Prominentes Branding auf Website, Event-Plattform, Flyer, Give-aways und Social Media',
      'Sponsor-Porträt auf Social Media sowie zusätzliche Sichtbarkeit auf dem HSLU-Moodboard',
      'Grosse Präsenzfläche vor Ort inklusive Werbemittel, LED-Banner und Recruiting-Möglichkeiten',
      'Offizielle Erwähnung während des Events sowie Zugang zu Networking mit Jury, Departement und Talenten'
    ]
  ),
  ('Gold', 2,
    'Das Gold-Paket sorgt für eine starke Event-Präsenz mit hochwertigem Branding, Aktivierung vor Ort und direktem Austausch.',
    '#E6FF17', ARRAY[
      'Branding auf Website, Event-Plattform, Flyer und Social Media',
      'Sponsor-Porträt auf Social Media und zusätzliche Sichtbarkeit über ausgewählte Eventflächen',
      'LED-Banner-Präsenz und Einbindung in Give-away-Aktivierungen',
      'Präsenzfläche vor Ort für Austausch, Interaktion und Markeninszenierung',
      'Möglichkeit zur Platzierung eigener Werbemittel am Event',
      'Direkter Zugang zu Apéro, Networking und Recruiting im Eventumfeld'
    ]
  ),
  ('Silber', 3,
    'Das Silber-Paket bietet eine ausgewogene Mischung aus Sichtbarkeit, Event-Präsenz und wertvollen Kontaktpunkten.',
    '#C0C0C0', ARRAY[
      'Sichtbarkeit auf Website, Event-Plattform und ausgewählten Eventmedien',
      'Branding in Social-Media-Kommunikation und auf Sponsor-Übersichten',
      'Präsenz vor Ort mit kompakten Werbe- und Aktivierungsmöglichkeiten',
      'Einbindung in zentrale Eventmomente und Sponsorennennung',
      'Möglichkeit zur Platzierung eigener Werbemittel',
      'Zugang zu Networking mit Teilnehmenden und Partnern'
    ]
  ),
  ('Bronze', 4,
    'Das Bronze-Paket ist der kompakte Einstieg in das Sponsoring des Zentral Hack mit klarem, fokussiertem Auftritt.',
    '#CD7F32', ARRAY[
      'Branding auf Website und Event-Plattform',
      'Präsenz auf ausgewählten Kommunikations- und Übersichtsflächen',
      'Kompakte Sichtbarkeit vor Ort während des Events',
      'Möglichkeit zur Platzierung von Werbematerial im Rahmen des Events',
      'Einbindung in Sponsorennennung und Eventkommunikation',
      'Niederschwelliger Zugang zum Sponsoring-Netzwerk des Zentral Hack'
    ]
  )
ON CONFLICT (name) DO UPDATE
  SET display_order = EXCLUDED.display_order,
      description   = EXCLUDED.description,
      color         = EXCLUDED.color,
      benefits      = EXCLUDED.benefits;

INSERT INTO faqs (question, question_en, answer, answer_en, order_position, is_active) VALUES
  ('Was ist der Zentral Hack?', 'What is Zentral Hack?',
    'Der Zentral Hack 2026 ist der grösste Hackathon der Zentralschweiz. 48 Stunden, in denen Studierende, Fachleute und Kreative zusammenkommen, um innovative Lösungen für reale Herausforderungen zu entwickeln.',
    'Zentral Hack 2026 is the largest hackathon in Central Switzerland. A 48-hour event where students, professionals, and creatives come together to build innovative solutions for real-world challenges.',
    1, true),
  ('Wer kann teilnehmen?', 'Who can participate?',
    'Alle sind willkommen! Ob Studierende, Berufstätige oder einfach technikbegeistert – jede:r kann sich registrieren und mitmachen.',
    'Everyone is welcome. Whether you are a student, professional, or simply excited about technology, you can sign up and join.',
    2, true),
  ('Brauche ich ein Team?', 'Do I need a team?',
    'Nein, du kannst dich auch alleine registrieren. Wir helfen dir, ein passendes Team zu finden. Alternativ kannst du auch bereits mit einem Team kommen.',
    'No. You can also register on your own. We can help you find a suitable team, or you can join with your existing team.',
    3, true),
  ('Brauche ich Vorkenntnisse?', 'Do I need prior experience?',
    'Grundlegende Programmierkenntnisse sind hilfreich, aber nicht zwingend. Es gibt Kategorien für verschiedene Erfahrungsstufen.',
    'Basic programming experience is helpful, but not required. There are challenge categories for different experience levels.',
    4, true),
  ('Gibt es Verpflegung?', 'Will food and drinks be provided?',
    'Ja! Während des gesamten Events gibt es Mahlzeiten, Snacks und Getränke. Bitte gib bei der Anmeldung Allergien und Unverträglichkeiten an.',
    'Yes. Meals, snacks, and drinks are provided throughout the event. Please include allergies and intolerances during registration.',
    5, true),
  ('Wo findet der Hackathon statt?', 'Where does the hackathon take place?',
    'Der Zentral Hack findet an der Hochschule Luzern (HSLU) statt. Der genaue Standort wird nach der Anmeldung bekannt gegeben.',
    'Zentral Hack takes place at Lucerne University of Applied Sciences and Arts (HSLU). The exact location is shared after registration.',
    6, true),
  ('Wie kann ich mich registrieren?', 'How can I register?',
    'Klicke einfach auf "Registrieren" und folge den Anweisungen. Du erhältst eine Bestätigungsemail mit allen Details.',
    'Click "Register now" and follow the instructions. You will receive a confirmation email with all details.',
    7, true)
ON CONFLICT DO NOTHING;
