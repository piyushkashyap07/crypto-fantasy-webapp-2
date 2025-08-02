-- First, check for existing duplicate team names
SELECT team_name, COUNT(*) as count, array_agg(user_uid) as users
FROM teams 
GROUP BY team_name 
HAVING COUNT(*) > 1;

-- If there are duplicates, rename them to make them unique
-- This will add the user_uid to duplicate team names
UPDATE teams 
SET team_name = team_name || '_' || user_uid 
WHERE team_name IN (
  SELECT team_name 
  FROM teams 
  GROUP BY team_name 
  HAVING COUNT(*) > 1
);

-- Drop the existing constraint if it exists
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_user_uid_team_name_key;

-- Add the global unique constraint for team names
ALTER TABLE teams ADD CONSTRAINT teams_team_name_unique UNIQUE (team_name);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_teams_team_name ON teams(team_name);

-- Verify the constraint is working
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'teams' AND constraint_type = 'UNIQUE';
