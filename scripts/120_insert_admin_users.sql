-- Script zum Anlegen von Admin-Test-Usern für Zentral Hack
-- Passwort für alle User: Test1234
-- Bcrypt-Hash: $2b$12$kAO8N/PlYgPvQwvRCjp7..KpsvWWjGhAUB9p5b8oJfCJGYo0WXcG.

-- Super-Admin User
INSERT INTO users (email, password_hash, role, created_at) 
VALUES (
  'admin@zentral-hack.ch', 
  '$2b$12$kAO8N/PlYgPvQwvRCjp7..KpsvWWjGhAUB9p5b8oJfCJGYo0WXcG.', 
  'admin', 
  NOW()
)
ON CONFLICT (email) DO UPDATE SET 
  password_hash = '$2b$12$kAO8N/PlYgPvQwvRCjp7..KpsvWWjGhAUB9p5b8oJfCJGYo0WXcG.',
  role = 'admin';

-- Category-Partner Users (einer pro Kategorie)
INSERT INTO users (email, password_hash, role, category_id, created_at)
SELECT 
  LOWER(REPLACE(c.name, ' ', '_')) || '@zentral-hack.ch' as email,
  '$2b$12$kAO8N/PlYgPvQwvRCjp7..KpsvWWjGhAUB9p5b8oJfCJGYo0WXcG.' as password_hash,
  'category_partner' as role,
  c.id as category_id,
  NOW() as created_at
FROM categories c
ON CONFLICT (email) DO UPDATE SET 
  password_hash = '$2b$12$kAO8N/PlYgPvQwvRCjp7..KpsvWWjGhAUB9p5b8oJfCJGYo0WXcG.',
  role = 'category_partner',
  category_id = EXCLUDED.category_id;

-- ✅ Bestätigung - alle angelegten Admin-User anzeigen
SELECT 
  id,
  email, 
  role, 
  category_id,
  created_at
FROM users 
WHERE role IN ('admin', 'category_partner') 
ORDER BY role DESC, created_at DESC;
