ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS partner_name TEXT,
  ADD COLUMN IF NOT EXISTS color VARCHAR(7),
  ADD COLUMN IF NOT EXISTS icon VARCHAR(50);

UPDATE categories
SET
  partner_name = CASE slug
    WHEN 'young-talents' THEN 'ICT Berufsbildung Zentralschweiz & UMB AG'
    WHEN 'ai-agentic' THEN 'ICT Berufsbildung Zentralschweiz, Digital & AI Community & getAbstract'
    WHEN 'campus-challenge' THEN 'STAIR'
    WHEN 'regional-impact' THEN 'SchwyzNext'
    ELSE COALESCE(partner_name, 'Partner folgt')
  END,
  color = CASE slug
    WHEN 'young-talents' THEN '#E6FF17'
    WHEN 'ai-agentic' THEN '#530A5D'
    WHEN 'campus-challenge' THEN '#D6C6FF'
    WHEN 'regional-impact' THEN '#7A1F83'
    ELSE COALESCE(color, '#530A5D')
  END,
  icon = CASE slug
    WHEN 'young-talents' THEN 'sparkles'
    WHEN 'ai-agentic' THEN 'brain'
    WHEN 'campus-challenge' THEN 'graduation-cap'
    WHEN 'regional-impact' THEN 'mountain'
    ELSE COALESCE(icon, 'sparkles')
  END
WHERE slug IN ('young-talents', 'ai-agentic', 'campus-challenge', 'regional-impact');