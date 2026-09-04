-- Admin-controlled ordering for categories on the landing page.
ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

-- Seed the initial order from the previously hardcoded categoryDisplayOrder list.
UPDATE categories SET display_order = 1 WHERE slug = 'young-talents'    AND display_order = 0;
UPDATE categories SET display_order = 2 WHERE slug = 'ai-agentic'       AND display_order = 0;
UPDATE categories SET display_order = 3 WHERE slug = 'campus-challenge' AND display_order = 0;
UPDATE categories SET display_order = 4 WHERE slug = 'regional-impact'  AND display_order = 0;

-- Give any remaining categories a stable, non-zero order after the seeded ones.
WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, name) + 100 AS rn
    FROM categories
    WHERE display_order = 0
)
UPDATE categories c SET display_order = ranked.rn
FROM ranked WHERE ranked.id = c.id;

CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- Landing page category card layout: "standard" (uniform 2-column grid) or "bento" (asymmetric).
INSERT INTO site_settings (key, value)
VALUES ('categories_layout', '"standard"'::jsonb)
ON CONFLICT (key) DO NOTHING;
