-- Migration: Add faqs table for admin-managed FAQ entries
-- Run this against your PostgreSQL database

CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faqs_order ON faqs(order_position);

-- Seed with default FAQs
INSERT INTO faqs (question, answer, order_position, is_active) VALUES
  ('Was ist der Zentral Hack?', 'Der Zentral Hack 2026 ist der grösste Hackathon der Zentralschweiz. 48 Stunden, in denen Studierende, Fachleute und Kreative zusammenkommen, um innovative Lösungen für reale Herausforderungen zu entwickeln.', 1, true),
  ('Wer kann teilnehmen?', 'Alle sind willkommen! Ob Studierende, Berufstätige oder einfach technikbegeistert – jede:r kann sich anmelden und mitmachen.', 2, true),
  ('Brauche ich ein Team?', 'Nein, du kannst dich auch alleine anmelden. Wir helfen dir, ein passendes Team zu finden. Alternativ kannst du auch bereits mit einem Team kommen.', 3, true),
  ('Brauche ich Vorkenntnisse?', 'Grundlegende Programmierkenntnisse sind hilfreich, aber nicht zwingend. Es gibt Kategorien für verschiedene Erfahrungsstufen.', 4, true),
  ('Gibt es Verpflegung?', 'Ja! Während des gesamten Events gibt es Mahlzeiten, Snacks und Getränke. Bitte gib bei der Anmeldung Allergien und Unverträglichkeiten an.', 5, true),
  ('Wo findet der Hackathon statt?', 'Der Zentral Hack findet an der Hochschule Luzern (HSLU) statt. Der genaue Standort wird nach der Anmeldung bekannt gegeben.', 6, true),
  ('Wie kann ich mich anmelden?', 'Klicke einfach auf "Jetzt Anmelden" und folge den Anweisungen. Du erhältst eine Bestätigungsemail mit allen Details.', 7, true)
ON CONFLICT DO NOTHING;
