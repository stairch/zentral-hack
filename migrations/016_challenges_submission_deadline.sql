-- Category partners and admins can set a submission deadline per challenge.
-- Participants accepted for the challenge see a countdown banner in their dashboard.
ALTER TABLE sponsor_challenges
    ADD COLUMN IF NOT EXISTS submission_deadline TIMESTAMPTZ;
