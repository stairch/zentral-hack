-- Category-scoped announcements: NULL category_id means a global announcement
-- visible to everyone, a set category_id scopes it to that category only.
ALTER TABLE announcements
    ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_announcements_category_id ON announcements(category_id);
