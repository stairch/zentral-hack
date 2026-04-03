-- Migration: weekly updates opt-out without removing other email categories

ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS weekly_updates_subscribed BOOLEAN DEFAULT true;

ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE newsletter_subscribers
SET weekly_updates_subscribed = true
WHERE weekly_updates_subscribed IS NULL;
