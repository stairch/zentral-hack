-- Migration: Add email_templates table for saving custom email templates
-- Run this against your PostgreSQL database

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  base_template_id TEXT NOT NULL DEFAULT 'standard',
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  cta_text TEXT,
  cta_url TEXT,
  footer_note TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_created_by ON email_templates(created_by);

-- Add newsletter_subscribers to campaign_type check constraint if not already there
-- (safe to run multiple times)
DO $$
BEGIN
  ALTER TABLE email_campaigns DROP CONSTRAINT IF EXISTS email_campaigns_campaign_type_check;
  ALTER TABLE email_campaigns ADD CONSTRAINT email_campaigns_campaign_type_check
    CHECK (campaign_type IN ('participants', 'central_updates', 'newsletter_subscribers'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;
