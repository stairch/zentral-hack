-- Global switch whether participants may change their category themselves at all.
INSERT INTO site_settings (key, value)
VALUES ('category_change_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;
