-- Migration: Add faqs table for admin-managed FAQ entries
-- Run this against your PostgreSQL database

CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  question_en TEXT,
  answer TEXT NOT NULL,
  answer_en TEXT,
  order_position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faqs_order ON faqs(order_position);

-- Seed with default FAQs
INSERT INTO faqs (question, question_en, answer, answer_en, order_position, is_active) VALUES
  ('Was ist der Zentral Hack?', 'What is Zentral Hack?', 'Der Zentral Hack 2026 ist der grösste Hackathon der Zentralschweiz. 48 Stunden, in denen Studierende, Fachleute und Kreative zusammenkommen, um innovative Lösungen für reale Herausforderungen zu entwickeln.', 'Zentral Hack 2026 is the largest hackathon in Central Switzerland. A 48-hour event where students, professionals, and creatives come together to build innovative solutions for real-world challenges.', 1, true),
  ('Wer kann teilnehmen?', 'Who can participate?', 'Alle sind willkommen! Ob Studierende, Berufstätige oder einfach technikbegeistert – jede:r kann sich registrieren und mitmachen.', 'Everyone is welcome. Whether you are a student, professional, or simply excited about technology, you can sign up and join.', 2, true),
  ('Brauche ich ein Team?', 'Do I need a team?', 'Nein, du kannst dich auch alleine registrieren. Wir helfen dir, ein passendes Team zu finden. Alternativ kannst du auch bereits mit einem Team kommen.', 'No. You can also register on your own. We can help you find a suitable team, or you can join with your existing team.', 3, true),
  ('Brauche ich Vorkenntnisse?', 'Do I need prior experience?', 'Grundlegende Programmierkenntnisse sind hilfreich, aber nicht zwingend. Es gibt Kategorien für verschiedene Erfahrungsstufen.', 'Basic programming experience is helpful, but not required. There are challenge categories for different experience levels.', 4, true),
  ('Gibt es Verpflegung?', 'Will food and drinks be provided?', 'Ja! Während des gesamten Events gibt es Mahlzeiten, Snacks und Getränke. Bitte gib bei der Anmeldung Allergien und Unverträglichkeiten an.', 'Yes. Meals, snacks, and drinks are provided throughout the event. Please include allergies and intolerances during registration.', 5, true),
  ('Wo findet der Hackathon statt?', 'Where does the hackathon take place?', 'Der Zentral Hack findet an der Hochschule Luzern (HSLU) statt. Der genaue Standort wird nach der Anmeldung bekannt gegeben.', 'Zentral Hack takes place at Lucerne University of Applied Sciences and Arts (HSLU). The exact location is shared after registration.', 6, true),
  ('Wie kann ich mich registrieren?', 'How can I register?', 'Klicke einfach auf "Registrieren" und folge den Anweisungen. Du erhältst eine Bestätigungsemail mit allen Details.', 'Click "Register now" and follow the instructions. You will receive a confirmation email with all details.', 7, true)
ON CONFLICT DO NOTHING;
