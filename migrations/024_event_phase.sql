-- Switch between the live event and the locked post-event platform. Texts fall back to defaults in lib/event-phase.ts.
INSERT INTO site_settings (key, value)
VALUES ('event_phase', '{"phase": "live"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
