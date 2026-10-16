-- Category partners and admins can publish the full challenge information to participants
-- who chose the challenge, independently of the challenge being visible on the website.
ALTER TABLE sponsor_challenges
    ADD COLUMN IF NOT EXISTS info_published BOOLEAN NOT NULL DEFAULT false;
