-- Event photos are stored as a compressed WebP (image_url) plus a small preview for grids (thumbnail_url).
-- Photos uploaded before this have no preview and fall back to image_url.
ALTER TABLE event_photos
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
