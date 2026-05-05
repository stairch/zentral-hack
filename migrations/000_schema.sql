-- =============================================================================
-- Zentral Hack — GO LIVE v1.0.0 Database Schema
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_users_category_id'
    AND table_name = 'users'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT fk_users_category_id
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
  END IF;
END $$;

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
