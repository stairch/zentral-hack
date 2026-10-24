-- Winner photo per challenge on the post-event landing page. Teams without a challenge are ranked per category,
-- so challenge_id stays NULL for those. Photos with a category are kept out of the gallery.
ALTER TABLE event_photos
  ADD COLUMN IF NOT EXISTS category_id  UUID REFERENCES categories(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS challenge_id UUID REFERENCES sponsor_challenges(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_event_photos_winner
  ON event_photos (category_id, COALESCE(challenge_id, '00000000-0000-0000-0000-000000000000'::uuid))
  WHERE category_id IS NOT NULL;
