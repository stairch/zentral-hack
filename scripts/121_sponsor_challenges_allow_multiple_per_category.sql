-- Allow multiple sponsor challenges per category and remove stale unique constraints/indexes.

DO $$
DECLARE
  constraint_row RECORD;
BEGIN
  FOR constraint_row IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'sponsor_challenges'::regclass
      AND contype = 'u'
      AND pg_get_constraintdef(oid) ILIKE '%(category_id)%'
  LOOP
    EXECUTE format('ALTER TABLE sponsor_challenges DROP CONSTRAINT %I', constraint_row.conname);
  END LOOP;
END
$$;

DROP INDEX IF EXISTS idx_sponsor_challenges_category_unique;
CREATE INDEX IF NOT EXISTS idx_sponsor_challenges_category_id ON sponsor_challenges(category_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_challenges_user_id ON sponsor_challenges(user_id);
